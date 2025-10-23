import { verifyTotp } from "@/lib/mfa/crypto";
import { preventTotpReplay } from "../limits";
import { decryptTotpSecret, redactSecret } from "../util/crypto";
import { authLog } from "../util/log";
import type { FactorFailure, FactorSuccess, FactorVerifyInput } from "./index";

export const verifyTotpFactor = async (
  input: FactorVerifyInput,
): Promise<FactorSuccess | FactorFailure> => {
  if (!input.token) {
    return { ok: false, status: 400, error: "token_required", code: "TOKEN_REQUIRED" };
  }

  const encrypted = input.state.totpSecret;
  if (!encrypted) {
    return { ok: false, status: 400, error: "mfa_not_configured", code: "MFA_NOT_CONFIGURED" };
  }

  let secret: string;
  try {
    secret = decryptTotpSecret(encrypted);
  } catch (error) {
    authLog.error("mfa_totp_decrypt_failed", {
      userId: input.userId,
      message: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, status: 500, error: "decryption_failed", code: "DECRYPTION_FAILED" };
  }

  const sanitized = input.token.replace(/[^0-9]/g, "");
  const verification = verifyTotp(secret, sanitized, 1);

  if (!verification.ok || typeof verification.step !== "number") {
    authLog.warn("mfa_totp_invalid", { userId: input.userId });
    return { ok: false, status: 401, error: "invalid_code", code: "INVALID_CODE" };
  }

  const lastStep = input.state.lastStep ?? null;
  const nextStep = verification.step;

  if (lastStep !== null && nextStep < lastStep - 1) {
    authLog.warn("mfa_totp_replay_detected", {
      userId: input.userId,
      lastStep,
      nextStep,
    });
    return { ok: false, status: 401, error: "replay_detected", code: "REPLAY_BLOCKED" };
  }

  if (!preventTotpReplay(input.userId, nextStep)) {
    authLog.warn("mfa_totp_step_reused", { userId: input.userId, step: nextStep });
    return { ok: false, status: 401, error: "replay_detected", code: "REPLAY_BLOCKED" };
  }

  authLog.info("mfa_totp_verified", {
    userId: input.userId,
    lastStep,
    nextStep,
    secret: redactSecret(secret),
  });

  return {
    ok: true,
    status: 200,
    factor: "totp",
    auditAction: "MFA_SUCCESS",
    auditDiff: null,
    step: nextStep,
    nextLastStep: lastStep !== null ? Math.max(lastStep, nextStep) : nextStep,
  };
};
