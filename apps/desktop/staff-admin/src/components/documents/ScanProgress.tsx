/**
 * Scan Progress Component
 * Visual progress indicator for document scanning
 */

import { motion } from 'framer-motion';
import { FileImage, Loader, CheckCircle, XCircle } from 'lucide-react';

interface ScanProgressProps {
  progress: number;
  status: 'scanning' | 'processing' | 'complete' | 'error';
  fileName?: string;
  message?: string;
}

export function ScanProgress({ progress, status, fileName, message }: ScanProgressProps) {
  const statusConfig = {
    scanning: {
      icon: Loader,
      color: 'blue',
      label: 'Scanning document...',
    },
    processing: {
      icon: FileImage,
      color: 'purple',
      label: 'Processing with AI...',
    },
    complete: {
      icon: CheckCircle,
      color: 'green',
      label: 'Scan complete!',
    },
    error: {
      icon: XCircle,
      color: 'red',
      label: 'Scan failed',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className={`p-4 rounded-full bg-${config.color}-100 dark:bg-${config.color}-900/30`}>
          <Icon
            className={`w-8 h-8 text-${config.color}-500 ${
              status === 'scanning' || status === 'processing' ? 'animate-spin' : ''
            }`}
          />
        </div>
      </div>

      {/* Label */}
      <p className="text-center font-semibold text-gray-900 dark:text-white mb-2">
        {config.label}
      </p>

      {/* File Name */}
      {fileName && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">
          {fileName}
        </p>
      )}

      {/* Progress Bar */}
      {(status === 'scanning' || status === 'processing') && (
        <div className="mb-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className={`h-full bg-${config.color}-500`}
            />
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
            {progress}%
          </p>
        </div>
      )}

      {/* Message */}
      {message && (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">{message}</p>
      )}
    </div>
  );
}
