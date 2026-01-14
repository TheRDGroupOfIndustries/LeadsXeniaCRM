import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Auth Debug - Headers:', Object.fromEntries(req.headers.entries()));
    
    // Use NextAuth v5 session method instead of getToken
    const session = await auth();
    const user = session?.user;
    
    console.log('🔍 Session found:', session ? 'YES' : 'NO');
    console.log('🔍 User data:', user ? { id: user.id, email: user.email, role: user.role } : 'NONE');
    
    const cookies = req.cookies.getAll();
    console.log('🔍 All cookies:', cookies.map(c => ({ name: c.name, hasValue: !!c.value })));

    return NextResponse.json({ 
      success: true, 
      debug: {
        session: session ? {
          user: {
            id: user?.id,
            email: user?.email, 
            name: user?.name,
            role: user?.role
          },
          expires: session.expires
        } : null,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          NEXTAUTH_URL: process.env.NEXTAUTH_URL,
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
          hasAuthSecret: !!process.env.AUTH_SECRET
        },
        cookies: cookies.map(c => ({ name: c.name, hasValue: !!c.value }))
      }
    });
  } catch (error: any) {
    console.error('🚨 Auth debug error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}