import { NextResponse } from "next/server";
import { clearFormUserSession } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearFormUserSession(response);
  return response;
}