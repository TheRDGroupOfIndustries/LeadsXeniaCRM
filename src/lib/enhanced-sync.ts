/**
 * Enhanced Sync System for Offline-First Desktop App
 * 
 * This module provides a robust offline-first synchronization system
 * with conflict resolution, queue management, and real-time updates.
 */

import prisma from './prisma';

export interface SyncQueueItem {
  id?: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  model: 'Lead' | 'Payment' | 'Reminder' | 'WhatsappCampaign';
  recordId: string;
  data: any;
  userId: string;
  retryCount?: number;
  error?: string;
  createdAt?: Date;
}

export interface SyncStats {
  isOnline: boolean;
  lastSyncAt: Date | null;
  pendingCount: number;
  syncedToday: number;
  failedToday: number;
  queueItems: SyncQueueItem[];
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: number;
  errors: string[];
}

/**
 * Enhanced Sync Service with Database-backed Queue
 */
export class EnhancedSyncService {
  private isOnline: boolean = false;
  private syncInProgress: boolean = false;
  private maxRetries: number = 3;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.checkOnlineStatus();
    this.startAutoSync();
  }

  /**
   * Check online status
   */
  async checkOnlineStatus(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000),
      });
      this.isOnline = response.ok;
    } catch {
      this.isOnline = false;
    }
    return this.isOnline;
  }

  /**
   * Add item to sync queue (database-backed)
   */
  async addToQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt'>): Promise<void> {
    try {
      await prisma.syncQueue.create({
        data: {
          operation: item.operation,
          model: item.model,
          recordId: item.recordId,
          data: JSON.stringify(item.data),
          userId: item.userId,
          retryCount: 0,
        },
      });

      console.log(`✅ Added ${item.operation} ${item.model} to sync queue`);

      // Try to sync immediately if online
      if (this.isOnline && !this.syncInProgress) {
        await this.sync();
      }
    } catch (error: any) {
      console.error('❌ Error adding to sync queue:', error);
      throw error;
    }
  }

  /**
   * Main sync function
   */
  async sync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress, skipping...');
      return { success: false, synced: 0, failed: 0, conflicts: 0, errors: ['Sync in progress'] };
    }

    const isOnline = await this.checkOnlineStatus();
    if (!isOnline) {
      console.log('📡 Offline - sync skipped');
      return { success: false, synced: 0, failed: 0, conflicts: 0, errors: ['Offline'] };
    }

    this.syncInProgress = true;
    let synced = 0;
    let failed = 0;
    let conflicts = 0;
    const errors: string[] = [];

    try {
      console.log('🔄 Starting sync...');

      // Get all pending items from queue
      const queueItems = await prisma.syncQueue.findMany({
        where: {
          syncedAt: null,
          retryCount: { lt: this.maxRetries },
        },
        orderBy: { createdAt: 'asc' },
        take: 50, // Process in batches
      });

      console.log(`📋 Found ${queueItems.length} items to sync`);

      for (const item of queueItems) {
        try {
          const result = await this.syncItem(item);

          if (result.success) {
            // Mark as synced
            await prisma.syncQueue.update({
              where: { id: item.id },
              data: { syncedAt: new Date() },
            });
            synced++;
            console.log(`✅ Synced ${item.operation} ${item.model} (${item.recordId})`);
          } else if (result.conflict) {
            conflicts++;
            errors.push(`Conflict: ${item.model} ${item.recordId}`);
            console.log(`⚠️ Conflict: ${item.model} ${item.recordId}`);
          } else {
            // Increment retry count
            await prisma.syncQueue.update({
              where: { id: item.id },
              data: {
                retryCount: item.retryCount + 1,
                error: result.error || 'Unknown error',
              },
            });
            failed++;
            errors.push(result.error || 'Unknown error');
            console.log(`❌ Failed: ${item.model} ${item.recordId} - ${result.error}`);
          }
        } catch (error: any) {
          failed++;
          errors.push(error.message);
          console.error(`❌ Error syncing item:`, error);
        }

        // Small delay between items to avoid overwhelming the server
        await this.delay(100);
      }

      // Pull changes from server
      await this.pullFromServer();

      console.log(`✅ Sync complete: ${synced} synced, ${failed} failed, ${conflicts} conflicts`);
    } catch (error: any) {
      console.error('❌ Sync process error:', error);
      errors.push(error.message);
    } finally {
      this.syncInProgress = false;
    }

    return { success: true, synced, failed, conflicts, errors };
  }

  /**
   * Sync individual item to server
   */
  private async syncItem(item: any): Promise<{
    success: boolean;
    conflict?: boolean;
    error?: string;
  }> {
    try {
      const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;

      const response = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: item.operation,
          model: item.model,
          recordId: item.recordId,
          data: data,
          userId: item.userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.conflict) {
          return { success: false, conflict: true };
        }
        return { success: false, error: error.message || `HTTP ${response.status}` };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Pull changes from server
   */
  private async pullFromServer(): Promise<void> {
    try {
      const response = await fetch('/api/sync/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        console.log('🔒 Not authenticated - skipping pull');
        return;
      }

      if (!response.ok) {
        console.error('❌ Failed to pull from server:', response.status);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.log('⚠️ Non-JSON response, skipping pull');
        return;
      }

      const { changes } = await response.json();
      console.log(`📥 Pulled ${changes?.length || 0} changes from server`);

      // Changes are applied by the API route directly to the database
    } catch (error: any) {
      console.error('❌ Error pulling from server:', error);
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<SyncStats> {
    const isOnline = await this.checkOnlineStatus();

    // Get pending items
    const queueItems = await prisma.syncQueue.findMany({
      where: { syncedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    // Get last sync time
    const lastSynced = await prisma.syncQueue.findFirst({
      where: { syncedAt: { not: null } },
      orderBy: { syncedAt: 'desc' },
      select: { syncedAt: true },
    });

    // Get today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const syncedToday = await prisma.syncQueue.count({
      where: {
        syncedAt: { gte: todayStart, not: null },
      },
    });

    const failedToday = await prisma.syncQueue.count({
      where: {
        createdAt: { gte: todayStart },
        retryCount: { gte: this.maxRetries },
        syncedAt: null,
      },
    });

    return {
      isOnline,
      lastSyncAt: lastSynced?.syncedAt || null,
      pendingCount: queueItems.length,
      syncedToday,
      failedToday,
      queueItems: queueItems.map((item) => ({
        id: item.id,
        operation: item.operation as any,
        model: item.model as any,
        recordId: item.recordId,
        data: JSON.parse(item.data),
        userId: item.userId,
        retryCount: item.retryCount,
        error: item.error || undefined,
        createdAt: item.createdAt,
      })),
    };
  }

  /**
   * Clear synced items from queue
   */
  async clearSyncedItems(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.syncQueue.deleteMany({
      where: {
        syncedAt: { not: null, lt: cutoffDate },
      },
    });

    console.log(`🧹 Cleared ${result.count} synced items older than ${olderThanDays} days`);
    return result.count;
  }

  /**
   * Retry failed items
   */
  async retryFailed(): Promise<SyncResult> {
    // Reset retry count for failed items
    await prisma.syncQueue.updateMany({
      where: {
        syncedAt: null,
        retryCount: { gte: this.maxRetries },
      },
      data: { retryCount: 0, error: null },
    });

    // Trigger sync
    return await this.sync();
  }

  /**
   * Start auto-sync at interval
   */
  startAutoSync(intervalMinutes: number = 5): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    const intervalMs = intervalMinutes * 60 * 1000;
    this.syncInterval = setInterval(async () => {
      if (!this.syncInProgress && this.isOnline) {
        await this.sync();
      }
    }, intervalMs);

    console.log(`🔄 Auto-sync enabled (every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏸️ Auto-sync disabled');
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const enhancedSyncService = new EnhancedSyncService();
export default enhancedSyncService;
