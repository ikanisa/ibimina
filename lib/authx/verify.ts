import crypto from "node:crypto";
import type { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { verifyAuthentication } from "@/lib/mfa/passkeys";
import {
  MFA_SESSION_COOKIE,
  TRUSTED_DEVICE_COOKIE,
  createMfaSessionToken,
  createTrustedDeviceToken,
  sessionTtlSeconds,
  trustedTtlSeconds,
} from "@/lib/mfa/session";
import { deriveIpPrefix, hashDeviceFingerprint, hashUserAgent } from "@/lib/mfa/trusted-device";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { headers, cookies } from "next/headers";

export type PasskeyVerificationPayload = {
  response: AuthenticationResponseJSON;
  stateToken: string;
};

export const verifyPasskey = async (user: { id: string }, payload: PasskeyVerificationPayload) => {
  try {
    const result = await verifyAuthentication({ id: user.id }, payload.response, payload.stateToken);
    const { rememberDevice, credential } = result;
    const supabase = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("webauthn_credentials")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", credential.id)
      .eq("user_id", user.id);
    return { ok: true as const, rememberDevice };
  } catch (error) {
    console.error("authx.verifyPasskey", error);
    return { ok: false as const };
  }
};

export const issueSessionCookies = async (userId: string, rememberDevice: boolean) => {
  const headerList = await headers();
  const cookieStore = await cookies();
  const supabase = createSupabaseAdminClient();

  const userAgent = headerList.get("user-agent") ?? "";
  const ip = headerList.get("x-forwarded-for") ?? headerList.get("x-real-ip") ?? null;
  const userAgentHash = hashUserAgent(userAgent);
  const ipPrefix = deriveIpPrefix(ip);

  const sessionToken = createMfaSessionToken(userId, sessionTtlSeconds());
  if (sessionToken) {
    cookieStore.set({
      name: MFA_SESSION_COOKIE,
      value: sessionToken,
      maxAge: sessionTtlSeconds(),
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
  }

  let trustedToken: string | null = null;

  if (rememberDevice) {
    const deviceId = crypto.randomUUID();
    const fingerprint = hashDeviceFingerprint(userId, userAgentHash, ipPrefix);

    const trustedInsert: Database["public"]["Tables"]["trusted_devices"]["Insert"] = {
      user_id: userId,
      device_id: deviceId,
      device_fingerprint_hash: fingerprint,
      user_agent_hash: userAgentHash,
      ip_prefix: ipPrefix,
      last_used_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("trusted_devices")
      .upsert(trustedInsert, { onConflict: "user_id,device_id" });

    trustedToken = createTrustedDeviceToken(userId, deviceId, trustedTtlSeconds());
    if (trustedToken) {
      cookieStore.set({
        name: TRUSTED_DEVICE_COOKIE,
        value: trustedToken,
        maxAge: trustedTtlSeconds(),
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
      });
    }
  }

  return { sessionToken, trustedToken };
};
