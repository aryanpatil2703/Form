import { NextResponse } from "next/server";
import { listSubmissions } from "@/lib/submissions";

export async function GET() {
  try {
    return NextResponse.json({ success: true, submissions: await listSubmissions() });
  } catch (error) {
    console.error("Failed to list submissions", error);
    return NextResponse.json({ success: false, message: "Unable to load submissions." }, { status: 500 });
  }
}
