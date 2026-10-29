// Device platform detection (docs/shared/platform.ts): platform tabs and hero actions pick the visitor's version.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectPlatform, platformOfLabel } from '../docs/shared/platform.ts';

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

function withNavigator(nav, fn) {
  const desc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true });
  try {
    return fn();
  } finally {
    if (desc) Object.defineProperty(globalThis, 'navigator', desc);
    else delete globalThis.navigator;
  }
}

test('detectPlatform: user agents', () => {
  const at = (userAgent, maxTouchPoints = 0) => withNavigator({ userAgent, maxTouchPoints }, detectPlatform);
  assert.equal(at(UA.windows), 'windows');
  assert.equal(at(UA.android), 'android');
  assert.equal(at(UA.iphone), 'ios');
  assert.equal(at(UA.mac), 'macos');
  assert.equal(at(UA.mac, 5), 'ios'); // iPadOS 13+ asks for the desktop site
  assert.equal(at(UA.linux), 'linux');
  assert.equal(at(''), undefined);
});
