import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

type RequestBody = {
  user_id?: unknown;
  ttl_seconds?: unknown;
  channel?: unknown;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const adminToken = Deno.env.get("ADMIN_API_TOKEN") ?? "";

if (!supabaseUrl || !supabaseKey) {
  console.error("generate-mfa-code: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (adminToken) {
    const provided = extractToken(req.headers);
    if (!provided || provided !== adminToken) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
  }

  let payload: RequestBody;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("generate-mfa-code: invalid JSON", error);
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const userId = typeof payload.user_id === "string" ? payload.user_id.trim() : "";
  if (!userId) {
    return jsonResponse({ error: "Missing user_id" }, 400);
  }

  const ttlSeconds = normalizeTtlSeconds(payload.ttl_seconds);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const code = generateDigits(6);

  const { error } = await supabase.from("mfa_codes").insert({
    user_id: userId,
    code,
    expires_at: expiresAt.toISOString(),
    channel: typeof payload.channel === "string" ? payload.channel : "generic",
  });

  if (error) {
    console.error("generate-mfa-code: failed to insert code", error);
    return jsonResponse({ error: "Failed to persist MFA code" }, 500);
  }

  return jsonResponse({
    code,
    expires_at: expiresAt.toISOString(),
    ttl_seconds: ttlSeconds,
  });
});

function extractToken(headers: Headers): string | null {
  const authorization = headers.get("authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }
  const headerToken = headers.get("x-admin-token");
  return headerToken ? headerToken.trim() : null;
}

function normalizeTtlSeconds(raw: unknown): number {
  const fallback = 300; // default 5 minutes
  const num = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(num)) return fallback;
  return Math.min(Math.max(Math.trunc(num), 60), 900);
}

function generateDigits(length: number): string {
  const max = 10 ** length;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] % max).toString().padStart(length, "0");
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
