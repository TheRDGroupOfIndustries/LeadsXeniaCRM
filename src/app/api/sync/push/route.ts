import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Sync is disabled' },
    { status: 404 }
  );
}
