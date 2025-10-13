import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserAndProfile } from "@/lib/auth";
import {
  MFA_SESSION_COOKIE,
  TRUSTED_DEVICE_COOKIE,
  createMfaSessionToken,
  createTrustedDeviceToken,
  sessionTtlSeconds,
  trustedTtlSeconds,
} from "@/lib/mfa/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { deriveIpPrefix, hashDeviceFingerprint, hashUserAgent } from "@/lib/mfa/trusted-device";
import { logAudit } from "@/lib/audit";
import type { Database } from "@/lib/supabase/types";
import { logError, logInfo, logWarn, updateLogContext, withLogContext } from "@/lib/observability/logger";
import { applyRateLimit } from "@/src/auth/limits";
import { verifyFactor, type Factor } from "@/src/auth/factors";

const payloadSchema = z.object({
  token: z.string().trim().min(1, "token_required"),
  method: z.enum(["totp", "backup", "email", "whatsapp", "passkey"]).optional(),
  rememberDevice: z.boolean().optional(),
});

export async function POST(request: Request) {
  const { user, profile } = await requireUserAndProfile();
  const headerList = await headers();
  const requestId = headerList.get("x-request-id") ?? headerList.get("x-correlation-id") ?? undefined;

  const ipHeader =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    null;
  const ipAddress = ipHeader?.split(",")[0]?.trim() ?? null;
  const hashedIp = ipAddress ? crypto.createHash("sha256").update(ipAddress).digest("hex") : null;

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

      const rawBody = await request.json().catch(() => ({}));
      const parsed = payloadSchema.safeParse(rawBody);
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "invalid_payload";
        logWarn("mfa_verify_invalid_payload", { message });
        return NextResponse.json({ error: message, issues: parsed.error.flatten() }, { status: 400 });
      }

      const preferredMethod =
        parsed.data.method ?? (profile.mfa_methods?.includes("EMAIL") ? "email" : "totp");
      const factor = preferredMethod as Factor;

      logInfo("mfa_verify_received", {
        method: factor,
        rememberDevice: Boolean(parsed.data.rememberDevice),
      });

      const respondRateLimited = async (
        scope: "user" | "ip",
        details: { retryAt?: Date | null; hashedIp?: string | null },
      ) => {
        const retryIso = details.retryAt?.toISOString() ?? null;
        logWarn("mfa_verify_rate_limited", {
          userId: user.id,
          scope,
          retryAt: retryIso,
          hashedIp: details.hashedIp ?? null,
        });
        await logAudit({
          action: "MFA_RATE_LIMITED",
          entity: "USER",
          entityId: user.id,
          diff: {
            scope,
            retryAt: retryIso,
            hashedIp: details.hashedIp ?? null,
          },
        });
        return NextResponse.json(
          { error: "rate_limit_exceeded", scope, retryAt: retryIso },
          { status: 429 },
        );
      };

      const userRateLimit = await applyRateLimit(`mfa:${user.id}`, { maxHits: 5, windowSeconds: 300 });
      if (!userRateLimit.ok) {
        return respondRateLimited("user", { retryAt: userRateLimit.retryAt ?? null });
      }

      if (hashedIp) {
        const ipRateLimit = await applyRateLimit(`mfa-ip:${hashedIp}`, { maxHits: 10, windowSeconds: 300 });
        if (!ipRateLimit.ok) {
          return respondRateLimited("ip", { retryAt: ipRateLimit.retryAt ?? null, hashedIp });
        }
      }

      const supabase: SupabaseClient<Database, "public"> = createSupabaseAdminClient();
      const { data: rawRecord, error } = await supabase
        .from("users")
        .select(
          "mfa_secret_enc, mfa_backup_hashes, last_mfa_step, last_mfa_success_at, failed_mfa_count",
        )
        .eq("id", user.id)
        .maybeSingle();

      const record = rawRecord as Pick<
        Database["public"]["Tables"]["users"]["Row"],
        "mfa_secret_enc" | "mfa_backup_hashes" | "last_mfa_step" | "last_mfa_success_at" | "failed_mfa_count"
      > | null;

      if (error) {
        logError("mfa_verify_fetch_failed", { error });
        return NextResponse.json({ error: "mfa_not_configured" }, { status: 400 });
      }

      const safeRecord: Pick<
        Database["public"]["Tables"]["users"]["Row"],
        "mfa_secret_enc" | "mfa_backup_hashes" | "last_mfa_step" | "last_mfa_success_at" | "failed_mfa_count"
      > = {
        mfa_secret_enc: record?.mfa_secret_enc ?? null,
        mfa_backup_hashes: record?.mfa_backup_hashes ?? [],
        last_mfa_step: record?.last_mfa_step ?? null,
        last_mfa_success_at: record?.last_mfa_success_at ?? null,
        failed_mfa_count: record?.failed_mfa_count ?? profile.failed_mfa_count ?? 0,
      };

      const verification = await verifyFactor({
        factor,
        token: parsed.data.token,
        userId: user.id,
        email: user.email,
        state: {
          totpSecret: safeRecord.mfa_secret_enc ?? null,
          lastStep: safeRecord.last_mfa_step ?? null,
          backupHashes: safeRecord.mfa_backup_hashes ?? [],
        },
        rememberDevice: parsed.data.rememberDevice,
      });

      if (!verification.ok) {
        if (verification.status < 500) {
          // NOTE: Supabase client generics currently lose table inference under `moduleResolution: bundler`,
          // so we cast to any until upstream fixes land.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("users")
            .update({ failed_mfa_count: (safeRecord.failed_mfa_count ?? 0) + 1 })
            .eq("id", user.id);
          await logAudit({ action: "MFA_FAILED", entity: "USER", entityId: user.id, diff: { method: factor } });
        }
        return NextResponse.json(
          {
            error: verification.error,
            code: verification.code,
            ...(verification.payload ?? {}),
          },
          { status: verification.status },
        );
      }

      updateLogContext({ userId: user.id });

      const updates: Database["public"]["Tables"]["users"]["Update"] = {
        failed_mfa_count: 0,
        last_mfa_success_at: new Date().toISOString(),
      };

      const methodSet = new Set(profile.mfa_methods ?? []);
      if (verification.factor === "email") {
        methodSet.add("EMAIL");
      }
      if (profile.mfa_passkey_enrolled) {
        methodSet.add("PASSKEY");
      }

      if (verification.factor === "backup") {
        updates.mfa_backup_hashes = verification.nextBackupHashes ?? safeRecord.mfa_backup_hashes ?? [];
        updates.last_mfa_step = safeRecord.last_mfa_step ?? null;
        methodSet.add("TOTP");
      } else if (verification.factor === "totp") {
        updates.last_mfa_step = verification.nextLastStep ?? verification.step ?? safeRecord.last_mfa_step ?? null;
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
      const ip = ipAddress ?? headerList.get("x-forwarded-for") ?? headerList.get("x-real-ip") ?? null;
      const userAgentHash = hashUserAgent(userAgent);
      const ipPrefix = deriveIpPrefix(ip);

      const response = NextResponse.json({ success: true, method: verification.factor });
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

      if (parsed.data.rememberDevice) {
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
        action: verification.usedBackup ? "MFA_BACKUP_SUCCESS" : verification.auditAction,
        entity: "USER",
        entityId: user.id,
        diff: verification.auditDiff ?? null,
      });

      logInfo("mfa_verify_success", {
        method: verification.factor,
        trustedDevice: Boolean(parsed.data.rememberDevice),
      });

      return response;
    },
  );
}
