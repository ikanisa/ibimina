/**
 * Device Authentication Client for Admin Web App
 *
 * Handles QR challenge generation and session polling for device-based login
 */

import type { ChallengeData } from "./types";
import { logError } from "@/lib/observability/logger";

export class DeviceAuthClient {
  private apiBaseUrl: string;
  private pollInterval: number;
  private pollTimeout: number;

  constructor(apiBaseUrl: string = "", pollInterval: number = 1000, pollTimeout: number = 60000) {
    this.apiBaseUrl = apiBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
    this.pollInterval = pollInterval;
    this.pollTimeout = pollTimeout;
  }

  /**
   * Generate a new authentication challenge
   *
   * @returns Challenge data for QR encoding
   */
  async generateChallenge(): Promise<{
    success: boolean;
    challenge?: ChallengeData;
    sessionId?: string;
    expiresAt?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/device-auth/challenge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || "Failed to generate challenge",
        };
      }

      const result = await response.json();
      return {
        success: true,
        challenge: result.challenge,
        sessionId: result.session_id,
        expiresAt: result.expires_at,
      };
    } catch (error) {
      logError("Challenge generation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate challenge",
      };
    }
  }

  /**
   * Poll for session verification
   *
   * @param sessionId Session ID from challenge
   * @param onVerified Callback when session is verified
   * @param onError Callback on error
   * @param onTimeout Callback on timeout
   * @returns Cleanup function to stop polling
   */
  pollForVerification(
    sessionId: string,
    onVerified: (userId: string) => void,
    onError: (error: string) => void,
    onTimeout: () => void
  ): () => void {
    let cancelled = false;
    const startTime = Date.now();

    const poll = async () => {
      if (cancelled) return;

      // Check timeout
      if (Date.now() - startTime > this.pollTimeout) {
        onTimeout();
        return;
      }

      try {
        // TODO: Implement actual polling endpoint
        // For now, we'll use a mock implementation
        // In production, this should check the database or use WebSocket/SSE

        // Mock: Check session status
        const verified = false; // Replace with actual check

        if (verified) {
          onVerified("user-id"); // Replace with actual user ID
        } else {
          // Continue polling
          setTimeout(poll, this.pollInterval);
        }
      } catch (error) {
        logError("Polling error:", error);
        onError(error instanceof Error ? error.message : "Polling failed");
      }
    };

    // Start polling
    poll();

    // Return cleanup function
    return () => {
      cancelled = true;
    };
  }

  /**
   * Check if a session has been verified
   *
   * @param sessionId Session ID to check
   * @returns Verification status
   */
  async checkSessionStatus(_sessionId: string): Promise<{
    verified: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      // TODO: Implement session status endpoint
      // This should check if the challenge has been verified

      return {
        verified: false,
      };
    } catch (error) {
      logError("Session status check error:", error);
      return {
        verified: false,
        error: error instanceof Error ? error.message : "Failed to check status",
      };
    }
  }
}

/**
 * Generate QR code data URL from challenge
 *
 * @param challenge Challenge data
 * @returns Data URL for QR code (requires qrcode library)
 */
export async function generateQRCode(challenge: ChallengeData): Promise<string> {
  // Encode challenge as JSON
  const challengeJson = JSON.stringify(challenge);

  // Use QRCode library (needs to be installed)
  // For now, return the JSON string - in production use proper QR generation
  return challengeJson;
}

/**
 * Format challenge for display
 */
export function formatChallengeForDisplay(challenge: ChallengeData): {
  origin: string;
  expiresIn: string;
  sessionId: string;
} {
  const expiresAt = new Date(challenge.exp * 1000);
  const now = new Date();
  const secondsRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

  return {
    origin: challenge.origin,
    expiresIn: `${secondsRemaining}s`,
    sessionId: challenge.session_id.slice(0, 8),
  };
}
