import type { NextRequest } from "next/server";

export function getClientIp(request: NextRequest): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstAddress = forwarded.split(",")[0]?.trim();
    if (firstAddress) return firstAddress;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || undefined;
}
