// SELECTHUB_CAMPAIGN removed, now dynamically loaded per campaign

export const COMPANY_SIZES = [
  "1 - 49",
  "50 - 99",
  "100 - 499",
  "500 - 999",
  "1000 - 4999",
  "5000 - 9999",
  "10000 - 19999",
  "20000+",
] as const;

export const IMPLEMENTATION_TIMELINES = [
  "0 - 6 months",
  "7 - 12 months",
  "More than 12 months",
  "Not decided yet",
] as const;

export const SELECTHUB_RELAY_URL =
  process.env.SELECTHUB_RELAY_URL || "https://prod-relay.herokuapp.com/api/relay";
