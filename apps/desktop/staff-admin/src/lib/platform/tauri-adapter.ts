import type {
  PlatformAdapter,
  PlatformInfo,
  PlatformFeature,
  UpdateInfo,
} from '@ibimina/admin-core/adapters';
import { TauriStorage } from './tauri-storage';
import { TauriNotifications } from './tauri-notifications';
import { TauriPrint } from './tauri-print';
import { TauriHardware } from './tauri-hardware';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import { platform, version } from '@tauri-apps/plugin-os';

export class TauriAdapter implements PlatformAdapter {
  public info: PlatformInfo;
  public storage: TauriStorage;
  public notifications: TauriNotifications;
  public printing: TauriPrint;
  public hardware: TauriHardware;

  constructor() {
    const platformType = platform();
    const osVersion = version();

    this.info = {
      type: 'desktop',
      os: this.mapPlatformToOS(platformType),
      version: osVersion,
      isOnline: navigator.onLine,
    };

    this.storage = new TauriStorage();
    this.notifications = new TauriNotifications();
    this.printing = new TauriPrint();
    this.hardware = new TauriHardware();
  }

  async initialize(): Promise<void> {
    // Initialize platform-specific features
    window.addEventListener('online', () => {
      this.info.isOnline = true;
    });
    window.addEventListener('offline', () => {
      this.info.isOnline = false;
    });
  }

  isFeatureAvailable(feature: PlatformFeature): boolean {
    const features: Record<PlatformFeature, boolean> = {
      'offline-storage': true,
      'push-notifications': true,
      'biometrics': false, // Desktop doesn't typically have biometrics
      nfc: false, // Desktop doesn't have NFC
      'barcode-scanner': true, // Via USB scanners or webcam
      printing: true,
      'auto-update': true,
      'system-tray': true,
      'deep-linking': true,
    };
    return features[feature] ?? false;
  }

  async openExternal(url: string): Promise<void> {
    await open(url);
  }

  getAppVersion(): string {
    return '0.1.0'; // TODO: Get from package.json or Tauri config
  }

  async checkForUpdates(): Promise<UpdateInfo | null> {
    try {
      return await invoke<UpdateInfo | null>('check_for_updates');
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return null;
    }
  }

  async installUpdate(): Promise<void> {
    await invoke('install_update');
  }

  private mapPlatformToOS(
    platformType: string,
  ): 'windows' | 'macos' | 'linux' | 'web' {
    switch (platformType) {
      case 'windows':
        return 'windows';
      case 'macos':
        return 'macos';
      case 'linux':
        return 'linux';
      default:
        return 'web';
    }
  }
}
