import { NextResponse } from 'next/server';

export async function GET() {
  // Check if DESKTOP_MODE is set in environment
  const isDesktop = process.env.DESKTOP_MODE === 'true' || 
                   process.env.NODE_ENV === 'production' && 
                   (process.env.DATABASE_URL?.includes('file:') || false);
  
  return NextResponse.json({ 
    isDesktop,
    mode: isDesktop ? 'desktop' : 'webapp'
  });
}
