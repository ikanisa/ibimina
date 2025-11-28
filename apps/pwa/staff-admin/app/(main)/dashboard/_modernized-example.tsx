/**
 * MODERNIZED DASHBOARD EXAMPLE
 * 
 * This file demonstrates the new design system applied to the dashboard.
 * It showcases:
 * - Clean layout primitives (Container, Stack, Grid)
 * - DataCard compound components
 * - Responsive design with useResponsive
 * - AI-enhanced components (SmartInput, QuickActions)
 * - Smooth animations with Framer Motion
 * 
 * To use: Replace page.tsx content with this approach
 */

"use client";

import { motion } from "framer-motion";
import { 
  Briefcase, CheckSquare, FileText, TrendingUp, 
  ArrowRight, Plus, Sparkles, Users, DollarSign,
  Clock, AlertCircle
} from "lucide-react";
import { Container } from "@ibimina/ui/components/layout/Container";
import { Grid } from "@ibimina/ui/components/layout/Grid";
import { Stack } from "@ibimina/ui/components/layout/Stack";
import { DataCard } from "@ibimina/ui/components/DataCard";
import { Button } from "@ibimina/ui/components/button";
import { Badge } from "@ibimina/ui/components/badge";
import { EmptyState } from "@ibimina/ui/components/EmptyState";
import { AnimatedPage } from "@ibimina/ui/components/AnimatedPage";
import { useResponsive } from "@ibimina/ui/hooks/useResponsive";
import { staggerContainer, staggerItem } from "@ibimina/ui/lib/animations";

interface DashboardData {
  stats: {
    todaysDeposits: number;
    weeklyDeposits: number;
    monthlyDeposits: number;
    unallocated: number;
    activeMemberships: number;
    pendingTasks: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    amount?: number;
  }>;
  missedContributors: Array<{
    id: string;
    name: string;
    missedCount: number;
  }>;
  topIkimina: Array<{
    id: string;
    name: string;
    totalContributions: number;
    memberCount: number;
  }>;
}

interface ModernizedDashboardProps {
  data: DashboardData;
  userProfile: {
    firstName: string;
    role: string;
  };
  isLoading?: boolean;
}

export function ModernizedDashboard({ 
  data, 
  userProfile, 
  isLoading = false 
}: ModernizedDashboardProps) {
  const { isMobile } = useResponsive();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AnimatedPage>
      <Container size="xl" padding="lg">
        <Stack gap="lg">
          {/* Greeting - Personal & Contextual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8"
          >
            <h1 className="text-4xl font-bold mb-2">
              {getGreeting()}, {userProfile.firstName} 👋
            </h1>
            <p className="text-muted-foreground">
              You have{" "}
              <span className="text-foreground font-medium">
                {data.stats.pendingTasks} tasks
              </span>{" "}
              due today
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
              Create Ikimina
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              Import Members
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              Import Statement
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Ask AI
            </Button>
          </motion.div>

          {/* Stats Cards - Clean Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <Grid 
              cols={isMobile ? 2 : 4} 
              gap="md"
              responsive={{ sm: 2, md: 2, lg: 4 }}
            >
              <motion.div variants={staggerItem}>
                <DataCard loading={isLoading}>
                  <DataCard.Header 
                    icon={DollarSign} 
                    title="Today's Deposits" 
                  />
                  <DataCard.Value 
                    value={formatCurrency(data.stats.todaysDeposits)} 
                    trend="up" 
                  />
                  <DataCard.Description>
                    ↑ 12% from yesterday
                  </DataCard.Description>
                </DataCard>
              </motion.div>

              <motion.div variants={staggerItem}>
                <DataCard loading={isLoading}>
                  <DataCard.Header 
                    icon={TrendingUp} 
                    title="Week to Date" 
                  />
                  <DataCard.Value 
                    value={formatCurrency(data.stats.weeklyDeposits)} 
                    trend="up" 
                  />
                  <DataCard.Description>
                    ↑ 8% from last week
                  </DataCard.Description>
                </DataCard>
              </motion.div>

              <motion.div variants={staggerItem}>
                <DataCard loading={isLoading}>
                  <DataCard.Header 
                    icon={Briefcase} 
                    title="Month to Date" 
                  />
                  <DataCard.Value 
                    value={formatCurrency(data.stats.monthlyDeposits)} 
                    trend="up" 
                  />
                  <DataCard.Description>
                    ↑ 15% from last month
                  </DataCard.Description>
                </DataCard>
              </motion.div>

              <motion.div variants={staggerItem}>
                <DataCard loading={isLoading}>
                  <DataCard.Header 
                    icon={AlertCircle} 
                    title="Unallocated" 
                  />
                  <DataCard.Value 
                    value={data.stats.unallocated} 
                    trend="neutral" 
                  />
                  <DataCard.Description>
                    Pending reconciliation
                  </DataCard.Description>
                </DataCard>
              </motion.div>
            </Grid>
          </motion.div>

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
                  {data.recentActivity.length > 0 ? (
                    data.recentActivity.map((item) => (
                      <ActivityItem key={item.id} item={item} />
                    ))
                  ) : (
                    <EmptyState
                      icon={Clock}
                      title="No recent activity"
                      description="Activity will appear here as deposits and transactions are processed."
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Insights & Alerts */}
            <Stack gap="md">
              {/* Missed Contributors */}
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Missed Contributors
                </h3>
                <Stack gap="sm">
                  {data.missedContributors.slice(0, 5).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.missedCount} missed
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Contact
                      </Button>
                    </div>
                  ))}
                </Stack>
              </div>

              {/* Top Ikimina */}
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-4">Top Ikimina</h3>
                <Stack gap="sm">
                  {data.topIkimina.slice(0, 5).map((ikimina, index) => (
                    <div
                      key={ikimina.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {ikimina.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ikimina.memberCount} members
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {formatCurrency(ikimina.totalContributions)}
                        </p>
                      </div>
                    </div>
                  ))}
                </Stack>
              </div>

              {/* AI Insights Card */}
              <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">AI Insights</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Based on current patterns, you might want to follow up with
                  {data.missedContributors.length} members who have missed
                  recent contributions.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  View Recommendations
                </Button>
              </div>
            </Stack>
          </div>
        </Stack>
      </Container>
    </AnimatedPage>
  );
}

// Activity Item Component
function ActivityItem({ 
  item 
}: { 
  item: DashboardData["recentActivity"][0] 
}) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return DollarSign;
      case "task":
        return CheckSquare;
      case "member":
        return Users;
      default:
        return FileText;
    }
  };

  const Icon = getActivityIcon(item.type);

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{item.description}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(item.timestamp).toLocaleString()}
        </p>
      </div>
      {item.amount && (
        <div className="text-right">
          <p className="text-sm font-semibold">
            {new Intl.NumberFormat("en-RW", {
              style: "currency",
              currency: "RWF",
              maximumFractionDigits: 0,
            }).format(item.amount)}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * USAGE IN page.tsx:
 * 
 * import { ModernizedDashboard } from "./_modernized-example";
 * 
 * export default async function DashboardPage() {
 *   const { profile } = await requireUserAndProfile();
 *   const summary = await getDashboardSummary({ saccoId: profile.sacco_id });
 *   
 *   const dashboardData = {
 *     stats: {
 *       todaysDeposits: summary.totals.today,
 *       weeklyDeposits: summary.totals.week,
 *       monthlyDeposits: summary.totals.month,
 *       unallocated: summary.totals.unallocated,
 *       activeMemberships: summary.missedContributions.length,
 *       pendingTasks: 0,
 *     },
 *     recentActivity: [], // Map from your data
 *     missedContributors: summary.missedContributions,
 *     topIkimina: summary.topIkimina,
 *   };
 *   
 *   return (
 *     <ModernizedDashboard 
 *       data={dashboardData} 
 *       userProfile={profile} 
 *     />
 *   );
 * }
 */
