"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export type SaccoSearchResult = {
  id: string;
  name: string;
  district: string;
  province: string;
  category: string;
  bnr_index: number;
};

interface SaccoSearchComboboxProps {
  value?: SaccoSearchResult | null;
  onChange: (value: SaccoSearchResult | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const supabase = getSupabaseBrowserClient();

export function SaccoSearchCombobox({ value, onChange, placeholder = "Search Umurenge SACCOs / Shakisha SACCO", disabled, className }: SaccoSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SaccoSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const handle = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.rpc("search_saccos", {
        query: query.trim(),
        limit_count: 12,
      });
      if (!active) return;
      if (error) {
        console.error(error);
        setError(error.message ?? "Search failed");
        setResults([]);
      } else {
        const rows = (data as Database["public"]["Functions"]["search_saccos"]["Returns"] | null) ?? [];
        setResults(
          rows.map((row) => ({
            id: row.id,
            name: row.name,
            district: row.district,
            province: row.province,
            category: row.category,
            bnr_index: row.bnr_index,
          }))
        );
      }
      setLoading(false);
    }, 250);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query]);

  const selectedLabel = useMemo(() => {
    if (!value) return placeholder;
    return `${value.name} — ${value.district}`;
  }, [value, placeholder]);

  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <label className="text-xs uppercase tracking-[0.3em] text-neutral-2">Assign SACCO</label>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue disabled:opacity-50"
        />
        {value && (
          <div className="mt-3 text-xs text-neutral-1">
            <span className="font-semibold text-neutral-0">{selectedLabel}</span>
            <button
              type="button"
              className="ml-2 text-rw-yellow underline-offset-2 hover:underline"
              onClick={() => onChange(null)}
            >
              Clear / Siba
            </button>
          </div>
        )}
        <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-white/10">
          {loading && <p className="px-3 py-2 text-xs text-neutral-2">Searching…</p>}
          {error && <p className="px-3 py-2 text-xs text-red-300">{error}</p>}
          {!loading && !error && results.length === 0 && query && (
            <p className="px-3 py-2 text-xs text-neutral-2">No matches / Nta bihuye</p>
          )}
          <ul>
            {results.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  className="flex w-full flex-col gap-1 px-3 py-2 text-left text-sm text-neutral-0 hover:bg-white/10"
                  onClick={() => {
                    onChange(result);
                    setQuery("");
                  }}
                >
                  <span className="font-medium">{result.name}</span>
                  <span className="text-xs text-neutral-2">
                    {result.district} · {result.province}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
