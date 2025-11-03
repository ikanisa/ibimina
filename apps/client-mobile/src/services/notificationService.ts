/**
 * Notification Service - NO Firebase
 * Uses Supabase Realtime + Notifee for local notifications
 */

import notifee, { AndroidImportance, AuthorizationStatus, Event, EventType } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import { supabase } from './supabase';

interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  type?: 'transaction' | 'loan' | 'group' | 'system';
  data?: Record<string, any>;
}

class NotificationService {
  private channel?: string;
  private realtimeChannel?: any;
  private navigationRef?: any;

  async initialize() {
    await this.requestPermission();
    await this.createNotificationChannel();
    await this.subscribeToNotifications();
    this.setupForegroundHandler();
    this.setupBackgroundHandler();
  }

  private async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    }

    // iOS
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
  }

  private async createNotificationChannel() {
    if (Platform.OS === 'android') {
      this.channel = await notifee.createChannel({
        id: 'default',
        name: 'Default Notifications',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      await notifee.createChannel({
        id: 'transactions',
        name: 'Transactions',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });

      await notifee.createChannel({
        id: 'loans',
        name: 'Loans',
        importance: AndroidImportance.DEFAULT,
      });

      await notifee.createChannel({
        id: 'groups',
        name: 'Groups',
        importance: AndroidImportance.DEFAULT,
      });
    }
  }

  private async subscribeToNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Subscribe to user-specific notifications via Supabase Realtime
    this.realtimeChannel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          this.showNotification(payload.new as NotificationPayload);
        }
      )
      .subscribe();
  }

  private setupForegroundHandler() {
    notifee.onForegroundEvent(({ type, detail }: Event) => {
      if (type === EventType.PRESS) {
        console.log('Notification pressed:', detail.notification);
        this.handleNotificationPress(detail.notification);
      }
    });
  }

  private setupBackgroundHandler() {
    notifee.onBackgroundEvent(async ({ type, detail }: Event) => {
      if (type === EventType.PRESS) {
        console.log('Background notification pressed:', detail.notification);
        // Mark as read
        if (detail.notification?.id) {
          await this.markAsRead(detail.notification.id);
        }
      }
    });
  }

  async showNotification(notification: NotificationPayload) {
    const channelId = this.getChannelId(notification.type);

    await notifee.displayNotification({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        sound: 'default',
        smallIcon: 'ic_notification',
        color: '#4CAF50',
      },
      ios: {
        sound: 'default',
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
      },
      data: notification.data,
    });
  }

  private getChannelId(type?: string): string {
    switch (type) {
      case 'transaction':
        return 'transactions';
      case 'loan':
        return 'loans';
      case 'group':
        return 'groups';
      default:
        return this.channel || 'default';
    }
  }

  private handleNotificationPress(notification: any) {
    if (!this.navigationRef || !notification?.data) return;

    const { screen, params } = notification.data;
    if (screen) {
      this.navigationRef.navigate(screen, params);
    }
  }

  setNavigationRef(ref: any) {
    this.navigationRef = ref;
  }

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async getNotifications(): Promise<NotificationPayload[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return (data || []).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      data: n.data,
    }));
  }

  async clearAll() {
    await notifee.cancelAllNotifications();
  }

  async getBadgeCount(): Promise<number> {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    return count || 0;
  }

  async setBadgeCount(count: number) {
    if (Platform.OS === 'ios') {
      await notifee.setBadgeCount(count);
    }
  }

  cleanup() {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }
  }
}

export const notificationService = new NotificationService();
