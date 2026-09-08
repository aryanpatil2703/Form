import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/selecthub/client-ip";
import { buildSelectHubPayload } from "@/lib/selecthub/payload";
import { submitLeadToSelectHub } from "@/lib/selecthub/service";
import { leadSchema, validationErrors } from "@/lib/selecthub/validation";
import { getCampaignBySlug } from "@/lib/campaigns";
import { createSubmission, hasDurableSubmissionStore, updateSubmission } from "@/lib/submissions";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Please submit valid form data." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ success: false, message: "Please submit valid form data." }, { status: 400 });
  }

  const { campaignSlug, ...leadBody } = body as Record<string, unknown>;
  if (typeof campaignSlug !== "string" || !campaignSlug.trim()) {
    return NextResponse.json({ success: false, message: "Campaign slug is missing." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(leadBody);
  if (!parsed.success) {
    console.warn("SelectHub validation failed");
    return NextResponse.json(
      { success: false, message: "Please correct the highlighted fields.", errors: validationErrors(parsed.error) },
      { status: 400 },
    );
  }

  const campaign = await getCampaignBySlug(campaignSlug.trim());
  if (!campaign) {
    return NextResponse.json({ success: false, message: "Campaign not found." }, { status: 404 });
  }

  if (!hasDurableSubmissionStore()) {
    console.error("Submission storage is not configured for production");
    return NextResponse.json({ success: false, message: "Submission service is not configured." }, { status: 503 });
  }

  const payload = buildSelectHubPayload(parsed.data, campaign.selectHubConfig, getClientIp(request));
  const submissionId = randomUUID();
  await createSubmission({
    id: submissionId,
    created_at: new Date().toISOString(),
    status: "pending",
    campaign_slug: campaign.slug,
    scorecard_id: payload.scorecard_id,
    lead: parsed.data,
    selecthub_payload: payload,
  });
  console.info("SelectHub submission started");
  const result = await submitLeadToSelectHub(payload);
  if (!result.success) {
    await updateSubmission(submissionId, "failed", result.error);
    console.error(`SelectHub submission failed: ${result.error}${result.status ? ` (HTTP ${result.status})` : ""}`);
    return NextResponse.json(
      { success: false, message: "We were unable to submit your information. Please try again." },
      { status: 502 },
    );
  }

  await updateSubmission(submissionId, "submitted");
  console.info("SelectHub submission successful");
  return NextResponse.json({ success: true, message: "Lead submitted successfully." });
}
