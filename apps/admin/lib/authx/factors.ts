import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type FactorEnrollment = {
  passkey: boolean;
  totp: boolean;
  email: boolean;
  whatsapp: boolean;
  backup: boolean;
};

export type FactorSummary = {
  preferred: string;
  enrolled: FactorEnrollment;
};

const parseEnrollment = (payload: unknown): Record<string, unknown> => {
  if (!payload || typeof payload !== "object") {
    return {};
  }
  return payload as Record<string, unknown>;
};

export const listUserFactors = async (userId: string): Promise<FactorSummary> => {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- authx schema not generated in Database types.
  const authx = (supabase as any).schema("authx");

  const [{ data: mfaRow }, { data: userRow }, { count: passkeyCount }] = await Promise.all([
    authx
      .from("user_mfa")
      .select("preferred_factor,enrollment")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("users")
      .select("mfa_secret_enc, mfa_backup_hashes, mfa_passkey_enrolled, mfa_enabled, email")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("webauthn_credentials")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  type UserRow = {
    mfa_secret_enc: string | null;
    mfa_backup_hashes: string[] | null;
    mfa_passkey_enrolled: boolean | null;
    mfa_enabled: boolean | null;
    email: string | null;
  };

  const userData = (userRow as UserRow | null) ?? null;

  const enrollment = parseEnrollment(mfaRow?.enrollment);
  const whatsappMeta = parseEnrollment(enrollment["whatsapp"]);
  const preferred =
    typeof mfaRow?.preferred_factor === "string" ? mfaRow?.preferred_factor : "passkey";

  const totpEnrolled = Boolean(userData?.mfa_secret_enc);
  const passkeyEnrolled = Boolean(userData?.mfa_passkey_enrolled) || (passkeyCount ?? 0) > 0;
  const emailAvailable = true;
  const whatsappMsisdn =
    typeof whatsappMeta["msisdn"] === "string" ? (whatsappMeta["msisdn"] as string) : null;
  const whatsappEnrolled = Boolean(whatsappMsisdn);
  const backupAvailable =
    Array.isArray(userData?.mfa_backup_hashes) && (userData?.mfa_backup_hashes?.length ?? 0) > 0;

  return {
    preferred,
    enrolled: {
      passkey: passkeyEnrolled,
      totp: totpEnrolled,
      email: emailAvailable,
      whatsapp: whatsappEnrolled,
      backup: backupAvailable,
    },
  };
};
