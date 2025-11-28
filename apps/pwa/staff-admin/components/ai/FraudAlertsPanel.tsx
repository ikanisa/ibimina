import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  X, 
  ChevronRight,
  Clock,
  DollarSign,
  User,
  Phone,
  AlertOctagon,
} from 'lucide-react';
import { useFraudDetection } from '@/hooks/ai/use-fraud-detection';
import { formatCurrency, formatRelativeTime } from '@/lib/format';

interface FraudAlertsPanelProps {
  transactionId?: string;
  onAlertClick?: (alert: FraudAlert) => void;
  className?: string;
}

interface FraudAlert {
  id: string;
  transactionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  confidence: number;
  suggestedAction: string;
  relatedTransactions: string[];
  timestamp?: Date;
}

export function FraudAlertsPanel({
  transactionId,
  onAlertClick,
  className = '',
}: FraudAlertsPanelProps) {
  const { alerts, dismissAlert, isAnalyzing } = useFraudDetection(transactionId);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity === filter);

  const severityConfig = {
    critical: {
      color: 'bg-error-500',
      textColor: 'text-error-600',
      bgColor: 'bg-error-500/10',
      borderColor: 'border-error-500/20',
      icon: AlertOctagon,
    },
    high: {
      color: 'bg-warning-500',
      textColor: 'text-warning-600',
      bgColor: 'bg-warning-500/10',
      borderColor: 'border-warning-500/20',
      icon: AlertTriangle,
    },
    medium: {
      color: 'bg-info-500',
      textColor: 'text-info-600',
      bgColor: 'bg-info-500/10',
      borderColor: 'border-info-500/20',
      icon: Shield,
    },
    low: {
      color: 'bg-text-muted',
      textColor: 'text-text-muted',
      bgColor: 'bg-surface-subtle',
      borderColor: 'border-border-default',
      icon: Shield,
    },
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'duplicate_payment':
      case 'velocity_anomaly':
        return Clock;
      case 'unusual_amount':
        return DollarSign;
      case 'phone_mismatch':
        return Phone;
      case 'identity_mismatch':
        return User;
      default:
        return AlertTriangle;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-error-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-error-500" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Fraud Detection</h3>
            <p className="text-sm text-text-muted">
              {filteredAlerts.length} active alert{filteredAlerts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {isAnalyzing && (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            Analyzing...
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map(severity => {
          const count = severity === 'all' 
            ? alerts.length 
            : alerts.filter(a => a.severity === severity).length;
          
          return (
            <button
              key={severity}
              onClick={() => setFilter(severity)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                ${filter === severity 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-surface-elevated border border-border-default text-text-secondary hover:bg-surface-subtle'
                }
              `}
            >
              <span className="capitalize">{severity}</span>
              {count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alerts List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Shield className="w-12 h-12 mx-auto text-success-500 mb-3" />
              <p className="text-text-muted">No alerts detected</p>
              <p className="text-sm text-text-muted mt-1">All transactions are looking good!</p>
            </motion.div>
          ) : (
            filteredAlerts.map((alert, index) => {
              const config = severityConfig[alert.severity];
              const TypeIcon = getAlertTypeIcon(alert.type);
              
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    ${config.bgColor} border ${config.borderColor} rounded-lg p-4 
                    cursor-pointer hover:shadow-md transition-all
                  `}
                  onClick={() => {
                    setSelectedAlert(alert);
                    onAlertClick?.(alert);
                  }}
                >
                  {/* Alert Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                        <TypeIcon className={`w-4 h-4 ${config.textColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold uppercase ${config.textColor}`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-text-muted">•</span>
                          <span className="text-xs text-text-muted capitalize">
                            {alert.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-text-primary font-medium">
                          {alert.description}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissAlert(alert.id);
                      }}
                      className="p-1 hover:bg-surface-subtle rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-text-muted" />
                    </button>
                  </div>

                  {/* Confidence Badge */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 bg-surface-elevated rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${alert.confidence * 100}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`h-full ${config.color}`}
                      />
                    </div>
                    <span className="text-xs text-text-muted font-medium">
                      {Math.round(alert.confidence * 100)}% confidence
                    </span>
                  </div>

                  {/* Suggested Action */}
                  <div className="bg-surface-elevated rounded-lg p-3 mb-3">
                    <p className="text-xs text-text-muted mb-1">Suggested Action</p>
                    <p className="text-sm text-text-primary">{alert.suggestedAction}</p>
                  </div>

                  {/* Related Transactions */}
                  {alert.relatedTransactions.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <TrendingUp className="w-3 h-3" />
                      {alert.relatedTransactions.length} related transaction{alert.relatedTransactions.length !== 1 ? 's' : ''}
                    </div>
                  )}

                  {/* Timestamp */}
                  {alert.timestamp && (
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-2 pt-2 border-t border-border-default">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(alert.timestamp)}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAlert(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-elevated rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                      Alert Details
                    </h3>
                    <p className="text-sm text-text-muted">Transaction ID: {selectedAlert.transactionId}</p>
                  </div>
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="p-2 hover:bg-surface-subtle rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-text-muted" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Full details would go here */}
                  <div className="bg-surface-subtle rounded-lg p-4">
                    <p className="text-sm text-text-primary">{selectedAlert.description}</p>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                      Take Action
                    </button>
                    <button
                      onClick={() => {
                        dismissAlert(selectedAlert.id);
                        setSelectedAlert(null);
                      }}
                      className="px-4 py-2 border border-border-default rounded-lg hover:bg-surface-subtle transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
