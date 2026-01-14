import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const isAdmin = session.user.role === "ADMIN";

    // Admin sees all payments, regular users see only their own
    const payments = await (prisma as any).payment.findMany({
      where: isAdmin ? {} : {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            subscription: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      payments: payments.map((payment: any) => ({
        ...payment,
        amount: payment.amount / 100, // Convert back from paise to rupees for display
      })),
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}