import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature
    const signature = req.headers.get("x-razorpay-signature");
    const body = await req.text();
    
    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing webhook signature" },
        { status: 400 }
      );
    }

    // Verify Razorpay webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      if (expectedSignature !== signature) {
        return NextResponse.json(
          { success: false, error: "Invalid webhook signature" },
          { status: 400 }
        );
      }
    }

    const event = JSON.parse(body);
    console.log("Razorpay webhook event:", event.event);

    switch (event.event) {
      case "payment.captured":
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      
      case "payment.failed":
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      
      case "order.paid":
        await handleOrderPaid(event.payload.order.entity);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any) {
  try {
    await (prisma as any).payment.updateMany({
      where: { razorpayPaymentId: payment.id },
      data: {
        status: "COMPLETED",
        paidAt: new Date(payment.captured_at * 1000),
        paymentMethod: payment.method,
        updatedAt: new Date(),
      },
    });
    
    console.log(`Payment captured: ${payment.id}`);
  } catch (error) {
    console.error("Error handling payment captured:", error);
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    await (prisma as any).payment.updateMany({
      where: { razorpayPaymentId: payment.id },
      data: {
        status: "FAILED",
        failureReason: payment.error_reason || "Payment failed",
        updatedAt: new Date(),
      },
    });
    
    console.log(`Payment failed: ${payment.id}`);
  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

async function handleOrderPaid(order: any) {
  try {
    await (prisma as any).payment.updateMany({
      where: { razorpayOrderId: order.id },
      data: {
        status: "COMPLETED",
        paidAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    console.log(`Order paid: ${order.id}`);
  } catch (error) {
    console.error("Error handling order paid:", error);
  }
}