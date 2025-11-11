import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import { requireSupabaseConfig } from "./config";

type ClientOptions = NonNullable<Parameters<typeof createClient<Database>>[2]>;

const defaultOptions: ClientOptions = {
  auth: {
    persistSession: false,
  },
};

function resolveServiceRoleKey(context: string): string {
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw || !raw.trim()) {
    console.error("supabase.service-role.missing", { context });
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. Ensure the service role key is available on the server."
    );
  }
  return raw.trim();
}

export function createSupabaseServiceRoleClient(
  context: string,
  options?: ClientOptions
): SupabaseClient<Database> {
  const { url } = requireSupabaseConfig(context);
  const serviceRoleKey = resolveServiceRoleKey(context);

  return createClient<Database>(url, serviceRoleKey, {
    ...defaultOptions,
    ...options,
    auth: {
      ...defaultOptions.auth,
      ...options?.auth,
    },
  });
}
