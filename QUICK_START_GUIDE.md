# Quick Start Guide: Twilio WhatsApp & Sync System

## ✅ What's Been Implemented

### 1. Twilio WhatsApp Integration
- Full WhatsApp messaging via Twilio API
- Support for multiple providers (Twilio, WhatsApp Business API, Whapi.cloud)
- Automatic phone number formatting
- Rate limiting and error handling
- Media message support

### 2. Enhanced Sync System
- Offline-first architecture
- Database-backed sync queue
- Automatic retry logic
- Conflict resolution
- Real-time sync status monitoring

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Twilio Credentials

1. Sign up at: https://www.twilio.com/try-twilio (Free $15 credit)
2. From Twilio Console dashboard, note:
   - **Account SID**: `ACxxxxxxxxxx...`
   - **Auth Token**: Click "Show" to reveal
3. Go to: **Messaging > Try it out > Send a WhatsApp message**
4. Note your sandbox number (e.g., `+14155238886`)
5. Join sandbox: Send the code from your WhatsApp to the sandbox number

### Step 2: Configure in ColorTouch CRM

**Option A: Via API** (Fastest)
```bash
curl -X POST http://localhost:3000/api/token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ACxxxxxxxx",
    "secret": "your_auth_token",
    "phoneNumber": "+14155238886",
    "provider": "twilio"
  }'
```

**Option B: Via UI**
1. Open ColorTouch CRM
2. Go to Settings > Integrations (or WhatsApp settings)
3. Select "Twilio" as provider
4. Enter credentials
5. Click "Save"

### Step 3: Test Message

1. **Add Test Lead**:
   - Go to Leads
   - Add lead with phone: `9876543210` (your WhatsApp number)

2. **Create Campaign**:
   - Go to WhatsApp Campaigns
   - Click "Create Campaign"
   - Enter name and message
   - **Set status to ACTIVE** ⚠️ (Important!)

3. **Send**:
   - Click "Send Campaign"
   - Check browser console (F12) for logs
   - Verify message on WhatsApp

---

## 📊 Sync System Usage

### Enable Sync in Your Code

Add to any Create/Update/Delete operation:

```typescript
import { enhancedSyncService } from '@/lib/enhanced-sync';

// After creating a record
await enhancedSyncService.addToQueue({
  operation: 'CREATE',
  model: 'Lead',
  recordId: newLead.id,
  data: newLead,
  userId: session.userId
});

// After updating
await enhancedSyncService.addToQueue({
  operation: 'UPDATE',
  model: 'Lead',
  recordId: lead.id,
  data: updatedLead,
  userId: session.userId
});

// After deleting
await enhancedSyncService.addToQueue({
  operation: 'DELETE',
  model: 'Lead',
  recordId: lead.id,
  data: { id: lead.id },
  userId: session.userId
});
```

### Add Sync Status to UI

Add to your main layout:

```typescript
import { EnhancedSyncStatus } from '@/components/EnhancedSyncStatus';

export default function Layout({ children }) {
  return (
    <div>
      {children}
      <EnhancedSyncStatus />
    </div>
  );
}
```

### Manual Sync Operations

```typescript
import { enhancedSyncService } from '@/lib/enhanced-sync';

// Trigger manual sync
const result = await enhancedSyncService.sync();
console.log(`Synced: ${result.synced}, Failed: ${result.failed}`);

// Get sync statistics
const stats = await enhancedSyncService.getSyncStats();
console.log(`Pending: ${stats.pendingCount}`);

// Retry failed items
await enhancedSyncService.retryFailed();

// Clear old synced items
await enhancedSyncService.clearSyncedItems(7); // older than 7 days
```

---

## 🔧 Configuration

### Environment Variables (.env)

```env
# Twilio (Optional - can be stored via UI)
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886

# Sync Configuration
AUTO_SYNC_ENABLED=true
SYNC_INTERVAL_MINUTES=5
```

### Auto-Sync Settings

```typescript
// In your app initialization
import { enhancedSyncService } from '@/lib/enhanced-sync';

// Start auto-sync every 5 minutes (default)
enhancedSyncService.startAutoSync(5);

// Or custom interval
enhancedSyncService.startAutoSync(10); // 10 minutes

// Stop auto-sync
enhancedSyncService.stopAutoSync();
```

---

## 📁 Files Overview

### Created Files:

1. **`src/lib/twilio-whatsapp.ts`**
   - Twilio service class
   - Phone number sanitization
   - Message sending logic
   - Rate limiting

2. **`src/lib/enhanced-sync.ts`**
   - Enhanced sync service
   - Queue management
   - Conflict resolution
   - Statistics tracking

3. **`src/components/EnhancedSyncStatus.tsx`**
   - Sync status UI component
   - Real-time updates
   - Manual sync trigger
   - Statistics display

4. **`src/app/api/sync/stats/route.ts`**
   - API endpoint for sync stats
   - Manual sync trigger endpoint

5. **`TWILIO_WHATSAPP_SETUP.md`**
   - Detailed setup guide
   - Troubleshooting
   - Best practices
   - API reference

6. **`IMPLEMENTATION_SUMMARY.md`**
   - Complete implementation details
   - Testing checklist
   - Integration points
   - Troubleshooting guide

### Modified Files:

1. **`src/app/api/send-message/route.ts`**
   - Added Twilio service integration
   - Better error handling
   - Support for 3 providers
   - Improved logging

---

## 🧪 Testing Checklist

### Twilio WhatsApp:
- [ ] Twilio account created
- [ ] Joined sandbox
- [ ] Credentials stored in CRM
- [ ] Test lead added
- [ ] Campaign created (status = ACTIVE)
- [ ] Message sent successfully
- [ ] Message received on WhatsApp
- [ ] Console logs checked (F12)

### Sync System:
- [ ] Create lead while offline
- [ ] Verify item in sync queue
- [ ] Go online
- [ ] Auto-sync triggered (wait 5 min or trigger manually)
- [ ] Lead synced to server
- [ ] Sync stats displayed correctly
- [ ] Update and delete operations tested

---

## 🐛 Common Issues & Solutions

### Issue: Message not sending

**Check**:
1. Campaign status is "ACTIVE"
2. Twilio credentials are correct
3. Phone number format is correct (+countrycode + number)
4. Sandbox is joined (for testing)
5. Browser console (F12) for error messages

**Solution**:
```bash
# Verify token storage
SELECT * FROM WhatsappToken;

# Check campaign status
SELECT id, campaignName, status FROM WhatsappCampaign;
```

### Issue: Sync not working

**Check**:
1. Network connection
2. Sync queue table exists
3. Auto-sync is enabled
4. No authentication errors

**Solution**:
```typescript
// Check online status
const isOnline = await enhancedSyncService.checkOnlineStatus();
console.log('Online:', isOnline);

// Check pending items
const stats = await enhancedSyncService.getSyncStats();
console.log('Pending:', stats.pendingCount);

// Manual sync
await enhancedSyncService.sync();
```

### Issue: Errors in console

**Check**:
- Server logs: `server-log.txt` in app directory
- Database connection
- API routes accessible
- Prisma client generated

**Solution**:
```bash
# Regenerate Prisma client
npx prisma generate

# Check database
npx prisma studio
```

---

## 📚 Additional Resources

### Documentation:
- **Twilio Setup**: See `TWILIO_WHATSAPP_SETUP.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Twilio Docs**: https://www.twilio.com/docs/whatsapp
- **WhatsApp Policy**: https://www.whatsapp.com/legal/business-policy

### API Endpoints:

```
POST /api/token                  - Store WhatsApp credentials
POST /api/send-message           - Send campaign messages
GET  /api/sync/stats             - Get sync statistics
POST /api/sync/stats             - Trigger manual sync
POST /api/sync/push              - Push changes to server
POST /api/sync/pull              - Pull changes from server
```

### Phone Number Formats:

```
India:  +919876543210
USA:    +12025551234
UK:     +447700900123
```

---

## 🎯 Next Steps

### Immediate (Today):
1. ✅ Test Twilio integration with your phone
2. ✅ Verify messages are received
3. ✅ Add sync status to your UI
4. ✅ Test offline functionality

### Short-term (This Week):
1. Add more test leads
2. Create multiple campaigns
3. Monitor sync statistics
4. Test with actual users

### Long-term (Next Month):
1. Request Twilio production approval
2. Implement conflict resolution UI
3. Add message templates
4. Set up delivery webhooks
5. Create campaign analytics

---

## ✨ Features Available

### WhatsApp Messaging:
✅ Send text messages
✅ Send media messages (images, documents)
✅ Bulk messaging with rate limiting
✅ Multiple provider support
✅ Delivery tracking
✅ Error handling and retry

### Sync System:
✅ Offline-first operation
✅ Automatic background sync
✅ Conflict detection
✅ Manual sync trigger
✅ Sync statistics
✅ Retry failed operations
✅ Queue cleanup

---

## 💡 Tips & Best Practices

### Twilio:
1. **Always test in sandbox first** before production
2. **Respect rate limits**: Default 1 msg/sec for sandbox
3. **Verify phone numbers**: Ensure E.164 format
4. **Monitor costs**: Check Twilio console regularly
5. **Use approved templates** for production

### Sync:
1. **Add to queue immediately** after data changes
2. **Don't block UI** while syncing
3. **Monitor pending count** regularly
4. **Clear old items** periodically
5. **Handle conflicts** gracefully

---

## 🆘 Support

**Having Issues?**

1. Check browser console (F12) for errors
2. Review `server-log.txt` for server errors
3. Verify database with `npx prisma studio`
4. Check sync queue: `SELECT * FROM SyncQueue WHERE syncedAt IS NULL`
5. Test Twilio credentials in Twilio Console

**Still Stuck?**

- Review `TWILIO_WHATSAPP_SETUP.md` for detailed troubleshooting
- Check `IMPLEMENTATION_SUMMARY.md` for technical details
- Verify all environment variables are set correctly

---

**Status**: ✅ Ready to Use

**Last Updated**: December 23, 2025

**Version**: 1.0.0
