import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  DollarSign,
  Clock,
  CheckCircle,
  Zap,
  Globe,
  BarChart3,
} from 'lucide-react';
import { useRealtimeSubscription } from '@/hooks/use-realtime';
import { useGeminiAI } from '@/hooks/ai/use-gemini-ai';
import { formatCurrency, formatNumber } from '@/lib/format';

interface Payment {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  memberName: string;
  ikiminaName: string;
  district: string;
}

interface AnalyticsData {
  livePayments: Payment[];
  hourlyTrend: { hour: string; amount: number; count: number }[];
  ikiminaDistribution: { name: string; value: number; members: number }[];
  performanceMetrics: {
    avgProcessingTime: number;
    successRate: number;
    errorRate: number;
    peakHour: string;
  };
}

interface LiveStatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'primary' | 'accent' | 'success' | 'info';
  animated?: boolean;
}

function LiveStatCard({ title, value, icon: Icon, color, animated }: LiveStatCardProps) {
  const colorClasses = {
    primary: 'bg-primary-500/10 text-primary-500',
    accent: 'bg-accent-500/10 text-accent-500',
    success: 'bg-success-500/10 text-success-500',
    info: 'bg-info-500/10 text-info-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-elevated border border-border-default rounded-xl p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {animated && (
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        )}
      </div>
      <p className="text-2xl font-bold text-text-primary mb-1">{value}</p>
      <p className="text-sm text-text-muted">{title}</p>
    </motion.div>
  );
}

export function RealTimeAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    livePayments: [],
    hourlyTrend: [],
    ikiminaDistribution: [],
    performanceMetrics: {
      avgProcessingTime: 0,
      successRate: 0,
      errorRate: 0,
      peakHour: '00:00',
    },
  });
  const [selectedView, setSelectedView] = useState<'overview' | 'geographic' | 'performance'>('overview');
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const { streamMessage } = useGeminiAI();

  // Real-time payment subscription
  const { data: livePayments } = useRealtimeSubscription<Payment[]>({
    table: 'payments',
    filter: `created_at=gte.${new Date(Date.now() - 3600000).toISOString()}`,
    onUpdate: (payload) => {
      setData(prev => ({
        ...prev,
        livePayments: [payload.new as Payment, ...prev.livePayments.slice(0, 49)],
      }));
    },
  });

  // Update data when live payments change
  useEffect(() => {
    if (livePayments) {
      setData(prev => ({ ...prev, livePayments }));
    }
  }, [livePayments]);

  // Generate AI insights
  useEffect(() => {
    if (data.livePayments.length === 0) return;

    const generateInsights = async () => {
      const prompt = `Analyze this SACCO real-time data and provide 3 actionable insights:
        - Total payments last hour: ${data.livePayments.length}
        - Total amount: ${data.livePayments.reduce((sum, p) => sum + p.amount, 0)} RWF
        - Success rate: ${data.performanceMetrics.successRate}%
        
        Return JSON array: [{"description": "string"}]`;

      try {
        await streamMessage(prompt, (chunk) => {
          try {
            const insights = JSON.parse(chunk);
            setAiInsights(insights.map((i: any) => i.description));
          } catch {
            // Still streaming
          }
        });
      } catch (error) {
        console.error('Failed to generate insights:', error);
      }
    };

    const timeout = setTimeout(generateInsights, 5000);
    return () => clearTimeout(timeout);
  }, [data, streamMessage]);

  // Animated live payment feed
  const LivePaymentFeed = useMemo(() => (
    <div className="space-y-2 max-h-80 overflow-auto">
      <AnimatePresence mode="popLayout">
        {data.livePayments.slice(0, 10).map((payment, index) => (
          <motion.div
            key={payment.id}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`flex items-center justify-between p-3 rounded-lg ${
              payment.status === 'completed' ? 'bg-success-500/10' :
              payment.status === 'failed' ? 'bg-error-500/10' :
              'bg-warning-500/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                payment.status === 'completed' ? 'bg-success-500' :
                payment.status === 'failed' ? 'bg-error-500' :
                'bg-warning-500'
              }`} />
              <div>
                <p className="font-medium text-sm">{payment.memberName}</p>
                <p className="text-xs text-text-muted">{payment.ikiminaName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatCurrency(payment.amount)}</p>
              <p className="text-xs text-text-muted">
                {new Date(payment.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  ), [data.livePayments]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary-500" />
            Real-Time Analytics
          </h1>
          <p className="text-text-muted">Live data streaming</p>
        </div>

        <div className="flex gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'geographic', label: 'Geographic', icon: Globe },
            { id: 'performance', label: 'Performance', icon: Zap },
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setSelectedView(view.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                selectedView === view.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-elevated hover:bg-surface-subtle'
              }`}
            >
              <view.icon className="w-4 h-4" />
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-text-primary">AI Insights</h3>
              <ul className="mt-2 space-y-1">
                {aiInsights.map((insight, i) => (
                  <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                    <span className="text-primary-500">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Live Stats */}
      <div className="grid grid-cols-4 gap-4">
        <LiveStatCard
          title="Payments/Min"
          value={data.livePayments.filter(p => 
            new Date(p.timestamp) > new Date(Date.now() - 60000)
          ).length}
          icon={Activity}
          color="primary"
          animated
        />
        <LiveStatCard
          title="Total (1hr)"
          value={formatCurrency(
            data.livePayments.reduce((sum, p) => sum + p.amount, 0)
          )}
          icon={DollarSign}
          color="accent"
        />
        <LiveStatCard
          title="Success Rate"
          value={`${data.performanceMetrics.successRate}%`}
          icon={CheckCircle}
          color="success"
        />
        <LiveStatCard
          title="Avg Processing"
          value={`${data.performanceMetrics.avgProcessingTime}ms`}
          icon={Clock}
          color="info"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Live Payment Feed */}
        <div className="col-span-4">
          <div className="bg-surface-elevated rounded-xl border border-border-default p-4">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live Payments
            </h3>
            {LivePaymentFeed}
          </div>
        </div>

        {/* Hourly Trend Chart */}
        <div className="col-span-8">
          <div className="bg-surface-elevated rounded-xl border border-border-default p-4">
            <h3 className="font-semibold text-text-primary mb-4">Hourly Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.hourlyTrend}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                  <XAxis dataKey="hour" stroke="var(--color-text-muted)" />
                  <YAxis stroke="var(--color-text-muted)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border-default)',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--color-primary-500)"
                    fill="url(#colorAmount)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
