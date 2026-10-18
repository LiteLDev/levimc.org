import { readFileSync } from "node:fs";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createThemeInitScript } from "./kit/components/theme.ts";
import { FONT_HEAD_HTML } from "./kit/components/fonts.ts";
import { LISTING_KEYS } from "./src/lib/catalog-query.ts";
import { STORAGE_KEYS } from "./src/lib/storage.ts";
import { LOCALES } from "./src/locales.ts";

/**
 * The kit's pre-paint script: the cross-site theme and language preferences
 * (cookies on levimc.org). A visitor whose language is not the prerendered
 * English sees the page only once it has switched (`usePreferredLocale`).
 */
const prefsScript = createThemeInitScript({ appLocales: { locales: LOCALES, prerendered: "en" } });

/**
 * The listing's own pre-paint state: the viewer's list/grid choice, and
 * `data-pkg-pending` while a query in the URL (`/?cat=…`) is not applied yet —
 * the page is prerendered unfiltered, so its results stay hidden until the
 * app has applied the query (at most 4 s).
 */
const listingScript =
  `(function(){var d=document.documentElement;try{if(localStorage.getItem(${JSON.stringify(STORAGE_KEYS.view)})==="grid")d.setAttribute("data-view","grid")}catch(e){}` +
  `var p=location.pathname;if((p==="/"||p==="/index.html")&&/[?&](${LISTING_KEYS.join("|")})=/.test(location.search)){` +
  `d.setAttribute("data-pkg-pending","");setTimeout(function(){d.removeAttribute("data-pkg-pending")},4000)}})()`;

/**
 * The kit's pre-paint script and web fonts go into `<head>` from the kit
 * itself, so they never drift from what the other LeviMC sites ship.
 */
function kitHead(): Plugin {
  return {
    name: "pkg:kit-head",
    transformIndexHtml(html) {
      return html.replace(
        "<!--kit-head-->",
        () => `<script>${prefsScript}</script><script>${listingScript}</script>${FONT_HEAD_HTML}`,
      );
    },
  };
}

/**
 * `pnpm dev` renders every page on the server like the production build
 * does, so the dev server and `dist/` share one code path.
 */
function devServerRender(): Plugin {
  return {
    name: "pkg:dev-render",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          const url = req.originalUrl ?? "/";
          // The hero paintings are written by prerender.mjs; drawn on request here.
          const hero = /^\/(hero-(?:light|dark)\.svg)$/.exec(url.split("?")[0] ?? "");
          if (hero) {
            const entry = await server.ssrLoadModule("/src/entry-server.tsx");
            res.setHeader("Content-Type", "image/svg+xml");
            res.end(entry.heroSvg(hero[1]));
            return;
          }
          const accept = req.headers.accept ?? "";
          if (req.method !== "GET" || !accept.includes("text/html")) {
            next();
            return;
          }
          try {
            const template = await server.transformIndexHtml(
              url,
              readFileSync("index.html", "utf8"),
            );
            const entry = await server.ssrLoadModule("/src/entry-server.tsx");
            const page = await entry.render(url);
            // Functions, so `$&` and friends in a README stay as written.
            const html = template
              .replace("<!--app-head-->", () => page.head)
              .replace("<!--app-html-->", () => page.html);
            res.statusCode = page.status ?? 200;
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(html);
          } catch (error) {
            server.ssrFixStacktrace(error as Error);
            next(error);
          }
        });
      };
    },
  };
}

export default defineConfig({
  // HTML is rendered by `devServerRender` in dev and by prerender.mjs at build.
  appType: "custom",
  plugins: [react(), tailwindcss(), kitHead(), devServerRender()],
  build: {
    // Read by the prerender to preload the README renderer on package pages;
    // prerender.mjs deletes it afterwards.
    manifest: true,
  },
  optimizeDeps: {
    // Only the app's own entry: the vendored kit has HTML entries of its own
    // (docs engine, static pages) that are not part of this site.
    entries: ["index.html"],
  },
});
