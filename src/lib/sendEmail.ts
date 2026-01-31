import nodemailer from "nodemailer";

// Create a reusable transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️ Email credentials not configured");
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      ...options,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.to}`);
    return true;
  } catch (error: any) {
    console.error("❌ Failed to send email:", error.message);
    return false;
  }
}

/**
 * Send notification email when a lead is added
 */
export async function sendLeadNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  addedBy: string,
  leadDetails: {
    name: string;
    email: string;
    phone: string;
    company: string;
    source: string;
    notes?: string;
  }
) {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="border-bottom: 3px solid #F49F00; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">New Lead Added</h2>
        </div>

        <!-- Greeting -->
        <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
          Hi <strong>${recipientName}</strong>,
        </p>

        <!-- Main Message -->
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          You have been added as a lead in <strong>Leads Xenia CRM</strong> by <strong>${addedBy}</strong>.
        </p>

        <!-- Lead Details Box -->
        <div style="background-color: #f9f9f9; border-left: 4px solid #F49F00; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #F49F00; margin-top: 0; font-size: 14px;">Lead Information</h3>
          
          <table style="width: 100%; font-size: 14px; color: #555;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 100px;">Name:</td>
              <td style="padding: 8px 0;">${leadDetails.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${leadDetails.email}" style="color: #F49F00; text-decoration: none;">${leadDetails.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
              <td style="padding: 8px 0;"><a href="tel:${leadDetails.phone}" style="color: #F49F00; text-decoration: none;">${leadDetails.phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Company:</td>
              <td style="padding: 8px 0;">${leadDetails.company || "—"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Source:</td>
              <td style="padding: 8px 0;">${leadDetails.source || "—"}</td>
            </tr>
            ${leadDetails.notes
      ? `<tr>
              <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Notes:</td>
              <td style="padding: 8px 0;">${leadDetails.notes}</td>
            </tr>`
      : ""
    }
          </table>
        </div>

        <!-- CTA Section -->
        <div style="background-color: #fff3e0; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">
            You can update your information or manage your leads anytime in your Leads Xenia account.
          </p>
          <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}" style="display: inline-block; background-color: #F49F00; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 10px;">
            View in Leads Xenia
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0 0 5px 0;">
            © ${new Date().getFullYear()} Leads Xenia CRM. All rights reserved.
          </p>
          <p style="margin: 0;">
            If you have any questions, please <a href="mailto:support@leadsxenia.com" style="color: #F49F00; text-decoration: none;">contact support</a>.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `You've been added as a lead in XeniaCRM CRM by ${addedBy}`,
    html,
  });
}

/**
 * Send bank transfer payment receipt to user
 */
export async function sendBankTransferReceiptEmail(
  userEmail: string,
  userName: string,
  paymentDetails: {
    amount: string;
    paymentId: string;
    submittedAt: string;
  }
) {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="border-bottom: 3px solid #10B981; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">🧾 Payment Received</h2>
        </div>

        <!-- Greeting -->
        <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
          Hi <strong>${userName}</strong>,
        </p>

        <!-- Main Message -->
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          Thank you for your payment! We have received your bank transfer submission and it is currently under review.
        </p>

        <!-- Payment Details Box -->
        <div style="background-color: #f0fdf4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #10B981; margin-top: 0; font-size: 14px;">Payment Details</h3>
          
          <table style="width: 100%; font-size: 14px; color: #555;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">Amount:</td>
              <td style="padding: 8px 0; font-size: 18px; color: #10B981; font-weight: bold;">₹${paymentDetails.amount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Payment ID:</td>
              <td style="padding: 8px 0; font-family: monospace;">${paymentDetails.paymentId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Submitted At:</td>
              <td style="padding: 8px 0;">${paymentDetails.submittedAt}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Status:</td>
              <td style="padding: 8px 0;"><span style="background-color: #FEF3C7; color: #D97706; padding: 4px 10px; border-radius: 12px; font-size: 12px;">Under Review</span></td>
            </tr>
          </table>
        </div>

        <!-- What's Next -->
        <div style="background-color: #f9f9f9; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="color: #333; margin-top: 0; font-size: 14px;">What happens next?</h4>
          <ol style="color: #666; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Our team will verify your payment screenshot</li>
            <li>Your account will be upgraded to Premium within 24 hours</li>
            <li>You'll receive a confirmation email when activated</li>
          </ol>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0 0 5px 0;">
            © ${new Date().getFullYear()} LeadsXenia CRM. All rights reserved.
          </p>
          <p style="margin: 0;">
            Questions? <a href="mailto:support@leadsxenia.com" style="color: #10B981; text-decoration: none;">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Payment Receipt - ₹${paymentDetails.amount} | LeadsXenia`,
    html,
  });
}

/**
 * Send bank transfer payment notification to admin with proof
 */
export async function sendBankTransferAdminNotification(
  adminEmail: string,
  paymentDetails: {
    userName: string;
    userEmail: string;
    amount: string;
    paymentId: string;
    submittedAt: string;
    screenshotBase64?: string;
    screenshotFilename?: string;
  }
) {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="border-bottom: 3px solid #3B82F6; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">💳 New Bank Transfer Payment</h2>
        </div>

        <!-- Alert Banner -->
        <div style="background-color: #DBEAFE; border: 1px solid #3B82F6; padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <strong style="color: #1D4ED8;">Action Required:</strong>
          <span style="color: #374151;"> Verify payment and activate subscription</span>
        </div>

        <!-- Payment Details Box -->
        <div style="background-color: #f9f9f9; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #3B82F6; margin-top: 0; font-size: 14px;">Payment Information</h3>
          
          <table style="width: 100%; font-size: 14px; color: #555;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">User Name:</td>
              <td style="padding: 8px 0;">${paymentDetails.userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">User Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${paymentDetails.userEmail}" style="color: #3B82F6;">${paymentDetails.userEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Amount:</td>
              <td style="padding: 8px 0; font-size: 18px; color: #10B981; font-weight: bold;">₹${paymentDetails.amount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Payment ID:</td>
              <td style="padding: 8px 0; font-family: monospace;">${paymentDetails.paymentId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Submitted At:</td>
              <td style="padding: 8px 0;">${paymentDetails.submittedAt}</td>
            </tr>
          </table>
        </div>

        <!-- Screenshot Preview (if available) -->
        ${paymentDetails.screenshotBase64 ? `
        <div style="margin: 20px 0;">
          <h4 style="color: #333; margin-bottom: 10px; font-size: 14px;">📸 Payment Screenshot</h4>
          <div style="background-color: #f9f9f9; padding: 10px; border-radius: 8px; text-align: center;">
            <img src="data:image/png;base64,${paymentDetails.screenshotBase64}" alt="Payment Screenshot" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid #ddd;" />
          </div>
        </div>
        ` : `
        <div style="background-color: #FEF3C7; padding: 12px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <span style="color: #D97706;">⚠️ No screenshot attached</span>
        </div>
        `}

        <!-- Action Buttons -->
        <div style="text-align: center; margin: 20px 0;">
          <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/payments" style="display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-right: 10px;">
            Go to Admin Panel
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0;">
            This is an automated notification from LeadsXenia CRM
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `🔔 New Payment: ₹${paymentDetails.amount} from ${paymentDetails.userName}`,
    html,
  });
}
