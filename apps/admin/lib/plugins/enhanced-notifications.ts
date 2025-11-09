import { registerPlugin } from "@capacitor/core";

/**
 * Enhanced Notifications Plugin
 *
 * Provides rich notification features including:
 * - Custom notification channels
 * - Notification grouping
 * - Action buttons
 * - Delivery tracking
 */

export interface NotificationAction {
  id: string;
  title: string;
}

export interface ShowNotificationOptions {
  title: string;
  body: string;
  channelId?: "default" | "alerts" | "transactions" | "messages";
  id?: number;
  groupKey?: string;
  priority?: number;
  data?: string;
  actions?: NotificationAction[];
}

export interface NotificationInfo {
  id: number;
  tag: string;
  groupKey: string;
}

export interface EnhancedNotificationsPlugin {
  /**
   * Show a notification
   */
  showNotification(options: ShowNotificationOptions): Promise<{ success: boolean; id: number }>;

  /**
   * Cancel a specific notification by ID
   */
  cancelNotification(options: { id: number }): Promise<{ success: boolean }>;

  /**
   * Cancel all notifications
   */
  cancelAllNotifications(): Promise<{ success: boolean }>;

  /**
   * Get list of currently delivered notifications
   */
  getDeliveredNotifications(): Promise<{ notifications: NotificationInfo[] }>;

  /**
   * Check if notification permissions are granted
   */
  checkPermissions(): Promise<{ granted: boolean }>;

  /**
   * Request notification permissions (Android 13+)
   */
  requestPermissions(): Promise<{ granted: boolean }>;
}

type NativeShowNotificationOptions = Omit<ShowNotificationOptions, "channelId"> & {
  channelId?: string;
};

interface InternalEnhancedNotificationsPlugin extends EnhancedNotificationsPlugin {
  showNotification(
    options: NativeShowNotificationOptions
  ): Promise<{ success: boolean; id: number }>;
}

const CHANNEL_ID_MAP: Record<NonNullable<ShowNotificationOptions["channelId"]>, string> = {
  default: "ibimina_default",
  alerts: "ibimina_alerts",
  transactions: "ibimina_transactions",
  messages: "ibimina_messages",
};

const nativePlugin = registerPlugin<InternalEnhancedNotificationsPlugin>("EnhancedNotifications");

const originalShowNotification = nativePlugin.showNotification.bind(nativePlugin);

const EnhancedNotifications: EnhancedNotificationsPlugin = Object.assign(nativePlugin, {
  async showNotification(options: ShowNotificationOptions) {
    const { channelId, ...rest } = options;
    const resolvedChannelId = channelId ? (CHANNEL_ID_MAP[channelId] ?? channelId) : undefined;
    const payload: NativeShowNotificationOptions = resolvedChannelId
      ? { ...rest, channelId: resolvedChannelId }
      : { ...rest };

    return originalShowNotification(payload);
  },
});

export default EnhancedNotifications;
