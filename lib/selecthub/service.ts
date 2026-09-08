import { SELECTHUB_RELAY_URL } from "./config";
import type { SelectHubPayload } from "./payload";

type SelectHubResult =
  | { success: true }
  | { success: false; error: "timeout" | "network" | "upstream"; status?: number };

export async function submitLeadToSelectHub(payload: SelectHubPayload): Promise<SelectHubResult> {
  if (process.env.SELECTHUB_MOCK === "true" && process.env.NODE_ENV !== "production") {
    return { success: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(SELECTHUB_RELAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error(`SelectHub Relay returned HTTP ${response.status}`);
      return { success: false, error: "upstream", status: response.status };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error && error.name === "AbortError" ? "timeout" : "network" };
  } finally {
    clearTimeout(timeout);
  }
}
