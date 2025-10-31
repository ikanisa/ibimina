import type { Route } from "next";
import { GradientHeader } from "@/components/ui/gradient-header";
import { GlassCard } from "@/components/ui/glass-card";
import { KPIStat } from "@/components/dashboard/kpi-stat";
import { QuickAction } from "@/components/dashboard/quick-action";
import { StatusChip } from "@/components/common/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { MissedContributorsList } from "@/components/dashboard/missed-contributors-list";
import { requireUserAndProfile } from "@/lib/auth";
import { getDashboardSummary, EMPTY_DASHBOARD_SUMMARY } from "@/lib/dashboard";
import { Trans } from "@/components/common/trans";
import { TopIkiminaTable } from "@/components/dashboard/top-ikimina-table";

export const runtime = "nodejs";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(amount);
}

const quickActions = [
  {
    label: <Trans i18nKey="dashboard.quick.createIkimina.title" fallback="Create Ikimina" />,
    description: (
      <Trans
        i18nKey="dashboard.quick.createIkimina.description"
        fallback="Launch a new group with the configured policies."
      />
    ),
    href: "/ikimina" as Route,
    eventName: "dashboard.quickAction.createIkimina",
    eventProperties: { destination: "/ikimina" },
  },
  {
    label: <Trans i18nKey="dashboard.quick.importMembers.title" fallback="Import Members" />,
    description: (
      <Trans
        i18nKey="dashboard.quick.importMembers.description"
        fallback="Bulk-upload CSV or spreadsheet rosters."
      />
    ),
    href: "/ikimina" as Route,
    eventName: "dashboard.quickAction.importMembers",
    eventProperties: { destination: "/ikimina" },
  },
  {
    label: <Trans i18nKey="dashboard.quick.importStatement.title" fallback="Import Statement" />,
    description: (
      <Trans
        i18nKey="dashboard.quick.importStatement.description"
        fallback="Drop MoMo statements for matching and posting."
      />
    ),
    href: "/recon" as Route,
    eventName: "dashboard.quickAction.importStatement",
    eventProperties: { destination: "/recon" },
  },
  {
    label: <Trans i18nKey="dashboard.quick.goRecon.title" fallback="Go to Reconciliation" />,
    description: (
      <Trans
        i18nKey="dashboard.quick.goRecon.description"
        fallback="Review unknown references and exceptions."
      />
    ),
    href: "/recon" as Route,
    eventName: "dashboard.quickAction.reviewRecon",
    eventProperties: { destination: "/recon" },
  },
] as const;

export default async function DashboardPage() {
  const { profile } = await requireUserAndProfile();
  const isSystemAdmin = profile.role === "SYSTEM_ADMIN";
  const hasSacco = Boolean(profile.sacco_id);

  if (!isSystemAdmin && !hasSacco) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          title="SACCO assignment required"
          description="Contact a system administrator to link your account to a SACCO before continuing."
        />
      </div>
    );
  }

  let summaryError: unknown = null;
  let summary: Awaited<ReturnType<typeof getDashboardSummary>>;
  try {
    summary = await getDashboardSummary({ saccoId: profile.sacco_id, allowAll: isSystemAdmin });
  } catch (error) {
    summaryError = error;
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[DashboardPage] failed to load summary: ${errMsg}`);
    summary = { ...EMPTY_DASHBOARD_SUMMARY, generatedAt: new Date().toISOString() };
  }

  const kpis = [
    {
      label: "Today's Deposits",
      value: formatCurrency(summary.totals.today),
      accent: "blue" as const,
    },
    {
      label: "Week to Date",
      value: formatCurrency(summary.totals.week),
      accent: "yellow" as const,
    },
    {
      label: "Month to Date",
      value: formatCurrency(summary.totals.month),
      accent: "green" as const,
    },
    {
      label: "Unallocated",
      value: summary.totals.unallocated.toString(),
      accent: "neutral" as const,
    },
  ];

  const lastUpdatedLabel = summary.generatedAt
    ? new Date(summary.generatedAt).toLocaleString()
    : "—";
  const headerBadge = summaryError ? (
    <StatusChip tone="warning">Cached data</StatusChip>
  ) : (
    <StatusChip tone="neutral">Staff access</StatusChip>
  );

  return (
    <div className="space-y-8">
      <GradientHeader
        title={<Trans i18nKey="dashboard.title" fallback="SACCO overview" />}
        subtitle={
          <Trans
            i18nKey="dashboard.subtitle"
            fallback="Monitor deposits, member activity, and reconciliation health across your Umurenge SACCO."
            className="text-xs text-ink/70"
          />
        }
        badge={headerBadge}
      >
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {kpis.map((kpi, idx) => (
            <KPIStat key={idx} label={kpi.label} value={kpi.value} accent={kpi.accent} />
          ))}
        </div>
        <p className="mt-4 text-xs text-neutral-3">
          <Trans
            i18nKey="dashboard.lastUpdated"
            fallback="Last updated: {{value}}"
            values={{ value: lastUpdatedLabel }}
          />
        </p>
      </GradientHeader>

      {summaryError ? (
        <GlassCard
          title={<Trans i18nKey="dashboard.cached.title" fallback="Working with cached data" />}
          subtitle={
            <Trans
              i18nKey="dashboard.cached.subtitle"
              fallback="We couldn't reach Supabase just now. You're viewing cached metrics until the connection recovers."
              className="text-xs text-neutral-3"
            />
          }
        >
          <EmptyState
            title={<Trans i18nKey="dashboard.cached.action" fallback="Reconnect to refresh data" />}
            description={
              <Trans
                i18nKey="dashboard.cached.description"
                fallback="Check your connection and reload to sync the latest figures."
              />
            }
          />
        </GlassCard>
      ) : null}

      <GlassCard
        title={<Trans i18nKey="dashboard.quick.title" fallback="Quick actions" />}
        subtitle={
          <Trans
            i18nKey="dashboard.quick.subtitle"
            fallback="Shave seconds off your daily workflows with the most common tasks."
            className="text-xs text-neutral-3"
          />
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action, idx) => (
            <QuickAction key={idx} {...action} />
          ))}
        </div>
      </GlassCard>

      <GlassCard
        title={<Trans i18nKey="dashboard.missed.title" fallback="Missed contributors" />}
        subtitle={
          <Trans
            i18nKey="dashboard.missed.subtitle"
            fallback="Members without a recorded contribution in the last month."
            className="text-xs text-neutral-3"
          />
        }
      >
        {summary.missedContributors.length > 0 ? (
          <MissedContributorsList contributors={summary.missedContributors} />
        ) : (
          <EmptyState
            title="All caught up"
            description="Every active member has a recent contribution."
          />
        )}
      </GlassCard>

      <GlassCard
        title={<Trans i18nKey="dashboard.top.title" fallback="Top Ikimina" />}
        subtitle={
          <Trans
            i18nKey="dashboard.top.subtitle"
            fallback="Most active groups by deposit volume this month."
            className="text-xs text-neutral-3"
          />
        }
        actions={<StatusChip tone="neutral">{summary.activeIkimina} active</StatusChip>}
      >
        <TopIkiminaTable data={summary.topIkimina} />
      </GlassCard>
    </div>
  );
}
