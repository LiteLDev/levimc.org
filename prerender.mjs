// Writes one real HTML file per route (dist/about/index.html, dist/blog/…/index.html, …), 404.html,
// sitemap.xml and robots.txt. Runs after `vite build` (client) and `vite build --ssr src/entry-server.tsx
// --outDir .kit/ssr`. The blog's feeds (dist/blog/rss.xml, atom.xml, feed.json) come from the client build.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { prerenderRoutes } from './kit/ssg/prerender.mjs';

const { ROUTE_PATHS, NOT_FOUND_PATH, SITE_ORIGIN, MODS_PATH } = await import('./.kit/ssr/entry-server.js');

const { files } = await prerenderRoutes({ routes: ROUTE_PATHS, notFound: NOT_FOUND_PATH });

// A blog post / page hydrates only after its markdown chunk has loaded: fetch it alongside the entry script.
const preload = JSON.parse(readFileSync('.kit/blog-preload.json', 'utf8'));
for (const [route, chunk] of Object.entries(preload)) {
  if (!existsSync(`dist/${chunk}`)) throw new Error(`.kit/blog-preload.json is stale (dist/${chunk} missing): run the full build`);
  const file = `dist${route}index.html`;
  const html = readFileSync(file, 'utf8');
  if (!html.includes('<script type="module"')) throw new Error(`${file}: no entry script to preload ${chunk} beside`);
  writeFileSync(file, html.replace('<script type="module"', () => `<link rel="modulepreload" crossorigin href="/${chunk}">\n    <script type="module"`));
}

const urls = ROUTE_PATHS.map((p) => `  <url><loc>${SITE_ORIGIN}${encodeURI(p)}</loc></url>`).join('\n');
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
// LeviMC Mods writes its own sitemap (every mod page); its listing's query URLs (/mods/?cat=…) are all one page.
writeFileSync(
  'dist/robots.txt',
  `User-agent: *\nAllow: /\nDisallow: ${MODS_PATH}*?*\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\nSitemap: ${SITE_ORIGIN}${MODS_PATH}sitemap.xml\n`,
);

console.log(`prerendered ${files.length} pages (${Object.keys(preload).length} with a modulepreloaded post chunk) + sitemap.xml (${ROUTE_PATHS.length} URLs), robots.txt`);
