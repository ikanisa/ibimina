import { createSupabaseServiceRoleClient } from "@/lib/supabaseServer";

export const createSupabaseAdminClient = () =>
  createSupabaseServiceRoleClient("createSupabaseAdminClient", {
    auth: {
      autoRefreshToken: false,
    },
  });
