import { NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export async function GET() {
  const { user, profile } = await requireUserAndProfile();
  const supabase = await createSupabaseServerClient();

  const [{ data: devices }, { data: userRowRaw }] = await Promise.all([
    supabase
      .from("trusted_devices")
      .select("device_id, created_at, last_used_at, ip_prefix")
      .eq("user_id", user.id)
      .order("last_used_at", { ascending: false }),
    supabase
      .from("users")
      .select("mfa_backup_hashes, mfa_enabled, mfa_enrolled_at")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const userRow = userRowRaw as Pick<Database["public"]["Tables"]["users"]["Row"], "mfa_backup_hashes" | "mfa_enabled" | "mfa_enrolled_at"> | null;

  const deviceRecords = (devices ?? []) as Array<
    Pick<Database["public"]["Tables"]["trusted_devices"]["Row"], "device_id" | "created_at" | "last_used_at" | "ip_prefix">
  >;

  return NextResponse.json({
    mfaEnabled: Boolean(userRow?.mfa_enabled),
    enrolledAt: userRow?.mfa_enrolled_at ?? null,
    backupCount: userRow?.mfa_backup_hashes?.length ?? 0,
    trustedDevices: deviceRecords.map((device) => ({
      deviceId: device.device_id,
      createdAt: device.created_at,
      lastUsedAt: device.last_used_at,
      ipPrefix: device.ip_prefix,
    })),
    methods: profile.mfa_methods ?? ["TOTP"],
  });
}
