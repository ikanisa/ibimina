/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import {
  issueSessionCookies,
  verifyPasskey,
  type PasskeyVerificationPayload,
} from "@/lib/authx/verify";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { logAudit } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";

type Payload = PasskeyVerificationPayload;

export async function POST(request: NextRequest) {
  const { user, profile } = await requireUserAndProfile();
  const body = (await request.json().catch(() => null)) as Payload | null;

  if (!body?.response || !body.stateToken) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    await enforceRateLimit(`mfa-passkey:${user.id}`, { maxHits: 8, windowSeconds: 300 });
  } catch (rateError) {
    if ((rateError as Error).message === "rate_limit_exceeded") {
      return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 });
    }
    console.warn("Passkey rate limit check failed", (rateError as Error)?.message ?? rateError);
  }

  let rememberDevice = false;
  let credential: { credential_id: string; device_type: string | null } | null = null;

  try {
    const result = await verifyPasskey({ id: user.id }, body);
    if (!result.ok) {
      await logAudit({
        action: "MFA_PASSKEY_FAILED",
        entity: "USER",
        entityId: user.id,
        diff: null,
      });
      return NextResponse.json({ error: "verification_failed" }, { status: 401 });
    }

    rememberDevice = result.rememberDevice ?? false;
    credential = result.credential;
    await logAudit({
      action: "MFA_PASSKEY_SUCCESS",
      entity: "USER",
      entityId: user.id,
      diff: credential
        ? { credentialId: credential.credential_id, deviceType: credential.device_type }
        : { credentialId: null, deviceType: null },
    });
  } catch (error) {
    console.error("Passkey verification failed", error);
    await logAudit({ action: "MFA_PASSKEY_FAILED", entity: "USER", entityId: user.id, diff: null });
    return NextResponse.json({ error: "verification_failed" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const methods = new Set<string>(profile.mfa_methods ?? ["EMAIL"]);
  methods.add("EMAIL");
  methods.add("PASSKEY");
  if (profile.mfa_enabled) {
    methods.add("TOTP");
  }

  const updatePayload: Database["public"]["Tables"]["users"]["Update"] = {
    failed_mfa_count: 0,
    last_mfa_success_at: new Date().toISOString(),
    mfa_methods: Array.from(methods),
    mfa_passkey_enrolled: true,
    mfa_enabled: true,
  };

  if (!profile.mfa_enrolled_at) {
    updatePayload.mfa_enrolled_at = new Date().toISOString();
  }

  const updateResult = await (supabase as any)
    .from("users")
    .update(updatePayload)
    .eq("id", user.id);
  if (updateResult.error) {
    console.error("Failed to update user record after passkey success", updateResult.error);
    return NextResponse.json({ error: "configuration_error" }, { status: 500 });
  }

  await issueSessionCookies(user.id, rememberDevice);

  return NextResponse.json({ success: true, method: "passkey" });
}

/* eslint-enable @typescript-eslint/no-explicit-any */
