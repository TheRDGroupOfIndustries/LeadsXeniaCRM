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
            ${
              leadDetails.notes
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
