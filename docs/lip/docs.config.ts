// lip documentation — levimc-kit site config. Built from this folder by levimc.org's deploy (docs/README.md) since
// 2026-11-16, before by LiteLDev/lip's own (docs/). English at /lip/, Simplified Chinese at /zh-Hans/lip/ (sources
// in content/zh/), Traditional Chinese at /zh-Hant/lip/ (content/zh-Hant/, written by scripts/zh-hant.mjs): the
// language first, levimc.org's one scheme. The URLs before (/lip/zh-Hans/…, /lip/zh/…, /lip/zh-Hant/…) redirect.
// The LeviMC navigation model: every top-level nav entry is a tab with its own sidebar tree.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineDocsConfig, type NavEntry } from './kit/docs/node/config.ts';

const repo = 'https://github.com/LiteLDev/lip';
/** Where the pages are written: levimc.org's repository. */
const SOURCES = 'https://github.com/LiteLDev/liteldev.github.io';

interface Labels {
  guide: string;
  usingInterface: string;
  tour: string;
  // The pages of the interface, named as the interface names them (src/Lip.Cli/Tui/Pages/*/*Text.cs, Title).
  home: string;
  server: string;
  mods: string;
  getMods: string;
  gameConfig: string;
  modConfig: string;
  workspaces: string;
  tools: string;
  settings: string;
  usingCommands: string;
  managingPackages: string;
  configuration: string;
  linuxMacos: string;
  troubleshooting: string;
  help: string;
  authors: string;
  migratingPackages: string;
  concepts: string;
  howLipWorks: string;
  stateFile: string;
  internals: string;
  reference: string;
  cli: string;
  interfaceReference: string;
  files: string;
  commands: string;
}

type Locale = 'root' | 'zh' | 'zh-Hant';

const LABELS: Record<Locale, Labels> = {
  root: {
    guide: 'Guide',
    usingInterface: 'Using the interface',
    tour: 'A tour of the interface',
    home: 'Home',
    server: 'Server',
    mods: 'Mods',
    getMods: 'Get mods',
    gameConfig: 'Game config',
    modConfig: 'Mod config',
    workspaces: 'Workspaces',
    tools: 'Tools',
    settings: 'Settings',
    usingCommands: 'Using the commands',
    managingPackages: 'Managing packages',
    configuration: 'Configuration',
    linuxMacos: 'Linux and macOS',
    troubleshooting: 'Troubleshooting',
    help: 'Help',
    authors: 'For package authors',
    migratingPackages: 'Migrating packages',
    concepts: 'Concepts',
    howLipWorks: 'How lip works',
    stateFile: 'State file',
    internals: 'Internals',
    reference: 'Reference',
    cli: 'Command line',
    interfaceReference: 'Interface',
    files: 'Files',
    commands: 'Commands',
  },
  zh: {
    guide: '指南',
    usingInterface: '使用界面',
    tour: '界面导览',
    home: '主页',
    server: '服务器',
    mods: '模组',
    getMods: '获取模组',
    gameConfig: '游戏配置',
    modConfig: '模组配置',
    workspaces: '工作区',
    tools: '工具',
    settings: '设置',
    usingCommands: '使用命令',
    managingPackages: '管理包',
    configuration: '配置',
    linuxMacos: 'Linux 与 macOS',
    troubleshooting: '故障排查',
    help: '帮助',
    authors: '写给包作者',
    migratingPackages: '迁移包',
    concepts: '概念',
    howLipWorks: 'lip 的工作方式',
    stateFile: '状态文件',
    internals: '内部机制',
    reference: '参考',
    cli: '命令行',
    interfaceReference: '界面',
    files: '文件',
    commands: '命令',
  },
  // Written by hand, with the words of the interface in Traditional Chinese: the conversion of the kit works on
  // characters only (服務器, 設置, 界面), and the pages are made by scripts/zh-hant.mjs (see CONTRIBUTING.md).
  'zh-Hant': {
    guide: '指南',
    usingInterface: '使用介面',
    tour: '介面導覽',
    home: '首頁',
    server: '伺服器',
    mods: '模組',
    getMods: '取得模組',
    gameConfig: '遊戲設定',
    modConfig: '模組設定',
    workspaces: '工作區',
    tools: '工具',
    settings: '設定',
    usingCommands: '使用命令',
    managingPackages: '管理套件',
    configuration: '設定',
    linuxMacos: 'Linux 與 macOS',
    troubleshooting: '疑難排解',
    help: '說明',
    authors: '寫給套件作者',
    migratingPackages: '移轉套件',
    concepts: '概念',
    howLipWorks: 'lip 的運作方式',
    stateFile: '狀態檔',
    internals: '內部機制',
    reference: '參考',
    cli: '命令列',
    interfaceReference: '介面',
    files: '檔案',
    commands: '命令',
  },
};

const COMMANDS = ['cache_clean', 'config', 'daemon', 'install', 'list', 'pkg_init', 'pkg_migrate', 'pkg_pack', 'pkg_view', 'run', 'self_update', 'setup', 'uninstall', 'update'];

/**
 * The tabs of one locale, each with the tree of its sidebar. `p` is the folder of its pages, '/', '/zh/' or '/zh-Hant/':
 * a link of the nav names a page by its source, and the kit gives it the URL of its locale (zh/ is at zh-Hans/).
 */
const nav = (p: string, t: Labels): NavEntry[] => [
  {
    text: t.guide,
    items: [
      {
        text: t.usingInterface,
        items: [
          { text: t.tour, link: `${p}interface/tour` },
          { text: t.home, link: `${p}interface/home` },
          { text: t.server, link: `${p}interface/server` },
          { text: t.mods, link: `${p}interface/mods` },
          { text: t.getMods, link: `${p}interface/get_mods` },
          { text: t.gameConfig, link: `${p}interface/game_config` },
          { text: t.modConfig, link: `${p}interface/mod_config` },
          { text: t.workspaces, link: `${p}interface/workspaces` },
          { text: t.tools, link: `${p}interface/tools` },
          { text: t.settings, link: `${p}interface/settings` },
        ],
      },
      {
        text: t.usingCommands,
        items: [
          { text: t.managingPackages, link: `${p}guides/managing_packages` },
          { text: t.configuration, link: `${p}guides/configuration` },
          { text: t.linuxMacos, link: `${p}guides/linux_macos` },
        ],
      },
      {
        text: t.authors,
        items: [{ text: t.migratingPackages, link: `${p}authors/migrating_packages` }],
      },
      {
        text: t.help,
        items: [{ text: t.troubleshooting, link: `${p}guides/troubleshooting` }],
      },
    ],
  },
  {
    text: t.concepts,
    items: [
      { text: t.howLipWorks, link: `${p}concepts/how_lip_works` },
      { text: 'lip.toml', link: `${p}concepts/lip_toml` },
      { text: t.stateFile, link: `${p}concepts/state_file` },
      { text: t.internals, link: `${p}concepts/internals` },
    ],
  },
  {
    text: t.reference,
    items: [
      { text: t.cli, link: `${p}reference/cli` },
      { text: t.interfaceReference, link: `${p}reference/interface` },
      { text: t.configuration, link: `${p}reference/configuration` },
      { text: t.files, link: `${p}reference/files` },
      // A page is named after its command with "_" for " " or "-" (self_update: lip self-update).
      { text: t.commands, items: COMMANDS.map((c) => ({ text: c === 'self_update' ? 'self-update' : c.replace('_', ' '), link: `${p}reference/commands/${c}` })) },
    ],
  },
];

// The tutorials of lip are at levimc.org/tutorials/, with those of the other LeviMC projects: English at the root,
// Simplified Chinese at zh-Hans/tutorials/, Traditional Chinese at zh-Hant/tutorials/.
const LEVIMC = 'https://levimc.org/';
/** A tutorial, or a page of the FAQ (levimc.org/faq/, the same languages), as a target of MOVED. */
const tutorial = (path: string) => ({ site: 'tutorials', path });
const faq = (path: string) => ({ site: 'faq', path });
type Target = string | { site: string; path: string };

// Pages that moved or were removed: their old URLs, in every locale, open the page that took their place (a page of
// this site, '' for its home page, or a tutorial or FAQ page in the same language).
const MOVED: Record<string, Target> = {
  // The tutorials moved to levimc.org/tutorials/; "What is lip?" became the home page.
  'intro/what_is_lip': '',
  'intro/installation': tutorial('server/first-server/'),
  'intro/first_server': tutorial('server/first-server/'),
  'guides/server_from_commands': tutorial('server/command-line/'),
  'authors/creating_packages': tutorial('develop/publish-a-package/'),
  // The FAQ moved to levimc.org/faq/, with the questions of the other LeviMC projects.
  faq: faq('server/lip/basics/'),
  // The documentation was rebuilt around the interface (lip 0.41).
  'intro/quick_start': tutorial('server/first-server/'),
  'guides/running_server': tutorial('server/command-line/'),
  'guides/installing_dependencies': 'guides/managing_packages.html',
  'guides/managing_configuration': 'guides/configuration.html',
  'guides/creating_packages': tutorial('develop/publish-a-package/'),
  'guides/migrating_packages': 'authors/migrating_packages.html',
  'guides/internal_mechanism': 'concepts/internals.html',
  'concepts/architecture': 'concepts/how_lip_works.html',
  'concepts/lockfiles': 'concepts/state_file.html',
  'cli/overview': 'reference/cli.html',
  'cli/tui': 'reference/interface.html',
  'cli/configuration': 'reference/configuration.html',
  ...Object.fromEntries(COMMANDS.map((c) => [`cli/commands/${c}`, `reference/commands/${c}.html`])),
  // Since lip 0.41: no JSON-RPC, tooth.json → lip.toml, the command group pkg.
  'rpc/overview': 'reference/cli.html',
  'rpc/json_rpc_spec': 'reference/cli.html',
  'cli/commands/rpc': 'reference/cli.html',
  'concepts/tooth_json': 'concepts/lip_toml.html',
  'concepts/lip_yaml': 'concepts/lip_toml.html',
  'cli/commands/init': 'reference/commands/pkg_init.html',
  'cli/commands/pack': 'reference/commands/pkg_pack.html',
  'cli/commands/view': 'reference/commands/pkg_view.html',
  'cli/commands/versions': 'reference/commands/pkg_view.html',
  'cli/commands/migrate': 'reference/commands/pkg_migrate.html',
};
// A page that is still where it was needs no redirect, and the kit refuses one: the old URL of a page redirects
// from the build in which its file is gone. The Traditional Chinese pages are those of zh/ (scripts/zh-hant.mjs).
// Simplified Chinese was published below zh/ and zh-Hans/ before, Traditional Chinese below zh-Hant/: their old URLs
// redirect too (the kit redirects the old URL of each page that still exists, `formerPrefixes`; these are the pages
// that do not). A target in zh-Hans/ or zh-Hant/ is that locale's page, language first (/zh-Hans/lip/…), and the
// kit also writes the redirect at the language-first URL of an old page of a locale (/zh-Hans/lip/<old>.html).
const isPage = (folder: string, page: string) => existsSync(fileURLToPath(new URL(`./content/${folder}${page}.md`, import.meta.url)));
const redirects = Object.fromEntries(
  (
    [
      // [URL prefix of the old page, source folder, URL prefix of the target, language of the tutorials]
      ['', '', '', ''],
      ['zh-Hans/', 'zh/', 'zh-Hans/', 'zh-Hans/'],
      ['zh/', 'zh/', 'zh-Hans/', 'zh-Hans/'],
      ['zh-Hant/', 'zh/', 'zh-Hant/', 'zh-Hant/'],
    ] as const
  ).flatMap(([p, folder, to, tutorials]) =>
    Object.entries(MOVED)
      .filter(([from]) => !isPage(folder, from))
      .map(([from, target]) => [p + from, typeof target === 'string' ? to + target : `${LEVIMC}${tutorials}${target.site}/${target.path}`]),
  ),
);

export default defineDocsConfig({
  base: '/lip/',
  title: 'lip',
  // The NAME line of lip(1) (protocol/lip.md).
  description: 'Run a LeviLamina server and manage its packages',
  // the same mark as lip's tile in the LeviMC Projects menu (levimc.org/logos/lip.webp)
  logo: { src: '/logo.webp', alt: 'lip' },
  favicon: '/logo.webp',
  project: 'lip',
  // the pages; CONTRIBUTING.md, next to it, is for writers
  contentDir: 'content',
  // public/ next to content/: lip's screenshot generator (tests/Lip.Cli.Tests/Tui/Screenshots in LiteLDev/lip) writes
  // the pictures into docs/lip/public/screenshots/ of a checkout of this repository named liteldev.github.io next to
  // lip's (or into LIP_SCREENSHOTS_DIR).
  publicDir: 'public',
  repo,
  // The sources live in levimc.org's repository now. The Traditional Chinese pages are made from the Simplified ones
  // (scripts/zh-hant.mjs): those are the ones to edit.
  editLink: { pattern: (source) => `${SOURCES}/edit/main/docs/lip/content/${source.replace(/^zh-Hant\//, 'zh/')}` },
  hostname: 'https://levimc.org',
  sitemap: { hostname: 'https://levimc.org' },
  i18n: {
    mode: 'folder',
    defaultLocale: 'root',
    localeFirst: true,
    locales: [
      { code: 'root', label: 'English', lang: 'en', prefix: '' },
      // Simplified Chinese: the pages stay in zh/; the URLs moved from /lip/zh/ to /lip/zh-Hans/, then to /zh-Hans/lip/.
      { code: 'zh', label: '简体中文', lang: 'zh-Hans', prefix: 'zh-Hans/', folder: 'zh', formerPrefixes: ['zh-Hans/', 'zh/'] },
      // Traditional Chinese: scripts/zh-hant.mjs writes zh-Hant/ from zh/ before every build, with the words of the
      // interface. A zh page that it did not write is still converted by the kit, character by character.
      { code: 'zh-Hant', label: '繁體中文', lang: 'zh-Hant', prefix: 'zh-Hant/', convertFrom: 'zh', formerPrefixes: ['zh-Hant/'] },
    ],
  },
  // Existing URLs are /lip/<page>.html (VitePress without cleanUrls); keep them.
  urlStyle: 'html',
  cleanUrls: false,
  slug: 'vitepress',
  markdown: { compat: 'commonmark' },
  // VitePress default (the old config set no outline): "On this page" lists h2 headings only.
  outline: 2,
  sidebar: 'tabs',
  nav: { root: nav('/', LABELS.root), zh: nav('/zh/', LABELS.zh), 'zh-Hant': nav('/zh-Hant/', LABELS['zh-Hant']) },
  redirects,
});
