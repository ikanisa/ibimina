"use client";

import { motion } from 'framer-motion';
import { Briefcase, CheckSquare, FileText, TrendingUp, ArrowRight, Plus } from 'lucide-react';
import { Container, Grid, Stack, DataCard, Button } from '@ibimina/ui';

export default function ModernDashboard() {
  const stats = {
    members: 1250,
    savings: '5.2M',
    loans: 45,
    completionRate: '94%',
  };

  const isLoading = false;

  return (
    <Container size="lg">
      <Stack gap="lg">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-8"
        >
          <h1 className="text-3xl font-bold mb-2">Good morning 👋</h1>
          <p className="text-muted-foreground">
            You have <span className="text-foreground font-medium">5 pending tasks</span> today
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
            <FileText className="w-4 h-4" />
            Approve Loan
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            View Reports
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <Grid cols={4} gap="md">
          <DataCard loading={isLoading}>
            <DataCard.Header icon={Briefcase} title="Total Members" />
            <DataCard.Value value={stats.members} trend="up" />
            <DataCard.Description>125 new this month</DataCard.Description>
          </DataCard>

          <DataCard loading={isLoading}>
            <DataCard.Header icon={FileText} title="Total Savings" />
            <DataCard.Value value={stats.savings} suffix="RWF" trend="up" />
            <DataCard.Description>↑ 12% from last month</DataCard.Description>
          </DataCard>

          <DataCard loading={isLoading}>
            <DataCard.Header icon={CheckSquare} title="Active Loans" />
            <DataCard.Value value={stats.loans} />
            <DataCard.Description>8 pending approval</DataCard.Description>
          </DataCard>

          <DataCard loading={isLoading}>
            <DataCard.Header icon={TrendingUp} title="Collection Rate" />
            <DataCard.Value value={stats.completionRate} trend="up" />
            <DataCard.Description>↑ 3% from last week</DataCard.Description>
          </DataCard>
        </Grid>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border bg-card">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <h2 className="font-semibold">Recent Activity</h2>
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </div>
              <div className="p-5">
                <Stack gap="md">
                  <ActivityItem
                    title="New member registered"
                    description="John Doe joined today"
                    time="5 min ago"
                  />
                  <ActivityItem
                    title="Loan approved"
                    description="Loan #1234 for 500,000 RWF approved"
                    time="1 hour ago"
                  />
                  <ActivityItem
                    title="Savings deposited"
                    description="Member #456 deposited 50,000 RWF"
                    time="2 hours ago"
                  />
                </Stack>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <Stack gap="md">
            {/* Upcoming Tasks */}
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-4">Pending Tasks</h3>
              <Stack gap="sm">
                <TaskItem title="Approve 3 loan applications" priority="high" />
                <TaskItem title="Review member documents" priority="medium" />
                <TaskItem title="Generate monthly report" priority="low" />
              </Stack>
            </div>

            {/* Quick Stats */}
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5">
              <h3 className="font-semibold mb-3">This Month</h3>
              <Stack gap="sm">
                <StatRow label="New Members" value="125" />
                <StatRow label="Loan Disbursed" value="12.5M RWF" />
                <StatRow label="Collections" value="8.2M RWF" />
              </Stack>
            </div>
          </Stack>
        </div>
      </Stack>
    </Container>
  );
}

function ActivityItem({
  title,
  description,
  time,
}: {
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground">{time}</span>
    </div>
  );
}

function TaskItem({ title, priority }: { title: string; priority: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
      <div className={`w-1.5 h-1.5 rounded-full ${colors[priority]}`} />
      <span className="text-sm flex-1">{title}</span>
      <ArrowRight className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
