export interface SmsUserConsentResult {
  message: string | null;
  otp: string | null;
  receivedAt: number;
}

/**
 * Whether the native SMS User Consent plugin can be invoked on this platform.
 */
export function isSmsUserConsentAvailable(): boolean {
  return typeof window !== "undefined";
}

/**
 * Request SMS user consent. Throws when the platform does not support the
 * native plugin or when the member denies consent.
 */
export async function requestSmsUserConsent(options?: {
  sender?: string | null;
}): Promise<SmsUserConsentResult> {
  if (typeof window === "undefined") {
    throw new Error("sms_user_consent_unavailable");
  }

  const promptMessage = options?.sender
    ? `Enter the SMS message received from ${options.sender || "your provider"}`
    : "Enter the SMS message content";

  const response = window.prompt(promptMessage);
  if (response === null) {
    throw "cancelled";
  }

  const otpMatch = response.match(/\b(\d{4,8})\b/);

  return {
    message: response,
    otp: otpMatch ? otpMatch[1] : null,
    receivedAt: Date.now(),
  };
}

/**
 * Attempt to cancel any pending consent flow.
 */
export async function cancelSmsUserConsent(): Promise<void> {
  // Nothing to cancel in the browser stub. Method kept for API parity.
}
