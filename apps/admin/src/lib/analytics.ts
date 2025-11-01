"use client";

import { useEffect } from "react";
import posthog, { type PostHog } from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

type AnalyticsState = "disabled" | "initialising" | "ready";

let status: AnalyticsState = "disabled";
let client: PostHog | null = null;
const readyListeners = new Set<(client: PostHog) => void>();

function notifyReady(activeClient: PostHog) {
  if (!readyListeners.size) {
    return;
  }

  const listeners = Array.from(readyListeners);
  readyListeners.clear();
  listeners.forEach((listener) => {
    try {
      listener(activeClient);
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true") {
        console.error("[analytics:listener-error]", error);
      }
    }
  });
}

function onReady(listener: (activeClient: PostHog) => void) {
  if (status === "ready" && client) {
    listener(client);
    return () => {};
  }

  readyListeners.add(listener);
  return () => {
    readyListeners.delete(listener);
  };
}

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
        notifyReady(activeClient);
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
    const runWhenReady = (activeClient: PostHog) => {
      activeClient.capture("page_view", { path: window.location.pathname, app: "admin" });
      identifyUser?.();
    };

    const dispose = onReady(runWhenReady);
    const client = ensureClient();
    if (client && status === "ready") {
      runWhenReady(client);
    }

    return dispose;
  }, [identifyUser]);

  return null;
}
