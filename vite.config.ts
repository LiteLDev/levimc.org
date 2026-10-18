import { readFileSync } from "node:fs";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { themeInitScript } from "./kit/components/theme.ts";
import { FONT_HEAD_HTML } from "./kit/components/fonts.ts";

/**
 * The kit's no-flash theme script and web fonts go into `<head>` from the kit
 * itself, so they never drift from what the other LeviMC sites ship.
 */
function kitHead(): Plugin {
  return {
    name: "pkg:kit-head",
    transformIndexHtml(html) {
      return html.replace(
        "<!--kit-head-->",
        `<script>${themeInitScript}</script>${FONT_HEAD_HTML}`,
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
