import { NextRequest, NextResponse } from "next/server";
import { saveCampaign, CampaignConfig } from "@/lib/campaigns";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Process string fields
    const slug = formData.get("slug") as string;
    if (!slug) {
      return NextResponse.json({ success: false, error: "Slug is required" }, { status: 400 });
    }

    const config: CampaignConfig = {
      slug,
      visuals: {
        primaryColor: (formData.get("primaryColor") as string) || undefined,
      },
      content: {
        eyebrow: (formData.get("eyebrow") as string) || "SAGA / RESEARCH BRIEF",
        title: (formData.get("title") as string) || "Make the next decision with a clearer view.",
        introCopy: (formData.get("introCopy") as string) || "Get the practical selection guide.",
        guideNoteNumber: (formData.get("guideNoteNumber") as string) || "01",
        guideNoteText: (formData.get("guideNoteText") as string) || "One concise guide for teams weighing their next system.",
        formEyebrow: (formData.get("formEyebrow") as string) || "YOUR DETAILS",
        formTitle: (formData.get("formTitle") as string) || "Send me the guide",
      },
      formConfig: {
        submitButtonText: (formData.get("submitButtonText") as string) || "Submit",
        customFields: JSON.parse((formData.get("customFields") as string) || "[]"),
      },
      selectHubConfig: {
        lead_source: (formData.get("lead_source") as string) || "SAGA-PPL",
        campaign: (formData.get("campaign") as string) || "asset_request",
        category: (formData.get("category") as string) || "HR Management Software",
        category_slug: (formData.get("category_slug") as string) || "",
        survey_slug: (formData.get("survey_slug") as string) || "",
        asset_type: (formData.get("asset_type") as string) || "Selection Guide",
        team: (formData.get("team") as string) || "",
        contract_po_number: (formData.get("contract_po_number") as string) || "SAGA-HR-Global",
        campaign_name: (formData.get("campaign_name") as string) || "SAGA HRIS Systems ADP VS BattleCard 26",
        page_url: (formData.get("page_url") as string) || "https://get.softwarebattlecard.com/",
        user_journey: (formData.get("user_journey") as string) || "HRIS BattleCard, ADP vs BambooHR vs Workday vs Rippling PPL",
        timeframe_to_decision: (formData.get("timeframe_to_decision") as string) || "",
      }
    };

    // Process file uploads
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const logoFile = formData.get("logo") as File | null;
    if (logoFile && logoFile.size > 0) {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const ext = path.extname(logoFile.name);
      const filename = `${slug}-logo${ext}`;
      await fs.writeFile(path.join(uploadsDir, filename), buffer);
      config.visuals.logoUrl = `/uploads/${filename}`;
    }

    const coverFile = formData.get("coverImage") as File | null;
    if (coverFile && coverFile.size > 0) {
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const ext = path.extname(coverFile.name);
      const filename = `${slug}-cover${ext}`;
      await fs.writeFile(path.join(uploadsDir, filename), buffer);
      config.visuals.coverImageUrl = `/uploads/${filename}`;
    }

    await saveCampaign(config);

    return NextResponse.json({ success: true, slug: config.slug });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ success: false, error: "Failed to create campaign" }, { status: 500 });
  }
}
