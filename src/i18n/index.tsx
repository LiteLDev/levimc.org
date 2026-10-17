import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import en from './locales/en';
import zh from './locales/zh';
import { DEFAULT_LOCALE, LOCALE_PENDING_CLASS, LOCALE_STORAGE_KEY, isLocale, type Locale } from './config';

export { localeNames, kitLocale, LOCALES, DEFAULT_LOCALE, type Locale } from './config';

export type Messages = typeof en;

export const locales: Record<Locale, Messages> = {
  en,
  zh,
};

/** Longest wait for the web fonts before a translated page is revealed (see I18nProvider). */
const FONT_WAIT_MS = 600;

// Stored preference first, then the browser language (client only).
function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* storage unavailable */
  }
  const browserLang = (navigator.language || '').split('-')[0];
  if (browserLang === 'zh') return 'zh';
  return DEFAULT_LOCALE;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
}

const I18nContext = createContext<I18nContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: en,
});

export function useI18n() {
  return useContext(I18nContext);
}

/**
 * Every page is prerendered in English. After hydration the stored / browser locale is applied; while
 * that happens the pre-paint script keeps <html class="lm-locale-pending"> so no English text flashes.
 */
export function I18nProvider({ children }: { children?: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(getInitialLocale());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.lang = locale;
    if (!root.classList.contains(LOCALE_PENDING_CLASS)) return;
    // Reveal the translated page once the web fonts are in (or after a short cap, for visitors on whose
    // network Google Fonts is slow), so the font swap does not shift the page right after it appears.
    const reveal = () => root.classList.remove(LOCALE_PENDING_CLASS);
    const timer = window.setTimeout(reveal, FONT_WAIT_MS);
    document.fonts?.ready.then(reveal, reveal);
    return () => window.clearTimeout(timer);
  }, [locale, ready]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* the choice still applies to this page */
    }
  }, []);

  const value = useMemo(() => ({ locale, setLocale, t: locales[locale] }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
