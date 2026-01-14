import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import razorpay from "@/lib/razorpay";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      paymentId 
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing payment verification data" },
        { status: 400 }
      );
    }

    // Verify payment signature
    const body_string = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body_string)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // Update payment as failed
      if (paymentId) {
        await (prisma as any).payment.update({
          where: { id: paymentId },
          data: {
            status: "FAILED",
            failureReason: "Invalid signature verification",
            updatedAt: new Date(),
          },
        });
      }

      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // Update payment record in database
    const updatedPayment = await (prisma as any).payment.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        status: "COMPLETED",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date(),
        paymentMethod: payment.method || "unknown",
        updatedAt: new Date(),
      },
    });

    // On successful payment, activate premium subscription for the paying user
    try {
      if (updatedPayment?.userId) {
        await (prisma as any).user.update({
          where: { id: updatedPayment.userId },
          data: { subscription: "PREMIUM", updatedAt: new Date() },
        });
        console.log("Activated PREMIUM subscription for user:", updatedPayment.userId);
      }
    } catch (subErr: any) {
      console.error("Failed to update user subscription:", subErr?.message || subErr);
      // Don't fail the payment verification if subscription update fails - log and continue
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      paymentId: updatedPayment.id,
      status: "COMPLETED",
    });

  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Payment verification failed" 
      },
      { status: 500 }
    );
  }
}