import { createClient } from "@supabase/supabase-js";

import type { ObservabilityContext } from "../observability";
import { runWorker } from "../observability";
import { invokeEdge, requireEnv } from "../lib/edgeClient";
import {
  ensureObservability,
  logError,
  logInfo,
  recordMomoPollerMetrics,
  captureException,
} from "../lib/observability/index.js";

interface PollSummary {
  success: boolean;
  processed?: number;
  inserted?: number;
  jobs?: number;
  error?: string;
}

export async function runMomoPoller(context?: ObservabilityContext) {
  const execute = async (ctx: ObservabilityContext) => {
    const response = (await invokeEdge("momo-statement-poller", { method: "POST" })) as PollSummary;
    if (!response?.success) {
      ctx.captureException(new Error(response?.error ?? "unknown error"), {
        job: "momo-statement-poller",
      });
      throw new Error(`MoMo polling failed: ${response?.error ?? "unknown error"}`);
    }

    const supabase = createClient(
      requireEnv("SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    const { data: pollers } = await supabase
      .schema("app")
      .from("momo_statement_pollers")
      .select(
        "display_name, provider, last_polled_at, last_latency_ms, last_error, last_polled_count"
      )
      .order("display_name", { ascending: true });

    ctx.logger.info("momo.poller.summary", {
      processed: response.processed ?? 0,
      inserted: response.inserted ?? 0,
      jobs: response.jobs ?? 0,
    });

    if (pollers?.length) {
      ctx.logger.info("momo.poller.status", {
        pollers: pollers.map((poller) => ({
          poller: poller.display_name ?? poller.provider ?? "unknown",
          lastPolledAt: poller.last_polled_at,
          lastLatencyMs: poller.last_latency_ms,
          lastBatchCount: poller.last_polled_count,
          error: poller.last_error ?? null,
        })),
      });
    }

    await ctx.track("momo.poller.run", {
      processed: response.processed ?? 0,
      inserted: response.inserted ?? 0,
      jobs: response.jobs ?? 0,
    });
  };

  if (context) {
    return execute(context);
  }

  return runWorker("worker.momo-poller", execute);
}
