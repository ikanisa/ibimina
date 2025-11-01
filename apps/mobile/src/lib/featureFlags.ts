/**
 * Feature flags using ConfigCat
 */

import { createClient, IConfigCatClient, PollingMode } from "configcat-react";
import Constants from "expo-constants";

const CONFIGCAT_SDK_KEY = Constants.expoConfig?.extra?.configcatSdkKey;

let configCatClient: IConfigCatClient | null = null;

/**
 * Initialize ConfigCat client
 */
export function initFeatureFlags() {
  if (!CONFIGCAT_SDK_KEY) {
    console.warn("[ConfigCat] No SDK key configured, skipping initialization");
    return null;
  }

  configCatClient = createClient(CONFIGCAT_SDK_KEY, PollingMode.AutoPoll, {
    pollIntervalSeconds: 300, // Poll every 5 minutes
    setupHooks: (hooks) => {
      hooks.on("clientReady", () => {
        console.log("[ConfigCat] Client ready");
      });
      hooks.on("configChanged", () => {
        console.log("[ConfigCat] Config changed");
      });
    },
  });

  return configCatClient;
}

/**
 * Get feature flag value
 */
export async function getFeatureFlag<T>(
  key: string,
  defaultValue: T,
  userId?: string
): Promise<T> {
  if (!configCatClient) {
    console.warn(`[ConfigCat] Client not initialized, returning default for ${key}`);
    return defaultValue;
  }

  try {
    const value = await configCatClient.getValueAsync(key, defaultValue, {
      identifier: userId,
    });
    return value as T;
  } catch (error) {
    console.error(`[ConfigCat] Error getting flag ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Check if feature is enabled
 */
export async function isFeatureFlagEnabled(key: string, userId?: string): Promise<boolean> {
  return await getFeatureFlag(key, false, userId);
}

/**
 * Get all feature flag keys
 */
export async function getAllFeatureFlags(userId?: string): Promise<Record<string, any>> {
  if (!configCatClient) {
    console.warn("[ConfigCat] Client not initialized");
    return {};
  }

  try {
    const allKeys = await configCatClient.getAllKeysAsync();
    const flags: Record<string, any> = {};

    for (const key of allKeys) {
      flags[key] = await configCatClient.getValueAsync(key, null, {
        identifier: userId,
      });
    }

    return flags;
  } catch (error) {
    console.error("[ConfigCat] Error getting all flags:", error);
    return {};
  }
}

/**
 * Force refresh feature flags
 */
export async function refreshFeatureFlags(): Promise<void> {
  if (!configCatClient) {
    console.warn("[ConfigCat] Client not initialized");
    return;
  }

  try {
    await configCatClient.forceRefreshAsync();
    console.log("[ConfigCat] Flags refreshed");
  } catch (error) {
    console.error("[ConfigCat] Error refreshing flags:", error);
  }
}
