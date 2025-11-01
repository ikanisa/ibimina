import { scrubRecord } from "./pii";

export async function captureEdgeEvent(
  event: string,
  properties: Record<string, unknown> = {},
  distinctId = "edge"
): Promise<void> {
  const apiKey = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) {
    return;
  }

  const host =
    process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
  const endpoint = `${host.replace(/\/$/, "")}/capture/`;

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        properties: {
          ...scrubRecord(properties),
          app: properties.app ?? "client",
        },
      }),
    });
  } catch (error) {
    console.warn("[posthog-edge] capture failed", error);
  }
}
