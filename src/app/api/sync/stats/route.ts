import { NextResponse } from 'next/server';

/**
 * GET /api/sync/stats
 * Get sync statistics
 */
export async function GET(req: Request) {
  return NextResponse.json(
    { error: 'Sync is disabled' },
    { status: 404 }
  );
}

/**
 * POST /api/sync/trigger
 * Manually trigger synchronization
 */
export async function POST(req: Request) {
  return NextResponse.json(
    { error: 'Sync is disabled' },
    { status: 404 }
  );
}
