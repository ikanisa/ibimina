import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  CheckCircle, 
  FileText,
  Settings,
  Sparkles,
  Bell,
  Activity
} from 'lucide-react';

interface ActivityBarProps {
  onAIClick: () => void;
  onNotificationsClick: () => void;
}

export function ActivityBar({ onAIClick, onNotificationsClick }: ActivityBarProps) {
  const items = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Members', path: '/members' },
    { icon: CreditCard, label: 'Payments', path: '/payments' },
    { icon: CheckCircle, label: 'Reconciliation', path: '/recon' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="w-14 flex flex-col items-center py-4 gap-2 bg-surface-base border-r border-border-default">
      {/* Navigation Items */}
      {items.map((item, i) => (
        <button
          key={i}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-overlay hover:text-primary-600 transition-fast group relative"
          title={item.label}
        >
          <item.icon className="w-5 h-5" />
          {/* Tooltip */}
          <span className="absolute left-full ml-2 px-2 py-1 bg-surface-elevated border border-border-default rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-fast pointer-events-none shadow-md z-tooltip">
            {item.label}
          </span>
        </button>
      ))}

      <div className="flex-1" />

      {/* AI Assistant */}
      <button
        onClick={onAIClick}
        className="w-10 h-10 flex items-center justify-center rounded-lg text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-fast group relative"
        title="AI Assistant"
      >
        <Sparkles className="w-5 h-5" />
        <span className="absolute left-full ml-2 px-2 py-1 bg-surface-elevated border border-border-default rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-fast pointer-events-none shadow-md z-tooltip">
          AI Assistant
        </span>
      </button>

      {/* Notifications */}
      <button
        onClick={onNotificationsClick}
        className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-overlay hover:text-primary-600 transition-fast group relative"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
        <span className="absolute left-full ml-2 px-2 py-1 bg-surface-elevated border border-border-default rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-fast pointer-events-none shadow-md z-tooltip">
          Notifications
        </span>
      </button>
    </div>
  );
}
