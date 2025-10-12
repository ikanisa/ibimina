import { NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const { user, profile } = await requireUserAndProfile();
  const supabase = createSupabaseAdminClient();

  const methods = new Set(profile.mfa_methods ?? []);
  if (!profile.mfa_enabled) {
    methods.delete("TOTP");
  }
  methods.add("EMAIL");

  const updatePayload: Database["public"]["Tables"]["users"]["Update"] = {
    mfa_enabled: true,
    mfa_methods: Array.from(methods),
    failed_mfa_count: 0,
  };

  if (!profile.mfa_enrolled_at) {
    updatePayload.mfa_enrolled_at = new Date().toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("users")
    .update(updatePayload)
    .eq("id", user.id);
  if (error) {
    console.error("Enable email MFA failed", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  await supabase.from("trusted_devices").delete().eq("user_id", user.id);

  await logAudit({
    action: "MFA_EMAIL_ENABLED",
    entity: "USER",
    entityId: user.id,
    diff: { methods: Array.from(methods) },
  });

  return NextResponse.json({ success: true, methods: Array.from(methods) });
}

export async function DELETE() {
  const { user, profile } = await requireUserAndProfile();
  const supabase = createSupabaseAdminClient();

  const methods = new Set(profile.mfa_methods ?? []);
  methods.delete("EMAIL");

  const remaining = Array.from(methods);
  const stillProtected = remaining.length > 0;

  const updatePayload: Database["public"]["Tables"]["users"]["Update"] = {
    mfa_enabled: stillProtected,
    mfa_methods: remaining,
  };

  if (!stillProtected) {
    updatePayload.mfa_enrolled_at = null;
    updatePayload.failed_mfa_count = 0;
    updatePayload.last_mfa_step = null;
    updatePayload.last_mfa_success_at = null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("users")
    .update(updatePayload)
    .eq("id", user.id);
  if (error) {
    console.error("Disable email MFA failed", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  // Clean up any outstanding email codes when removing the channel
  await supabase.schema("app").from("mfa_email_codes").delete().eq("user_id", user.id);
  await supabase.from("trusted_devices").delete().eq("user_id", user.id);

  await logAudit({
    action: "MFA_EMAIL_DISABLED",
    entity: "USER",
    entityId: user.id,
    diff: { remaining },
  });

  return NextResponse.json({ success: true, methods: remaining });
}
