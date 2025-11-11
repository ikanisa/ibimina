/**
 * Biometric Enrollment Prompt Component
 *
 * Prompts users to enable biometric authentication after WhatsApp OTP login
 * This provides faster, more secure access for subsequent logins
 */

"use client";

import { useState } from "react";
import { Fingerprint, X } from "lucide-react";
import { deviceAuthManager } from "@/lib/device-auth";
import { createClient } from "@/lib/supabase/client";

const getDeviceModel = (): string => {
  if (typeof navigator === "undefined") return "Unknown Device";

  const ua = navigator.userAgent;

  if (/Android/i.test(ua)) {
    const match = ua.match(/Android[^;]+;([^)]+)\)/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return "Android Device";
  }

  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/iPod/i.test(ua)) return "iPod";

  return "Mobile Device";
};

interface BiometricEnrollmentPromptProps {
  userId: string;
  onComplete?: (enrolled: boolean) => void;
  onDismiss?: () => void;
}

export function BiometricEnrollmentPrompt({
  userId,
  onComplete,
  onDismiss,
}: BiometricEnrollmentPromptProps) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnroll = async () => {
    setIsEnrolling(true);
    setError(null);

    try {
      // Check if biometric hardware is available
      const biometricStatus = await deviceAuthManager.checkBiometricAvailable();

      if (!biometricStatus.available) {
        setError(biometricStatus.message);
        setIsEnrolling(false);
        return;
      }

      // Get device name (can be customized by user later)
      const deviceName = `${getDeviceModel()} - ${new Date().toLocaleDateString()}`;

      // Enroll device
      const result = await deviceAuthManager.enrollDevice(userId, deviceName, null);

      if (!result.success) {
        setError(result.error || "Failed to enroll device");
        setIsEnrolling(false);
        return;
      }

      // Update user profile to mark biometric as enabled
      const supabase = createClient();
      await supabase
        .from("members_app_profiles")
        .update({
          biometric_enabled: true,
          biometric_enrolled_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      // Success
      if (onComplete) {
        onComplete(true);
      }
    } catch (err) {
      console.error("Biometric enrollment error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsEnrolling(false);
    }
  };

  const handleSkip = () => {
    if (onDismiss) {
      onDismiss();
    }
    if (onComplete) {
      onComplete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-9 border border-neutral-2/30 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-br from-rw-blue/20 to-transparent">
          <button
            onClick={handleSkip}
            disabled={isEnrolling}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-neutral-8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-neutral-1" />
          </button>

          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-4 bg-rw-blue/20 rounded-full">
              <Fingerprint className="h-12 w-12 text-rw-blue" />
            </div>
            <h2 className="text-xl font-bold text-neutral-0">Enable Biometric Login</h2>
            <p className="text-sm text-neutral-1">
              Use your fingerprint or face to log in faster and more securely
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Benefits */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-1">Benefits:</h3>
            <ul className="space-y-2 text-sm text-neutral-2">
              <li className="flex items-start gap-2">
                <span className="text-rw-blue mt-1">✓</span>
                <span>Skip entering OTP codes for future logins</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rw-blue mt-1">✓</span>
                <span>More secure than passwords alone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rw-blue mt-1">✓</span>
                <span>Works even offline</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rw-blue mt-1">✓</span>
                <span>Your biometric data never leaves your device</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleEnroll}
              disabled={isEnrolling}
              className={`w-full px-6 py-3 text-base font-semibold rounded-xl transition-all ${
                isEnrolling
                  ? "bg-neutral-2/30 text-neutral-2 cursor-not-allowed"
                  : "bg-rw-blue text-ink hover:bg-opacity-90"
              }`}
            >
              {isEnrolling ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Setting up...
                </span>
              ) : (
                "Enable Biometric Login"
              )}
            </button>

            <button
              onClick={handleSkip}
              disabled={isEnrolling}
              className="w-full px-6 py-3 text-base font-medium text-neutral-1 bg-transparent hover:bg-neutral-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Maybe Later
            </button>
          </div>

          {/* Privacy Notice */}
          <p className="text-xs text-center text-neutral-3 pt-2">
            You can enable or disable this feature anytime in your profile settings
          </p>
        </div>
      </div>
    </div>
  );
}
