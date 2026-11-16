// node --test scripts/shots/
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { test } from 'node:test';
import {
  assertDesensitized,
  fmt,
  imageInfo,
  renderShot,
  textWidth,
  wrap,
  writeShots,
} from './annotate.mjs';

/** A valid PNG of width × height pixels, one flat color. */
function png(width, height, noise = false) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const row = () => Buffer.concat([Buffer.from([0]), noise ? randomBytes(width * 3) : Buffer.alloc(width * 3, 0xee)]);
  const raw = Buffer.concat(Array.from({ length: height }, row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const IMAGE = png(400, 200); // 200 × 100 CSS pixels at 2×
const L = (en, hans = en, hant = hans) => ({ en, 'zh-Hans': hans, 'zh-Hant': hant });

const base = (notes = [], extra = {}) => ({
  name: 'test-01-sample',
  image: IMAGE,
  scale: 2,
  frame: 'windows',
  notes,
  ...extra,
});

test('fmt writes at most two decimals and no negative zero', () => {
  assert.equal(fmt(1), '1');
  assert.equal(fmt(1.005), '1.01');
  assert.equal(fmt(2.5), '2.5');
  assert.equal(fmt(-0.001), '0');
  assert.equal(fmt(-3.456), '-3.46');
  assert.equal(fmt(1 / 3), '0.33');
});

test('textWidth counts CJK as two columns', () => {
  assert.equal(textWidth('Play'), 4);
  assert.equal(textWidth('开始游戏'), 8);
  assert.equal(textWidth('a\u0301'), 1);
});

test('wrap breaks at spaces and between CJK characters, never before a closing mark', () => {
  assert.deepEqual(wrap('one two three', 7), ['one two', 'three']);
  assert.deepEqual(wrap('一二三四。', 8), ['一二三', '四。']);
  assert.deepEqual(wrap('D:\\LeviLauncher\\instances', 12), ['D:\\', 'LeviLauncher', '\\instances']);
});

test('imageInfo reads PNG, JPEG and WebP headers', () => {
  assert.deepEqual(imageInfo(IMAGE), { type: 'image/png', width: 400, height: 200 });
  // SOI, APP0 (length 16), SOF0 with height 0x0120 and width 0x0340.
  const app0 = Buffer.concat([Buffer.from([0xff, 0xe0, 0x00, 0x10]), Buffer.alloc(14)]);
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x20, 0x03, 0x40, 0x03]);
  assert.deepEqual(imageInfo(Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof])), {
    type: 'image/jpeg',
    width: 0x340,
    height: 0x120,
  });
  const vp8x = Buffer.alloc(30);
  vp8x.write('RIFF', 0, 'latin1');
  vp8x.write('WEBP', 8, 'latin1');
  vp8x.write('VP8X', 12, 'latin1');
  vp8x.writeUIntLE(1279, 24, 3);
  vp8x.writeUIntLE(719, 27, 3);
  assert.deepEqual(imageInfo(vp8x), { type: 'image/webp', width: 1280, height: 720 });
  assert.throws(() => imageInfo(Buffer.from('GIF89a........................')), /Not a PNG/);
});

test('a picture without notes is the frame and the image at CSS size', () => {
  const svg = renderShot(base(), 'en');
  assert.match(svg, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="220" height="120" viewBox="0 0 220 120" role="img"/);
  assert.match(svg, /<title>test-01-sample<\/title>/);
  assert.match(svg, /<image x="10" y="10" width="200" height="100" preserveAspectRatio="none" href="data:image\/png;base64,/);
  assert.ok(!/traffic|#ff5f57/.test(svg), 'no macOS buttons');
});

test('the same spec gives the same bytes', () => {
  const spec = base([
    { kind: 'box', target: { x: 10, y: 10, width: 50, height: 20 } },
    { kind: 'arrow', target: { x: 100, y: 40, width: 40, height: 20 }, label: L('Click', '点击', '點擊') },
  ]);
  assert.equal(renderShot(spec, 'zh-Hans'), renderShot(structuredClone(spec), 'zh-Hans'));
});

test('a box and an ellipse are drawn as lip draws them', () => {
  const svg = renderShot(
    base([
      { kind: 'box', target: { x: 20, y: 30, width: 50, height: 20 } },
      { kind: 'ellipse', target: { x: 100, y: 30, width: 40, height: 20 } },
    ]),
    'en',
  );
  // Window at (10, 10): the box at (30 − 4, 40 − 2), 58 × 24.
  assert.match(svg, /<rect x="26" y="38" width="58" height="24" rx="6" fill="#ffa94d" fill-opacity="0.1" stroke="#ffa94d" stroke-width="2"\/>/);
  assert.match(svg, /<ellipse cx="130" cy="50" rx="31.4" ry="17.2" fill="#ffa94d"/);
});

test('an arrow at the right widens the picture by its pill and points at the target', () => {
  const svg = renderShot(
    base([{ kind: 'arrow', side: 'right', target: { x: 150, y: 40, width: 40, height: 20 }, label: L('Play', '开始', '開始') }]),
    'en',
  );
  // Pill: 4 columns × 7.8 + 16 = 47.2; picture: 10 + 200 + 28 + 47.2 + 10.
  assert.match(svg, /width="295.2"/);
  assert.match(svg, /<rect x="238" y="49" width="47.2" height="22" rx="6" fill="#ffa94d"\/>/);
  assert.match(svg, /<text x="246" y="64.5" textLength="31.2" lengthAdjust="spacingAndGlyphs" font-weight="700" fill="#1a1d24">Play<\/text>/);
  // The line ends 7 short of the tip at the right edge of the target + 5.
  assert.match(svg, /<path d="M238 60L212 60" fill="none" stroke="#ffa94d"/);
  const zh = renderShot(
    base([{ kind: 'arrow', side: 'right', target: { x: 150, y: 40, width: 40, height: 20 }, label: L('Play', '开始', '開始') }]),
    'zh-Hans',
  );
  assert.match(zh, /<text x="253.8 269.4" y="64.5" text-anchor="middle"[^>]*>开始<\/text>/);
});

test('pills on one side are spread so they do not overlap', () => {
  const svg = renderShot(
    base([
      { kind: 'arrow', side: 'left', target: { x: 10, y: 40, width: 20, height: 10 }, label: L('A') },
      { kind: 'arrow', side: 'left', target: { x: 10, y: 42, width: 20, height: 10 }, label: L('B') },
    ]),
    'en',
  );
  const ys = [...svg.matchAll(/<rect x="[\d.]+" y="([\d.]+)" width="23.8" height="22"/g)].map((m) => Number(m[1]));
  assert.equal(ys.length, 2);
  assert.ok(ys[1] - ys[0] >= 26, `pills ${ys} overlap`);
});

test('callouts get a legend in the footer, and keys a row of badges', () => {
  const svg = renderShot(
    base([
      { kind: 'callout', n: 1, target: { x: 50, y: 20, width: 40, height: 20 }, label: L('First', '第一', '第一') },
      { kind: 'keys', keys: ['Ctrl', 'S'], caption: L('Then press', '然后按', '然後按') },
    ]),
    'en',
  );
  assert.match(svg, /<circle cx="46" cy="40" r="10" fill="#ffa94d" stroke="#1a1d24" stroke-width="1.5"\/>/);
  assert.match(svg, /rx="9.5" fill="#272b35" stroke="#3d4454"/);
  assert.match(svg, />First<\/text>/);
  assert.match(svg, />Then press<\/text>/);
  assert.match(svg, /height="23" rx="5" fill="#1a1d24" stroke="#ffa94d"/);
  // Footer: 22 (legend) + 32 (keys) + 16, at 10 below the window; picture 10 below it.
  assert.match(svg, /height="200" viewBox="0 0 220 200"/);
});

test('a callout at the edge of the capture widens the margin so it is not cut', () => {
  const svg = renderShot(base([{ kind: 'callout', n: 1, target: { x: 0, y: 20, width: 40, height: 20 } }]), 'en');
  const cx = Number(/<circle cx="([\d.]+)"/.exec(svg)[1]);
  assert.ok(cx - 10 >= 0, `the callout at ${cx} is cut`);
});

test('focus is one evenodd path with a hole per target', () => {
  const svg = renderShot(
    base([{ kind: 'focus', target: [{ x: 10, y: 10, width: 20, height: 20 }, { x: 50, y: 50, width: 20, height: 20 }] }]),
    'en',
  );
  // A mask: overlapping holes stay clear, where an even-odd path would dim them again.
  assert.match(svg, /<mask id="test-01-sample-focus"><path fill="#fff" d="M4 4H216V116H4z"\/><path fill="#000" d="M17 17H43V43H17zM57 57H83V83H57z"\/><\/mask>/);
  assert.match(svg, /mask="url\(#test-01-sample-focus\)" fill="#0b0d11" fill-opacity="0.62" d="M4 4H216V116H4z"/);
});

test('specs that would mislead fail', () => {
  const at = { x: 10, y: 10, width: 20, height: 10 };
  assert.throws(() => renderShot(base([{ kind: 'callout', n: 1, target: at }, { kind: 'callout', n: 1, target: at }]), 'en'), /already a callout 1/);
  assert.throws(() => renderShot(base([], { languages: ['../../x'] }), '../../x'), /language tags/);
  assert.throws(() => renderShot(base([], { languages: [] }), 'en'), /language tags/);
  assert.throws(() => renderShot(base([{ kind: 'keys', keys: ['A very long key name that cannot fit'] }]), 'en'), /does not fit/);
});

test('crop shows a part of the capture through a nested viewBox', () => {
  const svg = renderShot(base([], { crop: { x: 50, y: 20, width: 100, height: 60 } }), 'en');
  assert.match(svg, /<svg x="10" y="10" width="100" height="60" viewBox="50 20 100 60" preserveAspectRatio="none"><image width="200" height="100"/);
  assert.throws(() => renderShot(base([{ kind: 'box', target: { x: 90, y: 10, width: 20, height: 10 } }], { crop: { x: 50, y: 20, width: 100, height: 60 } }), 'en'), /not in the capture/);
});

test('targets and images may differ per language', () => {
  const spec = base([
    {
      kind: 'box',
      target: { en: { x: 10, y: 10, width: 20, height: 10 }, 'zh-Hans': { x: 60, y: 10, width: 20, height: 10 }, 'zh-Hant': { x: 60, y: 10, width: 20, height: 10 } },
    },
  ], { image: { en: IMAGE, 'zh-Hans': png(300, 200), 'zh-Hant': png(300, 200) } });
  assert.match(renderShot(spec, 'en'), /<rect x="16" y="18"/);
  const zh = renderShot(spec, 'zh-Hans');
  assert.match(zh, /<rect x="66" y="18"/);
  assert.match(zh, /width="170"/);
});

test('the android frame has a bezel and a camera, the windows frame neither', () => {
  const android = renderShot(base([], { frame: 'android' }), 'en');
  assert.match(android, /<circle cx="28" cy="74" r="4.5"/);
  assert.match(android, /width="292" height="148"/);
  const none = renderShot(base([], { frame: 'none' }), 'en');
  assert.ok(!none.includes('filter'));
});

test('it fails loudly', () => {
  assert.throws(() => renderShot(base([{ kind: 'box', target: { x: 190, y: 10, width: 20, height: 10 } }]), 'en'), /not in the capture/);
  assert.throws(() => renderShot(base([{ kind: 'arrow', target: { x: 1, y: 1, width: 2, height: 2 }, label: { en: 'Hi' } }]), 'zh-Hans'), /no text for "zh-Hans"/);
  assert.throws(() => renderShot(base([{ kind: 'arrow', target: { x: 1, y: 1, width: 2, height: 2 }, label: 'Hi' }]), 'en'), /per language/);
  assert.throws(() => renderShot(base([{ kind: 'circle', target: { x: 1, y: 1, width: 2, height: 2 } }]), 'en'), /kind must be/);
  assert.throws(() => renderShot(base([], { name: 'Bad Name' }), 'en'), /<topic>-<nn>-<what>/);
  assert.throws(() => renderShot(base([], { image: png(500, 400, true), scale: 1 }), 'en'), /more than 600 KB/);
});

test('writeShots writes one file per language and touches nothing that would not change', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'shots-'));
  try {
    const spec = base([{ kind: 'box', target: { x: 10, y: 10, width: 20, height: 10 } }]);
    const first = await writeShots(spec, dir);
    assert.deepEqual(first.map((r) => [r.lang, r.changed]), [['en', true], ['zh-Hans', true], ['zh-Hant', true]]);
    const file = path.join(dir, 'zh-Hant', 'test-01-sample.svg');
    const before = statSync(file).mtimeMs;
    const second = await writeShots(spec, dir);
    assert.ok(second.every((r) => !r.changed));
    assert.equal(statSync(file).mtimeMs, before);
    assert.equal(readFileSync(file, 'utf8'), renderShot(spec, 'zh-Hant'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('assertDesensitized catches the user, the home directory, e-mail addresses and extra strings', () => {
  assert.doesNotThrow(() => assertDesensitized('Survival · D:\\LeviLauncher\\instances\\Survival'));
  assert.doesNotThrow(() => assertDesensitized('assets/icon@2x.png, logo@3x.webp'));
  const home = os.homedir();
  assert.throws(() => assertDesensitized(`Saved to ${home}\\Documents`), /home directory|user name/);
  assert.throws(() => assertDesensitized(`Saved to ${home.replaceAll('\\', '/')}/Documents`), /home directory|user name/);
  const user = os.userInfo().username;
  if (user.length >= 3) assert.throws(() => assertDesensitized(`Signed in as ${user.toUpperCase()}`), /user name/);
  assert.throws(() => assertDesensitized('Contact: someone@example.com'), /e-mail/);
  assert.throws(() => assertDesensitized('Xbox: RealGamer42', ['realgamer42']), /RealGamer42|realgamer42/);
});
