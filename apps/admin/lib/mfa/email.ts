import crypto from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { maskEmail } from "@/lib/mfa/channels";

const EMAIL_CODE_LENGTH = 6;
const EMAIL_CODE_TTL_MINUTES = 10;
const EMAIL_CODE_RATE_LIMIT_SECONDS = 60;
const EMAIL_CODE_MAX_ATTEMPTS = 5;
const EMAIL_CODE_MAX_ACTIVE = 3;

type RateLimitReason = "recent_request" | "active_limit";

const emailPepper = () => {
  const value = process.env.EMAIL_OTP_PEPPER ?? process.env.BACKUP_PEPPER;
  if (!value) {
    throw new Error("EMAIL_OTP_PEPPER (or BACKUP_PEPPER) is not configured");
  }
  return value;
};

const randomCode = (length = EMAIL_CODE_LENGTH) => {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i += 1) {
    const idx = crypto.randomInt(0, digits.length);
    code += digits[idx];
  }
  return code;
};

const deriveDigest = (code: string, salt: string) =>
  crypto.createHash("sha256").update(`${emailPepper()}${salt}${code}`).digest();

const generateSalt = () => crypto.randomBytes(16).toString("base64");

const timingSafeMatch = (expectedBase64: string, candidate: Buffer) => {
  const expected = Buffer.from(expectedBase64, "base64");
  if (expected.length !== candidate.length) {
    return false;
  }
  return crypto.timingSafeEqual(expected, candidate);
};

const sendOtpEmail = async (
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  email: string,
  code: string,
  expiresAt: string
) => {
  const locale = (process.env.MFA_EMAIL_LOCALE ?? "en") as "en" | "fr" | "rw" | string;
  const { error } = await supabase.functions.invoke("mfa-email", {
    body: {
      email,
      code,
      ttlMinutes: EMAIL_CODE_TTL_MINUTES,
      expiresAt,
      locale: ["en", "fr", "rw"].includes(locale) ? locale : "en",
    },
  });

  if (error) {
    throw new Error(error.message ?? "Failed to invoke mfa-email function");
  }
};

export const issueEmailOtp = async (userId: string, email: string) => {
  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();

  const { data: activeRowsRaw, error: activeError } = await supabase
    .schema("app")
    .from("mfa_email_codes")
    .select("id, created_at, expires_at")
    .eq("user_id", userId)
    .is("consumed_at", null)
    .gte("expires_at", nowIso)
    .order("created_at", { ascending: false });

  if (activeError) {
    throw activeError;
  }

  const activeRows = (activeRowsRaw ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at ?? nowIso,
    expires_at: row.expires_at,
  }));

  let rateLimited = false;
  const reasons: RateLimitReason[] = [];
  const retryCandidates: Date[] = [];

  if (activeRows.length > 0) {
    const mostRecentCreated = new Date(activeRows[0].created_at);
    const windowMs = EMAIL_CODE_RATE_LIMIT_SECONDS * 1000;
    if (now.getTime() - mostRecentCreated.getTime() < windowMs) {
      rateLimited = true;
      reasons.push("recent_request");
      const retryAt = new Date(mostRecentCreated);
      retryAt.setSeconds(retryAt.getSeconds() + EMAIL_CODE_RATE_LIMIT_SECONDS);
      retryCandidates.push(retryAt);
    }
  }

  if (activeRows.length >= EMAIL_CODE_MAX_ACTIVE) {
    rateLimited = true;
    reasons.push("active_limit");
    const earliestExpiry = activeRows
      .map((row) => new Date(row.expires_at))
      .reduce((earliest, candidate) => (candidate < earliest ? candidate : earliest));
    retryCandidates.push(earliestExpiry);
  }

  if (rateLimited) {
    const retryAt = retryCandidates.reduce(
      (latest, candidate) => (candidate > latest ? candidate : latest),
      retryCandidates[0]
    );
    return {
      status: "rate_limited" as const,
      retryAt,
      reason: reasons.includes("active_limit") ? "active_limit" : "recent_request",
    };
  }

  const code = randomCode();
  const salt = generateSalt();
  const digest = deriveDigest(code, salt);
  const expiresAt = new Date(now.getTime() + EMAIL_CODE_TTL_MINUTES * 60 * 1000).toISOString();

  const { error: insertError } = await supabase
    .schema("app")
    .from("mfa_email_codes")
    .insert({
      user_id: userId,
      code_hash: digest.toString("base64"),
      salt,
      expires_at: expiresAt,
    });

  if (insertError) {
    throw insertError;
  }

  await sendOtpEmail(supabase, email, code, expiresAt);
  await logAudit({
    action: "MFA_EMAIL_CODE_SENT",
    entity: "USER",
    entityId: userId,
    diff: { email: maskEmail(email) ?? email },
  });

  return { status: "issued" as const, expiresAt };
};

export const verifyEmailOtp = async (userId: string, code: string) => {
  const supabase = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const { data: rows, error } = await supabase
    .schema("app")
    .from("mfa_email_codes")
    .select("id, code_hash, salt, expires_at, attempt_count")
    .eq("user_id", userId)
    .is("consumed_at", null)
    .gte("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(EMAIL_CODE_MAX_ACTIVE + 2);

  if (error) {
    throw error;
  }

  if (!rows || rows.length === 0) {
    return { ok: false as const, reason: "no_active_code" as const };
  }

  const supa = supabase.schema("app").from("mfa_email_codes");

  for (const row of rows) {
    if (row.attempt_count >= EMAIL_CODE_MAX_ATTEMPTS) {
      await supa.update({ consumed_at: nowIso }).eq("id", row.id);
      continue;
    }

    const digest = deriveDigest(code, row.salt);
    if (timingSafeMatch(row.code_hash, digest)) {
      await supa.update({ consumed_at: nowIso }).eq("id", row.id);
      await logAudit({
        action: "MFA_EMAIL_VERIFIED",
        entity: "USER",
        entityId: userId,
        diff: null,
      });
      return { ok: true as const, expiresAt: row.expires_at };
    }

    await supa.update({ attempt_count: row.attempt_count + 1 }).eq("id", row.id);
  }

  await logAudit({
    action: "MFA_EMAIL_FAILED",
    entity: "USER",
    entityId: userId,
    diff: { reason: "invalid_code" },
  });

  return { ok: false as const, reason: "invalid_code" as const };
};
