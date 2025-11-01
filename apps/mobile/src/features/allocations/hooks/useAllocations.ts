import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllocations,
  fetchReferenceTokens,
  markAllocationPaid,
  type Allocation,
  type ReferenceToken,
} from "@ibimina/data-access";
import { useSupabase } from "../../../providers/supabase-client";
import * as Haptics from "expo-haptics";

const ALLOCATIONS_KEY = ["allocations"] as const;
const TOKENS_KEY = ["reference-tokens"] as const;

export const useReferenceTokens = () => {
  const client = useSupabase();
  return useQuery<ReferenceToken[]>({
    queryKey: TOKENS_KEY,
    queryFn: () => fetchReferenceTokens(client),
  });
};

export const useAllocations = (tokens: string[]) => {
  const client = useSupabase();
  return useQuery<Allocation[]>({
    enabled: tokens.length > 0,
    queryKey: [...ALLOCATIONS_KEY, tokens.sort().join(":")],
    queryFn: () => fetchAllocations(client, { referenceTokens: tokens }),
  });
};

export const useMarkAllocationPaid = () => {
  const client = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ allocationId }: { allocationId: string }) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return markAllocationPaid(client, allocationId);
    },
    onMutate: async ({ allocationId }) => {
      await queryClient.cancelQueries({ queryKey: ALLOCATIONS_KEY });
      const previous = queryClient.getQueriesData<Allocation[]>({ queryKey: ALLOCATIONS_KEY });

      queryClient.setQueriesData<Allocation[]>({ queryKey: ALLOCATIONS_KEY }, (old) => {
        if (!old) {
          return old;
        }
        return old.map((allocation) =>
          allocation.id === allocationId
            ? { ...allocation, status: "posted", postedAt: new Date().toISOString() }
            : allocation
        );
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      for (const [key, value] of context.previous) {
        queryClient.setQueryData(key, value);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ALLOCATIONS_KEY });
    },
  });
};
