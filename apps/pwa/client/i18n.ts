import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { resolveMessages } from "@ibimina/locales";

import { getClientContentPack, resolveClientLocaleCode } from "./lib/content/pack";

// Define supported locales
export const locales = ["en", "rw", "fr"] as const;
export type Locale = (typeof locales)[number];

// Default locale is Kinyarwanda (Rwanda)
export const defaultLocale: Locale = "rw";

// Validate locale
export function isValidLocale(locale: string | undefined): locale is Locale {
  return locale !== undefined && locales.includes(locale as Locale);
}

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!isValidLocale(locale)) notFound();

  const localeCode = resolveClientLocaleCode(locale);
  const baseTranslations = resolveMessages(localeCode);
  const localePack = getClientContentPack(locale);

  return {
    locale,
    messages: {
      ...(await import(`./locales/${locale}/common.json`)).default,
      navigation: (await import(`./locales/${locale}/navigation.json`)).default,
      home: (await import(`./locales/${locale}/home.json`)).default,
      payments: (await import(`./locales/${locale}/payments.json`)).default,
      statements: (await import(`./locales/${locale}/statements.json`)).default,
      profile: (await import(`./locales/${locale}/profile.json`)).default,
      groups: (await import(`./locales/${locale}/groups.json`)).default,
      localePack,
      baseTranslations,
    },
  };
});
