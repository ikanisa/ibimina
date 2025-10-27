import { issueEmailOtp } from "@/lib/mfa/email";
import { createAuthenticationOptions } from "@/lib/mfa/passkeys";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { randDigits } from "@/lib/authx/crypto";
import { listUserFactors } from "@/lib/authx/factors";
import { hashOneTimeCode, hashRateLimitKey } from "@/src/auth/util/crypto";

const safeHash = (...parts: Parameters<typeof hashRateLimitKey>) => {
  try {
    return hashRateLimitKey(...parts);
  } catch (error) {
    console.warn("rate_limit_hash_unavailable", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

export const startPasskeyChallenge = async (user: { id: string }) => {
  const { options, stateToken } = await createAuthenticationOptions({ id: user.id });
  return { options, stateToken };
};

export const sendEmailOtp = async (user: { id: string; email: string | null }) => {
  if (!user.email) {
    return { channel: "email", sent: false, error: "missing_email" } as const;
  }

  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- authx schema is unmanaged by generated types.
  const authx = (supabase as any).schema("authx");
  const result = await issueEmailOtp(user.id, user.email);
  if (result.status !== "issued") {
    return { channel: "email", sent: false, error: "rate_limited" } as const;
  }

  const { data: latest } = await supabase
    .schema("app")
    .from("mfa_email_codes")
    .select("id, expires_at, created_at")
    .eq("user_id", user.id)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest) {
    await authx
      .from("otp_issues")
      .insert({
        user_id: user.id,
        channel: "email",
        legacy_code_id: latest.id,
        expires_at: latest.expires_at,
      });
  }

  return {
    channel: "email",
    sent: true,
    expiresAt: latest?.expires_at ?? result.expiresAt,
  } as const;
};

const extractWhatsappMsisdn = (enrollment: Record<string, unknown>): string | null => {
  const whatsapp = enrollment["whatsapp"];
  if (!whatsapp || typeof whatsapp !== "object") {
    return null;
  }

  const msisdn = (whatsapp as Record<string, unknown>)["msisdn"];
  return typeof msisdn === "string" && msisdn.length > 0 ? msisdn : null;
};

const sendTwilioWhatsapp = async (to: string, body: string) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from) {
    console.info("Twilio credentials not configured; skipping WhatsApp send", { to, body });
    return;
  }

  const credentials = Buffer.from(`${sid}:${token}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: from,
      To: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
      Body: body,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "unknown");
    console.error("Twilio WhatsApp send failed", response.status, errorBody);
  }
};

const WHATSAPP_RATE_LIMIT_SECONDS = 60;
const WHATSAPP_MAX_ACTIVE = 3;

export const sendWhatsAppOtp = async (user: { id: string }) => {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- authx schema is unmanaged by generated types.
  const authx = (supabase as any).schema("authx");
  const { enrolled } = await listUserFactors(user.id);

  if (!enrolled.whatsapp) {
    return { channel: "whatsapp", sent: false, error: "not_enrolled" } as const;
  }

  const { data: mfaRow } = await authx
    .from("user_mfa")
    .select("enrollment")
    .eq("user_id", user.id)
    .maybeSingle();

  const enrollment = (mfaRow?.enrollment as Record<string, unknown> | undefined) ?? {};
  const msisdn = extractWhatsappMsisdn(enrollment);

  if (!msisdn) {
    return { channel: "whatsapp", sent: false, error: "missing_msisdn" } as const;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const { data: activeRowsRaw, error: activeError } = await authx
    .from("otp_issues")
    .select("id, created_at, expires_at")
    .eq("user_id", user.id)
    .eq("channel", "whatsapp")
    .is("used_at", null)
    .gte("expires_at", nowIso)
    .order("created_at", { ascending: false });

  if (activeError) {
    console.error("whatsapp_otp_active_fetch_failed", {
      userId: user.id,
      message: activeError.message,
    });
    return { channel: "whatsapp", sent: false, error: "issue_failed" } as const;
  }

  const activeRows = (activeRowsRaw ?? []).map(
    (row: { created_at?: string | null; expires_at: string | null }) => ({
      created_at: row.created_at ?? nowIso,
      expires_at: row.expires_at,
    })
  );

  let rateLimited = false;
  const retryCandidates: Date[] = [];

  if (activeRows.length > 0) {
    const mostRecent = new Date(activeRows[0].created_at);
    if (now.getTime() - mostRecent.getTime() < WHATSAPP_RATE_LIMIT_SECONDS * 1000) {
      rateLimited = true;
      const retryAt = new Date(mostRecent);
      retryAt.setSeconds(retryAt.getSeconds() + WHATSAPP_RATE_LIMIT_SECONDS);
      retryCandidates.push(retryAt);
    }
  }

  if (activeRows.length >= WHATSAPP_MAX_ACTIVE) {
    rateLimited = true;
    const expiryDates = activeRows.map(
      (row: { expires_at: string | null }) => new Date(row.expires_at ?? nowIso)
    );
    const earliestExpiry = expiryDates.reduce(
      (earliest: Date, candidate: Date) => (candidate < earliest ? candidate : earliest),
      expiryDates[0]
    );
    retryCandidates.push(earliestExpiry);
  }

  if (rateLimited) {
    const seed = retryCandidates[0] ?? new Date(now.getTime() + WHATSAPP_RATE_LIMIT_SECONDS * 1000);
    const retryAt = retryCandidates.reduce(
      (latest, candidate) => (candidate > latest ? candidate : latest),
      seed
    );
    await authx.from("audit").insert({
      actor: user.id,
      action: "MFA_WHATSAPP_RATE_LIMITED",
      detail: { retryAt: retryAt.toISOString(), hashed: safeHash("whatsapp", user.id) },
    });
    return {
      channel: "whatsapp",
      sent: false,
      error: "rate_limited",
      retryAt: retryAt.toISOString(),
    } as const;
  }

  const code = randDigits(6);
  const hash = hashOneTimeCode(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await authx.from("otp_issues").insert({
    user_id: user.id,
    channel: "whatsapp",
    code_hash: hash,
    expires_at: expiresAt,
    meta: { msisdn },
  });

  await sendTwilioWhatsapp(
    msisdn,
    `Your SACCO+ security code is ${code}. It expires in 10 minutes.`
  );

  return { channel: "whatsapp", sent: true, expiresAt } as const;
};
