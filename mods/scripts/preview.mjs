// Serves the built site like GitHub Pages (`pnpm preview`): dist/ at /mods/, dist-locales/<lang>/ at
// /<lang>/mods/ and dist-api/ at /api/, as the levimc.org build puts them.
//   node scripts/preview.mjs [--port 4173] [--host 127.0.0.1]
import { createServer } from "node:http";
import { existsSync, readdirSync } from "node:fs";
import { createPagesServer, resolvePagesPath } from "../kit/scripts/serve-pages.mjs";

const args = process.argv.slice(2);
const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const port = Number(opt("--port", "4173"));
const host = opt("--host", "127.0.0.1");

const handler = (dist, base) => createPagesServer({ dist, base }).listeners("request")[0];
const servePages = handler("dist", "/mods/");
const serveApi = handler("dist-api", "/api/");
const locales = (existsSync("dist-locales") ? readdirSync("dist-locales", { withFileTypes: true }) : [])
  .filter((d) => d.isDirectory())
  .map((d) => ({ dist: `dist-locales/${d.name}`, base: `/${d.name}/mods/` }))
  .map((l) => ({ ...l, serve: handler(l.dist, l.base) }));

const server = createServer((req, res) => {
  const path = (req.url ?? "/").replace(/^\/{2,}/, "/");
  if (path.startsWith("/api/")) return serveApi(req, res);
  // /zh-Hans/mods (no slash) too: its server answers it with a redirect to /zh-Hans/mods/
  const locale = locales.find((l) => path.startsWith(l.base) || path.split(/[?#]/)[0] === l.base.slice(0, -1));
  if (!locale) return servePages(req, res);
  // a page that does not exist in another language gets the 404 page of dist/ (GitHub Pages: the site's 404.html)
  const pathname = new URL(path, "http://localhost").pathname;
  return resolvePagesPath(locale.dist, locale.base, pathname).status === 404 ? servePages(req, res) : locale.serve(req, res);
});
server.listen(port, host, () =>
  console.log(`GitHub Pages emulation: http://${host}:${port}/mods/, ${locales.map((l) => l.base).join(", ")} and /api/`),
);
