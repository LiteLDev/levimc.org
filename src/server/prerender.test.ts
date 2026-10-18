import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

interface PrerenderModule {
  prerenderRoutes(options: {
    root: string;
    ssrEntry: string;
    routes: string[];
  }): Promise<{ files: string[] }>;
}

const PRERENDER = new URL("../../kit/ssg/prerender.mjs", import.meta.url).href;

// READMEs are third-party text and land in the page twice: in the HTML and in
// the page data in <head>. String.prototype.replace would expand `$&`, `$'`,
// `` $` `` and `$$` in them (LegacyMoney's `"$&"`, YEssential's `elytra$"`).
test("prerendered pages keep $&, $', $` and $$ as written", async () => {
  const root = mkdtempSync(join(tmpdir(), "pkg-prerender-"));
  try {
    const template =
      '<!doctype html><html lang="en"><head><!--app-head--></head>' +
      '<body><div id="root"><!--app-html--></div></body></html>';
    const text = `currency "$&" rest $' before $\` dollars $$ ^minecraft:elytra$"`;
    const body = `<p>${text}</p>`;
    const head = `<script type="application/json">${JSON.stringify({ text })}</script>`;
    mkdirSync(join(root, "dist"));
    writeFileSync(join(root, "dist", "index.html"), template);
    writeFileSync(
      join(root, "entry.js"),
      `export const render = () => ({ html: ${JSON.stringify(body)}, head: ${JSON.stringify(head)} });`,
    );

    const { prerenderRoutes } = (await import(PRERENDER)) as PrerenderModule;
    await prerenderRoutes({ root, ssrEntry: "entry.js", routes: ["/a/"] });

    // (kit 1.1 adds its generator meta to every page; not part of this check)
    assert.equal(
      readFileSync(join(root, "dist", "a", "index.html"), "utf8").replace(/<meta name="generator"[^>]*>\n?/, ""),
      `<!doctype html><html lang="en"><head>${head}</head>` +
        `<body><div id="root">${body}</div></body></html>`,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
