import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logError, logInfo } from "@/lib/observability/logger";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

// Global token used to store the client factory override for testing
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

/**
 * Test-only function to override the Supabase client factory
 * Allows tests to inject a mock client without modifying production code
 * @param factory - Factory function that returns a Supabase client, or null to reset
 */
export const __setRateLimitClientFactoryForTests = (factory: ClientFactory | null) => {
  setClientFactoryOverride(factory);
};

/**
 * Resolve the Supabase client to use for rate limiting
 * Returns test override if set, otherwise the real server client
 */
const resolveSupabaseClient = () => {
  const override = getClientFactoryOverride();
  if (override) {
    return override();
  }
  return createSupabaseServerClient();
};

/**
 * Enforce rate limiting using Supabase's consume_rate_limit RPC
 * Throws an error if the rate limit is exceeded
 *
 * Rate limiting is implemented using minute buckets stored in ops.rate_limits table.
 * Each bucket is identified by a key (e.g., "ip:192.168.1.1" or "user:uuid") and tracks
 * the number of requests within a sliding window.
 *
 * @param key - Unique identifier for the rate limit bucket (e.g., "ip:127.0.0.1", "user:uuid")
 * @param options - Rate limit configuration
 * @param options.maxHits - Maximum number of requests allowed (default: 5)
 * @param options.windowSeconds - Time window in seconds (default: 300 = 5 minutes)
 * @throws Error with message "rate_limit_exceeded" if limit is reached
 *
 * @example
 * // Limit to 20 requests per minute for a specific user
 * await enforceRateLimit(`user:${userId}`, { maxHits: 20, windowSeconds: 60 });
 */
export const enforceRateLimit = async (
  key: string,
  options?: { maxHits?: number; windowSeconds?: number }
) => {
  const supabase = await resolveSupabaseClient();

  const { data, error } = await (supabase as any).rpc("consume_rate_limit", {
    p_key: key,
    p_max_hits: options?.maxHits ?? 5,
    p_window_seconds: options?.windowSeconds ?? 300,
  });

  if (error) {
    logError("rate_limit_rpc_failed", {
      key,
      error,
      maxHits: options?.maxHits,
      windowSeconds: options?.windowSeconds,
    });
    throw error;
  }

  // data is false when rate limit is exceeded
  if (!data) {
    logInfo("rate_limit_blocked", {
      key,
      maxHits: options?.maxHits ?? 5,
      windowSeconds: options?.windowSeconds ?? 300,
    });
    throw new Error("rate_limit_exceeded");
  }
};
