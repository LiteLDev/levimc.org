// Unit tests for the language-first URLs of the docs engine (kit 2.23, `i18n.localeFirst`): route path ↔ URL
// (docs/shared/routing.ts) and the resolved config. The built demo (kit/demo, `npm run build`) checks the output.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localeFromPath, localeRoot, pathUrl, siteRoots, sitePath } from '../docs/shared/routing.ts';
import { resolveConfig } from '../docs/node/config.ts';

const locales = [
  { code: 'en', prefix: '' },
  { code: 'zh-Hans', prefix: 'zh-Hans/' },
  { code: 'zh-Hant', prefix: 'zh-Hant/' },
];
const FIRST = { base: '/LeviLamina/', locales, localeFirst: true, defaultLocale: 'en' };
const AFTER = { base: '/LeviLamina/', locales, defaultLocale: 'en' };

test('pathUrl: the locale prefix in front of base with localeFirst, after it otherwise', () => {
  assert.equal(pathUrl(FIRST, ''), '/LeviLamina/');
  assert.equal(pathUrl(FIRST, 'guide/x/'), '/LeviLamina/guide/x/');
  assert.equal(pathUrl(FIRST, 'zh-Hans/'), '/zh-Hans/LeviLamina/');
  assert.equal(pathUrl(FIRST, 'zh-Hant/guide/x.html'), '/zh-Hant/LeviLamina/guide/x.html');
  // assets and the API reference name no locale: they stay under base
  assert.equal(pathUrl(FIRST, 'assets/app.js'), '/LeviLamina/assets/app.js');
  assert.equal(pathUrl(AFTER, 'zh-Hans/guide/'), '/LeviLamina/zh-Hans/guide/');
  assert.equal(localeRoot(FIRST, 'zh-Hans/'), '/zh-Hans/LeviLamina/');
  assert.equal(localeRoot(AFTER, 'zh-Hans/'), '/LeviLamina/zh-Hans/');
  assert.deepEqual(siteRoots(FIRST), ['/LeviLamina/', '/zh-Hans/LeviLamina/', '/zh-Hant/LeviLamina/']);
  assert.deepEqual(siteRoots(AFTER), ['/LeviLamina/']);
});

test('sitePath: the inverse of pathUrl; the former (base-relative) locale URLs are no pages', () => {
  for (const p of ['', 'guide/x/', 'zh-Hans/', 'zh-Hans/guide/x/', 'zh-Hant/a.html']) assert.equal(sitePath(FIRST, pathUrl(FIRST, p)), p);
  assert.equal(sitePath(FIRST, '/zh-Hans/LeviLamina'), 'zh-Hans/');
  assert.equal(sitePath(FIRST, '/LeviLamina'), '');
  assert.equal(sitePath(FIRST, '/LeviLamina/zh-Hans/guide/'), null, 'a redirect page (formerPrefixes)');
  assert.equal(sitePath(FIRST, '/zh-Hans/about/'), null, "another site's page");
  assert.equal(sitePath(FIRST, '/zh-Hans/LeviLamina/%E4%B8%AD/'), 'zh-Hans/中/');
  assert.equal(sitePath(AFTER, '/LeviLamina/zh-Hans/guide/'), 'zh-Hans/guide/');
  assert.equal(sitePath(AFTER, '/zh-Hans/LeviLamina/guide/'), null);
  assert.equal(localeFromPath(FIRST, sitePath(FIRST, '/zh-Hant/LeviLamina/missing/')), 'zh-Hant');
});

test('resolveConfig: localeFirst puts base\'s own files in its folder of outDir (the host root)', () => {
  const cfg = resolveConfig(
    { base: '/LeviLamina/', title: 'T', contentDir: 'content', i18n: { mode: 'folder', defaultLocale: 'en', localeFirst: true, locales: [{ code: 'en', label: 'English', prefix: '' }, { code: 'zh-Hans', label: '简体中文', formerPrefixes: ['zh-Hans', 'zh/'] }] } },
    '/site',
  );
  assert.equal(cfg.localeFirst, true);
  assert.equal(cfg.outRoot.replace(/\\/g, '/').replace(/^[A-Z]:/, ''), '/site/dist');
  assert.equal(cfg.baseOutRoot.replace(/\\/g, '/').replace(/^[A-Z]:/, ''), '/site/dist/LeviLamina');
  assert.deepEqual(cfg.locales[1].formerPrefixes, ['zh-Hans/', 'zh/']);
  const plain = resolveConfig({ base: '/LeviLamina/', title: 'T', contentDir: 'content' }, '/site');
  assert.equal(plain.localeFirst, false);
  assert.equal(plain.baseOutRoot, plain.outRoot);
});
