// Unit tests for localizeNetworkUrl (components/projects.ts): the bar's, Projects menu's and footer's levimc.org links
// in the reader's language, so the target's root never redirects (kit 2.22.2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localizeNetworkUrl as L } from '../components/projects.ts';

test('Chinese: zh-Hans / zh-Hant right after each build base, absolute or root-relative', () => {
  assert.equal(L('https://levimc.org/', 'zh-Hans'), 'https://levimc.org/zh-Hans/');
  assert.equal(L('https://levimc.org/about/', 'zh-CN'), 'https://levimc.org/zh-Hans/about/');
  assert.equal(L('https://levimc.org/mods/', 'zh-HK'), 'https://levimc.org/mods/zh-Hant/');
  assert.equal(L('https://levimc.org/mods/github.com/LiteLDev/LeviOptimize/', 'zh-Hant'), 'https://levimc.org/mods/zh-Hant/github.com/LiteLDev/LeviOptimize/');
  assert.equal(L('https://levimc.org/tutorials/', 'zh-TW'), 'https://levimc.org/tutorials/zh-Hant/');
  assert.equal(L('https://levimc.org/lip/', 'zh'), 'https://levimc.org/lip/zh-Hans/');
  assert.equal(L('/LeviLauncher/', 'zh-Hans'), '/LeviLauncher/zh-Hans/');
});
test('other languages only where the docs have them', () => {
  assert.equal(L('https://levimc.org/LeviLauncher/', 'de'), 'https://levimc.org/LeviLauncher/de-DE/');
  assert.equal(L('https://levimc.org/LeviLauncher/', 'ja-JP'), 'https://levimc.org/LeviLauncher/ja-JP/');
  assert.equal(L('https://levimc.org/lip/', 'de'), 'https://levimc.org/lip/');
  assert.equal(L('https://levimc.org/about/', 'fr'), 'https://levimc.org/about/');
});
test('unchanged: English, other origins, a language already named, paths without languages', () => {
  assert.equal(L('https://levimc.org/lip/', 'en'), 'https://levimc.org/lip/');
  assert.equal(L('https://levimc.org/lip/', undefined), 'https://levimc.org/lip/');
  assert.equal(L('https://github.com/LiteLDev', 'zh-Hans'), 'https://github.com/LiteLDev');
  assert.equal(L('https://levimc.org/zh-Hant/about/', 'zh-Hans'), 'https://levimc.org/zh-Hant/about/');
  assert.equal(L('https://levimc.org/LeviLauncher/es-ES/', 'de'), 'https://levimc.org/LeviLauncher/es-ES/');
  assert.equal(L('https://levimc.org/LeviLamina/api/', 'zh-Hans'), 'https://levimc.org/LeviLamina/api/');
});
