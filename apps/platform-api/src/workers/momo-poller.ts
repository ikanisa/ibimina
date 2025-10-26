import { createClient } from "@supabase/supabase-js";
import { invokeEdge, requireEnv } from "../lib/edgeClient";

interface PollSummary {
  success: boolean;
  processed?: number;
  inserted?: number;
  jobs?: number;
  error?: string;
}

export async function runMomoPoller() {
  const response = (await invokeEdge("momo-statement-poller", { method: "POST" })) as PollSummary;
  if (!response?.success) {
    throw new Error(`MoMo polling failed: ${response?.error ?? "unknown error"}`);
  }

  const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: pollers } = await supabase
    .schema("app")
    .from("momo_statement_pollers")
    .select("display_name, provider, last_polled_at, last_latency_ms, last_error, last_polled_count")
    .order("display_name", { ascending: true });

  console.info("MoMo polling summary", {
    processed: response.processed ?? 0,
    inserted: response.inserted ?? 0,
    jobs: response.jobs ?? 0,
  });

  if (pollers?.length) {
    console.table(
      pollers.map((poller) => ({
        poller: poller.display_name ?? poller.provider ?? "unknown",
        lastPolledAt: poller.last_polled_at,
        lastLatencyMs: poller.last_latency_ms,
        lastBatchCount: poller.last_polled_count,
        error: poller.last_error ?? "—",
      })),
    );
  }
}
