import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logError, logInfo } from "@/lib/observability/logger";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const CLIENT_FACTORY_TOKEN = "__ibimina_rate_limit_client_factory__" as const;

type ClientFactory = () => Promise<SupabaseServerClient>;

type GlobalWithFactory = typeof globalThis & {
  [CLIENT_FACTORY_TOKEN]?: ClientFactory | null;
};

const getGlobalWithFactory = () => globalThis as GlobalWithFactory;

const setClientFactoryOverride = (factory: ClientFactory | null) => {
  getGlobalWithFactory()[CLIENT_FACTORY_TOKEN] = factory;
};

const getClientFactoryOverride = () => getGlobalWithFactory()[CLIENT_FACTORY_TOKEN] ?? null;

export const __setRateLimitClientFactoryForTests = (
  factory: ClientFactory | null,
) => {
  setClientFactoryOverride(factory);
};

const resolveSupabaseClient = () => {
  const override = getClientFactoryOverride();
  if (override) {
    return override();
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
