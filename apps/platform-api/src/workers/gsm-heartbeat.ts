import { createClient } from "@supabase/supabase-js";

import type { ObservabilityContext } from "../observability";
import { runWorker } from "../observability";
import { invokeEdge, requireEnv } from "../lib/edgeClient";

interface HeartbeatSummary {
  success: boolean;
  checked?: number;
  results?: Array<{ id: string; status: string; latencyMs: number; error?: string | null }>;
  error?: string;
}

export async function runGsmHeartbeat(context?: ObservabilityContext) {
  const execute = async (ctx: ObservabilityContext) => {
    const result = (await invokeEdge("gsm-heartbeat", { method: "POST" })) as HeartbeatSummary;
    if (!result?.success) {
      ctx.captureException(new Error(result?.error ?? "unknown error"), {
        job: "gsm-heartbeat",
      });
      throw new Error(`GSM heartbeat failed: ${result?.error ?? "unknown error"}`);
    }

    const supabase = createClient(
      requireEnv("SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    const { data: gateways } = await supabase
      .schema("app")
      .from("sms_gateway_endpoints")
      .select("gateway, display_name, last_status, last_heartbeat_at, last_latency_ms, last_error")
      .order("gateway", { ascending: true });

    ctx.logger.info("gsm.heartbeat.summary", { checked: result.checked ?? 0 });

    if (gateways?.length) {
      ctx.logger.info("gsm.heartbeat.status", {
        gateways: gateways.map((gateway) => ({
          gateway: gateway.display_name ?? gateway.gateway,
          status: gateway.last_status ?? "unknown",
          lastHeartbeatAt: gateway.last_heartbeat_at,
          latencyMs: gateway.last_latency_ms,
          error: gateway.last_error ?? null,
        })),
      });
    }

    await ctx.track("gsm.heartbeat.run", {
      checked: result.checked ?? 0,
    });
  };

  if (context) {
    return execute(context);
  }

  return runWorker("worker.gsm-heartbeat", execute);
}
