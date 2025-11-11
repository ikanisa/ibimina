"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSmsIngestStatus } from "./use-sms-ingest-status";

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "No SMS processed yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No SMS processed yet";
  }

  const relative = (() => {
    try {
      const diffMs = date.getTime() - Date.now();
      const minutes = Math.round(diffMs / 60000);
      const hours = Math.round(diffMs / 3600000);
      const days = Math.round(diffMs / 86400000);
      const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

      if (Math.abs(minutes) < 60) {
        return formatter.format(minutes, "minute");
      }
      if (Math.abs(hours) < 24) {
        return formatter.format(hours, "hour");
      }
      return formatter.format(days, "day");
    } catch {
      return null;
    }
  })();

  return [date.toLocaleString(), relative].filter(Boolean).join(" · ");
}

export default function SmsIngestionSettingsPage() {
  const { data, loading, error, refresh } = useSmsIngestStatus();

  const summary = data?.summary;

  const metrics = useMemo(
    () => [
      {
        label: "Processed today",
        value: summary ? summary.processedToday.toLocaleString() : "—",
        description: "Count of SMS received since midnight",
      },
      {
        label: "Pending review",
        value: summary ? summary.pendingMessages.toLocaleString() : "—",
        description: "SMS awaiting reconciliation",
      },
      {
        label: "Failures today",
        value: summary ? summary.failedToday.toLocaleString() : "—",
        description: "Check recon exceptions for details",
      },
      {
        label: "Total captured",
        value: summary ? summary.totalMessages.toLocaleString() : "—",
        description: "All SMS stored in Supabase",
      },
    ],
    [summary]
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          Staff operations
        </p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          SMS ingestion hand-off
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          These controls are now managed inside the Android staff app. Use the links below to
          install the native experience and review ingestion health sourced from Supabase telemetry.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Get the SACCO+ Android app
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Install the native client on the device that receives mobile money notifications, then
            use the deep link to jump directly into the SMS automation setup.
          </p>

          <ol className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
                1
              </span>
              <div>
                <p className="font-medium">Download the latest staff build</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Use the internal distribution link to install the APK on your Android handset.
                </p>
                <Link
                  href="https://staff.ibimina.rw/native"
                  className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-300 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open download portal ↗
                </Link>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
                2
              </span>
              <div>
                <p className="font-medium">Sign in with your staff account</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  The app mirrors the web dashboard—your existing credentials and MFA policies
                  apply.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
                3
              </span>
              <div>
                <p className="font-medium">Deep link into SMS automation</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Open this page from your Android device to hand off configuration to the native
                  module.
                </p>
                <Link
                  href="ibimina://staff/sms-ingestion"
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Launch in SACCO+ app
                </Link>
              </div>
            </li>
          </ol>
        </section>

        <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Supabase telemetry snapshot
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Reconciles live ingestion activity stored in the{" "}
                <code className="font-mono text-xs">app.sms_inbox</code> table.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500"
            >
              {loading ? "Refreshing…" : "Refresh status"}
            </button>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
              {error}
            </p>
          ) : (
            <>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                {metrics.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-200/70 p-4 dark:border-slate-700/70"
                  >
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      {item.value}
                    </dd>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                ))}
              </dl>

              <div className="mt-6 space-y-3 rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 text-xs text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-300">
                <p>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Last SMS:
                  </span>{" "}
                  {formatTimestamp(summary?.lastMessageAt ?? null)}
                  {summary?.lastMessageStatus ? ` · status ${summary.lastMessageStatus}` : ""}
                </p>
                <p>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Last failure:
                  </span>{" "}
                  {summary?.lastFailureAt
                    ? formatTimestamp(summary.lastFailureAt)
                    : "No recent failures"}
                  {summary?.lastFailureError ? ` · ${summary.lastFailureError}` : ""}
                </p>
                <p>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Ingest metrics:
                  </span>{" "}
                  {summary
                    ? `${summary.ingestEventsTotal.toLocaleString()} total events · ${formatTimestamp(summary.ingestEventsLastAt)}`
                    : "Loading…"}
                </p>
                {data?.generatedAt && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Snapshot generated {formatTimestamp(data.generatedAt)}
                    {data.saccoId ? ` · filtered to sacco ${data.saccoId}` : ""}
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Operational checklist
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
          <li>
            Confirm the Android device remains unlocked daily; WorkManager will fall back to hourly
            sync if live listeners are paused.
          </li>
          <li>
            Audit reconciliation queues whenever failures spike—each failed SMS links back to the
            originating row in Supabase.
          </li>
          <li>
            Coordinate SIM swaps with operations so the device receiving mobile money SMS stays in
            sync with the web console.
          </li>
        </ul>
      </section>
    </div>
  );
}
