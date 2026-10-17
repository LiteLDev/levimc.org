import { useEffect, useRef } from 'react';
import { Route, Routes, useLocation, useNavigationType } from 'react-router';
import { GlobalBar, PaintedBackdrop, ThemeProvider, uiStrings, type SiteId } from '../kit/components';
import SiteHeader from './components/SiteHeader';
import Footer from './components/Footer';
import Home from './pages/Home';
import Projects from './pages/Projects';
import FeaturesPage from './pages/FeaturesPage';
import Community from './pages/Community';
import About from './pages/About';
import Support from './pages/Support';
import NotFound from './pages/NotFound';
import { I18nProvider, useI18n, kitLocale } from './i18n';
import { markHydrated } from './hooks/useExternalData';
import { pathOf, routeIdOf, routeMeta, type RouteId } from './routes';

/** Which item of the cross-site GlobalBar this page belongs to. */
const GLOBAL_BAR_CURRENT: Partial<Record<RouteId, SiteId>> = {
  home: 'home',
  projects: 'projects',
  community: 'community',
  about: 'about',
};

function Shell() {
  const { t, locale } = useI18n();
  const { pathname } = useLocation();
  const routeId = routeIdOf(pathname);
  const ui = uiStrings(kitLocale[locale]);

  // Keep the tab title in sync with the page and language.
  useEffect(() => {
    document.title = routeMeta(routeId, t).title;
  }, [routeId, t]);

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
      <PaintedBackdrop scene={routeId !== 'home'} />
      <a className="kit-skip-link" href="#main">
        {ui.skipToContent}
      </a>
      <GlobalBar current={routeId ? GLOBAL_BAR_CURRENT[routeId] : undefined} locale={kitLocale[locale]} />
      <SiteHeader />
      <main id="main" className="kit-above-backdrop" tabIndex={-1}>
        <Routes>
          <Route path={pathOf('home')} element={<Home />} />
          <Route path={pathOf('projects')} element={<Projects />} />
          <Route path={pathOf('features')} element={<FeaturesPage />} />
          <Route path={pathOf('community')} element={<Community />} />
          <Route path={pathOf('about')} element={<About />} />
          <Route path={pathOf('support')} element={<Support />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export function App() {
  useEffect(() => markHydrated(), []);
  return (
    <ThemeProvider>
      <I18nProvider>
        <Shell />
      </I18nProvider>
    </ThemeProvider>
  );
}
