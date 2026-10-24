// Writes one real HTML file per route (dist/about/index.html, dist/blog/…/index.html, …), 404.html,
// sitemap.xml and robots.txt. Runs after `vite build` (client) and `vite build --ssr src/entry-server.tsx
// --outDir .kit/ssr`. The blog's feeds (dist/blog/rss.xml, atom.xml, feed.json) come from the client build.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { prerenderRoutes } from './kit/ssg/prerender.mjs';

const { ROUTE_PATHS, NOT_FOUND_PATH, SITE_ORIGIN, MOVED, MODS_PATH } = await import('./.kit/ssr/entry-server.js');

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

// GitHub Pages paths are case-sensitive: /About/ answers 404.html. Before anything paints, the 404 page sends a
// visitor who only got the case (or a trailing slash) wrong to the page they meant; everyone else gets the 404.
const caseFix =
  `<script>(function(){try{var R=${JSON.stringify(ROUTE_PATHS)},p=location.pathname.replace(/\\/{2,}/g,"/").replace(/index\\.html$/,""),i;` +
  `if(p.slice(-1)!=="/")p+="/";try{p=decodeURI(p)}catch(e){}var l=p.toLowerCase();for(i=0;i<R.length;i++)if(R[i].toLowerCase()===l&&R[i]!==location.pathname){` +
  `location.replace(R[i]+location.search+location.hash);return}}catch(e){}})();</script>`;
// LeviMC Mods (mods/, deployed into dist/mods/) has a 404 page of its own, which also sends a mistyped mod path on to
// the mod; GitHub Pages only serves this one. So a /mods/… path the host does not have shows that page instead: it is
// fetched and written over this one before anything paints (`/Mods/…` is sent to `/mods/…` first).
const modsNotFound =
  `<script>(function(){var M=${JSON.stringify(MODS_PATH)},n=M.length,p=location.pathname,d=document.documentElement;` +
  `if(p.slice(0,n)!==M){if(p.slice(0,n).toLowerCase()===M)location.replace(M+p.slice(n)+location.search+location.hash);return}` +
  `d.style.visibility="hidden";fetch(M+"404.html").then(function(r){if(!r.ok)throw r.status;return r.text()})` +
  `.then(function(h){document.open();document.write(h);document.close()},function(){d.style.visibility=""})})();</script>`;
const notFound = 'dist/404.html';
writeFileSync(notFound, readFileSync(notFound, 'utf8').replace(/<head>/, () => `<head>\n    ${modsNotFound}\n    ${caseFix}`));

// Pages that became home-page sections (/projects/ → /#projects): a redirect page at the old URL, for links and
// bookmarks (canonical + meta refresh for crawlers and readers without JavaScript, location.replace for the rest).
for (const [from, to] of Object.entries(MOVED)) {
  const url = SITE_ORIGIN + to;
  mkdirSync(`dist${from}`, { recursive: true });
  writeFileSync(
    `dist${from}index.html`,
    `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>LeviMC</title>\n<link rel="canonical" href="${url}">\n` +
      `<meta name="robots" content="noindex">\n<meta http-equiv="refresh" content="0; url=${to}">\n<script>location.replace(${JSON.stringify(to)})</script>\n</head>\n` +
      `<body><p>Moved to <a href="${to}">${url}</a>.</p></body>\n</html>\n`,
  );
}

const urls = ROUTE_PATHS.map((p) => `  <url><loc>${SITE_ORIGIN}${encodeURI(p)}</loc></url>`).join('\n');
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
// LeviMC Mods writes its own sitemap (every mod page); its listing's query URLs (/mods/?cat=…) are all one page.
writeFileSync(
  'dist/robots.txt',
  `User-agent: *\nAllow: /\nDisallow: ${MODS_PATH}*?*\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\nSitemap: ${SITE_ORIGIN}${MODS_PATH}sitemap.xml\n`,
);

console.log(`prerendered ${files.length} pages, ${Object.keys(MOVED).length} redirects (${Object.keys(preload).length} with a modulepreloaded post chunk) + sitemap.xml (${ROUTE_PATHS.length} URLs), robots.txt`);
