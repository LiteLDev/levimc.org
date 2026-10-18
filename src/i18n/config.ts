// Locale constants shared by the React app and the pre-paint <head> script (vite.config.ts).
// The language is app state (not part of the URL): the visitor's cross-site LeviMC language preference
// (cookie levimc_lang, see kit/components/prefs.ts), else the browser languages, mapped to the nearest of
// these locales (zh, zh-CN, zh-HK, zh-TW … → zh; everything else without a match → en).
export type Locale = 'en' | 'zh';

export interface SiteLocale {
  /** The site's own code (keys of src/i18n/locales). */
  code: Locale;
  /** BCP-47 tag: <html lang>, the kit chrome's locale, and the value stored as the cross-site preference. */
  lang: string;
  /** Native name in the language menu. */
  label: string;
  /** Trigger text of the language menu. */
  short: string;
}

export const LOCALES: readonly SiteLocale[] = [
  { code: 'en', lang: 'en', label: 'English', short: 'EN' },
  { code: 'zh', lang: 'zh-CN', label: '中文', short: 'ZH' },
];
export const DEFAULT_LOCALE: Locale = 'en';

/** The previous site stored the language as localStorage["locale"] = "en" | "zh" (migrated once). */
export const LEGACY_LOCALE_KEY = 'locale';
export const LEGACY_LOCALE_MAP: Record<Locale, string> = { en: 'en', zh: 'zh-CN' };

/** BCP-47 tag of a site locale (the locale passed to the kit chrome: GlobalBar, SiteFooter …). */
export const kitLocale: Record<Locale, string> = {
  en: 'en',
  zh: 'zh-CN',
};

export const isLocale = (v: unknown): v is Locale => v === 'en' || v === 'zh';
