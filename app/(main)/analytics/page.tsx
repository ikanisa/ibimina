import { GradientHeader } from "@/components/ui/gradient-header";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusChip } from "@/components/common/status-chip";
import { requireUserAndProfile } from "@/lib/auth";
import { BilingualText } from "@/components/common/bilingual-text";
import { getExecutiveAnalytics } from "@/lib/analytics";
import { ExecutiveOverview } from "@/components/analytics/executive-overview";

export default async function AnalyticsPage() {
  const { profile } = await requireUserAndProfile();
  const saccoScope = profile.role === "SYSTEM_ADMIN" ? null : profile.sacco_id ?? null;
  const analytics = await getExecutiveAnalytics(saccoScope);

  const scopeLabel =
    profile.role === "SYSTEM_ADMIN"
      ? "All SACCOs"
      : profile.saccos?.name ?? "Assigned SACCO";

  return (
    <div className="space-y-8">
      <GradientHeader
        title={<BilingualText primary="Executive analytics" secondary="Isesengura ry'ubuyobozi" />}
        subtitle={
          <BilingualText
            primary="Track contribution momentum, automation throughput, and at-risk ikimina."
            secondary="Kurikirana uko imisanzu izamuka, uburyo automatike ikora n'amatsinda akeneye kwitabwaho."
            secondaryClassName="text-xs text-ink/70"
          />
        }
        badge={<StatusChip tone="neutral">{scopeLabel}</StatusChip>}
      />

      <GlassCard
        title={<BilingualText primary="Executive overview" secondary="Incamake y'ubuyobozi" />}
        subtitle={
          <BilingualText
            primary="Key indicators for leadership and SACCO follow-up."
            secondary="Ibipimo by'ingenzi bigenewe abayobozi n'abakurikirana SACCO."
            secondaryClassName="text-xs text-neutral-3"
          />
        }
      >
        <ExecutiveOverview analytics={analytics} />
      </GlassCard>
    </div>
  );
}
