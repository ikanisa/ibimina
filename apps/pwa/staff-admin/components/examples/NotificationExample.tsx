"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle, Info, XCircle } from "lucide-react";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

interface NotificationPreview {
  title: string;
  body: string;
  channel: "transactions" | "alerts" | "messages";
  timestamp: string;
}

function resolveInitialPermission(): PermissionState {
  if (typeof window === "undefined" || typeof window.Notification === "undefined") {
    return "unsupported";
  }
  return window.Notification.permission;
}

export function NotificationExample() {
  const [permission, setPermission] = useState<PermissionState>(() => resolveInitialPermission());
  const [preview, setPreview] = useState<NotificationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.Notification === "undefined") {
      setPermission("unsupported");
    }
  }, []);

  const requestPermission = async () => {
    setError(null);
    if (typeof window === "undefined" || typeof window.Notification === "undefined") {
      setPermission("unsupported");
      setError("Browser notifications are not supported in this environment.");
      return;
    }

    try {
      const result = await window.Notification.requestPermission();
      setPermission(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request permission");
    }
  };

  const simulateNotification = (channel: NotificationPreview["channel"]) => {
    setError(null);
    const timestamp = new Date().toLocaleTimeString();
    switch (channel) {
      case "transactions":
        setPreview({
          title: "Payment captured",
          body: "Jean Doe deposited RWF 50,000",
          channel,
          timestamp,
        });
        break;
      case "alerts":
        setPreview({
          title: "Reconciliation required",
          body: "3 SMS failed parsing in the last hour",
          channel,
          timestamp,
        });
        break;
      default:
        setPreview({
          title: "Message queued",
          body: "Weekly SACCO digest ready for review",
          channel,
          timestamp,
        });
        break;
    }
  };

  const clearPreview = () => {
    setPreview(null);
  };

  const permissionBadge = (() => {
    switch (permission) {
      case "granted":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
            <CheckCircle className="h-3.5 w-3.5" /> Allowed
          </span>
        );
      case "denied":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
            <XCircle className="h-3.5 w-3.5" /> Denied
          </span>
        );
      case "unsupported":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Info className="h-3.5 w-3.5" /> Not available
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
            <Bell className="h-3.5 w-3.5" /> Requires approval
          </span>
        );
    }
  })();

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-emerald-600" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Notification hand-off demo
          </h2>
        </div>
        {permissionBadge}
      </div>

      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Native push notifications ship with the Android staff app. This playground mirrors the
        channels and messaging we send when ingestion events occur.
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={requestPermission}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-300 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
        >
          Request browser permission
        </button>
        <button
          type="button"
          onClick={() => simulateNotification("transactions")}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Simulate payment alert
        </button>
        <button
          type="button"
          onClick={() => simulateNotification("alerts")}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400"
        >
          Simulate exception alert
        </button>
        <button
          type="button"
          onClick={clearPreview}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500"
        >
          Clear preview
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {preview ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Preview channel · {preview.channel}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {preview.title}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{preview.body}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Generated at {preview.timestamp}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            <Info className="h-4 w-4" /> Trigger one of the simulations above to view the
            notification copy we mirror on Android.
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
        <p className="font-semibold text-slate-700 dark:text-slate-200">Production behaviour</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Push channels are backed by the native notification service on Android—no browser
            permission required.
          </li>
          <li>
            Ingestion failures surface via the alerts channel with actionable deep links into the
            reconciliation queue.
          </li>
          <li>
            Opt-out respects Android system settings; disabling notifications on the device
            immediately silences alerts.
          </li>
        </ul>
      </div>
    </div>
  );
}
