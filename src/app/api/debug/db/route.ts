import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Simple database + auth diagnostics endpoint
export async function GET(req: Request) {
  const url = new URL(req.url);
  const includeSample = url.searchParams.get('sample') === '1';
  try {
    const session = await auth();
    const token = session?.user;

    // Basic connectivity checks
    const leadCount = await prisma.lead.count();
    const userCount = await prisma.user.count();
    let reminderCount = 0;
    try {
      // Use a safe cast in case the Prisma client in the build environment doesn't include the model
      reminderCount = await (prisma as any).reminder?.count?.() ?? 0;
    } catch (e) {
      // If a runtime error occurs, leave reminderCount as 0 and continue
      console.warn("Reminder count not available in Prisma client:", e);
    }

    let sample: any = undefined;
    if (includeSample) {
      sample = await prisma.lead.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, status: true, amount: true },
      });
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      env: {
        hasDbUrl: Boolean(process.env.DATABASE_URL),
        nextauthUrl: process.env.NEXTAUTH_URL,
        hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
        hasAuthSecret: Boolean(process.env.AUTH_SECRET),
      },
      auth: token
        ? { present: true, userId: token.id, role: token.role, email: token.email }
        : { present: false },
      counts: { leads: leadCount, users: userCount, reminders: reminderCount },
      sample,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || 'Unknown error',
        stack: err?.stack,
      },
      { status: 500 }
    );
  }
}
