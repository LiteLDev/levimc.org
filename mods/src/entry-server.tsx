import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { App } from "./App";
import { loadMarkdown } from "./components/lazy-markdown";
import { pageHead, parsePageData } from "./page-data";
import { PageStore } from "./page-store";
import { localeInfo, splitLocale } from "./locales";
import { loadPageData, listRoutes, listSitemapRoutes } from "./server/build-data";
import { modulePreloadTags } from "./server/client-assets";

// For prerender.mjs: the pages to write, a check of what was written, the JSON and the hero paintings.
export { listRoutes, listSitemapRoutes, parsePageData };
export { LOCALES, DEFAULT_LOCALE, localeAlternates, localeBase, localeInfo, splitLocale } from "./locales";
export { catalogJson, jsonFiles, legacyCatalogJson, legacyModJsonOf, modJson } from "./server/api";
export { HERO_FILES, heroSvg } from "./server/hero";
export { showcaseFiles } from "./server/showcase";
export { iconFiles } from "./server/icons";

/**
 * Renders one page for prerender.mjs (and the dev server): `/mods/`,
 * `/mods/<tooth>/` (and the same under `/zh-Hans/mods/`, `/zh-Hant/mods/`, in
 * that language), or anything else as the 404 page.
 */
export async function render(url: string) {
  const pathname = new URL(url, "http://localhost").pathname;
  const data = await loadPageData(pathname);
  let head = pageHead(data, pathname);
  if (data.kind === "mod") {
    await loadMarkdown();
    const preload = modulePreloadTags("src/components/markdown.tsx");
    if (preload) head += `\n    ${preload}`;
  }

  const store = new PageStore(pathname, data);
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App store={store} />
      </StaticRouter>
    </StrictMode>,
  );
  return {
    html,
    head,
    lang: localeInfo(splitLocale(pathname).locale).lang,
    status: data.kind === "not-found" ? 404 : 200,
  };
}
