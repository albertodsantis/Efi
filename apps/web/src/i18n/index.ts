import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import type { Locale } from '@shared';
import { SUPPORTED_LOCALES } from '@shared';

import esCommon from './locales/es/common.json';
import enCommon from './locales/en/common.json';
import esLanding from './locales/es/landing.json';
import enLanding from './locales/en/landing.json';
import esSettings from './locales/es/settings.json';
import enSettings from './locales/en/settings.json';

export const DEFAULT_LOCALE: Locale = 'es';

const LOCALSTORAGE_KEY = 'efi:locale';

export function isSupportedLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Resolve a Locale from a free-form BCP-47 tag (e.g. 'en-US', 'es-AR').
 * Anything that does not start with 'en' falls back to the default.
 */
export function resolveLocale(tag: string | null | undefined): Locale {
  if (!tag) return DEFAULT_LOCALE;
  const lower = tag.toLowerCase();
  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('es')) return 'es';
  return DEFAULT_LOCALE;
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { common: esCommon, landing: esLanding, settings: esSettings },
      en: { common: enCommon, landing: enLanding, settings: enSettings },
    },
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_LOCALES as readonly string[] as string[],
    nonExplicitSupportedLngs: true,
    ns: ['common', 'landing', 'settings'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LOCALSTORAGE_KEY,
      caches: ['localStorage'],
    },
    returnNull: false,
  });

/** Set the active language and persist it in localStorage. */
export async function setI18nLocale(locale: Locale): Promise<void> {
  if (i18n.language !== locale) {
    await i18n.changeLanguage(locale);
  }
  try {
    window.localStorage.setItem(LOCALSTORAGE_KEY, locale);
  } catch {
    // localStorage may be unavailable (private mode, etc.) — ignore
  }
}

export { i18n };
export default i18n;
