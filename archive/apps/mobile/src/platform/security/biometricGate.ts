import * as LocalAuthentication from "expo-local-authentication";

export interface BiometricGateOptions {
  reason?: string;
  fallbackLabel?: string;
}

export async function ensureBiometricAccess(options: BiometricGateOptions = {}): Promise<void> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    return;
  }

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) {
    return;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: options.reason ?? "Unlock sensitive information",
    cancelLabel: options.fallbackLabel ?? "Cancel",
    disableDeviceFallback: true,
  });

  if (!result.success) {
    const error = new Error(result.error ?? "Biometric authentication failed");
    error.name = "BiometricGateError";
    throw error;
  }
}
