import type { SupabaseClient } from "@supabase/supabase-js";

import { AgentRateLimitError, AgentSessionError } from "./errors.js";
import type { AgentRateLimiter } from "./types.js";

const DEFAULT_ROUTE = "agent.chat" as const;
const DEFAULT_MAX_HITS = 60;
const DEFAULT_WINDOW_SECONDS = 60;

const sanitizeKey = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "anonymous";
};

export interface SupabaseAgentRateLimiterOptions {
  client: SupabaseClient;
  route?: string;
  maxHits?: number;
  windowSeconds?: number;
}

export class SupabaseAgentRateLimiter implements AgentRateLimiter {
  private readonly client: SupabaseClient;
  private readonly route: string;
  private readonly maxHits: number;
  private readonly windowSeconds: number;

  constructor(options: SupabaseAgentRateLimiterOptions) {
    this.client = options.client;
    this.route = options.route ?? DEFAULT_ROUTE;
    this.maxHits = options.maxHits ?? DEFAULT_MAX_HITS;
    this.windowSeconds = options.windowSeconds ?? DEFAULT_WINDOW_SECONDS;
  }

  async enforce(config: { key: string; maxHits?: number; windowSeconds?: number }): Promise<void> {
    const bucketKey = sanitizeKey(config.key);
    const maxHits = config.maxHits ?? this.maxHits;
    const windowSeconds = config.windowSeconds ?? this.windowSeconds;

    const { data, error } = await (this.client as any).rpc("consume_route_rate_limit", {
      bucket_key: bucketKey,
      route: this.route,
      max_hits: maxHits,
      window_seconds: windowSeconds,
    });

    if (error) {
      throw new AgentSessionError("Failed to execute agent rate limiter", {
        bucketKey,
        route: this.route,
        error: error.message ?? String(error),
      });
    }

    const allowed = Boolean(data);
    if (!allowed) {
      throw new AgentRateLimitError({ bucketKey, route: this.route, maxHits, windowSeconds });
    }
  }
}
