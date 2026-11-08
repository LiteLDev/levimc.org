// Rendering budget of the kit (kit 2.19, design rule D1/D2): what the theme may ask the compositor and the GPU to do.
// Checks the CSS sources (theme/*.css, docs/app/docs.css, static/doxygen/doxygen-kit.css) and the prebuilt static
// chrome (static/kit.css, static/kit-chrome.css) once it has been regenerated from kit ≥ 2.19 sources.
// Run: node --test "kit/tests/*.test.mjs" (no dependencies).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const url = (rel) => new URL(rel, import.meta.url);
const read = (rel) => readFileSync(url(rel), 'utf8').replace(/\r\n/g, '\n');

const SOURCES = [
  ...readdirSync(url('../theme/'))
    .filter((f) => f.endsWith('.css'))
    .map((f) => `../theme/${f}`),
  '../docs/app/docs.css',
  '../static/doxygen/doxygen-kit.css',
].filter((f) => existsSync(url(f)));
// The prebuilt chrome is checked once it is built from kit ≥ 2.19 sources (the painted backdrop's tiles are a marker
// of that); an older build is reported as skipped: run `node kit/static/build-static.mjs`.
const STATIC = ['../static/kit.css', '../static/kit-chrome.css'].filter((f) => existsSync(url(f)));
const isCurrentStatic = (css) => css.includes('--kit-backdrop-dabs');

/** CSS without comments and without the content of url(...) / strings (data URIs hold SVG markup). */
function strip(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/url\((["']?)(?:data:)[^)]*?\1\)/g, 'url()')
    .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, '""');
}
/** Every innermost rule: { selector, body } (selectors of nested rules are their own; at-rule preludes drop out). */
function rules(css) {
  const out = [];
  for (const m of strip(css).matchAll(/([^{}]*)\{([^{}]*)\}/g)) out.push({ selector: m[1].trim(), body: m[2] });
  return out;
}
const decl = (body, prop) => [...body.matchAll(new RegExp(`(?:^|;|\\s)${prop}\\s*:\\s*([^;]*)`, 'g'))].map((m) => m[1].trim());

/**
 * Infinite animations that are allowed, with the reason. Empty since kit 2.19: nothing in the kit animates forever
 * (the drift, the hero glints, the shimmer and step-spinner tokens and the 404 compass's endless spin are gone).
 * Add an entry only for an animation that runs while the user interacts with it.
 */
const INFINITE_ALLOWED = [];

function checkCss(name, css) {
  const problems = [];
  for (const { selector, body } of rules(css)) {
    const where = `${name}: ${selector.replace(/\s+/g, ' ').slice(0, 90)}`;
    // 1. no perpetual animation (animation shorthand, iteration count, Tailwind --animate-* tokens)
    for (const v of [...decl(body, 'animation'), ...decl(body, 'animation-iteration-count'), ...decl(body, '--animate-[\\w-]+')])
      if (/\binfinite\b/.test(v) && !INFINITE_ALLOWED.some((a) => selector.includes(a))) problems.push(`${where}: infinite animation (${v})`);
    // 2. no backdrop-filter (it re-renders what is behind the element on every frame something under it changes)
    for (const v of [...decl(body, 'backdrop-filter'), ...decl(body, '-webkit-backdrop-filter')])
      if (v !== 'none') problems.push(`${where}: backdrop-filter ${v}`);
    // 3. the backdrop is no layer: no will-change, no fixed position, no blend mode on it
    if (/\.kit-backdrop/.test(selector)) {
      if (decl(body, 'will-change').length) problems.push(`${where}: will-change on the backdrop`);
      if (decl(body, 'position').includes('fixed')) problems.push(`${where}: a fixed backdrop`);
    }
    // 4. no mix-blend-mode on a full-viewport layer (the backdrop, the root, body, or anything fixed)
    const blend = decl(body, 'mix-blend-mode').filter((v) => v !== 'normal');
    if (blend.length && (/\.kit-backdrop|(^|[\s,>])(html|body|:root)\b/.test(selector) || decl(body, 'position').includes('fixed')))
      problems.push(`${where}: mix-blend-mode ${blend[0]} on a full-viewport layer`);
    // 5. never a fixed background attachment (it repaints the page on every scroll frame)
    for (const v of [...decl(body, 'background-attachment'), ...decl(body, 'background')])
      if (/(^|[\s,])fixed([\s,]|$)/.test(v)) problems.push(`${where}: background-attachment fixed`);
  }
  if (/@keyframes\s+kit-(drift|glint|shimmer|spin-steps)\b/.test(css)) problems.push(`${name}: removed keyframes are back`);
  return problems;
}

test('theme and docs CSS keep the rendering budget: no infinite animation, backdrop-filter, fixed blend layer', () => {
  assert.ok(SOURCES.length >= 10, 'theme sources found');
  assert.deepEqual(SOURCES.flatMap((f) => checkCss(f.replace('../', ''), read(f))), []);
});

test('prebuilt static chrome keeps the rendering budget (once rebuilt from kit ≥ 2.19)', (t) => {
  const current = STATIC.filter((f) => isCurrentStatic(read(f)));
  if (!current.length) return t.skip(`${STATIC.join(', ')} predate kit 2.19: run node kit/static/build-static.mjs`);
  assert.deepEqual(current.flatMap((f) => checkCss(f.replace('../', ''), read(f))), []);
});

test('the painted backdrop is the root background: mirrored dabs tile, scrolling, no fixed element', () => {
  const painterly = strip(read('../theme/painterly.css'));
  const root = rules(painterly).find((r) => r.selector === ':root:has(.kit-backdrop)');
  assert.ok(root, ':root:has(.kit-backdrop) rule');
  const bg = decl(root.body, 'background')[0] ?? '';
  assert.match(bg, /var\(--kit-backdrop-dabs\) 0 0 \/ 100% 200lvh repeat-y/);
  assert.match(bg, /var\(--color-canvas\)$/);
  assert.deepEqual(decl(root.body, 'background-blend-mode'), ['multiply, soft-light, normal']);
  assert.ok(rules(painterly).some((r) => r.selector === '.kit-backdrop' && decl(r.body, 'display')[0] === 'none'), '.kit-backdrop paints nothing');
  assert.ok(rules(painterly).some((r) => r.selector === ':root:has(.kit-backdrop) body' && decl(r.body, 'background')[0] === 'transparent'));
});

test('generated.css: the dabs tiles are valid PNGs, one viewport wide and two high, mirrored', () => {
  const gen = read('../theme/generated.css');
  const tiles = [...gen.matchAll(/--kit-backdrop-dabs: url\("data:image\/png;base64,([^"]+)"\)/g)].map((m) => Buffer.from(m[1], 'base64'));
  assert.equal(tiles.length, 2, 'light (:root) and dark (.dark) tiles');
  for (const png of tiles) {
    assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
    assert.equal(h, 2 * w, 'two viewports high');
    // collect IDAT, inflate, undo the row filters, compare row j with row h-1-j
    const idat = [];
    for (let p = 8; p < png.length; ) {
      const len = png.readUInt32BE(p), type = png.toString('ascii', p + 4, p + 8);
      if (type === 'IDAT') idat.push(png.subarray(p + 8, p + 8 + len));
      p += 12 + len;
    }
    const raw = inflateSync(Buffer.concat(idat));
    const stride = w * 4, rows = [];
    for (let y = 0; y < h; y++) {
      const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), prev = rows[y - 1] ?? new Uint8Array(stride), row = new Uint8Array(stride);
      for (let x = 0; x < stride; x++) {
        const a = x >= 4 ? row[x - 4] : 0, b = prev[x], c = x >= 4 ? prev[x - 4] : 0;
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        const pred = f === 0 ? 0 : f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        row[x] = (line[x] + pred) & 0xff;
      }
      rows.push(row);
    }
    for (let y = 0; y < h / 2; y++) assert.ok(Buffer.from(rows[y]).equals(Buffer.from(rows[h - 1 - y])), `row ${y} mirrors row ${h - 1 - y}`);
    assert.ok(rows.some((r) => r.some((v, i) => i % 4 === 3 && v > 0)), 'not empty');
  }
});

test('hero scenes are external SVG files, not data URIs in render-blocking CSS', () => {
  const hero = read('../theme/hero.css');
  assert.doesNotMatch(hero, /data:image/);
  for (const m of hero.matchAll(/url\("\.\/([^"]+)"\)/g)) {
    assert.ok(existsSync(url(`../theme/${m[1]}`)), m[1]);
    assert.doesNotMatch(read(`../theme/${m[1]}`), /<style|<animate|animation/, `${m[1]} is static`);
  }
});
