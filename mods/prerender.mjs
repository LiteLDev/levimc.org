// Prerenders every page into dist/ after `vite build` and the SSR build:
// `/mods/`, one page per mod, and 404.html; then writes sitemap.xml. See README.md.
// dist/ is the site's /mods/ folder: the levimc.org build copies it there.
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { prerenderRoutes } from "./kit/ssg/prerender.mjs";

const ORIGIN = "https://levimc.org";
const BASE = "/mods/";

const ssr = await import("./.kit/ssr/entry-server.js");
const started = Date.now();
const routes = await ssr.listRoutes();
const { files } = await prerenderRoutes({
  routes,
  base: BASE,
  notFound: `${BASE}404`,
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

// The home page's painted strip, one file per theme (see src/server/hero.ts).
for (const file of ssr.HERO_FILES) writeFileSync(`dist/${file}`, ssr.heroSvg(file));

// Crawlers see only the first page of the listing (the query string never
// reaches the host), so the sitemap lists every mod page.
const escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
writeFileSync(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    routes.map((route) => `  <url><loc>${escapeXml(ORIGIN + encodeURI(route))}</loc></url>\n`).join("") +
    `</urlset>\n`,
);

console.log(
  `prerendered ${files.length} pages and a sitemap of ${routes.length} URLs in ${((Date.now() - started) / 1000).toFixed(1)}s`,
);
