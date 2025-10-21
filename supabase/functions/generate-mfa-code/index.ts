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

const digitAlphabet = "0123456789";

const bufferToBase64 = (buffer: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

const generateDigits = (length: number) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += digitAlphabet[bytes[i] % digitAlphabet.length];
  }
  return result;
};

const generateSalt = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bufferToBase64(bytes.buffer);
};

const loadPepper = () => {
  const value = Deno.env.get("EMAIL_OTP_PEPPER") ?? Deno.env.get("BACKUP_PEPPER");
  if (!value) {
    throw new Error("EMAIL_OTP_PEPPER (or BACKUP_PEPPER) is not configured");
  }
  return value;
};

const deriveDigest = async (code: string, salt: string, pepper: string) => {
  const data = new TextEncoder().encode(`${pepper}${salt}${code}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufferToBase64(digest);
};

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
  let pepper: string;

  try {
    pepper = loadPepper();
  } catch (error) {
    console.error("generate-mfa-code: missing pepper configuration", error);
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const salt = generateSalt();
  const codeHash = await deriveDigest(code, salt, pepper);

  const { error } = await supabase.schema("app").from("mfa_email_codes").insert({
    user_id: userId,
    code_hash: codeHash,
    salt,
    expires_at: expiresAt.toISOString(),
    attempt_count: 0,
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

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
