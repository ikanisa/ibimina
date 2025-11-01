/**
 * @ibimina/locales - Multi-country localization
 * 
 * Content packs and translations for different countries and languages
 */

// Export types
export type {
  LocaleCode,
  CountryContentPack,
  TranslationMessages,
} from './types/index.js';

// Export locale content packs
export { rwRWContentPack, rwRWMessages } from './locales/rw-RW.js';
export { enRWContentPack, enRWMessages } from './locales/en-RW.js';
export { frSNContentPack, frSNMessages } from './locales/fr-SN.js';

// Locale registry
import type { LocaleCode, CountryContentPack, TranslationMessages } from './types/index.js';
import { rwRWContentPack, rwRWMessages } from './locales/rw-RW.js';
import { enRWContentPack, enRWMessages } from './locales/en-RW.js';
import { frSNContentPack, frSNMessages } from './locales/fr-SN.js';

/**
 * Registry of all available content packs
 */
export const contentPacks: Record<string, CountryContentPack> = {
  'rw-RW': rwRWContentPack,
  'en-RW': enRWContentPack,
  'fr-SN': frSNContentPack,
};

/**
 * Registry of all available translations
 */
export const messages: Record<string, TranslationMessages> = {
  'rw-RW': rwRWMessages,
  'en-RW': enRWMessages,
  'fr-SN': frSNMessages,
};

/**
 * Get content pack for a locale
 */
export function getContentPack(locale: LocaleCode): CountryContentPack | undefined {
  return contentPacks[locale];
}

/**
 * Get messages for a locale
 */
export function getMessages(locale: LocaleCode): TranslationMessages | undefined {
  return messages[locale];
}

/**
 * Get content pack by country ISO3 code (returns first match)
 */
export function getContentPackByCountry(countryISO3: string): CountryContentPack | undefined {
  return Object.values(contentPacks).find(
    pack => pack.countryISO3.toUpperCase() === countryISO3.toUpperCase()
  );
}

/**
 * Get all available locales
 */
export function getAvailableLocales(): LocaleCode[] {
  return Object.keys(contentPacks) as LocaleCode[];
}

/**
 * Get locales for a specific country
 */
export function getLocalesForCountry(countryISO3: string): LocaleCode[] {
  return Object.entries(contentPacks)
    .filter(([_, pack]) => pack.countryISO3.toUpperCase() === countryISO3.toUpperCase())
    .map(([locale, _]) => locale as LocaleCode);
}
