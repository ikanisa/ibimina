"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const POLL_INTERVAL_MS = 2500;

const formatTimeLeft = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.max(0, seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

export function QrLoginPanel() {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "approved" | "expired" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const timeRemaining = useMemo(() => {
    if (!expiresAt) return 0;
    return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  }, [expiresAt]);

  const requestNewToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/qr-auth/session", { method: "POST" });
      const data = await response.json();
      if (!data?.success || !data.token || !data.expiresAt) {
        throw new Error(data?.error ?? "Unable to create QR session");
      }
      setToken(data.token);
      setExpiresAt(new Date(data.expiresAt));
      setStatus("pending");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to start QR login");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void requestNewToken();
  }, [requestNewToken]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    QRCode.toDataURL(token, { width: 320, margin: 1 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? "Unable to render QR code");
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token || status === "approved" || status === "expired") return;
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/qr-auth/poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (!data?.success) {
          setError(data?.error ?? "Polling failed");
          setStatus("error");
          return;
        }

        if (data.status === "expired") {
          setStatus("expired");
          return;
        }

        if (data.status === "approved" && data.session) {
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          setStatus("approved");
          router.push("/");
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Polling failed");
        setStatus("error");
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [router, status, token]);

  useEffect(() => {
    if (!expiresAt || status === "approved" || status === "expired") return;
    const timer = setInterval(() => {
      const remaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
      if (remaining <= 0) {
        setStatus("expired");
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, status]);

  const handleRefresh = () => {
    setToken("");
    setQrDataUrl("");
    setExpiresAt(null);
    setStatus("idle");
    void requestNewToken();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Approve with your phone</p>
          <p className="text-xs text-slate-500">
            Scan the QR code with the mobile app to sign in without typing codes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="rounded-xl border border-dashed border-slate-300 p-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR login code" className="h-64 w-64 rounded-lg bg-white" />
          ) : (
            <div className="flex h-64 w-64 items-center justify-center text-slate-400">
              {isLoading ? "Generating QR..." : "QR not ready"}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500">
          {status === "approved"
            ? "Approved! Finishing sign-in..."
            : status === "expired"
              ? "QR code expired. Please refresh."
              : `Expires in ${formatTimeLeft(timeRemaining)} · One-time use`}
        </p>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
