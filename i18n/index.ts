import { useState, useEffect, createContext, useContext } from 'react';
import en from './locales/en';
import zh from './locales/zh';

export type Locale = 'en' | 'zh';

export const locales: Record<Locale, typeof en> = {
  en,
  zh,
};

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
};

// Get browser language or stored preference
function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';

  // Check localStorage first
  const stored = localStorage.getItem('locale') as Locale;
  if (stored && locales[stored]) return stored;

  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'zh') return 'zh';

  return 'en';
}

// Context for i18n
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof en;
}

export const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => { },
  t: en,
});

export function useI18n() {
  return useContext(I18nContext);
}

export function useI18nProvider() {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(getInitialLocale());
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;
  };

  return {
    locale,
    setLocale,
    t: locales[locale],
  };
}
