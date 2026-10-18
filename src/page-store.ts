import { createContext, useContext, useSyncExternalStore } from "react";
import { loadMarkdown } from "./components/lazy-markdown";
import { parsePageData, type PageData } from "./page-data";

/** A promise React's `use()` can read synchronously once it has settled. */
type Thenable<T> = Promise<T> & {
  status?: "pending" | "fulfilled" | "rejected";
  value?: T;
  reason?: unknown;
};

function fulfilled<T>(value: T): Promise<T> {
  return Object.assign(Promise.resolve(value), {
    status: "fulfilled" as const,
    value,
  });
}

function track<T>(promise: Promise<T>): Promise<T> {
  const thenable: Thenable<T> = promise;
  thenable.status = "pending";
  promise.then(
    (value) => Object.assign(thenable, { status: "fulfilled", value }),
    (reason: unknown) => Object.assign(thenable, { status: "rejected", reason }),
  );
  return thenable;
}

/** `/index.html` and `/packages/x/index.html` are the same pages as `/` and `/packages/x/`. */
function pageKey(pathname: string): string {
  return pathname.replace(/\/index\.html$/, "/");
}

/**
 * Every page is a prerendered HTML file with its data embedded. Navigating
 * inside the app fetches that file and reads the data back out of it, so a
 * page looks the same whether it was loaded directly or reached by a link.
 * A path without a page gets the 404 page, and its data, from the host.
 */
async function loadPage(pathname: string): Promise<LoadedPage> {
  try {
    const res = await fetch(pathname, { headers: { Accept: "text/html" } });
    const data = parsePageData(await res.text());
    if (data) return data;
  } catch {
    // Offline, or the request failed: see below.
  }
  // Not one of our pages: the app renders this by loading the URL in full.
  return { kind: "unavailable" };
}

/** A page's data, or `unavailable` when it could not be fetched. */
export type LoadedPage = PageData | { kind: "unavailable" };

export class PageStore {
  private readonly pages = new Map<string, Promise<LoadedPage>>();

  constructor(pathname: string, data: PageData) {
    this.pages.set(pageKey(pathname), fulfilled(data));
  }

  /** The data of the page at `pathname`, loading it on first use. */
  get(pathname: string): Promise<LoadedPage> {
    const key = pageKey(pathname);
    let page = this.pages.get(key);
    if (!page) {
      // A failure is remembered too: the app answers it with a full page
      // load, which retries the request.
      page = track(loadPage(key));
      this.pages.set(key, page);
    }
    return page;
  }

  /** Starts loading a page the visitor is likely to open next. */
  preload(pathname: string): void {
    if (typeof window === "undefined") return;
    this.get(pathname);
    if (pathname.startsWith("/packages/")) loadMarkdown().catch(() => {});
  }
}

export const PageStoreContext = createContext<PageStore | null>(null);

export function usePageStore(): PageStore {
  const store = useContext(PageStoreContext);
  if (!store) throw new Error("PageStoreContext is missing");
  return store;
}

const noSubscription = () => () => {};

/**
 * `false` while the prerendered HTML is being hydrated, `true` afterwards and
 * for anything rendered later. The query string never reaches the static
 * host, so pages hydrate as prerendered — unfiltered, latest version — and
 * apply `?q=`, `?variant=` and friends right after.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}
