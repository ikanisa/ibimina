import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

const notifications = [
  {
    id: 1,
    type: 'success',
    title: 'Payment Reconciled',
    message: 'Payment RWF 50,000 from John Doe has been reconciled successfully.',
    time: '2m ago',
    icon: CheckCircle,
    color: 'text-success'
  },
  {
    id: 2,
    type: 'warning',
    title: 'Pending Reconciliation',
    message: '23 payments are waiting for reconciliation.',
    time: '15m ago',
    icon: AlertTriangle,
    color: 'text-warning'
  },
  {
    id: 3,
    type: 'info',
    title: 'New Member Joined',
    message: 'Jane Smith joined Ikimina "Turikumwe".',
    time: '1h ago',
    icon: Info,
    color: 'text-info'
  },
  {
    id: 4,
    type: 'info',
    title: 'Sync Complete',
    message: 'All data has been synced with the server.',
    time: '2h ago',
    icon: CheckCircle,
    color: 'text-success'
  },
];

export function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-popover"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-surface-base border-l border-border-default shadow-2xl z-popover"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-default">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-500" />
                <h2 className="text-h4 font-semibold">Notifications</h2>
                <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-full text-xs font-medium">
                  {notifications.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-surface-overlay rounded transition-fast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 p-4 border-b border-border-default">
              <button className="flex-1 px-3 py-1.5 text-body-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg transition-fast">
                Mark all read
              </button>
              <button className="flex-1 px-3 py-1.5 text-body-sm text-text-muted hover:bg-surface-overlay rounded-lg transition-fast">
                Clear all
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-auto h-[calc(100%-8rem)]">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border-b border-border-default hover:bg-surface-overlay transition-fast cursor-pointer"
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0 ${notification.color}`}>
                      <notification.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-body-md font-semibold text-text-primary">
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-text-muted flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{notification.time}</span>
                        </div>
                      </div>
                      <p className="text-body-sm text-text-secondary">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <Bell className="w-12 h-12 text-text-muted mb-3" />
                  <h3 className="text-h4 font-semibold text-text-primary mb-1">
                    All caught up!
                  </h3>
                  <p className="text-body-sm text-text-muted">
                    You don't have any notifications right now.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
