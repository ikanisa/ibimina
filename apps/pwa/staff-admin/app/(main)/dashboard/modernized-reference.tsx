"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  CheckSquare,
  FileText,
  TrendingUp,
  Plus,
  Sparkles,
  AlertCircle,
  Users,
} from "lucide-react";
import { Container } from "@ibimina/ui/components/layout";
import { Grid } from "@ibimina/ui/components/layout";
import { Stack } from "@ibimina/ui/components/layout";
import { DataCard } from "@ibimina/ui/components/DataCard";
import { Button } from "@ibimina/ui";
import { EmptyState } from "@ibimina/ui";
import { Badge } from "@ibimina/ui";

interface DashboardStats {
  engagements: number;
  openTasks: number;
  documents: number;
  completionRate: string;
}

interface Activity {
  id: string;
  type: "task" | "document" | "member";
  title: string;
  subtitle: string;
  timestamp: Date;
}

interface Deadline {
  id: string;
  title: string;
  dueDate: Date;
  priority: "high" | "medium" | "low";
}

/**
 * Modernized Dashboard Example
 * 
 * This is a reference implementation showing the new UI patterns:
 * - Clean layout with Container, Stack, Grid
 * - DataCard compound component with loading states
 * - Motion animations for page entry
 * - Responsive design
 * - AI insights section
 * - Consistent spacing and typography
 */
export default function ModernDashboard() {
  // In real app, fetch from API/Server Component
  const isLoading = false;
  const stats: DashboardStats = {
    engagements: 12,
    openTasks: 8,
    documents: 156,
    completionRate: "94",
  };

  const recentActivity: Activity[] = [
    {
      id: "1",
      type: "task",
      title: "Monthly Report Completed",
      subtitle: "Q4 2024 Financial Summary",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "2",
      type: "document",
      title: "New Member Application",
      subtitle: "John Doe - Pending Review",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: "3",
      type: "member",
      title: "Contribution Recorded",
      subtitle: "Jane Smith - RWF 50,000",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
  ];

  const deadlines: Deadline[] = [
    {
      id: "1",
      title: "Q4 Financial Review",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      priority: "high",
    },
    {
      id: "2",
      title: "Member Onboarding",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      priority: "medium",
    },
  ];

  return (
    <Container size="lg">
      <Stack gap="lg">
        {/* Greeting - Personal & Contextual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-8"
        >
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Good morning, Staff 👋
          </h1>
          <p className="text-muted-foreground">
            You have <span className="text-foreground font-medium">3 tasks</span> due today
          </p>
        </motion.div>

        {/* Quick Actions - AI Suggested */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 flex-wrap"
        >
          <Button variant="primary" size="md" className="gap-2">
            <Plus className="w-4 h-4" />
            New Task
          </Button>
          <Button variant="outline" size="md" className="gap-2">
            <FileText className="w-4 h-4" />
            Upload Document
          </Button>
          <Button variant="ghost" size="md" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Ask AI
          </Button>
        </motion.div>

        {/* Stats Cards - Clean Grid */}
        <Grid cols={4} gap="md">
          <DataCard loading={isLoading} onClick={() => console.log("Navigate to engagements")}>
            <DataCard.Header icon={Briefcase} title="Active Engagements" />
            <DataCard.Value value={stats.engagements} trend="up" />
            <DataCard.Description>2 new this month</DataCard.Description>
          </DataCard>

          <DataCard loading={isLoading} onClick={() => console.log("Navigate to tasks")}>
            <DataCard.Header icon={CheckSquare} title="Open Tasks" />
            <DataCard.Value value={stats.openTasks} />
            <DataCard.Description>8 due this week</DataCard.Description>
          </DataCard>

          <DataCard loading={isLoading} onClick={() => console.log("Navigate to documents")}>
            <DataCard.Header icon={FileText} title="Documents" />
            <DataCard.Value value={stats.documents} trend="up" />
            <DataCard.Description>15 pending review</DataCard.Description>
          </DataCard>

          <DataCard loading={isLoading} onClick={() => console.log("Navigate to analytics")}>
            <DataCard.Header icon={TrendingUp} title="Completion Rate" />
            <DataCard.Value value={`${stats.completionRate}%`} trend="up" />
            <DataCard.Description>↑ 3% from last week</DataCard.Description>
          </DataCard>
        </Grid>

        {/* Main Content Area - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-card">
              <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Recent Activity</h2>
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </div>
              <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {recentActivity.length > 0 ? (
                  recentActivity.map((item) => (
                    <ActivityItem key={item.id} activity={item} />
                  ))
                ) : (
                  <div className="p-8">
                    <EmptyState
                      icon={AlertCircle}
                      title="No recent activity"
                      description="Your recent actions will appear here"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Upcoming & AI Insights */}
          <Stack gap="md">
            {/* Upcoming Deadlines */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-card p-5">
              <h3 className="font-semibold mb-4 text-foreground">Upcoming Deadlines</h3>
              <Stack gap="sm">
                {deadlines.map((deadline) => (
                  <DeadlineItem key={deadline.id} deadline={deadline} />
                ))}
              </Stack>
            </div>

            {/* AI Insights Card */}
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">AI Insights</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Based on current workload, you might want to delegate the "Q4 Review" task to
                maintain your completion rate.
              </p>
              <Button variant="outline" size="sm" fullWidth>
                Review Suggestion
              </Button>
            </div>
          </Stack>
        </div>
      </Stack>
    </Container>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const iconMap = {
    task: CheckSquare,
    document: FileText,
    member: Users,
  };

  const Icon = iconMap[activity.type];

  return (
    <div className="px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{activity.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{activity.subtitle}</p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatTimeAgo(activity.timestamp)}
        </span>
      </div>
    </div>
  );
}

function DeadlineItem({ deadline }: { deadline: Deadline }) {
  const priorityColors = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
    low: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-primary/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">{deadline.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Due {formatDate(deadline.dueDate)}
        </p>
      </div>
      <span
        className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[deadline.priority]}`}
      >
        {deadline.priority}
      </span>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "today";
  if (date.toDateString() === tomorrow.toDateString()) return "tomorrow";

  const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return `in ${diffDays} days`;

  return date.toLocaleDateString();
}
