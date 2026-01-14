'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface SyncStats {
  isOnline: boolean;
  lastSyncAt: Date | null;
  pendingCount: number;
  syncedToday: number;
  failedToday: number;
}

export function EnhancedSyncStatus() {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadStats = async () => {
    try {
      const response = await fetch('/api/sync/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to load sync stats:', error);
    }
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync/trigger', { method: 'POST' });
      if (response.ok) {
        await loadStats();
      }
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Loading sync status...</span>
      </div>
    );
  }

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 w-80 z-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {stats.isOnline ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          <h3 className="font-semibold text-gray-900">
            {stats.isOnline ? 'Online' : 'Offline'}
          </h3>
        </div>
        <button
          onClick={triggerSync}
          disabled={isSyncing || !stats.isOnline}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sync now"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.pendingCount}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.syncedToday}</div>
          <div className="text-xs text-gray-500">Synced</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.failedToday}</div>
          <div className="text-xs text-gray-500">Failed</div>
        </div>
      </div>

      {/* Last Sync */}
      <div className="text-xs text-gray-500 text-center">
        Last sync: {formatLastSync(stats.lastSyncAt)}
      </div>

      {/* Warning if pending */}
      {stats.pendingCount > 0 && !stats.isOnline && (
        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
          <strong>{stats.pendingCount}</strong> changes waiting to sync. 
          Connect to internet to synchronize.
        </div>
      )}

      {/* Error if failed */}
      {stats.failedToday > 0 && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <strong>{stats.failedToday}</strong> failed today. 
          <button 
            onClick={triggerSync}
            className="ml-1 underline hover:no-underline"
          >
            Retry now
          </button>
        </div>
      )}
    </div>
  );
}

export default EnhancedSyncStatus;
