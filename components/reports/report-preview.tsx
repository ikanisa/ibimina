"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/providers/i18n-provider";
import { useToast } from "@/providers/toast-provider";
import type { ReportExportFilters } from "@/components/reports/report-export-panel";

const supabase = getSupabaseBrowserClient();
const ACTIVE_STATUSES = new Set(["POSTED", "SETTLED"]);
const DEFAULT_WINDOW_DAYS = 30;
const MAX_BARS = 14;

export interface ReportPreviewSummary {
  currency: string;
  totalAmount: number;
  totalTransactions: number;
  uniqueIkimina: number;
}

interface ReportPreviewProps {
  filters: ReportExportFilters;
  onSummaryChange?: (summary: ReportPreviewSummary | null) => void;
}

interface ReportPreviewData extends ReportPreviewSummary {
  topIkimina: Array<{
    id: string;
    name: string;
    code: string;
    amount: number;
    transactionCount: number;
  }>;
  dailyTotals: Array<{
    date: string;
    amount: number;
  }>;
}

type PaymentRow = {
  id: string;
  sacco_id: string | null;
  amount: number;
  currency: string | null;
  status: string;
  occurred_at: string;
  ikimina_id: string | null;
  group: { id: string; name: string | null; code: string | null } | null;
};

function toDateStart(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function toDateEnd(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ReportPreview({ filters, onSummaryChange }: ReportPreviewProps) {
  const { t } = useTranslation();
  const { error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<ReportPreviewData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      setLoading(true);
      setErrorMessage(null);
      onSummaryChange?.(null);

      const now = new Date();
      const defaultStart = new Date(now.getTime() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

      const startDate = filters.from ? new Date(`${filters.from}T00:00:00`) : defaultStart;
      const endDate = filters.to ? new Date(`${filters.to}T00:00:00`) : now;

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        setErrorMessage(t("reports.errors.invalidDates", "Invalid date filters"));
        setData(null);
        setLoading(false);
        return;
      }

      if (startDate > endDate) {
        setErrorMessage(t("reports.errors.startBeforeEnd", "Start date must be before end date"));
        setData(null);
        setLoading(false);
        return;
      }

      const startIso = toDateStart(startDate).toISOString();
      const endIso = toDateEnd(endDate).toISOString();

      let query = supabase
        .from("payments")
        .select("id, sacco_id, amount, currency, status, occurred_at, ikimina_id, group:ibimina(id, name, code)")
        .gte("occurred_at", startIso)
        .lte("occurred_at", endIso)
        .order("occurred_at", { ascending: false })
        .limit(2000);

      if (filters.sacco?.id) {
        query = query.eq("sacco_id", filters.sacco.id);
      }

      const { data: rows, error } = await query;
      if (cancelled) return;

      if (error) {
        const message = error.message ?? t("reports.errors.loadFailed", "Failed to load preview");
        setErrorMessage(message);
        setData(null);
        toastError(message);
        setLoading(false);
        return;
      }

      const payments = (rows as PaymentRow[] | null) ?? [];
      const posted = payments.filter((row) => ACTIVE_STATUSES.has(row.status));

      if (posted.length === 0) {
        setData(null);
        onSummaryChange?.({
          currency: "RWF",
          totalAmount: 0,
          totalTransactions: 0,
          uniqueIkimina: 0,
        });
        setLoading(false);
        return;
      }

      const currency = posted[0]?.currency ?? "RWF";
      let totalAmount = 0;
      let totalTransactions = 0;
      const groupTotals = new Map<string, { name: string; code: string; amount: number; count: number }>();
      const dailyTotals = new Map<string, number>();

      for (const payment of posted) {
        totalAmount += payment.amount;
        totalTransactions += 1;

        const groupId = payment.ikimina_id ?? "unassigned";
        const groupEntry = groupTotals.get(groupId) ?? {
          name: payment.group?.name ?? "Unassigned",
          code: payment.group?.code ?? "—",
          amount: 0,
          count: 0,
        };
        groupEntry.amount += payment.amount;
        groupEntry.count += 1;
        groupTotals.set(groupId, groupEntry);

        const dayKey = payment.occurred_at.slice(0, 10);
        dailyTotals.set(dayKey, (dailyTotals.get(dayKey) ?? 0) + payment.amount);
      }

      const uniqueIkimina = Array.from(groupTotals.keys()).filter((id) => id !== "unassigned").length;

      const topIkimina = Array.from(groupTotals.entries())
        .map(([id, entry]) => ({
          id,
          name: entry.name,
          code: entry.code,
          amount: entry.amount,
          transactionCount: entry.count,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const sortedDaily = Array.from(dailyTotals.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, amount]) => ({ date, amount }));
      const recentDaily = sortedDaily.slice(-MAX_BARS);

      const summary: ReportPreviewData = {
        currency,
        totalAmount,
        totalTransactions,
        uniqueIkimina,
        topIkimina,
        dailyTotals: recentDaily,
      };

      setData(summary);
      onSummaryChange?.({
        currency,
        totalAmount,
        totalTransactions,
        uniqueIkimina,
      });
      setLoading(false);
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [filters.from, filters.to, filters.sacco?.id, onSummaryChange, toastError, t]);

  const maxDailyAmount = useMemo(() => {
    if (!data || data.dailyTotals.length === 0) return 0;
    return Math.max(...data.dailyTotals.map((entry) => entry.amount));
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
        {errorMessage}
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        title={t("reports.empty.title", "No data in range")}
        description={t("reports.empty.description", "Adjust the filters or select a SACCO to generate a preview.")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-glass">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">{t("reports.cards.totalVolume", "Total volume")}</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-0">
            {formatCurrency(data.totalAmount, data.currency)}
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-glass">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">{t("reports.cards.transactions", "Transactions")}</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-0">{data.totalTransactions}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-glass">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">{t("reports.cards.uniqueIkimina", "Unique ikimina")}</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-0">{data.uniqueIkimina}</p>
        </article>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-3">{t("reports.chart.dailyTotals", "Daily totals")}</span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-3">
            {data.dailyTotals.length} {t("reports.chart.daysSuffix", "days")}
          </span>
        </div>
        {data.dailyTotals.length === 0 ? (
          <p className="mt-4 text-xs text-neutral-2">{t("reports.chart.noPosted", "No posted transactions in this window.")}</p>
        ) : (
          <div className="mt-6 flex h-40 items-end gap-2">
            {data.dailyTotals.map((entry) => {
              const barHeight = maxDailyAmount > 0 ? Math.max(8, Math.round((entry.amount / maxDailyAmount) * 100)) : 8;
              return (
                <div key={entry.date} className="flex flex-col items-center gap-2 text-[10px] text-neutral-3">
                  <div
                    className="w-5 rounded-t-full bg-kigali"
                    style={{ height: `${barHeight}%` }}
                    aria-label={`${entry.date}: ${formatCurrency(entry.amount, data.currency)}`}
                  />
                  <span>{new Date(entry.date).toLocaleDateString("en-RW", { month: "short", day: "numeric" })}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <span className="text-xs text-neutral-3">{t("reports.topIkimina.title", "Top ikimina")}</span>
        {data.topIkimina.length === 0 ? (
          <p className="mt-4 text-xs text-neutral-2">{t("reports.topIkimina.noActivity", "No ikimina activity captured during this window.")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.2em] text-neutral-3">
                <tr>
                  <th className="py-2">{t("reports.table.ikimina", "Ikimina")}</th>
                  <th className="py-2">{t("reports.table.code", "Code")}</th>
                  <th className="py-2 text-right">{t("reports.table.amount", "Amount")}</th>
                  <th className="py-2 text-right">{t("reports.table.share", "Share")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.topIkimina.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 text-neutral-0">{item.name}</td>
                    <td className="py-2 text-neutral-2">{item.code}</td>
                    <td className="py-2 text-right text-neutral-0">{formatCurrency(item.amount, data.currency)}</td>
                    <td className="py-2 text-right text-neutral-2">
                      {data.totalAmount > 0
                        ? `${Math.round((item.amount / data.totalAmount) * 100)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
