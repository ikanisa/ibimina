'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
import { useAI } from '@/contexts/AIContext';

export default function AnalyticsPage() {
  const { geminiApiKey, isFeatureEnabled } = useAI();
  const [selectedView, setSelectedView] = useState<'overview' | 'geographic' | 'performance'>('overview');
  const [livePayments, setLivePayments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    paymentsPerMin: 0,
    totalHour: 0,
    successRate: 0,
    avgProcessing: 0,
  });

  const hourlyData = [
    { hour: '00:00', amount: 12000, count: 4 },
    { hour: '03:00', amount: 8000, count: 2 },
    { hour: '06:00', amount: 25000, count: 7 },
    { hour: '09:00', amount: 145000, count: 34 },
    { hour: '12:00', amount: 198000, count: 45 },
    { hour: '15:00', amount: 167000, count: 38 },
    { hour: '18:00', amount: 89000, count: 21 },
    { hour: '21:00', amount: 34000, count: 9 },
  ];

  const ikiminaData = [
    { name: 'Abakundakazi', value: 2450000, members: 45 },
    { name: 'Twiyubake', value: 1890000, members: 38 },
    { name: 'Terimbere', value: 1650000, members: 32 },
    { name: 'Umucyo', value: 1200000, members: 28 },
  ];

  const geographicData = [
    { district: 'Nyamagabe', amount: 3890000, members: 142 },
    { district: 'Huye', amount: 2340000, members: 89 },
    { district: 'Nyanza', amount: 1950000, members: 76 },
  ];

  useEffect(() => {
    // Simulate live payments
    const interval = setInterval(() => {
      const newPayment = {
        id: Math.random().toString(),
        amount: Math.floor(Math.random() * 50000) + 5000,
        memberName: ['Jean Bosco', 'Marie Claire', 'Pierre Nkurunziza'][Math.floor(Math.random() * 3)],
        ikiminaName: ikiminaData[Math.floor(Math.random() * ikiminaData.length)].name,
        timestamp: new Date(),
        status: Math.random() > 0.1 ? 'completed' : 'pending',
      };

      setLivePayments(prev => [newPayment, ...prev.slice(0, 19)]);
      setStats(prev => ({
        ...prev,
        paymentsPerMin: prev.paymentsPerMin + 1,
        totalHour: prev.totalHour + newPayment.amount,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-surface-base p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <Activity className="w-8 h-8 text-primary-500" />
              Real-Time Analytics
            </h1>
            <p className="text-text-muted mt-1">
              Live data streaming and insights
            </p>
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
                    : 'bg-surface-elevated hover:bg-surface-subtle text-text-primary'
                }`}
              >
                <view.icon className="w-4 h-4" />
                {view.label}
              </button>
            ))}
          </div>
        </div>

        {!isFeatureEnabled('analytics') && (
          <div className="bg-info-500/10 border border-info-500/20 rounded-lg p-4 text-info-500">
            Real-time analytics is not enabled. Enable it in settings to see live data.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <LiveStatCard
            title="Payments/Min"
            value={(stats.paymentsPerMin / 60).toFixed(1)}
            icon={Activity}
            color="primary"
            animated
          />
          <LiveStatCard
            title="Total (1hr)"
            value={formatCurrency(stats.totalHour)}
            icon={DollarSign}
            color="accent"
          />
          <LiveStatCard
            title="Success Rate"
            value="96.8%"
            icon={CheckCircle}
            color="success"
          />
          <LiveStatCard
            title="Avg Processing"
            value="243ms"
            icon={Clock}
            color="info"
          />
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Live payment feed */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-surface-elevated rounded-xl border border-border-default p-4 h-full">
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Payments
              </h3>
              <div className="space-y-2 max-h-[600px] overflow-auto">
                <AnimatePresence mode="popLayout">
                  {livePayments.slice(0, 10).map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        payment.status === 'completed' ? 'bg-success-500/10' : 'bg-warning-500/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          payment.status === 'completed' ? 'bg-success-500' : 'bg-warning-500'
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
            </div>
          </div>

          {/* Main chart */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-surface-elevated rounded-xl border border-border-default p-6">
              <h3 className="font-semibold text-text-primary mb-4">
                {selectedView === 'overview' && 'Hourly Transaction Trend'}
                {selectedView === 'geographic' && 'Geographic Distribution'}
                {selectedView === 'performance' && 'Ikimina Performance'}
              </h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  {selectedView === 'overview' && (
                    <AreaChart data={hourlyData}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgb(99, 102, 241)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="rgb(99, 102, 241)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="hour" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="rgb(99, 102, 241)"
                        fill="url(#colorAmount)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  )}
                  {selectedView === 'geographic' && (
                    <BarChart data={geographicData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="district" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB',
                        }}
                      />
                      <Bar dataKey="amount" fill="rgb(59, 130, 246)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  )}
                  {selectedView === 'performance' && (
                    <BarChart data={ikiminaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="value" fill="rgb(16, 185, 129)" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="members" fill="rgb(251, 146, 60)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Ikimina cards */}
        {selectedView === 'performance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ikiminaData.map((ikimina) => (
              <motion.div
                key={ikimina.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-elevated rounded-lg border border-border-default p-6"
              >
                <p className="text-sm text-text-muted">Ikimina</p>
                <p className="text-lg font-bold text-text-primary mt-1">{ikimina.name}</p>
                <div className="mt-4 space-y-2">
                  <div>
                    <p className="text-xs text-text-muted">Total Contributions</p>
                    <p className="text-xl font-semibold text-primary-500">
                      {formatCurrency(ikimina.value)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Active Members</p>
                    <p className="text-lg font-medium text-text-primary">{ikimina.members}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveStatCard({ title, value, icon: Icon, color, animated }: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  animated?: boolean;
}) {
  const colors: Record<string, string> = {
    primary: 'text-primary-500 bg-primary-500/10',
    accent: 'text-accent-500 bg-accent-500/10',
    success: 'text-success-500 bg-success-500/10',
    info: 'text-info-500 bg-info-500/10',
  };

  return (
    <div className="bg-surface-elevated rounded-lg border border-border-default p-6">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3 ${
        animated ? 'animate-pulse' : ''
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm text-text-muted mt-1">{title}</p>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
