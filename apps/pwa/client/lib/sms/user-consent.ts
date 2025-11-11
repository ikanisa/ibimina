import { Capacitor, registerPlugin } from "@capacitor/core";

export interface SmsUserConsentResult {
  message: string | null;
  otp: string | null;
  receivedAt: number;
}

export interface SmsUserConsentPlugin {
  request(options?: { sender?: string | null }): Promise<SmsUserConsentResult>;
  cancel(): Promise<void>;
}

const isNative = typeof window !== "undefined" && Capacitor.isNativePlatform();

const smsUserConsentPlugin = isNative
  ? registerPlugin<SmsUserConsentPlugin>("SmsUserConsent")
  : null;

/**
 * Whether the native SMS User Consent plugin can be invoked on this platform.
 */
export function isSmsUserConsentAvailable(): boolean {
  return Boolean(smsUserConsentPlugin);
}

/**
 * Request SMS user consent. Throws when the platform does not support the
 * native plugin or when the member denies consent.
 */
export async function requestSmsUserConsent(options?: {
  sender?: string | null;
}): Promise<SmsUserConsentResult> {
  if (!smsUserConsentPlugin) {
    throw new Error("sms_user_consent_unavailable");
  }

  const result = await smsUserConsentPlugin.request(options ?? {});
  return {
    message: result.message ?? null,
    otp: result.otp ?? null,
    receivedAt: result.receivedAt,
  };
}

/**
 * Attempt to cancel any pending consent flow.
 */
export async function cancelSmsUserConsent(): Promise<void> {
  if (!smsUserConsentPlugin) {
    return;
  }

  await smsUserConsentPlugin.cancel();
}
