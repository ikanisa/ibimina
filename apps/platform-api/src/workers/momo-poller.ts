import { createClient } from "@supabase/supabase-js";
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

export async function runMomoPoller() {
  ensureObservability();
  logInfo("momo_poller.invocation", { worker: "momo-statement-poller" });

  const response = (await invokeEdge("momo-statement-poller", {
    method: "POST",
    retry: { attempts: 3, backoffMs: 500 },
  })) as PollSummary;
  if (!response?.success) {
    recordMomoPollerMetrics({ status: "failure" });
    const errorMessage = response?.error ?? "unknown error";
    const error = new Error(`MoMo polling failed: ${errorMessage}`);
    logError("momo_poller.edge_failed", { error: errorMessage });
    captureException(error, { stage: "edge_invocation" });
    throw error;
  }

  const supabase = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );

  const { data: pollers, error: pollerStatusError } = await supabase
    .schema("app")
    .from("momo_statement_pollers")
    .select(
      "display_name, provider, last_polled_at, last_latency_ms, last_error, last_polled_count"
    )
    .order("display_name", { ascending: true });

  if (pollerStatusError) {
    recordMomoPollerMetrics({ status: "failure" });
    logError("momo_poller.supabase_failed", { error: pollerStatusError.message });
    captureException(pollerStatusError, { stage: "status_fetch" });
    throw new Error(`Failed to load MoMo poller status: ${pollerStatusError.message}`);
  }

  const processed = response.processed ?? 0;
  const inserted = response.inserted ?? 0;
  const jobs = response.jobs ?? 0;

  recordMomoPollerMetrics({
    status: "success",
    processed,
    inserted,
    jobs,
  });

  logInfo("momo_poller.completed", { processed, inserted, jobs });

  if (pollers?.length) {
    console.table(
      pollers.map((poller) => ({
        poller: poller.display_name ?? poller.provider ?? "unknown",
        lastPolledAt: poller.last_polled_at,
        lastLatencyMs: poller.last_latency_ms,
        lastBatchCount: poller.last_polled_count,
        error: poller.last_error ?? "—",
      }))
    );
  }
}
