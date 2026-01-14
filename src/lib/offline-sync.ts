// Offline-first sync manager for desktop app
import prisma from "./prisma";

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingChanges: number;
}

/**
 * Detect network connectivity
 */
export async function checkNetworkStatus(): Promise<boolean> {
  if (typeof window !== "undefined" && !window.navigator.onLine) {
    return false;
  }

  try {
    // Try to reach a reliable endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch("https://www.google.com/favicon.ico", {
      method: "HEAD",
      cache: "no-cache",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Check database connectivity (for PostgreSQL remote DB)
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  const isOnline = await checkNetworkStatus();
  
  // In a full implementation, track pending changes in a sync queue table
  // For now, return basic status
  return {
    isOnline,
    lastSync: null, // Track in localStorage or sync_status table
    pendingChanges: 0,
  };
}

/**
 * Sync local SQLite data to remote PostgreSQL
 * This is a simplified version - full implementation would need:
 * - Conflict resolution strategy
 * - Incremental sync (only changed records)
 * - Bidirectional sync
 * - Queue management for failed syncs
 */
export async function syncToRemote(): Promise<{
  success: boolean;
  syncedRecords: number;
  errors: string[];
}> {
  const isOnline = await checkNetworkStatus();
  
  if (!isOnline) {
    return {
      success: false,
      syncedRecords: 0,
      errors: ["Network unavailable"],
    };
  }

  const errors: string[] = [];
  let syncedRecords = 0;

  try {
    // Example: sync leads that have a 'pending_sync' flag
    // In full implementation, maintain a sync queue table
    
    // 1. Get pending changes (this would come from a sync queue)
    // 2. POST to remote API endpoint
    // 3. Mark as synced
    // 4. Handle conflicts
    
    console.log("Sync completed:", { syncedRecords });
    
    return {
      success: true,
      syncedRecords,
      errors,
    };
  } catch (error: any) {
    errors.push(error.message);
    return {
      success: false,
      syncedRecords,
      errors,
    };
  }
}

/**
 * Enable auto-sync when network becomes available
 */
export function enableAutoSync(onSyncComplete?: (result: any) => void) {
  if (typeof window === "undefined") return;

  // Listen for online event
  window.addEventListener("online", async () => {
    console.log("Network detected, starting sync...");
    const result = await syncToRemote();
    if (onSyncComplete) onSyncComplete(result);
  });

  // Periodic sync check (every 5 minutes)
  setInterval(async () => {
    const isOnline = await checkNetworkStatus();
    if (isOnline) {
      const result = await syncToRemote();
      if (onSyncComplete) onSyncComplete(result);
    }
  }, 5 * 60 * 1000);
}

/**
 * Store data locally and queue for sync
 */
export async function storeOffline<T>(
  table: string,
  data: T,
  action: "create" | "update" | "delete"
): Promise<void> {
  // Store in localStorage or IndexedDB for persistence
  // Add to sync queue
  
  const queue = JSON.parse(localStorage.getItem("sync_queue") || "[]");
  queue.push({
    table,
    data,
    action,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem("sync_queue", JSON.stringify(queue));
}
