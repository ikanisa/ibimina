import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchGroups,
  submitJoinRequest,
  type GroupFilters,
  type IkiminaGroup,
} from "@ibimina/data-access";
import { useSupabase } from "../../../providers/supabase-client";

const GROUPS_QUERY_KEY = ["groups"] as const;

export const useGroups = (filters: GroupFilters = {}) => {
  const client = useSupabase();
  return useInfiniteQuery({
    queryKey: [...GROUPS_QUERY_KEY, filters.search ?? "", filters.limit ?? 20],
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage.length) return null;
      return lastPage[lastPage.length - 1]?.lastPaidAt ?? null;
    },
    queryFn: async ({ pageParam }) => {
      const records = await fetchGroups(client, { ...filters, cursor: pageParam });
      return records;
    },
  });
};

export const useSubmitJoinRequest = () => {
  const client = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, message }: { groupId: string; message?: string | null }) =>
      submitJoinRequest(client, { groupId, message: message ?? null }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["join-requests", variables.groupId] });
    },
  });
};

export type GroupList = IkiminaGroup;
