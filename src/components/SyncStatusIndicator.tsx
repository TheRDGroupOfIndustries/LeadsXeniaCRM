'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { syncService } from '@/lib/syncService';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

export function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [pendingCounts, setPendingCounts] = useState({ leads: 0, payments: 0, reminders: 0 });
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  
  // Use refs to track current state without re-running effects
  const isOnlineRef = useRef(isOnline);
  const syncingRef = useRef(syncing);
  
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);
  
  useEffect(() => {
    syncingRef.current = syncing;
  }, [syncing]);

  const checkStatus = useCallback(async () => {
    try {
      const count = await syncService.getQueueCount();
      const pending = await syncService.getPendingCount();
      setQueueCount(count);
      setPendingCounts(pending);
    } catch (error) {
      console.error('Error checking sync status:', error);
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (!isOnlineRef.current || syncingRef.current) return;

    setSyncing(true);
    try {
      const result = await syncService.triggerSync();
      setLastSyncResult(result);
      await checkStatus();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  }, [checkStatus]);

  useEffect(() => {
    setMounted(true);
    
    // Initial status check (only once)
    checkStatus();

    // Listen to online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Don't auto-sync on online event - user can manually trigger
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic status check (every 60 seconds - not sync, just status)
    const interval = setInterval(() => {
      checkStatus();
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []); // Empty dependency array - only run once

  // Don't render on server
  if (!mounted) return null;

  const totalPending = pendingCounts.leads + pendingCounts.payments + pendingCounts.reminders;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0"
        >
          {isOnline ? (
            syncing ? (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            ) : totalPending > 0 ? (
              <Cloud className="h-4 w-4 text-orange-500" />
            ) : (
              <Wifi className="h-4 w-4 text-green-500" />
            )
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          
          {totalPending > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {totalPending > 9 ? '9+' : totalPending}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Sync Status</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={triggerSync}
              disabled={!isOnline || syncing}
              className="h-7"
            >
              {syncing ? (
                <>
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Sync Now
                </>
              )}
            </Button>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">Offline</span>
              </>
            )}
          </div>

          {/* Pending Changes */}
          {totalPending > 0 && (
            <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3 space-y-2">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {totalPending} pending {totalPending === 1 ? 'change' : 'changes'}
                </span>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                {pendingCounts.leads > 0 && (
                  <div>• {pendingCounts.leads} lead{pendingCounts.leads !== 1 ? 's' : ''}</div>
                )}
                {pendingCounts.payments > 0 && (
                  <div>• {pendingCounts.payments} payment{pendingCounts.payments !== 1 ? 's' : ''}</div>
                )}
                {pendingCounts.reminders > 0 && (
                  <div>• {pendingCounts.reminders} reminder{pendingCounts.reminders !== 1 ? 's' : ''}</div>
                )}
              </div>

              {!isOnline && (
                <p className="text-xs text-muted-foreground">
                  Will sync automatically when online
                </p>
              )}
            </div>
          )}

          {/* Queue Status */}
          {queueCount > 0 && (
            <div className="text-sm text-muted-foreground">
              {queueCount} {queueCount === 1 ? 'item' : 'items'} in sync queue
            </div>
          )}

          {/* Last Sync Result */}
          {lastSyncResult && (
            <div className="text-xs space-y-1 text-muted-foreground border-t pt-3">
              <div className="font-medium">Last Sync:</div>
              {lastSyncResult.synced > 0 && (
                <div className="text-green-600 dark:text-green-400">
                  ✓ {lastSyncResult.synced} synced
                </div>
              )}
              {lastSyncResult.failed > 0 && (
                <div className="text-red-600 dark:text-red-400">
                  ✗ {lastSyncResult.failed} failed
                </div>
              )}
              {lastSyncResult.conflicts > 0 && (
                <div className="text-orange-600 dark:text-orange-400">
                  ⚠ {lastSyncResult.conflicts} conflicts
                </div>
              )}
            </div>
          )}

          {/* Status Message */}
          {totalPending === 0 && isOnline && (
            <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              All changes synced
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
