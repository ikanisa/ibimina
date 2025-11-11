import crypto from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logError, logInfo } from "@/lib/observability/logger";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const CLIENT_FACTORY_TOKEN = Symbol.for("ibimina.client.rate_limit.client_factory");

type ClientFactory = () => Promise<SupabaseServerClient>;

type GlobalWithFactory = typeof globalThis & {
  [CLIENT_FACTORY_TOKEN]?: ClientFactory | null;
};

const getGlobalWithFactory = () => globalThis as GlobalWithFactory;

const setClientFactoryOverride = (factory: ClientFactory | null) => {
  getGlobalWithFactory()[CLIENT_FACTORY_TOKEN] = factory;
};

const getClientFactoryOverride = () => getGlobalWithFactory()[CLIENT_FACTORY_TOKEN] ?? null;

const resolveSupabaseClient = () => {
  const override = getClientFactoryOverride();
  if (override) {
    return override();
  }
  return createSupabaseServerClient();
};

const requireRateLimitSecret = () => {
  const secret = process.env.RATE_LIMIT_SECRET ?? process.env.BACKUP_PEPPER;
  if (!secret) {
    throw new Error("RATE_LIMIT_SECRET (or BACKUP_PEPPER) is not configured");
  }
  return secret;
};

export const hashRateLimitKey = (...parts: Array<string | number | null | undefined>) => {
  const secret = requireRateLimitSecret();
  const normalized = parts.map((part) => {
    if (part === null || part === undefined) {
      return "<null>";
    }
    return String(part);
  });
  const payload = normalized.join("|");
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
};

export const enforceRateLimit = async (
  key: string,
  options?: { maxHits?: number; windowSeconds?: number }
) => {
  const supabase = (await resolveSupabaseClient()) as unknown as {
    rpc: (
      name: string,
      args: { p_key: string; p_max_hits: number; p_window_seconds: number }
    ) => Promise<{ data: boolean | null; error: unknown | null }>;
  };

  const { data, error } = await supabase.rpc("consume_rate_limit", {
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
    throw error instanceof Error ? error : new Error("rate_limit_error");
  }

  if (!data) {
    logInfo("rate_limit_blocked", {
      key,
      maxHits: options?.maxHits ?? 5,
      windowSeconds: options?.windowSeconds ?? 300,
    });
    throw new Error("rate_limit_exceeded");
  }
};

export const __setRateLimitClientFactoryForTests = (factory: ClientFactory | null) => {
  setClientFactoryOverride(factory);
};
