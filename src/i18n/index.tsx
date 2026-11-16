import { createContext, useCallback, useContext, useLayoutEffect, useEffect, useMemo, useState, type ReactNode } from 'react';
import { revealPendingChrome } from '../../kit/components/locale';
import { readLanguagePreference } from '../../kit/components/prefs';
import { resolveUiLocale } from '../../kit/components/i18n';
import en from './locales/en';
import zhHans from './locales/zh';
import zhHant from './locales/zh-Hant';
import { DEFAULT_LOCALE, LOCALES, localeInfo, type Locale, type SiteLocale } from './config';
import { localizeHref } from '../routes';

export { kitLocale, isChineseLocale, LOCALES, DEFAULT_LOCALE, type Locale, type SiteLocale } from './config';

export type Messages = typeof en;

export const locales: Record<Locale, Messages> = {
  en,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
};

interface I18nContextType {
  locale: Locale;
  /** The current locale's entry in LOCALES (BCP-47 tag, labels, URL prefix). */
  info: SiteLocale;
  t: Messages;
  /** The language of the LeviMC chrome (bar, footer, skip link): see {@link chromeLocaleFor}. */
  chrome: string;
  /** A levimc.org link in the page's locale (see `localizeHref`): '/about/' → '/zh-Hans/about/'. */
  href: (path: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: DEFAULT_LOCALE,
  info: LOCALES[0]!,
  t: en,
  chrome: LOCALES[0]!.lang,
  href: (path) => path,
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

/**
 * {@link chromeLocaleFor} for this visitor: the content language until hydrated, then follows the stored preference.
 * The pre-paint script (src/prepaint.ts) hides the bar and footer of a visitor whose chrome will speak another
 * language than the page (html.kit-chrome-pending); they are shown again once it does, before the next paint.
 */
function useChromeLocale(contentLang: string): string {
  const [preference, setPreference] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);
  useIsoLayoutEffect(() => {
    const sync = () => {
      setPreference(readLanguagePreference());
      setSynced(true);
    };
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
  // runs after the render in the chrome's language was committed
  useIsoLayoutEffect(() => {
    if (synced) revealPendingChrome();
  }, [synced, preference]);
  return chromeLocaleFor(contentLang, preference);
}

/**
 * The page's language comes from its URL (src/routes.ts `localeOfPath`), and every page is prerendered in it.
 * `initial`: the language of the prerendered HTML being hydrated (the client passes <html lang>), used for the first
 * render only — 404.html is English for every unknown URL, also one under /zh-Hans/, and switches right after
 * hydrating (a layout effect: before the browser paints).
 */
export function I18nProvider({ locale: urlLocale, initial, children }: { locale: Locale; initial?: Locale; children?: ReactNode }) {
  const [hydrated, setHydrated] = useState(initial === undefined || initial === urlLocale);
  useIsoLayoutEffect(() => setHydrated(true), []);
  const locale = hydrated ? urlLocale : initial!;
  const info = localeInfo(locale);

  useIsoLayoutEffect(() => {
    document.documentElement.lang = info.lang;
  }, [info.lang]);

  const chrome = useChromeLocale(info.lang);
  const href = useCallback((path: string) => localizeHref(path, locale), [locale]);
  const value = useMemo<I18nContextType>(() => ({ locale, info, t: locales[locale], chrome, href }), [locale, info, chrome, href]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
