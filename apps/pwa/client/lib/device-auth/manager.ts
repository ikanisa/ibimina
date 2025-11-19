/**
 * Device Authentication Service
 *
 * High-level API for device-bound authentication in the mobile app
 */

import { Capacitor } from "@capacitor/core";
import type {
  DeviceAuthPlugin,
  ChallengeData,
  SignedMessage,
  DeviceEnrollmentData,
  RegisteredDevice,
} from "./types";

// Define the plugin for registration
const DeviceAuth = Capacitor.registerPlugin<DeviceAuthPlugin>("DeviceAuth");

/**
 * Device Authentication Manager
 */
export class DeviceAuthManager {
  private apiBaseUrl: string;
  private plugin: DeviceAuthPlugin;

  constructor(apiBaseUrl: string = "", plugin: DeviceAuthPlugin = DeviceAuth) {
    this.apiBaseUrl = apiBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
    this.plugin = plugin;
  }

  /**
   * Check if device authentication is available on this platform
   */
  isAvailable(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  }

  /**
   * Check if device is enrolled (has keypair)
   */
  async isEnrolled(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.plugin.hasKeyPair();
      return result.hasKeyPair;
    } catch (error) {
      console.error("Failed to check enrollment:", error);
      return false;
    }
  }

  /**
   * Check if biometric authentication is available
   */
  async checkBiometricAvailable(): Promise<{ available: boolean; message: string }> {
    if (!this.isAvailable()) {
      return {
        available: false,
        message: "Device authentication is only available on Android",
      };
    }

    try {
      return await this.plugin.checkBiometricAvailable();
    } catch (error) {
      console.error("Failed to check biometric availability:", error);
      return {
        available: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Enroll this device for authentication
   *
   * @param userId User ID from authenticated session
   * @param deviceLabel User-friendly device name
   * @param authToken Authentication token for API call
   */
  async enrollDevice(
    userId: string,
    deviceLabel: string,
    authToken: string
  ): Promise<{ success: boolean; enrollmentId?: string; error?: string }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: "Device authentication is only available on Android",
      };
    }

    try {
      // Check biometric availability
      const biometricStatus = await this.checkBiometricAvailable();
      if (!biometricStatus.available) {
        return {
          success: false,
          error: `Biometric authentication not available: ${biometricStatus.message}`,
        };
      }

      // Generate keypair
      const keyPairResult = await this.plugin.generateKeyPair({
        requireBiometric: true,
        requireStrongBox: true,
      });

      if (!keyPairResult.success) {
        return {
          success: false,
          error: "Failed to generate device keypair",
        };
      }

      // Get device info
      const deviceInfo = await this.plugin.getDeviceInfo();

      // TODO: Get Play Integrity token
      const integrityToken = undefined;

      // Prepare enrollment data
      const enrollmentData: DeviceEnrollmentData = {
        deviceId: deviceInfo.deviceId,
        deviceLabel,
        publicKey: keyPairResult.publicKey,
        keyAlgorithm: "ES256",
        deviceInfo: {
          model: deviceInfo.model,
          manufacturer: deviceInfo.manufacturer,
          osVersion: deviceInfo.osVersion,
          appVersion: "1.0.0", // TODO: Get from app config
        },
        integrityToken,
      };

      // Call enrollment API
      const response = await fetch(`${this.apiBaseUrl}/api/device-auth/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(enrollmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || "Enrollment failed",
        };
      }

      const result = (await response.json()) as Partial<RegisteredDevice> & {
        enrollment_id?: string;
      };
      return {
        success: true,
        enrollmentId:
          typeof result.id === "string"
            ? result.id
            : typeof result.enrollment_id === "string"
              ? result.enrollment_id
              : undefined,
      };
    } catch (error) {
      console.error("Enrollment error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Sign a challenge from QR code
   *
   * @param challenge Challenge data from QR code
   * @param userId User ID
   * @returns Signature and signed message for server verification
   */
  async signChallenge(
    challenge: ChallengeData,
    userId: string
  ): Promise<{
    success: boolean;
    signature?: string;
    signedMessage?: SignedMessage;
    error?: string;
  }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: "Device authentication is only available on Android",
      };
    }

    try {
      // Check if enrolled
      const enrolled = await this.isEnrolled();
      if (!enrolled) {
        return {
          success: false,
          error: "Device not enrolled. Please enroll first.",
        };
      }

      // Sign challenge (will trigger biometric prompt)
      const result = await this.plugin.signChallenge({
        challengeJson: JSON.stringify(challenge),
        userId,
      });

      return {
        success: true,
        signature: result.signature,
        signedMessage: result.signedMessage,
      };
    } catch (error) {
      console.error("Challenge signing error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sign challenge",
      };
    }
  }

  /**
   * Verify signed challenge with server
   *
   * @param sessionId Session ID from challenge
   * @param deviceId Device ID
   * @param signature Signature from signChallenge
   * @param signedMessage Signed message from signChallenge
   * @param integrityToken Optional Play Integrity token
   */
  async verifyChallenge(
    sessionId: string,
    deviceId: string,
    signature: string,
    signedMessage: SignedMessage,
    integrityToken?: string
  ): Promise<{
    success: boolean;
    userId?: string;
    error?: string;
  }> {
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

  /**
   * List registered devices for user
   *
   * @param authToken Authentication token
   */
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

  /**
   * Revoke a device
   *
   * @param deviceId Device ID to revoke
   * @param authToken Authentication token
   */
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

  /**
   * Delete local keypair (for re-enrollment)
   */
  async deleteLocalKeyPair(): Promise<{ success: boolean; error?: string }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: "Device authentication is only available on Android",
      };
    }

    try {
      await this.plugin.deleteKeyPair();
      return { success: true };
    } catch (error) {
      console.error("Failed to delete keypair:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete keypair",
      };
    }
  }

  /**
   * Get device info
   */
  async getDeviceInfo(): Promise<{
    deviceId: string;
    model: string;
    manufacturer: string;
    osVersion: string;
  } | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      return await this.plugin.getDeviceInfo();
    } catch (error) {
      console.error("Failed to get device info:", error);
      return null;
    }
  }
}

// Export singleton instance
export const deviceAuthManager = new DeviceAuthManager();

// Export plugin for direct access if needed
export { DeviceAuth };
