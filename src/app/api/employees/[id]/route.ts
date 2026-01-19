import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  role?: string;
  subscription?: string;
  password?: string;
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await auth();
    const user = session?.user;
    
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Only admins can update employee details
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    try {
      // Check if employee exists
      const existingEmployee = await prisma.user.findUnique({
        where: { id: id }
      });

      if (!existingEmployee) {
        return NextResponse.json(
          { success: false, error: "Employee not found" },
          { status: 404 }
        );
      }

      const body = (await req.json()) as UpdateEmployeeRequest;
      const updateData: any = {};

      // Validate and prepare update data
      if (body.name !== undefined) {
        if (!body.name.trim()) {
          return NextResponse.json(
            { success: false, error: "Name cannot be empty" },
            { status: 400 }
          );
        }
        updateData.name = body.name.trim();
      }

      if (body.email !== undefined) {
        if (!body.email.trim()) {
          return NextResponse.json(
            { success: false, error: "Email cannot be empty" },
            { status: 400 }
          );
        }
        
        // Check if email is already taken by another user
        const emailExists = await prisma.user.findFirst({
          where: {
            email: body.email.trim(),
            id: { not: id }
          }
        });
        
        if (emailExists) {
          return NextResponse.json(
            { success: false, error: "Email is already taken" },
            { status: 400 }
          );
        }
        
        updateData.email = body.email.trim();
      }

      if (body.role !== undefined) {
        if (!["ADMIN", "EMPLOYEE", "USER"].includes(body.role)) {
          return NextResponse.json(
            { success: false, error: "Invalid role. Must be ADMIN, EMPLOYEE, or USER" },
            { status: 400 }
          );
        }
        updateData.role = body.role;
        
        // Auto-set PREMIUM subscription for ADMIN role
        if (body.role === "ADMIN") {
          updateData.subscription = "PREMIUM";
        }
      }

      if (body.subscription !== undefined) {
        if (!["FREE", "PREMIUM"].includes(body.subscription)) {
          return NextResponse.json(
            { success: false, error: "Invalid subscription. Must be FREE or PREMIUM" },
            { status: 400 }
          );
        }
        updateData.subscription = body.subscription;
      }

      if (body.password !== undefined && body.password.trim()) {
        if (body.password.length < 6) {
          return NextResponse.json(
            { success: false, error: "Password must be at least 6 characters" },
            { status: 400 }
          );
        }
        updateData.password = await bcrypt.hash(body.password, 12);
      }

      // Update the employee
      const updatedEmployee = await prisma.user.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          subscription: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      return NextResponse.json({
        success: true,
        employee: updatedEmployee
      });

    } catch (dbErr: any) {
      console.error("Database error during employee update:", dbErr);
      return NextResponse.json({
        success: false,
        error: "Database is currently unavailable. Please try updating the employee later."
      }, { status: 503 });
    }
  } catch (error: any) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await auth();
    const user = session?.user;
    
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Only admins can delete employees
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    try {
      // Check if employee exists
      const existingEmployee = await prisma.user.findUnique({
        where: { id: id }
      });

      if (!existingEmployee) {
        return NextResponse.json(
          { success: false, error: "Employee not found" },
          { status: 404 }
        );
      }

      // Prevent deleting the current admin user
      if (id === session.user?.id) {
        return NextResponse.json(
          { success: false, error: "Cannot delete your own account" },
          { status: 400 }
        );
      }

      // Delete the employee (this will cascade delete related leads and campaigns)
      await prisma.user.delete({
        where: { id }
      });

      return NextResponse.json({
        success: true,
        message: "Employee deleted successfully"
      });

    } catch (dbErr: any) {
      console.error("Database error during employee deletion:", dbErr);
      return NextResponse.json({
        success: false,
        error: "Database is currently unavailable. Please try deleting the employee later."
      }, { status: 503 });
    }
  } catch (error: any) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete employee" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Only admins can view employee details
    if (session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    try {
      const employee = await prisma.user.findUnique({
        where: { id: id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          subscription: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              Lead: true,
              Campaign: true
            }
          }
        }
      });

      if (!employee) {
        return NextResponse.json(
          { success: false, error: "Employee not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        employee
      });

    } catch (dbErr: any) {
      console.error("Database error during employee retrieval:", dbErr);
      return NextResponse.json({
        success: false,
        error: "Database is currently unavailable. Please try again later."
      }, { status: 503 });
    }
  } catch (error: any) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch employee" },
      { status: 500 }
    );
  }
}