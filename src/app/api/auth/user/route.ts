import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json({ users });
  } catch (error: any) {
    const msg = error && error.message ? String(error.message) : "Failed to fetch users";
    console.error("Auth user GET error:", error);
    if (msg.includes("Can't reach database server") || msg.includes('PrismaClientInitializationError')) {
      return NextResponse.json({ users: [], warning: 'Database unreachable. Showing empty results.' });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Find the user first
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Now delete the user
    await prisma.user.delete({ where: { email } });

    return NextResponse.json({ message: "User deleted" });
  } catch (error: any) {
    const msg = error && error.message ? String(error.message) : "Failed to delete user";
    console.error("Auth user DELETE error:", error);
    if (msg.includes("Can't reach database server") || msg.includes('PrismaClientInitializationError')) {
      return NextResponse.json({ error: 'Database unreachable. Could not perform delete at this time.' }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}