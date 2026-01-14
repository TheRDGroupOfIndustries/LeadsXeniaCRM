import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { signJwt } from "@/lib/jwt";
import { hashPassword } from "@/lib/hash";
import { setTokenCookie } from "@/lib/cookies";
import { Role } from "@prisma/client";

interface SignupRequestBody {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SignupRequestBody;

    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(body.password);
    
    // Determine subscription: ADMINs are automatically PREMIUM
    const subscription = body.role === "ADMIN" ? "PREMIUM" : "FREE";
    
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: body.role,
        subscription: subscription,
      },
    });

    // const token = signJwt({
    //   userId: user.id,
    //   name: user.name,
    //   email: body.email,
    //   role: user.role,
    // });

    const safeUser = {
      userId: user.id,
      name: user.name,
      email: body.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };

    const response = NextResponse.json({ user: safeUser });
    // response.headers.set("Set-Cookie", setTokenCookie(token));
    return response;
  } catch (error: any) {
    console.error(
      "Signup error:', error instanceof Error ? error.message : '",
      error.message
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}