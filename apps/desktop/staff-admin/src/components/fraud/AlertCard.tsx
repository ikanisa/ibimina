/**
 * Alert Card Component
 * Individual fraud alert card with severity indicator
 */

import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Eye, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import type { FraudAlert } from '@/lib/ai';

interface AlertCardProps {
  alert: {
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
  };
  onClick?: () => void;
  onReview?: (id: string, status: 'reviewed' | 'dismissed') => void;
}

export function AlertCard({ alert, onClick, onReview }: AlertCardProps) {
  const severityConfig = {
    critical: {
      color: 'red',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      dot: 'bg-red-500',
    },
    high: {
      color: 'orange',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-400',
      dot: 'bg-orange-500',
    },
    medium: {
      color: 'yellow',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-400',
      dot: 'bg-yellow-500',
    },
    low: {
      color: 'green',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      dot: 'bg-green-500',
    },
  };

  const config = severityConfig[alert.severity];

  return (
    <div
      className={`
        relative group cursor-pointer
        bg-white dark:bg-gray-900 rounded-xl border-l-4
        ${config.border}
        shadow-sm hover:shadow-md transition-all duration-200
        hover:scale-[1.01]
      `}
      onClick={onClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Severity Indicator */}
            <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
            
            {/* Severity & Type */}
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold uppercase ${config.text}`}>
                  {alert.severity}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {alert.type.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {alert.status !== 'pending' && (
            <span className={`
              px-2 py-1 text-xs font-medium rounded-full
              ${alert.status === 'reviewed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}
            `}>
              {alert.status === 'reviewed' ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Reviewed
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  Dismissed
                </span>
              )}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          {alert.description}
        </p>

        {/* Transaction ID */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Transaction:
          </span>
          <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {alert.transaction_id.slice(0, 8)}...
          </code>
        </div>

        {/* Confidence Meter */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Confidence
            </span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              {Math.round(alert.confidence * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${config.dot}`}
              style={{ width: `${alert.confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          {/* Suggested Action */}
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{alert.suggested_action.slice(0, 40)}...</span>
          </div>

          {/* Related Count */}
          {alert.related_transactions.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{alert.related_transactions.length} related
            </span>
          )}

          {/* View Details */}
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </div>

      {/* Quick Actions (shown on hover for pending alerts) */}
      {alert.status === 'pending' && (
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReview?.(alert.id, 'reviewed');
              }}
              className="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="w-3 h-3 inline mr-1" />
              Review
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReview?.(alert.id, 'dismissed');
              }}
              className="flex-1 px-3 py-1.5 text-xs font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <XCircle className="w-3 h-3 inline mr-1" />
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
