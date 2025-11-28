import type { Route } from "next";
import {
  Briefcase,
  FileText,
  TrendingUp,
  Users,
  CheckSquare,
  Plus,
  Upload,
  Sparkles,
} from "lucide-react";
import { Container } from "@ibimina-sacco/ui/components/layout/Container";
import { Grid } from "@ibimina-sacco/ui/components/layout/Grid";
import { Stack } from "@ibimina-sacco/ui/components/layout/Stack";
import { DataCard } from "@ibimina-sacco/ui/components/DataCard";
import { QuickActionsButton } from "@ibimina-sacco/ui/components/QuickActionsButton";
import { EmptyState } from "@ibimina-sacco/ui/components/empty-state";
import { AnimatedPage } from "@ibimina-sacco/ui/components/AnimatedPage";
import { MissedContributorsList } from "@/components/dashboard/missed-contributors-list";
import { requireUserAndProfile } from "@/lib/auth";
import { getDashboardSummary, EMPTY_DASHBOARD_SUMMARY } from "@/lib/dashboard";
import { Trans } from "@/components/common/trans";
import { TopIkiminaTable } from "@/components/dashboard/top-ikimina-table";
import { logError } from "@/lib/observability/logger";
import { QueuedSyncSummary } from "@/components/system/queued-sync-summary";

export const runtime = "nodejs";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function RefactoredDashboardPage() {
  const { profile } = await requireUserAndProfile();
  const isSystemAdmin = profile.role === "SYSTEM_ADMIN";
  const hasSacco = Boolean(profile.sacco_id);

  if (!isSystemAdmin && !hasSacco) {
    return (
      <Container size="lg" centerContent className="min-h-[60vh]">
        <EmptyState
          icon={Users}
          title="SACCO assignment required"
          description="Contact a system administrator to link your account to a SACCO before continuing."
        />
      </Container>
    );
  }

  // Fetch dashboard data
  let summaryError: unknown = null;
  let summary: Awaited<ReturnType<typeof getDashboardSummary>>;
  try {
    summary = await getDashboardSummary({ saccoId: profile.sacco_id, allowAll: isSystemAdmin });
  } catch (error) {
    summaryError = error;
    const errMsg = error instanceof Error ? error.message : String(error);
    logError("dashboard.summary_failed", { error: errMsg });
    summary = { ...EMPTY_DASHBOARD_SUMMARY, generatedAt: new Date().toISOString() };
  }

  // Quick actions with AI suggestions
  const quickActions = [
    {
      id: "create-ikimina",
      icon: Plus,
      label: "New Ikimina",
      description: "Launch a new group with configured policies",
      action: () => {}, // Will be handled client-side
      variant: "primary" as const,
    },
    {
      id: "import-members",
      icon: Users,
      label: "Import Members",
      description: "Bulk upload CSV or spreadsheet rosters",
      action: () => {},
    },
    {
      id: "import-statement",
      icon: FileText,
      label: "Import Statement",
      description: "Drop MoMo statements for matching and posting",
      action: () => {},
    },
  ];

  const loading = false; // Set based on actual loading state

  return (
    <AnimatedPage>
      <Container size="lg">
        <Stack gap="lg">
          {/* Header - Greeting & Context */}
          <Stack gap="sm" className="py-8">
            <h1 className="text-4xl font-bold tracking-tight">
              <Trans
                i18nKey="dashboard.greeting"
                fallback="Good day, {{name}} 👋"
                values={{ name: profile.first_name || "there" }}
              />
            </h1>
            <p className="text-muted-foreground">
              <Trans i18nKey="dashboard.context" fallback="Here's your SACCO overview for today" />
            </p>
          </Stack>

          {/* Quick Actions */}
          <QuickActionsButton actions={quickActions} maxVisible={4} />

          {/* KPI Cards - Clean Grid */}
          <Grid cols={4} gap="md" responsive={{ sm: 1, md: 2, lg: 4 }}>
            <DataCard loading={loading} onClick={() => {}}>
              <DataCard.Header icon={TrendingUp} title="Today's Deposits" />
              <DataCard.Value value={formatCurrency(summary.totals.today)} trend="up" />
              <DataCard.Description>
                <Trans
                  i18nKey="dashboard.kpi.today.description"
                  fallback="Contributions received today"
                />
              </DataCard.Description>
            </DataCard>

            <DataCard loading={loading} onClick={() => {}}>
              <DataCard.Header icon={TrendingUp} title="Week to Date" />
              <DataCard.Value value={formatCurrency(summary.totals.week)} />
              <DataCard.Description>
                <Trans
                  i18nKey="dashboard.kpi.week.description"
                  fallback="This week's total deposits"
                />
              </DataCard.Description>
            </DataCard>

            <DataCard loading={loading} onClick={() => {}}>
              <DataCard.Header icon={TrendingUp} title="Month to Date" />
              <DataCard.Value value={formatCurrency(summary.totals.month)} trend="up" />
              <DataCard.Description>
                <Trans
                  i18nKey="dashboard.kpi.month.description"
                  fallback="Monthly deposits so far"
                />
              </DataCard.Description>
            </DataCard>

            <DataCard loading={loading} onClick={() => {}}>
              <DataCard.Header icon={CheckSquare} title="Unallocated" />
              <DataCard.Value value={summary.totals.unallocated} />
              <DataCard.Description>
                <Trans
                  i18nKey="dashboard.kpi.unallocated.description"
                  fallback="Pending allocations"
                />
              </DataCard.Description>
            </DataCard>
          </Grid>

          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              {/* Top Ikimina Table */}
              <div className="rounded-xl border bg-card">
                <div className="px-5 py-4 border-b">
                  <h2 className="font-semibold">
                    <Trans i18nKey="dashboard.topIkimina.title" fallback="Top Performing Groups" />
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    <Trans
                      i18nKey="dashboard.topIkimina.subtitle"
                      fallback="Groups with highest contribution rates"
                    />
                  </p>
                </div>
                <div className="p-5">
                  <TopIkiminaTable groups={summary.topIkimina || []} />
                </div>
              </div>

              {/* Queued Sync Summary */}
              {isSystemAdmin && (
                <div className="rounded-xl border bg-card p-5">
                  <QueuedSyncSummary />
                </div>
              )}
            </div>

            {/* Sidebar - 1/3 width */}
            <Stack gap="md">
              {/* Missed Contributors Card */}
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-4">
                  <Trans i18nKey="dashboard.missed.title" fallback="Missed Contributors" />
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  <Trans
                    i18nKey="dashboard.missed.subtitle"
                    fallback="Members without a contribution in the last month"
                  />
                </p>
                <MissedContributorsList members={summary.missedContributors || []} />
              </div>

              {/* AI Insights Card */}
              <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">AI Insights</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  <Trans
                    i18nKey="dashboard.ai.suggestion"
                    fallback="Based on current trends, consider reaching out to members who haven't contributed in 30+ days."
                  />
                </p>
              </div>

              {/* Last Updated */}
              <div className="text-xs text-muted-foreground text-center">
                <Trans
                  i18nKey="dashboard.lastUpdated"
                  fallback="Last updated: {{value}}"
                  values={{
                    value: summary.generatedAt
                      ? new Date(summary.generatedAt).toLocaleString()
                      : "—",
                  }}
                />
              </div>
            </Stack>
          </div>
        </Stack>
      </Container>
    </AnimatedPage>
  );
}
