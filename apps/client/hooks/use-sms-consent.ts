"use client";

import { useCallback, useMemo, useState } from "react";
import {
  cancelSmsUserConsent,
  isSmsUserConsentAvailable,
  requestSmsUserConsent,
  type SmsUserConsentResult,
} from "@/lib/sms/user-consent";
import { trackEvent } from "@/lib/analytics/track";

type ConsentStatus = "idle" | "requesting" | "success" | "error";

interface SmsConsentState {
  status: ConsentStatus;
  result: SmsUserConsentResult | null;
  error: string | null;
  available: boolean;
  requestConsent: () => Promise<void>;
  reset: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  sms_user_consent_unavailable:
    "SMS consent is only available in the Android app. Please continue manually.",
  consent_in_progress: "We are already waiting for a message. Please check the notification bar.",
  activity_unavailable:
    "The activity is not available right now. Please reopen the app and try again.",
  start_failed:
    "We couldn't start the consent flow. Confirm Google Play Services are up to date and retry.",
  timeout: "We didn't detect any SMS in time. You can request the code again and retry.",
  cancelled: "You dismissed the consent dialog. Approve the SMS to auto-fill the code.",
  consent_failed: "Something went wrong while reading the SMS. Please type the code manually.",
  dialog_failed: "We were unable to show the consent dialog. Please try again.",
  unavailable: "SMS consent isn't available on this device. Continue manually for now.",
  intent_missing: "Android did not provide the SMS contents. Please request the code again.",
};

function normaliseError(error: unknown): { code: string; message: string } {
  if (error instanceof Error) {
    const code = error.message.trim();
    const message = ERROR_MESSAGES[code] ?? error.message;
    return { code, message };
  }

  if (typeof error === "string") {
    const trimmed = error.trim();
    return {
      code: trimmed,
      message: ERROR_MESSAGES[trimmed] ?? trimmed,
    };
  }

  return {
    code: "unknown",
    message: "We were unable to read the SMS. Please type the code manually.",
  };
}

export function useSmsConsent(sender?: string | null): SmsConsentState {
  const [status, setStatus] = useState<ConsentStatus>("idle");
  const [result, setResult] = useState<SmsUserConsentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const available = useMemo(() => isSmsUserConsentAvailable(), []);

  const requestConsent = useCallback(async () => {
    if (!available) {
      const message = ERROR_MESSAGES.sms_user_consent_unavailable;
      setError(message);
      setStatus("error");
      trackEvent("sms_consent_unavailable", { sender });
      return;
    }

    setStatus("requesting");
    setError(null);
    setResult(null);
    trackEvent("sms_consent_requested", { sender });

    try {
      const consentResult = await requestSmsUserConsent({ sender: sender ?? null });
      setResult(consentResult);
      setStatus("success");
      trackEvent("sms_consent_granted", {
        sender,
        otpPresent: Boolean(consentResult.otp),
        messageLength: consentResult.message?.length ?? 0,
      });
    } catch (err) {
      const { code, message } = normaliseError(err);
      setStatus("error");
      setError(message);
      trackEvent("sms_consent_failed", { sender, code });
    }
  }, [available, sender]);

  const reset = useCallback(async () => {
    await cancelSmsUserConsent();
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return {
    status,
    result,
    error,
    available,
    requestConsent,
    reset,
  };
}
