#!/usr/bin/env node
// Project logos for the Projects menu and levimc.org's project cards → public/logos/.
//
// A project that has its own logo keeps it (fetched from its repository, see UPSTREAM). The others get one in the
// kit's "Impression, Craft" style — the same recipe as the LeviMC Mods logos (BarelyEnoughItems, Bedstones, …):
// a Monet scene from the kit's painter behind (kit/components/paint.ts), a crisp 32×32 pixel object in front,
// with its shadow, its reflection in the water and a few floating pixels. Every logo is seeded: re-running the
// script gives the same pixels.
//
//   node scripts/build-logos.mjs [--only LeviStone,lip]
//
// Writes public/logos/<Project>.png (512×512, the designed logos only: the artwork) and public/logos/<Project>.webp
// (128×128, every project: what the sites load). Needs a Chromium to rasterise: playwright-core resolved from
// LEVIMC_PW_DIR (as scripts/smoke.mjs) and CHROME_PATH (default: Chrome's Windows install path).

import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lilyPond, harborSunrise, sceneToSvg, mulberry32 } from '../kit/components/paint.ts';

const require = createRequire(process.env.LEVIMC_PW_DIR ? process.env.LEVIMC_PW_DIR + '/' : import.meta.url);
const { chromium } = require('playwright-core');

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'logos');
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SIZE = 512;
const N = 32; // pixel grid
const CELL = SIZE / N;
const THUMB = 128;

/** Projects with a logo of their own: used as they are (transparent margins trimmed, so they fill the slot). */
const UPSTREAM = {
  LeviLamina: 'LeviLamina/HEAD/docs/main/contents/logo.svg',
  LegacyScriptEngine: 'LegacyScriptEngine/HEAD/docs/img/logo.png',
  LeviLauncher: 'LeviLauncher/HEAD/docs/public/appicon.png',
  LeviLaunchroid: 'LeviLaunchroid/HEAD/docs/public/appicon.png',
  BarelyEnoughItems: 'BarelyEnoughItems/HEAD/docs/logo.png',
  AlleviatedBackpacks: 'AlleviatedBackpacks/HEAD/docs/logo.png',
  Bedstones: 'Bedstones/HEAD/docs/logo.png',
  BeetrootSkin: 'BeetrootSkin/HEAD/docs/logo.png',
  LeviHeadlessInput: 'LeviHeadlessInput/HEAD/docs/logo.png',
};
/** Pixel art upstream (LegacyScriptEngine's hammer): scaled without smoothing. */
const CRISP = new Set(['LegacyScriptEngine']);

// ------------------------------------------------------------------------------------------- pixel canvas

class Px {
  constructor() {
    this.c = Array.from({ length: N }, () => Array(N).fill(null));
  }
  in(x, y) {
    return x >= 0 && x < N && y >= 0 && y < N;
  }
  get(x, y) {
    return this.in(x, y) ? this.c[y][x] : null;
  }
  set(x, y, col) {
    if (this.in(x, y)) this.c[y][x] = col;
  }
  /** Fills every cell whose centre is inside `mask`; `color` is a colour or (x, y) → colour | null. */
  fill(mask, color) {
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++)
        if (mask(x + 0.5, y + 0.5)) {
          const c = typeof color === 'function' ? color(x, y) : color;
          if (c) this.set(x, y, c);
        }
  }
  /** Hand-drawn rows ('.' = leave as is). */
  stamp(rows, x0, y0, pal) {
    rows.forEach((r, j) => [...r].forEach((ch, i) => ch !== '.' && this.set(x0 + i, y0 + j, pal[ch])));
  }
  line(x0, y0, x1, y1, col) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) this.set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), col);
  }
  /** The kit's sprite outline: every empty cell touching the object (4-neighbourhood, so corners stay soft). */
  outline(col) {
    const add = [];
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++)
        if (!this.get(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => this.get(x + dx, y + dy))) add.push([x, y]);
    for (const [x, y] of add) this.set(x, y, col);
  }
  bottom() {
    for (let y = N - 1; y >= 0; y--) if (this.c[y].some(Boolean)) return y;
    return N - 1;
  }
  bounds() {
    let x0 = N, x1 = -1;
    for (const row of this.c) row.forEach((c, x) => c && ((x0 = Math.min(x0, x)), (x1 = Math.max(x1, x))));
    return [x0, x1];
  }
  /** Row runs of one colour → <rect>s. */
  toSvg() {
    let s = '';
    for (let y = 0; y < N; y++) {
      let x = 0;
      while (x < N) {
        const c = this.c[y][x];
        let w = 1;
        while (c && x + w < N && this.c[y][x + w] === c) w++;
        if (c) s += `<rect x="${x * CELL}" y="${y * CELL}" width="${w * CELL}" height="${CELL}" fill="${c}"/>`;
        x += w;
      }
    }
    return s;
  }
}

/** Light from the upper left: -1 (shade) … 1 (lit) for a cell relative to a centre. */
const light = (x, y, cx, cy, r) => Math.max(-1, Math.min(1, (-(x + 0.5 - cx) * 0.6 - (y + 0.5 - cy) * 0.8) / r));
const ramp = (cols, t) => cols[Math.max(0, Math.min(cols.length - 1, Math.floor(((t + 1) / 2) * cols.length)))];

/** A leaf (the LeviMC mark's shape) along an axis: centre, length, width, angle in degrees (0 = pointing right). */
function leafMask(cx, cy, len, wid, deg) {
  const a = (deg * Math.PI) / 180;
  return (x, y) => {
    const dx = x - cx, dy = y - cy;
    const u = dx * Math.cos(a) + dy * Math.sin(a);
    const v = -dx * Math.sin(a) + dy * Math.cos(a);
    const t = (2 * u) / len;
    return Math.abs(t) <= 1 && Math.abs(v) <= (wid / 2) * (1 - t * t) * (t < 0 ? 1.15 : 0.95);
  };
}
function leaf(px, cx, cy, len, wid, deg, cols, { midrib = true } = {}) {
  const [lit, mid, shade, vein] = cols;
  const a = (deg * Math.PI) / 180;
  px.fill(leafMask(cx, cy, len, wid, deg), (x, y) => {
    const v = -(x + 0.5 - cx) * Math.sin(a) + (y + 0.5 - cy) * Math.cos(a);
    return v < -0.6 ? lit : v > 0.9 ? shade : mid;
  });
  // the stem past the base, and the midrib (too heavy on a small leaf)
  const end = midrib ? len / 2 - 2 : -len / 2 + 0.5;
  for (let u = -len / 2 - 2; u <= end; u += 0.5) px.set(Math.floor(cx + u * Math.cos(a)), Math.floor(cy + u * Math.sin(a)), vein);
}

const GREEN = ['#a6d27f', '#79b061', '#4f8a4f', '#2f5d38'];

// ------------------------------------------------------------------------------------------- the designs

const DESIGNS = {
  // An Endstone-pale standing stone, the LeviMC leaf carved into it, moss at its foot.
  LeviStone: {
    scene: 'pond',
    seed: 1903,
    draw(px, rnd) {
      const cx = 16, cy = 16.5;
      const stone = ['#9c955a', '#bdb679', '#d8d39a', '#ebe8bd', '#f6f3d6'];
      // a menhir: wider at the foot, a rounded crown
      const hw = (y) => {
        const w = 7.2 + 2.2 * ((y - 4) / 24);
        return y < 9 ? w * Math.sqrt(Math.max(0, 1 - ((9 - y) / 5.2) ** 2)) : w;
      };
      const mask = (x, y) => y > 3.6 && y < 28.2 && Math.abs(x - cx) <= hw(y);
      px.fill(mask, (x, y) => {
        const t = light(x, y, cx, cy - 3, 9);
        const c = ramp(stone, t);
        // end stone's pores: a darker step here and there
        return rnd() < 0.13 ? stone[Math.max(0, stone.indexOf(c) - 1)] : c;
      });
      // the carving: a recessed outline, then the leaf
      px.fill(leafMask(16, 15, 13.6, 7.6, -58), '#857d48');
      leaf(px, 16, 15, 12, 6.2, -58, GREEN);
      // moss
      px.fill((x, y) => y > 25.3 && mask(x, y) && rnd() < 0.62, (x) => (x < 16 ? '#78ad63' : '#5f9a5a'));
      px.fill((x, y) => y > 23.5 && y < 25.6 && mask(x, y) && rnd() < 0.2, '#8dbb6c');
      px.outline('#2b2f1e');
    },
    sparkles: [[5, 8, '#fff7d6'], [26, 6, '#f6f3d6'], [27, 13, '#cfe7b4'], [4, 15, '#ffffff']],
  },

  // lip installs packages ("teeth"): a kraft parcel, a block of its own, tied with a LeviMC-green ribbon.
  lip: {
    scene: 'pond',
    seed: 2112,
    draw(px) {
      const cx = 16, top = 10, hw = 10, hh = 5, depth = 11;
      const yTop = (x) => top + hh * (1 - Math.abs(x - cx) / hw); // lower edge of the lid
      const onTop = (x, y) => Math.abs(x - cx) / hw + Math.abs(y - top) / hh <= 1;
      const side = (x, y) => Math.abs(x - cx) <= hw && y > yTop(x) - 0.01 && y <= yTop(x) + depth;
      px.fill(side, (x, y) => {
        const low = y > yTop(x) + depth - 2.2;
        return x < cx ? (low ? '#a8763f' : '#c99456') : low ? '#6f4b27' : '#8c6034';
      });
      // the lid, its front edges catching the light
      px.fill(onTop, (x, y) => (y > yTop(x) - 1.1 ? '#f8e7c2' : '#ecd09a'));
      // the ribbon: across the lid along both diagonals, then down the middle of each face
      const ribbonLit = '#79b061', ribbonShade = '#4f8a4f';
      px.fill((x, y) => onTop(x, y) && (Math.abs((x - cx) / 2 - (y - top)) < 0.7 || Math.abs((x - cx) / 2 + (y - top)) < 0.7), '#8dc06a');
      for (const [fx, col] of [[10, ribbonLit], [21, ribbonShade]]) {
        const y0 = Math.ceil(yTop(fx + 0.5));
        for (let y = y0; y <= y0 + depth - 1; y++) px.set(fx, y, col);
      }
      // the bow: two leaves and a knot
      px.stamp(['ll...ll', 'lGGkGGl', '.GG.GG.'], 13, top - 3, { l: '#a6d27f', G: '#5f9a5a', k: '#2f5d38' });
      px.outline('#2e2416');
    },
    sparkles: [[5, 6, '#ffffff'], [27, 7, '#f6d8de'], [3, 17, '#fff7f0']],
  },

  // Performance: a gauge with its needle deep in the fast end, the leaf where the scale starts.
  LeviOptimize: {
    scene: 'dusk',
    seed: 1873,
    sunX: 0.8,
    draw(px) {
      const cx = 16, cy = 15.5;
      const metal = ['#5d6575', '#828b9b', '#a8b0bd', '#cfd5dd', '#eef1f4'];
      const r = (x, y) => Math.hypot(x - cx, y - cy);
      // stand
      px.fill((x, y) => y > 24 && y < 28.5 && Math.abs(x - cx) < 3.2 + (y - 24) * 0.9, (x, y) => ramp(metal, light(x, y, cx, 26, 4) * 0.7 - 0.2));
      px.fill((x, y) => r(x, y) <= 11.6, (x, y) => ramp(metal, light(x, y, cx, cy, 11)));
      px.fill((x, y) => r(x, y) <= 9.9, (x, y) => (y - cy > 5 ? '#ddd2b9' : '#f3ecda'));
      // the scale: 240° from lower left, over the top, to lower right — green, gold, coral
      const from = 210, span = 240;
      px.fill(
        (x, y) => r(x, y) > 7 && r(x, y) <= 9.2,
        (x, y) => {
          let ang = (Math.atan2(-(y + 0.5 - cy), x + 0.5 - cx) * 180) / Math.PI;
          let t = (from - ang + 360) % 360;
          if (t > span) return null;
          t /= span;
          return t < 0.45 ? '#6fae5e' : t < 0.75 ? '#e8b85a' : '#e07a5f';
        },
      );
      // the needle, at 72%
      const a = ((from - 0.72 * span) * Math.PI) / 180;
      for (let s = 0; s <= 8.2; s += 0.25) px.set(Math.floor(cx + s * Math.cos(a)), Math.floor(cy - s * Math.sin(a)), s > 6 ? '#c8452f' : '#262b36');
      px.stamp(['hk', 'kk'], 15, 14, { h: '#8d96a6', k: '#262b36' });
      // the leaf at the bottom of the face
      leaf(px, 16.4, 21.8, 6, 3.8, -35, GREEN, { midrib: false });
      px.outline('#141b26');
    },
    sparkles: [[4, 7, '#ffe2b0'], [27, 5, '#ffd08a'], [26, 20, '#f6c27a'], [6, 22, '#cfd5dd']],
  },

  // Anti-cheat: a gilded shield that keeps an eye on the server.
  LeviAntiCheat: {
    scene: 'dusk',
    seed: 1881,
    sunX: 0.22,
    draw(px) {
      const cx = 16;
      const half = (y) => (y < 6 ? -1 : y <= 16 ? 10.4 : 10.4 * Math.sqrt(Math.max(0, 1 - ((y - 16) / 12.6) ** 2)));
      const shield = (x, y) => Math.abs(x - cx) <= half(y);
      const inner = (x, y) => y > 7.6 && Math.abs(x - cx) <= half(y) - 1.8 && y < 26.6;
      px.fill(shield, (x, y) => ramp(['#9b7536', '#c79b4b', '#e2bd69', '#f4dc98'], light(x, y, cx, 14, 10)));
      px.fill(inner, (x, y) => ramp(['#22406a', '#2f5487', '#3f69a3', '#5584bf'], light(x, y, cx, 14, 9)));
      // the eye
      const eye = (x, y) => Math.abs(y - 16.5) <= 3.4 * (1 - ((x - cx) / 7.2) ** 2);
      px.fill((x, y) => eye(x, y) && Math.abs(x - cx) < 7.2, '#f3eee2');
      px.fill((x, y) => Math.hypot(x - cx, y - 16.5) <= 2.6, (x, y) => (y < 16 ? '#6fd0c0' : '#3f9f93'));
      px.stamp(['kk', 'kk'], 15, 16, { k: '#101a26' });
      px.set(17, 15, '#ffffff');
      // lid line above the eye, the outline of the eye
      px.fill((x, y) => !eye(x, y) && eye(x, y + 1) && Math.abs(x - cx) < 7.5, '#101a26');
      px.fill((x, y) => !eye(x, y) && eye(x, y - 1) && Math.abs(x - cx) < 7, '#18304f');
      // rivets
      for (const [x, y] of [[8, 7], [23, 7], [16, 26]]) px.set(x, y, '#fff3c4');
      px.outline('#141b26');
    },
    sparkles: [[26, 6, '#fff3c4'], [5, 11, '#9fd9ff'], [28, 16, '#cfe8ff'], [4, 21, '#fff3c4']],
  },

  // More dimensions: a portal frame of obsidian-dark blocks; through it the Overworld, the Nether and the End.
  MoreDimensions: {
    scene: 'dusk',
    seed: 1899,
    sunX: 0.8,
    draw(px, rnd) {
      const x0 = 8, x1 = 23, y0 = 4, y1 = 27;
      const frame = ['#241b35', '#33284a', '#46385f', '#5d4a7c'];
      px.fill((x, y) => x > x0 && x < x1 + 1 && y > y0 && y < y1 + 1, (x, y) => {
        const c = ramp(frame, light(x, y, 15.5, 15.5, 12));
        return rnd() < 0.1 ? '#7b62a8' : c;
      });
      // the three worlds, with wavy borders that swirl like a portal's surface
      const b1 = (x) => 12.3 + Math.sin(x * 0.9) * 0.8;
      const b2 = (x) => 19 + Math.sin(x * 0.9 + 2) * 0.8;
      px.fill((x, y) => x > x0 + 2 && x < x1 - 1 && y > y0 + 2 && y < y1 - 1, (x, y) => {
        if (y < b1(x)) {
          const hill = 10.6 - Math.cos((x - 12) * 0.6) * 1.1;
          if (y > hill) return y > hill + 1 ? '#4f8a4f' : '#78ad63';
          return (x === 18 || x === 19) && (y === 7 || y === 8) ? '#ffe9a8' : y < 8 ? '#9fd0e8' : '#bfe0ee';
        }
        if (y < b2(x)) return (x * 3 + y * 5) % 7 === 0 ? '#f0a04b' : y < (b1(x) + b2(x)) / 2 ? '#c2503c' : '#9a3a33';
        if (y > 23 && Math.abs(x - 16) < 3.6 - (y - 23)) return '#e9e3a6';
        return (x * 7 + y * 11) % 13 === 0 ? '#e9e3ff' : '#2a1f3d';
      });
      px.stamp(['e'], 16, 23, { e: '#f4efc0' });
      px.outline('#120d1c');
    },
    sparkles: [[5, 8, '#d6b8ff'], [26, 11, '#c9a7f0'], [27, 20, '#e6d6ff'], [4, 18, '#b48ce6'], [6, 26, '#c9a7f0']],
  },
};

// ------------------------------------------------------------------------------------------- composition

function compose(id, d) {
  const rnd = mulberry32(d.seed);
  const px = new Px();
  d.draw(px, rnd);
  const by = px.bottom() + 1; // the waterline, in cells
  const [bx0, bx1] = px.bounds();
  const dusk = d.scene === 'dusk';
  const scene = dusk
    ? harborSunrise({ width: SIZE, height: SIZE, seed: d.seed, boats: false, sunDisc: true, sunX: d.sunX ?? 0.75, prefix: 'bg' })
    : lilyPond({ width: SIZE, height: SIZE, seed: d.seed, bridge: false, prefix: 'bg' });
  const bg = sceneToSvg(scene).replace('<svg ', `<svg width="${SIZE}" height="${SIZE}" `);
  const sprite = px.toSvg();
  const y = by * CELL;
  const cxPx = ((bx0 + bx1 + 1) / 2) * CELL;
  const wPx = (bx1 - bx0 + 1) * CELL;
  const sparkles = d.sparkles.map(([x, sy, c], i) => `<rect x="${x * CELL + 4}" y="${sy * CELL + 4}" width="${CELL - 8}" height="${CELL - 8}" fill="${c}" opacity="${0.75 - i * 0.08}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
<defs>
  <filter id="wave" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves="2" seed="${d.seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="18" xChannelSelector="R" yChannelSelector="G"/></filter>
  <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${dusk ? 0.42 : 0.32}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <mask id="m"><rect x="0" y="${y}" width="${SIZE}" height="${SIZE - y}" fill="url(#fade)"/></mask>
  <radialGradient id="sh"><stop offset="0" stop-color="${dusk ? '#0b1420' : '#24402c'}" stop-opacity="${dusk ? 0.55 : 0.35}"/><stop offset="1" stop-color="${dusk ? '#0b1420' : '#24402c'}" stop-opacity="0"/></radialGradient>
</defs>
${bg}
<g mask="url(#m)"><g filter="url(#wave)" transform="translate(0 ${2 * y}) scale(1 -1)" shape-rendering="crispEdges">${sprite}</g></g>
<ellipse cx="${cxPx}" cy="${y + 4}" rx="${wPx * 0.62}" ry="${CELL * 1.1}" fill="url(#sh)"/>
<g shape-rendering="crispEdges">${sparkles}${sprite}</g>
</svg>`;
}

// ------------------------------------------------------------------------------------------- rasterising

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null;
const want = (id) => !only || only.includes(id);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });

/** Loads an image (data URL) into the page and returns a THUMB×THUMB WebP, trimmed to its opaque box when asked. */
async function thumb(dataUrl, { trim, crisp }) {
  const url = await page.evaluate(
    async ({ dataUrl, T, trim, crisp }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const W = img.naturalWidth || 1024, H = img.naturalHeight || 1024;
      const src = document.createElement('canvas');
      src.width = W;
      src.height = H;
      const s = src.getContext('2d');
      s.drawImage(img, 0, 0, W, H);
      let [x0, y0, x1, y1] = [0, 0, W, H];
      if (trim) {
        const a = s.getImageData(0, 0, W, H).data;
        [x0, y0, x1, y1] = [W, H, 0, 0];
        for (let y = 0; y < H; y++)
          for (let x = 0; x < W; x++)
            if (a[(y * W + x) * 4 + 3] > 16) ((x0 = Math.min(x0, x)), (y0 = Math.min(y0, y)), (x1 = Math.max(x1, x + 1)), (y1 = Math.max(y1, y + 1)));
        const side = Math.max(x1 - x0, y1 - y0) * 1.08; // a little air, square
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        [x0, y0, x1, y1] = [mx - side / 2, my - side / 2, mx + side / 2, my + side / 2];
      }
      const out = document.createElement('canvas');
      out.width = out.height = T;
      const o = out.getContext('2d');
      o.imageSmoothingEnabled = !crisp;
      o.imageSmoothingQuality = 'high';
      o.drawImage(src, x0, y0, x1 - x0, y1 - y0, 0, 0, T, T);
      return out.toDataURL('image/webp', 0.9);
    },
    { dataUrl, T: THUMB, trim, crisp },
  );
  return Buffer.from(url.split(',')[1], 'base64');
}

/** raw.githubusercontent.com drops connections now and then: a few tries. */
async function download(url) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} for ${url}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (i === 4) throw e;
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
}

for (const [id, d] of Object.entries(DESIGNS)) {
  if (!want(id)) continue;
  await page.setContent(`<style>html,body{margin:0}</style>${compose(id, d)}`);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: SIZE, height: SIZE } });
  writeFileSync(join(OUT, `${id}.png`), png);
  writeFileSync(join(OUT, `${id}.webp`), await thumb(`data:image/png;base64,${png.toString('base64')}`, { trim: false }));
  console.log(`designed ${id}`);
}
for (const [id, path] of Object.entries(UPSTREAM)) {
  if (!want(id)) continue;
  const buf = await download(`https://raw.githubusercontent.com/LiteLDev/${path}`);
  const mime = path.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  writeFileSync(join(OUT, `${id}.webp`), await thumb(`data:${mime};base64,${buf.toString('base64')}`, { trim: true, crisp: CRISP.has(id) }));
  console.log(`upstream ${id}`);
}
await browser.close();
