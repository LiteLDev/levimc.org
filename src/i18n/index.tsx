import { createContext, useContext, useLayoutEffect, useEffect, useMemo, type ReactNode } from 'react';
import { usePreferredLocale } from '../../kit/components/locale';
import en from './locales/en';
import zh from './locales/zh';
import zhHant from './locales/zh-Hant';
import { DEFAULT_LOCALE, LOCALES, type Locale, type SiteLocale } from './config';

export { kitLocale, isChineseLocale, LOCALES, DEFAULT_LOCALE, type Locale, type SiteLocale } from './config';

export type Messages = typeof en;

export const locales: Record<Locale, Messages> = {
  en,
  zh,
  'zh-Hant': zhHant,
};

interface I18nContextType {
  locale: Locale;
  /** The current locale's entry in LOCALES (BCP-47 tag, labels). */
  info: SiteLocale;
  /** Switch the language (stored as the visitor's cross-site LeviMC language preference). */
  setLocale: (locale: Locale) => void;
  t: Messages;
}

const I18nContext = createContext<I18nContextType>({
  locale: DEFAULT_LOCALE,
  info: LOCALES[0]!,
  setLocale: () => {},
  t: en,
});

export function useI18n() {
  return useContext(I18nContext);
}

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Every page is prerendered in English. Right after hydration — before the next paint — usePreferredLocale
 * switches to the visitor's language (the cross-site preference, else the browser languages); the pre-paint
 * script (createThemeInitScript appLocales, see vite.config.ts) keeps the page hidden until then, so no
 * English flashes for Chinese visitors.
 */
export function I18nProvider({ children }: { children?: ReactNode }) {
  const [info, setCode] = usePreferredLocale(LOCALES, LOCALES[0]!);
  const locale = info.code;

  useIsoLayoutEffect(() => {
    document.documentElement.lang = info.lang;
  }, [info.lang]);

  const value = useMemo<I18nContextType>(() => ({ locale, info, setLocale: setCode, t: locales[locale] }), [locale, info, setCode]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
