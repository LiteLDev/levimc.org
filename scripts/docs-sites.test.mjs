// Tests for scripts/docs-sites.mjs (part of `npm test`): which docs roots the deploy builds, what levimc.org's link
// check treats as another site's, and the merge of each docs build into levimc.org's dist/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { docsRoots, externalProjects, mergeDist, otherSites } from './docs-sites.mjs';

function tree(files) {
  const dir = mkdtempSync(join(tmpdir(), 'docs-sites-'));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  return dir;
}

test('docs roots: the tutorials, the FAQ, then every docs/<name>/ with a package.json', () => {
  const repo = tree({ 'tutorials/package.json': '{}', 'faq/package.json': '{}', 'docs/lip/package.json': '{}', 'docs/LeviLamina/package.json': '{}', 'docs/README.md': '', 'docs/notes/x.md': '' });
  try {
    assert.deepEqual(docsRoots(repo), ['tutorials', 'faq', 'docs/LeviLamina', 'docs/lip']);
    assert.deepEqual(externalProjects(repo), ['LegacyScriptEngine', 'LeviLauncher', 'BeDD', 'bedboo']);
    const other = otherSites(repo);
    assert.ok(other.includes('/LeviLauncher/') && other.includes('/ja/LeviLauncher/') && other.includes('/zh-Hant/bedboo/'));
    assert.ok(!other.some((p) => p.includes('/lip/') || p.includes('/LeviLamina/')), 'built here: checked as internal');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
  const empty = tree({ 'tutorials/package.json': '{}' });
  try {
    assert.deepEqual(docsRoots(empty), ['tutorials'], 'no docs/ folder: the tutorials only');
    assert.equal(otherSites(empty).length, 6 * 9);
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }
});

test('merge: a docs build joins the site; its 404.html and .nojekyll are dropped; a clash fails before copying', () => {
  const site = tree({ 'index.html': 'site', '404.html': 'site 404', '.nojekyll': '', 'zh-Hans/index.html': 'zh' });
  const docs = tree({ '404.html': 'docs 404', '.nojekyll': '', 'Demo/index.html': 'demo', 'zh-Hans/Demo/index.html': 'demo zh', 'Demo/assets/a.js': 'js' });
  try {
    assert.equal(mergeDist(docs, site), 3);
    assert.equal(readFileSync(join(site, '404.html'), 'utf8'), 'site 404');
    assert.equal(readFileSync(join(site, 'zh-Hans/Demo/index.html'), 'utf8'), 'demo zh');
    assert.equal(readFileSync(join(site, 'zh-Hans/index.html'), 'utf8'), 'zh');
    const clash = tree({ 'Demo/index.html': 'other', 'Other/index.html': 'x' });
    try {
      assert.throws(() => mergeDist(clash, site), /1 file\(s\) exist .*Demo\/index\.html/);
      assert.throws(() => readFileSync(join(site, 'Other/index.html')), 'nothing copied');
    } finally {
      rmSync(clash, { recursive: true, force: true });
    }
  } finally {
    rmSync(site, { recursive: true, force: true });
    rmSync(docs, { recursive: true, force: true });
  }
});
