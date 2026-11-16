import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { defineConfig, type Connect, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createThemeInitScript } from "./kit/components/theme.ts";
import { FONT_HEAD_HTML } from "./kit/components/fonts.ts";
import { UI_LOCALES } from "./kit/components/i18n.ts";
import { PREFS_CORE_JS } from "./kit/components/prefs.ts";
import { noJsDarkCss } from "./kit/static/nojs-dark.mjs";
import { BASE } from "./src/base-path.ts";
import { LISTING_KEYS } from "./src/lib/catalog-query.ts";
import { STORAGE_KEYS } from "./src/lib/storage.ts";
import { isSitePath, legacyLocale, LOCALES, localeBase, withLocale } from "./src/locales.ts";

/**
 * The kit's pre-paint script: the cross-site theme preference (cookie on
 * levimc.org). Every page is prerendered in the language of its URL
 * (`/zh-Hans/mods/…`), so nothing waits for the language — but a visitor
 * whose stored language the site has no pages in while the kit has chrome
 * strings for it (de, ja …) sees the bar and footer only once they speak it
 * (`useChromeLocale`, src/chrome-locale.ts; html.kit-chrome-pending).
 */
const contentBases = [...new Set(LOCALES.map((l) => l.lang.toLowerCase().split("-")[0]))];
const prefsScript =
  createThemeInitScript({
    // prerender links to the other builds on levimc.org, not this app's own pages (its router serves those)
    speculation: { exclude: LOCALES.map((l) => `${localeBase(l.code)}*`) },
  }) +
  `(function(){try{${PREFS_CORE_JS}var l=rp("lang");if(!l)return;var b=l.toLowerCase().split("-")[0];if(${JSON.stringify(contentBases)}.indexOf(b)>=0)return;` +
  `var C=${JSON.stringify(UI_LOCALES.map((c) => ({ c, l: c })))},a=ml(l,C);` +
  `if(a>=0&&C[a].l.toLowerCase().split("-")[0]===b)document.documentElement.classList.add("kit-chrome-pending")}catch(e){}})();`;

/**
 * Only /mods/ itself redirects by language, like every LeviMC site's root (the kit's localeRedirectScript, which
 * puts the language after the base): to the visitor's stored language, else the browser's — unless they came from
 * another page of this site — when it has pages (/zh-Hans/mods/ …). Deep links never do.
 */
const redirectLocales = LOCALES.map((l) => ({ c: l.code, l: l.lang, u: localeBase(l.code) }));
const redirectScript =
  `(function(){try{${PREFS_CORE_JS}var b=${JSON.stringify(BASE)},p=location.pathname;if(p!==b&&p!==b+"index.html")return;` +
  `var L=${JSON.stringify(redirectLocales)},k="levimc-locale-mods",s=pls(),g=rp("lang"),o=null,x=-1,j;` +
  // the language this site stored before the cross-site preference (kit < 2.10) becomes that preference, once
  `try{o=s&&s.getItem(k)}catch(e){}` +
  `if(o!==null){if(!g)for(j=0;j<L.length;j++)if(L[j].c===o){g=L[j].l;wp("lang",g)}try{s.removeItem(k)}catch(e){}}` +
  `if(g){x=ml(g,L);if(x<0)x=0}` +
  `else{try{var r=new URL(document.referrer);if(r.origin===location.origin)for(j=0;j<L.length;j++)if(r.pathname.indexOf(L[j].u)===0)return}catch(e){}` +
  `var N=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||""];` +
  `for(j=0;j<N.length&&x<0;j++)x=ml(N[j],L)}` +
  `if(x>=0&&L[x].u!==b)location.replace(L[x].u+location.search+location.hash)}catch(e){}})();`;

/** The listing in any language (/mods/, /zh-Hans/mods/ …): its path with the locale segment taken off. */
const LOCALE_PREFIX = `^/(?:${LOCALES.filter((l) => l.prefix).map((l) => l.prefix).join("|")})(?=${BASE.slice(1)})`;

/**
 * The listing's own pre-paint state: the viewer's list/grid choice, and
 * `data-mods-pending` while a query in the URL (`/mods/?tags=…`) is not applied yet —
 * the page is prerendered unfiltered, so its results stay hidden until the
 * app has applied the query (at most 4 s).
 */
const listingScript =
  `(function(){var d=document.documentElement;try{if(localStorage.getItem(${JSON.stringify(STORAGE_KEYS.view)})==="grid")d.setAttribute("data-view","grid")}catch(e){}` +
  `var p=location.pathname.replace(new RegExp(${JSON.stringify(LOCALE_PREFIX)}),"/");if((p===${JSON.stringify(BASE)}||p===${JSON.stringify(`${BASE}index.html`)})&&/[?&](${LISTING_KEYS.join("|")})=/.test(location.search)){` +
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
        () => `<script>${prefsScript}</script><script>${redirectScript}</script><script>${listingScript}</script>${FONT_HEAD_HTML}`,
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
      /** A page, rendered like prerender.mjs renders it; anything but a GET for HTML goes on to `next`. */
      const renderHtml = async (url: string, req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
        const accept = req.headers.accept ?? "";
        if (req.method !== "GET" || !accept.includes("text/html")) {
          next();
          return;
        }
        try {
          const template = await server.transformIndexHtml(url, readFileSync("index.html", "utf8"));
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
      };
      // The JSON is written by prerender.mjs; built on request here: version 4
      // under /api/v4/mods/ (outside the base, so before Vite's own handling),
      // the one from before it next to the pages.
      server.middlewares.use(async (req, res, next) => {
        const url = req.originalUrl ?? "/";
        // the pages in the other languages (/zh-Hans/mods/…) are outside the base too
        const path = url.split(/[?#]/)[0] ?? "";
        // the old URLs (/mods/zh-Hans/…) redirect, like their redirect pages (prerender.mjs)
        if (legacyLocale(path)) {
          res.statusCode = 302;
          res.setHeader("Location", withLocale(url, "en"));
          res.end();
          return;
        }
        if (!path.startsWith(BASE) && isSitePath(path)) {
          await renderHtml(url, req, res, next);
          return;
        }
        const json = /^\/(api\/v4\/)?mods\/(?:(.+)\/)?index\.json$/.exec(url.split("?")[0] ?? "");
        if (json) {
          const entry = await server.ssrLoadModule("/src/entry-server.tsx");
          const id = json[2] ? decodeURIComponent(json[2]) : undefined;
          const body = json[1]
            ? id
              ? await entry.modJson(id)
              : await entry.catalogJson()
            : id
              ? await entry.legacyModJsonOf(id)
              : await entry.legacyCatalogJson();
          if (!body) {
            next();
            return;
          }
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify(body));
          return;
        }
        next();
      });
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
          await renderHtml(url, req, res, next);
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
