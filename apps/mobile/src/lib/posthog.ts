/**
 * PostHog analytics and feature flags
 */

import PostHog from "posthog-react-native";
import Constants from "expo-constants";

const POSTHOG_API_KEY = Constants.expoConfig?.extra?.posthogApiKey;
const POSTHOG_HOST = Constants.expoConfig?.extra?.posthogHost || "https://app.posthog.com";

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

/**
 * Identify user
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  posthogInstance?.identify(userId, properties);
}

/**
 * Track custom event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  posthogInstance?.capture(eventName, properties);
}

/**
 * Track screen view
 */
export function trackScreen(screenName: string, properties?: Record<string, any>) {
  posthogInstance?.screen(screenName, properties);
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
