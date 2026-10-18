// Prerenders every page into dist/ after `vite build` and the SSR build:
// `/`, one page per package, and 404.html. See README.md.
import { readFileSync, rmSync } from "node:fs";
import { prerenderRoutes } from "./kit/ssg/prerender.mjs";

const ssr = await import("./.kit/ssr/entry-server.js");
const started = Date.now();
const { files } = await prerenderRoutes({
  routes: () => ssr.listRoutes(),
  notFound: "/404",
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

console.log(
  `prerendered ${files.length} pages in ${((Date.now() - started) / 1000).toFixed(1)}s`,
);
