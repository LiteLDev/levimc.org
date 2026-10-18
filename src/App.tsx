import { useEffect, useRef } from 'react';
import { Route, Routes, useLocation, useNavigationType } from 'react-router';
import { PaintedBackdrop, ThemeProvider, uiStrings } from '../kit/components';
import SiteHeader from './components/SiteHeader';
import Footer from './components/Footer';
import Home from './pages/Home';
import Projects from './pages/Projects';
import FeaturesPage from './pages/FeaturesPage';
import Community from './pages/Community';
import About from './pages/About';
import Support from './pages/Support';
import NotFound from './pages/NotFound';
import Blog from './blog/Blog';
import { resolveBlogPath } from './blog/data';
import { I18nProvider, useI18n, kitLocale } from './i18n';
import { markHydrated } from './hooks/useExternalData';
import { canonicalPath, pathOf, routeIdOf, routeMeta } from './routes';

function Shell() {
  const { t, locale } = useI18n();
  const { pathname } = useLocation();
  const routeId = routeIdOf(pathname);
  const ui = uiStrings(kitLocale[locale]);

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
        <Routes>
          <Route caseSensitive path={pathOf('home')} element={<Home />} />
          <Route caseSensitive path={pathOf('projects')} element={<Projects />} />
          <Route caseSensitive path={pathOf('features')} element={<FeaturesPage />} />
          <Route caseSensitive path={pathOf('community')} element={<Community />} />
          <Route caseSensitive path={pathOf('about')} element={<About />} />
          <Route caseSensitive path={pathOf('support')} element={<Support />} />
          <Route caseSensitive path="/blog/*" element={<Blog />} />
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
