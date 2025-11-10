"use client";

import { useMemo } from "react";

import { getLocaleMessages, resolveAppLocale, type AppMessages } from "@/lib/i18n/messages";
import { useUIStore } from "@/src/state/ui-store";

export function useLocaleMessages(): AppMessages {
  const { language } = useUIStore();
  const locale = resolveAppLocale(language);

  return useMemo(() => getLocaleMessages(locale), [locale]);
}
