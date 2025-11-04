/**
 * Notification types
 */

export type NotificationType = 
  | 'payment_received'
  | 'payment_sent'
  | 'transaction_completed'
  | 'transaction_failed'
  | 'ikimina_contribution_due'
  | 'ikimina_payout_ready'
  | 'account_alert'
  | 'security_alert'
  | 'system_announcement';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationChannel = 'push' | 'sms' | 'email' | 'in_app';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  read: boolean;
  read_at?: string;
  action_url?: string;
  action_label?: string;
  data?: Record<string, any>;
  created_at: string;
  expires_at?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  click_action?: string;
}

export interface NotificationPreferences {
  user_id: string;
  channels: {
    push: boolean;
    sms: boolean;
    email: boolean;
    in_app: boolean;
  };
  types: Partial<Record<NotificationType, boolean>>;
  quiet_hours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
  };
  updated_at: string;
}
