import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/hash";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;
    
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Only admins can view employees
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }
    
    // Get all employees (users)
    // NOTE: Some deployments may not have the `Campaign` table yet (e.g. DB not migrated).
    // In that case, retry the query without Campaign counts so the Admin UI still loads.
    let employees: any[] = [];
    let campaignCountsAvailable = true;

    try {
      employees = await prisma.user.findMany({
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
              Campaign: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : "";
      const missingCampaignTable =
        msg.includes("public.Campaign") ||
        msg.includes('relation "Campaign" does not exist') ||
        msg.includes("The table `public.Campaign` does not exist");

      if (!missingCampaignTable) throw err;

      campaignCountsAvailable = false;
      employees = await prisma.user.findMany({
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
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }
    
    // Calculate stats
    const totalUsers = employees.length;
    const premiumUsers = employees.filter(emp => emp.subscription === 'PREMIUM').length;
    const freeUsers = employees.filter(emp => emp.subscription === 'FREE').length;
    const adminUsers = employees.filter(emp => emp.role === 'ADMIN').length;
    const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : "0";
    
    // Calculate activity metrics
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentlyActive = employees.filter(emp => 
      new Date(emp.updatedAt) >= oneMonthAgo
    ).length;
    
    return NextResponse.json({
      success: true,
      employees: employees.map(emp => ({
        ...emp,
        _count: {
          leads: emp._count?.Lead || 0,
          campaigns: campaignCountsAvailable ? (emp._count?.Campaign || 0) : 0
        }
      })),
      stats: {
        total: totalUsers,
        admins: adminUsers,
        employees: totalUsers - adminUsers,
        premium: premiumUsers,
        free: freeUsers,
        recentlyActive,
        activePercentage: totalUsers > 0 ? 
          (recentlyActive / totalUsers * 100).toFixed(1) : "0"
      }
    });
    
  } catch (error: any) {
    console.error("Employees API error:", error);
    // If the error is a Prisma connection issue, return a safe empty payload so the admin UI
    // can display a friendly message instead of the server throwing a 500.
    const msg = (error && error.message) ? String(error.message) : "Failed to fetch employees";
    if (msg.includes("Can't reach database server") || msg.includes('PrismaClientInitializationError')) {
      return NextResponse.json({
        success: true,
        employees: [],
        stats: {
          total: 0,
          admins: 0,
          employees: 0,
          premium: 0,
          free: 0,
          recentlyActive: 0,
          activePercentage: "0"
        },
        warning: 'Database unreachable. Showing empty results.'
      });
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;
    
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Only admins can create employees
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }
    
    const { name, email, password, role, subscription } = await req.json();
    
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 400 }
      );
    }
    
    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    
    // Determine subscription: ADMINs are automatically PREMIUM
    const finalRole = role || "EMPLOYEE";
    const finalSubscription = finalRole === "ADMIN" ? "PREMIUM" : (subscription || "FREE");
    
    const newEmployee = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: finalRole,
        subscription: finalSubscription
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscription: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({
      success: true,
      employee: newEmployee,
      message: "Employee created successfully"
    });
    
  } catch (error: any) {
    console.error("Create employee error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create employee" },
      { status: 500 }
    );
  }
}