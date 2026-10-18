// Locale constants shared by the React app and the pre-paint <head> script.
export type Locale = 'en' | 'zh';

export const LOCALES: readonly Locale[] = ['en', 'zh'];
export const DEFAULT_LOCALE: Locale = 'en';
/** localStorage key holding the chosen locale (unchanged from the previous site). */
export const LOCALE_STORAGE_KEY = 'locale';
/** Set on <html> by the pre-paint script while a non-default locale is being rendered. */
export const LOCALE_PENDING_CLASS = 'lm-locale-pending';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
};

/** Locale passed to the kit's chrome (GlobalBar, SiteFooter, ThemeToggle). */
export const kitLocale: Record<Locale, string> = {
  en: 'en',
  zh: 'zh-CN',
};

export const isLocale = (v: unknown): v is Locale => v === 'en' || v === 'zh';
