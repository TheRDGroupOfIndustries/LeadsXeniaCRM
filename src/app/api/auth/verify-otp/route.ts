import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otpStore";
import { emailSchema } from "@/lib/validations/Signup";
import { z } from "zod";

const verifyOtpSchema = z.object({
  email: emailSchema.shape.email,
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;

    const isValid = verifyOtp(email, otp);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // ✅ OTP verified — you can now mark the user as verified or create a session
    return NextResponse.json({ success: "OTP verified successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}