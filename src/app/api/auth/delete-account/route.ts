import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE() {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.id as string;

    // Don't allow deletion if user is env-admin
    if (userId === "env-admin") {
      return NextResponse.json(
        { error: "Cannot delete admin account" },
        { status: 403 }
      );
    }

    // Delete all related data first (due to foreign key constraints)
    // The cascade delete in schema should handle most of this, but let's be explicit
    
    try {
      // Delete user - cascade will handle leads, payments, reminders, etc.
      await prisma.user.delete({
        where: { id: userId }
      });

      return NextResponse.json({
        success: true,
        message: "Account deleted successfully"
      });

    } catch (dbError: any) {
      console.error("Database error during account deletion:", dbError);
      
      // If cascade delete fails, try manual deletion
      if (dbError.code === "P2003") {
        // Foreign key constraint failed - manually delete related records
        await prisma.$transaction([
          prisma.reminder.deleteMany({ where: { userId } }),
          prisma.lead.deleteMany({ where: { userId } }),
          prisma.payment.deleteMany({ where: { userId } }),
          prisma.campaign.deleteMany({ where: { userId } }),
          prisma.user.delete({ where: { id: userId } })
        ]);

        return NextResponse.json({
          success: true,
          message: "Account deleted successfully"
        });
      }

      throw dbError;
    }

  } catch (error: any) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
