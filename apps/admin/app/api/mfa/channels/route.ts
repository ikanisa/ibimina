import { NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildChannelSummary } from "@/lib/mfa/channels";

export async function GET() {
  const { user, profile } = await requireUserAndProfile();
  const supabase = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  type PasskeyRow = { last_used_at: string | null };
  type EmailCodeRow = { created_at: string | null; consumed_at: string | null; expires_at: string };

  const [passkeysResult, emailCodesResult] = await Promise.all([
    supabase
      .from("webauthn_credentials")
      .select("id, last_used_at")
      .eq("user_id", user.id)
      .order("last_used_at", { ascending: false })
      .limit(5),
    supabase
      .schema("app")
      .from("mfa_email_codes")
      .select("created_at, consumed_at, expires_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (passkeysResult.error) {
    console.error("Failed to load passkey records", passkeysResult.error);
  }
  if (emailCodesResult.error) {
    console.error("Failed to load email OTP records", emailCodesResult.error);
  }

  const passkeys = (passkeysResult.data ?? ([] as PasskeyRow[])).map((record) => ({
    last_used_at: record.last_used_at ?? null,
  }));

  const emailCodes = (emailCodesResult.data ?? ([] as EmailCodeRow[])).map((record) => ({
    created_at: record.created_at ?? null,
    consumed_at: record.consumed_at ?? null,
    expires_at: record.expires_at,
  }));

  const summary = buildChannelSummary({
    mfaEnabled: Boolean(profile.mfa_enabled),
    passkeyEnrolled: Boolean(profile.mfa_passkey_enrolled),
    backupCount: profile.mfa_backup_hashes?.length ?? 0,
    enrolledAt: profile.mfa_enrolled_at ?? null,
    email: user.email ?? null,
    passkeyRecords: passkeys,
    emailCodeRecords: emailCodes,
    activeMethods: profile.mfa_methods ?? [],
  });

  // Ensure active code calculations use consistent timestamp reference
  summary.channels = summary.channels.map((channel) => {
    if (channel.id !== "EMAIL") {
      return channel;
    }
    const activeCodes = emailCodes.filter(
      (code) => !code.consumed_at && code.expires_at >= nowIso
    ).length;
    return { ...channel, activeCodes };
  });

  return NextResponse.json(summary);
}
