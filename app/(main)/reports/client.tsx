"use client";

import { useCallback, useMemo, useState } from "react";
import { GradientHeader } from "@/components/ui/gradient-header";
import { GlassCard } from "@/components/ui/glass-card";
import { ReportFilters, type ReportFiltersChange } from "@/components/reports/report-filters";
import { ReportExportPanel } from "@/components/reports/report-export-panel";
import { ReportPreview, type ReportPreviewSummary } from "@/components/reports/report-preview";
import type { SaccoSearchResult } from "@/components/saccos/sacco-search-combobox";
import { BilingualText } from "@/components/common/bilingual-text";

interface ReportsClientProps {
  initialSacco: SaccoSearchResult | null;
  ikiminaCount: number;
}

export function ReportsClient({ initialSacco, ikiminaCount }: ReportsClientProps) {
  const [filters, setFilters] = useState<ReportFiltersChange>({
    sacco: initialSacco,
    from: "",
    to: "",
  });
  const [previewSummary, setPreviewSummary] = useState<ReportPreviewSummary | null>(null);

  const handleFiltersChange = useCallback((next: ReportFiltersChange) => {
    setFilters(next);
  }, []);

  const exportContext = useMemo(() => ({ ...filters }), [filters]);

  const formatCurrency = (value: number, currency: string) =>
    new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-8">
      <GradientHeader
        title={<BilingualText primary="Reports" secondary="Raporo" />}
        subtitle={
          <BilingualText
            primary="Generate branded exports for SACCO leadership, auditors, and members."
            secondary="Tegura raporo zifite ibirango bya SACCO ku bayobozi, abagenzuzi n'abanyamuryango."
            secondaryClassName="text-xs text-ink/70"
          />
        }
        badge={<span className="rounded-full bg-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-ink">PWA-ready</span>}
      />

      <GlassCard
        title={<BilingualText primary="Summary" secondary="Igasobanuro" />}
        subtitle={
          <BilingualText
            primary={previewSummary ? "Figures reflect the applied filters." : "Adjust filters to populate the summary."}
            secondary={previewSummary ? "Imibare igendeye ku muyunguruzi watanze." : "Hindura muyunguruzi kugirango ubone ishusho."}
            secondaryClassName="text-xs text-neutral-3"
          />
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <SummaryTile
            labelPrimary="Total volume"
            labelSecondary="Ingano y'umusanzu"
            value={previewSummary ? formatCurrency(previewSummary.totalAmount, previewSummary.currency) : "—"}
          />
          <SummaryTile
            labelPrimary="Transactions"
            labelSecondary="Imishinga"
            value={previewSummary ? String(previewSummary.totalTransactions) : "—"}
          />
          <SummaryTile
            labelPrimary="Unique ikimina"
            labelSecondary="Amatsinda"
            value={previewSummary ? String(previewSummary.uniqueIkimina) : "—"}
          />
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <GlassCard
          title={<BilingualText primary="Filters" secondary="Muyunguruzi" />}
          subtitle={
            <BilingualText
              primary="Fine-tune the reporting scope."
              secondary="Hitamo uko raporo izajya igaragaramo."
              secondaryClassName="text-xs text-neutral-3"
            />
          }
        >
          <ReportFilters initialSacco={initialSacco} onChange={handleFiltersChange} />
        </GlassCard>

        <GlassCard
          title={<BilingualText primary="Preview" secondary="Igaragaza ry'imbere" />}
          subtitle={
            <BilingualText
              primary="Review performance before exporting."
              secondary="Reba uko imisanzu yagenze mbere yo gusohora raporo."
              secondaryClassName="text-xs text-neutral-3"
            />
          }
          className="min-h-[320px] space-y-6"
        >
          <ReportPreview
            filters={exportContext}
            onSummaryChange={setPreviewSummary}
          />
          <div className="border-t border-white/10 pt-6">
            <ReportExportPanel
              filters={exportContext}
              ikiminaCount={previewSummary?.uniqueIkimina ?? ikiminaCount}
            />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function SummaryTile({
  labelPrimary,
  labelSecondary,
  value,
}: {
  labelPrimary: string;
  labelSecondary: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-glass">
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">
        <BilingualText primary={labelPrimary} secondary={labelSecondary} />
      </p>
      <p className="mt-3 text-2xl font-semibold text-neutral-0">{value}</p>
    </div>
  );
}
