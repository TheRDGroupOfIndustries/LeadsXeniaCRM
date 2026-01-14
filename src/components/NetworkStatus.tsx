"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Initial check - use browser's native navigator.onLine
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online!");
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You're offline. Changes will sync when online.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      toast.error("Cannot sync while offline");
      return;
    }

    setSyncing(true);
    try {
      // Placeholder for sync - implement actual sync logic as needed
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSync(new Date());
      toast.success("Data synced successfully");
    } catch (error: any) {
      toast.error(`Sync error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm ${
          isOnline
            ? "bg-green-500/20 border border-green-500/30 text-green-400"
            : "bg-red-500/20 border border-red-500/30 text-red-400"
        }`}
      >
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isOnline ? "Online" : "Offline"}
        </span>
        {isOnline && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="ml-2 p-1 rounded hover:bg-white/10 transition disabled:opacity-50"
            title="Sync now"
          >
            <RefreshCw
              className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
            />
          </button>
        )}
      </div>
      {lastSync && (
        <div className="text-xs text-gray-500 mt-1 text-right">
          Last sync: {lastSync.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
