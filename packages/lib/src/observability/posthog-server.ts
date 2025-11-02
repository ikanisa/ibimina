import { PostHog } from "posthog-node";
import { scrubPII } from "./pii.js";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (client) {
    return client;
  }

  const apiKey = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) {
    return null;
  }

  client = new PostHog(apiKey, {
    host:
      process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });

  return client;
}

export async function captureServerEvent(
  event: string,
  properties: Record<string, unknown> = {},
  distinctId = "system"
): Promise<void> {
  const instance = getClient();
  if (!instance) {
    return;
  }

  try {
    instance.capture({
      distinctId,
      event,
      properties: {
        ...scrubPII(properties),
        app: properties.app ?? "admin",
      },
    });

    await instance.flush();
  } catch (error) {
    console.warn("[posthog] capture failed", error);
  }
}
