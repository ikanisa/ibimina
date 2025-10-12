import crypto from "node:crypto";
import type { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { verifyAuthentication } from "@/lib/mfa/passkeys";
import { decryptSensitiveString, verifyTotp as verifyTotpToken } from "@/lib/mfa/crypto";
import { verifyEmailOtp as legacyVerifyEmailOtp } from "@/lib/mfa/email";
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
import { sha256Hex } from "@/lib/authx/crypto";

export type PasskeyVerificationPayload = {
  response: AuthenticationResponseJSON;
  stateToken: string;
};

export const verifyPasskey = async (user: { id: string }, payload: PasskeyVerificationPayload) => {
  try {
    const result = await verifyAuthentication({ id: user.id }, payload.response, payload.stateToken);
    return { ok: true as const, rememberDevice: result.rememberDevice };
  } catch (error) {
    console.error("authx.verifyPasskey", error);
    return { ok: false as const };
  }
};

export const verifyTotp = async (user: { id: string }, token: string) => {
  const supabase = createSupabaseAdminClient();
  type UserRow = { mfa_secret_enc: string | null };
  const { data, error } = await supabase.from("users").select("mfa_secret_enc").eq("id", user.id).maybeSingle();
  const userRow = data as UserRow | null;
  if (error || !userRow?.mfa_secret_enc) {
    return { ok: false as const };
  }

  try {
    const secret = decryptSensitiveString(userRow.mfa_secret_enc);
    const result = verifyTotpToken(secret, token, 1);
    return { ok: result.ok } as const;
  } catch (err) {
    console.error("authx.verifyTotp", err);
    return { ok: false as const };
  }
};

export const verifyEmailOtp = async (user: { id: string }, token: string) => {
  const result = await legacyVerifyEmailOtp(user.id, token);
  if (!result.ok) {
    return { ok: false as const };
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .schema("authx")
    .from("otp_issues")
    .select("id")
    .eq("user_id", user.id)
    .eq("channel", "email")
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) {
    await supabase.schema("authx").from("otp_issues").update({ used_at: new Date().toISOString() }).eq("id", data.id);
  }

  return { ok: true as const };
};

export const verifyWhatsAppOtp = async (user: { id: string }, token: string) => {
  if (!token) {
    return { ok: false as const };
  }

  const supabase = createSupabaseAdminClient();
  const hash = sha256Hex(`${process.env.BACKUP_PEPPER ?? ""}${token}`);
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .schema("authx")
    .from("otp_issues")
    .select("id, expires_at, used_at")
    .eq("user_id", user.id)
    .eq("channel", "whatsapp")
    .eq("code_hash", hash)
    .maybeSingle();

  if (error || !data) {
    return { ok: false as const };
  }

  if (data.used_at || new Date(data.expires_at) < new Date()) {
    return { ok: false as const };
  }

  await supabase.schema("authx").from("otp_issues").update({ used_at: nowIso }).eq("id", data.id);
  return { ok: true as const };
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
