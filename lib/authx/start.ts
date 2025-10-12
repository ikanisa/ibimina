import { issueEmailOtp } from "@/lib/mfa/email";
import { createAuthenticationOptions } from "@/lib/mfa/passkeys";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { randDigits, sha256Hex } from "@/lib/authx/crypto";
import { listUserFactors } from "@/lib/authx/factors";

export const startPasskeyChallenge = async (user: { id: string }) => {
  const { options, stateToken } = await createAuthenticationOptions({ id: user.id });
  return { options, stateToken };
};

export const sendEmailOtp = async (user: { id: string; email: string | null }) => {
  if (!user.email) {
    return { channel: "email", sent: false, error: "missing_email" } as const;
  }

  const supabase = createSupabaseAdminClient();
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
    await supabase
      .schema("authx")
      .from("otp_issues")
      .insert({ user_id: user.id, channel: "email", legacy_code_id: latest.id, expires_at: latest.expires_at });
  }

  return { channel: "email", sent: true, expiresAt: latest?.expires_at ?? result.expiresAt } as const;
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

export const sendWhatsAppOtp = async (user: { id: string }) => {
  const supabase = createSupabaseAdminClient();
  const { enrolled } = await listUserFactors(user.id);

  if (!enrolled.whatsapp) {
    return { channel: "whatsapp", sent: false, error: "not_enrolled" } as const;
  }

  const { data: mfaRow } = await supabase
    .schema("authx")
    .from("user_mfa")
    .select("enrollment")
    .eq("user_id", user.id)
    .maybeSingle();

  const enrollment = (mfaRow?.enrollment as Record<string, unknown> | undefined) ?? {};
  const msisdn = extractWhatsappMsisdn(enrollment);

  if (!msisdn) {
    return { channel: "whatsapp", sent: false, error: "missing_msisdn" } as const;
  }

  const code = randDigits(6);
  const hash = sha256Hex(`${process.env.BACKUP_PEPPER ?? ""}${code}`);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase
    .schema("authx")
    .from("otp_issues")
    .insert({
      user_id: user.id,
      channel: "whatsapp",
      code_hash: hash,
      expires_at: expiresAt,
      meta: { msisdn },
    });

  await sendTwilioWhatsapp(msisdn, `Your SACCO+ security code is ${code}. It expires in 10 minutes.`);

  return { channel: "whatsapp", sent: true, expiresAt } as const;
};
