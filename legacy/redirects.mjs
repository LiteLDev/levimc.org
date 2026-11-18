// Legacy documentation URLs that levimc.org forwards (moved here from LiteLDev/liteldev.github.io, which served
// them under docs.levimc.org before the project docs moved to levimc.org/<Repo>/).
//
// GitHub Pages serves this repository (the organisation site) for every path of levimc.org that no project
// repository with Pages owns (project repos own /<Repo>/). legacy/build.mjs turns this table into
//   * a real redirect page for every old URL (dist/<from>/…, meta refresh + location.replace + canonical), and
//   * the forwarding map that dist/404.html runs before rendering (old URL variants, aliases, wrong case).
//
// All targets are canonical, redirect-free URLs (answer 200 directly); `node legacy/build.test.mjs --live`
// verifies them, and every mapped heading id, against the live site. Since 2026-11-16 the targets are the
// language-first URLs (/zh-Hans/LeviLamina/…, MIGRATION.md): until a project's docs are built here (docs/<Project>/),
// the 404 forwards its language-first URLs to where its own repository still publishes them (LANGUAGE_SEGMENTS).

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DOCS_PROJECTS, NETWORK_LANGUAGE_SEGMENTS } from '../kit/components/projects.ts';

export const ORIGIN = 'https://levimc.org';

/**
 * Documentation sites that moved. `pages` lists every page the old site published (VitePress `cleanUrls`:
 * `api/hook` was served from `api/hook.html`; `''` and `zh-CN/` are the locale home pages):
 *   [old page, new page, lang, title of the new page, hash]
 * `hash` says what happens to the old #anchor:
 *   false                    dropped (the new page is a different page);
 *   true                     forwarded unchanged;
 *   { newId: [oldId, …] }    forwarded, and the listed old ids are renamed to the new page's id. The old
 *                            pages were rewritten, so most old headings no longer exist: the map covers the
 *                            sections that have an equivalent on the new page; any other #anchor is forwarded
 *                            unchanged and lands at the top of the page.
 * `aliases` are extra old paths (never published, but obvious guesses): directories get a redirect page too
 * (GitHub Pages answers `/x` with a 301 to `/x/` for every directory), everything else only the 404 forwards.
 * `files` are published verbatim from legacy/<site>/ (files the old site served, e.g. images hot-linked from
 * elsewhere), so they keep answering 200 with the same bytes.
 * `fallbacks` send anything else under the old site to the matching locale's home (first matching prefix).
 * Targets are relative to `to`; `project` marks that project in the redirect pages' Projects menu.
 */
export const MOVED_SITES = [
  {
    // LiteLDev/LeviLaunchroid docs/ (levimc-kit, base /LeviLaunchroid/, cleanUrls; locales: root = English,
    // zh-CN/, zh-Hant/ converted from zh-CN). LeviLauncher is one name for the Windows and the Android launcher: the
    // user pages became part of LeviLauncher's one guide (Windows / Android tabs; ?platform=android preselects the
    // Android tab), the developer pages (native mods, Preloader API) moved to LeviLamina's docs
    // (developer_guides/android/, unchanged, so their #anchors are kept). zh-Hant → LeviLauncher's zh-HK and
    // LeviLamina's zh-Hant. Pages on LeviLaunchroid is disabled, so these paths reach this site.
    from: '/LeviLaunchroid/',
    to: '/',
    oldName: 'LeviLauncher for Android',
    newName: 'LeviLauncher',
    pages: [
      ['', 'LeviLauncher/guide/quick-start?platform=android', 'en', 'Get Started in 5 Minutes', false],
      ['guide/getting-started', 'LeviLauncher/guide/quick-start?platform=android', 'en', 'Get Started in 5 Minutes', false],
      ['guide/features', 'LeviLauncher/guide/version-management?platform=android', 'en', 'Version Management', false],
      ['guide/compatibility', 'LeviLauncher/guide/faq-community-feedback', 'en', 'FAQ, Community & Feedback', false],
      ['guide/developer', 'LeviLamina/developer_guides/android/', 'en', 'Native Mod Quick Start', true],
      ['guide/build', 'LeviLamina/developer_guides/android/', 'en', 'Native Mod Quick Start', false],
      ['api/mod', 'LeviLamina/developer_guides/android/api/mod/', 'en', 'Mod API', true],
      ['api/mod-menu', 'LeviLamina/developer_guides/android/api/mod_menu/', 'en', 'Mod Menu API', true],
      ['api/config', 'LeviLamina/developer_guides/android/api/config/', 'en', 'Config API', true],
      ['api/input', 'LeviLamina/developer_guides/android/api/input/', 'en', 'Input API', true],
      ['api/hook', 'LeviLamina/developer_guides/android/api/hook/', 'en', 'Hook API', true],
      ['api/signature', 'LeviLamina/developer_guides/android/api/signature/', 'en', 'Signature API', true],
      ['api/patch', 'LeviLamina/developer_guides/android/api/patch/', 'en', 'Patch API', true],
      ['api/memory-hook-macros', 'LeviLamina/developer_guides/android/api/memory_hook_macros/', 'en', 'Memory Hook Example', true],
      ['api/types-and-macros', 'LeviLamina/developer_guides/android/api/types_and_macros/', 'en', 'SDK Headers and Macros', { pl_export: ['pl-export'], pl_register_mod: ['pl-register-mod'] }],
      ['privacy-policy', 'LeviLauncher/privacy-policy', 'en', 'Privacy Policy', true],
      ['zh-CN/', 'zh-Hans/LeviLauncher/guide/quick-start?platform=android', 'zh-CN', '5 分钟上手', false],
      ['zh-CN/guide/getting-started', 'zh-Hans/LeviLauncher/guide/quick-start?platform=android', 'zh-CN', '5 分钟上手', false],
      ['zh-CN/guide/features', 'zh-Hans/LeviLauncher/guide/version-management?platform=android', 'zh-CN', '版本管理', false],
      ['zh-CN/guide/compatibility', 'zh-Hans/LeviLauncher/guide/faq-community-feedback', 'zh-CN', '常见问题、社区与反馈', false],
      ['zh-CN/guide/developer', 'zh-Hans/LeviLamina/developer_guides/android/', 'zh-CN', '原生模组快速开始', true],
      ['zh-CN/guide/build', 'zh-Hans/LeviLamina/developer_guides/android/', 'zh-CN', '原生模组快速开始', false],
      ['zh-CN/api/mod', 'zh-Hans/LeviLamina/developer_guides/android/api/mod/', 'zh-CN', 'Mod API', true],
      ['zh-CN/api/mod-menu', 'zh-Hans/LeviLamina/developer_guides/android/api/mod_menu/', 'zh-CN', 'Mod Menu API', true],
      ['zh-CN/api/config', 'zh-Hans/LeviLamina/developer_guides/android/api/config/', 'zh-CN', 'Config API', true],
      ['zh-CN/api/input', 'zh-Hans/LeviLamina/developer_guides/android/api/input/', 'zh-CN', 'Input API', true],
      ['zh-CN/api/hook', 'zh-Hans/LeviLamina/developer_guides/android/api/hook/', 'zh-CN', 'Hook API', true],
      ['zh-CN/api/signature', 'zh-Hans/LeviLamina/developer_guides/android/api/signature/', 'zh-CN', 'Signature API', true],
      ['zh-CN/api/patch', 'zh-Hans/LeviLamina/developer_guides/android/api/patch/', 'zh-CN', 'Patch API', true],
      ['zh-CN/api/memory-hook-macros', 'zh-Hans/LeviLamina/developer_guides/android/api/memory_hook_macros/', 'zh-CN', 'Memory Hook 示例', true],
      ['zh-CN/api/types-and-macros', 'zh-Hans/LeviLamina/developer_guides/android/api/types_and_macros/', 'zh-CN', 'SDK 头文件与宏', { pl_export: ['pl-export'], pl_register_mod: ['pl-register-mod'] }],
      ['zh-Hant/', 'zh-Hant/LeviLauncher/guide/quick-start?platform=android', 'zh-HK', '5 分鐘上手', false],
      ['zh-Hant/guide/getting-started', 'zh-Hant/LeviLauncher/guide/quick-start?platform=android', 'zh-HK', '5 分鐘上手', false],
      ['zh-Hant/guide/features', 'zh-Hant/LeviLauncher/guide/version-management?platform=android', 'zh-HK', '版本管理', false],
      ['zh-Hant/guide/compatibility', 'zh-Hant/LeviLauncher/guide/faq-community-feedback', 'zh-HK', '常見問題、社群與回饋', false],
      ['zh-Hant/guide/developer', 'zh-Hant/LeviLamina/developer_guides/android/', 'zh-HK', '原生模組快速開始', true],
      ['zh-Hant/guide/build', 'zh-Hant/LeviLamina/developer_guides/android/', 'zh-HK', '原生模組快速開始', false],
      ['zh-Hant/api/mod', 'zh-Hant/LeviLamina/developer_guides/android/api/mod/', 'zh-HK', 'Mod API', true],
      ['zh-Hant/api/mod-menu', 'zh-Hant/LeviLamina/developer_guides/android/api/mod_menu/', 'zh-HK', 'Mod Menu API', true],
      ['zh-Hant/api/config', 'zh-Hant/LeviLamina/developer_guides/android/api/config/', 'zh-HK', 'Config API', true],
      ['zh-Hant/api/input', 'zh-Hant/LeviLamina/developer_guides/android/api/input/', 'zh-HK', 'Input API', true],
      ['zh-Hant/api/hook', 'zh-Hant/LeviLamina/developer_guides/android/api/hook/', 'zh-HK', 'Hook API', true],
      ['zh-Hant/api/signature', 'zh-Hant/LeviLamina/developer_guides/android/api/signature/', 'zh-HK', 'Signature API', true],
      ['zh-Hant/api/patch', 'zh-Hant/LeviLamina/developer_guides/android/api/patch/', 'zh-HK', 'Patch API', true],
      ['zh-Hant/api/memory-hook-macros', 'zh-Hant/LeviLamina/developer_guides/android/api/memory_hook_macros/', 'zh-HK', 'Memory Hook 示例', true],
      ['zh-Hant/api/types-and-macros', 'zh-Hant/LeviLamina/developer_guides/android/api/types_and_macros/', 'zh-HK', 'SDK 頭文件與宏', { pl_export: ['pl-export'], pl_register_mod: ['pl-register-mod'] }],
    ],
    aliases: [
      ['api/', 'LeviLamina/developer_guides/android/api/mod/'],
      ['guide/', 'LeviLauncher/guide/quick-start?platform=android'],
      ['zh-CN/api/', 'zh-Hans/LeviLamina/developer_guides/android/api/mod/'],
      ['zh-CN/guide/', 'zh-Hans/LeviLauncher/guide/quick-start?platform=android'],
      ['zh-Hant/api/', 'zh-Hant/LeviLamina/developer_guides/android/api/mod/'],
      ['zh-Hant/guide/', 'zh-Hant/LeviLauncher/guide/quick-start?platform=android'],
    ],
    // docs/public/appicon.png of LiteLDev/LeviLaunchroid (its favicon and logo; LeviLauncher's differs).
    files: ['appicon.png'],
    fallbacks: [
      ['zh-CN/', 'zh-Hans/LeviLauncher/guide/quick-start?platform=android'],
      ['zh-Hant/', 'zh-Hant/LeviLauncher/guide/quick-start?platform=android'],
      ['', 'LeviLauncher/guide/quick-start?platform=android'],
    ],
  },
  {
    // LiteLDev/preloader-android docs/ at a29b5a6702 (VitePress, base /preloader-android/, cleanUrls,
    // locales: root = English, zh-CN/). The SDK docs now live in LeviLamina's docs (developer_guides/android/; formerly
    // LeviLaunchroid's docs, see above), rewritten for the C++ pl:: API (the old pages documented the C pl_* API);
    // Pages on preloader-android is disabled, so these paths reach this site.
    from: '/preloader-android/',
    to: '/',
    project: 'LeviLamina',
    oldName: 'Preloader Android',
    newName: 'LeviLamina',
    pages: [
      ['', 'LeviLamina/developer_guides/android/', 'en', 'Native Mod Quick Start', true],
      ['guide/getting-started', 'LeviLamina/developer_guides/android/', 'en', 'Native Mod Quick Start', false],
      ['guide/build', 'LeviLamina/developer_guides/android/', 'en', 'Native Mod Quick Start', false],
      ['guide/compatibility', 'LeviLamina/developer_guides/android/', 'en', 'Native Mod Quick Start', false],
      ['api/mod', 'LeviLamina/developer_guides/android/api/mod/', 'en', 'Mod API', {
        'mod-api': ['mod-entry-api'],
        header: ['headers'],
        registration: ['signatures', 'example'],
        lifecycle: ['return-value'],
        nativemod: ['fields', 'parameters'],
      }],
      ['api/input', 'LeviLamina/developer_guides/android/api/input/', 'en', 'Input API', {
        header: ['headers'],
        functions: ['signatures', 'getpreloaderinput', 'registertouchcallback', 'registerkeyeventcallback', 'showkeyboard-hidekeyboard'],
      }],
      ['api/hook', 'LeviLamina/developer_guides/android/api/hook/', 'en', 'Hook API', {
        header: ['headers'],
        types: ['chain-behavior'],
        functions: ['signatures', 'pl-hook', 'pl-unhook'],
      }],
      ['api/signature', 'LeviLamina/developer_guides/android/api/signature/', 'en', 'Signature API', {
        header: ['headers'],
        functions: ['signatures', 'pl-resolve-signature'],
        example: ['c-example', 'c-batch-example'],
      }],
      ['api/patch', 'LeviLamina/developer_guides/android/api/patch/', 'en', 'Patch API', {
        functions: ['signatures', 'pl-patch-write-bytes-writebytes', 'pl-patch-read-bytes-readbytes', 'pl-patch-revert-revert', 'pl-patch-revert-all-revertall'],
        example: ['c-example', 'c-example-1'],
      }],
      ['api/memory-hook-macros', 'LeviLamina/developer_guides/android/api/memory_hook_macros/', 'en', 'Memory Hook Example', {
        'memory-hook-example': ['memory-hook-macros'],
        headers: ['header'],
        example: ['static-function-example'],
      }],
      ['api/types-and-macros', 'LeviLamina/developer_guides/android/api/types_and_macros/', 'en', 'SDK Headers and Macros', {
        'sdk-headers-and-macros': ['types-and-macros'],
        'public-headers': ['headers'],
        pl_export: ['plapi', 'pl-export'],
        pl_register_mod: ['pl-register-mod'],
      }],
      ['zh-CN/', 'zh-Hans/LeviLamina/developer_guides/android/', 'zh-CN', '原生模组快速开始', true],
      ['zh-CN/guide/getting-started', 'zh-Hans/LeviLamina/developer_guides/android/', 'zh-CN', '原生模组快速开始', false],
      ['zh-CN/guide/build', 'zh-Hans/LeviLamina/developer_guides/android/', 'zh-CN', '原生模组快速开始', false],
      ['zh-CN/guide/compatibility', 'zh-Hans/LeviLamina/developer_guides/android/', 'zh-CN', '原生模组快速开始', false],
      ['zh-CN/api/mod', 'zh-Hans/LeviLamina/developer_guides/android/api/mod/', 'zh-CN', 'Mod API', {
        'mod-api': ['mod-入口-api'],
        注册: ['类型签名', '最小示例'],
        生命周期: ['返回值'],
        nativemod: ['字段说明', '参数'],
        注意: ['注意事项'],
      }],
      ['zh-CN/api/input', 'zh-Hans/LeviLamina/developer_guides/android/api/input/', 'zh-CN', 'Input API', {
        函数: ['类型签名', 'getpreloaderinput', 'registertouchcallback', 'registerkeyeventcallback', 'showkeyboard-hidekeyboard'],
        示例: ['示例-1'],
        注意: ['注意事项'],
      }],
      ['zh-CN/api/hook', 'zh-Hans/LeviLamina/developer_guides/android/api/hook/', 'zh-CN', 'Hook API', {
        类型: ['链式-hook-行为'],
        函数: ['类型签名', 'pl-hook', 'pl-unhook'],
      }],
      ['zh-CN/api/signature', 'zh-Hans/LeviLamina/developer_guides/android/api/signature/', 'zh-CN', 'Signature API', {
        函数: ['类型签名', 'pl-resolve-signature'],
        示例: ['c-示例', 'c-批量示例'],
      }],
      ['zh-CN/api/patch', 'zh-Hans/LeviLamina/developer_guides/android/api/patch/', 'zh-CN', 'Patch API', {
        函数: ['类型签名', 'pl-patch-write-bytes-writebytes', 'pl-patch-read-bytes-readbytes', 'pl-patch-revert-revert', 'pl-patch-revert-all-revertall'],
        示例: ['c-示例', 'c-示例-1'],
        注意: ['注意事项'],
      }],
      ['zh-CN/api/memory-hook-macros', 'zh-Hans/LeviLamina/developer_guides/android/api/memory_hook_macros/', 'zh-CN', 'Memory Hook 示例', {
        'memory-hook-示例': ['memory-hook-宏'],
        示例: ['静态函数示例', '自动注册示例', '直接地址示例'],
        注意: ['注意事项'],
      }],
      ['zh-CN/api/types-and-macros', 'zh-Hans/LeviLamina/developer_guides/android/api/types_and_macros/', 'zh-CN', 'SDK 头文件与宏', {
        'sdk-头文件与宏': ['types-与宏'],
        公开头文件: ['头文件'],
        pl_export: ['宏', 'plapi', 'pl-export'],
        pl_register_mod: ['pl-register-mod'],
      }],
    ],
    aliases: [
      ['api/', 'LeviLamina/developer_guides/android/api/mod/'],
      ['guide/', 'LeviLamina/developer_guides/android/'],
      ['zh-CN/api/', 'zh-Hans/LeviLamina/developer_guides/android/api/mod/'],
      ['zh-CN/guide/', 'zh-Hans/LeviLamina/developer_guides/android/'],
    ],
    // docs/public/appicon.png at a29b5a6702 (the old favicon and logo; byte-identical to LeviLaunchroid's).
    files: ['appicon.png'],
    fallbacks: [
      ['zh-CN/', 'zh-Hans/LeviLamina/developer_guides/android/'],
      ['', 'LeviLamina/developer_guides/android/'],
    ],
  },
  {
    // LiteXLoader's docsify site (formerly liteldev.github.io/LiteXLoader/, which GitHub 301s to the organisation site; still
    // linked from READMEs). LiteXLoader became LLSE, now LegacyScriptEngine. The repository is gone, and its
    // pages were docsify `#/…` routes on one index.html, so every old URL goes to the LegacyScriptEngine docs
    // home (which picks the reader's language) and the hash is dropped.
    from: '/LiteXLoader/',
    to: '/LegacyScriptEngine/',
    oldName: 'LiteXLoader',
    newName: 'LegacyScriptEngine',
    pages: [['', '', 'en', 'LegacyScriptEngine docs', false]],
    fallbacks: [['', '']],
  },
];

/**
 * Project sites published by their own repositories (the projects with docs). Their paths are case-sensitive on
 * GitHub Pages, so a wrongly cased link (/levilamina/…) reaches this site's 404; it forwards to the correctly cased
 * path.
 */
export const PROJECT_SITES = DOCS_PROJECTS.map((p) => p.id);

/**
 * The language segments of the URLs before the language moved first (kit 2.23), lower-cased → the segment now (the
 * first one of the path): /LeviLamina/zh/x/ and /LeviLamina/zh-Hans/x/ are /zh-Hans/LeviLamina/x/,
 * /LeviLauncher/ja-JP/x are /ja/LeviLauncher/x.
 */
export const OLD_LANGUAGE_SEGMENTS = {
  zh: 'zh-Hans',
  'zh-hans': 'zh-Hans',
  'zh-cn': 'zh-Hans',
  'zh-hant': 'zh-Hant',
  'zh-hk': 'zh-Hant',
  'zh-tw': 'zh-Hant',
  'es-es': 'es',
  'ru-ru': 'ru',
  'de-de': 'de',
  'ja-jp': 'ja',
  'ko-kr': 'ko',
  'fr-fr': 'fr',
};
for (const v of Object.values(OLD_LANGUAGE_SEGMENTS)) if (!NETWORK_LANGUAGE_SEGMENTS.includes(v)) throw new Error(`OLD_LANGUAGE_SEGMENTS: ${v} is no network language`);

/**
 * Where a project's own repository publishes each language until its docs are built here (new segment → the
 * segment after the project's base). Every project has zh-Hans and zh-Hant at the same name.
 */
export const LANGUAGE_SEGMENTS = {
  LeviLauncher: { es: 'es-ES', ru: 'ru-RU', de: 'de-DE', ja: 'ja-JP', ko: 'ko-KR', fr: 'fr-FR' },
};

/**
 * The sites whose pages this repository builds (levimc.org's dist): /mods/, /tutorials/, /faq/ and every project with a
 * docs root (docs/<Project>/package.json, see docs/README.md). The others are still their repositories' Pages.
 */
export function builtSites(repoRoot) {
  return ['mods', 'tutorials', 'faq', ...PROJECT_SITES.filter((p) => existsSync(join(repoRoot, 'docs', p, 'package.json')))];
}
