/**
 * Example: Integrating Deep Links in your React App
 *
 * This file shows how to integrate the deep link handler in your application.
 * Place this logic in your root layout or app component.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  registerDeepLinkHandler,
  checkInitialDeepLink,
  type DeepLinkRoute,
} from "@/lib/deep-links";

export function DeepLinkProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Handler function for deep links
    const handleDeepLink = (route: DeepLinkRoute) => {
      // eslint-disable-next-line ibimina/structured-logging
      console.log("Handling deep link:", route);

      switch (route.type) {
        case "join":
          // Navigate to group join page
          router.push(`/groups/join/${route.groupId}`);
          break;

        case "invite":
          // Navigate to invite acceptance page
          router.push(`/invite/${route.token}`);
          break;

        case "group":
          // Navigate to group details page
          router.push(`/groups/${route.id}`);
          break;

        case "pay":
          // Navigate to payment page
          router.push("/pay");
          break;

        case "statements":
          // Navigate to statements page
          router.push("/statements");
          break;

        case "profile":
          // Navigate to profile page
          router.push("/profile");
          break;

        case "home":
          // Navigate to home page
          router.push("/");
          break;

        case "unknown":
          // Log unknown URL for debugging
          console.warn("Unknown deep link:", route.url);
          // Optionally show a toast notification
          break;
      }
    };

    // Register listener for incoming deep links
    const cleanup = registerDeepLinkHandler(handleDeepLink);

    // Check if app was opened via deep link
    checkInitialDeepLink(handleDeepLink);

    // Cleanup on unmount
    return cleanup;
  }, [router]);

  return <>{children}</>;
}

/**
 * Example: Using Deep Links in a Component
 *
 * Generate and share deep links from any component.
 */

import { generateDeepLink } from "@/lib/deep-links";

export function GroupInviteButton({ groupId }: { groupId: string }) {
  const canUseWebShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleShare = async () => {
    try {
      const link = generateDeepLink({ type: "join", groupId });

      if (canUseWebShare) {
        await navigator.share({
          title: "Join our savings group",
          text: "You've been invited to join our group on Ibimina",
          url: link,
        });
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        alert("Invite link copied to clipboard");
        return;
      }

      prompt("Copy this invite link", link);
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  return (
    <button onClick={handleShare} className="btn-primary">
      Invite Members
    </button>
  );
}

/**
 * Example: MoMo Notification Listener Integration
 *
 * Listen for MoMo payment notifications in your app.
 */

import { useEffect, useState } from "react";

const MOMO_EVENT = "ibimina:momo-notification";

export function PaymentDetectionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ text: string; source: string; timestamp: number }>)
        .detail;
      // eslint-disable-next-line ibimina/structured-logging
      console.log("Payment notification received:", detail);
    };

    window.addEventListener(MOMO_EVENT, listener as EventListener);

    return () => {
      window.removeEventListener(MOMO_EVENT, listener as EventListener);
    };
  }, []);

  return <>{children}</>;
}

export function RequestNotificationPermission() {
  const handleRequest = async () => {
    alert("Payment detection permissions are managed by the native mobile app.");
  };

  return (
    <div className="card">
      <h2>Enable Payment Detection</h2>
      <p>
        To automatically detect your MoMo payments, the native mobile app listens for SMS or push
        notifications. In the web app you can still trigger the demo by dispatching a custom{" "}
        <code>ibimina:momo-notification</code> event.
      </p>
      <button onClick={handleRequest} className="btn-primary">
        Enable Payment Detection
      </button>
    </div>
  );
}

/**
 * Example: SMS User Consent Integration
 *
 * Use the SMS User Consent API when user taps "I've paid".
 *
 * Note: The SMS User Consent module (@/lib/sms/user-consent) already exists
 * in the repository at lib/sms/user-consent.ts. This example shows how to use it.
 */

import { requestSmsUserConsent } from "@/lib/sms/user-consent";
import { useState } from "react";

export function ManualPaymentCapture() {
  const [loading, setLoading] = useState(false);
  const [smsContent, setSmsContent] = useState<string | null>(null);

  const handleCaptureSms = async () => {
    setLoading(true);
    try {
      // Start SMS User Consent
      const result = await requestSmsUserConsent({ sender: null });

      // eslint-disable-next-line ibimina/structured-logging
      console.log("SMS received:", result.message);
      // eslint-disable-next-line ibimina/structured-logging
      console.log("OTP extracted:", result.otp);

      setSmsContent(result.message);

      // TODO: Post to Edge Function for processing
      // await postSmsToEdge(result.message);

      // Show success message
      alert("Payment captured successfully!");
    } catch (error) {
      if (error === "cancelled") {
        // eslint-disable-next-line ibimina/structured-logging
        console.log("User cancelled SMS consent");
      } else if (error === "timeout") {
        // eslint-disable-next-line ibimina/structured-logging
        console.log("No SMS received in 5 minutes");
        alert("No payment SMS received. Please try again.");
      } else {
        console.error("SMS capture failed:", error);
        alert("Failed to capture payment SMS");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Manual Payment Capture</h2>
      <p>If automatic detection didn&apos;t work, you can manually capture your payment SMS.</p>

      <button onClick={handleCaptureSms} disabled={loading} className="btn-primary">
        {loading ? "Waiting for SMS..." : "I've Paid - Capture SMS"}
      </button>

      {smsContent && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="text-sm font-mono">{smsContent}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Root Layout Integration
 *
 * Add these providers to your root layout.
 */

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DeepLinkProvider>
          <PaymentDetectionProvider>{children}</PaymentDetectionProvider>
        </DeepLinkProvider>
      </body>
    </html>
  );
}
