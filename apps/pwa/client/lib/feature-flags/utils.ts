/**
 * Feature Flag Utilities
 *
 * Shared utilities for feature flags that can be used on both server and client.
 */

export type FeatureFlags = {
  [key: string]: boolean;
};

/**
 * Normalise a feature flag key.
 *
 * Converts camelCase, PascalCase, snake_case, and space separated names into
 * kebab-case strings for consistent lookups.
 */
export function normalizeFlagKey(rawKey: string): string {
  return rawKey
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/**
 * Parse feature flags from environment variables
 *
 * Extracts all NEXT_PUBLIC_FEATURE_FLAG_* environment variables,
 * converts them to kebab-case, and parses their boolean values.
 *
 * @returns Object mapping flag names to boolean values
 */
export function parseFeatureFlagsFromEnv(env: NodeJS.ProcessEnv = process.env): FeatureFlags {
  const envFlags: FeatureFlags = {};

  Object.entries(env).forEach(([key, value]) => {
    if (key.startsWith("NEXT_PUBLIC_FEATURE_FLAG_")) {
      const flagName = normalizeFlagKey(key.replace("NEXT_PUBLIC_FEATURE_FLAG_", ""));
      envFlags[flagName] = value === "true" || value === "1";
    }
  });

  return envFlags;
}

/**
 * Merge feature flag sources, giving precedence to overrides.
 */
export function mergeFeatureFlagSources(
  base: FeatureFlags,
  overrides?: FeatureFlags | null
): FeatureFlags {
  return {
    ...base,
    ...(overrides ?? {}),
  };
}
