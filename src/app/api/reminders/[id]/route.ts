import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Get a specific reminder
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = session?.user;
    
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { id } = await context.params;
    const userId = user.id as string;
    
    let reminder: any = null;
    try {
      reminder = await prisma.reminder.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          Lead: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true,
              tag: true,
            },
          },
        },
      });
    } catch (dbErr: any) {
      const msg = dbErr?.message ? String(dbErr.message) : String(dbErr);
      const isConnectivityIssue =
        msg.includes("Can't reach database server") ||
        msg.includes('PrismaClientInitializationError') ||
        msg.includes('P1001') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('ETIMEDOUT');
      if (isConnectivityIssue) {
        return NextResponse.json(
          { success: false, error: "Database unreachable. Please try again later." },
          { status: 503 }
        );
      }
      throw dbErr;
    }
    
    if (!reminder) {
      return NextResponse.json(
        { success: false, error: "Reminder not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      reminder
    });
    
  } catch (error: any) {
    const msg = error?.message ? String(error.message) : String(error);
    console.warn("Get reminder error:", msg);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reminder" },
      { status: 500 }
    );
  }
}

// Update a reminder
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = session?.user;
    
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { id } = await context.params;
    const userId = user.id as string;
    const body = await req.json();
    
    // Check if reminder exists and belongs to user
    let existingReminder: any = null;
    try {
      existingReminder = await prisma.reminder.findFirst({
        where: { id, userId }
      });
    } catch (dbErr: any) {
      const msg = dbErr?.message ? String(dbErr.message) : String(dbErr);
      const isConnectivityIssue =
        msg.includes("Can't reach database server") ||
        msg.includes('PrismaClientInitializationError') ||
        msg.includes('P1001') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('ETIMEDOUT');
      if (isConnectivityIssue) {
        return NextResponse.json(
          { success: false, error: "Database unreachable. Please try again later." },
          { status: 503 }
        );
      }
      throw dbErr;
    }
    
    if (!existingReminder) {
      return NextResponse.json(
        { success: false, error: "Reminder not found" },
        { status: 404 }
      );
    }
    
    const { title, description, reminderDate, reminderType, priority, isCompleted } = body;
    
    let updatedReminder: any = null;
    try {
      updatedReminder = await prisma.reminder.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(reminderDate && { reminderDate: new Date(reminderDate) }),
          ...(reminderType && { reminderType }),
          ...(priority && { priority }),
          ...(isCompleted !== undefined && { isCompleted }),
          updatedAt: new Date()
        },
        include: {
          Lead: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true
            }
          }
        }
      });
    } catch (dbErr: any) {
      const msg = dbErr?.message ? String(dbErr.message) : String(dbErr);
      const isConnectivityIssue =
        msg.includes("Can't reach database server") ||
        msg.includes('PrismaClientInitializationError') ||
        msg.includes('P1001') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('ETIMEDOUT');
      if (isConnectivityIssue) {
        return NextResponse.json(
          { success: false, error: "Database unreachable. Please try again later." },
          { status: 503 }
        );
      }
      throw dbErr;
    }
    
    return NextResponse.json({
      success: true,
      reminder: updatedReminder,
      message: "Reminder updated successfully"
    });
    
  } catch (error: any) {
    const msg = error?.message ? String(error.message) : String(error);
    console.warn("Update reminder error:", msg);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update reminder" },
      { status: 500 }
    );
  }
}

// Delete a reminder
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = session?.user;
    
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { id } = await context.params;
    const userId = user.id as string;
    
    // Check if reminder exists and belongs to user
    let existingReminder: any = null;
    try {
      existingReminder = await prisma.reminder.findFirst({
        where: { id, userId }
      });
    } catch (dbErr: any) {
      const msg = dbErr?.message ? String(dbErr.message) : String(dbErr);
      const isConnectivityIssue =
        msg.includes("Can't reach database server") ||
        msg.includes('PrismaClientInitializationError') ||
        msg.includes('P1001') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('ETIMEDOUT');
      if (isConnectivityIssue) {
        return NextResponse.json(
          { success: false, error: "Database unreachable. Please try again later." },
          { status: 503 }
        );
      }
      throw dbErr;
    }

    if (!existingReminder) {
      return NextResponse.json(
        { success: false, error: "Reminder not found" },
        { status: 404 }
      );
    }

    try {
      await prisma.reminder.delete({
        where: { id }
      });
    } catch (dbErr: any) {
      const msg = dbErr?.message ? String(dbErr.message) : String(dbErr);
      const isConnectivityIssue =
        msg.includes("Can't reach database server") ||
        msg.includes('PrismaClientInitializationError') ||
        msg.includes('P1001') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('ETIMEDOUT');
      if (isConnectivityIssue) {
        return NextResponse.json(
          { success: false, error: "Database unreachable. Please try again later." },
          { status: 503 }
        );
      }
      throw dbErr;
    }

    return NextResponse.json({
      success: true,
      message: "Reminder deleted successfully"
    });
    
  } catch (error: any) {
    const msg = error?.message ? String(error.message) : String(error);
    console.warn("Delete reminder error:", msg);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete reminder" },
      { status: 500 }
    );
  }
}