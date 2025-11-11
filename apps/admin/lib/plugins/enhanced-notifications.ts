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

const delivered: NotificationInfo[] = [];

let counter = 1;

async function requestBrowserPermission(): Promise<boolean> {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const result = await Notification.requestPermission();
  return result === "granted";
}

export const EnhancedNotifications = {
  async showNotification(
    options: ShowNotificationOptions
  ): Promise<{ success: boolean; id: number }> {
    const hasPermission = await requestBrowserPermission();
    const notificationId = options.id ?? counter++;

    if (hasPermission) {
      const notification = new Notification(options.title, {
        body: options.body,
        tag: options.groupKey,
        data: options.data,
      });

      if (options.actions?.length) {
        notification.onclick = () => {
          // eslint-disable-next-line ibimina/structured-logging
          console.log("Notification action clicked", options.actions);
        };
      }
    } else {
      // eslint-disable-next-line ibimina/structured-logging
      console.log("Notification:", options.title, options.body);
    }

    delivered.push({
      id: notificationId,
      tag: options.data ?? "",
      groupKey: options.groupKey ?? "default",
    });

    return { success: true, id: notificationId };
  },

  async cancelNotification({ id }: { id: number }): Promise<{ success: boolean }> {
    const index = delivered.findIndex((info) => info.id === id);
    if (index >= 0) {
      delivered.splice(index, 1);
    }
    return { success: true };
  },

  async cancelAllNotifications(): Promise<{ success: boolean }> {
    delivered.length = 0;
    return { success: true };
  },

  async getDeliveredNotifications(): Promise<{ notifications: NotificationInfo[] }> {
    return { notifications: [...delivered] };
  },

  async checkPermissions(): Promise<{ granted: boolean }> {
    const granted = typeof Notification !== "undefined" && Notification.permission === "granted";
    return { granted };
  },

  async requestPermissions(): Promise<{ granted: boolean }> {
    const granted = await requestBrowserPermission();
    return { granted };
  },
};

export default EnhancedNotifications;
