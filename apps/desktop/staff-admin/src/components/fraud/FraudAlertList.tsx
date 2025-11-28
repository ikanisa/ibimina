/**
 * Fraud Alert List Component
 * Real-time fraud alert dashboard with filtering
 */

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Filter, RefreshCw, AlertTriangle } from 'lucide-react';
import { AlertCard } from './AlertCard';
import { fraudDetection } from '@/lib/ai';

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type StatusFilter = 'all' | 'pending' | 'reviewed' | 'dismissed';

interface Alert {
  id: string;
  transaction_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  confidence: number;
  suggested_action: string;
  related_transactions: string[];
  created_at: string;
  status: 'pending' | 'reviewed' | 'dismissed';
}

export function FraudAlertList() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  );

  // Load alerts
  useEffect(() => {
    loadAlerts();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('fraud_alerts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fraud_alerts'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAlerts(prev => [payload.new as Alert, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setAlerts(prev => prev.map(a => 
            a.id === payload.new.id ? payload.new as Alert : a
          ));
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await fraudDetection.getPendingAlerts(100);
      setAlerts(data as Alert[]);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: string, status: 'reviewed' | 'dismissed') => {
    try {
      await fraudDetection.reviewAlert(id, status);
      setAlerts(prev => prev.map(a => 
        a.id === id ? { ...a, status } : a
      ));
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    // Severity filter
    if (severityFilter !== 'all' && alert.severity !== severityFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && alert.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        alert.description.toLowerCase().includes(searchLower) ||
        alert.type.toLowerCase().includes(searchLower) ||
        alert.transaction_id.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Stats
  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    pending: alerts.filter(a => a.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fraud Alerts
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {stats.pending} pending • {stats.critical + stats.high} high priority
          </p>
        </div>
        <button
          onClick={loadAlerts}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400 mt-1">
                {stats.critical}
              </p>
            </div>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400">High</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-400 mt-1">
                {stats.high}
              </p>
            </div>
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Pending</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                {stats.pending}
              </p>
            </div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Severity Filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
          className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {/* Alert List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No alerts found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onClick={() => setSelectedAlert(alert)}
              onReview={handleReview}
            />
          ))}
        </div>
      )}
    </div>
  );
}
