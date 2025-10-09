"use client";

import { useMemo, useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SaccoSearchResult } from "@/components/saccos/sacco-search-combobox";
import { BilingualText } from "@/components/common/bilingual-text";
import { useToast } from "@/providers/toast-provider";

export interface ReportExportFilters {
  sacco: SaccoSearchResult | null;
  from: string;
  to: string;
}

interface ReportExportPanelProps {
  filters: ReportExportFilters;
  ikiminaCount: number;
}

const supabase = getSupabaseBrowserClient();

export function ReportExportPanel({ filters, ikiminaCount }: ReportExportPanelProps) {
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saccoLabel = useMemo(() => {
    if (filters.sacco) {
      const location = [filters.sacco.district, filters.sacco.province].filter(Boolean).join(" • ");
      return `${filters.sacco.name}${location ? ` — ${location}` : ""}`;
    }
    return "All SACCOs";
  }, [filters.sacco]);

  const rangeLabel = useMemo(() => {
    if (filters.from && filters.to) return `${filters.from} → ${filters.to}`;
    if (filters.from) return `${filters.from} → (latest)`;
    if (filters.to) return `(default) → ${filters.to}`;
    return "Last 30 days (default)";
  }, [filters.from, filters.to]);

  const handleExport = (format: "pdf" | "csv") => {
    if (ikiminaCount === 0) {
      setErrorMessage("Select a SACCO or adjust the date range to include ikimina activity.");
      return;
    }
    setMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        const msg = sessionError.message ?? "Session lookup failed";
        setErrorMessage(msg);
        error(`${msg} / Gushaka umwirondoro byanze`);
        return;
      }

      const token = sessionData.session?.access_token;

      const response = await fetch("/functions/v1/export-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: format === "pdf" ? "application/pdf" : "text/csv",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          saccoId: filters.sacco?.id ?? undefined,
          start: filters.from || undefined,
          end: filters.to || undefined,
          format,
        }),
      }).catch((fetchError: unknown) => {
        const msg = fetchError instanceof Error ? fetchError.message : "Network error";
        setErrorMessage(msg);
        error(`${msg} / Ikosa rya interineti`);
        return null;
      });

      if (!response) {
        return;
      }

      if (!response.ok) {
        const fallback = await response.text().catch(() => "Export failed");
        setErrorMessage(fallback);
        error(`${fallback} / Gusohora byanze`);
        return;
      }

      const blob = await response.blob();
      const fileExt = format === "pdf" ? "pdf" : "csv";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `ibimina-report-${timestamp}.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      const successEn = format === "pdf" ? "PDF export started" : "CSV export started";
      setMessage(successEn);
      success(`${successEn} / Kohereza biratangiye`);
    });
  };

  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div className="space-y-3 text-sm text-neutral-0">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">Scope / Uko bigaragara</p>
          <p className="mt-1 font-medium text-neutral-0">{saccoLabel}</p>
          <p className="text-xs text-neutral-2">{rangeLabel}</p>
        </div>
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-3 text-xs text-neutral-2">
          <BilingualText
            primary={`${ikiminaCount} ikimina eligible for export.`}
            secondary={`${ikiminaCount} amatsinda ahari kuvanwamo raporo.`}
            secondaryClassName="text-[10px] text-neutral-3"
          />
          <p className="mt-2 text-[11px] text-neutral-3">
            <BilingualText
              primary="Exports default to the last 30 days when no dates are provided."
              secondary="Iyo nta minsi watanze, raporo ifata iminsi 30 ishize."
              secondaryClassName="text-[10px] text-neutral-3"
            />
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {errorMessage && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{errorMessage}</p>}
        {message && <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</p>}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            disabled={pending || ikiminaCount === 0}
            className="interactive-scale rounded-full bg-kigali px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass disabled:opacity-60"
          >
            <BilingualText
              primary={pending ? "Exporting…" : "Download PDF"}
              secondary={pending ? "Birimo gusohoka…" : "Kuramo PDF"}
              layout="inline"
              className="items-center gap-2"
              secondaryClassName="text-[10px] text-ink/70"
            />
          </button>
          <button
            type="button"
            onClick={() => handleExport("csv")}
            disabled={pending || ikiminaCount === 0}
            className="interactive-scale rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-0 disabled:opacity-60"
          >
            <BilingualText
              primary={pending ? "Exporting…" : "Download CSV"}
              secondary={pending ? "Birimo gusohoka…" : "Kuramo CSV"}
              layout="inline"
              className="items-center gap-2"
              secondaryClassName="text-[10px] text-neutral-3"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
