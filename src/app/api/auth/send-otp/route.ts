import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { emailSchema } from "@/lib/validations/Signup";
import { saveOtp } from "@/lib/otpStore";
import prisma from "@/lib/prisma";

function generateOTP(limit: number): string {
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < limit; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ✅ Validate email with Zod
    const parsed = emailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    
    const { email } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered. Please login instead." },
        { status: 400 }
      );
    }
    const otp = generateOTP(6);
    saveOtp(email, otp);
 
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 465,
      secure: true,
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "RoopShree - OTP Verification",
      html: `<div style="font-family: Arial, sans-serif; text-align:center; padding:20px; background-color:#f5f5f5;">
        <div style="background-color:white; padding:30px; border-radius:10px; max-width:500px; margin:0 auto;">
          <h2 style="color:#F49F00;">Secure OTP Verification</h2>
          <p style="color:#666; font-size:16px;">Your OTP for RoopShree verification is:</p>
          <div style="font-size:32px; font-weight:bold; color:#F49F00; letter-spacing:5px; padding:20px; background-color:#fff3e0; border-radius:8px; margin:20px 0;">${otp}</div>
          <p style="color:#999; font-size:14px;">This OTP is valid for 10 minutes.</p>
          <p style="color:#999; font-size:12px;">If you didn't request this OTP, please ignore this email.</p>
        </div>
      </div>`,
    };

    await transporter.sendMail(mailOptions);

    // ⚠️ SECURITY WARNING: Don't send OTP back in production!
    // For development/testing only:
    // if (process.env.NODE_ENV === "development") {
    //   return NextResponse.json({ 
    //     success: "OTP sent successfully!", 
    //     otp // Only in development
    //   }, { status: 200 });
    // }

    // ✅ Production response (no OTP included):
    return NextResponse.json({ 
      success: "OTP sent successfully to your email!" 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ 
      error: "Failed to send OTP. Please try again later." 
    }, { status: 500 });
  }
}