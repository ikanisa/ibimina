import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useGeminiAI } from '@/hooks/use-gemini-ai';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Card, GlassCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/lib/format';

const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  },
};

function DashboardContent() {
  const { data, isLoading, refetch } = useDashboardData();
  const { sendMessage, isLoading: aiLoading } = useGeminiAI({
    systemPrompt: `You are analyzing SACCO dashboard data. Provide brief, actionable insights in 2-3 sentences.`,
  });
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debounced AI insight generation (only after data stabilizes)
  useEffect(() => {
    async function generateInsight() {
      if (!data || aiLoading) return;
      
      const prompt = `Analyze this SACCO data and provide one key insight:
        - Total collections today: ${formatCurrency(data.todayCollections)}
        - Active members: ${data.activeMembers}
        - Pending reconciliations: ${data.pendingRecons}
        - Collection trend: ${data.collectionTrend > 0 ? 'up' : 'down'} ${Math.abs(data.collectionTrend)}%
        
        What's the most important thing the staff should focus on?`;
      
      try {
        const insight = await sendMessage(prompt);
        setAiInsight(insight);
      } catch (error) {
        console.error('Failed to generate AI insight:', error);
      }
    }

    // Debounce: wait 2 seconds after data changes
    const timer = setTimeout(() => {
      generateInsight();
    }, 2000);

    return () => clearTimeout(timer);
  }, [data, sendMessage, aiLoading]);

  // Debounced refresh handler
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refetch();
      setLastRefresh(new Date());
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [refetch, isRefreshing]);

  // Memoize stats cards to prevent unnecessary recalculation
  const statsCards = useMemo(() => {
    if (!data) return [];
    
    return [
      {
        title: "Today's Collections",
        value: formatCurrency(data.todayCollections),
        change: data.collectionTrend,
        icon: CreditCard,
        color: 'primary' as const,
      },
      {
        title: 'Active Members',
        value: formatNumber(data.activeMembers),
        change: data.memberTrend,
        icon: Users,
        color: 'accent' as const,
      },
      {
        title: 'Pending Reconciliation',
        value: formatNumber(data.pendingRecons),
        change: -data.reconTrend,
        icon: Clock,
        color: (data.pendingRecons > 10 ? 'warning' : 'success') as const,
      },
      {
        title: 'Exceptions',
        value: formatNumber(data.exceptions),
        change: -data.exceptionTrend,
        icon: AlertTriangle,
        color: (data.exceptions > 5 ? 'danger' : 'success') as const,
      },
    ];
  }, [data]);

  // Memoize chart data to prevent re-renders
  const chartData = useMemo(() => ({
    collectionHistory: data?.collectionHistory || [],
    paymentStatus: data?.paymentStatus || [],
    recentActivity: data?.recentActivity || [],
    topIkimina: data?.topIkimina || [],
  }), [data]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      variants={ANIMATION_VARIANTS.container}
      initial="hidden"
      animate="show"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <motion.div variants={ANIMATION_VARIANTS.item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-muted">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-surface-overlay rounded-lg hover:bg-surface-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Refresh dashboard"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      {/* AI Insight Card */}
      {aiInsight && (
        <motion.div variants={ANIMATION_VARIANTS.item}>
          <GlassCard className="border-primary-500/20 bg-gradient-to-r from-primary-500/10 to-accent-500/10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-text-primary">AI Insight</h3>
                  {aiLoading && (
                    <Badge variant="pending" size="sm">Analyzing...</Badge>
                  )}
                </div>
                <p className="text-text-secondary">{aiInsight}</p>
              </div>
              <button className="text-primary-500 hover:text-primary-600 flex items-center gap-1 text-sm font-medium transition-colors">
                View Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div 
        variants={ANIMATION_VARIANTS.item}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statsCards.map((stat, index) => (
          <StatsCard key={stat.title} {...stat} delay={index * 0.1} />
        ))}
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Trend Chart */}
        <motion.div variants={ANIMATION_VARIANTS.item} className="lg:col-span-2">
          <Card>
            <Card.Header
              title="Collection Trend"
              description="Last 30 days"
              action={
                <select className="px-3 py-1 bg-surface-overlay rounded-lg text-sm">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              }
            />
            <Card.Content>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.collectionHistory}>
                    <defs>
                      <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="var(--color-text-muted)"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="var(--color-text-muted)"
                      fontSize={12}
                      tickFormatter={(value) => formatCurrency(value, { compact: true })}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border-default)',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Collections']}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="var(--color-primary-500)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCollections)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card.Content>
          </Card>
        </motion.div>

        {/* Payment Status Distribution */}
        <motion.div variants={ANIMATION_VARIANTS.item}>
          <Card className="h-full">
            <Card.Header
              title="Payment Status"
              description="Distribution by status"
            />
            <Card.Content>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.paymentStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.paymentStatus.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke="var(--color-surface-base)"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border-default)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {chartData.paymentStatus.map((status) => (
                  <div key={status.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: status.color }}
                      aria-hidden="true"
                    />
                    <span className="text-sm text-text-secondary">
                      {status.name}: {status.value}
                    </span>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity & Top Ikimina */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div variants={ANIMATION_VARIANTS.item}>
          <Card>
            <Card.Header
              title="Recent Activity"
              description="Latest transactions and events"
              action={
                <button className="text-primary-500 text-sm font-medium hover:underline">
                  View All
                </button>
              }
            />
            <Card.Content className="p-0">
              <div className="divide-y divide-border-default">
                {chartData.recentActivity.slice(0, 5).map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </Card.Content>
          </Card>
        </motion.div>

        {/* Top Ikimina Groups */}
        <motion.div variants={ANIMATION_VARIANTS.item}>
          <Card>
            <Card.Header
              title="Top Ikimina Groups"
              description="By collection this month"
            />
            <Card.Content>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData.topIkimina} 
                    layout="vertical"
                    margin={{ left: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                    <XAxis 
                      type="number" 
                      stroke="var(--color-text-muted)"
                      fontSize={12}
                      tickFormatter={(value) => formatCurrency(value, { compact: true })}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="var(--color-text-muted)"
                      fontSize={12}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border-default)',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Collections']}
                    />
                    <Bar 
                      dataKey="collections" 
                      fill="var(--color-accent-500)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Content>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Wrap in ErrorBoundary
export function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}

// Stats Card Component with React.memo for performance
interface StatsCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  delay?: number;
}

const StatsCard = React.memo(function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color, 
  delay = 0 
}: StatsCardProps) {
  const isPositive = change >= 0;
  
  const colorClasses = {
    primary: 'from-primary-500/20 to-primary-500/5 border-primary-500/20',
    accent: 'from-accent-500/20 to-accent-500/5 border-accent-500/20',
    success: 'from-green-500/20 to-green-500/5 border-green-500/20',
    warning: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20',
    danger: 'from-red-500/20 to-red-500/5 border-red-500/20',
  };

  const iconColors = {
    primary: 'text-primary-500',
    accent: 'text-accent-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={`bg-gradient-to-br ${colorClasses[color]} border`}>
        <Card.Content className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-muted">{title}</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
              <div 
                className={`flex items-center gap-1 mt-2 text-sm ${
                  isPositive ? 'text-green-500' : 'text-red-500'
                }`}
                role="status"
                aria-label={`${isPositive ? 'Increased' : 'Decreased'} by ${Math.abs(change)} percent`}
              >
                {isPositive ? (
                  <TrendingUp className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <TrendingDown className="w-4 h-4" aria-hidden="true" />
                )}
                <span>{Math.abs(change)}% vs last week</span>
              </div>
            </div>
            <div className={`p-3 rounded-xl bg-white/50 dark:bg-black/20 ${iconColors[color]}`}>
              <Icon className="w-6 h-6" aria-hidden="true" />
            </div>
          </div>
        </Card.Content>
      </Card>
    </motion.div>
  );
});

// Activity Item Component with React.memo
interface Activity {
  id: string;
  type: 'payment' | 'reconciliation' | 'member' | 'alert';
  title: string;
  description: string;
  timestamp: Date;
  status?: 'success' | 'pending' | 'error';
}

const ActivityItem = React.memo(function ActivityItem({ activity }: { activity: Activity }) {
  const iconMap = {
    payment: CreditCard,
    reconciliation: CheckCircle,
    member: Users,
    alert: AlertTriangle,
  };
  
  const Icon = iconMap[activity.type];
  
  const statusColors = {
    success: 'text-green-500',
    pending: 'text-yellow-500',
    error: 'text-red-500',
  };

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-surface-overlay transition-colors">
      <div className={`p-2 rounded-lg bg-surface-overlay ${
        activity.status ? statusColors[activity.status] : 'text-text-muted'
      }`}>
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">{activity.title}</p>
        <p className="text-sm text-text-muted truncate">{activity.description}</p>
      </div>
      <time className="text-xs text-text-muted whitespace-nowrap">
        {formatRelativeTime(activity.timestamp)}
      </time>
    </div>
  );
});

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-pulse" role="status" aria-label="Loading dashboard">
      <div className="h-8 w-48 bg-surface-overlay rounded" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-surface-overlay rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 h-96 bg-surface-overlay rounded-xl" />
        <div className="h-96 bg-surface-overlay rounded-xl" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}
