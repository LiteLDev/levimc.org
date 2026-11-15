// Legacy documentation URLs that levimc.org forwards (moved here from LiteLDev/liteldev.github.io, which served
// them under docs.levimc.org before the project docs moved to levimc.org/<Repo>/).
//
// GitHub Pages serves this repository (the organisation site) for every path of levimc.org that no project
// repository with Pages owns (project repos own /<Repo>/). legacy/build.mjs turns this table into
//   * a real redirect page for every old URL (dist/<from>/…, meta refresh + location.replace + canonical), and
//   * the forwarding map that dist/404.html runs before rendering (old URL variants, aliases, wrong case).
//
// All targets are canonical, redirect-free URLs (answer 200 directly); `node legacy/build.test.mjs --live`
// verifies them, and every mapped heading id, against the live site.

import { DOCS_PROJECTS } from '../kit/components/projects.ts';

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
      ['zh-CN/', 'LeviLauncher/zh-CN/guide/quick-start?platform=android', 'zh-CN', '5 分钟上手', false],
      ['zh-CN/guide/getting-started', 'LeviLauncher/zh-CN/guide/quick-start?platform=android', 'zh-CN', '5 分钟上手', false],
      ['zh-CN/guide/features', 'LeviLauncher/zh-CN/guide/version-management?platform=android', 'zh-CN', '版本管理', false],
      ['zh-CN/guide/compatibility', 'LeviLauncher/zh-CN/guide/faq-community-feedback', 'zh-CN', '常见问题、社区与反馈', false],
      ['zh-CN/guide/developer', 'LeviLamina/zh/developer_guides/android/', 'zh-CN', '原生模组快速开始', true],
      ['zh-CN/guide/build', 'LeviLamina/zh/developer_guides/android/', 'zh-CN', '原生模组快速开始', false],
      ['zh-CN/api/mod', 'LeviLamina/zh/developer_guides/android/api/mod/', 'zh-CN', 'Mod API', true],
      ['zh-CN/api/mod-menu', 'LeviLamina/zh/developer_guides/android/api/mod_menu/', 'zh-CN', 'Mod Menu API', true],
      ['zh-CN/api/config', 'LeviLamina/zh/developer_guides/android/api/config/', 'zh-CN', 'Config API', true],
      ['zh-CN/api/input', 'LeviLamina/zh/developer_guides/android/api/input/', 'zh-CN', 'Input API', true],
      ['zh-CN/api/hook', 'LeviLamina/zh/developer_guides/android/api/hook/', 'zh-CN', 'Hook API', true],
      ['zh-CN/api/signature', 'LeviLamina/zh/developer_guides/android/api/signature/', 'zh-CN', 'Signature API', true],
      ['zh-CN/api/patch', 'LeviLamina/zh/developer_guides/android/api/patch/', 'zh-CN', 'Patch API', true],
      ['zh-CN/api/memory-hook-macros', 'LeviLamina/zh/developer_guides/android/api/memory_hook_macros/', 'zh-CN', 'Memory Hook 示例', true],
      ['zh-CN/api/types-and-macros', 'LeviLamina/zh/developer_guides/android/api/types_and_macros/', 'zh-CN', 'SDK 头文件与宏', { pl_export: ['pl-export'], pl_register_mod: ['pl-register-mod'] }],
      ['zh-Hant/', 'LeviLauncher/zh-HK/guide/quick-start?platform=android', 'zh-HK', '5 分鐘上手', false],
      ['zh-Hant/guide/getting-started', 'LeviLauncher/zh-HK/guide/quick-start?platform=android', 'zh-HK', '5 分鐘上手', false],
      ['zh-Hant/guide/features', 'LeviLauncher/zh-HK/guide/version-management?platform=android', 'zh-HK', '版本管理', false],
      ['zh-Hant/guide/compatibility', 'LeviLauncher/zh-HK/guide/faq-community-feedback', 'zh-HK', '常見問題、社群與回饋', false],
      ['zh-Hant/guide/developer', 'LeviLamina/zh-Hant/developer_guides/android/', 'zh-HK', '原生模組快速開始', true],
      ['zh-Hant/guide/build', 'LeviLamina/zh-Hant/developer_guides/android/', 'zh-HK', '原生模組快速開始', false],
      ['zh-Hant/api/mod', 'LeviLamina/zh-Hant/developer_guides/android/api/mod/', 'zh-HK', 'Mod API', true],
      ['zh-Hant/api/mod-menu', 'LeviLamina/zh-Hant/developer_guides/android/api/mod_menu/', 'zh-HK', 'Mod Menu API', true],
      ['zh-Hant/api/config', 'LeviLamina/zh-Hant/developer_guides/android/api/config/', 'zh-HK', 'Config API', true],
      ['zh-Hant/api/input', 'LeviLamina/zh-Hant/developer_guides/android/api/input/', 'zh-HK', 'Input API', true],
      ['zh-Hant/api/hook', 'LeviLamina/zh-Hant/developer_guides/android/api/hook/', 'zh-HK', 'Hook API', true],
      ['zh-Hant/api/signature', 'LeviLamina/zh-Hant/developer_guides/android/api/signature/', 'zh-HK', 'Signature API', true],
      ['zh-Hant/api/patch', 'LeviLamina/zh-Hant/developer_guides/android/api/patch/', 'zh-HK', 'Patch API', true],
      ['zh-Hant/api/memory-hook-macros', 'LeviLamina/zh-Hant/developer_guides/android/api/memory_hook_macros/', 'zh-HK', 'Memory Hook 示例', true],
      ['zh-Hant/api/types-and-macros', 'LeviLamina/zh-Hant/developer_guides/android/api/types_and_macros/', 'zh-HK', 'SDK 頭文件與宏', { pl_export: ['pl-export'], pl_register_mod: ['pl-register-mod'] }],
    ],
    aliases: [
      ['api/', 'LeviLamina/developer_guides/android/api/mod/'],
      ['guide/', 'LeviLauncher/guide/quick-start?platform=android'],
      ['zh-CN/api/', 'LeviLamina/zh/developer_guides/android/api/mod/'],
      ['zh-CN/guide/', 'LeviLauncher/zh-CN/guide/quick-start?platform=android'],
      ['zh-Hant/api/', 'LeviLamina/zh-Hant/developer_guides/android/api/mod/'],
      ['zh-Hant/guide/', 'LeviLauncher/zh-HK/guide/quick-start?platform=android'],
    ],
    // docs/public/appicon.png of LiteLDev/LeviLaunchroid (its favicon and logo; LeviLauncher's differs).
    files: ['appicon.png'],
    fallbacks: [
      ['zh-CN/', 'LeviLauncher/zh-CN/guide/quick-start?platform=android'],
      ['zh-Hant/', 'LeviLauncher/zh-HK/guide/quick-start?platform=android'],
      ['', 'LeviLauncher/guide/quick-start?platform=android'],
    ],
  },
  {
    // LiteLDev/preloader-android docs/ at a29b5a6702 (VitePress, base /preloader-android/, cleanUrls,
    // locales: root = English, zh-CN/). The SDK docs now live in LeviLamina's docs (developer_guides/android/; formerly
    // LeviLaunchroid's docs, see above), rewritten for the C++ pl:: API (the old pages documented the C pl_* API);
    // Pages on preloader-android is disabled, so these paths reach this site.
    from: '/preloader-android/',
    to: '/LeviLamina/',
    oldName: 'Preloader Android',
    newName: 'LeviLamina',
    pages: [
      ['', 'developer_guides/android/', 'en', 'Native Mod Quick Start', true],
      ['guide/getting-started', 'developer_guides/android/', 'en', 'Native Mod Quick Start', false],
      ['guide/build', 'developer_guides/android/', 'en', 'Native Mod Quick Start', false],
      ['guide/compatibility', 'developer_guides/android/', 'en', 'Native Mod Quick Start', false],
      ['api/mod', 'developer_guides/android/api/mod/', 'en', 'Mod API', {
        'mod-api': ['mod-entry-api'],
        header: ['headers'],
        registration: ['signatures', 'example'],
        lifecycle: ['return-value'],
        nativemod: ['fields', 'parameters'],
      }],
      ['api/input', 'developer_guides/android/api/input/', 'en', 'Input API', {
        header: ['headers'],
        functions: ['signatures', 'getpreloaderinput', 'registertouchcallback', 'registerkeyeventcallback', 'showkeyboard-hidekeyboard'],
      }],
      ['api/hook', 'developer_guides/android/api/hook/', 'en', 'Hook API', {
        header: ['headers'],
        types: ['chain-behavior'],
        functions: ['signatures', 'pl-hook', 'pl-unhook'],
      }],
      ['api/signature', 'developer_guides/android/api/signature/', 'en', 'Signature API', {
        header: ['headers'],
        functions: ['signatures', 'pl-resolve-signature'],
        example: ['c-example', 'c-batch-example'],
      }],
      ['api/patch', 'developer_guides/android/api/patch/', 'en', 'Patch API', {
        functions: ['signatures', 'pl-patch-write-bytes-writebytes', 'pl-patch-read-bytes-readbytes', 'pl-patch-revert-revert', 'pl-patch-revert-all-revertall'],
        example: ['c-example', 'c-example-1'],
      }],
      ['api/memory-hook-macros', 'developer_guides/android/api/memory_hook_macros/', 'en', 'Memory Hook Example', {
        'memory-hook-example': ['memory-hook-macros'],
        headers: ['header'],
        example: ['static-function-example'],
      }],
      ['api/types-and-macros', 'developer_guides/android/api/types_and_macros/', 'en', 'SDK Headers and Macros', {
        'sdk-headers-and-macros': ['types-and-macros'],
        'public-headers': ['headers'],
        pl_export: ['plapi', 'pl-export'],
        pl_register_mod: ['pl-register-mod'],
      }],
      ['zh-CN/', 'zh/developer_guides/android/', 'zh-CN', '原生模组快速开始', true],
      ['zh-CN/guide/getting-started', 'zh/developer_guides/android/', 'zh-CN', '原生模组快速开始', false],
      ['zh-CN/guide/build', 'zh/developer_guides/android/', 'zh-CN', '原生模组快速开始', false],
      ['zh-CN/guide/compatibility', 'zh/developer_guides/android/', 'zh-CN', '原生模组快速开始', false],
      ['zh-CN/api/mod', 'zh/developer_guides/android/api/mod/', 'zh-CN', 'Mod API', {
        'mod-api': ['mod-入口-api'],
        注册: ['类型签名', '最小示例'],
        生命周期: ['返回值'],
        nativemod: ['字段说明', '参数'],
        注意: ['注意事项'],
      }],
      ['zh-CN/api/input', 'zh/developer_guides/android/api/input/', 'zh-CN', 'Input API', {
        函数: ['类型签名', 'getpreloaderinput', 'registertouchcallback', 'registerkeyeventcallback', 'showkeyboard-hidekeyboard'],
        示例: ['示例-1'],
        注意: ['注意事项'],
      }],
      ['zh-CN/api/hook', 'zh/developer_guides/android/api/hook/', 'zh-CN', 'Hook API', {
        类型: ['链式-hook-行为'],
        函数: ['类型签名', 'pl-hook', 'pl-unhook'],
      }],
      ['zh-CN/api/signature', 'zh/developer_guides/android/api/signature/', 'zh-CN', 'Signature API', {
        函数: ['类型签名', 'pl-resolve-signature'],
        示例: ['c-示例', 'c-批量示例'],
      }],
      ['zh-CN/api/patch', 'zh/developer_guides/android/api/patch/', 'zh-CN', 'Patch API', {
        函数: ['类型签名', 'pl-patch-write-bytes-writebytes', 'pl-patch-read-bytes-readbytes', 'pl-patch-revert-revert', 'pl-patch-revert-all-revertall'],
        示例: ['c-示例', 'c-示例-1'],
        注意: ['注意事项'],
      }],
      ['zh-CN/api/memory-hook-macros', 'zh/developer_guides/android/api/memory_hook_macros/', 'zh-CN', 'Memory Hook 示例', {
        'memory-hook-示例': ['memory-hook-宏'],
        示例: ['静态函数示例', '自动注册示例', '直接地址示例'],
        注意: ['注意事项'],
      }],
      ['zh-CN/api/types-and-macros', 'zh/developer_guides/android/api/types_and_macros/', 'zh-CN', 'SDK 头文件与宏', {
        'sdk-头文件与宏': ['types-与宏'],
        公开头文件: ['头文件'],
        pl_export: ['宏', 'plapi', 'pl-export'],
        pl_register_mod: ['pl-register-mod'],
      }],
    ],
    aliases: [
      ['api/', 'developer_guides/android/api/mod/'],
      ['guide/', 'developer_guides/android/'],
      ['zh-CN/api/', 'zh/developer_guides/android/api/mod/'],
      ['zh-CN/guide/', 'zh/developer_guides/android/'],
    ],
    // docs/public/appicon.png at a29b5a6702 (the old favicon and logo; byte-identical to LeviLaunchroid's).
    files: ['appicon.png'],
    fallbacks: [
      ['zh-CN/', 'zh/developer_guides/android/'],
      ['', 'developer_guides/android/'],
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
