import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Delete all leads for this user
    const deleted = await prisma.lead.deleteMany({
      where: { userId }
    });

    console.log(`✅ Deleted ${deleted.count} leads for user ${userId}`);

    return NextResponse.json({
      success: true,
      deleted: deleted.count,
      message: `Successfully deleted ${deleted.count} leads`
    });
  } catch (error: any) {
    console.error("❌ Delete error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error during deletion." },
      { status: 500 }
    );
  }
}
