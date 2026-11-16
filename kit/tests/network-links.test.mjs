// Unit tests for localizeNetworkUrl (components/projects.ts): the bar's, Projects menu's and footer's levimc.org links
// in the reader's language, so the target's root never redirects (kit 2.22.2; the language first since kit 2.23).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localizeNetworkUrl as L, NETWORK_LANGUAGE_SEGMENTS } from '../components/projects.ts';

test('Chinese: zh-Hans / zh-Hant first in the path on every LeviMC site, absolute or root-relative', () => {
  assert.equal(L('https://levimc.org/', 'zh-Hans'), 'https://levimc.org/zh-Hans/');
  assert.equal(L('https://levimc.org/about/', 'zh-CN'), 'https://levimc.org/zh-Hans/about/');
  assert.equal(L('https://levimc.org/mods/', 'zh-HK'), 'https://levimc.org/zh-Hant/mods/');
  assert.equal(L('https://levimc.org/mods/github.com/LiteLDev/LeviOptimize/', 'zh-Hant'), 'https://levimc.org/zh-Hant/mods/github.com/LiteLDev/LeviOptimize/');
  assert.equal(L('https://levimc.org/tutorials/', 'zh-TW'), 'https://levimc.org/zh-Hant/tutorials/');
  assert.equal(L('https://levimc.org/lip/', 'zh'), 'https://levimc.org/zh-Hans/lip/');
  assert.equal(L('/LeviLauncher/', 'zh-Hans'), '/zh-Hans/LeviLauncher/');
  assert.equal(L('/LeviLamina/user_guides/install/', 'zh-Hans'), '/zh-Hans/LeviLamina/user_guides/install/');
});
test('other languages only where the docs have them, by their short code', () => {
  assert.equal(L('https://levimc.org/LeviLauncher/', 'de'), 'https://levimc.org/de/LeviLauncher/');
  assert.equal(L('https://levimc.org/LeviLauncher/', 'ja-JP'), 'https://levimc.org/ja/LeviLauncher/');
  assert.equal(L('https://levimc.org/LeviLauncher/', 'es-419'), 'https://levimc.org/es/LeviLauncher/');
  assert.equal(L('https://levimc.org/lip/', 'de'), 'https://levimc.org/lip/');
  assert.equal(L('https://levimc.org/about/', 'fr'), 'https://levimc.org/about/');
  assert.deepEqual([...NETWORK_LANGUAGE_SEGMENTS].sort(), ['de', 'es', 'fr', 'ja', 'ko', 'ru', 'zh-Hans', 'zh-Hant']);
});
test('unchanged: English, other origins, a language already named, paths without languages', () => {
  assert.equal(L('https://levimc.org/lip/', 'en'), 'https://levimc.org/lip/');
  assert.equal(L('https://levimc.org/lip/', undefined), 'https://levimc.org/lip/');
  assert.equal(L('https://github.com/LiteLDev', 'zh-Hans'), 'https://github.com/LiteLDev');
  assert.equal(L('https://levimc.org/zh-Hant/about/', 'zh-Hans'), 'https://levimc.org/zh-Hant/about/');
  assert.equal(L('https://levimc.org/es/LeviLauncher/', 'de'), 'https://levimc.org/es/LeviLauncher/');
  assert.equal(L('https://levimc.org/LeviLamina/api/', 'zh-Hans'), 'https://levimc.org/LeviLamina/api/');
  // the URLs before kit 2.23 (the language after the base) name a language too: left to their redirect pages
  assert.equal(L('https://levimc.org/LeviLauncher/es-ES/', 'de'), 'https://levimc.org/LeviLauncher/es-ES/');
  assert.equal(L('/mods/zh-Hans/', 'zh-Hant'), '/mods/zh-Hans/');
  assert.equal(L('/tutorials/zh-Hans/server/first-server/', 'zh-Hans'), '/tutorials/zh-Hans/server/first-server/');
});
