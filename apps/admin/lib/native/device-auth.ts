/**
 * Web implementation of the Device Authentication bridge.
 *
 * The native implementation exposed by Capacitor previously powered biometric
 * backed device registration. After removing Capacitor we replace those calls
 * with light-weight browser fallbacks that keep the UI responsive while
 * clearly signalling that native capabilities are unavailable.
 */

export interface BiometricStatus {
  available: boolean;
  message: string;
}

export interface DeviceKeyStatus {
  hasKey: boolean;
  deviceId: string;
  publicKey?: string;
}

export interface DeviceInfo {
  deviceId: string;
  model: string;
  manufacturer: string;
  osVersion: string;
  sdkVersion: number;
  brand: string;
  device: string;
}

export interface KeyGenerationResult {
  success: boolean;
  deviceId: string;
  publicKey: string;
  keyAlgorithm: string;
  isStrongBoxBacked: boolean;
}

export interface SigningResult {
  success: boolean;
  signature: string;
  signedMessage: string;
  deviceId: string;
  challengeInfo: {
    sessionId: string;
    nonce: string;
    origin: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  sessionId?: string;
  nonce?: string;
  origin?: string;
  expiresAt?: number;
  reason?: string;
  expired?: boolean;
}

type DeviceAuthState = {
  hasKey: boolean;
  publicKey?: string;
};

const STORAGE_KEY = "ibimina.deviceAuth";

const isBrowser = () => typeof window !== "undefined";

function readState(): DeviceAuthState {
  if (!isBrowser()) {
    return { hasKey: false };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { hasKey: false };
    }

    const parsed = JSON.parse(raw) as DeviceAuthState;
    return {
      hasKey: Boolean(parsed?.hasKey),
      publicKey: typeof parsed?.publicKey === "string" ? parsed.publicKey : undefined,
    };
  } catch (error) {
    console.warn("Failed to read device auth state", error);
    return { hasKey: false };
  }
}

function writeState(state: DeviceAuthState): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to persist device auth state", error);
  }
}

function getDeviceIdentifier(): string {
  if (!isBrowser()) {
    return "web-device";
  }

  if (typeof window.localStorage !== "undefined") {
    const cacheKey = "ibimina.deviceId";
    const cached = window.localStorage.getItem(cacheKey);
    if (cached) {
      return cached;
    }

    const generated =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `web-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(cacheKey, generated);
    return generated;
  }

  return "web-device";
}

export const DeviceAuth = {
  isAvailable(): boolean {
    return false;
  },

  async checkBiometricAvailable(): Promise<BiometricStatus> {
    return {
      available: false,
      message: "Device-bound authentication is only available in the native app",
    };
  },

  async hasDeviceKey(): Promise<DeviceKeyStatus> {
    const state = readState();
    return {
      hasKey: state.hasKey,
      deviceId: getDeviceIdentifier(),
      publicKey: state.publicKey,
    };
  },

  async getDeviceInfo(): Promise<DeviceInfo> {
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
    return {
      deviceId: getDeviceIdentifier(),
      model: "Browser",
      manufacturer: "Web",
      osVersion: userAgent,
      sdkVersion: 0,
      brand: "Web",
      device: "Browser",
    };
  },

  async generateDeviceKey(): Promise<KeyGenerationResult> {
    throw new Error("Device-bound authentication is only available in the native app");
  },

  async signChallenge(): Promise<SigningResult> {
    throw new Error("Device-bound authentication is only available in the native app");
  },

  async validateChallenge(challengeJson: string): Promise<ValidationResult> {
    try {
      const challenge = JSON.parse(challengeJson) as {
        session_id?: string;
        nonce?: string;
        origin?: string;
        exp?: number;
      };

      if (!challenge.session_id || !challenge.nonce || !challenge.origin) {
        return {
          valid: false,
          reason: "Missing fields",
        };
      }

      const now = Math.floor(Date.now() / 1000);
      const expiresAt = typeof challenge.exp === "number" ? challenge.exp : undefined;
      const expired = typeof expiresAt === "number" ? expiresAt < now : false;

      return {
        valid: !expired,
        sessionId: challenge.session_id,
        nonce: challenge.nonce,
        origin: challenge.origin,
        expiresAt,
        expired,
        reason: expired ? "QR code expired" : undefined,
      };
    } catch (error) {
      console.error("Failed to validate challenge", error);
      return {
        valid: false,
        reason: "Invalid JSON",
      };
    }
  },

  async deleteDeviceKey(): Promise<{ success: boolean }> {
    writeState({ hasKey: false });
    return { success: true };
  },
};

export default DeviceAuth;
