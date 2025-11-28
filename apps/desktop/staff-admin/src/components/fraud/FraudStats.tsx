/**
 * Fraud Stats Dashboard
 */

import { TrendingUp, AlertTriangle, Shield, Activity } from 'lucide-react';

interface FraudStatsProps {
  stats: {
    total: number;
    critical: number;
    resolved: number;
    rate: number;
  };
}

export function FraudStats({ stats }: FraudStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard icon={AlertTriangle} label="Total Alerts" value={stats.total} color="blue" />
      <StatCard icon={Shield} label="Critical" value={stats.critical} color="red" />
      <StatCard icon={Activity} label="Resolved" value={stats.resolved} color="green" />
      <StatCard icon={TrendingUp} label="Success Rate" value={`${stats.rate}%`} color="purple" />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className={`w-8 h-8 text-${color}-500`} />
      </div>
    </div>
  );
}
