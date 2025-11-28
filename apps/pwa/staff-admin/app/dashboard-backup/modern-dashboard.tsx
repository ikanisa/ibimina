import type { Route } from "next";
import { motion } from "framer-motion";
import {
  Briefcase,
  CheckSquare,
  FileText,
  TrendingUp,
  Plus,
  Upload,
  Users,
  AlertCircle,
} from "lucide-react";
import { Container } from "@ibimina-ui/layout/Container";
import { Grid } from "@ibimina-ui/layout/Grid";
import { Stack } from "@ibimina-ui/layout/Stack";
import { DataCard } from "@ibimina-ui/DataCard";
import { Button } from "@ibimina-ui/button";
import { requireUserAndProfile } from "@/lib/auth";
import { getDashboardSummary, EMPTY_DASHBOARD_SUMMARY } from "@/lib/dashboard";
import { Trans } from "@/components/common/trans";
import { logError } from "@/lib/observability/logger";
import { staggerContainer, staggerItem } from "@ibimina-ui/lib/animations";

export const runtime = "nodejs";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function ModernDashboardPage() {
  const { profile } = await requireUserAndProfile();
  const isSystemAdmin = profile.role === "SYSTEM_ADMIN";
  const hasSacco = Boolean(profile.sacco_id);

  let summaryError: unknown = null;
  let summary: Awaited<ReturnType<typeof getDashboardSummary>>;
  try {
    summary = await getDashboardSummary({
      saccoId: profile.sacco_id,
      allowAll: isSystemAdmin,
    });
  } catch (error) {
    summaryError = error;
    const errMsg = error instanceof Error ? error.message : String(error);
    logError("dashboard.summary_failed", { error: errMsg });
    summary = {
      ...EMPTY_DASHBOARD_SUMMARY,
      generatedAt: new Date().toISOString(),
    };
  }

  const firstName = profile.full_name?.split(" ")[0] || "there";
  const greeting = `Good ${getTimeOfDay()}, ${firstName}`;
  const tasksCount = summary.totals.unallocated + summary.missedContributors.length;

  return (
    <Container size="lg">
      <Stack gap="lg">
        {/* Greeting - Personal & Contextual */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-8">
          <h1 className="text-4xl font-bold mb-2">{greeting} 👋</h1>
          <p className="text-muted-foreground">
            {tasksCount > 0 ? (
              <Trans
                i18nKey="dashboard.greeting.tasks"
                fallback="You have <strong>{{count}} tasks</strong> to review"
                values={{ count: tasksCount }}
                components={{ strong: <span className="text-foreground font-medium" /> }}
              />
            ) : (
              <Trans i18nKey="dashboard.greeting.allClear" fallback="All caught up! Great work." />
            )}
          </p>
        </motion.div>

        {/* Quick Actions - AI Suggested */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 flex-wrap"
        >
          <Button variant="default" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            <Trans i18nKey="dashboard.action.createGroup" fallback="New Ikimina" />
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="w-4 h-4" />
            <Trans i18nKey="dashboard.action.import" fallback="Import Statement" />
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="w-4 h-4" />
            <Trans i18nKey="dashboard.action.members" fallback="Add Members" />
          </Button>
        </motion.div>

        {/* Stats Cards - Clean Grid */}
        <Grid cols={4} gap="md">
          <DataCard loading={false}>
            <DataCard.Header
              icon={Briefcase}
              title={<Trans i18nKey="dashboard.stats.deposits.title" fallback="Today's Deposits" />}
            />
            <DataCard.Value
              value={formatCurrency(summary.totals.today)}
              trend={summary.totals.today > 0 ? "up" : "neutral"}
            />
            <DataCard.Description>
              <Trans
                i18nKey="dashboard.stats.deposits.description"
                fallback="{{count}} transactions"
                values={{ count: summary.totals.today > 0 ? "Multiple" : "No" }}
              />
            </DataCard.Description>
          </DataCard>

          <DataCard loading={false}>
            <DataCard.Header
              icon={CheckSquare}
              title={<Trans i18nKey="dashboard.stats.week.title" fallback="Week to Date" />}
            />
            <DataCard.Value value={formatCurrency(summary.totals.week)} />
            <DataCard.Description>
              <Trans i18nKey="dashboard.stats.week.description" fallback="Current week deposits" />
            </DataCard.Description>
          </DataCard>

          <DataCard loading={false}>
            <DataCard.Header
              icon={FileText}
              title={<Trans i18nKey="dashboard.stats.month.title" fallback="Month to Date" />}
            />
            <DataCard.Value value={formatCurrency(summary.totals.month)} trend="up" />
            <DataCard.Description>
              <Trans i18nKey="dashboard.stats.month.description" fallback="Monthly performance" />
            </DataCard.Description>
          </DataCard>

          <DataCard loading={false}>
            <DataCard.Header
              icon={AlertCircle}
              title={<Trans i18nKey="dashboard.stats.unallocated.title" fallback="Unallocated" />}
            />
            <DataCard.Value
              value={summary.totals.unallocated}
              trend={summary.totals.unallocated > 0 ? "down" : "neutral"}
            />
            <DataCard.Description>
              <Trans
                i18nKey="dashboard.stats.unallocated.description"
                fallback="Pending reconciliation"
              />
            </DataCard.Description>
          </DataCard>
        </Grid>

        {/* Main Content Area - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border bg-card">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <h2 className="font-semibold">
                  <Trans i18nKey="dashboard.activity.title" fallback="Recent Activity" />
                </h2>
                <Button variant="ghost" size="sm">
                  <Trans i18nKey="dashboard.activity.viewAll" fallback="View all" />
                </Button>
              </div>
              <div className="divide-y">
                {summary.missedContributors.length > 0 ? (
                  summary.missedContributors.slice(0, 5).map((contributor, idx) => (
                    <div key={idx} className="px-5 py-3">
                      <p className="text-sm font-medium">{contributor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <Trans
                          i18nKey="dashboard.activity.missedContribution"
                          fallback="Missed contribution - Last seen {{date}}"
                          values={{
                            date: new Date(contributor.lastContribution).toLocaleDateString(),
                          }}
                        />
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    <Trans
                      i18nKey="dashboard.activity.empty"
                      fallback="All members are up to date"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Upcoming & Insights */}
          <Stack gap="md">
            {/* Top Ikimina */}
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-4">
                <Trans i18nKey="dashboard.topGroups.title" fallback="Top Groups" />
              </h3>
              <Stack gap="sm">
                {summary.topIkimina.slice(0, 5).map((ikimina, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{ikimina.name}</p>
                      <p className="text-xs text-muted-foreground">{ikimina.memberCount} members</p>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(ikimina.totalDeposits)}
                    </span>
                  </div>
                ))}
              </Stack>
            </div>

            {/* System Status */}
            {summaryError && (
              <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">
                    <Trans i18nKey="dashboard.offline.title" fallback="Offline Mode" />
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  <Trans
                    i18nKey="dashboard.offline.description"
                    fallback="Working with cached data. Changes will sync when back online."
                  />
                </p>
              </div>
            )}
          </Stack>
        </div>
      </Stack>
    </Container>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
