"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Loader2, RefreshCw, Smartphone, Shield, AlertCircle } from "lucide-react";

interface QRLoginProps {
  onSuccess?: (data: { user_id: string; device_id: string; session_id: string }) => void;
  onError?: (error: string) => void;
}

interface ChallengeData {
  ver: number;
  session_id: string;
  origin: string;
  nonce: string;
  exp: number;
  aud: string;
}

interface ChallengeResponse {
  success: boolean;
  challenge: ChallengeData;
  session_id: string;
  expires_at: string;
}

interface VerifyResponse {
  success: boolean;
  user_id?: string;
  device_id?: string;
  session_id?: string;
  device_label?: string;
  message?: string;
  error?: string;
}

export function QRLogin({ onSuccess, onError }: QRLoginProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [_sessionId, setSessionId] = useState<string>("");
  const [_expiresAt, setExpiresAt] = useState<string>("");
  const [status, setStatus] = useState<
    "idle" | "generating" | "waiting" | "verifying" | "success" | "error" | "expired"
  >("idle");
  const [error, setError] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const expiryTimerRef = useRef<NodeJS.Timeout | null>(null);

  const generateQRChallenge = async () => {
    try {
      setStatus("generating");
      setError("");

      const response = await fetch("/api/device-auth/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate QR challenge");
      }

      const data: ChallengeResponse = await response.json();

      const qrPayload = JSON.stringify(data.challenge);
      const qrUrl = await QRCode.toDataURL(qrPayload, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setQrDataUrl(qrUrl);
      setSessionId(data.session_id);
      setExpiresAt(data.expires_at);
      setStatus("waiting");

      const expiryTime = new Date(data.expires_at).getTime();
      const now = Date.now();
      setTimeRemaining(Math.max(0, Math.floor((expiryTime - now) / 1000)));

      startPolling(data.session_id);
      startExpiryTimer(expiryTime);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate QR code";
      setError(errorMessage);
      setStatus("error");
      onError?.(errorMessage);
    }
  };

  const startPolling = (sessionId: string) => {
    stopPolling();

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/device-auth/verify-status?session_id=${sessionId}`, {
          method: "GET",
        });

        if (response.ok) {
          const data: VerifyResponse = await response.json();

          if (data.success && data.user_id) {
            setStatus("success");
            stopPolling();
            stopExpiryTimer();

            onSuccess?.({
              user_id: data.user_id,
              device_id: data.device_id || "",
              session_id: data.session_id || sessionId,
            });

            window.location.href = "/";
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
  };

  const startExpiryTimer = (expiryTime: number) => {
    stopExpiryTimer();

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setStatus("expired");
        stopPolling();
        stopExpiryTimer();
      } else {
        expiryTimerRef.current = setTimeout(updateTimer, 1000);
      }
    };

    updateTimer();
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const stopExpiryTimer = () => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  };

  const handleRetry = () => {
    stopPolling();
    stopExpiryTimer();
    setQrDataUrl("");
    setSessionId("");
    setError("");
    setStatus("idle");
    generateQRChallenge();
  };

  useEffect(() => {
    generateQRChallenge();

    return () => {
      stopPolling();
      stopExpiryTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "generating") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-atlas-blue" />
        <p className="text-sm text-neutral-11">Generating secure QR code...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <div className="rounded-full bg-red-100 p-3">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-neutral-12">Error</h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 rounded-lg bg-atlas-blue px-4 py-2 text-sm font-medium text-white hover:bg-atlas-blue/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <div className="rounded-full bg-amber-100 p-3">
          <AlertCircle className="h-8 w-8 text-amber-600" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-neutral-12">QR Code Expired</h3>
          <p className="text-sm text-neutral-11">
            This QR code has expired. Generate a new one to continue.
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 rounded-lg bg-atlas-blue px-4 py-2 text-sm font-medium text-white hover:bg-atlas-blue/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Generate New QR Code
        </button>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <div className="rounded-full bg-green-100 p-3">
          <Shield className="h-8 w-8 text-green-600" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-neutral-12">Authentication Successful!</h3>
          <p className="text-sm text-neutral-11">Redirecting to dashboard...</p>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-atlas-blue" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-8">
      <div className="flex items-center gap-2 text-atlas-blue">
        <Smartphone className="h-6 w-6" />
        <h2 className="text-lg font-semibold">Biometric Login</h2>
      </div>

      <div className="space-y-4 text-center">
        <p className="text-sm text-neutral-11">
          Scan this QR code with your Staff Mobile App to sign in securely using your fingerprint or
          face.
        </p>
      </div>

      {qrDataUrl && (
        <div className="relative">
          <div className="rounded-2xl border-4 border-atlas-blue/20 bg-white p-4 shadow-atlas">
            <img src={qrDataUrl} alt="QR Login Code" className="h-[300px] w-[300px]" />
          </div>

          {status === "waiting" && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-neutral-11">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for mobile app... ({timeRemaining}s)</span>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg bg-neutral-3 p-4 space-y-2 max-w-md">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-atlas-blue flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-neutral-12">Secure Authentication</p>
            <ul className="space-y-1 text-neutral-11 list-disc list-inside">
              <li>Biometric-gated device signing</li>
              <li>Phishing-resistant authentication</li>
              <li>Zero password exposure</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        onClick={handleRetry}
        className="text-sm text-atlas-blue hover:underline"
        type="button"
      >
        Generate New QR Code
      </button>
    </div>
  );
}
