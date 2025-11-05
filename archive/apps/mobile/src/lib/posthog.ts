/**
 * PostHog analytics and feature flags
 */

import Constants from "expo-constants";
import PostHog from "posthog-react-native";

import { parseSampleRate, scrubPII, shouldSampleEvent } from "@ibimina/lib";

const POSTHOG_API_KEY = Constants.expoConfig?.extra?.posthogApiKey;
const POSTHOG_HOST = Constants.expoConfig?.extra?.posthogHost || "https://app.posthog.com";
const ANALYTICS_SAMPLE_RATE = parseSampleRate(
  (Constants.expoConfig?.extra?.posthogSampleRate as string | undefined) ??
    (typeof process !== "undefined" ? process.env.POSTHOG_CAPTURE_SAMPLE_RATE : undefined),
  __DEV__ ? 1 : 0.35
);

let posthogInstance: PostHog | null = null;

/**
 * Initialize PostHog analytics
 */
export async function initPostHog() {
  if (!POSTHOG_API_KEY) {
    console.warn("[PostHog] No API key configured, skipping initialization");
    return null;
  }

  try {
    posthogInstance = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      captureApplicationLifecycleEvents: true,
      captureDeepLinks: true,
    });

    return posthogInstance;
  } catch (error) {
    console.error("[PostHog] Initialization failed:", error);
    return null;
  }
}

/**
 * Get PostHog instance
 */
export function getPostHog(): PostHog | null {
  return posthogInstance;
}

const resolveDistinctId = () => {
  try {
    return posthogInstance?.getDistinctId();
  } catch (error) {
    console.warn("[PostHog] Failed to resolve distinct id", error);
    return undefined;
  }
};

/**
 * Identify user
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (!posthogInstance) return;
  const scrubbed = properties ? scrubPII(properties) : undefined;
  posthogInstance.identify(userId, scrubbed);
}

/**
 * Track custom event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (!posthogInstance) return;
  if (
    !shouldSampleEvent({
      event: eventName,
      distinctId: resolveDistinctId(),
      sampleRate: ANALYTICS_SAMPLE_RATE,
    })
  ) {
    return;
  }

  posthogInstance.capture(eventName, properties ? scrubPII(properties) : undefined);
}

/**
 * Track screen view
 */
export function trackScreen(screenName: string, properties?: Record<string, any>) {
  if (!posthogInstance) return;
  if (
    !shouldSampleEvent({
      event: `screen:${screenName}`,
      distinctId: resolveDistinctId(),
      sampleRate: ANALYTICS_SAMPLE_RATE,
    })
  ) {
    return;
  }

  posthogInstance.screen(screenName, properties ? scrubPII(properties) : undefined);
}

/**
 * Check if feature flag is enabled
 */
export async function isFeatureEnabled(flagKey: string): Promise<boolean> {
  if (!posthogInstance) return false;

  try {
    return await posthogInstance.isFeatureEnabled(flagKey);
  } catch (error) {
    console.error(`[PostHog] Error checking feature flag ${flagKey}:`, error);
    return false;
  }
}

/**
 * Get feature flag value
 */
export async function getFeatureFlagValue(flagKey: string): Promise<any> {
  if (!posthogInstance) return null;

  try {
    return await posthogInstance.getFeatureFlag(flagKey);
  } catch (error) {
    console.error(`[PostHog] Error getting feature flag ${flagKey}:`, error);
    return null;
  }
}

/**
 * Reset user session
 */
export function resetPostHog() {
  posthogInstance?.reset();
}

export { PostHog };
