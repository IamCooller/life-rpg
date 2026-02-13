import { NextRequest, NextResponse } from "next/server";

// Simple middleware that checks for session cookie
// We can't use the full `auth()` function here because
// MongoDB driver doesn't work in Edge Runtime.
// Instead we check for the NextAuth session cookie.
export function middleware(req: NextRequest) {
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!sessionToken;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");
  const isPublicApi = req.nextUrl.pathname.startsWith("/api/graphql");

  // Allow auth API routes and GraphQL (has its own auth)
  if (isApiAuth || isPublicApi) return NextResponse.next();

  // Redirect logged-in users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Redirect unauthenticated users to login
  if (!isAuthPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|sounds|avatars).*)",
  ],
};
