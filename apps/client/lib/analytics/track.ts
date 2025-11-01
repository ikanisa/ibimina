/**
 * Lightweight analytics helper used across the client app.
 *
 * The helper attempts to forward events to PostHog or Google Analytics if
 * either library is available at runtime. When neither integration is present
 * (typical for development builds), events are written to the console so we can
 * still observe consent funnel activity.
 */

export type AnalyticsProperties = Record<string, unknown> | undefined;

/**
 * Capture an analytics event in a safe, no-throw manner.
 */
export function trackEvent(eventName: string, properties?: AnalyticsProperties): void {
  try {
    if (typeof window === "undefined") {
      console.info(`[analytics:${eventName}]`, properties ?? {});
      return;
    }

    if (window.posthog?.capture) {
      window.posthog.capture(eventName, properties ?? {});
      return;
    }

    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, properties ?? {});
      return;
    }

    console.info(`[analytics:${eventName}]`, properties ?? {});
  } catch (error) {
    console.warn(`Analytics dispatch failed for ${eventName}`, error);
  }
}

declare global {
  interface Window {
    posthog?: {
      capture: (eventName: string, properties?: Record<string, unknown>) => void;
    };
    gtag?: (...args: unknown[]) => void;
  }
}
