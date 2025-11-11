import { sendWhatsAppOtp } from "@/lib/authx/start";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordMfaAudit } from "../audit";
import { authLog } from "../util/log";
import { verifyOneTimeCode } from "../util/crypto";
import type {
  FactorFailure,
  FactorInitiateInput,
  FactorInitiateResult,
  FactorSuccess,
  FactorVerifyInput,
} from "./index";

type OtpIssueRow = {
  id: string;
  code_hash: string | null;
  expires_at: string;
};

const toFailure = (
  status: number,
  error: string,
  code: string,
  payload?: Record<string, unknown>
) => ({
  ok: false as const,
  status,
  error,
  code,
  ...(payload ? { payload } : {}),
});

export const initiateWhatsAppFactor = async (
  input: FactorInitiateInput
): Promise<FactorInitiateResult> => {
  try {
    const result = await sendWhatsAppOtp({ id: input.userId });

    if (!result.sent) {
      // WhatsApp OTP is temporarily disabled
      if (result.error === "whatsapp_disabled") {
        await recordMfaAudit("MFA_FAILED", input.userId, {
          channel: "WHATSAPP",
          reason: "whatsapp_disabled",
        });
        authLog.warn("mfa_whatsapp_disabled", {
          userId: input.userId,
        });
        return toFailure(503, "whatsapp_disabled", "WHATSAPP_DISABLED", {
          message: "WhatsApp OTP temporarily disabled - use passkey, TOTP, email, or backup codes",
        });
      }

      const code = "WHATSAPP_SEND_FAILED";
      const status = 500;
      await recordMfaAudit("MFA_FAILED", input.userId, {
        channel: "WHATSAPP",
        reason: result.error ?? "send_failed",
      });
      authLog.warn("mfa_whatsapp_issue_failed", {
        userId: input.userId,
        reason: result.error ?? "unknown",
      });
      return toFailure(status, result.error ?? "send_failed", code);
    }

    // This branch won't be reached with current implementation
    await recordMfaAudit("MFA_WHATSAPP_SENT", input.userId, {});
    authLog.info("mfa_whatsapp_issued", {
      userId: input.userId,
    });

    return {
      ok: true as const,
      status: 200,
      payload: { channel: "whatsapp" },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await recordMfaAudit("MFA_FAILED", input.userId, {
      channel: "WHATSAPP",
      reason: "exception",
      message,
    });
    authLog.error("mfa_whatsapp_issue_exception", {
      userId: input.userId,
      message,
    });
    return toFailure(500, "whatsapp_issue_failed", "WHATSAPP_ISSUE_FAILED");
  }
};

export const verifyWhatsAppFactor = async (
  input: FactorVerifyInput
): Promise<FactorSuccess | FactorFailure> => {
  if (!input.token) {
    return toFailure(400, "token_required", "TOKEN_REQUIRED");
  }

  const supabase = createSupabaseAdminClient();

  const authx = (supabase as any).schema("authx");
  const nowIso = new Date().toISOString();

  let rows: OtpIssueRow[] | null = null;
  try {
    const { data, error } = await authx
      .from("otp_issues")
      .select("id, code_hash, expires_at")
      .eq("user_id", input.userId)
      .eq("channel", "whatsapp")
      .is("used_at", null)
      .gte("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      throw error;
    }

    rows = (data as OtpIssueRow[]) ?? [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    authLog.error("mfa_whatsapp_verify_lookup_failed", {
      userId: input.userId,
      message,
    });
    await recordMfaAudit("MFA_FAILED", input.userId, {
      channel: "WHATSAPP",
      reason: "lookup_failed",
      message,
    });
    return toFailure(500, "whatsapp_verify_failed", "WHATSAPP_VERIFY_FAILED");
  }

  if (!rows || rows.length === 0) {
    authLog.warn("mfa_whatsapp_no_active_codes", { userId: input.userId });
    await recordMfaAudit("MFA_FAILED", input.userId, {
      channel: "WHATSAPP",
      reason: "no_active_code",
    });
    return toFailure(401, "invalid_code", "INVALID_CODE");
  }

  const matched = rows.find(
    (row) => row.code_hash && verifyOneTimeCode(input.token as string, row.code_hash)
  );

  if (!matched) {
    authLog.warn("mfa_whatsapp_invalid_code", { userId: input.userId });
    await recordMfaAudit("MFA_FAILED", input.userId, {
      channel: "WHATSAPP",
      reason: "invalid_code",
    });
    return toFailure(401, "invalid_code", "INVALID_CODE");
  }

  const usedAt = new Date().toISOString();

  try {
    const { error } = await authx
      .from("otp_issues")
      .update({ used_at: usedAt })
      .eq("id", matched.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    authLog.error("mfa_whatsapp_mark_used_failed", {
      userId: input.userId,
      otpId: matched.id,
      message,
    });
    await recordMfaAudit("MFA_FAILED", input.userId, {
      channel: "WHATSAPP",
      reason: "persist_failed",
      message,
    });
    return toFailure(500, "whatsapp_verify_failed", "WHATSAPP_VERIFY_FAILED");
  }

  await recordMfaAudit("MFA_WHATSAPP_VERIFIED", input.userId, {
    otpId: matched.id,
    expiresAt: matched.expires_at,
  });
  authLog.info("mfa_whatsapp_verified", {
    userId: input.userId,
    otpId: matched.id,
  });

  return {
    ok: true,
    status: 200,
    factor: "whatsapp",
    auditAction: "MFA_SUCCESS",
    auditDiff: { factor: "whatsapp" },
  };
};
