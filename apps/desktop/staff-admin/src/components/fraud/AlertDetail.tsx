/**
 * Alert Detail Modal
 */

import { motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

interface AlertDetailProps {
  alert: {
    id: string;
    type: string;
    description: string;
    confidence: number;
    suggested_action: string;
  } | null;
  onClose: () => void;
}

export function AlertDetail({ alert, onClose }: AlertDetailProps) {
  if (!alert) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="text-xl font-bold">Alert Details</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
            <p className="font-medium">{alert.type}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
            <p>{alert.description}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${alert.confidence * 100}%` }}
                />
              </div>
              <span className="text-sm">{Math.round(alert.confidence * 100)}%</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Suggested Action</p>
            <p>{alert.suggested_action}</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
              Resolve
            </button>
            <button className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
              Dismiss
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
