// Content per platform (docs/shared/platform.ts): platform tabs, hero actions and badges.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectPlatform, platformOfLabel, preferredPlatform, PLATFORM_STORAGE_KEY } from '../docs/shared/platform.ts';
import { renderMarkdown } from '../docs/node/markdown/render.ts';

test('platformOfLabel: one platform named in the label', () => {
  assert.equal(platformOfLabel('Windows'), 'windows');
  assert.equal(platformOfLabel('Android 版'), 'android');
  assert.equal(platformOfLabel('iPadOS'), 'ios');
  assert.equal(platformOfLabel('macOS'), 'macos');
  assert.equal(platformOfLabel('Linux (x64)'), 'linux');
  assert.equal(platformOfLabel('C++'), undefined);
  assert.equal(platformOfLabel('Windows / Android'), undefined); // two platforms: neither
  assert.equal(platformOfLabel('Windowsill'), undefined);
});

const UA = {
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  linux: 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
};

/** Run `fn` with a fake navigator (and localStorage holding `stored`, when given). */
function withBrowser({ userAgent = '', maxTouchPoints = 0, stored } = {}, fn) {
  const saved = ['navigator', 'localStorage'].map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]);
  const store = new Map(stored ? [[PLATFORM_STORAGE_KEY, stored]] : []);
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent, maxTouchPoints }, configurable: true });
  Object.defineProperty(globalThis, 'localStorage', { value: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) }, configurable: true });
  try {
    return fn();
  } finally {
    for (const [k, d] of saved) {
      if (d) Object.defineProperty(globalThis, k, d);
      else delete globalThis[k];
    }
  }
}

test('detectPlatform: user agents', () => {
  const at = (userAgent, maxTouchPoints = 0) => withBrowser({ userAgent, maxTouchPoints }, detectPlatform);
  assert.equal(at(UA.windows), 'windows');
  assert.equal(at(UA.android), 'android');
  assert.equal(at(UA.iphone), 'ios');
  assert.equal(at(UA.mac), 'macos');
  assert.equal(at(UA.mac, 5), 'ios'); // iPadOS 13+ asks for the desktop site
  assert.equal(at(UA.linux), 'linux');
  assert.equal(at(''), undefined);
});

test('preferredPlatform: ?platform= > earlier choice > device', () => {
  assert.equal(withBrowser({ userAgent: UA.windows }, () => preferredPlatform('')), 'windows');
  assert.equal(withBrowser({ userAgent: UA.windows, stored: 'android' }, () => preferredPlatform('')), 'android');
  assert.equal(withBrowser({ userAgent: UA.windows, stored: 'android' }, () => preferredPlatform('?platform=Linux')), 'linux');
  assert.equal(withBrowser({ userAgent: UA.windows, stored: 'nope' }, () => preferredPlatform('?platform=nope')), 'windows');
});

const OPTS = {
  compat: 'commonmark',
  slug: 'vitepress',
  lineNumbers: false,
  codeTitle: 'none',
  languageAlias: {},
  admonitionTitles: 'vitepress',
  containers: { vitepress: true, mkdocs: true },
  outline: [2, 3],
  styles: {},
  strings: { copyCode: 'Copy', copied: 'Copied', footnotes: 'Footnotes', backToRef: 'Back' },
  resolveLink: () => null,
};

test('render: platform tabs, <Badge> and frontmatter platforms', async () => {
  const src = [
    '---',
    'platforms: [android]',
    '---',
    '# Accounts',
    '',
    '## Quick Launch <Badge platform="android" />',
    '',
    '## Beta <Badge type="warning" text="beta" />',
    '',
    '=== "Windows"',
    '',
    '    a',
    '',
    '=== "Android"',
    '',
    '    b',
  ].join('\n');
  const r = await renderMarkdown(src, OPTS);
  assert.match(r.html, /<h1 id="accounts">Accounts.*<\/h1><p class="kit-page-platforms"><span class="kit-badge kit-badge-grass" data-kit-badge="" data-platform="android">Android<\/span><\/p>/s);
  // badges are not part of heading ids or the TOC
  assert.deepEqual(r.toc.map((x) => x.id), ['quick-launch', 'beta']);
  assert.match(r.html, /<span class="kit-badge kit-badge-gold" data-kit-badge="">beta<\/span>/);
  assert.match(r.html, /role="tab"[^>]*data-platform="windows"/);
  assert.match(r.html, /role="tab"[^>]*data-platform="android"/);
});
