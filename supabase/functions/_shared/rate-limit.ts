import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type AnyClient = SupabaseClient<any, any, any>;

const defaultWindow = parseInt(Deno.env.get("RATE_LIMIT_WINDOW_SECONDS") ?? "60", 10);
const defaultMax = parseInt(Deno.env.get("RATE_LIMIT_MAX") ?? "120", 10);

export const enforceRateLimit = async (
  supabase: AnyClient,
  key: string,
  options?: { maxHits?: number; windowSeconds?: number },
) => {
  const maxHits = options?.maxHits ?? defaultMax;
  const windowSeconds = options?.windowSeconds ?? defaultWindow;

  const { data, error } = await supabase.rpc("consume_rate_limit", {
    key,
    max_hits: maxHits,
    window_seconds: windowSeconds,
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
};
