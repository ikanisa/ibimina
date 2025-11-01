"use client";

import React, { createContext, ReactNode, useMemo } from "react";

/**
 * Feature Flag Configuration
 *
 * This type defines the structure of feature flags in the application.
 * Add new feature flags here as needed.
 */
export type FeatureFlags = {
  [key: string]: boolean;
};

/**
 * Feature Flag Context
 *
 * Provides feature flag state and utilities to the component tree.
 */
type FeatureFlagContextType = {
  flags: FeatureFlags;
  isEnabled: (flagName: string) => boolean;
};

export const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

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

type FeatureFlagProviderProps = {
  children: ReactNode;
  initialFlags?: FeatureFlags;
};

/**
 * Feature Flag Provider Component
 *
 * This provider wraps the application and makes feature flags available
 * to all child components via the useFeatureFlags hook.
 *
 * Feature flags are loaded from environment variables with the prefix
 * NEXT_PUBLIC_FEATURE_FLAG_. Remote configuration providers (ConfigCat,
 * Flagsmith, Supabase) can supply an initialFlags object which overrides
 * the environment defaults.
 *
 * Default behavior: All flags default to false unless explicitly enabled.
 *
 * Accessibility: Feature flags can be used to gradually roll out a11y
 * improvements or test different accessible UI patterns.
 *
 * @example
 * ```tsx
 * // In your app layout or root component:
 * <FeatureFlagProvider initialFlags={remoteFlags}>
 *   <YourApp />
 * </FeatureFlagProvider>
 * ```
 */
export function FeatureFlagProvider({ children, initialFlags }: FeatureFlagProviderProps) {
  const envFlags = useMemo(() => parseFeatureFlagsFromEnv(), []);
  const mergedFlags = useMemo(
    () => mergeFeatureFlagSources(envFlags, initialFlags),
    [envFlags, initialFlags]
  );

  const value = useMemo(
    () => ({
      flags: mergedFlags,
      isEnabled: (flagName: string): boolean => {
        const normalized = normalizeFlagKey(flagName);
        return mergedFlags[normalized] ?? false;
      },
    }),
    [mergedFlags]
  );

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
}
