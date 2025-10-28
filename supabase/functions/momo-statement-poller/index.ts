import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateHmacRequest } from "../_shared/auth.ts";
import { recordMetric } from "../_shared/metrics.ts";
import { requireEnv } from "../_shared/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-signature, x-timestamp",
};

const MAX_BATCH = Math.max(parseInt(Deno.env.get("MOMO_POLL_MAX_BATCH") ?? "100", 10), 1);

interface PollerConfig {
  id: string;
  sacco_id: string | null;
  provider: string | null;
  display_name: string | null;
  endpoint_url: string;
  auth_header: string | null;
  cursor: string | null;
  status: string;
}

interface StatementPayload {
  id: string;
  occurred_at: string;
  amount?: number;
  msisdn?: string;
  reference?: string;
  [key: string]: unknown;
}

interface PollResponse {
  statements: StatementPayload[];
  nextCursor?: string | null;
}

const fetchStatements = async (poller: PollerConfig): Promise<PollResponse> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const headers = new Headers();
    headers.set("accept", "application/json");
    if (poller.auth_header) {
      headers.set("authorization", poller.auth_header);
    }
    if (poller.cursor) {
      headers.set("x-last-cursor", poller.cursor);
    }

    const response = await fetch(poller.endpoint_url, {
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Polling failed with status ${response.status}`);
    }

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const statements = Array.isArray(data.statements)
      ? (data.statements.filter((item) => item && typeof item === "object") as StatementPayload[])
      : [];

    const nextCursor = typeof data.nextCursor === "string" ? data.nextCursor : null;

    return { statements: statements.slice(0, MAX_BATCH), nextCursor };
  } finally {
    clearTimeout(timeout);
  }
};

const nowIso = () => new Date().toISOString();

const computeLatency = (occurredAt: string): number | null => {
  const occurred = Date.parse(occurredAt);
  if (Number.isNaN(occurred)) {
    return null;
  }
  return Date.now() - occurred;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const validation = await validateHmacRequest(req, { toleranceSeconds: 120 });

    if (!validation.ok) {
      console.warn("momo-statement-poller.signature_invalid", { reason: validation.reason });
      const status = validation.reason === "stale_timestamp" ? 408 : 401;
      return new Response(JSON.stringify({ success: false, error: "invalid_signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status,
      });
    }

    const supabaseUrl = requireEnv("SUPABASE_URL");
    const supabaseKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { "X-Client-Info": "ibimina/momo-statement-poller" } },
    });

    const { data: pollers, error: pollerError } = await supabase
      .schema("app")
      .from("momo_statement_pollers")
      .select("id, sacco_id, provider, display_name, endpoint_url, auth_header, cursor, status")
      .eq("status", "ACTIVE");

    if (pollerError) {
      throw pollerError;
    }

    if (!pollers?.length) {
      return new Response(JSON.stringify({ success: true, processed: 0, inserted: 0, jobs: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let inserted = 0;
    let jobs = 0;

    for (const poller of pollers as PollerConfig[]) {
      try {
        const result = await fetchStatements(poller);
        processed += result.statements.length;

        let totalLatency = 0;
        let latencySamples = 0;

        for (const statement of result.statements) {
          if (!statement.id) {
            continue;
          }

          const latency = statement.occurred_at ? computeLatency(statement.occurred_at) : null;
          if (latency && latency > 0) {
            totalLatency += latency;
            latencySamples += 1;
          }

          const { data: stagingRows, error: stagingError } = await supabase
            .schema("app")
            .from("momo_statement_staging")
            .insert(
              {
                poller_id: poller.id,
                sacco_id: poller.sacco_id,
                external_id: statement.id,
                payload: statement,
                statement_date: statement.occurred_at ? statement.occurred_at.slice(0, 10) : null,
                latency_ms: latency ?? null,
                polled_at: nowIso(),
              },
              { returning: "representation", defaultToNull: true }
            )
            .select();

          if (stagingError) {
            if (stagingError.code === "23505") {
              continue; // duplicate
            }
            throw stagingError;
          }

          if (!stagingRows || stagingRows.length === 0) {
            continue;
          }

          inserted += stagingRows.length;

          const stagingRow = stagingRows[0] as { id: string } | null;
          if (!stagingRow?.id) {
            continue;
          }

          const { data: jobRows, error: jobError } = await supabase
            .schema("app")
            .from("reconciliation_jobs")
            .insert(
              {
                staging_id: stagingRow.id,
                sacco_id: poller.sacco_id,
                job_type: "STATEMENT_SYNC",
                status: "PENDING",
                queued_at: nowIso(),
                meta: { pollerId: poller.id, provider: poller.provider ?? "unknown" },
              },
              { returning: "representation", defaultToNull: true }
            )
            .select();

          if (jobError) {
            throw jobError;
          }

          if (jobRows?.[0]?.id) {
            const jobId = (jobRows[0] as { id: string }).id;
            jobs += 1;
            await supabase
              .schema("app")
              .from("momo_statement_staging")
              .update({ queued_job_id: jobId, status: "QUEUED" })
              .eq("id", stagingRow.id);
          }
        }

        const averageLatency =
          latencySamples > 0 ? Math.round(totalLatency / latencySamples) : null;
        await supabase
          .schema("app")
          .from("momo_statement_pollers")
          .update({
            last_polled_at: nowIso(),
            last_latency_ms: averageLatency,
            last_polled_count: result.statements.length,
            cursor: result.nextCursor ?? poller.cursor,
            last_error: null,
          })
          .eq("id", poller.id);

        if (result.statements.length > 0) {
          await recordMetric(supabase, "momo_statements_polled", result.statements.length, {
            pollerId: poller.id,
            provider: poller.provider ?? "unknown",
          });
        }

        if (averageLatency !== null) {
          await recordMetric(supabase, "momo_poll_latency_ms", averageLatency, {
            pollerId: poller.id,
          });
        }
      } catch (error) {
        console.error("momo-statement-poller failure", error);
        await supabase
          .schema("app")
          .from("momo_statement_pollers")
          .update({
            last_error: error instanceof Error ? error.message : String(error),
            last_polled_at: nowIso(),
          })
          .eq("id", poller.id);
        await recordMetric(supabase, "momo_poll_failure", 1, { pollerId: poller.id });
      }
    }

    return new Response(JSON.stringify({ success: true, processed, inserted, jobs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("momo-statement-poller unhandled", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
