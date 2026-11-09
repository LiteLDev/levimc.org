// Serves the built site like GitHub Pages (`pnpm preview`): dist/ at /mods/
// and dist-api/ at /api/, as the levimc.org build puts them.
//   node scripts/preview.mjs [--port 4173] [--host 127.0.0.1]
import { createServer } from "node:http";
import { createPagesServer } from "../kit/scripts/serve-pages.mjs";

const args = process.argv.slice(2);
const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const port = Number(opt("--port", "4173"));
const host = opt("--host", "127.0.0.1");

const [servePages] = createPagesServer({ dist: "dist", base: "/mods/" }).listeners("request");
const [serveApi] = createPagesServer({ dist: "dist-api", base: "/api/" }).listeners("request");

const server = createServer((req, res) =>
  (req.url ?? "/").replace(/^\/{2,}/, "/").startsWith("/api/") ? serveApi(req, res) : servePages(req, res),
);
server.listen(port, host, () => console.log(`GitHub Pages emulation: http://${host}:${port}/mods/ and /api/`));
