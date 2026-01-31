import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  sendBankTransferReceiptEmail,
  sendBankTransferAdminNotification
} from "@/lib/sendEmail";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user already has a pending bank transfer payment
    const existingPendingPayment = await prisma.payment.findFirst({
      where: {
        userId: session.user.id,
        paymentMethod: "BANK_TRANSFER",
        status: "PENDING"
      }
    });

    if (existingPendingPayment) {
      return NextResponse.json({
        success: false,
        error: "You already have a pending payment. Please wait for verification.",
        existingPaymentId: existingPendingPayment.orderId
      }, { status: 400 });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const amount = formData.get("amount") as string;
    const description = formData.get("description") as string;
    const screenshot = formData.get("screenshot") as File | null;

    if (!name || !email || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate a unique payment ID
    const paymentId = `BT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const submittedAt = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short"
    });

    console.log("Bank Transfer Payment Request:", {
      userId: session.user.id,
      paymentId,
      name,
      email,
      amount,
      description,
      hasScreenshot: !!screenshot,
      screenshotName: screenshot?.name,
      screenshotSize: screenshot?.size
    });

    // Convert screenshot to base64 for email (if provided)
    let screenshotBase64: string | undefined;
    if (screenshot) {
      try {
        const arrayBuffer = await screenshot.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        screenshotBase64 = buffer.toString("base64");
      } catch (err) {
        console.error("Failed to convert screenshot to base64:", err);
      }
    }

    // Save payment record to database
    await prisma.payment.create({
      data: {
        orderId: paymentId,
        userId: session.user.id,
        amount: amount,
        currency: "INR",
        status: "PENDING",
        paymentMethod: "BANK_TRANSFER",
        notes: JSON.stringify({
          name,
          email,
          description,
          submittedAt,
          hasScreenshot: !!screenshot,
          screenshotFilename: screenshot?.name
        }),
        createdAt: new Date()
      }
    });

    // Update user subscription to PENDING (waiting for verification)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { subscription: "PENDING" }
    });

    console.log("✅ Payment record saved and user subscription set to PENDING:", paymentId);

    // Send receipt email to user
    try {
      await sendBankTransferReceiptEmail(email, name, {
        amount,
        paymentId,
        submittedAt,
      });
      console.log("✅ Receipt email sent to user:", email);
    } catch (emailErr) {
      console.error("Failed to send receipt email:", emailErr);
    }

    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      try {
        await sendBankTransferAdminNotification(adminEmail, {
          userName: name,
          userEmail: email,
          amount,
          paymentId,
          submittedAt,
          screenshotBase64,
          screenshotFilename: screenshot?.name,
        });
        console.log("✅ Admin notification sent to:", adminEmail);
      } catch (emailErr) {
        console.error("Failed to send admin notification:", emailErr);
      }
    } else {
      console.warn("⚠️ ADMIN_EMAIL not configured, skipping admin notification");
    }

    return NextResponse.json({
      success: true,
      paymentId,
      message: "Payment submitted for verification. You will be notified once verified."
    });

  } catch (error: any) {
    console.error("Bank transfer API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process payment request" },
      { status: 500 }
    );
  }
}
