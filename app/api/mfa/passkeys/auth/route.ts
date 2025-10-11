/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "node:crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { requireUserAndProfile } from "@/lib/auth";
import {
  MFA_SESSION_COOKIE,
  TRUSTED_DEVICE_COOKIE,
  createMfaSessionToken,
  createTrustedDeviceToken,
  sessionTtlSeconds,
  trustedTtlSeconds,
} from "@/lib/mfa/session";
import { verifyAuthentication } from "@/lib/mfa/passkeys";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { deriveIpPrefix, hashDeviceFingerprint, hashUserAgent } from "@/lib/mfa/trusted-device";
import { logAudit } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";

type Payload = {
  response: AuthenticationResponseJSON;
  stateToken: string;
};

export async function POST(request: Request) {
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

  try {
    const verification = await verifyAuthentication(user, body.response, body.stateToken);
    rememberDevice = verification.rememberDevice;
    await logAudit({
      action: "MFA_PASSKEY_SUCCESS",
      entity: "USER",
      entityId: user.id,
      diff: {
        credentialId: verification.credential.credential_id,
        deviceType: verification.credential.device_type,
      },
    });
  } catch (error) {
    console.error("Passkey verification failed", error);
    await logAudit({ action: "MFA_PASSKEY_FAILED", entity: "USER", entityId: user.id, diff: null });
    return NextResponse.json({ error: "verification_failed" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const methods = new Set(profile.mfa_methods ?? []);
  methods.add("PASSKEY");

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

  const headerList = await headers();
  const userAgent = headerList.get("user-agent") ?? "";
  const ip = headerList.get("x-forwarded-for") ?? headerList.get("x-real-ip") ?? null;
  const userAgentHash = hashUserAgent(userAgent);
  const ipPrefix = deriveIpPrefix(ip);

  const response = NextResponse.json({ success: true, method: "passkey" });
  const sessionToken = createMfaSessionToken(user.id, sessionTtlSeconds());

  if (sessionToken) {
    response.cookies.set({
      name: MFA_SESSION_COOKIE,
      value: sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: sessionTtlSeconds(),
    });
  }

  if (rememberDevice) {
    const deviceId = crypto.randomUUID();
    const fingerprint = hashDeviceFingerprint(user.id, userAgentHash, ipPrefix);

    const trustedInsert: Database["public"]["Tables"]["trusted_devices"]["Insert"] = {
      user_id: user.id,
      device_id: deviceId,
      device_fingerprint_hash: fingerprint,
      user_agent_hash: userAgentHash,
      ip_prefix: ipPrefix,
      last_used_at: new Date().toISOString(),
    };

    const trustedResult = await (supabase as any)
      .from("trusted_devices")
      .upsert(trustedInsert, { onConflict: "user_id,device_id" });
    if (!trustedResult.error) {
      const trustedToken = createTrustedDeviceToken(user.id, deviceId, trustedTtlSeconds());
      if (trustedToken) {
        response.cookies.set({
          name: TRUSTED_DEVICE_COOKIE,
          value: trustedToken,
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          path: "/",
          maxAge: trustedTtlSeconds(),
        });
      }
    }
  }

  return response;
}

/* eslint-enable @typescript-eslint/no-explicit-any */
