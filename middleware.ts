import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/dashboard", "/documents", "/admin", "/account"];
const COOKIE_NAME = "heptapus_session";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (!protectedRoute) return NextResponse.next();

  if (!request.cookies.get(COOKIE_NAME)?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/documents/:path*", "/admin/:path*", "/account/:path*"]
};
