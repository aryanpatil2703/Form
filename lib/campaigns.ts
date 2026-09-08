import fs from "fs/promises";
import path from "path";

export interface CampaignConfig {
  slug: string;
  visuals: {
    logoUrl?: string;
    coverImageUrl?: string;
    primaryColor?: string;
  };
  content: {
    eyebrow: string;
    title: string;
    introCopy: string;
    guideNoteNumber?: string;
    guideNoteText?: string;
    formEyebrow?: string;
    formTitle?: string;
  };
  formConfig: {
    submitButtonText: string;
    customFields: { name: string; label: string; type: string }[];
  };
  selectHubConfig: {
    lead_source: string;
    campaign: string;
    category: string;
    asset_type: string;
    contract_po_number: string;
    campaign_name: string;
    page_url: string;
    user_journey: string;
  };
}

const dataFilePath = path.join(process.cwd(), "data", "campaigns.json");

export async function getCampaigns(): Promise<CampaignConfig[]> {
  try {
    const data = await fs.readFile(dataFilePath, "utf8");
    return JSON.parse(data) as CampaignConfig[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function getCampaignBySlug(slug: string): Promise<CampaignConfig | null> {
  const campaigns = await getCampaigns();
  return campaigns.find((c) => c.slug === slug) || null;
}

export async function saveCampaign(config: CampaignConfig): Promise<void> {
  const campaigns = await getCampaigns();
  const existingIndex = campaigns.findIndex((c) => c.slug === config.slug);
  
  if (existingIndex !== -1) {
    campaigns[existingIndex] = config;
  } else {
    campaigns.push(config);
  }
  
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(campaigns, null, 2), "utf8");
}
