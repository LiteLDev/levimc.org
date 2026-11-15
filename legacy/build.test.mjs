// Tests for legacy/build.mjs (part of `npm test`).
// Add --live (node legacy/build.test.mjs --live) to also check every redirect target on the live site.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import {
  ASSET_BASE,
  NOJS_DARK_CSS,
  forwardScript,
  forwardTable,
  generate,
  globalBar,
  hashMode,
  legacyForward,
  legacyHash,
  legacyKey,
  patchNotFound,
  stubEntries,
  stubFile,
} from './build.mjs';
import { MOVED_SITES, ORIGIN, PROJECT_SITES } from './redirects.mjs';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = forwardTable();
const fwd = (path, hash = '', search = '') => legacyForward(path, search, hash, D);
const files = generate();
const html = [...files].filter(([f]) => f.endsWith('.html'));
// the Android native mod docs in LeviLamina's docs, and LeviLauncher's guide with the Android tab preselected
// (formerly docs.levimc.org/LeviLaunchroid/, now levimc.org/LeviLaunchroid/)
const L = `${ORIGIN}/LeviLamina/developer_guides/android/`;
const LZ = `${ORIGIN}/LeviLamina/zh/developer_guides/android/`;
const LH = `${ORIGIN}/LeviLamina/zh-Hant/developer_guides/android/`;
const G = `${ORIGIN}/LeviLauncher/guide/`;
const GZ = `${ORIGIN}/LeviLauncher/zh-CN/guide/`;
const GH = `${ORIGIN}/LeviLauncher/zh-HK/guide/`;
const QS = '?platform=android';
const LSE = `${ORIGIN}/LegacyScriptEngine/`;

/** Run a page's redirect script (the first inline <script> that calls location.replace) at `href`. */
function redirectOf(page, pathname, hash = '') {
  const script = [...page.matchAll(/<script>([^<]*location\.replace[\s\S]*?)<\/script>/g)][0];
  assert.ok(script, 'redirect script');
  let replaced = null;
  vm.runInNewContext(script[1], {
    location: { pathname, search: '', hash, href: `${ORIGIN}${pathname}${hash}`, replace: (u) => (replaced = u) },
    document: { documentElement: { style: {} } },
    setTimeout: () => {},
  });
  return replaced;
}

test('legacyKey normalises every URL form GitHub Pages served', () => {
  assert.equal(legacyKey(''), '');
  assert.equal(legacyKey('index'), '');
  assert.equal(legacyKey('index.html'), '');
  assert.equal(legacyKey('zh-CN/'), 'zh-cn');
  assert.equal(legacyKey('zh-CN/index.html'), 'zh-cn');
  assert.equal(legacyKey('api/hook'), 'api/hook');
  assert.equal(legacyKey('api/hook.html'), 'api/hook');
  assert.equal(legacyKey('api/hook/'), 'api/hook');
  assert.equal(legacyKey('api/hook/index.html'), 'api/hook');
  assert.equal(legacyKey('API/Hook.HTML'), 'api/hook');
  assert.equal(legacyKey('myindex'), 'myindex');
});

test('legacyHash drops, keeps or renames the old #anchor', () => {
  const map = hashMode({ functions: ['pl-hook', 'signatures'], 注意: ['注意事项'] });
  assert.deepEqual(map, { 'pl-hook': 'functions', signatures: 'functions', 注意事项: '注意' });
  assert.equal(legacyHash('#a', 0), '');
  assert.equal(legacyHash('#a', 1), '#a');
  assert.equal(legacyHash('', 1), '');
  assert.equal(legacyHash('', map), '');
  assert.equal(legacyHash('#pl-hook', map), '#functions');
  assert.equal(legacyHash('#purpose', map), '#purpose'); // survives on the new page: unchanged
  assert.equal(legacyHash('#%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9', map), '#注意'); // browsers percent-encode the hash
  assert.equal(legacyHash('#注意事项', map), '#注意');
  assert.equal(legacyHash('#%E0%A4%A', map), '#%E0%A4%A'); // malformed escape: kept as is
  assert.equal(legacyHash('#constructor', map), '#constructor');
  assert.equal(legacyHash('#', map), '#');
  assert.throws(() => hashMode({ a: ['x'], b: ['x'] }), /mapped twice/);
});

test('404 forwarding: preloader-android pages', () => {
  assert.equal(fwd('/preloader-android'), L);
  assert.equal(fwd('/preloader-android/'), L);
  assert.equal(fwd('/preloader-android/index.html', '#x'), `${L}#x`);
  assert.equal(fwd('/preloader-android/api/hook'), `${L}api/hook/`);
  assert.equal(fwd('/preloader-android/api/hook.html', '#pl_hook'), `${L}api/hook/#pl_hook`);
  assert.equal(fwd('/preloader-android/api/hook/'), `${L}api/hook/`);
  assert.equal(fwd('/Preloader-Android/API/hook'), `${L}api/hook/`);
  assert.equal(fwd('/preloader-android/zh-CN'), LZ);
  assert.equal(fwd('/preloader-android/zh-CN/'), LZ);
  assert.equal(fwd('/preloader-android/zh-CN/api/types-and-macros.html'), `${LZ}api/types_and_macros/`);
  // rewritten API pages: old section ids with an equivalent are renamed, ids that still exist are kept
  assert.equal(fwd('/preloader-android/api/hook', '#pl-hook'), `${L}api/hook/#functions`);
  assert.equal(fwd('/preloader-android/api/hook', '#common-mistakes'), `${L}api/hook/#common-mistakes`);
  assert.equal(fwd('/preloader-android/api/mod.html', '#headers'), `${L}api/mod/#header`);
  assert.equal(fwd('/preloader-android/zh-CN/api/hook', '#%E9%93%BE%E5%BC%8F-hook-%E8%A1%8C%E4%B8%BA'), `${LZ}api/hook/#类型`);
  // guide pages moved to a different page: the old #anchor is dropped
  assert.equal(fwd('/preloader-android/guide/getting-started', '#manifest-json'), L);
  assert.equal(fwd('/preloader-android/zh-CN/guide/compatibility.html', '#abi'), LZ);
  // aliases and fallbacks
  assert.equal(fwd('/preloader-android/api/'), `${L}api/mod/`);
  assert.equal(fwd('/preloader-android/api/', '#x'), `${L}api/mod/`);
  assert.equal(fwd('/preloader-android/zh-CN/guide'), LZ);
  assert.equal(fwd('/preloader-android/assets/app.123.js'), L);
  assert.equal(fwd('/preloader-android/zh-CN/nope/deeper'), LZ);
  assert.equal(fwd('/preloader-android/zh-cnx'), L);
  // query strings of the old site carried nothing
  assert.equal(fwd('/preloader-android/api/mod', '', '?q=1'), `${L}api/mod/`);
  // percent-encoded paths
  assert.equal(fwd('/preloader%2Dandroid/api/hook'), `${L}api/hook/`);
  // Object.prototype names are not pages
  assert.equal(fwd('/preloader-android/constructor'), L);
  assert.equal(fwd('/preloader-android/__proto__'), L);
  assert.equal(fwd('/preloader-android/zh-CN/hasOwnProperty'), LZ);
});

test('404 forwarding: LeviLaunchroid user pages go to LeviLauncher\'s guide, developer pages to LeviLamina\'s', () => {
  assert.equal(fwd('/LeviLaunchroid'), `${G}quick-start${QS}`);
  assert.equal(fwd('/LeviLaunchroid/'), `${G}quick-start${QS}`);
  assert.equal(fwd('/LeviLaunchroid/index.html', '#features'), `${G}quick-start${QS}`);
  assert.equal(fwd('/LeviLaunchroid/guide/features'), `${G}version-management${QS}`);
  assert.equal(fwd('/LeviLaunchroid/guide/compatibility', '#native-mods'), `${G}faq-community-feedback`);
  assert.equal(fwd('/LeviLaunchroid/privacy-policy'), `${ORIGIN}/LeviLauncher/privacy-policy`);
  assert.equal(fwd('/LeviLaunchroid/guide/developer', '#mod-menu'), `${L}#mod-menu`);
  assert.equal(fwd('/LeviLaunchroid/api/hook.html', '#signatures'), `${L}api/hook/#signatures`);
  assert.equal(fwd('/levilaunchroid/API/Mod-Menu'), `${L}api/mod_menu/`);
  assert.equal(fwd('/LeviLaunchroid/zh-CN/'), `${GZ}quick-start${QS}`);
  assert.equal(fwd('/LeviLaunchroid/zh-CN/api/types-and-macros'), `${LZ}api/types_and_macros/`);
  // zh-Hant became LeviLauncher's zh-HK and LeviLamina's zh-Hant
  assert.equal(fwd('/LeviLaunchroid/zh-Hant/'), `${GH}quick-start${QS}`);
  assert.equal(fwd('/LeviLaunchroid/zh-Hant/guide/build.html'), LH);
  assert.equal(fwd('/LeviLaunchroid/zh-Hant/api/patch'), `${LH}api/patch/`);
  // aliases and fallbacks
  assert.equal(fwd('/LeviLaunchroid/api/'), `${L}api/mod/`);
  assert.equal(fwd('/LeviLaunchroid/zh-Hant/guide'), `${GH}quick-start${QS}`);
  assert.equal(fwd('/LeviLaunchroid/assets/app.123.js'), `${G}quick-start${QS}`);
  assert.equal(fwd('/LeviLaunchroid/zh-CN/nope'), `${GZ}quick-start${QS}`);
});

test('404 forwarding: LiteXLoader (docsify) goes to the LegacyScriptEngine docs, without its #/ route', () => {
  assert.equal(fwd('/LiteXLoader'), LSE);
  assert.equal(fwd('/LiteXLoader/'), LSE);
  assert.equal(fwd('/LiteXLoader/', '#/zh_CN/Usage'), LSE);
  assert.equal(fwd('/LiteXLoader/index.html', '#/'), LSE);
  assert.equal(fwd('/litexloader/zh_CN/Usage.md'), LSE);
  assert.equal(fwd('/LiteXLoaderX/'), null);
});

test('404 forwarding: wrongly cased project paths, nothing else', () => {
  assert.equal(fwd('/levilamina/'), `${ORIGIN}/LeviLamina/`);
  assert.equal(fwd('/levilamina'), `${ORIGIN}/LeviLamina/`);
  assert.equal(fwd('/LIP/zh-CN/user-guide.html', '#a', '?x=1'), `${ORIGIN}/lip/zh-CN/user-guide.html?x=1#a`);
  assert.equal(fwd('/legacyscriptengine/apis/'), `${ORIGIN}/LegacyScriptEngine/apis/`);
  assert.equal(fwd('/bedd/'), `${ORIGIN}/BeDD/`);
  assert.equal(fwd('/BedBoo/x'), `${ORIGIN}/bedboo/x`);
  assert.deepEqual(PROJECT_SITES, ['LeviLamina', 'LegacyScriptEngine', 'lip', 'LeviLauncher', 'BeDD', 'bedboo']);
  for (const p of PROJECT_SITES) assert.equal(fwd(`/${p}/missing`), null, `${p} has the right case`);
  assert.equal(fwd('/'), null);
  assert.equal(fwd('/random/path'), null);
  assert.equal(fwd('/LiteLoader.NET/'), null);
  assert.equal(fwd('/preloader'), null);
  assert.equal(fwd('/_kit/kit.css'), null);
  // levimc.org's own pages are never forwarded
  for (const p of ['/about/', '/blog/nope/', '/mods/x/', '/community/', '/kit/v2/x'] ) assert.equal(fwd(p), null, p);
});

test('every old page and directory alias has a redirect page with canonical, meta refresh, location.replace and a visible link', () => {
  let stubs = 0;
  for (const site of MOVED_SITES) {
    for (const [from, to, lang, , hash] of stubEntries(site)) {
      const file = stubFile(site.from, from);
      const page = files.get(file);
      assert.ok(page, `missing ${file}`);
      stubs++;
      const url = ORIGIN + site.to + to;
      const old = site.from + from;
      assert.match(page, new RegExp(`^<!doctype html>\\n<html lang="${lang}">`));
      assert.ok(page.includes(`<link rel="canonical" href="${url}">`), file);
      assert.ok(page.includes(`<meta http-equiv="refresh" content="0; url=${url}">`), file);
      assert.ok(page.includes(`class="mc-btn mc-btn-primary" href="${url}"`), file);
      assert.ok(page.includes(`<h1 class="kit-static-title">`) && page.includes(`<a href="${url}">`), file);
      // the redirect comes before any stylesheet so it is not blocked by CSS
      assert.ok(page.indexOf('location.replace') < page.indexOf('rel="stylesheet"'), file);
      // and it treats the old #anchor like the 404 forwarder does
      const mode = hashMode(hash);
      assert.equal(redirectOf(page, old), url, file);
      assert.equal(redirectOf(page, old, '#zz'), url + legacyHash('#zz', mode), file);
      if (typeof mode === 'object') for (const [oldId, newId] of Object.entries(mode)) assert.equal(redirectOf(page, old, `#${encodeURIComponent(oldId)}`), `${url}#${newId}`, `${file}#${oldId}`);
      // the 404 forwards the other forms of the same old URL to the same target
      assert.equal(fwd(old), url, old);
      assert.equal(fwd(old, '#zz'), url + legacyHash('#zz', mode), `${old}#zz`);
      if (from && !from.endsWith('/')) assert.equal(fwd(`${old}.html`), url, `${old}.html`);
      if (from.endsWith('/') && from) assert.equal(fwd(old.slice(0, -1)), url, old.slice(0, -1));
    }
  }
  assert.equal(stubs, 22 + 4 + 1 + 46 + 6);
  assert.equal([...files.keys()].filter((f) => f.endsWith('.html') && f.startsWith('preloader-android/')).length, 26);
  for (const dir of ['api', 'guide', 'zh-CN/api', 'zh-CN/guide']) assert.ok(files.has(`preloader-android/${dir}/index.html`), `${dir}/ answers 200`);
  assert.ok(files.has('LiteXLoader/index.html'));
  assert.equal([...files.keys()].filter((f) => f.endsWith('.html') && f.startsWith('LeviLaunchroid/')).length, 52);
  for (const dir of ['api', 'guide', 'zh-CN/api', 'zh-CN/guide', 'zh-Hant/api', 'zh-Hant/guide']) assert.ok(files.has(`LeviLaunchroid/${dir}/index.html`), `${dir}/ answers 200`);
});

test('the old site\'s files are published verbatim', () => {
  const icon = files.get('preloader-android/appicon.png');
  assert.ok(Buffer.isBuffer(icon));
  // docs/public/appicon.png of LiteLDev/preloader-android@a29b5a6702 (= LeviLaunchroid's appicon.png)
  assert.equal(createHash('sha256').update(icon).digest('hex'), 'cffec87041c9e91fb640029d5f3bf032dd081bced928dd5547bd13db09912438');
  // docs/public/appicon.png of LiteLDev/LeviLaunchroid, the same image
  assert.deepEqual(files.get('LeviLaunchroid/appicon.png'), icon);
});

test('404.html runs the forwarding map before rendering', () => {
  // the shape of the site's prerendered 404.html (index.html: <meta charset="UTF-8" />, then the stylesheets)
  const site404 = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="/assets/x.css">
    <meta name="robots" content="noindex">
  </head>
</html>
`;
  const page = patchNotFound(site404);
  assert.ok(page.includes(forwardScript()));
  assert.throws(() => patchNotFound(page), /already/);
  assert.throws(() => patchNotFound('<html><head></head></html>'), /charset/);
  const script = /<script>(\(function\(\)\{function legacyKey[\s\S]*?)<\/script>/.exec(page);
  assert.ok(script, 'forward script present');
  assert.ok(page.indexOf(script[0]) < page.indexOf('rel="stylesheet"'), 'before CSS');
  const run = (pathname, hash = '') => {
    let replaced = null;
    const style = {};
    vm.runInNewContext(script[1], {
      location: { pathname, search: '', hash, href: `${ORIGIN}${pathname}${hash}`, replace: (u) => (replaced = u) },
      document: { documentElement: { style } },
      setTimeout: () => {},
    });
    return { replaced, hidden: style.visibility === 'hidden' };
  };
  assert.deepEqual(run('/preloader-android/zh-CN/api/hook.html', '#x'), { replaced: `${LZ}api/hook/#x`, hidden: true });
  assert.deepEqual(run('/preloader-android/api/signature', '#c-batch-example'), { replaced: `${L}api/signature/#example`, hidden: true });
  assert.deepEqual(run('/LiteXLoader/', '#/zh_CN/Usage'), { replaced: LSE, hidden: true });
  assert.deepEqual(run('/Levilauncher/'), { replaced: `${ORIGIN}/LeviLauncher/`, hidden: true });
  assert.deepEqual(run('/does-not-exist'), { replaced: null, hidden: false });
});

test('every page: the kit chrome — skip link, no-JS dark theme, generator, footer year, Mods and Blog links', () => {
  for (const [f, page] of html) {
    const lang = /<html lang="([^"]+)">/.exec(page)[1];
    const skip = lang.startsWith('zh-') ? '跳到正文' : 'Skip to content'; // zh-CN and zh-HK (old zh-Hant pages)
    assert.ok(page.includes(`<body>\n  <a class="kit-skip-link" href="#kit-main" data-kit-t="skipToContent">${skip}</a>\n`), `${f}: skip link first in <body>`);
    assert.ok(page.includes('<main id="kit-main"'), `${f}: skip link target`);
    assert.ok(page.includes(`<noscript><link rel="stylesheet" href="${ASSET_BASE}${NOJS_DARK_CSS}" media="(prefers-color-scheme: dark)"></noscript>`), f);
    assert.ok(page.indexOf(NOJS_DARK_CSS) > page.indexOf(`${ASSET_BASE}kit.css`), `${f}: after kit.css`);
    assert.match(page, /<meta name="generator" content="levimc-kit \d+\.\d+\.\d+[^"]*">/, `${f}: generator`);
    assert.match(page, /<span>© <span data-kit-year="">\d{4}<\/span> LeviMC<\/span>/, f);
    // the GlobalBar: canonical tabs, Mods label, the blog on levimc.org, language + theme menus, GitHub
    const mods = { 'zh-CN': '模组', 'zh-HK': '模組' }[lang] ?? 'Mods';
    assert.ok(page.includes(`<a class="kit-gbar-link" href="https://levimc.org/mods/"><span data-kit-t="mods">${mods}</span></a>`), `${f}: Mods tab`);
    assert.ok(page.includes('<a class="kit-gbar-link" href="https://levimc.org/blog/">'), `${f}: Blog tab`);
    assert.ok(!page.includes('blog.levimc.org'), `${f}: blog.levimc.org`);
    for (const hook of ['data-kit-locale-switcher', 'data-kit-theme-toggle', 'data-kit-theme-value="auto"', 'data-kit-lang-value="zh-HK"', 'kit-gbar-github'])
      assert.ok(page.includes(hook), `${f}: ${hook}`);
    assert.ok(!page.includes('>Packages<') && !page.includes('>包<'), `${f}: old Packages label`);
  }
});

test('kit.js (from kit/static) runs the menus, the cross-site preferences and the footer year', () => {
  const js = files.get('_kit/kit.js').toString();
  assert.equal(js, readFileSync(join(repo, 'kit/static/kit.js'), 'utf8'));
  for (const needle of ['levimc_theme', 'levimc_lang', 'Domain=levimc.org', '[data-kit-year]', '[data-kit-theme-value]', '[data-kit-lang-value]']) assert.ok(js.includes(needle), needle);
});

test('kit-nojs-dark.css is the kit\'s (kit.css\'s .dark rules as :root rules)', () => {
  const css = files.get(`_kit/${NOJS_DARK_CSS}`);
  assert.equal(css.toString(), readFileSync(join(repo, 'kit/static', NOJS_DARK_CSS), 'utf8'));
  assert.ok(css.toString().includes('--color-canvas:#0f1b26'), 'dark tokens');
  assert.ok(!/\.dark(?![\w-])/.test(css.toString().replace(/^\/\*[^\n]*\*\/\n/, '')), 'no .dark selector left');
});

test('kit assets: every /_kit/ reference is published, nothing else', () => {
  const refs = new Set();
  for (const [, body] of html) for (const m of body.matchAll(/\/_kit\/([^"')\s?#]+)/g)) refs.add(`_kit/${m[1]}`);
  const published = [...files.keys()].filter((f) => f.startsWith('_kit/'));
  assert.deepEqual(published.sort(), [...refs].sort());
  for (const f of ['_kit/kit.css', '_kit/kit.js', '_kit/levimc.svg', '_kit/icons/pickaxe.svg', `_kit/${NOJS_DARK_CSS}`]) assert.ok(files.has(f), f);
  assert.equal(ASSET_BASE, '/_kit/');
  for (const [f, body] of html) assert.ok(!body.includes('/levimc-kit/'), f);
});

test('static GlobalBar reproduces the kit rendering for the Projects tab', () => {
  const kit404 = readFileSync(join(repo, 'kit/static/pages/404.html'), 'utf8');
  assert.ok(kit404.includes(globalBar('en')), 'en GlobalBar with aria-current on Projects matches kit/static/pages/404.html');
  const zh = globalBar('zh-CN', 'LeviLauncher');
  // Projects in the bar and in the phone menu + LeviLauncher in both Projects lists
  assert.equal(zh.match(/aria-current="page"/g).length, 4);
});

test('CLI rejects a missing <dist>', () => {
  assert.throws(() => execFileSync(process.execPath, [join(repo, 'legacy/build.mjs')], { stdio: 'pipe' }), (e) => e.status === 2);
});

test('live: every redirect target answers 200 with no redirect and has every mapped heading id', { skip: !process.argv.includes('--live') && !process.env.LIVE }, () => {
  const targets = new Map();
  const need = (url, ids = []) => targets.set(url, [...(targets.get(url) ?? []), ...ids]);
  for (const site of MOVED_SITES) {
    for (const [, to, , , hash] of site.pages) need(ORIGIN + site.to + to, hash && hash !== true ? Object.keys(hash) : []);
    for (const [, to] of site.aliases ?? []) need(ORIGIN + site.to + to);
    for (const [, to] of site.fallbacks ?? []) need(ORIGIN + site.to + to);
  }
  for (const p of PROJECT_SITES) need(`${ORIGIN}/${p}/`);
  for (const [url, ids] of targets) {
    const out = execFileSync('curl', ['-s', '-o', '/dev/null', '--max-time', '30', '-w', '%{http_code} %{num_redirects} %{redirect_url}', url], { encoding: 'utf8' });
    assert.equal(out.trim(), '200 0', url);
    if (!ids.length) continue;
    const page = execFileSync('curl', ['-s', '--max-time', '30', url], { encoding: 'utf8' });
    for (const id of ids) assert.ok(page.includes(`id="${id}"`), `${url}#${id}`);
  }
});
