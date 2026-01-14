/**
 * Twilio WhatsApp Setup Guide
 * 
 * This guide will help you set up Twilio WhatsApp API for your ColorTouch CRM
 */

# Twilio WhatsApp Integration Guide

## Prerequisites

1. **Twilio Account**
   - Sign up at https://www.twilio.com/try-twilio
   - Get $15 free credit for testing

2. **WhatsApp Sandbox (For Testing)**
   - Navigate to: Console > Messaging > Try it out > Send a WhatsApp message
   - Follow the instructions to join the sandbox

3. **Production Setup (For Live Use)**
   - Request WhatsApp Business Profile approval
   - Complete business verification
   - Submit WhatsApp sender profile for approval

## Step 1: Get Your Twilio Credentials

1. Go to your Twilio Console: https://console.twilio.com/
2. Find your credentials on the dashboard:
   - **Account SID**: Starts with "AC..." (e.g., ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
   - **Auth Token**: Click "Show" to reveal your auth token

## Step 2: Get Your WhatsApp Number

### For Testing (Sandbox):
1. Go to: Console > Messaging > Try it out > Send a WhatsApp message
2. Your sandbox number will be shown (e.g., +14155238886)
3. Join the sandbox by sending the provided code from your WhatsApp

### For Production:
1. Request a WhatsApp Business Account
2. Get your approved phone number (with country code)

## Step 3: Configure in ColorTouch CRM

### Option A: Using the UI (Recommended)

1. Log into ColorTouch CRM
2. Navigate to **Settings > Integrations** or **WhatsApp Settings**
3. Select "Twilio" as provider
4. Enter your credentials:
   ```
   Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Auth Token: your_auth_token_here
   WhatsApp Number: +14155238886 (or your approved number)
   ```
5. Click "Save" or "Connect"

### Option B: Direct API Call

```bash
# Save Twilio credentials
curl -X POST http://localhost:3000/api/token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "secret": "your_auth_token",
    "phoneNumber": "+14155238886",
    "provider": "twilio"
  }'
```

The system will store it in format: `accountSid:authToken:phoneNumber:twilio`

## Step 4: Test Your Integration

1. **Add Test Leads**:
   - Go to Leads section
   - Add a lead with a valid WhatsApp phone number
   - Format: +[country_code][number] (e.g., +919876543210 for India)

2. **Create a Campaign**:
   - Navigate to WhatsApp Campaigns
   - Click "Create Campaign"
   - Fill in:
     - Campaign Name
     - Message Content
     - Set status to "ACTIVE"

3. **Send Test Message**:
   - Click "Send Campaign"
   - Check the logs in the browser console (F12)
   - Verify the message is received on WhatsApp

## Step 5: Understanding Message Format

### E.164 Phone Number Format (Required by Twilio)
- **Format**: +[country_code][number]
- **Examples**:
  - India: +919876543210
  - USA: +12025551234
  - UK: +447700900123

### Message Sending

The CRM automatically:
1. Sanitizes phone numbers (removes spaces, special characters)
2. Adds country code prefix
3. Formats as `whatsapp:+[country_code][number]`
4. Sends via Twilio API

## Step 6: Rate Limiting & Best Practices

### Twilio Rate Limits:
- **Sandbox**: 1 message per second
- **Production**: Varies by approval level (typically 60-80 msg/sec)

### Current CRM Settings:
- **Default delay**: 12 seconds between messages
- **Configurable in**: `src/app/api/send-message/route.ts`

### Best Practices:
1. **Test in Sandbox First**: Always test with sandbox before production
2. **Verify Numbers**: Ensure all recipient numbers are valid
3. **Monitor Logs**: Check console and server logs for errors
4. **Rate Limiting**: Don't exceed Twilio limits to avoid blocking
5. **Message Templates**: Use approved templates for production

## Step 7: Error Handling

### Common Errors:

1. **"21211: Invalid 'To' Phone Number"**
   - **Cause**: Phone number format is incorrect
   - **Fix**: Ensure E.164 format (+countrycode + number)

2. **"21408: Permission to send an SMS has not been enabled"**
   - **Cause**: Using sandbox without joining
   - **Fix**: Send the join code to the sandbox number

3. **"21606: The From phone number is not a valid"**
   - **Cause**: Incorrect sender number
   - **Fix**: Verify your Twilio WhatsApp number

4. **"20003: Authentication Error"**
   - **Cause**: Invalid Account SID or Auth Token
   - **Fix**: Re-check credentials in Twilio console

### Debugging Tips:

1. **Enable Dev Tools**: 
   - Press F12 in the CRM
   - Check Console tab for detailed logs

2. **Check Server Logs**:
   - For Electron app: Check `server-log.txt` in app directory
   - For web app: Check terminal/server console

3. **Verify Token Storage**:
   ```bash
   # Query database to check stored token
   SELECT * FROM WhatsappToken WHERE userId = 'your_user_id';
   ```

4. **Test Twilio API Directly**:
   ```bash
   curl -X POST "https://api.twilio.com/2010-04-01/Accounts/ACxxxx/Messages.json" \
     -u "ACxxxx:your_auth_token" \
     --data-urlencode "From=whatsapp:+14155238886" \
     --data-urlencode "To=whatsapp:+919876543210" \
     --data-urlencode "Body=Test message"
   ```

## Step 8: Production Deployment

### Before Going Live:

1. **Complete Business Verification**:
   - Submit business documents to Twilio
   - Wait for WhatsApp approval (1-3 weeks)

2. **Message Templates**:
   - Create and submit message templates for approval
   - Use only approved templates in production

3. **Phone Number**:
   - Get a dedicated WhatsApp Business number
   - Update the "WhatsApp Number" in CRM settings

4. **Webhook Configuration** (Optional):
   - Set up webhooks to receive delivery status
   - Update endpoint: `https://your-domain.com/api/webhooks/twilio`

5. **Monitoring**:
   - Set up Twilio console alerts
   - Monitor message delivery rates
   - Track API usage and costs

### Update Configuration:

```javascript
// In .env file
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_production_auth_token
TWILIO_WHATSAPP_NUMBER=+1234567890
```

## API Reference

### Send Message Endpoint

**POST** `/api/send-message`

```json
{
  "campaignId": "campaign_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "sentCount": 10,
  "errorCount": 0,
  "totalLeads": 10
}
```

### Store Token Endpoint

**POST** `/api/token`

```json
{
  "token": "ACxxxxxxxx",
  "secret": "auth_token",
  "phoneNumber": "+14155238886",
  "provider": "twilio"
}
```

## Cost Estimation

### Twilio WhatsApp Pricing (as of 2024):
- **Conversation-based pricing**
- **User-initiated**: $0.005 - $0.01 per conversation
- **Business-initiated**: $0.02 - $0.10 per conversation
- **Free tier**: $15 credit for new accounts

### Example Costs:
- 100 messages to users in India: ~$0.50 - $5.00
- 1000 messages: ~$5 - $50
- Varies by country and conversation type

**Note**: Check latest pricing at: https://www.twilio.com/whatsapp/pricing

## Support & Resources

- **Twilio Docs**: https://www.twilio.com/docs/whatsapp
- **API Reference**: https://www.twilio.com/docs/whatsapp/api
- **Support**: https://support.twilio.com
- **WhatsApp Business Policy**: https://www.whatsapp.com/legal/business-policy

## Troubleshooting Checklist

- [ ] Twilio Account SID is correct and starts with "AC"
- [ ] Auth Token is valid (not expired)
- [ ] WhatsApp number includes country code with "+"
- [ ] Sandbox is joined (for testing)
- [ ] Recipient numbers are in E.164 format
- [ ] Campaign status is set to "ACTIVE"
- [ ] Rate limits are not exceeded
- [ ] Network connection is stable
- [ ] Browser console shows no JavaScript errors

---

**Need Help?** Check the logs in the browser console (F12) and `server-log.txt` file for detailed error messages.
