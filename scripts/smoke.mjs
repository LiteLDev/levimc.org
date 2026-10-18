#!/usr/bin/env node
// Browser smoke test of the built site, served like GitHub Pages (`pnpm preview`).
//
//   node scripts/smoke.mjs --url http://127.0.0.1:4173/ [--headed]
//
// Needs Playwright: either in $LEVIMC_PW_DIR (a node_modules directory) or installed in the app
// (`pnpm add -D playwright`). Checks the home page (search, tags, sort, pagination, query-string
// loads, no results), in-app navigation without page loads, package pages (README, variant/version
// switching, invalid selections, copy button), the case-insensitive package redirect, the 404 page,
// the theme toggle, the phone layout (results brought into view after a search), and that every
// package page hydrates without errors. Only the site itself is loaded: third-party requests
// (README images, avatars, fonts) are blocked. Exit code 1 on any failure.
import { createRequire } from "node:module";

const args = process.argv.slice(2);
const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const root = (opt("--url", "http://127.0.0.1:4173/") ?? "").replace(/\/?$/, "/");
const require = createRequire(process.env.LEVIMC_PW_DIR ? `${process.env.LEVIMC_PW_DIR}/` : import.meta.url);
const { chromium } = require("playwright");

const LEVILAMINA = "packages/github.com/LiteLDev/LeviLamina/";
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
async function newContext(options) {
  const ctx = await browser.newContext(options);
  await ctx.route((url) => !url.href.startsWith(root), (route) => route.abort());
  return ctx;
}
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

const context = await newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(root).origin });

/** A page that records console errors (web fonts and third-party README images excluded). */
async function open(path, ctx = context) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const location = m.location()?.url ?? "";
    if (location && !location.startsWith(root)) return; // a remote image or font
    if (/Failed to load resource/.test(m.text()) && !location.startsWith(root)) return;
    errors.push(`console: ${m.text()} ${location}`);
  });
  const response = await page.goto(root + path, { waitUntil: "networkidle" });
  return { page, errors, response };
}
const cards = (page) => page.locator(".pkg-card");
const markLoad = (page) => page.evaluate(() => (window.__smokeMarker = 1));
const sameDocument = async (page) => (await page.evaluate(() => window.__smokeMarker)) === 1;
const countText = (page) => page.locator(".pkg-count").innerText();

console.log(`smoke: ${root}`);

const { page: home, errors: homeErrors } = await open("");
const total = Number(/\d+/.exec(await countText(home))?.[0]);

await check("home renders and hydrates without errors", async () => {
  assert(total > 0, "no package count");
  assert((await cards(home).count()) === Math.min(60, total), `${await cards(home).count()} cards on page 1`);
  assert(!homeErrors.length, homeErrors.join(" | "));
  return `${total} packages, ${await cards(home).count()} cards`;
});

await check("search filters in place (no page load) and keeps the URL", async () => {
  await markLoad(home);
  await home.fill(".pkg-search-hero input[type=search]", "levilamina");
  await home.click(".pkg-search-hero button[type=submit]");
  await home.waitForURL((u) => u.search === "?q=levilamina");
  await home.waitForFunction((t) => !document.querySelector(".pkg-count")?.textContent?.includes(`${t} `), total);
  const shown = Number(/\d+/.exec(await countText(home))?.[0]);
  assert(shown > 0 && shown < total, `showing ${shown}`);
  const first = await cards(home).first().locator(".pkg-card-name").innerText();
  assert(/levilamina/i.test(first), `first result "${first}"`);
  assert(await sameDocument(home), "page reloaded");
  return `${shown} results, first: ${first}`;
});

await check("tag chips toggle the filter", async () => {
  await home.goto(root, { waitUntil: "networkidle" });
  const chip = home.locator(".pkg-tags a").nth(2);
  const tag = (await chip.innerText()).trim();
  await chip.click();
  await home.waitForURL((u) => new URL(u).searchParams.get("tags") === tag);
  await home.waitForFunction((t) => !document.querySelector(".pkg-count")?.textContent?.includes(`${t} `), total);
  const tagsOk = await cards(home).evaluateAll(
    (els, t) => els.every((el) => [...el.querySelectorAll(".pkg-card-tags li")].some((li) => li.textContent === t)),
    tag,
  );
  assert(tagsOk, "a card without the tag");
  assert((await home.locator(`.pkg-tags a[aria-current]`).innerText()).trim() === tag, "chip not marked current");
  await home.locator(".pkg-tags a[aria-current]").click();
  await home.waitForURL((u) => !new URL(u).searchParams.has("tags"));
  return tag;
});

await check("sort by stars orders the cards", async () => {
  await home.locator(".pkg-sort a", { hasText: "Stars" }).click();
  await home.waitForURL((u) => new URL(u).searchParams.get("sort") === "stars");
  await home.waitForSelector(".pkg-sort a.is-active >> text=Stars");
  const stars = await home.locator(".pkg-card-stat:first-child span:last-child").allInnerTexts();
  const nums = stars.map(Number);
  assert(nums.every((n, i) => i === 0 || nums[i - 1] >= n), `not descending: ${nums.slice(0, 6)}`);
  return `top: ${nums.slice(0, 3).join(", ")}`;
});

await check("pagination moves to page 2 and marks it", async () => {
  const firstBefore = await cards(home).first().locator(".pkg-card-name").innerText();
  await home.locator('.pkg-pagination a[aria-label="Page 2"]').click();
  await home.waitForURL((u) => new URL(u).searchParams.get("page") === "2");
  await home.waitForSelector('.pkg-pagination [aria-current="page"] >> text=2');
  assert((await cards(home).first().locator(".pkg-card-name").innerText()) !== firstBefore, "same first card");
  return await cards(home).first().locator(".pkg-card-name").innerText();
});

await check("a query string applies on a direct load (/?sort=stars&page=2)", async () => {
  const { page, errors } = await open("?sort=stars&page=2");
  await page.waitForSelector('.pkg-pagination [aria-current="page"]');
  assert((await page.locator('.pkg-pagination [aria-current="page"]').innerText()) === "2", "page 2 not current");
  assert((await page.locator(".pkg-sort .is-active").innerText()) === "Stars", "Stars not active");
  assert(!errors.length, errors.join(" | "));
  await page.close();
  return "ok";
});

await check("a search without results says so", async () => {
  const { page, errors } = await open("?q=zzzqqqxx");
  await page.waitForFunction(() => document.querySelector(".pkg-count")?.textContent === "Showing 0 packages");
  const text = await page.locator("[data-pkg-results]").innerText();
  assert(text.includes("No packages found.") && /No packages found\s*$/.test(text), text);
  assert(!errors.length, errors.join(" | "));
  await page.close();
  return "ok";
});

await check("a card opens its package without a page load", async () => {
  await home.goto(root, { waitUntil: "networkidle" });
  await markLoad(home);
  const link = home.locator(".pkg-card-link", { hasText: /^LeviLamina$/ });
  await link.click();
  await home.waitForURL((u) => u.pathname === `/${LEVILAMINA}`);
  await home.waitForSelector("[data-pkg-detail] [data-doc-content]");
  assert(await sameDocument(home), "page reloaded");
  assert((await home.title()) === "LeviLamina | bedrinth", `title ${await home.title()}`);
  assert((await home.evaluate(() => window.scrollY)) === 0, "not scrolled to the top");
  await home.goBack();
  await home.waitForURL((u) => u.pathname === "/");
  await home.waitForSelector(".pkg-hero");
  assert(await sameDocument(home), "back reloaded the page");
  return "and back";
});

const { page: pkg, errors: pkgErrors } = await open(LEVILAMINA);
await check("package page renders the README and metadata", async () => {
  await pkg.waitForSelector("[data-doc-content] h1");
  const install = await pkg.locator(".pkg-install-command").innerText();
  assert(/^lip install github\.com\/LiteLDev\/LeviLamina@\d/.test(install.trim()), install);
  assert(await pkg.locator('.pkg-versions [aria-current="true"]').count() === 1, "no current version");
  assert(!pkgErrors.length, pkgErrors.join(" | "));
  return install.trim();
});

await check("copy button copies the install command", async () => {
  const command = (await pkg.locator(".pkg-install-command").innerText()).trim();
  await pkg.click(".pkg-install-box .pkg-copy");
  await pkg.waitForSelector(".pkg-install-box .pkg-copy[data-copied]");
  const clip = await pkg.evaluate(() => navigator.clipboard.readText());
  assert(clip === command, `clipboard: ${clip}`);
  return "ok";
});

await check("another variant and version load in the browser", async () => {
  await markLoad(pkg);
  await pkg.locator(".pkg-chips a", { hasText: /^client$/ }).click();
  await pkg.waitForURL((u) => new URL(u).searchParams.get("variant") === "client");
  const older = pkg.locator('.pkg-versions a:not([aria-current])').nth(2);
  const version = (await older.innerText()).trim();
  await older.click();
  await pkg.waitForURL((u) => new URL(u).searchParams.get("version") === version);
  await pkg.waitForFunction(
    (v) => document.querySelector(".pkg-install-command")?.textContent?.includes(`#client@${v}`) &&
      !!document.querySelector("[data-doc-content], .pkg-readme-empty"),
    version,
    { timeout: 20000 },
  );
  assert(await sameDocument(pkg), "page reloaded");
  return `client@${version}`;
});

await check("an invalid version falls back to the latest", async () => {
  const { page } = await open(`${LEVILAMINA}?variant=nope&version=0.0.0-nope`);
  const latest = (await page.locator('.pkg-versions [aria-current="true"]').innerText()).trim();
  const install = await page.locator(".pkg-install-command").innerText();
  assert(install.trim().endsWith(`LeviLamina@${latest}`), install);
  await page.close();
  return latest;
});

await check("case-mismatched package paths reach the package", async () => {
  const { page, response } = await open("packages/github.com/liteldev/levilamina/?version=x");
  assert(response.status() === 404, `status ${response.status()}`);
  await page.waitForURL((u) => u.pathname === `/${LEVILAMINA}`, { timeout: 15000 });
  await page.waitForSelector("[data-pkg-detail]");
  assert(new URL(page.url()).search === "?version=x", `query lost: ${page.url()}`);
  await page.close();
  return "ok";
});

await check("unknown paths get the themed 404 page", async () => {
  const { page, response, errors } = await open("no/such/page/");
  assert(response.status() === 404, `status ${response.status()}`);
  await page.waitForSelector(".pkg-notfound h1");
  assert((await page.title()) === "Not Found | bedrinth", await page.title());
  assert(errors.every((e) => /404/.test(e)), errors.join(" | "));
  await page.close();
  return "ok";
});

await check("theme toggle flips and persists", async () => {
  const before = await home.evaluate(() => document.documentElement.classList.contains("dark"));
  await home.click("[data-kit-theme-toggle]");
  const after = await home.evaluate(() => document.documentElement.classList.contains("dark"));
  assert(before !== after, "html.dark unchanged");
  await home.reload({ waitUntil: "networkidle" });
  assert((await home.evaluate(() => document.documentElement.classList.contains("dark"))) === after, "not persisted");
  await home.evaluate(() => localStorage.removeItem("levimc-theme"));
  return `${before ? "dark" : "light"} → ${after ? "dark" : "light"}`;
});

await check("phones (390px): no sideways scroll; LeviMC menu opens", async () => {
  const phone = await newContext(PHONE);
  for (const path of ["", LEVILAMINA, "no/such/page/"]) {
    const { page, errors } = await open(path, phone);
    const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert(!wide, `sideways scroll on /${path}`);
    assert(errors.every((e) => /404/.test(e)), errors.join(" | "));
    if (path === "") {
      await page.click(".kit-gbar-more > summary");
      assert(await page.locator(".kit-gbar-more-panel").isVisible(), "menu did not open");
    }
    await page.close();
  }
  await phone.close();
  return "ok";
});

await check("phones: a search and a tag bring the results into view", async () => {
  const phone = await newContext(PHONE);
  const { page } = await open("", phone);
  // The URL changes first; the results (and the scroll) follow in the next render.
  const firstCardTop = async () => {
    const inView = () => {
      const top = document.querySelector(".pkg-card")?.getBoundingClientRect().top ?? -1;
      return top >= 0 && top < window.innerHeight / 2;
    };
    await page.waitForFunction(inView, null, { timeout: 5000 }).catch(() => {});
    return page.evaluate(() => document.querySelector(".pkg-card")?.getBoundingClientRect().top ?? -1);
  };
  await page.fill(".pkg-search-hero input[type=search]", "economy");
  await page.click(".pkg-search-hero button[type=submit]");
  await page.waitForURL((u) => new URL(u).searchParams.get("q") === "economy");
  const afterSearch = await firstCardTop();
  assert(afterSearch >= 0 && afterSearch < 844 / 2, `first result at ${afterSearch}px`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator(".pkg-tags a").first().click();
  await page.waitForURL((u) => new URL(u).searchParams.has("tags"));
  const afterTag = await firstCardTop();
  assert(afterTag >= 0 && afterTag < 844 / 2, `first result at ${afterTag}px after a tag`);
  // A search from the header of a package page lands on the list the same way.
  await page.goto(`${root}${LEVILAMINA}`, { waitUntil: "networkidle" });
  await page.fill(".pkg-header input[type=search]", "economy");
  await page.press(".pkg-header input[type=search]", "Enter");
  await page.waitForURL((u) => u.pathname === "/" && new URL(u).searchParams.get("q") === "economy");
  const fromHeader = await firstCardTop();
  assert(fromHeader >= 0 && fromHeader < 844 / 2, `first result at ${fromHeader}px after a header search`);
  await phone.close();
  return `first result at ${Math.round(afterSearch)} / ${Math.round(afterTag)} / ${Math.round(fromHeader)}px`;
});

// Every package page, as prerendered, must hydrate without a mismatch: their
// READMEs are third-party text and change with every hourly build.
await check("every package page hydrates without errors", async () => {
  const tooths = await home.evaluate(() =>
    JSON.parse(document.getElementById("pkg-page-data").textContent).packages.map((p) => p.tooth),
  );
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
        const response = await page.goto(`${root}packages/${tooth}/`, { waitUntil: "networkidle" });
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

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\nsmoke: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exitCode = 1;
