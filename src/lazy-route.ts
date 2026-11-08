// Pages other than the home are their own chunks (React.lazy). The page being opened is loaded before hydrating
// (entry-client.tsx; prerender.mjs modulepreloads its chunk beside the entry script) and before rendering on the
// server, so the first render never suspends and matches the prerendered HTML; the other pages are fetched when
// the browser is idle after load, so following a link does not wait for them either.
import { createElement, lazy, useState, type ComponentType } from 'react';

export interface LazyRoute {
  /** Renders the page: synchronously once its chunk is loaded, else through React.lazy (inside a Suspense). */
  Component: ComponentType;
  /** Load the page's chunk (once). */
  preload: () => Promise<void>;
}

export function lazyRoute(load: () => Promise<{ default: ComponentType }>): LazyRoute {
  let loaded: ComponentType | undefined;
  let promise: Promise<void> | undefined;
  const preload = () =>
    (promise ??= load().then(
      (m) => {
        loaded = m.default;
      },
      (error: unknown) => {
        promise = undefined; // a failed chunk request is tried again on the next preload / render
        throw error;
      },
    ));
  const Lazy = lazy(() => preload().then(() => ({ default: loaded! })));
  function Component() {
    // chosen once per mount, so the page is not remounted when its chunk arrives
    const [Page] = useState<ComponentType>(() => loaded ?? Lazy);
    return createElement(Page);
  }
  return { Component, preload };
}
