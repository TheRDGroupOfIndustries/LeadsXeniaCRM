# Quick Reference: Using Your WhatsApp Certificate

## Your Certificate is Ready ✅

**File**: `cert (2).txt`  
**Status**: Valid and ready to use  
**Expires**: 14 days from WhatsApp approval date  
**Format**: Base64 (plain text)

---

## 5-Minute Setup

### Step 1: Gather Your Credentials

| Item | Where to Find | Example |
|------|-------------|---------|
| **Phone Number ID** | WhatsApp Manager → Phone Numbers | `120241234567890` |
| **Access Token** | Meta for Developers → Your App → Tokens | `EAAH...` |
| **6-Digit PIN** | WhatsApp Manager → Settings → Two-Step Verification | `123456` |
| **Certificate** | Already have: `cert (2).txt` | ✅ Ready |

### Step 2: Register in ColorTouch

1. Open ColorTouch CRM
2. Login as **admin@colortouch.app** / **Admin@123!**
3. Go to **Admin Panel → Integrations**
4. Click **"WhatsApp Business API"** tab
5. Fill in all 4 fields
6. Click **"Register Phone Number"**
7. See ✅ Success message

### Step 3: Start Sending

1. Create a campaign in ColorTouch
2. Select leads
3. Send WhatsApp messages directly
4. Monitor delivery in WhatsApp Manager

---

## What Your Certificate Does

✅ **Registers** your phone number with Meta  
✅ **Enables** direct WhatsApp Cloud API access  
✅ **Validates** your business is approved  
✅ **Authorizes** message sending  

⚠️ **Important**: Certificate only works ONCE during registration. After registration, you only need your Access Token for sending messages.

---

## Alternative: Use Twilio Instead

If you prefer managed service:

| Step | Action |
|------|--------|
| 1 | Go to Integrations → Twilio WhatsApp tab |
| 2 | Get credentials from console.twilio.com |
| 3 | Fill Account SID, Auth Token, WhatsApp Number |
| 4 | Click "Save & Validate Credentials" |
| 5 | Start sending messages |

**No certificate needed for Twilio** - much simpler setup!

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Certificate not found" | Upload `cert (2).txt` file from your downloads |
| "Invalid PIN" | Check it's exactly 6 digits from WhatsApp Manager |
| "Phone number not registered" | Ensure Display Name is "Approved" in WhatsApp Manager |
| "Access token error" | Generate new token from Meta for Developers |
| "Messages not sending" | Check phone number status = "REGISTERED" in WhatsApp Manager |

---

## Key Links

- 📱 [WhatsApp Manager](https://www.facebook.com/business/tools/whatsapp-manager)
- 🔐 [Meta for Developers](https://developers.facebook.com)
- 📚 [WhatsApp API Docs](https://developers.facebook.com/docs/whatsapp)
- 🔄 [Twilio Console](https://console.twilio.com)

---

## Admin Credentials (Already Set)

```
Email:    admin@colortouch.app
Password: Admin@123!
```

**Note**: These are the defaults. Change them in production!

---

## Deployment Checklist

```bash
# 1. Update .env with your credentials
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PIN=your_pin

# 2. Run database migration
npx prisma migrate deploy

# 3. Rebuild and deploy
npm run build
npm start

# 4. Test in admin panel
# 5. Send test campaign
```

---

## You're All Set! 🎉

Your certificate is integrated and ready to use. Register your phone number in the Admin Panel and start sending WhatsApp messages!

**Questions?** See `WHATSAPP_INTEGRATION_GUIDE.md` for detailed instructions.
