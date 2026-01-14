/**
 * Sync Configuration for Desktop App
 * 
 * This file allows the desktop app to sync with a remote server.
 * Configure the REMOTE_API_URL to point to your deployed webapp.
 */

// In desktop mode, this should be set to your deployed webapp URL
// e.g., "https://colortouch-crm.vercel.app" or your custom domain
export const SYNC_CONFIG = {
  // Remote API URL - set this to your deployed webapp's URL
  // Leave empty to use local API only (no remote sync)
  remoteApiUrl: process.env.REMOTE_API_URL || process.env.NEXT_PUBLIC_REMOTE_API_URL || '',
  
  // Sync interval in milliseconds (default: 5 minutes)
  syncInterval: 5 * 60 * 1000,
  
  // Max retry attempts for failed sync
  maxRetries: 3,
  
  // Enable/disable auto-sync
  autoSyncEnabled: true,
  
  // Sync on startup delay (ms)
  startupDelay: 5000,
};

/**
 * Get the sync API endpoint
 * Returns remote URL if configured, otherwise local
 */
export function getSyncEndpoint(path: string): string {
  if (SYNC_CONFIG.remoteApiUrl) {
    return `${SYNC_CONFIG.remoteApiUrl}${path}`;
  }
  return path; // Use local API
}

/**
 * Check if remote sync is enabled
 */
export function isRemoteSyncEnabled(): boolean {
  return !!SYNC_CONFIG.remoteApiUrl;
}

/**
 * Check if running in desktop mode
 */
export function isDesktopMode(): boolean {
  if (typeof window === 'undefined') {
    return process.env.DESKTOP_MODE === 'true';
  }
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
}
