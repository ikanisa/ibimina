import { resolveContentPack, type CountryContentPack, type LocaleCode } from "@ibimina/locales";

const DEFAULT_WEBSITE_LOCALE: LocaleCode = "en-RW";

export function getWebsiteContentPack(
  locale: LocaleCode = DEFAULT_WEBSITE_LOCALE
): CountryContentPack {
  return resolveContentPack(locale, { fallbackLocale: DEFAULT_WEBSITE_LOCALE });
}
