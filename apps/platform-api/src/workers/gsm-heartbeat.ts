import { createClient } from "@supabase/supabase-js";
import { invokeEdge, requireEnv } from "../lib/edgeClient";
import {
  ensureObservability,
  logError,
  logInfo,
  recordGsmHeartbeatMetrics,
  captureException,
} from "../lib/observability/index.js";

interface HeartbeatSummary {
  success: boolean;
  checked?: number;
  results?: Array<{ id: string; status: string; latencyMs: number; error?: string | null }>;
  error?: string;
}

export async function runGsmHeartbeat() {
  ensureObservability();
  logInfo("gsm_heartbeat.invocation", { worker: "gsm-heartbeat" });

  const result = (await invokeEdge("gsm-heartbeat", {
    method: "POST",
    retry: { attempts: 3, backoffMs: 500 },
  })) as HeartbeatSummary;
  if (!result?.success) {
    recordGsmHeartbeatMetrics({ status: "failure" });
    const errorMessage = result?.error ?? "unknown error";
    const error = new Error(`GSM heartbeat failed: ${errorMessage}`);
    logError("gsm_heartbeat.edge_failed", { error: errorMessage });
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

  const { data: gateways, error: gatewaysError } = await supabase
    .schema("app")
    .from("sms_gateway_endpoints")
    .select("gateway, display_name, last_status, last_heartbeat_at, last_latency_ms, last_error")
    .order("gateway", { ascending: true });

  if (gatewaysError) {
    recordGsmHeartbeatMetrics({ status: "failure" });
    logError("gsm_heartbeat.supabase_failed", { error: gatewaysError.message });
    captureException(gatewaysError, { stage: "status_fetch" });
    throw new Error(`Failed to load GSM heartbeat status: ${gatewaysError.message}`);
  }

  recordGsmHeartbeatMetrics({ status: "success", checked: result.checked ?? 0 });
  logInfo("gsm_heartbeat.completed", { checked: result.checked ?? 0 });

  if (gateways?.length) {
    console.table(
      gateways.map((gateway) => ({
        gateway: gateway.display_name ?? gateway.gateway,
        status: gateway.last_status ?? "unknown",
        lastHeartbeatAt: gateway.last_heartbeat_at,
        latencyMs: gateway.last_latency_ms,
        error: gateway.last_error ?? "—",
      }))
    );
  }
}
