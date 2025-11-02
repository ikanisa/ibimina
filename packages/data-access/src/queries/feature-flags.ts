import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DEFAULT_FEATURE_FLAG_KEYS,
  fetchFeatureFlagMap as fetchFeatureFlagMapInternal,
  fetchFeatureFlags as fetchFeatureFlagsInternal,
  type FeatureFlagContext,
  type FeatureFlagEntry,
  type FeatureFlagKey,
  type FeatureFlagMap,
} from "@ibimina/flags";

export type { FeatureFlagContext, FeatureFlagEntry, FeatureFlagKey, FeatureFlagMap };

export const fetchFeatureFlags = (
  client: SupabaseClient,
  keys: FeatureFlagKey[] = DEFAULT_FEATURE_FLAG_KEYS,
  context: FeatureFlagContext = {}
): Promise<FeatureFlagEntry[]> => fetchFeatureFlagsInternal(client, keys, context);

export const fetchFeatureFlagMap = (
  client: SupabaseClient,
  keys: FeatureFlagKey[] = DEFAULT_FEATURE_FLAG_KEYS,
  context: FeatureFlagContext = {}
): Promise<FeatureFlagMap> => fetchFeatureFlagMapInternal(client, keys, context);

export { DEFAULT_FEATURE_FLAG_KEYS };
