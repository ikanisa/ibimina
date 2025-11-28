"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  CheckSquare,
  FileText,
  AlertCircle,
  Plus,
  Upload,
  Users,
  TrendingUp,
} from "lucide-react";
import { Container, Grid, Stack, DataCard, Button } from "@ibimina/ui";
import { staggerContainer, staggerItem } from "@ibimina/ui/lib/animations";
import type { DashboardSummary } from "@/lib/dashboard";

interface ModernDashboardProps {
  summary: DashboardSummary;
  userName: string;
  loading?: boolean;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function ModernDashboard({ summary, userName, loading = false }: ModernDashboardProps) {
  const greeting = `Good ${getTimeOfDay()}, ${userName}`;
  const tasksCount = summary.totals.unallocated + summary.missedContributors.length;

  return (
    <Container size="lg">
      <Stack gap="lg">
        {/* Greeting - Personal & Contextual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-8"
        >
          <h1 className="text-4xl font-bold mb-2">{greeting} 👋</h1>
          <p className="text-muted-foreground">
            {tasksCount > 0 ? (
              <>
                You have <span className="text-foreground font-medium">{tasksCount} tasks</span> to
                review
              </>
            ) : (
              "All caught up! Great work."
            )}
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 flex-wrap"
        >
          <Button variant="default" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            New Member
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="w-4 h-4" />
            Import Statement
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="w-4 h-4" />
            Create Group
          </Button>
        </motion.div>

        {/* Stats Cards - Clean Grid */}
        <Grid cols={4} gap="md">
          <DataCard loading={loading}>
            <DataCard.Header icon={Briefcase} title="Today's Deposits" />
            <DataCard.Value
              value={formatCurrency(summary.totals.today)}
              trend={summary.totals.today > 0 ? "up" : "neutral"}
            />
            <DataCard.Description>
              {summary.totals.today > 0 ? "Multiple" : "No"} transactions
            </DataCard.Description>
          </DataCard>

          <DataCard loading={loading}>
            <DataCard.Header icon={CheckSquare} title="Week to Date" />
            <DataCard.Value value={formatCurrency(summary.totals.week)} />
            <DataCard.Description>Current week deposits</DataCard.Description>
          </DataCard>

          <DataCard loading={loading}>
            <DataCard.Header icon={FileText} title="Month to Date" />
            <DataCard.Value value={formatCurrency(summary.totals.month)} trend="up" />
            <DataCard.Description>Monthly performance</DataCard.Description>
          </DataCard>

          <DataCard loading={loading}>
            <DataCard.Header icon={AlertCircle} title="Unallocated" />
            <DataCard.Value
              value={summary.totals.unallocated}
              trend={summary.totals.unallocated > 0 ? "down" : "neutral"}
            />
            <DataCard.Description>Pending reconciliation</DataCard.Description>
          </DataCard>
        </Grid>

        {/* Main Content Area - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border bg-card">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <h2 className="font-semibold">Recent Activity</h2>
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </div>
              <div className="divide-y">
                {summary.missedContributors.length > 0 ? (
                  summary.missedContributors.slice(0, 5).map((contributor, idx) => (
                    <div key={idx} className="px-5 py-3">
                      <p className="text-sm font-medium">{contributor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Missed contribution - Last seen{" "}
                        {new Date(contributor.lastContribution).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    All members are up to date
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Top Groups */}
          <Stack gap="md">
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-4">Top Groups</h3>
              <Stack gap="sm">
                {summary.topIkimina.slice(0, 5).map((ikimina, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{ikimina.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ikimina.memberCount} members
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(ikimina.totalDeposits)}
                    </span>
                  </div>
                ))}
              </Stack>
            </div>

            {/* Performance Card */}
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Performance</span>
              </div>
              <div className="text-2xl font-bold mb-1">
                {formatCurrency(summary.totals.month)}
              </div>
              <p className="text-sm text-muted-foreground">
                This month's total deposits
              </p>
            </div>
          </Stack>
        </div>
      </Stack>
    </Container>
  );
}
