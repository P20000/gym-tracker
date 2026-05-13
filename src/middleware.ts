import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "gym-tracker-local-secret-key-1234567890"
);

export async function middleware(request: NextRequest) {
  const { nextUrl, cookies } = request;
  const token = cookies.get("gym_auth_token")?.value;

  const isAuthPage = nextUrl.pathname.startsWith("/login");
  const isPublicAsset =
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname.startsWith("/favicon.ico");

  if (isPublicAsset) {
    return NextResponse.next();
  }

  let payload = null;
  if (token) {
    try {
      const { payload: decoded } = await jwtVerify(token, JWT_SECRET);
      payload = decoded;
    } catch (err) {
      // Invalid or expired JWT - clear cookie and let flow continue (it will redirect below)
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("gym_auth_token");
      return response;
    }
  }

  // 1. Not logged in and trying to access a protected route
  if (!payload && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Logged in and trying to access the login page
  if (payload && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
