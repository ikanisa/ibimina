"use client";

import { useEffect, useState } from "react";
import { SmsIngest } from "@/lib/native/sms-ingest";

/**
 * SMS Consent Screen
 *
 * This page displays privacy information and requests user consent for SMS access.
 * It explains:
 * - What SMS messages will be accessed (mobile money only)
 * - How the data will be used (payment allocation)
 * - Where data is stored (Supabase backend)
 * - How to opt-out (settings toggle)
 */
export default function SmsConsentPage() {
  const [isNative, setIsNative] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied">(
    "prompt"
  );
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAvailability = async () => {
      const available = SmsIngest.isAvailable();
      setIsNative(available);

      if (available) {
        // Check current permission status
        const perms = await SmsIngest.checkPermissions();
        setPermissionStatus(perms.state);

        // Check if feature is enabled
        const enabled = await SmsIngest.isEnabled();
        setIsEnabled(enabled);
      }
    };

    checkAvailability();
  }, []);

  const handleRequestPermissions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await SmsIngest.requestPermissions();
      setPermissionStatus(result.state);

      if (result.state === "granted") {
        // Automatically enable after granting permission
        await SmsIngest.enable();
        await SmsIngest.scheduleBackgroundSync(15); // 15-minute intervals
        setIsEnabled(true);
      } else {
        setError("SMS permissions were denied. This feature requires SMS access to function.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request permissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      if (enabled) {
        if (permissionStatus !== "granted") {
          await handleRequestPermissions();
        } else {
          await SmsIngest.enable();
          await SmsIngest.scheduleBackgroundSync(15);
          setIsEnabled(true);
        }
      } else {
        await SmsIngest.disable();
        setIsEnabled(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle SMS ingestion");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isNative) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
          <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            SMS Ingestion Not Available
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            This feature is only available on the native Android app. Please use the mobile app to
            enable SMS-based payment ingestion.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            SMS Payment Ingestion
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Enable automatic payment processing from mobile money SMS notifications
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h2 className="mb-3 text-lg font-semibold text-blue-900 dark:text-blue-100">
            📱 What we access
          </h2>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                <strong>Mobile money SMS only:</strong> We only read messages from MTN MoMo and
                Airtel Money (identified by sender number)
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                <strong>Payment information:</strong> Amount, transaction ID, sender phone number,
                and reference code
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                <strong>No personal SMS:</strong> Your personal messages, contacts, and other SMS
                are never accessed
              </span>
            </li>
          </ul>
        </div>

        {/* How it works */}
        <div className="mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">How it works</h2>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-start">
              <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                1
              </span>
              <p>
                <strong>Background monitoring:</strong> The app checks your SMS inbox every 15
                minutes for new mobile money payment confirmations
              </p>
            </div>
            <div className="flex items-start">
              <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                2
              </span>
              <p>
                <strong>Secure parsing:</strong> Payment details are extracted using AI and sent
                securely to the Supabase backend over HTTPS
              </p>
            </div>
            <div className="flex items-start">
              <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                3
              </span>
              <p>
                <strong>Automatic allocation:</strong> Payments are matched to members based on
                reference codes and allocated to their accounts
              </p>
            </div>
            <div className="flex items-start">
              <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                4
              </span>
              <p>
                <strong>No local storage:</strong> SMS data is not stored on your device; it's
                immediately forwarded and processed on secure servers
              </p>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="mb-6 space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Privacy & Security
          </h2>
          <ul className="list-inside list-disc space-y-1">
            <li>End-to-end HTTPS encryption</li>
            <li>HMAC authentication for all API requests</li>
            <li>Phone numbers are hashed and encrypted before storage</li>
            <li>You can disable this feature anytime in Settings</li>
            <li>
              Full details in our{" "}
              <a href="/privacy" className="text-blue-600 underline dark:text-blue-400">
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Status indicator */}
        <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">SMS Ingestion</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isEnabled ? "Active - scanning for payments" : "Disabled"}
            </p>
          </div>
          <button
            onClick={() => handleToggle(!isEnabled)}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isEnabled ? "bg-green-600" : "bg-gray-300 dark:bg-gray-600"
            } ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Action button */}
        {permissionStatus !== "granted" && (
          <button
            onClick={handleRequestPermissions}
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isLoading ? "Processing..." : "Grant SMS Permission"}
          </button>
        )}

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          By enabling this feature, you consent to the processing of mobile money SMS as described
          above. This feature complies with Android's SMS permission policies for internal
          distribution.
        </p>
      </div>
    </div>
  );
}
