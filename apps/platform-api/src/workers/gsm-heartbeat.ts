import { createClient } from "@supabase/supabase-js";
import { invokeEdge, requireEnv } from "../lib/edgeClient";

interface HeartbeatSummary {
  success: boolean;
  checked?: number;
  results?: Array<{ id: string; status: string; latencyMs: number; error?: string | null }>;
  error?: string;
}

export async function runGsmHeartbeat() {
  const result = (await invokeEdge("gsm-heartbeat", { method: "POST" })) as HeartbeatSummary;
  if (!result?.success) {
    throw new Error(`GSM heartbeat failed: ${result?.error ?? "unknown error"}`);
  }

  const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: gateways } = await supabase
    .schema("app")
    .from("sms_gateway_endpoints")
    .select("gateway, display_name, last_status, last_heartbeat_at, last_latency_ms, last_error")
    .order("gateway", { ascending: true });

  console.info("GSM heartbeat summary", { checked: result.checked ?? 0 });

  if (gateways?.length) {
    console.table(
      gateways.map((gateway) => ({
        gateway: gateway.display_name ?? gateway.gateway,
        status: gateway.last_status ?? "unknown",
        lastHeartbeatAt: gateway.last_heartbeat_at,
        latencyMs: gateway.last_latency_ms,
        error: gateway.last_error ?? "—",
      })),
    );
  }
}
