#!/usr/bin/env node
// Size budgets of the built site (after `pnpm build`):
//
//   node scripts/budget.mjs [dist]
//
// The home page's own part (everything but the LeviMC bar and footer, which every LeviMC site shares)
// and its embedded catalogue, the entry script and the stylesheet, raw and gzipped. Exit code 1 when
// one is over.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const dist = process.argv[2] ?? "dist";
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const gz = (s) => gzipSync(s, { level: 9 }).length;

const html = readFileSync(join(dist, "index.html"), "utf8");
const data = /<script type="application\/json" id="mods-page-data">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
// the shared chrome: the LeviMC bar (from its element to <main>) and the footer
const bar = html.slice(html.lastIndexOf("<div", html.indexOf("data-kit-globalbar")), html.indexOf("<main"));
const chrome = bar + (/<footer[^>]*data-kit-footer[\s\S]*?<\/footer>/.exec(html)?.[0] ?? "");
const own = html.length - chrome.length;
const assets = readdirSync(join(dist, "assets"));
const entry = assets.find((f) => /^index-.*\.js$/.test(f));
const css = assets.find((f) => /^index-.*\.css$/.test(f));
const js = readFileSync(join(dist, "assets", entry), "utf8");
const style = readFileSync(join(dist, "assets", css), "utf8");

const budgets = [
  ["home page, raw (without the shared LeviMC bar and footer)", own, 140 * 1024],
  ["home page, gzip (all of it)", gz(html), 35 * 1024],
  ["embedded catalogue, raw", data.length, 70 * 1024],
  ["embedded catalogue, gzip", gz(data), 15 * 1024],
  ["entry script, gzip", gz(js), 131 * 1024],
  ["stylesheet, gzip (round 1: 42.8 KB + 5 KB)", gz(style), 47.8 * 1024],
];
let failed = false;
console.log(`home page: ${kb(html.length)} raw (LeviMC bar + footer ${kb(chrome.length)})`);
for (const [name, size, max] of budgets) {
  const ok = size <= max;
  failed ||= !ok;
  console.log(`  ${ok ? "✔" : "✘"} ${name}: ${kb(size)} (budget ${kb(max)})`);
}
if (failed) process.exitCode = 1;
