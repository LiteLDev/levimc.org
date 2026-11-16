import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { App } from './App';
import { href, langOf, loadPage, matchPathname, primePage, routerBase, routes, site } from './data';
import { docsStrings } from '../shared/strings';
import { routeHead } from '../shared/head';
import { outFileFor } from '../shared/routing';
import type { EmbeddedPageData } from '../shared/types';

export { site, routes };

/** The URL pathname of a route path (localeFirst puts the locale in front of base). */
export const pageUrl = href;

export interface RenderedPage {
  html: string;
  head: string;
  lang: string;
  pageData: EmbeddedPageData | null;
  page?: string;
  file: string;
}

/** Render one URL (full pathname including base) to static HTML. `file` is relative to the output folder. */
export async function render(url: string): Promise<RenderedPage> {
  const route = matchPathname(url);
  let pageData: EmbeddedPageData | null = null;
  if (route) {
    const data = await loadPage(route.page);
    primePage(route.page, data);
    pageData = { page: route.page, toc: data.toc, meta: data.meta, hero: data.hero, features: data.features, frontmatter: data.frontmatter };
  }
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url} basename={routerBase}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );
  const locale = route?.locale ?? site.defaultLocale;
  return {
    html,
    head: routeHead(site, route, docsStrings(langOf(locale)).pageNotFound),
    lang: langOf(locale),
    pageData,
    page: route?.page,
    // localeFirst: the output folder is the host root, so a page's file is its URL
    file: route ? outFileFor(site.localeFirst ? href(route.path).slice(1) : route.path) : '404.html',
  };
}
