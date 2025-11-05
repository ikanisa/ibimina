import { useMemo } from "react";
import { useReferenceTokens } from "../../allocations/hooks/useAllocations";

export const useReferenceToken = () => {
  const { data, isLoading, error } = useReferenceTokens();
  const primary = useMemo(() => data?.[0] ?? null, [data]);

  return { token: primary, tokens: data ?? [], isLoading, error };
};
