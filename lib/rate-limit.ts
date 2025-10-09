import { createSupabaseServerClient } from "@/lib/supabase/server";

export const enforceRateLimit = async (key: string, options?: { maxHits?: number; windowSeconds?: number }) => {
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("consume_rate_limit", {
    key,
    max_hits: options?.maxHits ?? 5,
    window_seconds: options?.windowSeconds ?? 300,
  });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("rate_limit_exceeded");
  }
};
