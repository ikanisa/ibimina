/**
 * Type definitions for Device Authentication Capacitor Plugin
 */

export interface DeviceAuthPlugin {
  /**
   * Check if device has a keypair enrolled
   */
  hasKeyPair(): Promise<{ hasKeyPair: boolean }>;

  /**
   * Generate a new keypair in Android Keystore
   */
  generateKeyPair(options?: { requireBiometric?: boolean; requireStrongBox?: boolean }): Promise<{
    success: boolean;
    publicKey: string; // PEM format
    algorithm: string; // "ES256"
  }>;

  /**
   * Get public key in PEM format
   */
  getPublicKey(): Promise<{
    publicKey: string;
    algorithm: string;
  }>;

  /**
   * Get device ID
   */
  getDeviceId(): Promise<{
    deviceId: string;
  }>;

  /**
   * Get device information
   */
  getDeviceInfo(): Promise<{
    deviceId: string;
    model: string;
    manufacturer: string;
    osVersion: string;
    sdkVersion: number;
  }>;

  /**
   * Check if biometric authentication is available
   */
  checkBiometricAvailable(): Promise<{
    available: boolean;
    message: string;
  }>;

  /**
   * Sign a challenge with device private key (requires biometric auth)
   */
  signChallenge(options: { challengeJson: string; userId: string }): Promise<{
    success: boolean;
    signature: string; // Base64
    signedMessage: SignedMessage;
  }>;

  /**
   * Delete keypair from Keystore
   */
  deleteKeyPair(): Promise<{ success: boolean }>;
}

/**
 * Challenge data from QR code
 */
export interface ChallengeData {
  ver: number;
  session_id: string;
  origin: string;
  nonce: string;
  exp: number; // Unix timestamp in seconds
  aud: string;
}

/**
 * Signed message sent to server
 */
export interface SignedMessage {
  ver: number;
  user_id: string;
  device_id: string;
  session_id: string;
  origin: string;
  nonce: string;
  ts: number; // Unix timestamp in seconds
  scope: string[];
  alg: string;
}

/**
 * Device enrollment data
 */
export interface DeviceEnrollmentData {
  deviceId: string;
  deviceLabel: string;
  publicKey: string;
  keyAlgorithm: "ES256" | "Ed25519";
  deviceInfo: {
    model: string;
    manufacturer: string;
    osVersion: string;
    appVersion: string;
  };
  integrityToken?: string;
}

export type DeviceInfoRecord = DeviceEnrollmentData["deviceInfo"] & {
  [key: string]: unknown;
};

/**
 * Registered device info
 */
export interface RegisteredDevice {
  id: string;
  device_id: string;
  device_label: string;
  key_algorithm: string;
  device_info: DeviceInfoRecord;
  integrity_status: string | null;
  created_at: string;
  last_used_at: string;
  revoked_at: string | null;
}
