import { Suspense, use, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { useLocation, useNavigationType } from "react-router";
import {
  GlobalBar,
  PaintedBackdrop,
  SiteFooter,
  ThemeProvider,
  ThemeToggle,
} from "../kit/components";
import { ErrorBoundary, ErrorMessage } from "./components/error-boundary";
import { Header } from "./components/header";
import { pageMeta, type PageData } from "./page-data";
import { PageStoreContext, usePageStore, type PageStore } from "./page-store";
import { HomePage } from "./pages/home-page";
import { NotFoundPage } from "./pages/not-found-page";
import { PackagePage } from "./pages/package-page";
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
  useEffect(() => {
    const meta = pageMeta(data);
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
  }, [data]);
}

/** How far down the results may start before a new query brings them up. */
const RESULTS_LOW = 0.6;

/**
 * New pages open at the top. A query (a search, a tag, a sort order, the
 * next page) brings the results' top into view when it is above the viewport,
 * or so far down that the results hardly show (phones, where the hero and the
 * tags come first) — whether it was made on the package list or, like a search
 * in the header, from another page. Back and forward leave scrolling to the
 * browser.
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
      return <HomePage packages={data.packages} />;
    case "package":
      return (
        <>
          <Header />
          <PackagePage
            key={data.tooth}
            tooth={data.tooth}
            pkg={data.pkg}
            repository={data.repository}
            prerendered={data.prerendered}
          />
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
    <main id="main" className="pkg-main kit-above-backdrop" aria-busy="true">
      <div className="pkg-skeleton pkg-page-skeleton">
        <span className="pkg-skeleton-bar pkg-skeleton-title" />
        <span className="pkg-skeleton-bar" />
        <span className="pkg-skeleton-bar pkg-skeleton-70" />
      </div>
    </main>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="kit-shell">
      <PaintedBackdrop />
      <a className="kit-skip-link" href="#main">
        Skip to content
      </a>
      <GlobalBar current="packages" end={<ThemeToggle />} />
      {children}
      <SiteFooter />
    </div>
  );
}

/** The current page, or an error message (cleared by going to another page). */
function PageBoundary() {
  const { pathname, search } = useLocation();
  return (
    <ErrorBoundary
      resetKey={pathname + search}
      fallback={(reset) => (
        <ErrorMessage
          message="An unexpected error occurred while loading this page. Please try again."
          reset={reset}
        />
      )}
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
            <ErrorMessage
              message="A critical error occurred. Please try refreshing the page."
              reset={reset}
            />
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
