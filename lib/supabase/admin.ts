import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { env } from "@/src/env.server";

export const createSupabaseAdminClient = () =>
  createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
