"use client";

import { useMemo } from "react";
import { useTranslation } from "@/providers/i18n-provider";
import type { MfaInsights, MfaRiskAccount, MfaRiskReason } from "@/lib/mfa/insights";
import { Badge, MetricCard, SectionHeader } from "@ibimina/ui";

const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

interface MfaInsightsCardProps {
  insights: MfaInsights;
}

function formatDate(value: string | null, fallback: string): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString();
}

function describeReason(
  reason: MfaRiskReason,
  format: (key: string, fallback: string, vars?: Record<string, string | number>) => string
) {
  switch (reason.type) {
    case "disabled":
      return format("admin.security.laggards.reason.disabled", "MFA disabled");
    case "stale":
      return format("admin.security.laggards.reason.stale", "No MFA success in {{days}} days", {
        days: reason.days,
      });
    case "failures":
      return format("admin.security.laggards.reason.failures", "{{count}} failed attempts", {
        count: reason.failures,
      });
    default:
      return "";
  }
}

function RiskAccountList({ accounts }: { accounts: MfaRiskAccount[] }) {
  const { t } = useTranslation();

  const format = useMemo(
    () =>
      (key: string, fallback: string, vars: Record<string, string | number> = {}) => {
        let value = t(key, fallback);
        Object.entries(vars).forEach(([token, raw]) => {
          value = value.replace(`{{${token}}}`, String(raw));
        });
        return value;
      },
    [t]
  );

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-neutral-2">
        {t("admin.security.laggards.empty", "All staff have recent MFA activity.")}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {accounts.map((account) => (
        <li
          key={account.id}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-neutral-0"
        >
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">{account.email ?? t("common.unknown", "Unknown")}</p>
              <p className="text-[11px] text-neutral-3">
                {account.saccoName ?? t("sacco.unassigned", "Unassigned")}
              </p>
            </div>
            <div className="text-right text-[11px] text-neutral-3">
              <p>
                {t("admin.security.laggards.lastSuccess", "Last success:")}{" "}
                {formatDate(account.lastSuccessAt, t("admin.security.laggards.never", "Never"))}
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {account.reason.map((reason) => {
              const detailKey =
                reason.type === "stale"
                  ? `days-${reason.days}`
                  : reason.type === "failures"
                    ? `fail-${reason.failures}`
                    : "on";
              return (
                <Badge
                  key={`${account.id}-${reason.type}-${detailKey}`}
                  size="sm"
                  variant={reason.type === "failures" ? "critical" : "warning"}
                >
                  {describeReason(reason, format)}
                </Badge>
              );
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}

function MetricsGrid({ insights }: { insights: MfaInsights }) {
  const { t } = useTranslation();
  const metrics = useMemo(
    () => [
      {
        label: t("admin.security.metrics.totalStaff", "Staff accounts"),
        value: insights.totals.users,
      },
      {
        label: t("admin.security.metrics.mfaEnabled", "MFA enabled"),
        value: insights.totals.mfaEnabled,
      },
      {
        label: t("admin.security.metrics.passkeyUsers", "Passkey users"),
        value: insights.totals.passkeyUsers,
      },
      {
        label: t("admin.security.metrics.passkeyCredentials", "Passkey credentials"),
        value: insights.totals.passkeyCredentials,
      },
      {
        label: t("admin.security.metrics.totpUsers", "Authenticator users"),
        value: insights.totals.totpUsers,
      },
      {
        label: t("admin.security.metrics.emailUsers", "Email code users"),
        value: insights.totals.emailUsers,
      },
      {
        label: t("admin.security.metrics.trustedDevices", "Trusted devices"),
        value: insights.totals.trustedDevices,
      },
      {
        label: t("admin.security.metrics.outstandingCodes", "Active email codes"),
        value: insights.totals.outstandingEmailCodes,
      },
    ],
    [insights.totals, t]
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.label}
          label={metric.label}
          value={numberFormatter.format(metric.value)}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-4 shadow-glass backdrop-blur"
        />
      ))}
    </div>
  );
}

function SaccoCoverageTable({ insights }: { insights: MfaInsights }) {
  const { t } = useTranslation();

  if (insights.saccoCoverage.length === 0) {
    return (
      <p className="text-sm text-neutral-2">
        {t("admin.security.sacco.empty", "No SACCO assignments yet.")}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.2em] text-neutral-2">
          <tr>
            <th className="px-4 py-3">{t("admin.security.sacco.headers.sacco", "SACCO")}</th>
            <th className="px-4 py-3 text-right">
              {t("admin.security.sacco.headers.users", "Staff")}
            </th>
            <th className="px-4 py-3 text-right">
              {t("admin.security.sacco.headers.mfa", "MFA enabled")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 bg-white/5 text-xs text-neutral-0">
          {insights.saccoCoverage.map((entry) => (
            <tr key={entry.saccoId ?? "unassigned"} className="hover:bg-white/5">
              <td className="px-4 py-3 font-medium">{entry.saccoName}</td>
              <td className="px-4 py-3 text-right">{numberFormatter.format(entry.userCount)}</td>
              <td className="px-4 py-3 text-right text-emerald-200">
                {numberFormatter.format(entry.mfaEnabled)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MfaInsightsCard({ insights }: MfaInsightsCardProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <header>
          <h3 className="text-lg font-semibold text-neutral-0">
            {t("admin.security.metrics.title", "Adoption summary")}
          </h3>
          <p className="text-xs text-neutral-2">
            {t(
              "admin.security.metrics.subtitle",
              "Track coverage of passkeys, authenticators, and email codes."
            )}
          </p>
        </header>
        <MetricsGrid insights={insights} />
      </section>

      <section className="space-y-3">
        <header>
          <h3 className="text-lg font-semibold text-neutral-0">
            {t("admin.security.laggards.title", "At-risk accounts")}
          </h3>
          <p className="text-xs text-neutral-2">
            {t(
              "admin.security.laggards.subtitle",
              "Follow up with staff who need assistance completing MFA."
            )}
          </p>
        </header>
        <RiskAccountList accounts={insights.riskAccounts} />
      </section>

      <section className="space-y-3">
        <SectionHeader title={t("admin.security.sacco.title", "Coverage by SACCO")} />
        <SaccoCoverageTable insights={insights} />
      </section>
    </div>
  );
}
