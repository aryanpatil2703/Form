import { NextRequest, NextResponse } from "next/server";
import { getFormUserId } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { getCampaigns } from "@/lib/campaigns";

export async function GET(request: NextRequest) {
  const userId = await getFormUserId(request);
  if (!userId || userId === "legacy") return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ success: false, message: "User not found." }, { status: 401 });
  const campaigns = await getCampaigns();
  return NextResponse.json({ success: true, user: { username: user.username, displayName: user.displayName }, campaigns: campaigns.filter((campaign) => user.allowedCampaigns.includes("*") || user.allowedCampaigns.includes(campaign.slug)) });
}