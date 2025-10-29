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
    await authx.from("otp_issues").insert({
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

// WhatsApp OTP temporarily disabled - Meta WhatsApp Business API integration pending
// Users should use passkey, TOTP, email, or backup codes for MFA
export const sendWhatsAppOtp = async (user: { id: string }) => {
  console.info("WhatsApp OTP temporarily disabled - Meta integration pending", { userId: user.id });
  return {
    channel: "whatsapp",
    sent: false,
    error: "whatsapp_disabled",
  } as const;
};
