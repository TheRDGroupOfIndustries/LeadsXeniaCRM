import { syncService } from '@/lib/syncService';

/**
 * Hook to automatically queue database changes for sync
 */
export function useSync() {
  /**
   * Wrap create/update/delete operations to automatically queue for sync
   */
  const queueChange = async (
    model: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    recordId: string,
    data: any,
    userId: string
  ) => {
    await syncService.addToQueue({
      model,
      operation,
      recordId,
      data,
      userId,
    });
  };

  return {
    queueChange,
    triggerSync: () => syncService.triggerSync(),
    getQueueCount: () => syncService.getQueueCount(),
    getPendingCount: () => syncService.getPendingCount(),
    isOnline: syncService.checkOnline(),
  };
}
