import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser, type User } from "@ibimina/data-access";
import { useSupabase } from "../../../providers/supabase-client";

const USER_QUERY_KEY = ["current-user"] as const;

export const useCurrentUser = () => {
  const client = useSupabase();

  return useQuery<User | null>({
    queryKey: USER_QUERY_KEY,
    queryFn: () => fetchCurrentUser(client),
    staleTime: 1000 * 60 * 2,
  });
};
