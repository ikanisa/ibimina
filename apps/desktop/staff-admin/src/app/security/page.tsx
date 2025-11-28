'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FraudDetectionEngine } from '@/lib/ai/fraud-detection';
import { useAI } from '@/contexts/AIContext';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Activity } from 'lucide-react';

export default function SecurityPage() {
  const { geminiApiKey, isFeatureEnabled } = useAI();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalScanned: 0,
    flagged: 0,
    resolved: 0,
    critical: 0,
  });

  useEffect(() => {
    // Mock data - in production, fetch from Supabase
    if (isFeatureEnabled('fraudDetection')) {
      const mockAlerts = [
        {
          id: '1',
          severity: 'high',
          type: 'duplicate_payment',
          description: 'Possible duplicate payment. Same amount (5000 RWF) from same phone within 5 minutes.',
          confidence: 0.9,
          timestamp: new Date(),
          status: 'pending',
        },
        {
          id: '2',
          severity: 'medium',
          type: 'unusual_amount',
          description: 'Amount 150000 RWF deviates significantly from member\'s typical range',
          confidence: 0.75,
          timestamp: new Date(Date.now() - 3600000),
          status: 'investigating',
        },
      ];
      setAlerts(mockAlerts);
      setStats({
        totalScanned: 1247,
        flagged: 23,
        resolved: 19,
        critical: 2,
      });
    }
  }, [isFeatureEnabled]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-error-500 bg-error-500/10 border-error-500/20';
      case 'high': return 'text-error-500 bg-error-500/10 border-error-500/20';
      case 'medium': return 'text-warning-500 bg-warning-500/10 border-warning-500/20';
      case 'low': return 'text-info-500 bg-info-500/10 border-info-500/20';
      default: return 'text-text-muted bg-surface-subtle border-border-default';
    }
  };

  return (
    <div className="min-h-screen bg-surface-base p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary-500" />
              Fraud Detection
            </h1>
            <p className="text-text-muted mt-1">
              AI-powered transaction monitoring and fraud prevention
            </p>
          </div>
        </div>

        {!isFeatureEnabled('fraudDetection') && (
          <div className="bg-warning-500/10 border border-warning-500/20 rounded-lg p-4 text-warning-500">
            Fraud detection is not enabled. Enable it in settings to monitor transactions.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Activity className="w-5 h-5" />}
            label="Transactions Scanned"
            value={stats.totalScanned.toLocaleString()}
            color="primary"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Flagged"
            value={stats.flagged.toString()}
            color="warning"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Resolved"
            value={stats.resolved.toString()}
            color="success"
          />
          <StatCard
            icon={<Shield className="w-5 h-5" />}
            label="Critical Alerts"
            value={stats.critical.toString()}
            color="error"
          />
        </div>

        <div className="bg-surface-elevated rounded-xl border border-border-default">
          <div className="px-6 py-4 border-b border-border-default">
            <h2 className="text-lg font-semibold text-text-primary">Active Alerts</h2>
          </div>
          
          <div className="divide-y divide-border-default">
            <AnimatePresence>
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`p-6 ${getSeverityColor(alert.severity)} border-l-4`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-semibold uppercase text-sm">
                          {alert.severity} - {alert.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-text-primary mb-3">{alert.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>Confidence: {Math.round(alert.confidence * 100)}%</span>
                        </div>
                        <div>
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          alert.status === 'pending' ? 'bg-warning-500/20 text-warning-500' :
                          alert.status === 'investigating' ? 'bg-info-500/20 text-info-500' :
                          'bg-success-500/20 text-success-500'
                        }`}>
                          {alert.status}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button className="px-4 py-2 bg-surface-base hover:bg-surface-subtle rounded-lg text-sm font-medium transition-colors">
                        Investigate
                      </button>
                      <button className="px-4 py-2 bg-success-500 hover:bg-success-600 text-white rounded-lg text-sm font-medium transition-colors">
                        Resolve
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {alerts.length === 0 && (
              <div className="p-12 text-center text-text-muted">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success-500" />
                <p className="text-lg font-medium">No active alerts</p>
                <p className="text-sm mt-1">All transactions are clean</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    primary: 'text-primary-500 bg-primary-500/10',
    warning: 'text-warning-500 bg-warning-500/10',
    success: 'text-success-500 bg-success-500/10',
    error: 'text-error-500 bg-error-500/10',
  };

  return (
    <div className="bg-surface-elevated rounded-lg border border-border-default p-6">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm text-text-muted mt-1">{label}</p>
    </div>
  );
}
