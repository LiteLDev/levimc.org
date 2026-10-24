// Server entry used only at build time by prerender.mjs (no server runs in production).
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { App } from './App';
import { buildHead } from './head';
import { DEFAULT_LOCALE } from './i18n';
import { preloadBlogPath } from './blog/data';

export { ROUTE_PATHS, NOT_FOUND_PATH, SITE_ORIGIN, MODS_PATH } from './routes';
export { BLOG_ROUTES } from './blog/data';

export async function render(url: string) {
  await preloadBlogPath(url);
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );
  return { html, head: buildHead(url), lang: DEFAULT_LOCALE };
}
