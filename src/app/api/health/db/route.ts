import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Test a simple query
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      success: true,
      status: "connected",
      message: "Database connection is healthy",
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Database health check failed:", error);
    
    return NextResponse.json({
      success: false,
      status: "disconnected",
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}