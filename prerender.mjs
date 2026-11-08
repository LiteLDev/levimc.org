// Writes one real HTML file per route (dist/about/index.html, dist/blog/…/index.html, …), 404.html,
// sitemap.xml and robots.txt. Runs after `vite build` (client) and `vite build --ssr src/entry-server.tsx
// --outDir .kit/ssr`. The blog's feeds (dist/blog/rss.xml, atom.xml, feed.json) come from the client build.
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { prerenderRoutes } from './kit/ssg/prerender.mjs';

const { ROUTE_PATHS, NOT_FOUND_PATH, SITE_ORIGIN, MODS_PATH, ROUTE_MODULES, routeIdOf } = await import('./.kit/ssr/entry-server.js');

const { files } = await prerenderRoutes({ routes: ROUTE_PATHS, notFound: NOT_FOUND_PATH });

// Vite's manifest: which chunks each page module needs (it is not part of the site).
const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'));
rmSync('dist/.vite', { recursive: true, force: true });
const inEntry = new Set();
for (const queue = Object.keys(manifest).filter((k) => manifest[k].isEntry); queue.length; ) {
  const k = queue.pop();
  if (inEntry.has(k)) continue;
  inEntry.add(k);
  queue.push(...(manifest[k].imports ?? []));
}
/**
 * The chunk files of a page module and of the chunks it imports statically, but those the entry already has, and
 * their stylesheets (linked in the page, so its first paint has them; Vite's loader then does not add them again).
 */
function chunksOf(key) {
  if (!manifest[key]) throw new Error(`prerender: ${key} is not in Vite's manifest`);
  const js = [];
  const css = [];
  const seen = new Set();
  for (const queue = [key]; queue.length; ) {
    const k = queue.pop();
    if (seen.has(k) || inEntry.has(k)) continue;
    seen.add(k);
    js.push(manifest[k].file);
    css.push(...(manifest[k].css ?? []));
    queue.push(...(manifest[k].imports ?? []));
  }
  return { js, css };
}

// A page hydrates only after its own chunk (every page but the home, see src/App.tsx) and, for a blog post or page,
// its markdown chunk have loaded: fetch them alongside the entry script.
const blogPreload = JSON.parse(readFileSync('.kit/blog-preload.json', 'utf8'));
let preloaded = 0;
for (const route of ROUTE_PATHS) {
  const module = ROUTE_MODULES[routeIdOf(route)];
  const page = module ? chunksOf(module) : { js: [], css: [] };
  const chunks = [...page.js, ...(blogPreload[route] ? [blogPreload[route]] : [])];
  if (!chunks.length) continue;
  for (const chunk of [...chunks, ...page.css]) {
    if (!existsSync(`dist/${chunk}`)) throw new Error(`dist/${chunk} is missing (stale .kit/blog-preload.json?): run the full build`);
  }
  const file = `dist${route}index.html`;
  let html = readFileSync(file, 'utf8');
  if (!html.includes('<script type="module"')) throw new Error(`${file}: no entry script to preload ${chunks.join(', ')} beside`);
  const links = chunks.map((chunk) => `<link rel="modulepreload" crossorigin href="/${chunk}">\n    `).join('');
  html = html.replace('<script type="module"', () => `${links}<script type="module"`);
  if (page.css.length) {
    const sheets = page.css.map((f) => `<link rel="stylesheet" crossorigin href="/${f}">\n  `).join('');
    html = html.replace('</head>', () => `${sheets}</head>`);
  }
  writeFileSync(file, html);
  preloaded++;
}

const urls = ROUTE_PATHS.map((p) => `  <url><loc>${SITE_ORIGIN}${encodeURI(p)}</loc></url>`).join('\n');
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
// LeviMC Mods writes its own sitemap (every mod page); its listing's query URLs (/mods/?cat=…) are all one page.
writeFileSync(
  'dist/robots.txt',
  `User-agent: *\nAllow: /\nDisallow: ${MODS_PATH}*?*\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\nSitemap: ${SITE_ORIGIN}${MODS_PATH}sitemap.xml\n`,
);

console.log(`prerendered ${files.length} pages (${preloaded} with modulepreloaded page/post chunks) + sitemap.xml (${ROUTE_PATHS.length} URLs), robots.txt`);
