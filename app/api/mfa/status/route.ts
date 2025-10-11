import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import {
  MFA_SESSION_COOKIE,
  TRUSTED_DEVICE_COOKIE,
  createMfaSessionToken,
  createTrustedDeviceToken,
  readCookieToken,
  verifyMfaSessionToken,
  verifyTrustedDeviceToken,
  sessionTtlSeconds,
  trustedTtlSeconds,
} from "@/lib/mfa/session";
import { deriveIpPrefix, hashDeviceFingerprint, hashUserAgent } from "@/lib/mfa/trusted-device";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export async function GET() {
  const { user, profile } = await requireUserAndProfile();
  const requireMfa = true;

  if (!profile.mfa_enabled) {
    return NextResponse.json({
      mfaEnabled: false,
      mfaRequired: requireMfa,
      trustedDevice: false,
      passkeyEnrolled: profile.mfa_passkey_enrolled ?? false,
      methods: profile.mfa_methods ?? ["TOTP"],
    });
  }

  const lastSuccessAt = profile.last_mfa_success_at ? Date.parse(profile.last_mfa_success_at) : null;
  const sessionWindowMs = sessionTtlSeconds() * 1000;
  const sessionToken = await readCookieToken(MFA_SESSION_COOKIE);
  const sessionPayload = sessionToken ? verifyMfaSessionToken(sessionToken) : null;
  const sessionCookieValid = sessionPayload?.userId === user.id;
  const profileSessionValid = lastSuccessAt !== null && Date.now() - lastSuccessAt <= sessionWindowMs;

  if (sessionCookieValid || profileSessionValid) {
    return NextResponse.json({
      mfaEnabled: true,
      mfaRequired: false,
      trustedDevice: false,
      passkeyEnrolled: profile.mfa_passkey_enrolled ?? false,
      methods: profile.mfa_methods ?? ["TOTP"],
    });
  }

  const trustedToken = await readCookieToken(TRUSTED_DEVICE_COOKIE);
  const trustedPayload = trustedToken ? verifyTrustedDeviceToken(trustedToken) : null;

  if (!trustedPayload || trustedPayload.userId !== user.id) {
    const failure = NextResponse.json({
      mfaEnabled: true,
      mfaRequired: true,
      trustedDevice: false,
      passkeyEnrolled: profile.mfa_passkey_enrolled ?? false,
      methods: profile.mfa_methods ?? ["TOTP"],
    });
    failure.cookies.delete(MFA_SESSION_COOKIE);
    failure.cookies.delete(TRUSTED_DEVICE_COOKIE);
    return failure;
  }

  const supabase = await createSupabaseServerClient();
  const headerList = await headers();
  const userAgent = headerList.get("user-agent") ?? "";
  const ip = headerList.get("x-forwarded-for") ?? headerList.get("x-real-ip") ?? null;
  const userAgentHash = hashUserAgent(userAgent);
  const ipPrefix = deriveIpPrefix(ip);
  const fingerprint = hashDeviceFingerprint(user.id, userAgentHash, ipPrefix);

  const { data: rawRecord, error } = await supabase
    .from("trusted_devices")
    .select("id, device_fingerprint_hash, user_agent_hash, ip_prefix")
    .eq("user_id", user.id)
    .eq("device_id", trustedPayload.deviceId)
    .maybeSingle();

  const record = rawRecord as Pick<Database["public"]["Tables"]["trusted_devices"]["Row"], "id" | "device_fingerprint_hash" | "user_agent_hash" | "ip_prefix"> | null;

  if (error || !record) {
    const failure = NextResponse.json({
      mfaEnabled: true,
      mfaRequired: true,
      trustedDevice: false,
      passkeyEnrolled: profile.mfa_passkey_enrolled ?? false,
      methods: profile.mfa_methods ?? ["TOTP"],
    });
    failure.cookies.delete(MFA_SESSION_COOKIE);
    failure.cookies.delete(TRUSTED_DEVICE_COOKIE);
    return failure;
  }

  if (record.device_fingerprint_hash !== fingerprint || record.user_agent_hash !== userAgentHash) {
    await supabase.from("trusted_devices").delete().eq("id", record.id);
    const failure = NextResponse.json({
      mfaEnabled: true,
      mfaRequired: true,
      trustedDevice: false,
      passkeyEnrolled: profile.mfa_passkey_enrolled ?? false,
      methods: profile.mfa_methods ?? ["TOTP"],
    });
    failure.cookies.delete(MFA_SESSION_COOKIE);
    failure.cookies.delete(TRUSTED_DEVICE_COOKIE);
    return failure;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("trusted_devices")
    .update({ last_used_at: new Date().toISOString(), ip_prefix: ipPrefix })
    .eq("id", record.id);

  const renewedSession = createMfaSessionToken(user.id, sessionTtlSeconds());
  const refreshedTrusted = createTrustedDeviceToken(user.id, trustedPayload.deviceId, trustedTtlSeconds());

  const successResponse = NextResponse.json({
    mfaEnabled: true,
    mfaRequired: false,
    trustedDevice: true,
    passkeyEnrolled: profile.mfa_passkey_enrolled ?? false,
    methods: profile.mfa_methods ?? ["TOTP"],
  });

  if (renewedSession) {
    successResponse.cookies.set({
      name: MFA_SESSION_COOKIE,
      value: renewedSession,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: sessionTtlSeconds(),
    });
  }

  if (refreshedTrusted) {
    successResponse.cookies.set({
      name: TRUSTED_DEVICE_COOKIE,
      value: refreshedTrusted,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: trustedTtlSeconds(),
    });
  }

  return successResponse;
}
