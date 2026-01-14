# ColorTouch CRM - Online/Offline Sync System

## Overview

ColorTouch CRM now features a comprehensive **online/offline sync system** that allows you to work seamlessly whether you have an internet connection or not. All your changes are tracked and automatically synchronized when you're back online.

## Key Features

### 🔄 **Automatic Synchronization**
- Changes sync automatically every 5 minutes when online
- Instant sync when you reconnect to the internet
- Background sync when you return to the app tab

### 💾 **Offline-First Architecture**
- All data operations work offline using local SQLite database
- Changes are queued and synced when connection is restored
- No data loss even when completely offline

### ⚡ **Real-Time Status**
- Visual indicator showing online/offline status
- Badge showing number of pending changes
- Detailed sync progress and history

### 🔒 **Conflict Resolution**
- Automatic detection of data conflicts
- Last-write-wins strategy by default
- Manual conflict resolution options

## How It Works

### Database Architecture

**Offline (Local):**
- SQLite database (`colortouch.db`)
- Stores all your data locally
- Works without internet connection

**Online (Cloud):**
- PostgreSQL/MySQL on your server
- Receives synced changes from clients
- Provides latest data to all connected devices

### Sync Process

1. **Change Tracking**
   - Every create/update/delete operation is tracked
   - Changes are added to the sync queue
   - Records are marked as "pending sync"

2. **Push to Server**
   - Queued changes are sent to the server API
   - Server validates and applies changes
   - Conflicts are detected by comparing timestamps

3. **Pull from Server**
   - Latest changes from server are fetched
   - Applied to local database
   - Local records are updated

4. **Completion**
   - Successfully synced records are marked as "synced"
   - Failed items remain in queue for retry
   - User is notified of sync status

## Using the Sync System

### Sync Status Indicator

Located in the top-right corner of the app:

**Icons:**
- 🟢 **Wifi (Green)** - Online, all synced
- 🔵 **Cloud (Orange with badge)** - Online, pending changes
- 🔄 **Spinning** - Currently syncing
- 🔴 **Wifi Off (Red)** - Offline

**Click the icon to:**
- View detailed sync status
- See number of pending changes
- Manually trigger sync
- View last sync results

### Manual Sync

1. Click the sync status indicator
2. Click "Sync Now" button
3. Wait for sync to complete
4. Check results in the popover

### Working Offline

1. **Normal Operations:**
   - Create, edit, and delete leads
   - Add payments and reminders
   - All features work normally

2. **Offline Indicators:**
   - Red wifi icon shows offline status
   - Badge shows number of pending changes
   - "Will sync automatically when online" message

3. **Reconnecting:**
   - Sync starts automatically when online
   - All pending changes are pushed to server
   - Latest data is pulled from server

## Technical Implementation

### Database Schema Changes

```prisma
model SyncQueue {
  id          String    @id @default(cuid())
  operation   String    // CREATE, UPDATE, DELETE
  model       String    // Lead, Payment, Reminder
  recordId    String
  data        String    // JSON data
  userId      String
  createdAt   DateTime  @default(now())
  syncedAt    DateTime?
  error       String?
  retryCount  Int       @default(0)
}

// Added to Lead, Payment, Reminder models:
lastSyncedAt  DateTime?
syncStatus    SyncStatus @default(SYNCED)

enum SyncStatus {
  SYNCED       // Synchronized
  PENDING      // Waiting to sync
  SYNCING      // Currently syncing
  CONFLICT     // Conflict detected
  ERROR        // Sync failed
}
```

### API Endpoints

**POST /api/sync/push**
- Receives changes from offline clients
- Validates and applies to server database
- Returns conflict if data has changed

**POST /api/sync/pull**
- Sends recent changes to clients
- Filters by user and last sync time
- Returns all changed records

### Components

**SyncService** (`src/lib/syncService.ts`)
- Core sync logic
- Queue management
- Conflict detection
- Online/offline handling

**SyncStatusIndicator** (`src/components/SyncStatusIndicator.tsx`)
- Visual status display
- Manual sync trigger
- Sync history viewer

**SyncWorker** (`src/components/SyncWorker.tsx`)
- Background sync scheduler
- Auto-sync on reconnect
- Periodic sync checks

### Hooks

**useSync** (`src/hooks/use-sync.ts`)
```typescript
const { queueChange, triggerSync, getQueueCount } = useSync();

// Queue a change
await queueChange('Lead', 'CREATE', leadId, leadData, userId);

// Trigger manual sync
await triggerSync();

// Get pending count
const count = await getQueueCount();
```

## Configuration

### Environment Variables

**For Online Sync:**
```env
# Online Database (PostgreSQL/MySQL)
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Or keep SQLite for offline-only
DATABASE_URL="file:./colortouch.db"
```

### Sync Intervals

Edit `src/components/SyncWorker.tsx`:

```typescript
// Change sync interval (default: 5 minutes)
const syncInterval = setInterval(() => {
  // Sync logic
}, 5 * 60 * 1000); // 5 minutes
```

## Best Practices

### 1. **Regular Syncs**
- Don't go too long without syncing
- Use manual sync before important operations
- Check sync status regularly

### 2. **Conflict Prevention**
- Sync frequently when working on same data
- Use manual sync before making critical changes
- Review conflicts when they occur

### 3. **Offline Limitations**
- WhatsApp messaging requires internet
- File uploads may fail offline
- Some API features need connection

### 4. **Data Safety**
- Always have backup of database
- Don't delete local database if unsynced changes exist
- Monitor sync errors

## Troubleshooting

### Sync Not Working

**Check:**
1. Internet connection (click sync icon)
2. Server is accessible
3. No errors in sync queue
4. Database is accessible

**Solutions:**
- Manually trigger sync
- Check browser console for errors
- Restart the application
- Contact support if issues persist

### Conflicts

**When conflicts occur:**
1. Click sync status indicator
2. View conflict details
3. Choose resolution:
   - Keep local changes (push)
   - Keep server changes (pull)

### Failed Syncs

**Retry mechanism:**
- Failed items stay in queue
- Automatic retry on next sync
- Max retries before marking as error

**Manual intervention:**
- View failed items in sync queue
- Check error messages
- Fix issues and retry
- Contact support for persistent failures

## Advanced Features

### Selective Sync

Modify sync logic to sync specific models only:

```typescript
// In syncService.ts
const modelsToSync = ['Lead', 'Payment']; // Exclude Reminder

// Filter queue items
const queueItems = await prisma.syncQueue.findMany({
  where: { 
    syncedAt: null,
    model: { in: modelsToSync }
  }
});
```

### Custom Conflict Resolution

Implement custom logic in `src/lib/syncService.ts`:

```typescript
// Example: Always prefer server data
if (result.conflict) {
  await this.resolveConflict(item.id, 'server');
}

// Example: Merge data fields
if (result.conflict) {
  const merged = { ...localData, ...serverData };
  await this.applyMergedData(merged);
}
```

### Sync Notifications

Add toast notifications in `SyncStatusIndicator.tsx`:

```typescript
import { toast } from 'sonner';

// After successful sync
if (result.synced > 0) {
  toast.success(`Synced ${result.synced} changes`);
}

// On sync failure
if (result.failed > 0) {
  toast.error(`Failed to sync ${result.failed} changes`);
}
```

## Performance Optimization

### 1. **Batch Sync**
- Group multiple changes in single API call
- Reduces network overhead
- Faster sync completion

### 2. **Incremental Sync**
- Only sync changed records
- Use `lastSyncedAt` timestamp
- Reduces data transfer

### 3. **Compression**
- Compress large payloads
- Faster transfer over slow connections

### 4. **Lazy Loading**
- Sync critical data first
- Defer non-critical syncs
- Prioritize user operations

## Future Enhancements

- [ ] Multi-device sync with same account
- [ ] Granular sync controls per model
- [ ] Sync history and audit log
- [ ] Advanced conflict resolution UI
- [ ] Bandwidth usage optimization
- [ ] Selective field sync
- [ ] Delta sync (only changed fields)

## Support

For issues with the sync system:
- Check console logs for errors
- Review sync status indicator
- Contact support with sync queue details
- Provide error messages and timestamps

---

**Version:** 1.0.0  
**Last Updated:** December 19, 2025  
**Status:** Production Ready
