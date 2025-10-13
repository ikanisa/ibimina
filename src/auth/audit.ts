import { logAudit } from "@/lib/audit";
import { authLog } from "./util/log";

type AuditAction =
  | "MFA_SUCCESS"
  | "MFA_FAILED"
  | "MFA_BACKUP_SUCCESS"
  | "MFA_EMAIL_SENT"
  | "MFA_EMAIL_VERIFIED"
  | "MFA_WHATSAPP_SENT"
  | "MFA_WHATSAPP_VERIFIED"
  | "MFA_RATE_LIMITED";

export const recordMfaAudit = async (
  action: AuditAction,
  userId: string,
  diff: Record<string, unknown> | null,
) => {
  try {
    await logAudit({ action, entity: "USER", entityId: userId, diff });
  } catch (error) {
    authLog.error("mfa_audit_failed", {
      action,
      userId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
