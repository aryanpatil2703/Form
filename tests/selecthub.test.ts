import assert from "node:assert/strict";
import test from "node:test";
import { buildSelectHubPayload } from "../lib/selecthub/payload";
import { leadSchema, type LeadData } from "../lib/selecthub/validation";

const validLead: LeadData = {
  email: "john@example.com", first_name: "John", last_name: "Doe", industry: "Technology", industry_other: "Software",
  function: "IT", title: "CTO", company_name: "ABC Technologies", company_size: "100 - 499", address: "123 Main Street",
  address_2: "", city: "Pune", state: "Maharashtra", zip: "411001", country: "India", phone_number: "+919999999999",
};

const mockConfig = {
  lead_source: "SAGA-PPL",
  campaign: "asset_request",
  category: "HR Management Software",
  asset_type: "Selection Guide",
  contract_po_number: "SAGA-HR-Global",
  campaign_name: "SAGA HRIS Systems ADP VS BattleCard 26",
  page_url: "https://get.softwarebattlecard.com/",
  user_journey: "HRIS BattleCard",
};

test("validates a complete lead and exact company size", () => {
  assert.equal(leadSchema.safeParse(validLead).success, true);
  assert.equal(leadSchema.safeParse({ ...validLead, company_size: "Medium" }).success, false);
});

test("generates a fresh UUID for every payload", () => {
  const first = buildSelectHubPayload(validLead, mockConfig, "203.0.113.10");
  const second = buildSelectHubPayload(validLead, mockConfig, "203.0.113.10");
  assert.match(first.scorecard_id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.notEqual(first.scorecard_id, second.scorecard_id);
  assert.equal(first.lead_source, "SAGA-PPL");
  assert.equal(first.ip_address, "203.0.113.10");
});

test("does not allow client metadata to control the payload", () => {
  const attackerBody = { ...validLead, scorecard_id: "ATTACKER_CONTROLLED_ID", campaign: "malicious" };
  const parsed = leadSchema.safeParse(attackerBody);
  assert.equal(parsed.success, false);
  const payload = buildSelectHubPayload(validLead, mockConfig);
  assert.notEqual(payload.scorecard_id, "ATTACKER_CONTROLLED_ID");
  assert.equal(payload.campaign, "asset_request");
});
