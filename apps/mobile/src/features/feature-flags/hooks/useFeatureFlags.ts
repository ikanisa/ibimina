import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_FEATURE_FLAG_KEYS,
  fetchFeatureFlagMap,
  type FeatureFlagContext,
  type FeatureFlagKey,
  type FeatureFlagMap,
} from "@ibimina/data-access";
import { useSupabase } from "../../../providers/supabase-client";

const FEATURE_FLAGS_QUERY_KEY = ["feature-flags"] as const;

export type UseFeatureFlagsOptions = FeatureFlagContext & {
  keys?: FeatureFlagKey[];
};

export const useFeatureFlags = ({ keys, ...context }: UseFeatureFlagsOptions = {}) => {
  const client = useSupabase();
  const resolvedKeys = useMemo(() => keys ?? DEFAULT_FEATURE_FLAG_KEYS, [keys]);

  return useQuery<FeatureFlagMap>({
    queryKey: [...FEATURE_FLAGS_QUERY_KEY, resolvedKeys.join(":"), context.countryId ?? "", context.orgId ?? ""],
    queryFn: async () => fetchFeatureFlagMap(client, resolvedKeys, context),
    staleTime: 1000 * 60 * 10,
  });
};
