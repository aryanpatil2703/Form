import { NextRequest, NextResponse } from "next/server";
import { listSubmissions } from "@/lib/submissions";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ success: true, submissions: await listSubmissions(undefined, request.nextUrl.searchParams.get("campaign") || undefined) });
  } catch (error) {
    console.error("Failed to list submissions", error);
    return NextResponse.json({ success: false, message: "Unable to load submissions." }, { status: 500 });
  }
}
