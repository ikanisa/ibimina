import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateHmacRequest } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-timestamp",
};

const sanitizeLabel = (value: string) => value.replace(/[^a-zA-Z0-9_:/.-]/g, "_");

const respond = (metrics: string[]) =>
  new Response(metrics.join("\n") + "\n", {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

type MetricRow = {
  event: string;
  total: number | null;
  meta: Record<string, unknown> | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const validation = await validateHmacRequest(req, { toleranceSeconds: 60 });

    if (!validation.ok) {
      console.warn("metrics-exporter.signature_invalid", { reason: validation.reason });
      const status = validation.reason === "stale_timestamp" ? 408 : 401;
      return new Response("ibimina_health_up 0\n", {
        status,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const metrics: string[] = [];

    metrics.push(`# HELP ibimina_health_up Reports exporter availability`);
    metrics.push("# TYPE ibimina_health_up gauge");
    metrics.push("ibimina_health_up 1");

    const { data: systemMetrics, error: systemMetricsError } = await supabase
      .from("system_metrics")
      .select("event, total, meta")
      .limit(200);

    if (systemMetricsError) {
      throw systemMetricsError;
    }

    if (systemMetrics && systemMetrics.length > 0) {
      metrics.push(`# HELP ibimina_system_metric_total Counter derived from system_metrics table`);
      metrics.push("# TYPE ibimina_system_metric_total counter");
      (systemMetrics as MetricRow[]).forEach((row) => {
        const event = sanitizeLabel(row.event ?? "unknown");
        const total = Number.isFinite(row.total) ? Number(row.total) : 0;
        metrics.push(`ibimina_system_metric_total{event="${event}"} ${total}`);
      });
    }

    const [
      { count: smsPending },
      { count: smsFailed },
      { count: notificationPending },
      { count: notificationErrored },
    ] = await Promise.all([
      supabase.from("sms_inbox").select("id", { count: "exact", head: true }).in("status", ["NEW", "PARSED", "PENDING"]),
      supabase.from("sms_inbox").select("id", { count: "exact", head: true }).eq("status", "FAILED"),
      supabase.from("notification_queue").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
      supabase.from("notification_queue").select("id", { count: "exact", head: true }).eq("status", "FAILED"),
    ]);

    metrics.push(`# HELP ibimina_sms_queue_pending Pending SMS rows awaiting processing`);
    metrics.push("# TYPE ibimina_sms_queue_pending gauge");
    metrics.push(`ibimina_sms_queue_pending ${smsPending ?? 0}`);

    metrics.push(`# HELP ibimina_sms_queue_failed Failed SMS rows awaiting retry`);
    metrics.push("# TYPE ibimina_sms_queue_failed gauge");
    metrics.push(`ibimina_sms_queue_failed ${smsFailed ?? 0}`);

    metrics.push(`# HELP ibimina_notification_queue_pending Pending notification events`);
    metrics.push("# TYPE ibimina_notification_queue_pending gauge");
    metrics.push(`ibimina_notification_queue_pending ${notificationPending ?? 0}`);

    metrics.push(`# HELP ibimina_notification_queue_failed Failed notification events`);
    metrics.push("# TYPE ibimina_notification_queue_failed gauge");
    metrics.push(`ibimina_notification_queue_failed ${notificationErrored ?? 0}`);

    const { count: paymentsPending } = await supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .in("status", ["UNALLOCATED", "PENDING"]);

    metrics.push(`# HELP ibimina_payments_pending Pending or unallocated payments`);
    metrics.push("# TYPE ibimina_payments_pending gauge");
    metrics.push(`ibimina_payments_pending ${paymentsPending ?? 0}`);

    return respond(metrics);
  } catch (error) {
    console.error("metrics-exporter failure", error);
    return new Response("ibimina_health_up 0\n", {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      },
    });
  }
});
