/**
 * Supabase Push Notification Service
 * Uses Expo Push Notification service (free tier)
 * No Firebase required!
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class SupabaseNotificationService {
  private pushToken: string | null = null;

  /**
   * Request permission and register device
   */
  async initialize(userId: string): Promise<boolean> {
    try {
      // Check if physical device
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return false;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission denied');
        return false;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID, // Set in app.json
      });
      this.pushToken = tokenData.data;

      // Save token to Supabase
      await this.savePushToken(userId, this.pushToken);

      // Set up notification handlers
      this.setupNotificationListeners();

      console.log('✅ Push notifications initialized:', this.pushToken);
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Save push token to Supabase
   */
  private async savePushToken(userId: string, token: string): Promise<void> {
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token,
        platform: Platform.OS,
        device_name: Device.deviceName || 'Unknown',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,token',
      });

    if (error) {
      console.error('Failed to save push token:', error);
      throw error;
    }
  }

  /**
   * Set up listeners for notification events
   */
  private setupNotificationListeners(): void {
    // Notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('📬 Notification received:', notification);
    });

    // User tapped on notification
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification tapped:', response);
      this.handleNotificationTap(response.notification);
    });
  }

  /**
   * Handle notification tap - navigate to relevant screen
   */
  private handleNotificationTap(notification: Notifications.Notification): void {
    const data = notification.request.content.data;

    // Deep link handling
    if (data.screen) {
      // NavigationService.navigate(data.screen, data.params);
      console.log('Navigate to:', data.screen, data.params);
    }
  }

  /**
   * Unregister device on logout
   */
  async unregister(userId: string): Promise<void> {
    if (!this.pushToken) return;

    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', this.pushToken);

    if (error) {
      console.error('Failed to unregister push token:', error);
    }

    this.pushToken = null;
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }
}

export const notificationService = new SupabaseNotificationService();
