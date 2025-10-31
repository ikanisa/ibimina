/**
 * TypeScript bridge for the native SMS Ingestion plugin.
 *
 * This module provides a JavaScript interface to the native Android SMS reader.
 * It handles permission requests, SMS querying, and background sync configuration.
 *
 * Usage:
 * ```typescript
 * import { SmsIngest } from '@/lib/native/sms-ingest';
 *
 * // Check if running on native platform
 * const isNative = SmsIngest.isAvailable();
 *
 * // Request permissions
 * const result = await SmsIngest.requestPermissions();
 *
 * // Enable SMS ingestion
 * await SmsIngest.enable();
 *
 * // Query SMS messages
 * const messages = await SmsIngest.querySmsInbox({ limit: 50 });
 * ```
 */

import { Capacitor, registerPlugin } from "@capacitor/core";

export interface SmsIngestPlugin {
  /**
   * Check current permission status for SMS reading
   */
  checkPermissions(): Promise<PermissionStatus>;

  /**
   * Request SMS permissions from the user
   */
  requestPermissions(): Promise<PermissionStatus>;

  /**
   * Check if SMS ingestion is currently enabled
   */
  isEnabled(): Promise<{ enabled: boolean }>;

  /**
   * Enable SMS ingestion and start background sync
   */
  enable(): Promise<{ enabled: boolean }>;

  /**
   * Disable SMS ingestion and stop background sync
   */
  disable(): Promise<{ enabled: boolean }>;

  /**
   * Query SMS inbox for messages from mobile money providers
   */
  querySmsInbox(options?: QueryOptions): Promise<QueryResult>;

  /**
   * Update the last sync timestamp
   */
  updateLastSyncTime(options: {
    timestamp: number;
  }): Promise<{ success: boolean; timestamp: number }>;

  /**
   * Schedule background sync with custom interval
   */
  scheduleBackgroundSync(options?: { intervalMinutes?: number }): Promise<{ scheduled: boolean }>;
}

export interface PermissionStatus {
  readSms?: "granted" | "denied" | "prompt";
  receiveSms?: "granted" | "denied" | "prompt";
  state: "granted" | "denied" | "prompt";
}

export interface QueryOptions {
  /**
   * Maximum number of messages to return
   * @default 50
   */
  limit?: number;

  /**
   * Only return messages received after this timestamp (milliseconds)
   * @default Last sync time or 0
   */
  since?: number;
}

export interface SmsMessage {
  id: number;
  address: string;
  body: string;
  timestamp: number;
  received_at: string;
}

export interface QueryResult {
  messages: SmsMessage[];
  count: number;
}

// Register the plugin
const SmsIngestNative = registerPlugin<SmsIngestPlugin>("SmsIngest", {
  web: {
    // Provide stub implementation for web
    checkPermissions: async () => ({ state: "denied" as const }),
    requestPermissions: async () => ({ state: "denied" as const }),
    isEnabled: async () => ({ enabled: false }),
    enable: async () => {
      throw new Error("SMS ingestion not available on web");
    },
    disable: async () => ({ enabled: false }),
    querySmsInbox: async () => ({ messages: [], count: 0 }),
    updateLastSyncTime: async () => ({ success: false, timestamp: 0 }),
    scheduleBackgroundSync: async () => ({ scheduled: false }),
  },
});

/**
 * High-level SMS Ingestion API
 */
export const SmsIngest = {
  /**
   * Check if running on a native platform with SMS support
   */
  isAvailable(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  },

  /**
   * Check if SMS permissions are granted
   */
  async checkPermissions(): Promise<PermissionStatus> {
    if (!this.isAvailable()) {
      return { state: "denied" };
    }
    return SmsIngestNative.checkPermissions();
  },

  /**
   * Request SMS permissions from user
   * Shows native permission dialog
   */
  async requestPermissions(): Promise<PermissionStatus> {
    if (!this.isAvailable()) {
      throw new Error("SMS ingestion is only available on native Android");
    }
    return SmsIngestNative.requestPermissions();
  },

  /**
   * Check if SMS ingestion is currently enabled
   */
  async isEnabled(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    const result = await SmsIngestNative.isEnabled();
    return result.enabled;
  },

  /**
   * Enable SMS ingestion
   * Requires permissions to be granted first
   */
  async enable(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error("SMS ingestion is only available on native Android");
    }

    // Check permissions first
    const perms = await this.checkPermissions();
    if (perms.state !== "granted") {
      throw new Error("SMS permissions not granted");
    }

    await SmsIngestNative.enable();
  },

  /**
   * Disable SMS ingestion
   */
  async disable(): Promise<void> {
    if (!this.isAvailable()) return;
    await SmsIngestNative.disable();
  },

  /**
   * Query SMS inbox for mobile money messages
   */
  async querySmsInbox(options?: QueryOptions): Promise<SmsMessage[]> {
    if (!this.isAvailable()) {
      return [];
    }

    const result = await SmsIngestNative.querySmsInbox(options);
    return result.messages;
  },

  /**
   * Mark sync as completed at current timestamp
   */
  async markSyncComplete(): Promise<void> {
    if (!this.isAvailable()) return;
    await SmsIngestNative.updateLastSyncTime({
      timestamp: Date.now(),
    });
  },

  /**
   * Schedule periodic background sync
   */
  async scheduleBackgroundSync(intervalMinutes: number = 15): Promise<void> {
    if (!this.isAvailable()) return;
    await SmsIngestNative.scheduleBackgroundSync({ intervalMinutes });
  },
};

/**
 * Hook for checking SMS ingestion availability and status
 */
export function useSmsIngest() {
  const isAvailable = SmsIngest.isAvailable();

  return {
    isAvailable,
    checkPermissions: SmsIngest.checkPermissions.bind(SmsIngest),
    requestPermissions: SmsIngest.requestPermissions.bind(SmsIngest),
    isEnabled: SmsIngest.isEnabled.bind(SmsIngest),
    enable: SmsIngest.enable.bind(SmsIngest),
    disable: SmsIngest.disable.bind(SmsIngest),
    querySmsInbox: SmsIngest.querySmsInbox.bind(SmsIngest),
    markSyncComplete: SmsIngest.markSyncComplete.bind(SmsIngest),
    scheduleBackgroundSync: SmsIngest.scheduleBackgroundSync.bind(SmsIngest),
  };
}
