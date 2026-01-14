import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ✅ Extend NextRequest type temporarily to include `auth`
interface AuthenticatedRequest extends NextRequest {
  auth?: {
    user?: {
      id?: string;
      name?: string;
      email?: string;
      role?: string;
    };
  } | null;
}

// Public routes
const publicRoutes = ["/api/auth", "/login", "/public"];

export default auth(async (req: AuthenticatedRequest) => {
  const { nextUrl } = req;

  // ✅ Allow static & internal files
  if (
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname.startsWith("/static") ||
    nextUrl.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic = publicRoutes.some((path) =>
    nextUrl.pathname.startsWith(path)
  );

  // ✅ If user is already logged in, redirect away from /login
  if (req.auth && nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ✅ Allow public routes
  if (isPublic) return NextResponse.next();

  // 🚫 Redirect unauthenticated users
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
