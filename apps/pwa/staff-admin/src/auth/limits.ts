import { enforceRateLimit } from "@/lib/rate-limit";
import { hashRateLimitKey } from "./util/crypto";

const memoryLimits = new Map<string, { hits: number; resetAt: number }>();
const replayCache = new Map<string, number>();

const now = () => Date.now();

const cleanup = () => {
  const current = now();
  for (const [key, entry] of memoryLimits.entries()) {
    if (entry.resetAt <= current) {
      memoryLimits.delete(key);
    }
  }
  for (const [key, expiresAt] of replayCache.entries()) {
    if (expiresAt <= current) {
      replayCache.delete(key);
    }
  }
};

interface RateLimitOptions {
  maxHits?: number;
  windowSeconds?: number;
}

export const applyRateLimit = async (key: string, options?: RateLimitOptions) => {
  const maxHits = options?.maxHits ?? 5;
  const windowSeconds = options?.windowSeconds ?? 300;
  const hashedKey = hashRateLimitKey("rl", key);

  try {
    await enforceRateLimit(hashedKey, { maxHits, windowSeconds });
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Error && error.message === "rate_limit_exceeded") {
      return {
        ok: false as const,
        retryAt: new Date(now() + windowSeconds * 1000),
      };
    }

    cleanup();
    const existing = memoryLimits.get(hashedKey);
    const current = now();
    if (!existing || existing.resetAt <= current) {
      memoryLimits.set(hashedKey, { hits: 1, resetAt: current + windowSeconds * 1000 });
      return { ok: true as const };
    }

    if (existing.hits + 1 > maxHits) {
      return {
        ok: false as const,
        retryAt: new Date(existing.resetAt),
      };
    }

    existing.hits += 1;
    memoryLimits.set(hashedKey, existing);
    return { ok: true as const };
  }
};

export const preventTotpReplay = (userId: string, step: number) => {
  cleanup();
  const key = hashRateLimitKey("totp-step", userId, step);
  const current = now();
  const expiresAt = current + 60_000;
  const existing = replayCache.get(key);
  if (existing && existing > current) {
    return false;
  }
  replayCache.set(key, expiresAt);
  return true;
};

export const __resetRateLimitCachesForTests = () => {
  memoryLimits.clear();
  replayCache.clear();
};
