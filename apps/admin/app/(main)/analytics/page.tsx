import { GradientHeader } from "@/components/ui/gradient-header";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusChip } from "@/components/common/status-chip";
import { requireUserAndProfile } from "@/lib/auth";
import { Trans } from "@/components/common/trans";
import { getExecutiveAnalytics } from "@/lib/analytics";
import { ExecutiveOverview } from "@/components/analytics/executive-overview";

export default async function AnalyticsPage() {
  const { profile } = await requireUserAndProfile();
  const saccoScope = profile.role === "SYSTEM_ADMIN" ? null : (profile.sacco_id ?? null);
  const analytics = await getExecutiveAnalytics(saccoScope);

  const scopeLabel =
    profile.role === "SYSTEM_ADMIN" ? "All SACCOs" : (profile.sacco?.name ?? "Assigned SACCO");

  return (
    <div className="space-y-8">
      <GradientHeader
        title={<Trans i18nKey="analytics.title" fallback="Executive analytics" />}
        subtitle={
          <Trans
            i18nKey="analytics.subtitle"
            fallback="Track contribution momentum, automation throughput, and at-risk ikimina."
            className="text-xs text-ink/70"
          />
        }
        badge={<StatusChip tone="neutral">{scopeLabel}</StatusChip>}
      />

      <GlassCard
        title={<Trans i18nKey="analytics.overview.title" fallback="Executive overview" />}
        subtitle={
          <Trans
            i18nKey="analytics.overview.subtitle"
            fallback="Key indicators for leadership and SACCO follow-up."
            className="text-xs text-neutral-3"
          />
        }
      >
        <ExecutiveOverview analytics={analytics} />
      </GlassCard>
    </div>
  );
}
