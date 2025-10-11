import crypto from "node:crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import {
  MFA_SESSION_COOKIE,
  TRUSTED_DEVICE_COOKIE,
  createMfaSessionToken,
  createTrustedDeviceToken,
  sessionTtlSeconds,
  trustedTtlSeconds,
} from "@/lib/mfa/session";
import { consumeBackupCode, decryptSensitiveString, verifyTotp } from "@/lib/mfa";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deriveIpPrefix, hashDeviceFingerprint, hashUserAgent } from "@/lib/mfa/trusted-device";
import { logAudit } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { Database } from "@/lib/supabase/types";

type Payload = {
  token: string;
  method?: "totp" | "backup";
  rememberDevice?: boolean;
};

export async function POST(request: Request) {
  const { user, profile } = await requireUserAndProfile();
  if (!profile.mfa_enabled) {
    return NextResponse.json({ error: "mfa_not_enabled" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as Payload | null;
  if (!body?.token) {
    return NextResponse.json({ error: "token_required" }, { status: 400 });
  }

  try {
    await enforceRateLimit(`mfa:${user.id}`, { maxHits: 5, windowSeconds: 300 });
  } catch (rateError) {
    if ((rateError as Error).message === "rate_limit_exceeded") {
      return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 });
    }
    // Fail-open on infrastructure errors (e.g., missing RPC) to avoid 500s
    console.warn("Rate limit check failed", (rateError as Error)?.message ?? rateError);
  }

  const supabase = await createSupabaseServerClient();
  const { data: rawRecord, error } = await supabase
    .from("users")
    .select("mfa_secret_enc, mfa_backup_hashes, last_mfa_step")
    .eq("id", user.id)
    .maybeSingle();

  const record = rawRecord as Pick<Database["public"]["Tables"]["users"]["Row"], "mfa_secret_enc" | "mfa_backup_hashes" | "last_mfa_step"> | null;

  if (error || !record?.mfa_secret_enc) {
    console.error(error);
    return NextResponse.json({ error: "mfa_not_configured" }, { status: 400 });
  }

  const method = body.method ?? "totp";
  const token = body.token.trim();
  let success = false;
  let currentStep: number | null = null;
  let updatedBackupHashes = record.mfa_backup_hashes ?? [];

  if (method === "backup") {
    const next = consumeBackupCode(token, updatedBackupHashes);
    if (next) {
      updatedBackupHashes = next;
      success = true;
    }
  } else {
    try {
      const secret = decryptSensitiveString(record.mfa_secret_enc);
      const verification = verifyTotp(secret, token, 1);
      success = verification.ok;
      currentStep = verification.ok ? verification.step! : null;
      if (success && currentStep !== null && record.last_mfa_step !== null && currentStep <= record.last_mfa_step) {
        success = false;
      }
    } catch (e) {
      // Decryption can fail if KMS_DATA_KEY changed since enrollment
      console.error("MFA verify: decrypt failed", (e as Error)?.message ?? e);
      success = false;
      currentStep = null;
    }
  }

  if (!success) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("users")
      .update({ failed_mfa_count: (profile.failed_mfa_count ?? 0) + 1 })
      .eq("id", user.id);
    await logAudit({ action: "MFA_FAILED", entity: "USER", entityId: user.id, diff: null });
    return NextResponse.json({ error: "invalid_code" }, { status: 401 });
  }

  const updates: Database["public"]["Tables"]["users"]["Update"] = {
    failed_mfa_count: 0,
    last_mfa_success_at: new Date().toISOString(),
  };

  if (method === "backup") {
    updates.mfa_backup_hashes = updatedBackupHashes;
    updates.last_mfa_step = record.last_mfa_step ?? null;
  } else {
    updates.last_mfa_step = currentStep;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("users").update(updates).eq("id", user.id);

  const headerList = await headers();
  const userAgent = headerList.get("user-agent") ?? "";
  const ip = headerList.get("x-forwarded-for") ?? headerList.get("x-real-ip") ?? null;
  const userAgentHash = hashUserAgent(userAgent);
  const ipPrefix = deriveIpPrefix(ip);

  const response = NextResponse.json({ success: true, method });
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

  if (body.rememberDevice) {
    const deviceId = crypto.randomUUID();
    const fingerprint = hashDeviceFingerprint(user.id, userAgentHash, ipPrefix);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("trusted_devices")
      .upsert({
        user_id: user.id,
        device_id: deviceId,
        device_fingerprint_hash: fingerprint,
        user_agent_hash: userAgentHash,
        ip_prefix: ipPrefix,
        last_used_at: new Date().toISOString(),
      }, { onConflict: "user_id,device_id" });

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

  await logAudit({
    action: method === "backup" ? "MFA_BACKUP_SUCCESS" : "MFA_SUCCESS",
    entity: "USER",
    entityId: user.id,
    diff: method === "backup" ? { remaining: updatedBackupHashes.length } : null,
  });

  return response;
}
