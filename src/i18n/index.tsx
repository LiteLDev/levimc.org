import { createContext, useContext, useLayoutEffect, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePreferredLocale } from '../../kit/components/locale';
import { readLanguagePreference } from '../../kit/components/prefs';
import { resolveUiLocale } from '../../kit/components/i18n';
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
  /** The language of the LeviMC chrome (bar, footer, skip link): see {@link chromeLocaleFor}. */
  chrome: string;
}

const I18nContext = createContext<I18nContextType>({
  locale: DEFAULT_LOCALE,
  info: LOCALES[0]!,
  setLocale: () => {},
  t: en,
  chrome: LOCALES[0]!.lang,
});

export function useI18n() {
  return useContext(I18nContext);
}

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const base = (tag: string) => tag.toLowerCase().split(/[-_]/)[0]!;

/**
 * The chrome's language, by the rule every LeviMC site shares (kit 2.19): the content language when the site has
 * the visitor's preferred language; otherwise the stored preference, if the kit has chrome strings for it (a
 * visitor who chose Deutsch on another LeviMC site gets a German bar and footer around the English pages).
 */
export function chromeLocaleFor(contentLang: string, preference: string | null): string {
  if (!preference || LOCALES.some((l) => base(l.lang) === base(preference))) return contentLang;
  const ui = resolveUiLocale(preference);
  return base(ui) === base(preference) ? ui : contentLang;
}

/** {@link chromeLocaleFor} for this visitor: the content language until hydrated, then follows the stored preference. */
function useChromeLocale(contentLang: string): string {
  const [preference, setPreference] = useState<string | null>(null);
  useIsoLayoutEffect(() => {
    const sync = () => setPreference(readLanguagePreference());
    sync();
    const onPref = (e: Event) => {
      if ((e as CustomEvent<{ kind: string }>).detail?.kind === 'lang') sync();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    window.addEventListener('levimc-pref-change', onPref);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('levimc-pref-change', onPref);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return chromeLocaleFor(contentLang, preference);
}

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

  const chrome = useChromeLocale(info.lang);
  const value = useMemo<I18nContextType>(() => ({ locale, info, setLocale: setCode, t: locales[locale], chrome }), [locale, info, setCode, chrome]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
