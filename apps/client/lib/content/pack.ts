import { resolveContentPack, type CountryContentPack, type LocaleCode } from "@ibimina/locales";

import { defaultLocale, type Locale } from "../../i18n";

const FALLBACK_PACK_LOCALE: LocaleCode = "en-RW";

const LOCALE_CODE_BY_APP_LOCALE: Record<Locale, LocaleCode> = {
  en: "en-RW",
  rw: "rw-RW",
  fr: "fr-SN",
};

export function resolveClientLocaleCode(locale: Locale): LocaleCode {
  return LOCALE_CODE_BY_APP_LOCALE[locale] ?? FALLBACK_PACK_LOCALE;
}

export function getClientContentPack(locale: Locale = defaultLocale): CountryContentPack {
  const localeCode = resolveClientLocaleCode(locale);
  return resolveContentPack(localeCode, { fallbackLocale: FALLBACK_PACK_LOCALE });
}
