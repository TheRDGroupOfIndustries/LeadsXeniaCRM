// This is the correct code for an API file. It just sends data.
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id as string;
    const userRole = user.role as string;

    // Basic metrics derived from the leads table — keep this simple and safe.
    // try to fetch counts; if DB is unreachable, we'll catch and fallback below
    let totalLeads = 0;
    let convertedLeads = 0;
    let totalRevenue = 0;
    let activeEmployees = 0;
    let recentLeads: any[] = [];

    try {
      // Count active employees (all users regardless of role)
      activeEmployees = await prisma.user.count();

      if (userRole === "ADMIN") {
        // Admin sees all leads across all users
        const leadsList = await prisma.lead.findMany({ 
          orderBy: { createdAt: "desc" }, 
          take: 100,
          include: {
            User: {
              select: { name: true, email: true }
            }
          }
        });
        totalLeads = leadsList.length;
        convertedLeads = leadsList.filter((l: any) => l.status === "CONVERTED" || l.tag === "QUALIFIED").length;
        recentLeads = leadsList.slice(0, 5);
        
        // Calculate total revenue from converted leads and customers with amounts
        totalRevenue = leadsList
          .filter((l: any) => 
            (l.status === "CONVERTED" || l.tag === "QUALIFIED") && 
            l.amount && 
            parseFloat(l.amount.toString()) > 0
          )
          .reduce((sum: number, l: any) => sum + parseFloat(l.amount.toString()), 0);
      } else {
        // Employee sees only their own leads
        const leadsList = await prisma.lead.findMany({ 
          where: { userId }, 
          orderBy: { createdAt: "desc" }, 
          take: 100 
        });
        totalLeads = leadsList.length;
        convertedLeads = leadsList.filter((l: any) => l.status === "CONVERTED" || l.tag === "QUALIFIED").length;
        recentLeads = leadsList.slice(0, 5);
        
        // Calculate total revenue from converted leads and customers with amounts for this user
        totalRevenue = leadsList
          .filter((l: any) => 
            (l.status === "CONVERTED" || l.tag === "QUALIFIED") && 
            l.amount && 
            parseFloat(l.amount.toString()) > 0
          )
          .reduce((sum: number, l: any) => sum + parseFloat(l.amount.toString()), 0);
      }
    } catch (dbErr) {
      console.error("Database unavailable for metrics — returning fallback metrics:", dbErr);
      // keep defaults (activeEmployees will remain 0 as fallback)
    }

    const metrics = {
      totalRevenue: {
        value: totalRevenue,
        formatted: `$${totalRevenue.toFixed(2)}`,
        change: "0%",
        trend: "up",
        subtitle: totalRevenue > 0 ? `From ${convertedLeads} converted/qualified leads` : "No converted/qualified leads yet",
      },
      newLeads: {
        value: totalLeads,
        formatted: `${totalLeads}`,
        change: "0%",
        trend: "up",
        subtitle: userRole === "ADMIN" ? `${totalLeads} total leads (all users)` : `${totalLeads} your leads`,
      },
      activeEmployees: {
        value: activeEmployees,
        formatted: `${activeEmployees}`,
        change: "0%",
        trend: "up",
        subtitle: userRole === "ADMIN" ? "Total active employees" : "Current user only",
      },
      conversionRate: {
        value: convertedLeads,
        formatted: `${convertedLeads}`,
        change: "0%",
        trend: "up",
        subtitle: userRole === "ADMIN" ? `${convertedLeads} converted/qualified leads (all users)` : `${convertedLeads} your converted/qualified leads`,
      },
    };

    return NextResponse.json({ success: true, data: { metrics, recentLeads } });
  } catch (error: any) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch metrics" }, { status: 500 });
  }
}