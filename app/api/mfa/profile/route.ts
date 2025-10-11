import { NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export async function GET() {
  const { user, profile } = await requireUserAndProfile();
  const supabase = await createSupabaseServerClient();

  const [{ data: devices }, { data: userRowRaw }, { data: passkeyRows } ] = await Promise.all([
    supabase
      .from("trusted_devices")
      .select("device_id, created_at, last_used_at, ip_prefix")
      .eq("user_id", user.id)
      .order("last_used_at", { ascending: false }),
    supabase
      .from("users")
      .select("mfa_backup_hashes, mfa_enabled, mfa_enrolled_at, mfa_passkey_enrolled")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("webauthn_credentials")
      .select("id, credential_id, friendly_name, created_at, last_used_at, device_type, backed_up")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const userRow = userRowRaw as Pick<Database["public"]["Tables"]["users"]["Row"], "mfa_backup_hashes" | "mfa_enabled" | "mfa_enrolled_at" | "mfa_passkey_enrolled"> | null;

  const deviceRecords = (devices ?? []) as Array<
    Pick<Database["public"]["Tables"]["trusted_devices"]["Row"], "device_id" | "created_at" | "last_used_at" | "ip_prefix">
  >;

  const credentialRecords = (passkeyRows ?? []) as Array<
    Pick<Database["public"]["Tables"]["webauthn_credentials"]["Row"], "id" | "credential_id" | "friendly_name" | "created_at" | "last_used_at" | "device_type" | "backed_up">
  >;

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
    methods: profile.mfa_methods ?? ["TOTP"],
  });
}
