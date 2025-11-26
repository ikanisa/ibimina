import type {
  NotificationAdapter,
  NotificationOptions,
} from '@ibimina/admin-core/adapters';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

export class TauriNotifications implements NotificationAdapter {
  isSupported(): boolean {
    return true; // Tauri always supports notifications
  }

  async requestPermission(): Promise<'granted' | 'denied' | 'default'> {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    return permissionGranted ? 'granted' : 'denied';
  }

  async getPermissionStatus(): Promise<'granted' | 'denied' | 'default'> {
    const granted = await isPermissionGranted();
    return granted ? 'granted' : 'denied';
  }

  async show(options: NotificationOptions): Promise<string> {
    await sendNotification({
      title: options.title,
      body: options.body,
      icon: options.icon,
    });
    // Tauri doesn't return a notification ID, so we generate one
    return `notif-${Date.now()}`;
  }

  async cancel(_id: string): Promise<void> {
    // Tauri doesn't support canceling individual notifications
    console.warn('Canceling individual notifications not supported on Tauri');
  }

  async cancelAll(): Promise<void> {
    // Tauri doesn't support canceling all notifications
    console.warn('Canceling all notifications not supported on Tauri');
  }
}
