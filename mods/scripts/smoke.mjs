#!/usr/bin/env node
// Browser smoke test of the built site, served like GitHub Pages (`pnpm preview`).
//
//   node scripts/smoke.mjs --url http://127.0.0.1:4173/ [--headed] [--skip-all-pages]
//
// Needs Playwright: either in $LEVIMC_PW_DIR (a node_modules directory) or installed in the app
// (`pnpm add -D playwright`). Checks the listing (default order, search as you type, filters and
// their counts, exclusions, sort, page size, pagination, empty state, view mode, keyboard, the phone
// drawer), the density targets (results above the fold), backward-compatible URLs, package pages
// (README, tabs, install dialog, variant/version switching, back to the listing), the
// case-insensitive package redirect, the 404 page, the shared theme/language preferences, phone
// layouts without sideways scroll, layout shift, and that every package page hydrates without
// errors. Only the site itself is loaded: third-party requests (README images, avatars, fonts) are
// blocked. Exit code 1 on any failure.
import { createRequire } from "node:module";

const args = process.argv.slice(2);
const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const root = (opt("--url", "http://127.0.0.1:4173/") ?? "").replace(/\/?$/, "/");
const require = createRequire(process.env.LEVIMC_PW_DIR ? `${process.env.LEVIMC_PW_DIR}/` : import.meta.url);
const { chromium } = require("playwright");

const SITE = "LeviMC Mods";
const HOME_TITLE = `${SITE} — Mods & plugins for Minecraft Bedrock`;
// the site's path (/mods/ on levimc.org)
const base = new URL(root).pathname;
const LEVILAMINA = "github.com/LiteLDev/LeviLamina/";
const results = [];
async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true });
    console.log(`  ✔ ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (error) {
    results.push({ name, ok: false });
    console.log(`  ✘ ${name} — ${String(error?.message ?? error).split("\n")[0]}`);
  }
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch({
  headless: !args.includes("--headed"),
  ...(proxy ? { proxy: { server: proxy, bypass: "localhost,127.0.0.1" } } : {}),
});
/**
 * A browser context that only loads this site: README images, avatars and web
 * fonts come from third parties, and a slow one (an image service that hangs)
 * would otherwise decide whether the site passes.
 */
async function newContext(options, { fonts = false } = {}) {
  const ctx = await browser.newContext(options);
  // Layout checks load the web fonts too: the fallback fonts are narrower and can hide an overflow.
  const allowed = (url) => url.href.startsWith(root) || (fonts && /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(url.href));
  await ctx.route((url) => !allowed(url), (route) => route.abort());
  return ctx;
}
/** Waits until the web fonts are in (or failed) and the rows have measured their chips again. */
const fontsReady = async (page) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
};
/**
 * Every row's chips: the shown ones sit inside the tag line on one line, and
 * when some are left out a "+N" chip is shown. Returns the rows checked and
 * how many show "+N".
 */
const chipLayout = (page) =>
  page.evaluate(() => {
    const problems = [];
    let withMore = 0;
    const lines = [...document.querySelectorAll(".pkg-results-list .pkg-row-tags")];
    for (const ul of lines) {
      const name = ul.closest(".pkg-row")?.querySelector(".pkg-row-name")?.textContent;
      if (!ul.hasAttribute("data-fit")) problems.push(`${name}: not measured`);
      const box = ul.getBoundingClientRect();
      const shown = [...ul.children].filter((li) => !li.classList.contains("is-overflow"));
      const hidden = [...ul.querySelectorAll(":scope > [data-chip].is-overflow")];
      for (const li of shown) {
        const r = li.getBoundingClientRect();
        if (r.left < box.left - 1 || r.right > box.right + 1 || r.top < box.top - 1 || r.bottom > box.bottom + 1) {
          problems.push(`${name}: "${li.textContent}" outside the tag line`);
        }
        if (Math.abs(r.top - shown[0].getBoundingClientRect().top) > 1) problems.push(`${name}: chips on two lines`);
      }
      const more = ul.querySelector(":scope > .pkg-row-more-li:not(.is-overflow)");
      if (hidden.length && !more) problems.push(`${name}: ${hidden.length} chips hidden without +N`);
      if (more) {
        withMore++;
        const label = more.querySelector(".pkg-row-more")?.textContent;
        if (label !== `+${hidden.length}`) problems.push(`${name}: "${label}" for ${hidden.length} hidden`);
      }
    }
    return { rows: lines.length, withMore, problems };
  });
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const DESKTOP = { viewport: { width: 1440, height: 900 }, colorScheme: "light" };

const context = await newContext(DESKTOP);
await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(root).origin });

/** A page that records console errors (blocked third-party resources excluded). */
async function open(path, ctx = context) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const location = m.location()?.url ?? "";
    if (location && !location.startsWith(root)) return; // a remote image or font
    if (/Failed to load resource: net::ERR_FAILED/.test(m.text())) return; // a blocked third-party request
    errors.push(`console: ${m.text()} ${location}`);
  });
  const response = await page.goto(root + path, { waitUntil: "networkidle" });
  return { page, errors, response };
}
const rows = (page) => page.locator(".pkg-results-list > li");
const rowNames = (page) => page.locator(".pkg-results-list .pkg-row-name").allInnerTexts();
const statusText = (page) => page.locator("#pkg-status").innerText();
const markLoad = (page) => page.evaluate(() => (window.__smokeMarker = 1));
const sameDocument = async (page) => (await page.evaluate(() => window.__smokeMarker)) === 1;
const applied = (page) => page.waitForFunction(() => !document.documentElement.hasAttribute("data-pkg-pending"));
const searchBox = ".pkg-search-listing input[type=search]";
/** The listing has caught up with the URL (and with what was typed). */
const settled = async (page) => {
  await applied(page);
  await page.waitForTimeout(250);
};
const entries = (page) => page.evaluate(() => JSON.parse(document.getElementById("pkg-page-data").textContent).catalog.entries);

console.log(`smoke: ${root}`);

const { page: home, errors: homeErrors } = await open("");
const catalog = await entries(home);
const total = catalog.length;

await check("home renders and hydrates without errors; title and status", async () => {
  assert((await home.title()) === HOME_TITLE, `title "${await home.title()}"`);
  assert(total > 0, "no catalogue");
  assert((await rows(home).count()) === Math.min(20, total), `${await rows(home).count()} rows on page 1`);
  const status = await statusText(home);
  assert(status.startsWith(`Showing 1–${Math.min(20, total)} of ${total} projects`), `status "${status}"`);
  assert(!homeErrors.length, homeErrors.join(" | "));
  return `${total} projects; ${status}`;
});

await check("default order: by stars — LeviLamina in the top 3", async () => {
  const names = await rowNames(home);
  assert(names.slice(0, 3).includes("LeviLamina"), `top 3: ${names.slice(0, 3)}`);
  const stars = catalog.map((e) => e.stars).sort((a, b) => b - a);
  const first = catalog.find((e) => e.name === names[0]);
  assert(first?.stars === stars[0], `first row has ${first?.stars} stars, the most is ${stars[0]}`);
  return names.slice(0, 3).join(", ");
});

await check("hero is compact and the results start above the fold (1440×900, list)", async () => {
  const m = await home.evaluate(() => {
    const hero = document.querySelector(".pkg-hero").getBoundingClientRect();
    const items = [...document.querySelectorAll(".pkg-results-list > li")].map((li) => li.getBoundingClientRect());
    return { hero: hero.height, first: items[0].top, full: items.filter((r) => r.top >= 0 && r.bottom <= innerHeight).length };
  });
  assert(m.hero <= 112, `hero ${m.hero}px`);
  assert(m.first <= 320, `first result at ${m.first}px`);
  assert(m.full >= 5, `${m.full} fully visible rows`);
  return `hero ${Math.round(m.hero)}px, first row ${Math.round(m.first)}px, ${m.full} rows visible`;
});

await check("search as you type: no Enter, URL replaced, no page load", async () => {
  await markLoad(home);
  const length = await home.evaluate(() => history.length);
  await home.click(searchBox);
  await home.keyboard.type("levilamina", { delay: 20 });
  const started = Date.now();
  await home.waitForFunction(() => new URL(location.href).searchParams.get("q") === "levilamina");
  await home.waitForFunction(() => document.querySelector(".pkg-results-list .pkg-row-name")?.textContent === "LeviLamina", null, { timeout: 2000 });
  const took = Date.now() - started;
  assert(took <= 500, `took ${took}ms`);
  assert((await home.evaluate(() => history.length)) === length, "a history entry was added");
  assert(await sameDocument(home), "page reloaded");
  const status = await statusText(home);
  assert(/^\d+ results? of \d+ projects/.test(status), `status "${status}"`);
  return `${took}ms; ${status}`;
});

await check("search: Chinese text (领地 → PLand) and Escape clears, then leaves the field", async () => {
  await home.fill(searchBox, "领地");
  await home.waitForFunction(() => new URL(location.href).searchParams.get("q") === "领地");
  await settled(home);
  const names = await rowNames(home);
  assert(names.some((n) => /PLand/i.test(n)), `results: ${names.slice(0, 5)}`);
  await home.focus(searchBox);
  await home.keyboard.press("Escape");
  await home.waitForFunction(() => !new URL(location.href).searchParams.has("q"));
  assert((await home.inputValue(searchBox)) === "", "field not cleared");
  await home.keyboard.press("Escape");
  assert(!(await home.evaluate(() => document.activeElement?.matches(".pkg-search-listing input"))), "field kept the focus");
  return names.slice(0, 3).join(", ");
});

await check("search: nothing is searched while an IME composition is open", async () => {
  await home.goto(root, { waitUntil: "networkidle" });
  const cdp = await home.context().newCDPSession(home);
  await home.click(searchBox);
  await cdp.send("Input.imeSetComposition", { text: "ling", selectionStart: 4, selectionEnd: 4 });
  await home.waitForTimeout(500);
  const during = await home.evaluate(() => location.search);
  assert(during === "", `searched during composition: ${during}`);
  await cdp.send("Input.insertText", { text: "领地" });
  await home.waitForFunction(() => new URL(location.href).searchParams.get("q") === "领地", null, { timeout: 3000 });
  await cdp.detach();
  return "committed 领地 only";
});

await check("press / to focus the search field", async () => {
  await home.goto(root, { waitUntil: "networkidle" });
  await home.click("h1");
  await home.keyboard.press("/");
  assert(await home.evaluate(() => document.activeElement?.matches(".pkg-search-listing input")), "not focused");
  return "ok";
});

await check("category Economy: ?cat=economy, a chip, YEssential among the results", async () => {
  await home.goto(root, { waitUntil: "networkidle" });
  const option = home.locator(".pkg-sidebar .pkg-opt-btn", { hasText: "Economy" });
  if (!(await option.isVisible())) await home.locator(".pkg-sidebar .pkg-group-more").click();
  await home.locator(".pkg-sidebar .pkg-opt-btn", { hasText: "Economy" }).click();
  await home.waitForURL((u) => new URL(u).searchParams.get("cat") === "economy");
  await settled(home);
  const names = await rowNames(home);
  assert(names.includes("YEssential"), `results: ${names}`);
  const expected = catalog.filter((e) => e.categories.includes("economy")).length;
  assert(names.length === expected, `${names.length} results, ${expected} expected`);
  assert((await home.locator(".pkg-active .pkg-chip-active", { hasText: "Economy" }).count()) === 1, "no chip");
  assert((await home.locator('.pkg-sidebar .pkg-opt-btn[aria-pressed="true"]', { hasText: "Economy" }).count()) === 1, "option not pressed");
  return `${names.length}: ${names.join(", ")}`;
});

await check("platform LSE + environment Client combine (OR inside, AND across); counts dim empty options", async () => {
  await home.goto(`${root}?platform=lse&env=client`, { waitUntil: "networkidle" });
  await settled(home);
  const names = await rowNames(home);
  const expected = catalog.filter((e) => e.platforms.includes("lse") && e.env.includes("client")).map((e) => e.name);
  assert(names.length === Math.min(20, expected.length), `${names.length} rows, ${expected.length} expected`);
  assert(names.every((n) => expected.includes(n)), `unexpected: ${names.filter((n) => !expected.includes(n))}`);
  const dimmed = await home.locator(".pkg-sidebar .pkg-opt.is-dimmed").count();
  assert(dimmed > 0, "no dimmed option");
  return `${names.length} results, ${dimmed} dimmed options`;
});

await check("Clear all removes the filters and keeps the search", async () => {
  await home.goto(`${root}?q=a&cat=utility&platform=levilamina`, { waitUntil: "networkidle" });
  await settled(home);
  await home.locator(".pkg-active .pkg-chip-clear").click();
  await home.waitForURL((u) => new URL(u).search === "?q=a");
  return "?q=a";
});

await check("exclusion: ?cat=-library hides every library; the chip says so", async () => {
  await home.goto(`${root}?cat=-library`, { waitUntil: "networkidle" });
  await settled(home);
  const shown = await home.locator(".pkg-results-list .pkg-row").evaluateAll((els) => els.map((e) => e.dataset.tooth));
  const libraries = new Set(catalog.filter((e) => e.categories.includes("library")).map((e) => e.tooth));
  assert(shown.length > 0 && !shown.some((t) => libraries.has(t)), "a library is listed");
  const chip = await home.locator(".pkg-active .pkg-chip-active.is-excluded").innerText();
  assert(/not Library/.test(chip), `chip "${chip}"`);
  return `${libraries.size} libraries hidden`;
});

await check("sort by stars (hotbar, arrow keys) orders the rows", async () => {
  await home.goto(root, { waitUntil: "networkidle" });
  await home.locator('.pkg-sort [role="radio"]', { hasText: "Relevance" }).focus();
  await home.keyboard.press("ArrowRight");
  await home.waitForURL((u) => new URL(u).searchParams.get("sort") === "stars");
  await settled(home);
  assert((await home.locator('.pkg-sort [aria-checked="true"]').innerText()) === "Stars", "Stars not checked");
  const order = await home.locator(".pkg-results-list .pkg-row").evaluateAll((els) => els.map((e) => e.dataset.tooth));
  const stars = order.map((t) => catalog.find((e) => e.tooth === t).stars);
  assert(stars.every((n, i) => i === 0 || stars[i - 1] >= n), `not descending: ${stars.slice(0, 6)}`);
  return `top: ${stars.slice(0, 3).join(", ")}`;
});

await check("page size is fixed at 20: no control, ?per=50 is ignored", async () => {
  assert((await home.locator(".pkg-per, .pkg-per-toolbar").count()) === 0, "a page-size control is shown");
  await home.goto(`${root}?per=50`, { waitUntil: "networkidle" });
  await settled(home);
  assert((await rows(home).count()) === Math.min(20, total), `${await rows(home).count()} rows`);
  const pages = Math.ceil(total / 20);
  const last = await home.locator(".pkg-pager-bottom a:not([rel])").last().innerText();
  assert(Number(last) === pages, `last page ${last}, expected ${pages}`);
  return `${pages} pages`;
});

await check("top and bottom pagers: page 2 is current, Back returns to page 1", async () => {
  await home.goto(root, { waitUntil: "networkidle" });
  const pages = Math.ceil(total / 20);
  for (const sel of [".pkg-pager-top", ".pkg-pager-bottom"]) {
    const labels = await home.locator(`${sel} .hotbar > *`).allInnerTexts();
    assert(labels.includes("1") && labels.includes(String(pages)), `${sel}: ${labels.join(" ")}`);
  }
  const firstBefore = (await rowNames(home))[0];
  await home.locator(".pkg-pager-bottom a", { hasText: /^2$/ }).click();
  await home.waitForURL((u) => new URL(u).searchParams.get("page") === "2");
  await settled(home);
  assert((await home.locator('.pkg-pager-top [aria-current="page"]').innerText()) === "2", "page 2 not current");
  assert((await rowNames(home))[0] !== firstBefore, "same first row");
  const top = await home.evaluate(() => document.querySelector("[data-scroll-anchor]").getBoundingClientRect().top);
  assert(top >= -1 && top < 200, `results not brought into view (${top}px)`);
  await home.goBack();
  await home.waitForURL((u) => !new URL(u).searchParams.has("page"));
  await settled(home);
  assert((await rowNames(home))[0] === firstBefore, "Back did not return to page 1");
  return `${pages} pages`;
});

await check("empty state: one message, no pagers, Clear search works", async () => {
  const { page, errors } = await open("?q=zzzzqqq");
  await settled(page);
  assert((await page.locator(".pkg-empty").count()) === 1, "not one empty state");
  assert((await page.locator(".pkg-pager").count()) === 0, "a pager is shown");
  assert((await statusText(page)).startsWith(`0 results of ${total} projects`), await statusText(page));
  await page.locator(".pkg-empty button", { hasText: "Clear search" }).click();
  await page.waitForURL((u) => new URL(u).search === "");
  await settled(page);
  assert((await rows(page).count()) === Math.min(20, total), "rows did not come back");
  assert(!errors.length, errors.join(" | "));
  await page.close();
  return "ok";
});

await check("backward-compatible listing URLs", async () => {
  const cases = [
    ["?q=land", (n) => n.some((x) => /land/i.test(x))],
    ["?q=%E9%A2%86%E5%9C%B0", (n) => n.some((x) => /PLand/i.test(x))],
    ["?tags=economy", (n, t) => n.length === catalog.filter((e) => e.tags.includes("economy")).length && t.length > 0],
    ["?tags=platform:levilamina,type:mod", (n) => n.length === Math.min(20, catalog.filter((e) => e.tags.includes("platform:levilamina") && e.tags.includes("type:mod")).length)],
    ["?tags=platform%3Alevilamina%2Ctype%3Amod", (n) => n.length === Math.min(20, catalog.filter((e) => e.tags.includes("platform:levilamina") && e.tags.includes("type:mod")).length)],
    ["?sort=stars", (n) => n[0] === "LeviLamina"],
    ["?sort=updated&page=2", (n) => n.length > 0],
    ["?sort=downloads", (n) => n[0] === "LeviLamina"],
    ["?page=99", (n) => n.length > 0],
  ];
  const ctx = await newContext(DESKTOP);
  for (const [query, ok] of cases) {
    const { page, errors, response } = await open(query, ctx);
    assert(response.status() === 200, `${query}: ${response.status()}`);
    await settled(page);
    const names = await rowNames(page);
    const tags = await page.locator(".pkg-active .pkg-chip-active").allInnerTexts();
    assert(ok(names, tags), `${query}: ${names.slice(0, 4).join(", ")} (${names.length})`);
    if (query === "?page=99") {
      const current = await page.locator('.pkg-pager-top [aria-current="page"]').innerText();
      assert(current === String(Math.ceil(total / 20)), `?page=99 shows page ${current}`);
    }
    assert(!errors.length, `${query}: ${errors.join(" | ")}`);
    await page.close();
  }
  const { page: plain } = await open("", ctx);
  const defaults = await rowNames(plain);
  await plain.close();
  const { page } = await open("?sort=relevance", ctx);
  await settled(page);
  assert(JSON.stringify(await rowNames(page)) === JSON.stringify(defaults), "?sort=relevance differs from /");
  await page.close();
  const { response } = await open("index.html", ctx);
  assert(response.status() === 200, `index.html ${response.status()}`);
  await ctx.close();
  return `${cases.length + 2} URLs`;
});

await check("a row opens its package without a page load; Back to search returns to the listing", async () => {
  await home.goto(`${root}?cat=library&sort=stars`, { waitUntil: "networkidle" });
  await settled(home);
  await markLoad(home);
  await home.locator(".pkg-card-link", { hasText: /^LeviLamina$/ }).click();
  await home.waitForURL((u) => u.pathname === `${base}${LEVILAMINA}`);
  await home.waitForSelector("[data-pkg-detail] [data-doc-content]");
  assert(await sameDocument(home), "page reloaded");
  assert((await home.title()) === `LeviLamina | ${SITE}`, `title ${await home.title()}`);
  assert((await home.evaluate(() => window.scrollY)) === 0, "not scrolled to the top");
  await home.locator(".pkg-back").click();
  await home.waitForURL((u) => u.pathname === base && u.search === "?cat=library&sort=stars");
  assert(await sameDocument(home), "back reloaded the page");
  // opened directly: the link goes to the last listing of this tab
  await home.goto(root + LEVILAMINA, { waitUntil: "networkidle" });
  const href = await home.locator(".pkg-back").getAttribute("href");
  assert(href === `${base}?cat=library&sort=stars`, `back link ${href}`);
  return "and back";
});

const { page: pkg, errors: pkgErrors } = await open(LEVILAMINA);
await check("package page: header, README, sidebar; no errors", async () => {
  await pkg.waitForSelector("[data-doc-content] h1");
  assert((await pkg.locator("h1.pkg-project-name").innerText()) === "LeviLamina", "name");
  assert((await pkg.locator(".pkg-project-by a").innerText()) === "LiteLDev", "owner");
  for (const id of ["pkg-side-compat", "pkg-side-links", "pkg-side-creators", "pkg-meta-title"]) {
    assert(await pkg.locator(`#${id}`).isVisible(), `${id} missing`);
  }
  assert(!pkgErrors.length, pkgErrors.join(" | "));
  return await pkg.locator(".pkg-project-version").innerText();
});

await check("install dialog: the command for the selection, copied to the clipboard", async () => {
  const latest = catalog.find((e) => e.tooth === "github.com/LiteLDev/LeviLamina") && (await pkg.locator(".pkg-project-version").innerText()).trim();
  await pkg.click(".pkg-install-btn");
  await pkg.waitForSelector(".pkg-dialog[open] .pkg-install-command");
  const command = (await pkg.locator(".pkg-dialog .pkg-install-command").innerText()).replace(/\s+/g, " ").trim();
  assert(command === `lip install github.com/LiteLDev/LeviLamina@${latest}`, `command "${command}"`);
  await pkg.click(".pkg-dialog .pkg-copy");
  await pkg.waitForSelector(".pkg-dialog .pkg-copy[data-copied]");
  const clip = await pkg.evaluate(() => navigator.clipboard.readText());
  assert(clip === command, `clipboard: ${clip}`);
  await pkg.keyboard.press("Escape");
  await pkg.waitForSelector(".pkg-dialog[open]", { state: "detached", timeout: 3000 }).catch(() => {});
  assert(!(await pkg.locator(".pkg-dialog[open]").count()), "dialog still open");
  return command;
});

await check("tabs: versions table marks the current version; dependencies list LeviLamina's", async () => {
  await pkg.locator(".pkg-tabs a", { hasText: "Versions" }).click();
  await pkg.waitForURL((u) => new URL(u).searchParams.get("tab") === "versions");
  await pkg.waitForSelector(".pkg-versions-table");
  assert((await pkg.locator('.pkg-versions-table tr[aria-current="true"]').count()) === 1, "no current version row");
  await pkg.locator(".pkg-tabs a", { hasText: "Dependencies" }).click();
  await pkg.waitForURL((u) => new URL(u).searchParams.get("tab") === "dependencies");
  await pkg.waitForSelector(".pkg-deps-tab .pkg-dep");
  const deps = await pkg.locator(".pkg-deps-tab section:first-child .pkg-dep").count();
  assert(deps > 0, "no dependencies");
  // "Required by" needs levilauncher.json; a build without it leaves the section out
  const known = await pkg.evaluate(() => JSON.parse(document.getElementById("pkg-page-data").textContent).dependentsKnown);
  const dependents = await pkg.locator(".pkg-deps-tab section:nth-child(2) .pkg-dep").count();
  assert(!known || dependents > 0, "no dependents");
  return `${deps} required, required by ${known ? dependents : "(unknown)"}`;
});

await check("another variant and version load in the browser", async () => {
  await markLoad(pkg);
  await pkg.goto(`${root}${LEVILAMINA}?tab=versions`, { waitUntil: "networkidle" });
  await markLoad(pkg);
  await pkg.locator('.pkg-versions-tab [role="radio"]', { hasText: /^client$/ }).click();
  const older = pkg.locator(".pkg-vt-version a:not([aria-current])").nth(2);
  const version = (await older.innerText()).trim();
  await older.click();
  await pkg.waitForURL((u) => new URL(u).searchParams.get("version") === version && new URL(u).searchParams.get("variant") === "client");
  await pkg.waitForFunction(
    (v) => document.querySelector(".pkg-project-version")?.textContent?.includes(v) && !!document.querySelector("[data-doc-content], .pkg-readme-empty"),
    version,
    { timeout: 20000 },
  );
  assert(await sameDocument(pkg), "page reloaded");
  return `client@${version}`;
});

await check("old package URLs: ?variant=&version=, an invalid version, /index.html", async () => {
  const ctx = await newContext(DESKTOP);
  const { page } = await open(`${LEVILAMINA}?variant=nope&version=0.0.0-nope`, ctx);
  const shown = (await page.locator(".pkg-project-version").innerText()).trim();
  const latest = await page.evaluate(() => {
    const d = JSON.parse(document.getElementById("pkg-page-data").textContent);
    return d.prerendered.version;
  });
  assert(shown === latest, `${shown} shown, latest is ${latest}`);
  const { response } = await open(`${LEVILAMINA}index.html`, ctx);
  assert(response.status() === 200, `index.html ${response.status()}`);
  await ctx.close();
  return latest;
});

await check("case-mismatched package paths reach the package", async () => {
  const { page, response } = await open("github.com/liteldev/levilamina/?version=x");
  assert(response.status() === 404, `status ${response.status()}`);
  await page.waitForURL((u) => u.pathname === `${base}${LEVILAMINA}`, { timeout: 15000 });
  await page.waitForSelector("[data-pkg-detail]");
  assert(new URL(page.url()).search === "?version=x", `query lost: ${page.url()}`);
  await page.close();
  // a #heading survives and is scrolled to
  const { page: deep } = await open("github.com/liteldev/levilamina/#acknowledgements");
  await deep.waitForURL((u) => u.pathname === `${base}${LEVILAMINA}` && u.hash === "#acknowledgements", { timeout: 15000 });
  await deep.waitForSelector("[data-pkg-detail]");
  await deep.waitForTimeout(300);
  const top = await deep.evaluate(() => document.getElementById("acknowledgements")?.getBoundingClientRect().top);
  assert(top !== undefined && top >= 0 && top < DESKTOP.viewport.height, `#acknowledgements at ${top}px`);
  await deep.close();
  return "query and #heading kept";
});

await check("unknown paths get the themed 404 page", async () => {
  const { page, response, errors } = await open("no/such/page/");
  assert(response.status() === 404, `status ${response.status()}`);
  await page.waitForSelector(".pkg-notfound h1");
  assert((await page.title()) === `Not Found | ${SITE}`, await page.title());
  assert(errors.every((e) => /404/.test(e)), errors.join(" | "));
  await page.close();
  return "ok";
});

await check("view: grid persists across reloads and is applied before the first paint", async () => {
  const ctx = await newContext(DESKTOP);
  const { page } = await open("", ctx);
  await page.locator('.pkg-view [role="radio"]').nth(1).click();
  assert((await page.evaluate(() => document.documentElement.dataset.view)) === "grid", "grid not applied");
  // before any script but the inline ones runs
  const raw = await ctx.newPage();
  await raw.route(/\.m?js(\?|$)/, (r) => r.abort());
  await raw.goto(root, { waitUntil: "domcontentloaded" });
  assert((await raw.evaluate(() => document.documentElement.dataset.view)) === "grid", "grid not set before paint");
  await raw.close();
  await page.reload({ waitUntil: "networkidle" });
  const m = await page.evaluate(() => {
    const items = [...document.querySelectorAll(".pkg-results-list > li")].map((li) => li.getBoundingClientRect());
    return { first: items[0].top, full: items.filter((r) => r.top >= 0 && r.bottom <= innerHeight).length, checked: document.querySelector('.pkg-view [aria-checked="true"]')?.getAttribute("aria-label") };
  });
  assert(m.checked === "Grid view", `checked: ${m.checked}`);
  assert(m.first <= 320 && m.full >= 4, `first ${m.first}px, ${m.full} full cards`);
  await ctx.close();
  return `${m.full} cards fully visible`;
});

await check("density at 1024×768 (list): at least 3 rows", async () => {
  const ctx = await newContext({ viewport: { width: 1024, height: 768 } });
  const { page } = await open("", ctx);
  const full = await page.evaluate(() => [...document.querySelectorAll(".pkg-results-list > li")].filter((li) => { const r = li.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }).length);
  assert(full >= 3, `${full} rows`);
  await ctx.close();
  return `${full} rows`;
});

await check("chips: one line, never cut off, the rest behind +N (1440 list and grid, 390 and 320 phones)", async () => {
  const seen = [];
  for (const [label, options, view] of [
    ["1440 list", DESKTOP, "list"],
    ["1440 grid", DESKTOP, "grid"],
    ["390", PHONE, "list"],
    ["390 grid", PHONE, "grid"],
    ["320", { ...PHONE, viewport: { width: 320, height: 640 } }, "list"],
  ]) {
    const ctx = await newContext(options, { fonts: true });
    await ctx.addInitScript((v) => localStorage.setItem("levimc-mods:view", v), view);
    const { page } = await open("", ctx);
    assert(((await page.evaluate(() => document.documentElement.dataset.view)) ?? "list") === view, `${label}: view not applied`);
    await fontsReady(page);
    const m = await chipLayout(page);
    assert(m.rows >= 20 && !m.problems.length, `${label}: ${m.problems.slice(0, 5).join("; ")}`);
    seen.push(`${label}: ${m.withMore} of ${m.rows} rows with +N`);
    await ctx.close();
  }
  return seen.join("; ");
});

await check("+N chip: its tooltip lists the other chips, fully visible on hover and on focus", async () => {
  const seen = [];
  // (at 1440 the list rows have room for every chip)
  for (const [label, options, view] of [["1440 grid", DESKTOP, "grid"], ["390", PHONE, "list"]]) {
    const ctx = await newContext(options, { fonts: true });
    await ctx.addInitScript((v) => localStorage.setItem("levimc-mods:view", v), view);
    const { page } = await open("", ctx);
    await fontsReady(page);
    const host = page.locator(".pkg-results-list .pkg-row-more-li:not(.is-overflow) .pkg-row-more-host").first();
    await host.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -200));
    for (const how of ["hover", "focus"]) {
      await page.mouse.move(0, 0);
      await page.evaluate(() => document.activeElement?.blur());
      if (how === "hover") await host.hover();
      else await host.locator("button").focus();
      await page.waitForTimeout(250);
      const m = await host.evaluate((el) => {
        const tip = el.querySelector(".pkg-row-more-tip");
        const r = tip.getBoundingClientRect();
        // tooltips take no pointer events, which elementFromPoint skips: let it hit-test for a moment
        tip.style.pointerEvents = "auto";
        const at = (x, y) => document.elementFromPoint(x, y)?.closest(".pkg-row-more-tip") === tip;
        const hit = at(r.left + r.width / 2, r.top + r.height / 2) && at(r.left + 4, r.top + 4) && at(r.right - 4, r.bottom - 4);
        tip.style.pointerEvents = "";
        return {
          visible: getComputedStyle(tip).visibility === "visible" && Number(getComputedStyle(tip).opacity) > 0.95,
          opacity: getComputedStyle(tip).opacity,
          inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0,
          hit,
          lines: tip.querySelectorAll(".mc-tooltip-lore").length,
          hidden: el.closest(".pkg-row-tags").querySelectorAll(":scope > [data-chip].is-overflow").length,
        };
      });
      assert(m.visible && m.inView && m.hit, `${label} ${how}: ${JSON.stringify(m)}`);
      assert(m.lines === m.hidden && m.lines > 0, `${label} ${how}: ${m.lines} lines for ${m.hidden} hidden chips`);
    }
    seen.push(label);
    await ctx.close();
  }
  return seen.join(", ");
});

await check("phones: the sort menu marks only the current order", async () => {
  const phone = await newContext(PHONE);
  const { page } = await open("?sort=updated", phone);
  await page.click(".pkg-sort-menu summary");
  const m = await page.evaluate(() => {
    const items = [...document.querySelectorAll(".pkg-sort-menu .kit-menu-item")];
    return {
      checks: items.filter((i) => { const c = i.querySelector(".kit-menu-check"); return c && c.getBoundingClientRect().width > 0 && getComputedStyle(c).visibility !== "hidden"; }).map((i) => i.textContent),
      current: items.filter((i) => i.getAttribute("aria-checked") === "true").map((i) => i.textContent),
    };
  });
  assert(m.checks.length === 1 && m.checks[0] === m.current[0], JSON.stringify(m));
  await phone.close();
  return m.checks[0];
});

await check("theme: Auto by default; Dark is kept in the levimc_theme cookie", async () => {
  const ctx = await newContext({ ...DESKTOP, colorScheme: "dark" });
  const { page } = await open("", ctx);
  const s0 = await page.evaluate(() => ({ pref: document.documentElement.dataset.themePref, dark: document.documentElement.classList.contains("dark") }));
  assert(s0.pref === "auto" && s0.dark, `default ${JSON.stringify(s0)}`);
  await page.click("[data-kit-theme-toggle]");
  await page.click('[data-kit-theme-value="light"]');
  const cookie = (await ctx.cookies(root)).find((c) => c.name === "levimc_theme")?.value;
  assert(cookie === "light", `cookie ${cookie}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  assert(!(await page.evaluate(() => document.documentElement.classList.contains("dark"))), "light not applied from the cookie");
  await ctx.close();
  return "auto → light (cookie)";
});

await check("language: 简体中文 is kept in the levimc_lang cookie and applies to the whole interface", async () => {
  const ctx = await newContext(DESKTOP);
  const { page } = await open("", ctx);
  await page.click("[data-kit-locale-switcher]");
  await page.click('.kit-gbar [data-kit-lang-value="zh-CN"]');
  await page.waitForFunction(() => document.querySelector(".kit-hero-name")?.textContent === "LeviMC 模组");
  const cookie = (await ctx.cookies(root)).find((c) => c.name === "levimc_lang")?.value;
  assert(cookie === "zh-CN", `cookie ${cookie}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  const ui = await page.evaluate(() => ({ hero: document.querySelector(".kit-hero-name")?.textContent, placeholder: document.querySelector(".pkg-search-listing input")?.placeholder, tab: document.querySelector('.kit-gbar-nav [aria-current="page"]')?.textContent }));
  assert(ui.hero === "LeviMC 模组" && /搜索/.test(ui.placeholder) && /模组/.test(ui.tab), JSON.stringify(ui));
  const lang = await page.evaluate(() => document.documentElement.lang);
  assert(lang === "zh-CN", `<html lang="${lang}">`);
  // the package page follows too
  await page.goto(root + LEVILAMINA, { waitUntil: "networkidle" });
  assert((await page.locator(".pkg-install-btn").innerText()).includes("安装"), "package page not translated");
  await ctx.close();
  return JSON.stringify(ui);
});

await check("phones (390/360/320px): no sideways scroll on the listing and 3 package pages", async () => {
  const seen = [];
  for (const width of [390, 360, 320]) {
    const phone = await newContext({ ...PHONE, viewport: { width, height: 844 } }, { fonts: true });
    for (const path of ["", "?cat=economy", "?q=zzzzqqq", LEVILAMINA, "github.com/IceBlcokMC/PLand/", "github.com/qing85566/ChiyanMap/", `${LEVILAMINA}?tab=versions`, "no/such/page/"]) {
      const { page, errors, response } = await open(path, phone);
      assert(response.status() === (path.startsWith("no/") ? 404 : 200), `/${path}: status ${response.status()}`);
      await fontsReady(page);
      const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(wide <= 0, `${wide}px sideways scroll on /${path} at ${width}px`);
      assert(errors.every((e) => /404/.test(e)), errors.join(" | "));
      await page.close();
    }
    await phone.close();
    seen.push(width);
  }
  return seen.join(", ");
});

await check("phones (390×844): compact hero, results above the fold, 3 rows visible", async () => {
  const phone = await newContext(PHONE);
  const { page } = await open("", phone);
  const m = await page.evaluate(() => {
    const hero = document.querySelector(".pkg-hero").getBoundingClientRect();
    const items = [...document.querySelectorAll(".pkg-results-list > li")].map((li) => li.getBoundingClientRect());
    return { hero: hero.height, first: items[0].top, full: items.filter((r) => r.top >= 0 && r.bottom <= innerHeight).length };
  });
  assert(m.hero <= 96, `hero ${m.hero}px`);
  assert(m.first <= 290, `first result at ${m.first}px`);
  assert(m.full >= 3, `${m.full} rows`);
  await phone.close();
  return `hero ${Math.round(m.hero)}px, first row ${Math.round(m.first)}px, ${m.full} rows`;
});

await check("phones: the Filters drawer traps focus, closes with Escape and returns focus", async () => {
  const phone = await newContext(PHONE);
  const { page } = await open("", phone);
  await page.click(".pkg-filters-btn");
  await page.waitForSelector(".pkg-filter-drawer[open]");
  for (let i = 0; i < 40; i++) await page.keyboard.press("Tab");
  assert(await page.evaluate(() => !!document.activeElement?.closest(".pkg-filter-drawer")), "focus escaped the drawer");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector(".pkg-filter-drawer[open]"));
  assert(await page.evaluate(() => document.activeElement?.classList.contains("pkg-filters-btn")), "focus did not return to the Filters button");
  // filters apply live; "Show N results" closes
  await page.click(".pkg-filters-btn");
  await page.locator(".pkg-filter-drawer .pkg-opt-btn", { hasText: "LegacyScriptEngine" }).click();
  await page.waitForURL((u) => new URL(u).searchParams.get("platform") === "lse");
  const expected = catalog.filter((e) => e.platforms.includes("lse")).length;
  await page.waitForFunction((n) => document.querySelector(".pkg-drawer-show")?.textContent === `Show ${n} results`, expected, { timeout: 3000 }).catch(() => {});
  const label = await page.locator(".pkg-drawer-show").innerText();
  assert(label === `Show ${expected} results`, `"${label}", expected ${expected}`);
  await page.click(".pkg-drawer-show");
  await page.waitForFunction(() => !document.querySelector(".pkg-filter-drawer[open]"));
  assert((await page.locator(".pkg-filters-btn").innerText()).includes("(1)"), "no filter count on the button");
  await phone.close();
  return label;
});

await check("phones: a search from a package page lands on the results", async () => {
  const phone = await newContext(PHONE);
  const { page } = await open(LEVILAMINA, phone);
  assert(await page.locator(".pkg-header .pkg-search-submit").isVisible(), "no search button");
  await page.fill(".pkg-header input[type=search]", "economy");
  await page.click(".pkg-header .pkg-search-submit");
  await page.waitForURL((u) => u.pathname === base && new URL(u).searchParams.get("q") === "economy");
  await settled(page);
  const top = await page.evaluate(() => document.querySelector(".pkg-results-list > li")?.getBoundingClientRect().top ?? -1);
  assert(top >= 0 && top < 844, `first result at ${top}px`);
  await phone.close();
  return `first result at ${Math.round(top)}px`;
});

await check("no layout shift on load (CLS ≤ 0.05)", async () => {
  const ctx = await newContext(DESKTOP);
  await ctx.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  const out = [];
  for (const path of ["", LEVILAMINA]) {
    const { page } = await open(path, ctx);
    await page.waitForTimeout(500);
    const cls = await page.evaluate(() => window.__cls);
    assert(cls <= 0.05, `CLS ${cls.toFixed(3)} on /${path}`);
    out.push(cls.toFixed(3));
    await page.close();
  }
  await ctx.close();
  return out.join(", ");
});

// Every package page, as prerendered, must hydrate without a mismatch: their
// READMEs are third-party text and change with every hourly build.
if (!args.includes("--skip-all-pages")) {
  await check("every package page hydrates without errors", async () => {
    const tooths = catalog.map((e) => e.tooth);
    const ctx = await newContext({ viewport: { width: 1280, height: 800 }, colorScheme: "light" });
    const queue = [...tooths];
    const failures = [];
    await Promise.all(
      Array.from({ length: 6 }, async () => {
        for (let tooth = queue.shift(); tooth; tooth = queue.shift()) {
          const page = await ctx.newPage();
          const errors = [];
          page.on("pageerror", (e) => errors.push(e.message));
          page.on("console", (m) => {
            if (m.type() === "error" && !/Failed to load resource|ERR_FAILED/.test(m.text())) errors.push(m.text());
          });
          const response = await page.goto(`${root}${tooth}/`, { waitUntil: "networkidle" });
          await page.waitForSelector("[data-pkg-detail]");
          if (response?.status() !== 200) errors.push(`status ${response?.status()}`);
          if (errors.length) failures.push(`${tooth}: ${errors[0].split("\n")[0]}`);
          await page.close();
        }
      }),
    );
    await ctx.close();
    assert(!failures.length, `${failures.length} pages: ${failures.slice(0, 3).join(" | ")}`);
    return `${tooths.length} pages`;
  });
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\nsmoke: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exitCode = 1;
