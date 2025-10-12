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
import { consumeBackupCode, decryptSensitiveString, verifyTotp, verifyEmailOtp } from "@/lib/mfa";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { deriveIpPrefix, hashDeviceFingerprint, hashUserAgent } from "@/lib/mfa/trusted-device";
import { logAudit } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { Database } from "@/lib/supabase/types";
import { logError, logInfo, logWarn, updateLogContext, withLogContext } from "@/lib/observability/logger";

type Payload = {
  token: string;
  method?: "totp" | "backup" | "email";
  rememberDevice?: boolean;
};

export async function POST(request: Request) {
  const { user, profile } = await requireUserAndProfile();
  const headerList = await headers();
  const requestId = headerList.get("x-request-id") ?? headerList.get("x-correlation-id") ?? undefined;

  return withLogContext(
    {
      requestId,
      userId: user.id,
      saccoId: profile.sacco_id ?? null,
      source: "api:mfa.verify",
    },
    async () => {
      if (!profile.mfa_enabled) {
        logWarn("mfa_verify_attempt_without_enrollment", { userId: user.id });
        return NextResponse.json({ error: "mfa_not_enabled" }, { status: 400 });
      }

      const body = (await request.json().catch(() => null)) as Payload | null;
      if (!body?.token) {
        logWarn("mfa_verify_missing_token", { method: body?.method ?? null });
        return NextResponse.json({ error: "token_required" }, { status: 400 });
      }

      const preferredMethod = body.method ?? (profile.mfa_methods?.includes("EMAIL") ? "email" : "totp");
      if (!["totp", "backup", "email"].includes(preferredMethod)) {
        logWarn("mfa_verify_invalid_method", { method: preferredMethod });
        return NextResponse.json({ error: "invalid_method" }, { status: 400 });
      }

      logInfo("mfa_verify_received", { method: preferredMethod, rememberDevice: Boolean(body.rememberDevice) });

      try {
        await enforceRateLimit(`mfa:${user.id}`, { maxHits: 5, windowSeconds: 300 });
      } catch (rateError) {
        if ((rateError as Error).message === "rate_limit_exceeded") {
          logWarn("mfa_verify_rate_limited", { userId: user.id });
          return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 });
        }
        logWarn("mfa_verify_rate_limit_failed_open", { error: rateError instanceof Error ? rateError.message : String(rateError) });
      }

      const supabase = createSupabaseAdminClient();
      const { data: rawRecord, error } = await supabase
    .from("users")
    .select("mfa_secret_enc, mfa_backup_hashes, last_mfa_step, last_mfa_success_at")
    .eq("id", user.id)
    .maybeSingle();

      const record = rawRecord as Pick<
    Database["public"]["Tables"]["users"]["Row"],
    "mfa_secret_enc" | "mfa_backup_hashes" | "last_mfa_step" | "last_mfa_success_at"
  > | null;

      if (error) {
        logError("mfa_verify_fetch_failed", { error });
        return NextResponse.json({ error: "mfa_not_configured" }, { status: 400 });
      }

      const safeRecord: Pick<
    Database["public"]["Tables"]["users"]["Row"],
    "mfa_secret_enc" | "mfa_backup_hashes" | "last_mfa_step" | "last_mfa_success_at"
  > = {
    mfa_secret_enc: record?.mfa_secret_enc ?? null,
    mfa_backup_hashes: record?.mfa_backup_hashes ?? [],
    last_mfa_step: record?.last_mfa_step ?? null,
    last_mfa_success_at: record?.last_mfa_success_at ?? null,
  };

      if ((preferredMethod === "totp" || preferredMethod === "backup") && !safeRecord.mfa_secret_enc) {
        logWarn("mfa_verify_missing_secret", { method: preferredMethod });
        return NextResponse.json({ error: "mfa_not_configured" }, { status: 400 });
      }

      const method = preferredMethod as "totp" | "backup" | "email";
      const token = body.token.trim();
      let success = false;
      let currentStep: number | null = null;
      let resolvedStep: number | null = null;
      let updatedBackupHashes = safeRecord.mfa_backup_hashes ?? [];

      if (method === "backup") {
        const next = consumeBackupCode(token, updatedBackupHashes);
        if (next) {
          updatedBackupHashes = next;
          success = true;
        }
      } else if (method === "email") {
        const emailResult = await verifyEmailOtp(user.id, token);
        if (emailResult.ok) {
          success = true;
        } else {
          logWarn("mfa_verify_email_failed", { reason: emailResult.reason });
          return NextResponse.json({ error: emailResult.reason }, { status: 401 });
        }
      } else {
        try {
          const secret = decryptSensitiveString(safeRecord.mfa_secret_enc!);
          const verification = verifyTotp(secret, token, 1);
          success = verification.ok;
          currentStep = verification.ok ? verification.step! : null;
          if (success && currentStep !== null) {
            const lastStep = safeRecord.last_mfa_step ?? null;
            if (lastStep !== null && currentStep < lastStep - 1) {
              success = false;
              logWarn("mfa_verify_replay_detected", { currentStep, lastStep });
            } else {
              resolvedStep = Math.max(currentStep, lastStep ?? currentStep);
            }
          }
        } catch (e) {
          const msg = (e as Error)?.message ?? String(e);
          if (msg.includes("not configured") || msg.includes("32-byte base64")) {
            logError("mfa_verify_missing_server_key", { message: msg });
            return NextResponse.json({ error: "server_key_missing" }, { status: 500 });
          }
          logError("mfa_verify_decrypt_failed", { error: e });
          return NextResponse.json({ error: "decryption_failed" }, { status: 500 });
        }
      }

      if (!success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("users")
          .update({ failed_mfa_count: (profile.failed_mfa_count ?? 0) + 1 })
          .eq("id", user.id);
        await logAudit({ action: "MFA_FAILED", entity: "USER", entityId: user.id, diff: null });
        logWarn("mfa_verify_invalid_code", { method });
        return NextResponse.json({ error: "invalid_code" }, { status: 401 });
      }

      updateLogContext({ userId: user.id });

      const updates: Database["public"]["Tables"]["users"]["Update"] = {
    failed_mfa_count: 0,
    last_mfa_success_at: new Date().toISOString(),
  };

  const methodSet = new Set(profile.mfa_methods ?? []);
  if (method === "email") {
    methodSet.add("EMAIL");
  }
  if (profile.mfa_passkey_enrolled) {
    methodSet.add("PASSKEY");
  }

  if (method === "backup") {
    updates.mfa_backup_hashes = updatedBackupHashes;
    updates.last_mfa_step = safeRecord.last_mfa_step ?? null;
    methodSet.add("TOTP");
  } else if (method === "totp") {
    updates.last_mfa_step = resolvedStep ?? currentStep;
    methodSet.add("TOTP");
  }

  updates.mfa_methods = Array.from(methodSet);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateResult = await (supabase as any).from("users").update(updates).eq("id", user.id);
      if (updateResult.error) {
        logError("mfa_verify_state_persist_failed", { error: updateResult.error });
        return NextResponse.json({ error: "configuration_error" }, { status: 500 });
      }

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

      logInfo("mfa_verify_success", { method, trustedDevice: Boolean(body.rememberDevice) });

      return response;
    },
  );
}
