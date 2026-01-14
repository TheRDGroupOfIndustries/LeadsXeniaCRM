'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { syncService } from '@/lib/syncService';
import { SYNC_CONFIG, isDesktopMode, isRemoteSyncEnabled } from '@/lib/sync-config';

/**
 * Background sync worker component
 * Handles automatic synchronization between local and remote databases
 */
export function SyncWorker() {
  const { data: session, status } = useSession();
  const syncedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Track online status
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when coming back online
      if (session && SYNC_CONFIG.autoSyncEnabled) {
        syncService.triggerSync().catch(console.error);
      }
    };
    
    const handleOffline = () => setIsOnline(false);
    
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [session]);

  useEffect(() => {
    // Only sync when user is authenticated
    if (status !== 'authenticated' || !session) {
      return;
    }

    // Initial sync after startup delay (one-time)
    if (!syncedRef.current) {
      syncedRef.current = true;
      
      const initialSyncTimeout = setTimeout(() => {
        if (typeof window !== 'undefined' && navigator.onLine && SYNC_CONFIG.autoSyncEnabled) {
          console.log('🔄 Initial sync triggered');
          syncService.triggerSync().catch(console.error);
        }
      }, SYNC_CONFIG.startupDelay);

      return () => clearTimeout(initialSyncTimeout);
    }

    // Set up periodic sync (only in desktop mode with remote sync enabled)
    if (isDesktopMode() && isRemoteSyncEnabled() && SYNC_CONFIG.autoSyncEnabled) {
      intervalRef.current = setInterval(() => {
        if (navigator.onLine) {
          console.log('🔄 Periodic sync triggered');
          syncService.triggerSync().catch(console.error);
        }
      }, SYNC_CONFIG.syncInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session, status]);

  return null; // This component doesn't render anything
}
