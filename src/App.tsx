import { Suspense, useEffect, useRef } from 'react';
import { Route, Routes, useLocation, useNavigationType } from 'react-router';
import { PaintedBackdrop, ThemeProvider, uiStrings } from '../kit/components';
import SiteHeader from './components/SiteHeader';
import Footer from './components/Footer';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import { resolveBlogPath } from './blog/data';
import { lazyRoute } from './lazy-route';
import { I18nProvider, useI18n } from './i18n';
import { markHydrated } from './hooks/useExternalData';
import { canonicalPath, pathOf, routeIdOf, routeMeta, type RouteId } from './routes';

// The home (the landing page) and the 404 are in the entry chunk; every other page is its own chunk.
const About = lazyRoute(() => import('./pages/About'));
const Community = lazyRoute(() => import('./pages/Community'));
const Support = lazyRoute(() => import('./pages/Support'));
const Blog = lazyRoute(() => import('./blog/Blog'));
const LAZY_ROUTES: Partial<Record<RouteId, ReturnType<typeof lazyRoute>>> = { about: About, community: Community, support: Support, blog: Blog };

/** Load the chunk of the page at `pathname` (before hydrating or prerendering it). */
export function preloadRoute(pathname: string): Promise<void> {
  const id = routeIdOf(pathname);
  return (id && LAZY_ROUTES[id]?.preload()) || Promise.resolve();
}

/** The other pages' chunks, fetched once the browser is idle after load (so a link never waits for one). */
function preloadAllRoutes() {
  const run = () => {
    for (const r of Object.values(LAZY_ROUTES)) void r.preload().catch(() => {});
  };
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: 5000 });
  else window.setTimeout(run, 2000);
}

function Shell() {
  const { t, chrome } = useI18n();
  const { pathname } = useLocation();
  const routeId = routeIdOf(pathname);
  // the skip link is part of the LeviMC chrome (its language, see chromeLocaleFor)
  const ui = uiStrings(chrome);

  // Keep the tab title in sync with the page and language.
  useEffect(() => {
    document.title = routeMeta(pathname, t).title;
  }, [pathname, t]);

  // Start each newly visited page at the top; leave the first load and back/forward alone.
  const navigationType = useNavigationType();
  const lastPathname = useRef(pathname);
  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    if (navigationType !== 'POP' && !window.location.hash) window.scrollTo(0, 0);
  }, [pathname, navigationType]);

  return (
    <div className="kit-shell">
      {/* pages with a painted hero (home, blog index) never also show the backdrop's scene band */}
      <PaintedBackdrop scene={routeId !== 'home' && resolveBlogPath(canonicalPath(pathname))?.kind !== 'index'} />
      <a className="kit-skip-link" href="#main">
        {ui.skipToContent}
      </a>
      <SiteHeader current={routeId} />
      <main id="main" className="kit-above-backdrop" tabIndex={-1}>
        <Suspense fallback={<div className="lm-route-loading" />}>
          <Routes>
            <Route caseSensitive path={pathOf('home')} element={<Home />} />
            <Route caseSensitive path={pathOf('community')} element={<Community.Component />} />
            <Route caseSensitive path={pathOf('about')} element={<About.Component />} />
            <Route caseSensitive path={pathOf('support')} element={<Support.Component />} />
            <Route caseSensitive path="/blog/*" element={<Blog.Component />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export function App() {
  useEffect(() => {
    markHydrated();
    preloadAllRoutes();
  }, []);
  return (
    <ThemeProvider>
      <I18nProvider>
        <Shell />
      </I18nProvider>
    </ThemeProvider>
  );
}
