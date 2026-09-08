import { NextRequest, NextResponse } from "next/server";
import { isAdminConfigured, isValidAdminCredentials, setAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) return NextResponse.json({ success: false, message: "Admin authentication is not configured." }, { status: 503 });
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  if (!body?.email || !body.password || !isValidAdminCredentials(body.email, body.password)) {
    return NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 });
  }
  const response = NextResponse.json({ success: true });
  await setAdminSession(response);
  return response;
}
