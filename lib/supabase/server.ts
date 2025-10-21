import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { requireSupabaseConfig } from "@/lib/supabase/config";
import { env } from "@/src/env.server";

const getServiceRoleKey = () => {
  if (env.AUTH_E2E_STUB === "1") {
    return env.SUPABASE_SERVICE_ROLE_KEY;
  }
  return env.SUPABASE_SERVICE_ROLE_KEY;
};

export const supabaseSrv = (): SupabaseClient<Database> => {
  const { url } = requireSupabaseConfig("supabaseSrv");
  const serviceRoleKey = getServiceRoleKey();

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
};

export const supabaseAnon = (): SupabaseClient<Database> => {
  const { url, anonKey } = requireSupabaseConfig("supabaseAnon");

  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false },
  });
};

export async function createSupabaseServerClient() {
  const { url, anonKey } = requireSupabaseConfig("createSupabaseServerClient");

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Server Components cannot mutate response cookies; use middleware or server actions for writes.
      },
    },
  });
}
