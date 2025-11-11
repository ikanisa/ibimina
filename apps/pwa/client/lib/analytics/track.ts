/**
 * Lightweight analytics helper used across the client app.
 *
 * The helper attempts to forward events to PostHog or Google Analytics if
 * either library is available at runtime. When neither integration is present
 * (typical for development builds), events are written to the console so we can
 * still observe consent funnel activity.
 */

import { parseSampleRate, resolveEnvironment, scrubPII, shouldSampleEvent } from "@ibimina/lib";

export type AnalyticsProperties = Record<string, unknown> | undefined;

const environment = resolveEnvironment();
const analyticsSampleRate = parseSampleRate(
  process.env.NEXT_PUBLIC_POSTHOG_SAMPLE_RATE ?? process.env.POSTHOG_CAPTURE_SAMPLE_RATE,
  environment === "production" ? 0.35 : 1
);

const getDistinctId = (): string | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const posthog = window.posthog as
      | (Window["posthog"] & { get_distinct_id?: () => string | undefined })
      | undefined;
    return posthog?.get_distinct_id?.();
  } catch (error) {
    console.warn("[analytics] Failed to resolve distinct id", error);
    return undefined;
  }
};

/**
 * Capture an analytics event in a safe, no-throw manner.
 */
export function trackEvent(eventName: string, properties?: AnalyticsProperties): void {
  try {
    if (typeof window === "undefined") {
      console.info(`[analytics:${eventName}]`, properties ?? {});
      return;
    }

    if (
      !shouldSampleEvent({
        event: eventName,
        distinctId: getDistinctId(),
        sampleRate: analyticsSampleRate,
      })
    ) {
      return;
    }

    const scrubbedProperties = properties ? scrubPII(properties) : {};

    if (window.posthog?.capture) {
      window.posthog.capture(eventName, scrubbedProperties);
      return;
    }

    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, scrubbedProperties);
      return;
    }

    console.info(`[analytics:${eventName}]`, scrubbedProperties);
  } catch (error) {
    console.warn(`Analytics dispatch failed for ${eventName}`, error);
  }
}

declare global {
  interface Window {
    posthog?: {
      capture: (eventName: string, properties?: Record<string, unknown>) => void;
      get_distinct_id?: () => string | undefined;
    };
    gtag?: (...args: unknown[]) => void;
  }
}
