import { NextRequest, NextResponse } from "next/server";
import { getFormUserId } from "@/lib/auth";
import { listSubmissions } from "@/lib/submissions";

export async function GET(request: NextRequest) {
  const userId = await getFormUserId(request);
  if (!userId || userId === "legacy") return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  const campaign = request.nextUrl.searchParams.get("campaign") || undefined;
  return NextResponse.json({ success: true, submissions: await listSubmissions(userId, campaign) });
}