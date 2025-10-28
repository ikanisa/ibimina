import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface HealthCheckResult {
  ok: boolean;
  timestamp: string;
  version: string;
  checks: {
    database: {
      ok: boolean;
      latency_ms?: number;
      error?: string;
    };
    auth: {
      ok: boolean;
      error?: string;
    };
  };
}

export async function GET() {
  const checks: HealthCheckResult["checks"] = {
    database: { ok: false },
    auth: { ok: false },
  };

  // Check database connectivity
  try {
    const supabase = createSupabaseServiceRoleClient("health-check");
    const dbStart = Date.now();
    const { error: dbError } = await supabase.from("users").select("id").limit(1);
    const dbLatency = Date.now() - dbStart;

    if (dbError) {
      checks.database = { ok: false, error: dbError.message };
    } else {
      checks.database = { ok: true, latency_ms: dbLatency };
    }
  } catch (error) {
    checks.database = {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }

  // Check auth service
  try {
    const supabase = createSupabaseServiceRoleClient("health-check-auth");
    const { error: authError } = await supabase.auth.getSession();
    checks.auth = { ok: !authError, error: authError?.message };
  } catch (error) {
    checks.auth = {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown auth error",
    };
  }

  const overallOk = checks.database.ok && checks.auth.ok;

  const response: HealthCheckResult = {
    ok: overallOk,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
    checks,
  };

  return NextResponse.json(response, {
    status: overallOk ? 200 : 503,
  });
}
