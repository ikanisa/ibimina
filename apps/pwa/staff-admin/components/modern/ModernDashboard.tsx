"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  CheckSquare,
  FileText,
  TrendingUp,
  Plus,
  Sparkles,
  Users,
  DollarSign,
} from "lucide-react";
import type { Route } from "next";
import { Container, Grid, Stack, DataCard, EmptyState, staggerContainer, staggerItem } from "@ibimina/ui";

export interface ModernDashboardProps {
  summary: {
    totals: {
      today: number;
      week: number;
      month: number;
      unallocated: number;
    };
    activeIkimina: number;
    missedContributors: Array<{
      id: string;
      name: string;
      lastContribution?: string;
    }>;
    topIkimina: Array<{
      id: string;
      name: string;
      monthlyTotal: number;
      memberCount: number;
    }>;
    generatedAt: string;
  };
  isLoading?: boolean;
  userProfile: {
    firstName: string;
    role: string;
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ModernDashboard({ summary, isLoading, userProfile }: ModernDashboardProps) {
  const stats = [
    {
      id: "today",
      icon: DollarSign,
      title: "Today's Deposits",
      value: formatCurrency(summary.totals.today),
      trend: "up" as const,
      description: "12 transactions recorded",
    },
    {
      id: "week",
      icon: TrendingUp,
      title: "Week to Date",
      value: formatCurrency(summary.totals.week),
      trend: "up" as const,
      description: "↑ 15% from last week",
    },
    {
      id: "month",
      icon: Briefcase,
      title: "Month to Date",
      value: formatCurrency(summary.totals.month),
      trend: "up" as const,
      description: `${summary.activeIkimina} groups active`,
    },
    {
      id: "unallocated",
      icon: CheckSquare,
      title: "Unallocated",
      value: summary.totals.unallocated.toString(),
      trend: summary.totals.unallocated > 0 ? ("down" as const) : ("neutral" as const),
      description: summary.totals.unallocated > 0 ? "Needs attention" : "All reconciled",
    },
  ];

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

  const pendingTasksCount = summary.totals.unallocated + summary.missedContributors.length;

  return (
    <Container size="xl">
      <Stack gap="lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
            {greeting}, {userProfile.firstName} 👋
          </h1>
          <p className="text-muted-foreground">
            {pendingTasksCount > 0 ? (
              <>
                You have <span className="text-foreground font-medium">{pendingTasksCount} tasks</span> that need attention
              </>
            ) : ("Everything is looking great today!")}
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <Grid cols={4} gap="md" responsive>
            {stats.map((stat) => (
              <motion.div key={stat.id} variants={staggerItem}>
                <DataCard loading={isLoading}>
                  <DataCard.Header icon={stat.icon} title={stat.title} />
                  <DataCard.Value value={stat.value} trend={stat.trend} />
                  <DataCard.Description>{stat.description}</DataCard.Description>
                </DataCard>
              </motion.div>
            ))}
          </Grid>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-card">
              <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Recent Activity</h2>
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">View all</button>
              </div>
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {summary.topIkimina.length > 0 ? (
                  summary.topIkimina.slice(0, 5).map((ikimina, index) => (
                    <motion.div key={ikimina.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="px-5 py-4 hover:bg-muted transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{ikimina.name}</p>
                            <p className="text-sm text-muted-foreground">{ikimina.memberCount} members</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{formatCurrency(ikimina.monthlyTotal)}</p>
                          <p className="text-sm text-emerald-500">↑ This month</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8">
                    <EmptyState icon={FileText} title="No recent activity" description="Activity from your groups will appear here" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <Stack gap="md">
            {summary.totals.unallocated > 0 && (
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span className="text-sm font-medium text-rose-900 dark:text-rose-100">Needs Attention</span>
                </div>
                <p className="text-2xl font-bold text-rose-900 dark:text-rose-100 mb-2">{summary.totals.unallocated}</p>
                <p className="text-sm text-rose-700 dark:text-rose-300 mb-4">Unallocated transactions waiting for reconciliation</p>
              </div>
            )}

            {summary.missedContributors.length > 0 && (
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-card p-5">
                <h3 className="font-semibold mb-4 text-foreground">Missed Contributors</h3>
                <Stack gap="sm">
                  {summary.missedContributors.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs font-medium text-muted-foreground">{member.name.charAt(0)}</span>
                        </div>
                        <span className="text-sm text-foreground">{member.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {member.lastContribution ? new Date(member.lastContribution).toLocaleDateString() : "Never"}
                      </span>
                    </div>
                  ))}
                </Stack>
              </div>
            )}
          </Stack>
        </div>
      </Stack>
    </Container>
  );
}
