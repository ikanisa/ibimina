import { issueEmailOtp, verifyEmailOtp } from "@/lib/mfa";
import { authLog } from "../util/log";
import { recordMfaAudit } from "../audit";
import type {
  FactorFailure,
  FactorInitiateInput,
  FactorInitiateResult,
  FactorSuccess,
  FactorVerifyInput,
} from "./index";

export const initiateEmailFactor = async (
  input: FactorInitiateInput,
): Promise<FactorInitiateResult> => {
  if (!input.email) {
    return { ok: false, status: 400, error: "email_missing", code: "EMAIL_MISSING" };
  }

  let result: Awaited<ReturnType<typeof issueEmailOtp>>;
  try {
    result = await issueEmailOtp(input.userId, input.email);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    authLog.error("mfa_email_issue_failed", { userId: input.userId, message });
    await recordMfaAudit("MFA_FAILED", input.userId, {
      channel: "EMAIL",
      reason: "issue_failed",
      message,
    });
    return { ok: false, status: 500, error: "email_issue_failed", code: "EMAIL_ISSUE_FAILED" };
  }

  if (result.status === "rate_limited") {
    await recordMfaAudit("MFA_RATE_LIMITED", input.userId, { channel: "EMAIL" });
    return {
      ok: false,
      status: 429,
      error: "rate_limited",
      code: result.reason === "active_limit" ? "EMAIL_ACTIVE_LIMIT" : "EMAIL_RECENT_REQUEST",
      payload: { retryAt: result.retryAt.toISOString() },
    };
  }

  await recordMfaAudit("MFA_EMAIL_SENT", input.userId, { expiresAt: result.expiresAt });
  authLog.info("mfa_email_issued", { userId: input.userId, expiresAt: result.expiresAt });

  return {
    ok: true,
    status: 200,
    payload: { channel: "email", expiresAt: result.expiresAt },
  };
};

export const verifyEmailFactor = async (
  input: FactorVerifyInput,
): Promise<FactorSuccess | FactorFailure> => {
  if (!input.token) {
    return { ok: false, status: 400, error: "token_required", code: "TOKEN_REQUIRED" };
  }

  let verification: Awaited<ReturnType<typeof verifyEmailOtp>>;
  try {
    verification = await verifyEmailOtp(input.userId, input.token);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    authLog.error("mfa_email_verify_failed", { userId: input.userId, message });
    await recordMfaAudit("MFA_FAILED", input.userId, {
      channel: "EMAIL",
      reason: "verify_failed",
      message,
    });
    return { ok: false, status: 500, error: "email_verify_failed", code: "EMAIL_VERIFY_FAILED" };
  }

  if (!verification.ok) {
    authLog.warn("mfa_email_invalid", { userId: input.userId, reason: verification.reason });
    return { ok: false, status: 401, error: verification.reason, code: verification.reason.toUpperCase() };
  }

  authLog.info("mfa_email_verified", { userId: input.userId });

  return {
    ok: true,
    status: 200,
    factor: "email",
    auditAction: "MFA_SUCCESS",
    auditDiff: null,
  };
};
