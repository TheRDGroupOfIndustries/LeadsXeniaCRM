/**
 * Twilio WhatsApp API Integration
 * 
 * This module provides a comprehensive interface for sending WhatsApp messages
 * through Twilio's WhatsApp Business API with proper error handling and logging.
 */

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string; // Twilio WhatsApp number (e.g., +14155238886)
}

interface WhatsAppMessage {
  to: string; // Recipient phone number in E.164 format (e.g., +919876543210)
  body: string; // Message text
  mediaUrl?: string; // Optional media URL
}

interface TwilioResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  errorCode?: string;
}

export class TwilioWhatsAppService {
  private config: TwilioConfig;
  private baseUrl = 'https://api.twilio.com/2010-04-01';

  constructor(config: TwilioConfig) {
    this.validateConfig(config);
    this.config = {
      ...config,
      fromNumber: this.sanitizePhoneNumber(config.fromNumber, true),
    };
  }

  /**
   * Validate Twilio configuration
   */
  private validateConfig(config: TwilioConfig): void {
    if (!config.accountSid || !config.accountSid.startsWith('AC')) {
      throw new Error('Invalid Twilio Account SID. Must start with "AC"');
    }
    if (!config.authToken) {
      throw new Error('Twilio Auth Token is required');
    }
    if (!config.fromNumber) {
      throw new Error('Twilio WhatsApp number is required');
    }
  }

  /**
   * Sanitize phone number - remove all non-digit characters except +
   * and ensure it's in proper format
   */
  private sanitizePhoneNumber(phone: string, isWhatsApp: boolean = false): string {
    // Remove Unicode formatting characters, spaces, and normalize
    let cleaned = phone
      .replace(/[\u200B-\u200D\u202A-\u202E\u2060-\u206F]/g, '') // Unicode formatting
      .replace(/\s+/g, '') // Whitespace
      .replace(/^whatsapp:/i, '') // whatsapp: prefix
      .replace(/[^\d+]/g, ''); // Keep only digits and +

    // Ensure it starts with +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    // Add whatsapp: prefix for Twilio
    return isWhatsApp ? `whatsapp:${cleaned}` : cleaned;
  }

  /**
   * Send a WhatsApp message via Twilio
   */
  async sendMessage(message: WhatsAppMessage): Promise<TwilioResponse> {
    try {
      const toNumber = this.sanitizePhoneNumber(message.to, true);
      const fromNumber = this.config.fromNumber.startsWith('whatsapp:')
        ? this.config.fromNumber
        : `whatsapp:${this.config.fromNumber}`;

      console.log(`📤 Sending WhatsApp via Twilio: From ${fromNumber} To ${toNumber}`);

      const body = new URLSearchParams({
        From: fromNumber,
        To: toNumber,
        Body: message.body,
      });

      // Add media if provided
      if (message.mediaUrl) {
        body.append('MediaUrl', message.mediaUrl);
      }

      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.config.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(
              `${this.config.accountSid}:${this.config.authToken}`
            ).toString('base64')}`,
          },
          body: body.toString(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Twilio API Error:', data);
        return {
          success: false,
          error: data.message || 'Failed to send message',
          errorCode: data.code?.toString(),
        };
      }

      console.log(`✅ Message sent successfully: SID ${data.sid}`);
      return {
        success: true,
        messageId: data.sid,
        status: data.status,
      };
    } catch (error: any) {
      console.error('❌ Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Send bulk messages with rate limiting
   */
  async sendBulkMessages(
    messages: WhatsAppMessage[],
    delayMs: number = 1000
  ): Promise<{
    sent: number;
    failed: number;
    results: TwilioResponse[];
  }> {
    const results: TwilioResponse[] = [];
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      console.log(`📨 Sending message ${i + 1}/${messages.length}...`);

      const result = await this.sendMessage(message);
      results.push(result);

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Wait before sending next message (rate limiting)
      if (i < messages.length - 1) {
        await this.delay(delayMs);
      }
    }

    return { sent, failed, results };
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageSid: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.config.accountSid}/Messages/${messageSid}.json`,
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${this.config.accountSid}:${this.config.authToken}`
            ).toString('base64')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get message status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error getting message status:', error);
      throw error;
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Parse Twilio token from stored format
 * Format: "accountSid:authToken:fromNumber:twilio"
 */
export function parseTwilioToken(tokenData: string): TwilioConfig | null {
  if (!tokenData.includes(':twilio')) {
    return null;
  }

  const parts = tokenData.split(':');
  if (parts.length < 4) {
    console.error('Invalid Twilio token format');
    return null;
  }

  return {
    accountSid: parts[0],
    authToken: parts[1],
    fromNumber: parts[2],
  };
}

/**
 * Create Twilio service instance from stored token
 */
export function createTwilioService(tokenData: string): TwilioWhatsAppService | null {
  const config = parseTwilioToken(tokenData);
  if (!config) {
    return null;
  }
  return new TwilioWhatsAppService(config);
}
