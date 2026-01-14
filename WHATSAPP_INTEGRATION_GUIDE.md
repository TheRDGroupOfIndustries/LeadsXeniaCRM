# WhatsApp & Twilio Integration Guide - ColorTouch CRM

## Overview

Your ColorTouch CRM now supports two primary messaging providers:
1. **WhatsApp Business API** (Meta Cloud API) - Direct integration with certificate
2. **Twilio WhatsApp** - Third-party managed service

---

## Part 1: WhatsApp Business API (Direct Integration)

### What You Have
- **Certificate File**: `cert (2).txt` - Contains Base64-encoded phone number registration data
- **Requirements**: Phone Number ID, Access Token, 6-digit PIN

### Step-by-Step Integration

#### Step 1: Get Your WhatsApp Credentials

1. **Go to WhatsApp Manager**: https://www.facebook.com/business/tools/whatsapp-manager
2. **Select Your Business Account**
3. **Navigate to Phone Numbers**
4. **Find Your Phone Number ID**
   - Copy the 15-digit number (starts with "120...")
   - Example: `120241234567890`

#### Step 2: Get Your Meta Access Token

1. **Go to Meta for Developers**: https://developers.facebook.com
2. **Select Your App** or create one
3. **Go to Tools → Graph API Explorer**
4. **Generate Access Token**:
   - Select "GET" from dropdown
   - Enter: `me/accounts` in the query field
   - Click "Submit"
   - Copy the access token (starts with "EAAH...")

#### Step 3: Get Your 6-Digit PIN

1. **Go to WhatsApp Manager**
2. **Click Settings (⚙️) icon**
3. **Look for "Two-Step Verification"**
4. **Enable if not already enabled**
5. **Copy your 6-digit PIN**

#### Step 4: Register Phone Number in ColorTouch

1. **Log in to ColorTouch CRM as Admin**
2. **Go to Admin Panel → Integrations → WhatsApp Business API**
3. **Fill in the form**:
   ```
   Phone Number ID: 120241234567890
   Access Token: EAAH...
   6-Digit PIN: 123456
   Certificate: [Upload cert (2).txt file]
   Display Name: Your Business Name (optional)
   ```

4. **Click "Register Phone Number"**

5. **You should see**: ✅ "Phone number registered successfully!"

#### Step 5: Verify Registration Status

```bash
# Check if registration was successful
GET https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}?access_token={YOUR_TOKEN}&fields=status
```

Expected response:
```json
{
  "status": "REGISTERED",
  "id": "120241234567890"
}
```

---

## Part 2: Twilio WhatsApp Integration

### What You Need

- **Twilio Account**: https://www.twilio.com/try-twilio
- **Get $15 free credit** for testing
- **Account SID** and **Auth Token** from your Twilio Console
- **WhatsApp Sandbox or Production Number**

### Setup Steps

#### Step 1: Create Twilio Account

1. **Sign up at**: https://www.twilio.com/try-twilio
2. **Verify your phone number**
3. **Get $15 free credit**

#### Step 2: Get Your Twilio Credentials

1. **Go to**: https://console.twilio.com/
2. **On the Dashboard, find:**
   ```
   Account SID:  ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Auth Token:   (Click "Show" to reveal)
   ```

#### Step 3: Set Up WhatsApp Sandbox (Testing)

1. **In Twilio Console**: Messaging → Try it out → Send a WhatsApp message
2. **Follow the Sandbox setup**:
   - You'll get a WhatsApp Number: `+14155238886` (sandbox number)
   - Send "join {CODE}" to sandbox number to enable

#### Step 4: Configure in ColorTouch

1. **Log in to ColorTouch CRM as Admin**
2. **Go to Admin Panel → Integrations → Twilio WhatsApp**
3. **Fill in the form**:
   ```
   Account SID:    ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Auth Token:     (Your auth token)
   WhatsApp Number: +14155238886 (sandbox) or your production number
   ```

4. **Click "Save & Validate Credentials"**

5. **You should see**: ✅ "Configuration Saved"

---

## Part 3: Using the Certificate

### What Is the Certificate?

The certificate file (`cert (2).txt`) contains:
- Base64-encoded phone number registration data
- Validity: 14 days from approval date
- Required for: Direct Meta Cloud API registration only

### Where It's Used

**Only needed for:**
- ✅ WhatsApp Business API (Direct) - during registration
- ❌ NOT needed for Twilio (Twilio handles it internally)

### If Certificate Expires

1. **Go to WhatsApp Manager**
2. **Resubmit your Display Name for approval**
3. **Download the new certificate**
4. **Re-register in ColorTouch with the new certificate**

---

## Choosing Between WhatsApp Business API and Twilio

### WhatsApp Business API (Direct)
**Best for:** Enterprise customers who want direct Meta integration

✅ **Pros:**
- Direct relationship with Meta
- Lower latency
- Full API control
- Better rates for high volume

❌ **Cons:**
- More setup complexity
- Need certificate management
- Requires Display Name approval

**Cost:** Variable based on conversation pricing

---

### Twilio WhatsApp
**Best for:** Quick setup and managed service

✅ **Pros:**
- Simple setup (3 fields)
- Managed service (Twilio handles updates)
- Good support
- Works immediately in sandbox

❌ **Cons:**
- Dependent on Twilio
- Slightly higher cost per message
- Limited to Twilio's infrastructure

**Cost:** ~$0.005-$0.10 per conversation (varies by country)

---

## Testing Messages

### Test WhatsApp Business API

```bash
curl -X POST "https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919876543210",
    "type": "text",
    "text": {
      "body": "Hello from ColorTouch!"
    }
  }'
```

### Test Twilio

```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/AC.../Messages.json" \
  -u "AC...:auth_token" \
  --data-urlencode "From=whatsapp:+14155238886" \
  --data-urlencode "To=whatsapp:+919876543210" \
  --data-urlencode "Body=Test message"
```

---

## Troubleshooting

### Certificate Issues

| Issue | Solution |
|-------|----------|
| "Certificate expired" | Re-download from WhatsApp Manager and re-register |
| "Invalid certificate format" | Ensure file is plain text, copy entire content |
| "Certificate not working" | Check Display Name status is "Approved" |

### WhatsApp Business API Issues

| Issue | Solution |
|-------|----------|
| "Invalid PIN" | Check Two-Step Verification in WhatsApp Manager settings |
| "Phone number not found" | Use exact Phone Number ID from WhatsApp Manager |
| "Messages not sending" | Check phone number status is "REGISTERED" |

### Twilio Issues

| Issue | Solution |
|-------|----------|
| "Invalid credentials" | Check Account SID and Auth Token are correct |
| "Sandbox number not working" | Send "join {CODE}" to +14155238886 first |
| "Messages rate-limited" | Twilio sandbox limits to 1 msg/second |

---

## Deployment Changes Required

### Environment Variables (.env.production)

```env
# WhatsApp Business API (if using direct integration)
WHATSAPP_PHONE_NUMBER_ID=120241234567890
WHATSAPP_ACCESS_TOKEN=EAAH...
WHATSAPP_PIN=123456

# Twilio (if using Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+1234567890
```

### Database Migration

```bash
# Run Prisma migration to add WhatsAppConfig and TwilioConfig tables
npx prisma migrate deploy

# Or reset for development
npx prisma db push
```

---

## API Endpoints

### WhatsApp Registration
```
POST /api/integrations/whatsapp-register
GET  /api/integrations/whatsapp-register?phoneNumberId={id}&accessToken={token}
```

### Send Messages
```
POST /api/send-message (existing endpoint - now supports both providers)
```

### Token Storage (Twilio)
```
POST /api/token
```

---

## Support Resources

- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp
- **Twilio WhatsApp**: https://www.twilio.com/docs/whatsapp
- **WhatsApp Manager**: https://www.facebook.com/business/tools/whatsapp-manager
- **Meta for Developers**: https://developers.facebook.com
- **Twilio Console**: https://console.twilio.com

---

## What's Next?

1. **Register one or both providers** in Admin Panel → Integrations
2. **Test with a small campaign** to verify messages are sending
3. **Monitor message delivery** in your provider's dashboard
4. **Scale up** gradually as you verify everything works

Your certificate is valid and ready to use. Get started now! 🚀
