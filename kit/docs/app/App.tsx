import { Suspense, use, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router';
import type { PageData, RouteMeta } from '../shared/types';
import { href, langOf, loadPage, localeOf, matchPathname, site, stringsFor, withMeta } from './data';
import { pageTitle } from '../shared/head';
import { docsStrings } from '../shared/strings';
import { SiteHeader } from './components/SiteHeader';
import { KitLink } from './components/KitLink';
import { MobileDrawer } from './components/MobileDrawer';
import { SearchModal, preloadSearchIndex } from './components/SearchModal';
import { DocLayout } from './layouts/DocLayout';
import { HomeLayout } from './layouts/HomeLayout';
import { NotFound } from './layouts/NotFound';
import { layouts as virtualLayouts } from 'virtual:kit-docs/layouts';
import type { ComponentType } from 'react';
import type { CustomLayoutProps } from './layout-api';

const customLayouts = virtualLayouts as Record<string, ComponentType<CustomLayoutProps>>;
import { GlobalBar } from '../../components/GlobalBar';
import { SiteFooter } from '../../components/SiteFooter';
import { PaintedBackdrop } from '../../components/PaintedBackdrop';
import { ThemeProvider } from '../../components/theme';
import { matchLocale, readLanguagePreference } from '../../components/prefs';
import { revealPendingChrome } from '../../components/locale';
import type { LocaleOption } from '../../components/LocaleSwitcher';
import { resolveUiLocale, uiStrings, type UiStrings } from '../../components/i18n';

const isBrowser = typeof window !== 'undefined';
const useIsoLayoutEffect = isBrowser ? useLayoutEffect : useEffect;

function RoutePage({ route: slim, t, onSearch, locale }: { route?: RouteMeta; t: UiStrings; onSearch: () => void; locale: string }) {
  if (!slim) return <NotFound locale={locale} t={t} onSearch={onSearch} />;
  const page = use(loadPage(slim.page) as Promise<PageData>);
  // the route table is slim in the browser: the page's own meta (description, edit link, dates, prev/next) comes with it
  const route = withMeta(slim, page);
  return <RoutePageBody route={route} page={page} t={t} />;
}

function RoutePageBody({ route, page, t }: { route: RouteMeta; page: PageData; t: UiStrings }) {
  useEffect(() => {
    const el = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (el && route.description !== undefined) el.content = route.description;
  }, [route.description]);
  const Custom = customLayouts[route.layout];
  if (Custom) return <Custom route={route} page={page} site={site} t={t} />;
  return route.layout === 'home' ? <HomeLayout route={route} page={page} t={t} /> : <DocLayout route={route} page={page} t={t} />;
}

/** Keep <head> in sync after client-side navigation (SSR writes the initial head). */
function useHead(route: RouteMeta | undefined, locale: string) {
  useEffect(() => {
    document.title = pageTitle(site, route, docsStrings(langOf(locale)).pageNotFound);
    document.documentElement.lang = langOf(locale);
    if (!route || !site.hostname) return;
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', site.hostname + site.base + route.path);
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((n) => n.remove());
    const alts = Object.entries(route.alternates);
    if (alts.length > 1) {
      for (const [code, p] of alts) {
        const l = document.createElement('link');
        l.rel = 'alternate';
        l.hreflang = langOf(code);
        l.href = site.hostname + site.base + p;
        document.head.appendChild(l);
      }
    }
  }, [route, locale]);
}

/**
 * The chrome's language when it is not the content's (see chromeLanguage), from the visitor's stored preference
 * (the cross-site `levimc_lang`), read after hydration and kept in sync with the bar's language menu and other
 * tabs; null = the content language (no re-render then). The pre-paint script hid the chrome
 * (html.kit-chrome-pending) when it will not be in the page's language; it is shown again once re-rendered.
 */
function useChromeOverride(): string | null {
  const [override, setOverride] = useState<string | null>(null);
  const synced = useRef(false);
  useIsoLayoutEffect(() => {
    const sync = () => {
      const next = chromeOverride(readLanguagePreference());
      synced.current = true;
      // same value: React bails out — no extra (synchronous, pre-paint) render on most visits
      setOverride(next);
      if (next === null) revealPendingChrome();
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
  useIsoLayoutEffect(() => {
    if (synced.current) revealPendingChrome();
  }, [override]);
  return override;
}

/**
 * The chrome language rule (the same on levimc.org, Mods, the docs and the static/Doxygen pages): the LeviMC bar
 * and footer are in the content language when the site has the visitor's preferred language; otherwise they
 * follow the stored preference if the kit has chrome strings for it (else the content language again).
 */
export function chromeLanguage(pref: string | null | undefined, contentLang: string): string {
  return chromeOverride(pref) ?? contentLang;
}

/** The chrome's UI locale when the rule moves it away from the content language, else null. */
function chromeOverride(pref: string | null | undefined): string | null {
  if (!pref || matchLocale(pref, site.locales)) return null;
  const ui = resolveUiLocale(pref);
  return ui.toLowerCase().split('-')[0] === pref.toLowerCase().split(/[-_]/)[0] ? ui : null;
}

const SCROLL_STORE = 'kit-scroll';
const scrollKey = () => (history.state as { key?: string } | null)?.key ?? location.pathname;

/**
 * Scroll to top / hash target after navigation; restore positions on back/forward — client-side and across
 * document loads (positions survive in sessionStorage, S3). The position is recorded only when the page may be
 * left — a click or Enter (links, search results), Back/Forward (popstate, before the router renders) and pagehide —
 * never while scrolling.
 */
function useScrollManagement(key: string, hash: string) {
  const navType = useNavigationType();
  const positions = useRef<Map<string, number>>(null);
  const first = useRef(true);
  const current = useRef('');
  const store = () => {
    if (!positions.current) {
      let saved: [string, number][] = [];
      try {
        saved = JSON.parse(sessionStorage.getItem(SCROLL_STORE) || '[]') as [string, number][];
      } catch {
        /* storage blocked or corrupt */
      }
      positions.current = new Map(Array.isArray(saved) ? saved : []);
    }
    return positions.current;
  };
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const save = () => {
      if (current.current) store().set(current.current, Math.round(window.scrollY));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') save();
    };
    const persist = () => {
      save();
      try {
        sessionStorage.setItem(SCROLL_STORE, JSON.stringify([...store()].slice(-50)));
      } catch {
        /* storage full or blocked */
      }
    };
    // capture: before the link's / router's own handlers change the page
    document.addEventListener('click', save, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('popstate', save, true);
    window.addEventListener('pagehide', persist);
    return () => {
      document.removeEventListener('click', save, true);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('popstate', save, true);
      window.removeEventListener('pagehide', persist);
    };
  }, []);
  useIsoLayoutEffect(() => {
    const prevKey = current.current;
    current.current = scrollKey();
    if (first.current) {
      first.current = false;
      if (hash) {
        document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
        return;
      }
      // a Back/Forward into this document from another page: restore where the reader was
      const nav = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav?.type === 'back_forward') {
        const y = store().get(current.current);
        if (y) requestAnimationFrame(() => window.scrollTo(0, y));
      }
      return;
    }
    if (prevKey && prevKey !== current.current && !store().has(prevKey)) {
      // left without a click / key / popstate (a programmatic navigation): best effort
      store().set(prevKey, Math.round(window.scrollY));
    }
    if (navType === 'POP') {
      const y = store().get(current.current);
      if (y !== undefined) {
        window.scrollTo(0, y);
        return;
      }
    }
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [key, hash]);
}

export function App() {
  const location = useLocation();
  const fullPath = site.base + location.pathname.replace(/^\//, '');
  const route = useMemo(() => matchPathname(fullPath), [fullPath]);
  // On the static 404 page the locale is taken from the URL after hydration (SSR renders the default).
  const [notFoundLocale, setNotFoundLocale] = useState(site.defaultLocale);
  useEffect(() => {
    if (!route) setNotFoundLocale(localeOf(fullPath));
  }, [route, fullPath]);
  const locale = route?.locale ?? notFoundLocale;
  const lang = langOf(locale);
  const t = useMemo(() => stringsFor(locale), [locale]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useHead(route, locale);
  useScrollManagement(route ? route.page : fullPath, location.hash);
  useEffect(() => setDrawerOpen(false), [fullPath]);
  useEffect(() => {
    document.documentElement.classList.toggle('kit-scroll-lock', searchOpen || drawerOpen);
  }, [searchOpen, drawerOpen]);

  const openSearch = useCallback(() => {
    setDrawerOpen(false);
    setSearchOpen(true);
  }, []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable="true"]');
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        preloadSearchIndex(locale);
        openSearch();
      } else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        preloadSearchIndex(locale);
        openSearch();
      } else if ((e.key === 'Control' || e.key === 'Meta') && !e.repeat) {
        // Ctrl/⌘ held: Ctrl+K may follow — start fetching the index before the modal mounts
        preloadSearchIndex(locale);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSearch, locale]);

  const localeOptions: LocaleOption[] = site.locales.map((l) => ({
    code: l.code,
    label: l.label,
    lang: l.lang,
    href: href(route?.alternates[l.code] ?? site.homePaths[l.code] ?? l.prefix),
  }));
  // The language menu of the top bar is this site's locale switcher: choosing one stores it as the visitor's
  // cross-site language preference (LocaleSwitcher) and opens the equivalent page.
  const single = site.locales.length < 2;
  const languages = single ? undefined : { options: localeOptions, current: locale, linkComponent: KitLink };
  // single-locale sites: the bar offers the 9 chrome languages; a choice re-renders the chrome in place
  // (useLanguagePreference hears the stored preference change) instead of reloading the page
  const chromeLang = useChromeOverride() ?? lang;
  const chromeT = useMemo(() => (chromeLang === lang ? t : uiStrings(chromeLang)), [chromeLang, lang, t]);
  const sidebar = route?.sidebar ? site.sidebars[route.sidebar] : undefined;

  return (
    <ThemeProvider>
      <a className="kit-skip-link" href="#kit-main">
        {t.skipToContent}
      </a>
      <PaintedBackdrop scene={route?.layout !== 'home'} />
      <div className="kit-shell kit-above-backdrop" data-layout={route?.layout ?? '404'}>
        <GlobalBar
          currentProject={site.project}
          locale={chromeLang}
          strings={chromeT}
          languages={languages}
          onLanguageChange={single ? () => undefined : undefined}
          // kit 2.19: below 960px the bar's menu button (same place on every LeviMC site) opens this site's drawer
          onMenu={openDrawer}
          menuOpen={drawerOpen}
          menuControls="kit-drawer"
        />
        <SiteHeader route={route} locale={locale} t={t} onOpenSearch={openSearch} onWarmSearch={() => preloadSearchIndex(locale)} />
        <Suspense fallback={<main id="kit-main" className="kit-loading" aria-busy="true" />}>
          <RoutePage route={route} t={t} onSearch={openSearch} locale={locale} />
        </Suspense>
        <SiteFooter locale={chromeLang} strings={chromeT} />
      </div>
      <MobileDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        route={route}
        locale={locale}
        sidebar={sidebar}
        path={route?.path ?? ''}
        t={t}
        chromeLang={chromeLang}
        chromeT={chromeT}
      />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} locale={locale} t={t} />
    </ThemeProvider>
  );
}
