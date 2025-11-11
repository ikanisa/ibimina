"use client";

import { useMemo } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { useSmsConsent } from "@/hooks/use-sms-consent";

export interface SmsConsentCardProps {
  senderHint?: string | null;
}

/**
 * Mobile Money SMS consent explainer and action card.
 */
export function SmsConsentCard({ senderHint = null }: SmsConsentCardProps) {
  const { status, error, result, requestConsent, available } = useSmsConsent(senderHint);

  const statusMessage = useMemo(() => {
    switch (status) {
      case "requesting":
        return "Waiting for the Mobile Money SMS...";
      case "success":
        return "SMS received securely. We only read messages you approve.";
      case "error":
        return error ?? "We could not read the SMS.";
      default:
        return "We always request your approval before reading a code from your SMS.";
    }
  }, [status, error]);

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 h-5 w-5 flex-shrink-0 text-atlas-blue" aria-hidden="true" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-neutral-900">SMS Consent for Mobile Money</h3>
          <p className="text-sm text-neutral-700">
            Ibimina follows the Google Play SMS policy. We never scan your inbox in the background.
            When you tap the button below we wait for the next Mobile Money SMS and show an Android
            consent screen. The message is only shared if you approve it.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
            <li>No SEND/RECEIVE/READ_SMS permission is requested.</li>
            <li>Works with MTN MoMo and Airtel Money confirmations.</li>
            <li>You can always decline and type the code manually.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-700">
        <p className="font-semibold text-neutral-800">How it works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Tap the Capture SMS button when you expect a Mobile Money confirmation.</li>
          <li>Android shows a secure system dialog asking if Ibimina may read that single SMS.</li>
          <li>If you approve, the code is filled in automatically and never stored elsewhere.</li>
        </ol>
      </div>

      <button
        type="button"
        onClick={requestConsent}
        disabled={status === "requesting" || !available}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-atlas-blue px-4 py-3 font-semibold text-white transition-colors duration-interactive disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {status === "requesting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Waiting for SMS
          </>
        ) : (
          <>
            <Smartphone className="h-4 w-4" aria-hidden="true" />
            Capture SMS
          </>
        )}
      </button>

      {!available && (
        <p className="text-sm text-neutral-700">
          SMS consent is only available in the Android app. You can still type the code manually.
        </p>
      )}

      <div
        className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
          status === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : status === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-neutral-200 bg-neutral-50 text-neutral-700"
        }`}
      >
        {status === "success" ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
        ) : status === "error" ? (
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
        ) : (
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
        )}
        <div>
          <p className="font-semibold">
            {status === "error" ? "We need your approval" : "Privacy status"}
          </p>
          <p className="mt-1 leading-relaxed">{statusMessage}</p>
          {status === "success" && result?.otp && (
            <p className="mt-2 rounded-lg bg-white px-3 py-2 font-mono text-base font-semibold text-emerald-700">
              OTP: {result.otp}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
