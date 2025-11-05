import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as SMS from "expo-sms";

type ConsentStatus = "idle" | "requested" | "granted" | "denied";

export interface SmsConsentConfig {
  phoneNumber: string;
  consentMessage: string;
}

export interface SmsConsentState {
  status: ConsentStatus;
  requestConsent: () => Promise<ConsentStatus>;
}

export function useSmsConsent(config: SmsConsentConfig): SmsConsentState {
  const statusRef = useRef<ConsentStatus>("idle");

  useEffect(() => {
    statusRef.current = "idle";
  }, [config.phoneNumber, config.consentMessage]);

  async function requestConsent(): Promise<ConsentStatus> {
    if (Platform.OS !== "android") {
      statusRef.current = "granted";
      return statusRef.current;
    }

    statusRef.current = "requested";

    try {
      const response = await SMS.sendSMSAsync(config.phoneNumber, config.consentMessage);
      if (response.result === "sent") {
        statusRef.current = "granted";
      } else if (response.result === "cancelled") {
        statusRef.current = "denied";
      } else {
        statusRef.current = "idle";
      }
    } catch (error) {
      console.error("SMS consent request failed", error);
      statusRef.current = "denied";
    }

    return statusRef.current;
  }

  return {
    get status() {
      return statusRef.current;
    },
    requestConsent,
  } as SmsConsentState;
}
