"use client";

import React, { createContext, ReactNode, useMemo } from "react";
import {
  type FeatureFlags,
  parseFeatureFlagsFromEnv,
  mergeFeatureFlagSources,
  normalizeFlagKey,
} from "@/lib/feature-flags/utils";

export type { FeatureFlags };
export { parseFeatureFlagsFromEnv, mergeFeatureFlagSources, normalizeFlagKey };

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
