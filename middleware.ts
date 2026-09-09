import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession, hasFormUserSession } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/");
  const isLogin = pathname === "/admin/login" || pathname === "/api/admin/login";
  if (isAdminArea) {
    if (isLogin || await hasAdminSession(request)) return NextResponse.next();
    if (pathname.startsWith("/api/")) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const isFormApi = pathname === "/api/selecthub";
  const isCampaignPage = pathname !== "/login" && pathname !== "/dashboard" && !pathname.startsWith("/api/");
  if (pathname === "/dashboard") {
    if (await hasFormUserSession(request)) return NextResponse.next();
    return NextResponse.redirect(new URL("/login?next=/dashboard", request.url));
  }
  if (!isFormApi && !isCampaignPage) return NextResponse.next();
  if (await hasFormUserSession(request)) return NextResponse.next();
  if (isFormApi) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*", "/api/selecthub", "/dashboard", "/:slug"] };
