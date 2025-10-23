import crypto from "node:crypto";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/authx/audit";
import { issueSessionCookies, verifyPasskey, type PasskeyVerificationPayload } from "@/lib/authx/verify";
import { getUserAndProfile } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { applyRateLimit } from "@/src/auth/limits";
import { verifyFactor, type Factor, type FactorSuccess } from "@/src/auth/factors";
import { withLogContext, logInfo, logWarn, logError } from "@/lib/observability/logger";

const bodySchema = z.object({
  factor: z.enum(["passkey", "totp", "email", "whatsapp", "backup"]),
  token: z.string().optional(),
  trustDevice: z.boolean().optional(),
});

const parsePasskeyPayload = (value: string | undefined): PasskeyVerificationPayload | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as PasskeyVerificationPayload;
  } catch (jsonError) {
    try {
      const decoded = Buffer.from(value, "base64").toString("utf8");
      return JSON.parse(decoded) as PasskeyVerificationPayload;
    } catch (base64Error) {
      console.error("authx.passkey payload parse failed", jsonError, base64Error);
      return null;
    }
  }
};

export async function POST(request: NextRequest) {
  const context = await getUserAndProfile();
  if (!context) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { user, profile } = context;

  if (!profile.mfa_enabled) {
    logWarn("mfa.verify.not_enabled", { userId: user.id });
    await audit(user.id, "MFA_VERIFY_NOT_ENABLED", {});
    return NextResponse.json({ error: "mfa_not_enabled" }, { status: 400 });
  }

  let data: z.infer<typeof bodySchema>;
  try {
    data = bodySchema.parse(await request.json());
  } catch {
    logWarn("mfa.verify.invalid_payload", { userId: user.id });
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const headerList = await headers();
  const requestId = headerList.get("x-request-id") ?? headerList.get("x-correlation-id");
  const forwarded =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    null;
  const ip = forwarded?.split(",")[0]?.trim() ?? null;
  const hashedIp = ip ? crypto.createHash("sha256").update(ip).digest("hex") : null;

  const baseContext = {
    requestId: requestId ?? undefined,
    userId: user.id,
    saccoId: profile.sacco_id ?? null,
    source: "api:authx.challenge.verify",
  };

  try {
    return await withLogContext(baseContext, async () => {
      const supabase = createSupabaseAdminClient();

    const { data: rawRecord, error } = await supabase
      .from("users")
      .select(
        "mfa_secret_enc, mfa_backup_hashes, last_mfa_step, failed_mfa_count, last_mfa_success_at, mfa_methods, mfa_passkey_enrolled",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      logError("mfa.verify.load_failed", { error: error instanceof Error ? error.message : error, userId: user.id });
      return NextResponse.json({ error: "configuration_error" }, { status: 500 });
    }

    type UserRow = Pick<
      Database["public"]["Tables"]["users"]["Row"],
      | "mfa_secret_enc"
      | "mfa_backup_hashes"
      | "last_mfa_step"
      | "failed_mfa_count"
      | "last_mfa_success_at"
      | "mfa_methods"
      | "mfa_passkey_enrolled"
    >;

    const record = (rawRecord ?? null) as UserRow | null;

    const safeRecord: UserRow = {
      mfa_secret_enc: record?.mfa_secret_enc ?? null,
      mfa_backup_hashes: record?.mfa_backup_hashes ?? [],
      last_mfa_step: record?.last_mfa_step ?? null,
      failed_mfa_count: record?.failed_mfa_count ?? profile.failed_mfa_count ?? 0,
      last_mfa_success_at: record?.last_mfa_success_at ?? null,
      mfa_methods: record?.mfa_methods ?? profile.mfa_methods ?? [],
      mfa_passkey_enrolled: record?.mfa_passkey_enrolled ?? profile.mfa_passkey_enrolled ?? false,
    };

    const respondRateLimited = async (
      scope: "user" | "ip",
      details: { retryAt?: Date | null; hashedIp?: string | null },
    ) => {
      const retryIso = details.retryAt?.toISOString() ?? null;
      logWarn("mfa.verify.rate_limited", { scope, retryAt: retryIso, hashedIp: details.hashedIp ?? null });
      await audit(user.id, "MFA_RATE_LIMITED", {
        scope,
        retryAt: retryIso,
        hashedIp: details.hashedIp ?? null,
        requestId: requestId ?? null,
      });
      return NextResponse.json(
        { error: "rate_limited", scope, retryAt: retryIso, requestId: requestId ?? undefined },
        { status: 429 },
      );
    };

    const userRateLimit = await applyRateLimit(`authx-mfa:${user.id}`, { maxHits: 5, windowSeconds: 300 });
    if (!userRateLimit.ok) {
      return respondRateLimited("user", { retryAt: userRateLimit.retryAt ?? null });
    }

    if (hashedIp) {
      const ipRateLimit = await applyRateLimit(`authx-mfa-ip:${hashedIp}`, { maxHits: 10, windowSeconds: 300 });
      if (!ipRateLimit.ok) {
        return respondRateLimited("ip", { retryAt: ipRateLimit.retryAt ?? null, hashedIp });
      }
    }

    let rememberDevice = data.trustDevice ?? false;
    let verification: FactorSuccess | null = null;

    if (data.factor === "passkey") {
      const payload = parsePasskeyPayload(data.token);
      if (!payload) {
        logWarn("mfa.verify.passkey_payload_invalid", { userId: user.id });
        return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
      }
      const result = await verifyPasskey({ id: user.id }, payload);
      if (!result.ok) {
        logWarn("mfa.verify.passkey_rejected", { userId: user.id });
        await audit(user.id, "MFA_FAILED", { factor: data.factor, reason: "passkey_rejected" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("users")
          .update({ failed_mfa_count: (safeRecord.failed_mfa_count ?? 0) + 1 })
          .eq("id", user.id);
        return NextResponse.json({ error: "invalid_or_expired" }, { status: 401 });
      }

      rememberDevice = result.rememberDevice ?? rememberDevice;
      verification = {
        ok: true,
        status: 200,
        factor: "passkey",
        auditAction: "MFA_SUCCESS",
        auditDiff: { factor: "passkey" },
      };
    } else {
      const factor = data.factor as Factor;
      if (!data.token && factor !== "passkey") {
        logWarn("mfa.verify.token_missing", { factor });
        return NextResponse.json({ error: "token_required" }, { status: 400 });
      }

      const result = await verifyFactor({
        factor,
        token: data.token,
        userId: user.id,
        email: user.email,
        state: {
          totpSecret: safeRecord.mfa_secret_enc ?? null,
          lastStep: safeRecord.last_mfa_step ?? null,
          backupHashes: safeRecord.mfa_backup_hashes ?? [],
        },
        rememberDevice: rememberDevice,
      });

      if (!result.ok) {
        if (result.status === 429) {
          await audit(user.id, "MFA_RATE_LIMITED", { factor, requestId: requestId ?? null });
          logWarn("mfa.verify.rate_limited_factor", { factor });
        } else {
          await audit(user.id, "MFA_FAILED", { factor, code: result.code ?? null });
          logWarn("mfa.verify.factor_failed", { factor, code: result.code ?? null });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("users")
          .update({ failed_mfa_count: (safeRecord.failed_mfa_count ?? 0) + 1 })
          .eq("id", user.id);

        return NextResponse.json(
          {
            error: result.error,
            code: result.code,
            ...(result.payload ?? {}),
          },
          { status: result.status },
        );
      }

      verification = result;
    }

    if (!verification) {
      logError("mfa.verify.unexpected_state", { factor: data.factor });
      return NextResponse.json({ error: "verification_failed" }, { status: 500 });
    }

    const updates: Database["public"]["Tables"]["users"]["Update"] = {
      failed_mfa_count: 0,
      last_mfa_success_at: new Date().toISOString(),
    };

    const methods = new Set(safeRecord.mfa_methods ?? []);
    if (verification.factor === "email") {
      methods.add("EMAIL");
    }
    if (verification.factor === "passkey" || safeRecord.mfa_passkey_enrolled) {
      methods.add("PASSKEY");
    }
    if (verification.factor === "totp" || verification.factor === "backup") {
      methods.add("TOTP");
    }

    if (verification.factor === "backup") {
      updates.mfa_backup_hashes = verification.nextBackupHashes ?? safeRecord.mfa_backup_hashes ?? [];
      updates.last_mfa_step = safeRecord.last_mfa_step ?? null;
    } else if (verification.factor === "totp") {
      updates.last_mfa_step = verification.nextLastStep ?? verification.step ?? safeRecord.last_mfa_step ?? null;
    }

    updates.mfa_methods = Array.from(methods);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateResult = await (supabase as any).from("users").update(updates).eq("id", user.id);
    if (updateResult.error) {
      logError("mfa.verify.persist_failed", {
        error: updateResult.error instanceof Error ? updateResult.error.message : updateResult.error,
      });
      return NextResponse.json({ error: "configuration_error" }, { status: 500 });
    }

    await audit(user.id, verification.auditAction, {
      factor: verification.factor,
      usedBackup: verification.usedBackup ?? false,
      requestId: requestId ?? null,
      diff: verification.auditDiff ?? null,
    });

    await issueSessionCookies(user.id, rememberDevice);
      logInfo("mfa.verify.success", {
        factor: verification.factor,
        usedBackup: verification.usedBackup ?? false,
        rememberDevice,
        methods: updates.mfa_methods,
      });

      return NextResponse.json({ ok: true, factor: verification.factor, usedBackup: verification.usedBackup ?? false });
    });
  } catch (error) {
    logError("mfa.verify.unexpected_error", { error: error instanceof Error ? error.message : error });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
