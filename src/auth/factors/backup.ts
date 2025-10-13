import { consumeBackupCode } from "@/lib/mfa";
import type { FactorFailure, FactorSuccess, FactorVerifyInput } from "./index";
import { authLog } from "../util/log";

export const verifyBackupFactor = async (
  input: FactorVerifyInput,
): Promise<FactorSuccess | FactorFailure> => {
  if (!input.token) {
    return { ok: false, status: 400, error: "token_required", code: "TOKEN_REQUIRED" };
  }

  const hashes = input.state.backupHashes ?? [];
  const next = consumeBackupCode(input.token, hashes);

  if (!next) {
    authLog.warn("mfa_backup_invalid", { userId: input.userId });
    return { ok: false, status: 401, error: "invalid_code", code: "INVALID_BACKUP" };
  }

  authLog.info("mfa_backup_consumed", { userId: input.userId, remaining: next.length });

  return {
    ok: true,
    status: 200,
    factor: "backup",
    usedBackup: true,
    auditAction: "MFA_BACKUP_SUCCESS",
    auditDiff: { remaining: next.length },
    nextBackupHashes: next,
  };
};
