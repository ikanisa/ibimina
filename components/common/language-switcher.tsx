"use client";

import type { ChangeEvent } from "react";
import { useCallback } from "react";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "rw", label: "Kinyarwanda" },
] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setLocale(event.target.value as (typeof OPTIONS)[number]["value"]);
    },
    [setLocale],
  );

  return (
    <label className={cn("flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-neutral-2", className)}>
      <span>{useTranslation().t("common.language", "Language")}</span>
      <select
        value={locale}
        onChange={handleChange}
        className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="text-neutral-900">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
