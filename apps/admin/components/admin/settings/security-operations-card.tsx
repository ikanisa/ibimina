"use client";

import { useState, useTransition } from "react";
import { useTranslation } from "@/providers/i18n-provider";
import { useToast } from "@/providers/toast-provider";
import { resetMfaForAllEnabled } from "@/app/(main)/admin/actions";

interface SecurityOperationsCardProps {
  canReset: boolean;
}

export function SecurityOperationsCard({ canReset }: SecurityOperationsCardProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [lastCount, setLastCount] = useState<number | null>(null);

  const handleResetMfa = () => {
    startTransition(async () => {
      if (!canReset) {
        toast.error(t("admin.settings.mfaForbidden", "Only system administrators can reset MFA."));
        return;
      }
      const result = await resetMfaForAllEnabled({ reason: "admin_panel" });
      if (result.status === "error") {
        toast.error(result.message ?? t("common.operationFailed", "Operation failed"));
        return;
      }
      setLastCount(result.count ?? 0);
      toast.success(
        t("admin.settings.mfaResetSuccess", "Cleared MFA for {{count}} user(s).", {
          count: result.count ?? 0,
        })
      );
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-2">
        {t(
          "admin.settings.securityDescription",
          "Use these controls to recover access for staff when authenticators are unavailable."
        )}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleResetMfa}
          disabled={!canReset || pending}
          className="interactive-scale rounded-full bg-rose-500/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-0 shadow-glass disabled:opacity-60"
        >
          {pending
            ? t("common.processing", "Processing…")
            : t("admin.settings.resetMfa", "Reset MFA for all")}
        </button>
        {!canReset && (
          <span className="text-xs text-neutral-3">
            {t("admin.settings.mfaRequiresAdmin", "Requires system admin role.")}
          </span>
        )}
        {typeof lastCount === "number" && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-neutral-0">
            {t("admin.settings.mfaLastCount", "Last run cleared {{count}}", { count: lastCount })}
          </span>
        )}
      </div>
      <ul className="list-disc space-y-2 pl-6 text-xs text-neutral-3">
        <li>
          {t(
            "admin.settings.securityHint.logs",
            "Actions trigger an audit log with actor, timestamp, and reason."
          )}
        </li>
        <li>
          {t(
            "admin.settings.securityHint.notify",
            "Notify affected users to re-enrol MFA immediately after a reset."
          )}
        </li>
      </ul>
    </div>
  );
}
