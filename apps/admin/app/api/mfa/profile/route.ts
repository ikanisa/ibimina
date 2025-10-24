import { NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { buildChannelSummary, type EmailCodeRecord, type PasskeySummaryRecord } from "@/lib/mfa/channels";

export async function GET() {
  const { user, profile } = await requireUserAndProfile();
  const supabase = await createSupabaseServerClient();

  type AuditRow = { id: string; action: string; created_at: string | null; diff_json: Record<string, unknown> | null };

  const [{ data: devices }, { data: userRowRaw }, { data: passkeyRows }] = await Promise.all([
    supabase
      .from("trusted_devices")
      .select("device_id, created_at, last_used_at, ip_prefix")
      .eq("user_id", user.id)
      .order("last_used_at", { ascending: false }),
    supabase
      .from("users")
      .select("mfa_backup_hashes, mfa_enabled, mfa_enrolled_at, mfa_passkey_enrolled, mfa_methods")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("webauthn_credentials")
      .select("id, credential_id, friendly_name, created_at, last_used_at, device_type, backed_up")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const userRow = userRowRaw as Pick<
    Database["public"]["Tables"]["users"]["Row"],
    "mfa_backup_hashes" | "mfa_enabled" | "mfa_enrolled_at" | "mfa_passkey_enrolled" | "mfa_methods"
  > | null;

  const deviceRecords = (devices ?? []) as Array<
    Pick<Database["public"]["Tables"]["trusted_devices"]["Row"], "device_id" | "created_at" | "last_used_at" | "ip_prefix">
  >;

  const credentialRecords = (passkeyRows ?? []) as Array<
    Pick<Database["public"]["Tables"]["webauthn_credentials"]["Row"], "id" | "credential_id" | "friendly_name" | "created_at" | "last_used_at" | "device_type" | "backed_up">
  >;

  const admin = createSupabaseAdminClient();
  const { data: emailCodeRows, error: emailCodeError } = await admin
    .schema("app")
    .from("mfa_email_codes")
    .select("created_at, consumed_at, expires_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (emailCodeError) {
    console.error("profile: failed to load email OTP records", emailCodeError);
  }

  const emailCodes = (emailCodeRows ?? []).map((record) => ({
    created_at: record.created_at ?? null,
    consumed_at: record.consumed_at ?? null,
    expires_at: record.expires_at,
  })) as EmailCodeRecord[];

  const passkeySummary = credentialRecords.map((credential) => ({
    last_used_at: credential.last_used_at,
  })) as PasskeySummaryRecord[];

  const channelSummary = buildChannelSummary({
    mfaEnabled: Boolean(userRow?.mfa_enabled),
    passkeyEnrolled: Boolean(userRow?.mfa_passkey_enrolled),
    backupCount: userRow?.mfa_backup_hashes?.length ?? 0,
    enrolledAt: userRow?.mfa_enrolled_at ?? null,
    email: user.email ?? null,
    passkeyRecords: passkeySummary,
    emailCodeRecords: emailCodes,
    activeMethods: profile.mfa_methods ?? [],
  });

  const emailAuditActions = ["MFA_EMAIL_CODE_SENT", "MFA_EMAIL_VERIFIED", "MFA_EMAIL_FAILED"] as const;
  const { data: auditRows, error: auditError } = await admin
    .from("audit_logs")
    .select("id, action, created_at, diff_json")
    .eq("entity", "USER")
    .eq("entity_id", user.id)
    .in("action", emailAuditActions)
    .order("created_at", { ascending: false })
    .limit(20);

  if (auditError) {
    console.error("profile: failed to load audit logs", auditError);
  }

  const methodSet = new Set([...(profile.mfa_methods ?? userRow?.mfa_methods ?? [])]);
  if (userRow?.mfa_passkey_enrolled) {
    methodSet.add("PASSKEY");
  }

  return NextResponse.json({
    mfaEnabled: Boolean(userRow?.mfa_enabled),
    enrolledAt: userRow?.mfa_enrolled_at ?? null,
    backupCount: userRow?.mfa_backup_hashes?.length ?? 0,
    passkeyEnrolled: Boolean(userRow?.mfa_passkey_enrolled),
    trustedDevices: deviceRecords.map((device) => ({
      deviceId: device.device_id,
      createdAt: device.created_at,
      lastUsedAt: device.last_used_at,
      ipPrefix: device.ip_prefix,
    })),
    passkeys: credentialRecords.map((credential) => ({
      id: credential.id,
      credentialId: credential.credential_id,
      label: credential.friendly_name,
      createdAt: credential.created_at,
      lastUsedAt: credential.last_used_at,
      deviceType: credential.device_type,
      backedUp: credential.backed_up,
    })),
    methods: Array.from(methodSet),
    channelSummary,
    emailAudit: (auditRows ?? ([] as AuditRow[])).map((row) => ({
      id: row.id,
      action: row.action,
      createdAt: row.created_at,
      diff: row.diff_json as Record<string, unknown> | null,
    })),
  });
}
