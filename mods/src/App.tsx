import { BASE } from "./base-path";
import { Suspense, use, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { useLocation, useNavigationType } from "react-router";
import {
  GlobalBar,
  PaintedBackdrop,
  SiteFooter,
  ThemeProvider,
  usePreferredLocale,
} from "./kit-ui";
import { ErrorBoundary, ErrorMessage } from "./components/error-boundary";
import { Header } from "./components/header";
import { KitRouterLink } from "./components/router-link";
import { LocaleContext, STRINGS, useI18n, type Strings } from "./i18n";
import { LOCALES } from "./locales";
import { pageMeta, SITE_ORIGIN, type PageData } from "./page-data";
import { PageStoreContext, usePageStore, type PageStore } from "./page-store";
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
  const { locale, t } = useI18n();
  useEffect(() => {
    const meta = pageMeta(data);
    document.title = locale === "en" ? meta.title : localizedTitle(data, t);
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
  }, [data, locale, t]);
}

/** The tab title in the interface language (pages are prerendered with the English one). */
function localizedTitle(data: PageData, t: Strings): string {
  switch (data.kind) {
    case "home":
      return `${t.siteName} — ${t.tagline}`;
    case "mod":
      return `${data.entry.name} | ${t.siteName}`;
    case "not-found":
      return `${t.notFoundTitle} | ${t.siteName}`;
  }
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
          <ModPage key={data.tooth} data={data} />
        </>
      );
    case "not-found":
      return (
        <>
          <Header />
          <NotFoundPage tooths={data.tooths} />
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

/** levimc.org links outside `/mods/` (Home, Blog, …) belong to the main site: they load in full. */
const isAppPath = (path: string) => path.startsWith(BASE);

/**
 * The LeviMC bar (the site's languages, the shared theme menu, GitHub), the
 * page and the LeviMC footer. The interface follows the visitor's cross-site
 * language preference; pages are prerendered in English.
 */
function Shell({ children }: { children: ReactNode }) {
  const [locale, setLocale] = usePreferredLocale(LOCALES, LOCALES[0]);
  const i18n = useMemo(() => ({ locale: locale.code, t: STRINGS[locale.code] }), [locale.code]);
  const { pathname } = useLocation();
  useEffect(() => {
    // the document's language is the interface's (prerendered as English)
    document.documentElement.lang = locale.lang;
  }, [locale.lang]);
  return (
    <LocaleContext value={i18n}>
      <div className="kit-shell" lang={locale.lang}>
        <PaintedBackdrop scene={pathname !== BASE && pathname !== `${BASE}index.html`} />
        <a className="kit-skip-link" href="#main">
          {i18n.t.skipToContent}
        </a>
        <GlobalBar
          current="mods"
          locale={locale.lang}
          sticky
          siteOrigin={SITE_ORIGIN}
          linkComponent={KitRouterLink}
          isAppPath={isAppPath}
          languages={{
            options: LOCALES.map(({ code, label, lang }) => ({ code, label, lang })),
            current: locale.code,
            onSelect: setLocale,
          }}
        />
        {children}
        <SiteFooter locale={locale.lang} siteOrigin={SITE_ORIGIN} linkComponent={KitRouterLink} isAppPath={isAppPath} />
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

export function App({ store }: { store: PageStore }) {
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
          <Shell>
            <ScrollOnNavigate />
            <PageBoundary />
          </Shell>
        </PageStoreContext>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
