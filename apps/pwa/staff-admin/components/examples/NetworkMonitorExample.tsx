"use client";

import { useEffect, useMemo, useState } from "react";
import { Globe2, Smartphone, Wifi, WifiOff } from "lucide-react";

interface BrowserNetworkStatus {
  connected: boolean;
  connectionType: string;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean | null;
  lastUpdated: string;
}

function readNavigatorStatus(): BrowserNetworkStatus {
  const connection =
    typeof navigator !== "undefined"
      ? (navigator as Navigator & { connection?: any }).connection
      : null;
  const now = new Date().toISOString();
  return {
    connected: typeof navigator !== "undefined" ? navigator.onLine : true,
    connectionType:
      connection?.type ??
      (typeof navigator !== "undefined" ? (navigator.onLine ? "online" : "offline") : "unknown"),
    effectiveType: connection?.effectiveType ?? null,
    downlink: typeof connection?.downlink === "number" ? connection.downlink : null,
    rtt: typeof connection?.rtt === "number" ? connection.rtt : null,
    saveData: typeof connection?.saveData === "boolean" ? connection.saveData : null,
    lastUpdated: now,
  };
}

export function NetworkMonitorExample() {
  const [status, setStatus] = useState<BrowserNetworkStatus>(() => readNavigatorStatus());
  const [history, setHistory] = useState<BrowserNetworkStatus[]>([]);

  useEffect(() => {
    const update = () => {
      setStatus((prev) => {
        const next = readNavigatorStatus();
        setHistory((existing) => [next, ...existing].slice(0, 5));
        return { ...prev, ...next };
      });
    };

    update();

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    const connection = (navigator as Navigator & { connection?: any }).connection;
    const unsubscribe =
      typeof connection?.addEventListener === "function"
        ? (() => {
            connection.addEventListener("change", update);
            return () => connection.removeEventListener("change", update);
          })()
        : null;

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      unsubscribe?.();
    };
  }, []);

  const icon = useMemo(() => {
    if (!status.connected) {
      return <WifiOff className="h-8 w-8 text-rose-600" aria-hidden="true" />;
    }
    if (status.connectionType === "wifi") {
      return <Wifi className="h-8 w-8 text-emerald-600" aria-hidden="true" />;
    }
    if (status.connectionType === "cellular") {
      return <Smartphone className="h-8 w-8 text-sky-600" aria-hidden="true" />;
    }
    return <Globe2 className="h-8 w-8 text-slate-500" aria-hidden="true" />;
  }, [status.connectionType, status.connected]);

  const formatThroughput = (value: number | null) => {
    if (value == null || Number.isNaN(value)) {
      return "n/a";
    }
    if (value >= 1) {
      return `${value.toFixed(1)} Mbps`;
    }
    return `${(value * 1000).toFixed(0)} Kbps`;
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Network telemetry
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Browser-provided connectivity signals mirror what the Android native bridge shares with
            the staff dashboard.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200/70 p-4 dark:border-slate-700/70">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Connection
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {status.connected ? "Online" : "Offline"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {status.connectionType ?? "unknown"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/70 p-4 dark:border-slate-700/70">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Effective type
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {status.effectiveType ?? "n/a"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reported by Navigator.connection
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/70 p-4 dark:border-slate-700/70">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Downlink
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {formatThroughput(status.downlink)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Estimated bandwidth</p>
        </div>
        <div className="rounded-xl border border-slate-200/70 p-4 dark:border-slate-700/70">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Latency
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {status.rtt != null ? `${status.rtt.toFixed(0)} ms` : "n/a"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Round-trip time</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
        <p className="font-semibold text-slate-700 dark:text-slate-200">Data saver</p>
        <p>{status.saveData ? "Enabled" : "Disabled or unavailable"}</p>
        <p className="mt-2">Last updated {new Date(status.lastUpdated).toLocaleTimeString()}</p>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent changes</h3>
        {history.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Interact with the browser (toggle offline mode) to record events.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            {history.map((entry, index) => (
              <li
                key={`${entry.lastUpdated}-${index}`}
                className="rounded-lg border border-slate-200/70 bg-white p-3 dark:border-slate-700/70 dark:bg-slate-900/40"
              >
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {new Date(entry.lastUpdated).toLocaleTimeString()}
                </span>
                {" · "}
                {entry.connected ? `online via ${entry.connectionType}` : "offline"}
                {entry.effectiveType ? ` (${entry.effectiveType})` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          How the native bridge extends this
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Android reports metered vs. unmetered SIMs so ingestion can pause on high-cost networks.
          </li>
          <li>
            Connectivity events are mirrored into Supabase analytics to correlate with SMS
            drop-offs.
          </li>
          <li>
            Offline detection powers the staff console banner informing operators when their handset
            lost service.
          </li>
        </ul>
      </div>
    </div>
  );
}
