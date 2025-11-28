/**
 * Live Payment Feed Component
 * Real-time payment stream with animations
 */

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  payer_phone: string;
  payer_name: string;
  group_name: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export function LiveFeed() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    lastHour: 0,
    avgAmount: 0,
  });

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadRecentPayments();

    // Real-time subscription
    const channel = supabase
      .channel('payments')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'allocations'
      }, (payload) => {
        const newPayment = payload.new as Payment;
        setPayments(prev => [newPayment, ...prev.slice(0, 49)]);
        updateStats(newPayment);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const loadRecentPayments = async () => {
    const { data } = await supabase
      .from('allocations')
      .select(`
        id,
        amount,
        payer_phone,
        payer_name,
        status,
        created_at,
        groups (name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      const formatted = data.map(p => ({
        ...p,
        group_name: (p.groups as any)?.name || 'Unknown',
      })) as Payment[];
      setPayments(formatted);
      calculateStats(formatted);
    }
  };

  const calculateStats = (pmts: Payment[]) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentPayments = pmts.filter(p => 
      new Date(p.created_at) > oneHourAgo
    );

    setStats({
      total: pmts.length,
      lastHour: recentPayments.length,
      avgAmount: pmts.length > 0 
        ? Math.round(pmts.reduce((sum, p) => sum + p.amount, 0) / pmts.length)
        : 0,
    });
  };

  const updateStats = (newPayment: Payment) => {
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      lastHour: prev.lastHour + 1,
      avgAmount: Math.round((prev.avgAmount * prev.total + newPayment.amount) / (prev.total + 1)),
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-RW', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Live Payments
          </h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">
              {stats.lastHour}/hr
            </span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Avg Amount
          </p>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-1">
            {formatCurrency(stats.avgAmount)}
          </p>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
            Last Hour
          </p>
          <p className="text-lg font-bold text-green-900 dark:text-green-100 mt-1">
            {stats.lastHour}
          </p>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
            Total
          </p>
          <p className="text-lg font-bold text-purple-900 dark:text-purple-100 mt-1">
            {stats.total}
          </p>
        </div>
      </div>

      {/* Payment Feed */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        <AnimatePresence mode="popLayout">
          {payments.slice(0, 20).map((payment, index) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
                layout: { duration: 0.2 },
              }}
              className={`
                p-3 rounded-lg border backdrop-blur-sm
                ${payment.status === 'completed' 
                  ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                  : payment.status === 'failed'
                  ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                  : 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(payment.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {payment.payer_name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {payment.group_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(payment.created_at)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
