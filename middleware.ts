import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/");
  const isLogin = pathname === "/admin/login" || pathname === "/api/admin/login";
  if (!isAdminArea || isLogin || await hasAdminSession(request)) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
