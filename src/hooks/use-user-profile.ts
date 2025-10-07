import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  sacco_id: string | null;
  saccos?: {
    id: string;
    name: string;
    district: string;
    sector_code: string;
  } | null;
}

export const useUserProfile = () => {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async (): Promise<UserProfile> => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase
        .from("users")
        .select("*, saccos(*)")
        .eq("id", authData.user.id)
        .single();

      if (error) {
        throw error;
      }

      return data as UserProfile;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};
