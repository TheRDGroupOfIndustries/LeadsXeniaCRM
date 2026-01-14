interface SyncQueueItem {
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  model: string;
  recordId: string;
  data: any;
  userId: string;
}

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: number;
}

class SyncService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncInProgress: boolean = false;
  private syncQueue: SyncQueueItem[] = [];
  private listenersAdded: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Only add listeners once to prevent duplicate registrations
      if (!this.listenersAdded) {
        window.addEventListener('online', () => {
          this.isOnline = true;
          // Don't auto-trigger sync on online event - let SyncWorker handle it
        });
        window.addEventListener('offline', () => {
          this.isOnline = false;
        });
        this.listenersAdded = true;
      }
      
      // Load queue from localStorage
      this.loadQueue();
    }
  }

  /**
   * Load sync queue from localStorage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem('syncQueue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  }

  /**
   * Save sync queue to localStorage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  /**
   * Check if online
   */
  checkOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Add item to sync queue
   */
  async addToQueue(item: SyncQueueItem): Promise<void> {
    try {
      this.syncQueue.push(item);
      this.saveQueue();

      // Trigger sync if online
      if (this.isOnline) {
        this.triggerSync();
      }
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  /**
   * Trigger sync process
   */
  async triggerSync(): Promise<SyncResult> {
    if (!this.isOnline || this.syncInProgress) {
      return { success: false, synced: 0, failed: 0, conflicts: 0 };
    }

    this.syncInProgress = true;
    let synced = 0;
    let failed = 0;
    let conflicts = 0;

    try {
      // Get all pending items from queue
      const queueItems = [...this.syncQueue];

      for (let i = 0; i < queueItems.length; i++) {
        const item = queueItems[i];
        try {
          const result = await this.syncItem(item);
          
          if (result.success) {
            synced++;
            // Remove from queue
            this.syncQueue.splice(i, 1);
            this.saveQueue();
          } else if (result.conflict) {
            conflicts++;
          } else {
            failed++;
          }
        } catch (error: any) {
          failed++;
          console.error(`Error syncing item:`, error);
        }
      }

      // Pull changes from server
      await this.pullFromServer();

    } catch (error) {
      console.error('Sync process error:', error);
    } finally {
      this.syncInProgress = false;
    }

    return { success: true, synced, failed, conflicts };
  }

  /**
   * Sync individual item to server
   */
  private async syncItem(item: SyncQueueItem): Promise<{ success: boolean; conflict?: boolean; error?: string }> {
    try {
      const response = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: item.operation,
          model: item.model,
          recordId: item.recordId,
          data: item.data,
          userId: item.userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.conflict) {
          return { success: false, conflict: true };
        }
        return { success: false, error: error.message };
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

      // If unauthorized, just skip the pull silently
      if (response.status === 401) {
        console.log('Not authenticated - skipping pull');
        return;
      }

      if (!response.ok) {
        console.error('Failed to pull from server:', response.status);
        return;
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.log('Non-JSON response, skipping pull (likely redirected to login)');
        return;
      }

      const { changes } = await response.json();

      // Apply changes locally
      for (const change of changes) {
        await this.applyServerChange(change);
      }
    } catch (error) {
      console.error('Error pulling from server:', error);
    }
  }

  /**
   * Apply server change to local database
   */
  private async applyServerChange(change: any): Promise<void> {
    // Server changes will be handled by the server-side API
    // and reflected when the page refreshes or data is refetched
    console.log('Server change received:', change);
  }

  /**
   * Get sync queue count
   */
  async getQueueCount(): Promise<number> {
    return this.syncQueue.length;
  }

  /**
   * Get pending records count
   */
  async getPendingCount(): Promise<{ leads: number; payments: number; reminders: number }> {
    const leads = this.syncQueue.filter(item => item.model === 'Lead').length;
    const payments = this.syncQueue.filter(item => item.model === 'Payment').length;
    const reminders = this.syncQueue.filter(item => item.model === 'Reminder').length;

    return { leads, payments, reminders };
  }

  /**
   * Resolve conflict manually
   */
  async resolveConflict(index: number, resolution: 'local' | 'server'): Promise<void> {
    const item = this.syncQueue[index];
    if (!item) return;

    if (resolution === 'local') {
      // Force push local changes
      await this.syncItem(item);
      this.syncQueue.splice(index, 1);
      this.saveQueue();
    } else {
      // Discard local changes
      this.syncQueue.splice(index, 1);
      this.saveQueue();
    }
  }
}

export const syncService = new SyncService();
export default syncService;
