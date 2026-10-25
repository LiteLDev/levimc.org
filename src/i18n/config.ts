// Locale constants shared by the React app and the pre-paint <head> script (vite.config.ts).
// The language is app state (not part of the URL): the visitor's cross-site LeviMC language preference
// (cookie levimc_lang, see kit/components/prefs.ts), else the browser languages, mapped to the nearest of
// these locales (zh, zh-CN, zh-Hans … → zh; zh-Hant, zh-TW, zh-HK … → zh-Hant; everything else without a match → en).
export type Locale = 'en' | 'zh' | 'zh-Hant';

export interface SiteLocale {
  /** The site's own code (keys of src/i18n/locales). */
  code: Locale;
  /** BCP-47 tag: <html lang>, the kit chrome's locale, and the value stored as the cross-site preference. */
  lang: string;
  /** Native name in the language menu (and its trigger, like on every LeviMC site). */
  label: string;
}

export const LOCALES: readonly SiteLocale[] = [
  { code: 'en', lang: 'en', label: 'English' },
  { code: 'zh', lang: 'zh-CN', label: '简体中文' },
  { code: 'zh-Hant', lang: 'zh-Hant', label: '繁體中文' },
];
export const DEFAULT_LOCALE: Locale = 'en';

/** The previous site stored the language as localStorage["locale"] = "en" | "zh" (migrated once). */
export const LEGACY_LOCALE_KEY = 'locale';
export const LEGACY_LOCALE_MAP: Record<string, string> = { en: 'en', zh: 'zh-CN' };

/** BCP-47 tag of a site locale (the locale passed to the kit chrome: GlobalBar, SiteFooter …). */
export const kitLocale: Record<Locale, string> = {
  en: 'en',
  zh: 'zh-CN',
  'zh-Hant': 'zh-Hant',
};

export const isLocale = (v: unknown): v is Locale => v === 'en' || v === 'zh' || v === 'zh-Hant';

/** Simplified or Traditional Chinese (the Chinese community's QQ groups, the blog's Chinese posts). */
export const isChineseLocale = (locale: Locale) => locale === 'zh' || locale === 'zh-Hant';
