// Server entry used only at build time by prerender.mjs (no server runs in production).
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { App, preloadRoute } from './App';
import { buildHead } from './head';
import { localeInfo } from './i18n/config';
import { preloadBlogPath } from './blog/data';
import { localeOfPath } from './routes';

export { ROUTE_PATHS, NOT_FOUND_PATH, SITE_ORIGIN, MODS_PATH, ROUTE_MODULES, routeIdOf, localeAlternates } from './routes';
export { LOCALES, DEFAULT_LOCALE } from './i18n/config';
export { BLOG_ROUTES } from './blog/data';
export { DOCS_PROJECTS } from '../kit/components';

export async function render(url: string) {
  await Promise.all([preloadRoute(url), preloadBlogPath(url)]);
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );
  // each page in its own language (the 404 page: English)
  return { html, head: buildHead(url), lang: localeInfo(localeOfPath(url)).lang };
}
