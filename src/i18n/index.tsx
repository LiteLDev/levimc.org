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
    document.documentElement.lang = locale;
    document.documentElement.classList.remove(LOCALE_PENDING_CLASS);
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
