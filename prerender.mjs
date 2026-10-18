// Writes one real HTML file per route (dist/projects/index.html, …), 404.html, sitemap.xml and robots.txt.
// Runs after `vite build` (client) and `vite build --ssr src/entry-server.tsx --outDir .kit/ssr`.
import { writeFileSync } from 'node:fs';
import { prerenderRoutes } from './kit/ssg/prerender.mjs';

const { ROUTE_PATHS, NOT_FOUND_PATH, SITE_ORIGIN } = await import('./.kit/ssr/entry-server.js');

const { files } = await prerenderRoutes({ routes: ROUTE_PATHS, notFound: NOT_FOUND_PATH });

const urls = ROUTE_PATHS.map((p) => `  <url><loc>${SITE_ORIGIN}${p}</loc></url>`).join('\n');
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);

console.log(`prerendered ${files.length} pages + sitemap.xml, robots.txt`);
