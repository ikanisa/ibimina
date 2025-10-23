import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logError, logInfo } from "@/lib/observability/logger";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

let clientFactoryOverride: (() => Promise<SupabaseServerClient>) | null = null;

export const __setRateLimitClientFactoryForTests = (
  factory: (() => Promise<SupabaseServerClient>) | null,
) => {
  clientFactoryOverride = factory;
};

const resolveSupabaseClient = () => {
  if (clientFactoryOverride) {
    return clientFactoryOverride();
  }
  return createSupabaseServerClient();
};

export const enforceRateLimit = async (key: string, options?: { maxHits?: number; windowSeconds?: number }) => {
  const supabase = await resolveSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("consume_rate_limit", {
    p_key: key,
    p_max_hits: options?.maxHits ?? 5,
    p_window_seconds: options?.windowSeconds ?? 300,
  });

  if (error) {
    logError("rate_limit_rpc_failed", { key, error, maxHits: options?.maxHits, windowSeconds: options?.windowSeconds });
    throw error;
  }

  if (!data) {
    logInfo("rate_limit_blocked", { key, maxHits: options?.maxHits ?? 5, windowSeconds: options?.windowSeconds ?? 300 });
    throw new Error("rate_limit_exceeded");
  }
};
