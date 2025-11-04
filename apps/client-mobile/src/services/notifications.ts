import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "./supabase";
import { deepLinkService, DeepLinkRoute, DeepLinkParams } from "./deeplink";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: "transaction" | "loan" | "group" | "system";
  route?: DeepLinkRoute;
  params?: DeepLinkParams;
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Register for push notifications and save token to backend
   */
  async registerForPushNotifications(userId: string): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn("Push notifications only work on physical devices");
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request if not already granted
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Permission not granted for push notifications");
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "rw.sacco.ibimina.client",
      });

      this.expoPushToken = tokenData.data;

      // Save token to backend
      await this.saveTokenToBackend(userId, this.expoPushToken);

      // Configure channel for Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error("Failed to register for push notifications:", error);
      return null;
    }
  }

  /**
   * Save push token to Supabase
   */
  private async saveTokenToBackend(userId: string, token: string) {
    try {
      const { error } = await supabase.from("push_tokens").upsert(
        {
          user_id: userId,
          token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,platform",
        }
      );

      if (error) throw error;
    } catch (error) {
      console.error("Failed to save push token:", error);
    }
  }

  /**
   * Handle notification received while app is open
   */
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Handle notification tapped by user
   */
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;

      // Navigate to appropriate screen if route specified
      if (data.route) {
        deepLinkService.navigate(data.route, data.params);
      }

      callback(response);
    });
  }

  /**
   * Send a local notification (for testing)
   */
  async sendLocalNotification(data: NotificationData) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: data.title,
        body: data.body,
        data: data.data || {},
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge
   */
  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get notification permission status
   */
  async getPermissionStatus(): Promise<"granted" | "denied" | "undetermined"> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }
}

export const notificationService = new NotificationService();
