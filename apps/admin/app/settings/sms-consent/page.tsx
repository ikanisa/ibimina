"use client";

import Link from "next/link";
import { useSmsIngestStatus } from "../sms-ingestion/use-sms-ingest-status";

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "No events recorded";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No events recorded";
  }

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
    return date.toLocaleString();
  }
}

export default function SmsConsentPage() {
  const { data, loading, error, refresh } = useSmsIngestStatus();
  const summary = data?.summary;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          Privacy & compliance
        </p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          SMS ingestion consent
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          SMS access is granted inside the native Android staff app. Review the safeguards below,
          then launch the app to accept or revoke permissions on the device that processes mobile
          money notifications.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          What we collect
        </h2>
        <ul className="mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <li className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/40">
            <p className="font-medium text-slate-800 dark:text-slate-100">
              Mobile money receipts only
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sender filters restrict ingestion to MTN MoMo and Airtel Money confirmations. Personal
              SMS conversations remain untouched.
            </p>
          </li>
          <li className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/40">
            <p className="font-medium text-slate-800 dark:text-slate-100">
              Scoped transaction metadata
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Amount, reference code, and sender MSISDN are parsed to allocate payments. Numbers are
              hashed and encrypted before they are persisted in Supabase.
            </p>
          </li>
          <li className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/40">
            <p className="font-medium text-slate-800 dark:text-slate-100">
              Operational transparency
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Every message and failure is traceable through{" "}
              <code className="font-mono">app.sms_inbox</code> and audit logs so recon teams can
              investigate exceptions.
            </p>
          </li>
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Grant or revoke access
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Permissions are controlled by Android. Open the SACCO+ app on your staff device to manage
          consent.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link
            href="ibimina://staff/sms-consent"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Open consent flow in app
          </Link>
          <Link
            href="https://staff.ibimina.rw/native"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-300 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
          >
            Download Android build ↗
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Tip: keep the app in the "Unrestricted" battery mode on Android so background ingestion
          continues when the screen is off.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Supabase audit trail
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Key timestamps sourced from ingestion telemetry help confirm permissions are still
              honoured on the paired device.
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void refresh()}
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
          <dl className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-700/70 dark:bg-slate-900/40">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Last SMS processed
              </dt>
              <dd className="mt-1 text-base text-slate-800 dark:text-slate-100">
                {summary?.lastMessageAt
                  ? `${new Date(summary.lastMessageAt).toLocaleString()} · ${formatTimestamp(summary.lastMessageAt)}`
                  : "No SMS processed yet"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-700/70 dark:bg-slate-900/40">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Last failure
              </dt>
              <dd className="mt-1 text-base text-slate-800 dark:text-slate-100">
                {summary?.lastFailureAt
                  ? `${new Date(summary.lastFailureAt).toLocaleString()} · ${formatTimestamp(summary.lastFailureAt)}${summary.lastFailureError ? ` · ${summary.lastFailureError}` : ""}`
                  : "No recent failures"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-700/70 dark:bg-slate-900/40">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Ingestion signals
              </dt>
              <dd className="mt-1 text-base text-slate-800 dark:text-slate-100">
                {summary
                  ? `${summary.ingestEventsTotal.toLocaleString()} total events · last heartbeat ${formatTimestamp(summary.ingestEventsLastAt)}`
                  : "Telemetry loading"}
              </dd>
            </div>
            {data?.generatedAt && (
              <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 text-xs text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-300">
                Snapshot generated {new Date(data.generatedAt).toLocaleString()} ·{" "}
                {formatTimestamp(data.generatedAt)}
                {data.saccoId ? ` · sacco ${data.saccoId}` : ""}
              </div>
            )}
          </dl>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Your rights</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
          <li>
            Disable ingestion at any time inside the Android app—Supabase stops collecting SMS
            immediately.
          </li>
          <li>
            Request a data export from operations; every ingested SMS retains the raw text for
            auditability.
          </li>
          <li>
            Escalate privacy concerns via{" "}
            <a
              href="mailto:security@ibimina.rw"
              className="text-emerald-600 underline hover:text-emerald-500"
            >
              security@ibimina.rw
            </a>
            .
          </li>
        </ul>
      </section>
    </div>
  );
}
