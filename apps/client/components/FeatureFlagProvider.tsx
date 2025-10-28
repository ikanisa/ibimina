"use client";

import React, { createContext, ReactNode, useMemo } from "react";

/**
 * Feature Flag Configuration
 *
 * This type defines the structure of feature flags in the application.
 * Add new feature flags here as needed.
 */
type FeatureFlags = {
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
 * Feature Flag Provider Component
 *
 * This provider wraps the application and makes feature flags available
 * to all child components via the useFeatureFlags hook.
 *
 * Feature flags are loaded from environment variables with the prefix
 * NEXT_PUBLIC_FEATURE_FLAG_. For example:
 * - NEXT_PUBLIC_FEATURE_FLAG_NEW_UI=true enables the 'new-ui' flag
 * - NEXT_PUBLIC_FEATURE_FLAG_BETA_FEATURES=false disables 'beta-features'
 *
 * Default behavior: All flags default to false unless explicitly enabled.
 *
 * Accessibility: Feature flags can be used to gradually roll out a11y
 * improvements or test different accessible UI patterns.
 *
 * @example
 * ```tsx
 * // In your app layout or root component:
 * <FeatureFlagProvider>
 *   <YourApp />
 * </FeatureFlagProvider>
 * ```
 */
export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const flags = useMemo(() => {
    // Parse feature flags from environment variables
    const envFlags: FeatureFlags = {};

    // In Next.js, only NEXT_PUBLIC_* variables are available client-side
    if (typeof window !== "undefined") {
      Object.keys(process.env).forEach((key) => {
        if (key.startsWith("NEXT_PUBLIC_FEATURE_FLAG_")) {
          const flagName = key
            .replace("NEXT_PUBLIC_FEATURE_FLAG_", "")
            .toLowerCase()
            .replace(/_/g, "-");
          const value = process.env[key];
          envFlags[flagName] = value === "true" || value === "1";
        }
      });
    } else {
      // Server-side: Parse from process.env directly
      Object.keys(process.env).forEach((key) => {
        if (key.startsWith("NEXT_PUBLIC_FEATURE_FLAG_")) {
          const flagName = key
            .replace("NEXT_PUBLIC_FEATURE_FLAG_", "")
            .toLowerCase()
            .replace(/_/g, "-");
          const value = process.env[key];
          envFlags[flagName] = value === "true" || value === "1";
        }
      });
    }

    return envFlags;
  }, []);

  const value = useMemo(
    () => ({
      flags,
      isEnabled: (flagName: string): boolean => {
        return flags[flagName] ?? false;
      },
    }),
    [flags]
  );

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
}
