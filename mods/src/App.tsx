import { BASE } from "./base-path";
import { Suspense, use, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { useLocation, useNavigationType } from "react-router";
import { GlobalBar, PaintedBackdrop, SiteFooter, ThemeProvider } from "./kit-ui";
import { ErrorBoundary, ErrorMessage } from "./components/error-boundary";
import { Header } from "./components/header";
import { KitExactLink, KitRouterLink, localizeHref } from "./components/router-link";
import { LocaleContext, STRINGS, useI18n } from "./i18n";
import { LOCALES, localeAlternates, localeInfo, splitLocale, type Locale } from "./locales";
import { pageMeta, SITE_ORIGIN, type PageData } from "./page-data";
import { useChromeLocale } from "./chrome-locale";
import { uiStrings } from "../kit/components/i18n";
import { revealPendingChrome } from "../kit/components/locale";
import { PageStoreContext, useHydrated, usePageStore, type PageStore } from "./page-store";
import { HomePage } from "./pages/home-page";
import { NotFoundPage } from "./pages/not-found-page";
import { ModPage } from "./pages/mod-page";
import { RenamesContext } from "./repository-renames";

/**
 * Sets a `<head>` element's attribute, adding the element first when the
 * prerendered page did not have it (the 404 page has no canonical URL), or
 * removes the element when there is no value.
 */
function setHeadTag(
  selector: string,
  create: () => HTMLElement,
  attribute: string,
  value: string | undefined,
) {
  let element = document.head.querySelector(selector);
  if (value === undefined) {
    element?.remove();
    return;
  }
  if (!element) {
    element = create();
    document.head.append(element);
  }
  element.setAttribute(attribute, value);
}

const metaTag = (key: "name" | "property", value: string) => () => {
  const meta = document.createElement("meta");
  meta.setAttribute(key, value);
  return meta;
};

const canonicalTag = () => {
  const link = document.createElement("link");
  link.rel = "canonical";
  return link;
};

/**
 * Keeps `<title>`, the description, canonical URL, Open Graph tags and the 404
 * page's `noindex` in step on navigation.
 */
function useDocumentHead(data: PageData) {
  const { locale } = useI18n();
  const { pathname } = useLocation();
  useEffect(() => {
    const meta = pageMeta(data, pathname);
    document.title = meta.title;
    setHeadTag('meta[name="description"]', metaTag("name", "description"), "content", meta.description);
    setHeadTag('link[rel="canonical"]', canonicalTag, "href", meta.canonical);
    setHeadTag('meta[property="og:title"]', metaTag("property", "og:title"), "content", meta.title);
    setHeadTag(
      'meta[property="og:description"]',
      metaTag("property", "og:description"),
      "content",
      meta.description,
    );
    setHeadTag('meta[property="og:url"]', metaTag("property", "og:url"), "content", meta.canonical);
    setHeadTag(
      'meta[name="robots"]',
      metaTag("name", "robots"),
      "content",
      data.kind === "not-found" ? "noindex" : undefined,
    );
  }, [data, locale, pathname]);
}

/** How far down the results may start before a new query brings them up. */
const RESULTS_LOW = 0.6;

/**
 * New pages open at the top. A query (a filter, a sort order, the next page)
 * brings the results' top into view when it is above the viewport, or so far
 * down that the results hardly show — whether it was made on the listing or,
 * like a search in the header, from another page. Typing in the search field
 * replaces the history entry and never scrolls. Back and forward leave
 * scrolling to the browser.
 */
function ScrollOnNavigate() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previousPath = useRef(location.pathname);

  useLayoutEffect(() => {
    const samePage = previousPath.current === location.pathname;
    previousPath.current = location.pathname;
    if (navigationType === "POP" || location.hash) return;
    if (!samePage) {
      window.scrollTo(0, 0);
      if (!location.search) return;
    } else if (navigationType === "REPLACE") {
      return;
    }
    const anchor = document.querySelector<HTMLElement>("[data-scroll-anchor]");
    if (!anchor) return;
    const { top } = anchor.getBoundingClientRect();
    if (top < 0 || top > window.innerHeight * RESULTS_LOW) {
      anchor.scrollIntoView({ block: "start" });
    }
  }, [location.key, location.pathname, location.search, location.hash, navigationType]);
  return null;
}

function Page() {
  const { pathname } = useLocation();
  const loaded = use(usePageStore().get(pathname));

  useEffect(() => {
    // The page could not be fetched: load it in full instead.
    if (loaded.kind === "unavailable") window.location.reload();
  }, [loaded]);

  if (loaded.kind === "unavailable") return null;
  return <LoadedPage data={loaded} />;
}

function LoadedPage({ data }: { data: PageData }) {
  useDocumentHead(data);

  return <RenamesContext value={data.renames}>{renderPage(data)}</RenamesContext>;
}

function renderPage(data: PageData) {
  switch (data.kind) {
    case "home":
      return <HomePage catalog={data.catalog} />;
    case "mod":
      return (
        <>
          <Header />
          <ModPage key={data.id} data={data} />
        </>
      );
    case "not-found":
      return (
        <>
          <Header />
          <NotFoundPage />
        </>
      );
  }
}

/** Shown only if a page is still loading outside a navigation transition. */
function PageFallback() {
  return (
    <main id="main" className="mods-main kit-above-backdrop" aria-busy="true">
      <div className="mods-skeleton mods-page-skeleton">
        <span className="mods-skeleton-bar mods-skeleton-title" />
        <span className="mods-skeleton-bar" />
        <span className="mods-skeleton-bar mods-skeleton-70" />
      </div>
    </main>
  );
}

/**
 * Every levimc.org link of the bar and footer goes through KitRouterLink: this site's pages navigate inside
 * the app, the others load in full, all in the page's language.
 */
const isAppPath = () => true;

/**
 * The LeviMC bar (the site's languages, the shared theme menu, GitHub), the
 * page and the LeviMC footer, in the language of the URL (`/zh-Hans/mods/…`):
 * each page is prerendered in each language.
 */
function Shell({ initialLocale, children }: { initialLocale?: Locale; children: ReactNode }) {
  const { pathname, search } = useLocation();
  const { locale: urlLocale, path } = splitLocale(pathname);
  // The first render matches the HTML being hydrated: a page in another language than its URL's is only the 404
  // page the host answers for any unknown URL (English); it switches right after hydrating, before the next paint.
  const hydrated = useHydrated();
  const code = hydrated || initialLocale === undefined ? urlLocale : initialLocale;
  const locale = localeInfo(code);
  const i18n = useMemo(
    () => ({ locale: code, t: STRINGS[code], href: (href: string) => localizeHref(href, code) }),
    [code],
  );
  // the LeviMC bar's and footer's language (see chrome-locale.ts)
  const chrome = useChromeLocale(locale.lang);
  useEffect(() => {
    document.documentElement.lang = locale.lang;
  }, [locale.lang]);
  // the bar and footer were hidden only for a chrome language the site has no pages in (vite.config.ts)
  useLayoutEffect(() => revealPendingChrome(), [chrome]);
  // the page in each language; for a page that does not exist, the listing
  const missing = usePageStore().peek(pathname)?.kind === "not-found";
  const alternates = localeAlternates(missing ? BASE : pathname);
  return (
    <LocaleContext value={i18n}>
      <div className="kit-shell" lang={locale.lang}>
        <PaintedBackdrop scene={path !== BASE && path !== `${BASE}index.html`} />
        <a className="kit-skip-link" href="#main" lang={chrome}>
          {uiStrings(chrome).skipToContent}
        </a>
        <GlobalBar
          current="mods"
          locale={chrome}
          sticky
          siteOrigin={SITE_ORIGIN}
          linkComponent={KitRouterLink}
          isAppPath={isAppPath}
          languages={{
            // the same page (and query) in each language; the menu stores the choice as the cross-site preference
            options: LOCALES.map(({ code, label, lang }) => ({ code, label, lang, href: alternates[code] + (missing ? "" : search) })),
            current: locale.code,
            linkComponent: KitExactLink,
          }}
        />
        {children}
        <SiteFooter locale={chrome} siteOrigin={SITE_ORIGIN} linkComponent={KitRouterLink} isAppPath={isAppPath} />
      </div>
    </LocaleContext>
  );
}

/** The current page, or an error message (cleared by going to another page). */
function PageBoundary() {
  const { pathname, search } = useLocation();
  const { t } = useI18n();
  return (
    <ErrorBoundary
      resetKey={pathname + search}
      fallback={(reset) => <ErrorMessage message={t.errorPage} reset={reset} />}
    >
      <Suspense fallback={<PageFallback />}>
        <Page />
      </Suspense>
    </ErrorBoundary>
  );
}

/** `initialLocale`: the language of the prerendered HTML being hydrated (see Shell). */
export function App({ store, initialLocale }: { store: PageStore; initialLocale?: Locale }) {
  return (
    <ThemeProvider>
      <ErrorBoundary
        fallback={(reset) => (
          <div className="kit-shell">
            <ErrorMessage message={STRINGS.en.errorCritical} reset={reset} />
          </div>
        )}
      >
        <PageStoreContext value={store}>
          <Shell initialLocale={initialLocale}>
            <ScrollOnNavigate />
            <PageBoundary />
          </Shell>
        </PageStoreContext>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
