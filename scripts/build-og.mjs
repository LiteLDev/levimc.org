#!/usr/bin/env node
// The social card of levimc.org (og:image) → public/og/levimc.jpg, 1200×630 (JPEG: a painting compresses far better than as PNG).
//
// The kit's light scene (Monet's lily pond with the block-built bridge, kit/components/paint.ts) on the right, the
// LeviMC mark, name and tagline on the canvas colour on the left — the site's hero in one picture. Seeded: re-running
// the script gives the same pixels (up to font rendering).
//
//   node scripts/build-og.mjs
//
// Needs a Chromium to rasterise: playwright-core resolved from LEVIMC_PW_DIR (as scripts/build-logos.mjs) and
// CHROME_PATH (default: Chrome's Windows install path). Fetches Manrope and Inter from Google Fonts.

import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lilyPond, sceneToSvg } from '../kit/components/paint.ts';

const require = createRequire(process.env.LEVIMC_PW_DIR ? process.env.LEVIMC_PW_DIR + '/' : import.meta.url);
const { chromium } = require('playwright-core');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'og', 'levimc.jpg');
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const W = 1200;
const H = 630;

const scene = sceneToSvg(lilyPond({ width: 760, height: H, seed: 7, bridge: true, prefix: 'og' }), { preserveAspectRatio: 'xMidYMid slice' });
const logo = readFileSync(join(ROOT, 'src', 'icons', 'logo.svg'), 'utf8');
const logoUri = `data:image/svg+xml;base64,${Buffer.from(logo).toString('base64')}`;

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Manrope:wght@500..800&display=block">
<style>
  html, body { margin: 0; }
  .card { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: #f7f3e8; font-family: Inter, sans-serif; color: #16222c; }
  .paint { position: absolute; top: 0; right: 0; width: 760px; height: ${H}px; }
  .paint svg { display: block; width: 100%; height: 100%; }
  /* the painting fades into the canvas under the copy */
  .paint::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 260px; z-index: 1;
    background: linear-gradient(90deg, #f7f3e8 0 30%, rgba(247,243,232,.85) 55%, rgba(247,243,232,0)); }
  .copy { position: absolute; left: 80px; top: 0; bottom: 0; width: 560px; display: flex; flex-direction: column; justify-content: center; z-index: 2; }
  .mark { width: 112px; height: 112px; background: #fbf8ef; border: 2px solid #16222c; overflow: hidden; display: grid; place-items: center; }
  .mark img { width: 112px; height: 112px; transform: scale(1.9); }
  h1 { margin: 36px 0 0; font: 800 96px/1 Manrope, sans-serif; letter-spacing: -0.03em; }
  p { margin: 22px 0 0; font-size: 30px; line-height: 1.35; color: #3c4a55; }
  .url { margin-top: 40px; font: 600 24px/1 Inter, sans-serif; color: #2f6b3a; letter-spacing: 0.02em; }
</style></head><body>
<div class="card">
  <div class="paint">${scene}</div>
  <div class="copy">
    <div class="mark"><img src="${logoUri}" alt=""></div>
    <h1>LeviMC</h1>
    <p>Open-source tools for Minecraft Bedrock Edition</p>
    <div class="url">levimc.org</div>
  </div>
</div></body></html>`;

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, png);
console.log(`wrote ${OUT} (${(png.length / 1024).toFixed(0)} KB)`);
