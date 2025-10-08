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
