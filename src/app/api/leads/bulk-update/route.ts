import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const body = await req.json();
    const { leadIds, updates } = body;
    
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Lead IDs are required" },
        { status: 400 }
      );
    }
    
    // Update multiple leads
    const updatedLeads = await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
        userId // Ensure user can only update their own leads
      },
      data: updates
    });
    
    return NextResponse.json({
      success: true,
      updated: updatedLeads.count,
      message: `Successfully updated ${updatedLeads.count} leads`
    });
    
  } catch (error: any) {
    console.error("Bulk update leads error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update leads" },
      { status: 500 }
    );
  }
}
