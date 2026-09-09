import { NextRequest, NextResponse } from "next/server";
import { isValidFormUserCredentials, setFormUserSession } from "@/lib/auth";
import { authenticateUser } from "@/lib/users";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { username?: string; email?: string; password?: string } | null;
  const username = body?.username || body?.email || "";
  const user = body?.password ? await authenticateUser(username, body.password) : null;
  const legacy = body?.password && isValidFormUserCredentials(username, body.password);
  if ((!user && !legacy) || !username || !body?.password) {
    return NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 });
  }
  const response = NextResponse.json({ success: true });
  await setFormUserSession(response, user?.id || "legacy");
  return response;
}