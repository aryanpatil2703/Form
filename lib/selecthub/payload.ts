import { randomUUID } from "crypto";
import type { LeadData } from "./validation";

export type SelectHubPayload = LeadData &
  Record<string, string> & {
    scorecard_id: string;
    ip_address: string;
  };

export function buildSelectHubPayload(lead: LeadData, campaignConfig: Record<string, string>, ipAddress?: string): SelectHubPayload {
  const scorecardId = randomUUID();
  return {
    ...lead,
    scorecard_id: scorecardId,
    ...campaignConfig,
    ip_address: ipAddress ?? "",
  };
}
