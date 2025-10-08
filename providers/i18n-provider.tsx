"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import enCommon from "@/locales/en/common.json";
import rwCommon from "@/locales/rw/common.json";

const DICTIONARIES = {
  en: enCommon as Record<string, string>,
  rw: rwCommon as Record<string, string>,
};

type SupportedLocale = keyof typeof DICTIONARIES;

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: React.ReactNode;
  defaultLocale?: SupportedLocale;
}

export function I18nProvider({ children, defaultLocale = "rw" }: I18nProviderProps) {
  const [locale, setLocale] = useState<SupportedLocale>(defaultLocale);

  const dictionary = useMemo(() => DICTIONARIES[locale], [locale]);

  const translate = useCallback(
    (key: string, fallback?: string) => {
      if (dictionary[key]) return dictionary[key];
      if (locale !== "en" && DICTIONARIES.en[key]) return DICTIONARIES.en[key];
      return fallback ?? key;
    },
    [dictionary, locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: translate,
    }),
    [locale, translate],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useTranslation must be used within I18nProvider");
  return context;
}
