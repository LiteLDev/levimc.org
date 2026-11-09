import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createThemeInitScript } from "./kit/components/theme.ts";
import { FONT_HEAD_HTML } from "./kit/components/fonts.ts";
import { UI_LOCALES } from "./kit/components/i18n.ts";
import { noJsDarkCss } from "./kit/static/nojs-dark.mjs";
import { BASE } from "./src/base-path.ts";
import { LISTING_KEYS } from "./src/lib/catalog-query.ts";
import { STORAGE_KEYS } from "./src/lib/storage.ts";
import { LOCALES } from "./src/locales.ts";

/**
 * The kit's pre-paint script: the cross-site theme and language preferences
 * (cookies on levimc.org). A visitor whose language is not the prerendered
 * English sees the page only once it has switched (`usePreferredLocale`); one
 * whose stored language the site has no pages in but the kit has chrome
 * strings for (de, ja …) sees the bar and footer only once they speak it
 * (`useChromeLocale`, src/chrome-locale.ts).
 */
const prefsScript = createThemeInitScript({
  appLocales: { locales: LOCALES, prerendered: "en" },
  chromeLocales: UI_LOCALES,
});

/**
 * The listing's own pre-paint state: the viewer's list/grid choice, and
 * `data-mods-pending` while a query in the URL (`/mods/?tags=…`) is not applied yet —
 * the page is prerendered unfiltered, so its results stay hidden until the
 * app has applied the query (at most 4 s).
 */
const listingScript =
  `(function(){var d=document.documentElement;try{if(localStorage.getItem(${JSON.stringify(STORAGE_KEYS.view)})==="grid")d.setAttribute("data-view","grid")}catch(e){}` +
  `var p=location.pathname;if((p===${JSON.stringify(BASE)}||p===${JSON.stringify(`${BASE}index.html`)})&&/[?&](${LISTING_KEYS.join("|")})=/.test(location.search)){` +
  `d.setAttribute("data-mods-pending","");setTimeout(function(){d.removeAttribute("data-mods-pending")},4000)}})()`;

/**
 * The kit's pre-paint script and web fonts go into `<head>` from the kit
 * itself, so they never drift from what the other LeviMC sites ship.
 */
function kitHead(): Plugin {
  return {
    name: "mods:kit-head",
    transformIndexHtml(html) {
      return html.replace(
        "<!--kit-head-->",
        () => `<script>${prefsScript}</script><script>${listingScript}</script>${FONT_HEAD_HTML}`,
      );
    },
  };
}

/**
 * Readers without JavaScript whose system is dark get the dark theme, as on
 * every docs page: the built stylesheet's .dark rules as :root rules
 * (kit/static/nojs-dark.mjs), linked in <noscript> with
 * media="(prefers-color-scheme: dark)" from the page template.
 */
function noJsDark(): Plugin {
  let ssr = false;
  let outDir = "dist";
  return {
    name: "mods:nojs-dark",
    apply: "build",
    configResolved(config) {
      ssr = !!config.build.ssr;
      outDir = config.build.outDir;
    },
    writeBundle(_opts, bundle) {
      if (ssr) return;
      const css = Object.values(bundle)
        .map((o) => (o.type === "asset" && o.fileName.endsWith(".css") ? String(o.source) : ""))
        .join("\n");
      if (!css) return;
      const dark = noJsDarkCss(css, { source: "the LeviMC Mods build from the site stylesheet" });
      const file = `assets/kit-nojs-dark.${createHash("sha256").update(dark).digest("hex").slice(0, 8)}.css`;
      mkdirSync(join(outDir, "assets"), { recursive: true });
      writeFileSync(join(outDir, file), dark);
      const tag = `<noscript><link rel="stylesheet" href="${BASE}${file}" media="(prefers-color-scheme: dark)" /></noscript>`;
      const template = join(outDir, "index.html");
      writeFileSync(template, readFileSync(template, "utf8").replace("<!--app-head-->", () => `${tag}\n    <!--app-head-->`));
    },
  };
}

/**
 * `pnpm dev` renders every page on the server like the production build
 * does, so the dev server and `dist/` share one code path.
 */
function devServerRender(): Plugin {
  return {
    name: "mods:dev-render",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          const url = req.originalUrl ?? "/";
          // The hero paintings are written by prerender.mjs; drawn on request here.
          const hero = /^\/mods\/(hero-(?:light|dark)\.svg)$/.exec(url.split("?")[0] ?? "");
          if (hero) {
            const entry = await server.ssrLoadModule("/src/entry-server.tsx");
            res.setHeader("Content-Type", "image/svg+xml");
            res.end(entry.heroSvg(hero[1]));
            return;
          }
          // Scaled icons are written by prerender.mjs; served from the build data here.
          const icon = /^\/mods\/(icons\/[0-9a-f]+-\d+\.webp)$/.exec(url.split("?")[0] ?? "");
          if (icon) {
            const entry = await server.ssrLoadModule("/src/entry-server.tsx");
            await entry.listRoutes();
            const body = entry.iconFiles().get(icon[1]);
            if (!body) {
              next();
              return;
            }
            res.setHeader("Content-Type", "image/webp");
            res.end(body);
            return;
          }
          // Gallery files are written by prerender.mjs; served from the pages' build data here.
          const shot = /^\/mods\/(showcase\/.+)$/.exec(url.split("?")[0] ?? "");
          if (shot) {
            const entry = await server.ssrLoadModule("/src/entry-server.tsx");
            const file = entry.showcaseFiles().get(decodeURIComponent(shot[1] ?? ""));
            if (!file) {
              next();
              return;
            }
            res.setHeader("Content-Type", file.type);
            res.end(file.body);
            return;
          }
          // The JSON is written by prerender.mjs; built on request here.
          const json = /^\/mods\/(?:(.+)\/)?index\.json$/.exec(url.split("?")[0] ?? "");
          if (json) {
            const entry = await server.ssrLoadModule("/src/entry-server.tsx");
            const body = json[1] ? await entry.modJson(decodeURIComponent(json[1])) : await entry.catalogJson();
            if (!body) {
              next();
              return;
            }
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(body));
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
  // The site is levimc.org/mods/: the levimc.org build copies dist/ there.
  base: BASE,
  // HTML is rendered by `devServerRender` in dev and by prerender.mjs at build.
  appType: "custom",
  plugins: [react(), tailwindcss(), kitHead(), noJsDark(), devServerRender()],
  build: {
    // Read by the prerender to preload the README renderer on mod pages;
    // prerender.mjs deletes it afterwards.
    manifest: true,
  },
  optimizeDeps: {
    // Only the app's own entry: the vendored kit has HTML entries of its own
    // (docs engine, static pages) that are not part of this site.
    entries: ["index.html"],
  },
});
