import type { HardwareAdapter } from '@ibimina/admin-core/adapters';

export class TauriHardware implements HardwareAdapter {
  scanner = {
    isSupported: (): boolean => true,

    startScan: async (): Promise<void> => {
      // Start scanning via webcam or USB scanner
      console.warn('Scanner not yet implemented');
    },

    stopScan: async (): Promise<void> => {
      console.warn('Scanner not yet implemented');
    },

    onScan: (_callback: (result: any) => void): (() => void) => {
      // Set up scan event listener
      return () => {
        // Cleanup
      };
    },
  };

  nfc = {
    isSupported: (): boolean => false, // Desktop typically doesn't have NFC

    isEnabled: async (): Promise<boolean> => false,

    startReading: async (): Promise<void> => {
      throw new Error('NFC not supported on desktop');
    },

    stopReading: async (): Promise<void> => {
      throw new Error('NFC not supported on desktop');
    },

    onRead: (_callback: (data: any) => void): (() => void) => {
      return () => {};
    },
  };

  biometrics = {
    isSupported: (): boolean => false, // Desktop typically doesn't have biometrics

    isEnrolled: async (): Promise<boolean> => false,

    authenticate: async (_reason: string): Promise<boolean> => {
      throw new Error('Biometrics not supported on desktop');
    },
  };
}
