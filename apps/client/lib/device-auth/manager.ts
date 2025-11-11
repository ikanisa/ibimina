/**
 * Device Authentication Service
 *
 * The PWA build no longer bundles Capacitor, so this manager exposes the same
 * API but returns browser-friendly fallbacks. Calls that previously interacted
 * with the native plugin now return explanatory errors so that the UI can
 * communicate the limitation to members.
 */

import type { DeviceAuthPlugin, ChallengeData, SignedMessage, RegisteredDevice } from "./types";

export class DeviceAuthManager {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = "") {
    this.apiBaseUrl = apiBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  }

  isAvailable(): boolean {
    return false;
  }

  async isEnrolled(): Promise<boolean> {
    return false;
  }

  async checkBiometricAvailable(): Promise<{ available: boolean; message: string }> {
    return {
      available: false,
      message: "Device authentication is only available in the native mobile app",
    };
  }

  async enrollDevice(
    _userId: string,
    _deviceLabel: string,
    _authToken: string
  ): Promise<{ success: boolean; enrollmentId?: string; error?: string }> {
    return {
      success: false,
      error: "Device authentication is only available in the native mobile app",
    };
  }

  async signChallenge(
    _challenge: ChallengeData,
    _userId: string
  ): Promise<{
    success: boolean;
    signature?: string;
    signedMessage?: SignedMessage;
    error?: string;
  }> {
    return {
      success: false,
      error: "Device authentication is only available in the native mobile app",
    };
  }

  async verifyChallenge(
    sessionId: string,
    deviceId: string,
    signature: string,
    signedMessage: SignedMessage,
    integrityToken?: string
  ): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/device-auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          device_id: deviceId,
          signature,
          signed_message: signedMessage,
          integrity_token: integrityToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || "Verification failed",
        };
      }

      const result = await response.json();
      return {
        success: true,
        userId: result.user_id,
      };
    } catch (error) {
      console.error("Verification error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }

  async listDevices(authToken: string): Promise<{
    success: boolean;
    devices?: RegisteredDevice[];
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/device-auth/devices`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || "Failed to fetch devices",
        };
      }

      const result = await response.json();
      return {
        success: true,
        devices: result.devices,
      };
    } catch (error) {
      console.error("Failed to list devices:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch devices",
      };
    }
  }

  async revokeDevice(
    deviceId: string,
    authToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/device-auth/devices?device_id=${deviceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || "Failed to revoke device",
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to revoke device:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to revoke device",
      };
    }
  }

  async deleteLocalKeyPair(): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async getDeviceInfo(): Promise<{
    deviceId: string;
    model: string;
    manufacturer: string;
    osVersion: string;
  } | null> {
    return null;
  }
}

// Export a type alias so existing imports continue to compile.
export type { DeviceAuthPlugin };
