"use client";

import { useTranslation } from "@/providers/i18n-provider";

interface SecurityOperationsCardProps {
  canReset: boolean;
}

export function SecurityOperationsCard({ canReset }: SecurityOperationsCardProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-2">
        {t(
          "admin.settings.securityDescription",
          "Multi-factor recovery tooling has been retired. Account security now relies on the simplified login flow and standard password resets."
        )}
      </p>
      {!canReset && (
        <span className="text-xs text-neutral-3">
          {t(
            "admin.settings.securityHint.readonly",
            "No additional security actions are available for your role."
          )}
        </span>
      )}
    </div>
  );
}
