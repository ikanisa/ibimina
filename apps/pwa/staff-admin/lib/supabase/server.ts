import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerClient as createSupabaseSSRClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { requireSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseServer";
import { logError } from "@/lib/observability/logger";

export const supabaseSrv = (): SupabaseClient<Database> =>
  createSupabaseServiceRoleClient("supabaseSrv");

export const supabaseAnon = (): SupabaseClient<Database> => {
  const { url, anonKey } = requireSupabaseConfig("supabaseAnon");

  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false },
  });
};

export async function createSupabaseServerClient() {
  const { url, anonKey } = requireSupabaseConfig("createSupabaseServerClient");

  const cookieStore = await cookies();

  return createSupabaseSSRClient<Database>(url, anonKey, {
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

export async function getServerAuthSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    logError("supabase.session.error", { message: error.message, code: error.code });
    return null;
  }

  return session ?? null;
}

// --- Compatibility alias for older imports ---
export { createSupabaseServerClient as createServerClient };
