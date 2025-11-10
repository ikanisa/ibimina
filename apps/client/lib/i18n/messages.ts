import enCommon from "@/locales/en/common.json" assert { type: "json" };
import enHome from "@/locales/en/home.json" assert { type: "json" };
import enNavigation from "@/locales/en/navigation.json" assert { type: "json" };
import frCommon from "@/locales/fr/common.json" assert { type: "json" };
import frHome from "@/locales/fr/home.json" assert { type: "json" };
import frNavigation from "@/locales/fr/navigation.json" assert { type: "json" };
import rwCommon from "@/locales/rw/common.json" assert { type: "json" };
import rwHome from "@/locales/rw/home.json" assert { type: "json" };
import rwNavigation from "@/locales/rw/navigation.json" assert { type: "json" };

export const SUPPORTED_LOCALES = ["rw", "en", "fr"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "rw";

type AppDictionary = {
  locale: SupportedLocale;
  common: typeof rwCommon;
  home: typeof rwHome;
  navigation: typeof rwNavigation;
};

const DICTIONARY: Record<SupportedLocale, AppDictionary> = {
  rw: { locale: "rw", common: rwCommon, home: rwHome, navigation: rwNavigation },
  en: { locale: "en", common: enCommon, home: enHome, navigation: enNavigation },
  fr: { locale: "fr", common: frCommon, home: frHome, navigation: frNavigation },
} as const;

export type AppMessages = AppDictionary;

export function resolveAppLocale(locale?: string | null): SupportedLocale {
  if (!locale) {
    return DEFAULT_LOCALE;
  }

  const normalized = locale.trim().toLowerCase();
  const match = SUPPORTED_LOCALES.find(
    (code) => normalized === code || normalized.startsWith(`${code}-`)
  );
  return match ?? DEFAULT_LOCALE;
}

export function getLocaleMessages(locale?: string | null): AppMessages {
  const resolved = resolveAppLocale(locale);
  return DICTIONARY[resolved];
}
