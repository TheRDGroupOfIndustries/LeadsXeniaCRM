import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import razorpay from "@/lib/razorpay";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    console.log("Create order API called");
    const session = await auth();
    console.log("Session user data:", JSON.stringify(session?.user, null, 2));
    
    if (!session?.user?.id) {
      console.log("No session found");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("Request body:", body);
    const { amount, currency = "INR", notes = {} } = body;

    if (!amount || amount <= 0) {
      console.log("Invalid amount:", amount);
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    console.log("Creating Razorpay order with amount:", amount);
    
    // Verify user exists in database, create if not found
    let user = await (prisma as any).user.findUnique({
      where: { id: session.user.id }
    });
    
    if (!user) {
      console.log("User not found, creating user record:", session.user.id);
      try {
        user = await (prisma as any).user.create({
          data: {
            id: session.user.id,
            email: session.user.email || `${session.user.id}@colortouch.app`,
            name: session.user.name || "Admin User",
            role: "ADMIN",
          }
        });
        console.log("Created new user:", user.id);
      } catch (userCreateError: any) {
        console.error("Failed to create user:", userCreateError);
        return NextResponse.json(
          { success: false, error: "Failed to create user account" },
          { status: 500 }
        );
      }
    } else {
      console.log("Found existing user:", user.id);
    }
    
    // Create Razorpay order
    const amountPaise = Math.round(Number(amount) * 100); // Razorpay expects amount in paise (integer)
    const options = {
      amount: amountPaise, // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: session.user.id,
        userEmail: session.user.email || "",
        ...notes
      },
    };

    const order = await razorpay.orders.create(options);

    // Save order to database
    const paymentRecord = await (prisma as any).payment.create({
      data: {
        orderId: order.id,
        userId: user.id, // Use the verified user ID
        // Prisma schema expects `amount` as String; store paise value as string
        amount: String(amountPaise),
        currency: currency,
        status: "PENDING",
        razorpayOrderId: order.id,
        receipt: options.receipt,
        notes: JSON.stringify(notes),
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      paymentId: paymentRecord.id,
    });

  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to create payment order" 
      },
      { status: 500 }
    );
  }
}