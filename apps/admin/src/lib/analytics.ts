"use client";

import { useEffect } from "react";
import posthog, { type PostHog } from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

type AnalyticsState = "disabled" | "initialising" | "ready";

let status: AnalyticsState = "disabled";
let client: PostHog | null = null;

function ensureClient(): PostHog | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!POSTHOG_KEY) {
    status = "disabled";
    client = null;
    return null;
  }

  if (status === "disabled") {
    status = "initialising";
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false,
      persistence: "memory",
      autocapture: false,
      property_blacklist: ["email", "phone"],
      mask_all_text: true,
      loaded(activeClient) {
        status = "ready";
        client = activeClient;
        activeClient.capture("app_loaded", { app: "admin" });
      },
    });
  }

  if (status === "ready" && client) {
    return client;
  }

  return posthog;
}

export type TrackEvent =
  | string
  | {
      event: string;
      properties?: Record<string, unknown>;
    };

export async function track(
  event: TrackEvent,
  properties?: Record<string, unknown>
): Promise<void> {
  const payload = typeof event === "string" ? { event, properties } : event;

  const client = ensureClient();

  if (!client || status !== "ready") {
    if (process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true") {
      console.debug("[analytics:buffered]", payload);
    }
    if (typeof window === "undefined") {
      return;
    }

    // queue once client becomes ready
    window.setTimeout(() => {
      const activeClient = ensureClient();
      if (activeClient && status === "ready") {
        activeClient.capture(payload.event, {
          ...(payload.properties ?? properties),
          app: "admin",
        });
      }
    }, 250);
    return;
  }

  client.capture(payload.event, {
    ...(payload.properties ?? properties),
    app: "admin",
  });
}

export type AnalyticsProps = {
  identifyUser?: () => void;
};

export function Analytics({ identifyUser }: AnalyticsProps): null {
  useEffect(() => {
    const client = ensureClient();
    if (client && status === "ready") {
      client.capture("page_view", { path: window.location.pathname, app: "admin" });
      identifyUser?.();
    }
  }, [identifyUser]);

  return null;
}
