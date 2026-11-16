// Prerenders every page after `vite build` and the SSR build: `/mods/` and one page per mod, in every language
// (`/zh-Hans/mods/…`), and 404.html, each page's index.json next to it; then writes sitemap.xml and the redirect
// pages of the old URLs. See README.md.
// dist/ is the site's /mods/ folder, dist-locales/<lang>/ its /<lang>/mods/ folder (the pages in that language; the
// files they load stay under /mods/) and dist-api/ its /api/ folder: the levimc.org build copies them there.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { prerenderRoutes } from "./kit/ssg/prerender.mjs";

const ORIGIN = "https://levimc.org";
const BASE = "/mods/";
const LOCALES_DIR = "dist-locales";

const ssr = await import("./.kit/ssr/entry-server.js");
const started = Date.now();
const routes = await ssr.listRoutes();

/** The file of a page, relative to dist/: `/mods/x/` → `x/index.html`, `/zh-Hans/mods/x/` → `../dist-locales/zh-Hans/x/index.html`. */
const pageFile = (route) => {
  const { locale, path } = ssr.splitLocale(route.split(/[?#]/)[0]);
  const rest = `${path.slice(BASE.length)}index.html`;
  const { prefix } = ssr.localeInfo(locale);
  return prefix ? `../${LOCALES_DIR}/${prefix}${rest}` : rest;
};
rmSync(LOCALES_DIR, { recursive: true, force: true });
const { files } = await prerenderRoutes({
  routes,
  base: BASE,
  notFound: `${BASE}404`,
  outFile: pageFile,
});
// Vite's manifest was only needed while rendering; it is not part of the site.
rmSync("dist/.vite", { recursive: true, force: true });

// Every page must be filled in completely, with data that parses: READMEs are
// third-party text, and a slip in how it is put into the template would ship
// pages that do not match what the browser renders.
for (const file of files) {
  const html = readFileSync(file, "utf8");
  if (html.includes("<!--app-head-->") || html.includes("<!--app-html-->")) {
    throw new Error(`${file}: a template placeholder is left in the page`);
  }
  if (!ssr.parsePageData(html)) throw new Error(`${file}: the page data is missing`);
}

// The mods' galleries, as the pages above loaded them (see src/server/showcase.ts).
for (const [path, { body }] of ssr.showcaseFiles()) {
  mkdirSync(dirname(`dist/${path}`), { recursive: true });
  writeFileSync(`dist/${path}`, body);
}

// The mods' icons, scaled down to the sizes the pages show them at (see src/server/icons.ts).
for (const [path, body] of ssr.iconFiles()) {
  mkdirSync(dirname(`dist/${path}`), { recursive: true });
  writeFileSync(`dist/${path}`, body);
}

// The JSON: /api/v4/mods/index.json and /api/v4/mods/<id>/index.json, and the
// JSON from before version 4 next to the pages (see src/server/api.ts).
const json = await ssr.jsonFiles();
rmSync("dist-api", { recursive: true, force: true });
for (const [sitePath, body] of json) {
  const file = sitePath.startsWith("mods/")
    ? `dist/${sitePath.slice("mods/".length)}`
    : sitePath.startsWith("api/")
      ? `dist-api/${sitePath.slice("api/".length)}`
      : null;
  if (!file) throw new Error(`${sitePath}: not under /mods/ or /api/`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
}

// The home page's painted strip, one file per theme (see src/server/hero.ts).
for (const file of ssr.HERO_FILES) writeFileSync(`dist/${file}`, ssr.heroSvg(file));

// Crawlers see only the first page of the listing (the query string never
// reaches the host), so the sitemap lists every mod page in every language,
// each with its alternates (but the old names of a repository, whose pages
// point to the current one as canonical). A sitemap may list only URLs under its own folder, so each language's
// pages are in a sitemap in that language's folder (/mods/sitemap-pages.xml, /zh-Hans/mods/sitemap-pages.xml …), and
// /mods/sitemap.xml (the one levimc.org's robots.txt names) is the index of those.
const sitemap = await ssr.listSitemapRoutes();
const escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const loc = (route) => escapeXml(ORIGIN + encodeURI(route));
const alternateLinks = (route) => {
  const alternates = ssr.localeAlternates(route);
  return [...ssr.LOCALES.map((l) => [l.lang, alternates[l.code]]), ["x-default", alternates[ssr.DEFAULT_LOCALE]]]
    .map(([lang, href]) => `\n    <xhtml:link rel="alternate" hreflang="${lang}" href="${loc(href)}"/>`)
    .join("");
};
const SITEMAP_PAGES = "sitemap-pages.xml";
for (const l of ssr.LOCALES) {
  const routesIn = sitemap.filter((route) => ssr.splitLocale(route).locale === l.code);
  const dir = l.prefix ? `${LOCALES_DIR}/${l.prefix}` : "dist/";
  writeFileSync(
    `${dir}${SITEMAP_PAGES}`,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
      routesIn.map((route) => `  <url><loc>${loc(route)}</loc>${alternateLinks(route)}\n  </url>\n`).join("") +
      `</urlset>\n`,
  );
}
writeFileSync(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    ssr.LOCALES.map((l) => `  <sitemap><loc>${loc(ssr.localeBase(l.code) + SITEMAP_PAGES)}</loc></sitemap>\n`).join("") +
    `</sitemapindex>\n`,
);

// The old URLs of the pages in the other languages (/mods/zh-Hans/<page>, from before the language came first):
// redirect pages to the page's URL now (/zh-Hans/mods/<page>), keeping the query (the listing's filters) and #hash
// (without JavaScript, the meta refresh leads to the page without them).
const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
let redirects = 0;
for (const route of routes) {
  const { locale, path } = ssr.splitLocale(route);
  const { prefix, lang } = ssr.localeInfo(locale);
  if (!prefix) continue;
  const file = `dist/${prefix}${path.slice(BASE.length)}index.html`;
  const url = ORIGIN + encodeURI(route);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    `<!doctype html>\n<html lang="${lang}">\n<head>\n<meta charset="utf-8">\n<title>Redirecting…</title>\n<meta name="robots" content="noindex">\n` +
      `<link rel="canonical" href="${escapeHtml(url)}">\n<meta http-equiv="refresh" content="0; url=${escapeHtml(url)}">\n` +
      `<script>location.replace(${JSON.stringify(encodeURI(route)).replace(/</g, "\\u003c")}+location.search+location.hash);</script>\n</head>\n` +
      `<body><p>This page has moved to <a href="${escapeHtml(url)}">${escapeHtml(url)}</a>.</p></body>\n</html>\n`,
  );
  redirects++;
}

console.log(
  `prerendered ${files.length} pages, ${redirects} redirect pages of old URLs, ${json.size} JSON files and a sitemap of ` +
    `${sitemap.length} URLs in ${((Date.now() - started) / 1000).toFixed(1)}s`,
);
