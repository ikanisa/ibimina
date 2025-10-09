"use client";

import { useEffect, useState } from "react";
import type { SaccoSearchResult } from "@/components/saccos/sacco-search-combobox";
import { SaccoSearchCombobox } from "@/components/saccos/sacco-search-combobox";
import { BilingualText } from "@/components/common/bilingual-text";

interface ReportFiltersProps {
  initialSacco?: SaccoSearchResult | null;
  onChange?: (filters: ReportFiltersChange) => void;
}

export interface ReportFiltersChange {
  sacco: SaccoSearchResult | null;
  from: string;
  to: string;
}

export function ReportFilters({ initialSacco, onChange }: ReportFiltersProps) {
  const [selectedSacco, setSelectedSacco] = useState<SaccoSearchResult | null>(initialSacco ?? null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const emit = (next: { sacco?: SaccoSearchResult | null; from?: string; to?: string }) => {
    if (onChange) {
      onChange({ sacco: next.sacco ?? selectedSacco, from: next.from ?? from, to: next.to ?? to });
    }
  };

  useEffect(() => {
    setSelectedSacco(initialSacco ?? null);
    emit({ sacco: initialSacco ?? null, from: "", to: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSacco?.id]);

  return (
    <div className="space-y-4 text-sm text-neutral-0">
      <SaccoSearchCombobox
        value={selectedSacco}
        onChange={(value) => {
          setSelectedSacco(value);
          emit({ sacco: value });
        }}
        placeholder="Filter by SACCO / Hitamo SACCO"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-neutral-2">
            <BilingualText primary="From" secondary="Itangira" layout="inline" secondaryClassName="text-[10px] text-neutral-2" />
          </label>
          <input
            type="date"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              emit({ from: event.target.value });
            }}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-neutral-2">
            <BilingualText primary="To" secondary="Iherezo" layout="inline" secondaryClassName="text-[10px] text-neutral-2" />
          </label>
          <input
            type="date"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              emit({ to: event.target.value });
            }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          setSelectedSacco(initialSacco ?? null);
          setFrom("");
          setTo("");
          emit({ sacco: initialSacco ?? null, from: "", to: "" });
        }}
        className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-neutral-2 hover:border-white/30"
      >
        <BilingualText primary="Reset filters" secondary="Siba muyunguruzi" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
      </button>
      <p className="text-xs text-neutral-2">
        <BilingualText
          primary="Choose a SACCO or leave blank for global scope (system admins only). Date range defaults to the last 30 days."
          secondary="Hitamo SACCO cyangwa ureke ubusa kugira ngo ukoreshe urwego rwose (abashinzwe sisitemu gusa). Igihe gihita gishyirwaho iminsi 30 ishize."
          secondaryClassName="text-[11px] text-neutral-3"
        />
      </p>
    </div>
  );
}
