#!/usr/bin/env node
// Browser smoke test for levimc.org (a plain Vite app on levimc-kit), served like GitHub Pages:
//
//   npm run build && npm run preview      # serve-pages.mjs on :4173
//   node scripts/smoke.mjs --url http://127.0.0.1:4173/
//
// kit/scripts/smoke.mjs targets the docs engine (search, [data-doc-content], URL-based locales); this one
// checks what this site does instead. Playwright is resolved from $LEVIMC_PW_DIR or the app.
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const base = (opt('--url', 'http://127.0.0.1:4173/') || '').replace(/\/?$/, '/');
const require = createRequire(process.env.LEVIMC_PW_DIR ? process.env.LEVIMC_PW_DIR + '/' : import.meta.url);
const { chromium } = require('playwright');

const ROUTES = ['', 'projects/', 'features/', 'community/', 'about/', 'support/'];
const H1 = {
  en: { '': 'Mod Bedrock', 'projects/': 'All Projects', 'features/': 'Build mods', 'community/': 'Get Involved', 'about/': 'The story of a small team.', 'support/': 'Support LeviMC' },
  zh: { '': '随心所欲', 'projects/': '所有项目', 'features/': '按你的方式', 'community/': '参与进来', 'about/': '一个无名小团队的故事。', 'support/': '支持 LeviMC' },
};

const results = [];
const check = async (name, fn) => {
  try {
    const detail = await fn();
    results.push({ name, ok: true });
    console.log(`  ✔ ${name}${detail ? ` — ${detail}` : ''}`);
  } catch (e) {
    results.push({ name, ok: false });
    console.log(`  ✘ ${name} — ${String(e?.message ?? e).split('\n')[0]}`);
  }
};
const assert = (c, msg) => {
  if (!c) throw new Error(msg);
};

// Use the environment's proxy when there is one (for the live-data checks); loopback always goes direct.
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
const browser = await chromium.launch(proxy ? { proxy: { server: proxy, bypass: '<-loopback>,localhost,127.0.0.1' } } : {});
const newContext = async ({ locale, width = 1440, height = 900, scheme = 'light', mobile = false } = {}) => {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  if (locale) await ctx.addInitScript((l) => localStorage.setItem('locale', l), locale);
  return ctx;
};
// Third-party hosts whose failures the site tolerates: web fonts, and the live-data endpoints (GitHub /
// Shields / Discord, which may rate-limit or be blocked; the site falls back silently) and GitHub avatars.
const TOLERATED = /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|api\.github\.com|img\.shields\.io|discord\.com|avatars\.githubusercontent\.com)\//;
const watch = (page) => {
  const errs = [];
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    // Chromium's "Failed to load resource" text has no URL; the request listeners below report it with one
    if (/^Failed to load resource/.test(m.text())) return;
    errs.push(`${m.type()}: ${m.text()}`);
  });
  page.on('requestfailed', (r) => {
    if (!TOLERATED.test(r.url())) errs.push(`request failed: ${r.url()} (${r.failure()?.errorText})`);
  });
  page.on('response', (r) => {
    // the page's own status is asserted by each check (the 404 page answers 404 on purpose)
    if (r.request().isNavigationRequest() && r.request().frame() === page.mainFrame()) return;
    if (r.status() >= 400 && !TOLERATED.test(r.url())) errs.push(`HTTP ${r.status()}: ${r.url()}`);
  });
  return errs;
};

console.log(`smoke: ${base}`);

for (const locale of ['en', 'zh']) {
  await check(`${locale}: every route renders (200, h1, lang, no console/hydration errors, no sideways scroll)`, async () => {
    const ctx = await newContext({ locale: locale === 'en' ? undefined : locale });
    for (const r of ROUTES) {
      for (const width of [1440, 390]) {
        const page = await ctx.newPage();
        await page.setViewportSize({ width, height: 900 });
        const errs = watch(page);
        const res = await page.goto(base + r, { waitUntil: 'networkidle' });
        assert(res?.status() === 200, `${r || '/'} → ${res?.status()}`);
        const h1 = (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ').trim();
        assert(h1.startsWith(H1[locale][r]), `${r || '/'}: h1 "${h1}"`);
        const state = await page.evaluate(() => ({ lang: document.documentElement.lang, pending: document.documentElement.classList.contains('lm-locale-pending'), sideways: document.documentElement.scrollWidth > window.innerWidth + 1 }));
        assert(state.lang === locale, `${r || '/'}: <html lang="${state.lang}">`);
        assert(!state.pending, `${r || '/'}: page still hidden (lm-locale-pending)`);
        assert(!state.sideways, `${r || '/'}: horizontal scroll at ${width}px`);
        assert(!errs.length, `${r || '/'} @${width}: ${errs.join(' | ')}`);
        await page.close();
      }
    }
    await ctx.close();
    return `${ROUTES.length} routes × 2 widths`;
  });
}

await check('prerendered HTML: every route is real static HTML with canonical, description and content', async () => {
  for (const r of ROUTES) {
    const html = await (await fetch(base + r)).text();
    assert(html.includes(`<link rel="canonical" href="https://levimc.org/${r}"`), `${r || '/'}: canonical`);
    assert(/<meta name="description" content="[^"]+"/.test(html), `${r || '/'}: description`);
    assert(html.includes(H1.en[r].replace(/&/g, '&amp;').replace(/'/g, '&#x27;')), `${r || '/'}: h1 text not in the static HTML`);
  }
  const support = await (await fetch(base + 'support/')).text();
  const csv = await (await fetch(base + 'donors.csv')).text();
  const rows = csv.split(/\r?\n/).filter((l) => l.trim()).length - 1;
  const cards = (support.match(/class="px-card lm-donor"/g) || []).length;
  assert(cards === rows, `support/: ${cards} donor cards prerendered, donors.csv has ${rows} rows`);
  return `${ROUTES.length} routes; ${cards} supporters prerendered`;
});

await check('unknown path → 404 status, themed page, per-locale text', async () => {
  for (const locale of ['en', 'zh']) {
    const ctx = await newContext({ locale: locale === 'zh' ? 'zh' : undefined });
    const page = await ctx.newPage();
    const errs = watch(page);
    const res = await page.goto(base + 'no/such/page/', { waitUntil: 'networkidle' });
    assert(res?.status() === 404, `status ${res?.status()}`);
    await page.waitForSelector('.kit-notfound');
    const title = await page.locator('.kit-notfound-title').innerText();
    assert(locale === 'zh' ? title.includes('走丢') : title.includes('wandered off'), `${locale}: "${title}"`);
    assert(!errs.length, errs.join(' | '));
    await ctx.close();
  }
  return 'en + zh';
});

await check('/index.html and /<route>/index.html show their page at the canonical URL (no 404, no hydration error)', async () => {
  const ctx = await newContext();
  for (const [path, r] of [['index.html', ''], ['about/index.html', 'about/'], ['projects/index.html?ref=x#top', 'projects/'], ['support//', 'support/']]) {
    const page = await ctx.newPage();
    const errs = watch(page);
    const res = await page.goto(base + path, { waitUntil: 'networkidle' });
    assert(res?.status() === 200, `${path} → ${res?.status()}`);
    const h1 = (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ').trim();
    assert(h1.startsWith(H1.en[r]), `${path}: h1 "${h1}"`);
    assert(!(await page.title()).startsWith('404'), `${path}: title "${await page.title()}"`);
    const u = new URL(page.url());
    assert(u.pathname === new URL(base + r).pathname, `${path}: URL ${u.pathname}`);
    if (path.includes('?')) assert(u.search === '?ref=x' && u.hash === '#top', `${path}: query/hash lost (${u.search}${u.hash})`);
    assert(!errs.length, `${path}: ${errs.join(' | ')}`);
    await page.close();
  }
  await ctx.close();
  return '/index.html, /about/index.html, /projects/index.html?…#…, /support//';
});

await check('client-side navigation from the header (no full reload, canonical URL)', async () => {
  const ctx = await newContext();
  const page = await ctx.newPage();
  const errs = watch(page);
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => (window.__lmMarker = 1));
  await page.click('.kit-gbar-nav a[href="/projects/"]');
  await page.waitForURL((u) => u.pathname === '/projects/');
  await page.waitForSelector('h1:has-text("All Projects")');
  assert((await page.evaluate(() => window.__lmMarker)) === 1, 'page reloaded');
  await page.waitForFunction(() => document.title.startsWith('All Projects'), null, { timeout: 5000 });
  await page.click('.kit-gbar-nav a[href="/about/"]');
  await page.waitForURL((u) => u.pathname === '/about/');
  assert((await page.evaluate(() => window.__lmMarker)) === 1, 'page reloaded');
  assert(!errs.length, errs.join(' | '));
  await ctx.close();
  return '/ → /projects/ → /about/';
});

await check('theme toggle flips, persists in levimc-theme, survives reload', async () => {
  const ctx = await newContext();
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  const before = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  await page.click('[data-kit-theme-toggle]');
  const after = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  assert(before !== after, 'html.dark did not change');
  assert((await page.evaluate(() => localStorage.getItem('levimc-theme'))) === (after ? 'dark' : 'light'), 'not stored');
  await page.reload({ waitUntil: 'networkidle' });
  assert((await page.evaluate(() => document.documentElement.classList.contains('dark'))) === after, 'not persisted');
  await ctx.close();
  return `${before ? 'dark' : 'light'} → ${after ? 'dark' : 'light'}`;
});

await check('legacy localStorage "theme" is migrated once to "levimc-theme" before first paint', async () => {
  const ctx = await newContext({ scheme: 'light' });
  await ctx.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('theme', 'dark');
    }
  });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  const s = await page.evaluate(() => ({ dark: document.documentElement.classList.contains('dark'), kit: localStorage.getItem('levimc-theme'), old: localStorage.getItem('theme') }));
  assert(s.dark && s.kit === 'dark' && s.old === null, JSON.stringify(s));
  await ctx.close();
  return 'theme=dark → levimc-theme=dark';
});

await check('language switcher: en ⇄ zh, stored in localStorage "locale", kept on reload and navigation', async () => {
  const ctx = await newContext();
  const page = await ctx.newPage();
  const errs = watch(page);
  await page.goto(base + 'community/', { waitUntil: 'networkidle' });
  assert((await page.locator('[data-kit-locale-switcher]').innerText()).trim() === 'EN', 'trigger label is not "EN"');
  await page.click('[data-kit-locale-switcher]');
  await page.click('.kit-locale [role="menuitemradio"][data-locale="zh"]');
  await page.waitForFunction(() => document.documentElement.lang === 'zh');
  assert((await page.locator('[data-kit-locale-switcher]').innerText()).trim() === 'ZH', 'trigger label is not "ZH"');
  assert(!(await page.locator('.kit-locale').evaluate((d) => d.open)), 'language menu still open');
  assert(new URL(page.url()).pathname === '/community/', `moved to ${page.url()}`);
  assert((await page.locator('h1').innerText()).includes('参与进来'), 'h1 not translated');
  assert((await page.locator('.lm-qq-group').count()) === 3, 'QQ groups missing in zh');
  assert((await page.evaluate(() => localStorage.getItem('locale'))) === 'zh', 'not stored');
  await page.reload({ waitUntil: 'networkidle' });
  assert((await page.locator('h1').innerText()).includes('参与进来'), 'not kept after reload');
  await page.click('.kit-gbar-nav a[href="/about/"]');
  await page.waitForURL((u) => u.pathname === '/about/');
  await page.waitForFunction(() => document.title === '关于 LeviMC', null, { timeout: 5000 });
  await page.click('[data-kit-locale-switcher]');
  await page.click('.kit-locale [role="menuitemradio"][data-locale="en"]');
  await page.waitForFunction(() => document.documentElement.lang === 'en');
  assert((await page.locator('.lm-qq-group').count()) === 0, 'QQ groups shown in en');
  assert(!errs.length, errs.join(' | '));
  await ctx.close();
  return 'community → 中文 → reload → about → English';
});

await check('no flash of English for a returning Chinese visitor', async () => {
  const ctx = await newContext({ locale: 'zh' });
  await ctx.addInitScript(() => {
    window.__lmLog = [];
    new MutationObserver(() => {
      const pending = document.documentElement.classList.contains('lm-locale-pending');
      const h1 = document.querySelector('h1')?.textContent ?? '';
      window.__lmLog.push({ pending, h1 });
    }).observe(document, { attributes: true, childList: true, subtree: true, characterData: true });
  });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  const log = await page.evaluate(() => window.__lmLog);
  const visibleEnglish = log.filter((e) => !e.pending && e.h1.includes('Mod Bedrock'));
  assert(log.some((e) => e.pending), 'pre-paint script never hid the page');
  assert(!visibleEnglish.length, 'English hero was visible');
  await ctx.close();
  return `${log.length} DOM mutations observed, English never visible`;
});

await check('hero code tabs (hotbar): click and arrow keys switch the sample', async () => {
  const ctx = await newContext();
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  const tabs = page.locator('[data-kit-hero] [role="tab"]');
  assert((await tabs.count()) === 3, 'expected 3 tabs');
  await tabs.nth(1).click();
  assert((await tabs.nth(1).getAttribute('aria-selected')) === 'true', 'second tab not selected');
  assert((await page.locator('[data-kit-hero] [role="tabpanel"]').innerText()).includes('mc.listen("onJoin", (player) => {'), 'JS sample not shown');
  await tabs.nth(1).press('ArrowRight');
  assert((await tabs.nth(2).getAttribute('aria-selected')) === 'true', 'ArrowRight did not move to main.lua');
  assert((await page.locator('[data-kit-hero] [role="tabpanel"]').innerText()).includes('player:tell("Welcome!")'), 'Lua sample not shown');
  await ctx.close();
  return 'main.cpp → main.js → main.lua';
});

await check('live data: release badge and project stars fill in after hydration', async () => {
  const ctx = await newContext();
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('.lm-release-version', { timeout: 15000 });
  await page.waitForFunction(() => !document.querySelector('.lm-project-stars .lm-skeleton'), null, { timeout: 15000 });
  const v = await page.locator('.lm-release-version').innerText();
  await ctx.close();
  return `LeviLamina ${v}`;
});

await check('mobile (390px): the bar folds its entries into its menu; it closes on Escape and after navigating', async () => {
  const ctx = await newContext({ width: 390, height: 844, mobile: true });
  const page = await ctx.newPage();
  const errs = watch(page);
  await page.goto(base, { waitUntil: 'networkidle' });
  assert(!(await page.locator('.kit-gbar-nav').isVisible()), 'inline nav still visible');
  const toggle = page.locator('.kit-gbar-more > summary');
  assert(await toggle.isVisible(), 'menu button hidden');
  await toggle.click();
  const panel = page.locator('.kit-gbar-more-panel');
  await panel.waitFor({ state: 'visible' });
  const labels = await panel.locator('.kit-gbar-more-link').allInnerTexts();
  assert(labels.join('|') === 'Home|Mods|Projects|Features|Community|Blog|About|Support Us', `menu entries: ${labels.join('|')}`);
  await page.keyboard.press('Escape');
  await panel.waitFor({ state: 'hidden' });
  assert(await page.evaluate(() => !!document.activeElement?.closest('.kit-gbar-more')), 'focus not returned to the menu button');
  await page.evaluate(() => (window.__lmMarker = 1));
  await toggle.click();
  await page.click('.kit-gbar-more-panel a[href="/support/"]');
  await page.waitForURL((u) => u.pathname === '/support/');
  await panel.waitFor({ state: 'hidden' });
  assert((await page.evaluate(() => window.__lmMarker)) === 1, 'page reloaded');
  assert(!errs.length, errs.join(' | '));
  await ctx.close();
  return 'ok';
});

await check('header: one bar, every destination once; docs menu opens; cross-site links are canonical', async () => {
  const ctx = await newContext();
  const page = await ctx.newPage();
  await page.goto(base + 'projects/', { waitUntil: 'networkidle' });
  assert((await page.locator('[data-kit-globalbar]').count()) === 1 && (await page.locator('header.lm-banner [data-kit-globalbar]').count()) === 1, 'expected one GlobalBar, inside the banner <header>');
  const hrefs = await page.locator('.lm-banner .kit-gbar-nav a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  assert(new Set(hrefs).size === hrefs.length, `duplicate destinations: ${hrefs.join(' ')}`);
  assert((await page.locator('.lm-banner a[href="https://github.com/LiteLDev"]').count()) === 1, 'GitHub link missing or repeated');
  assert((await page.locator('.kit-gbar-link[aria-current="page"]').innerText()) === 'Projects', 'Projects not current');
  await page.click('.kit-gbar-docs > summary');
  assert(await page.locator('.kit-gbar-docs-panel a[href="https://docs.levimc.org/LeviLamina/"]').isVisible(), 'docs menu');
  await page.keyboard.press('Escape');
  await ctx.close();
  return 'ok';
});

await check('header fits: inline entries from 1024 px up (en, zh), folded into the menu below', async () => {
  const seen = [];
  for (const locale of ['en', 'zh']) {
    for (const width of [1023, 1024, 1100, 1280]) {
      const ctx = await newContext({ locale: locale === 'zh' ? 'zh' : undefined, width });
      const page = await ctx.newPage();
      await page.goto(base, { waitUntil: 'networkidle' });
      const s = await page.evaluate(() => {
        const inner = document.querySelector('.kit-gbar-inner');
        const nav = document.querySelector('.kit-gbar-nav');
        const end = document.querySelector('.kit-gbar-end');
        const shown = getComputedStyle(nav).display !== 'none';
        return { shown, overflow: inner.scrollWidth > inner.clientWidth, room: shown ? Math.round(end.getBoundingClientRect().left - nav.getBoundingClientRect().right) : null };
      });
      assert(!s.overflow, `${locale}@${width}: the bar overflows`);
      assert(s.shown === width >= 1024, `${locale}@${width}: inline nav ${s.shown ? 'shown' : 'hidden'}`);
      if (s.shown) {
        assert(s.room >= 24, `${locale}@${width}: only ${s.room}px between the entries and the controls`);
        seen.push(`${locale}@${width} ${s.room}px`);
      }
      await ctx.close();
    }
  }
  return `room left: ${seen.join(', ')}`;
});

await check('Discord unreachable: no invented "online" count', async () => {
  const ctx = await newContext({ locale: 'zh' });
  await ctx.route(/discord\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  await page.goto(base + 'community/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.querySelector('.lm-community-card .lm-skeleton'), null, { timeout: 15000 });
  const card = (await page.locator('.lm-accent-discord').first().innerText()).replace(/\s+/g, ' ');
  assert(!/\d+ (在线|online)/.test(card), `Discord card shows "${card}"`);
  await ctx.close();
  return 'no presence line';
});

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\nsmoke: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exitCode = 1;
