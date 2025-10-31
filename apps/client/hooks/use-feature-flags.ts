import { useContext } from "react";
import { FeatureFlagContext } from "../components/FeatureFlagProvider";

/**
 * Hook to access feature flags in components
 *
 * Usage:
 * ```tsx
 * const { isEnabled } = useFeatureFlags();
 *
 * if (isEnabled('new-ui')) {
 *   return <NewUI />;
 * }
 * return <OldUI />;
 * ```
 *
 * @returns Feature flag context with isEnabled function
 */
export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);

  if (!context) {
    throw new Error("useFeatureFlags must be used within a FeatureFlagProvider");
  }

  return context;
}
