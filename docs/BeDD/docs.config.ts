// levimc.org/BeDD/: the Be.D.D. documentation, built from this folder by levimc.org's deploy (until 2026-11 it was
// built in LiteLDev/BeDD, docs/). English at /BeDD/, Simplified Chinese at /zh-Hans/BeDD/ (sources in content/zh/),
// Traditional Chinese at /zh-Hant/BeDD/, converted from it: levimc.org's one scheme, the language first. The URLs
// before (/BeDD/zh-Hans/…, /BeDD/zh/…, /BeDD/zh-Hant/…) redirect. The WebSocket API's AsyncAPI document is BeDD's
// spec/bedd.asyncapi.yaml, downloaded into public/ before every build (scripts/fetch-spec.mjs).
import { defineDocsConfig, type NavEntry } from './kit/docs/node/config.ts';

const repo = 'https://github.com/LiteLDev/BeDD';

interface Labels {
  guide: string;
  reference: string;
  gallery: string;
  showcase: string;
  help: string;
  scripts: string;
  usage: string;
  installs: string;
  severalGames: string;
  operationModes: string;
  modes: string;
  integrating: string;
  configuration: string;
  troubleshooting: string;
  websocket: string;
  ui: string;
  tap: string;
  howItWorks: string;
}

const LABELS: Record<string, Labels> = {
  root: {
    guide: 'Guide',
    reference: 'Reference',
    gallery: 'Gallery',
    showcase: 'Showcase',
    help: 'Help',
    scripts: 'Writing tests',
    usage: 'Driving the game',
    installs: 'Installs and clones',
    severalGames: 'Several games at once',
    operationModes: 'Operation modes',
    modes: 'Where the world runs',
    integrating: 'Integrating with your tests',
    configuration: 'Configuration',
    troubleshooting: 'Troubleshooting',
    websocket: 'WebSocket API',
    ui: 'UI tree',
    tap: 'Tap protocol',
    howItWorks: 'How it works',
  },
  zh: {
    guide: '指南',
    reference: '参考',
    gallery: '展示',
    showcase: '作品展示',
    help: '帮助',
    scripts: '编写测试',
    usage: '驱动游戏',
    installs: '安装与克隆',
    severalGames: '多开',
    operationModes: '操作模式',
    modes: '世界在哪里运行',
    integrating: '接入你的测试',
    configuration: '配置',
    troubleshooting: '故障排查',
    websocket: 'WebSocket 接口',
    ui: 'UI 控件树',
    tap: 'Tap 协议',
    howItWorks: '工作原理',
  },
};

// The LeviMC navigation model (kit/README.md "Navigation model"): every top-level entry is a section, i.e. a header
// tab and the sidebar tree of its pages; the brand links the home page. `p` is the locale's URL prefix ('/' or '/zh-Hans/');
// zh-Hant is converted from zh by the kit.
const nav = (p: string, t: Labels): NavEntry[] => [
  {
    text: t.guide,
    items: [
      {
        text: t.scripts,
        items: [
          { text: t.usage, link: `${p}guide/usage` },
          { text: t.operationModes, link: `${p}guide/operation-modes` },
          { text: t.severalGames, link: `${p}guide/several-games` },
          { text: t.modes, link: `${p}guide/modes` },
          { text: t.integrating, link: `${p}guide/integrating` },
          { text: t.configuration, link: `${p}guide/configuration` },
          { text: t.installs, link: `${p}guide/installs` },
        ],
      },
      { text: t.showcase, items: [{ text: t.gallery, link: `${p}gallery` }] },
      { text: t.help, items: [{ text: t.troubleshooting, link: `${p}guide/troubleshooting` }] },
    ],
  },
  {
    text: t.reference,
    items: [
      { text: t.websocket, link: `${p}reference/websocket` },
      { text: t.ui, link: `${p}reference/ui` },
      { text: t.tap, link: `${p}reference/tap` },
      { text: t.howItWorks, link: `${p}reference/how-it-works` },
    ],
  },
];

// Pages that left the site (kit README "Site config API", `redirects`): every URL they had, in every locale and under
// the former zh/ prefix, answers with a redirect. Setting up and the first run are the levimc.org tutorial; the
// introduction is the home page; building and contributing is CONTRIBUTING.md in the repository.
const TUTORIAL = 'https://levimc.org/tutorials/automate/bedd/';
const TUTORIAL_HANS = 'https://levimc.org/zh-Hans/tutorials/automate/bedd/';
const TUTORIAL_HANT = 'https://levimc.org/zh-Hant/tutorials/automate/bedd/';
const CONTRIBUTING = `${repo}/blob/main/CONTRIBUTING.md`;
const redirects: Record<string, string> = {};
for (const [prefix, tutorial, home] of [
  ['', TUTORIAL, ''],
  ['zh-Hans/', TUTORIAL_HANS, 'zh-Hans/'],
  ['zh/', TUTORIAL_HANS, 'zh-Hans/'],
  ['zh-Hant/', TUTORIAL_HANT, 'zh-Hant/'],
] as const) {
  redirects[`${prefix}guide/installation`] = tutorial;
  redirects[`${prefix}guide/new-pc`] = tutorial;
  redirects[`${prefix}guide/introduction`] = home;
  redirects[`${prefix}reference/building`] = CONTRIBUTING;
}

export default defineDocsConfig({
  base: '/BeDD/',
  title: 'Be.D.D.',
  description: 'Run end-to-end tests of LeviLamina client mods in the background: scripts drive Minecraft Bedrock while your mouse, keyboard and windows stay yours.',
  project: 'BeDD',
  logo: { src: '/logo.png', alt: 'Be.D.D.' },
  favicon: '/logo.png',
  contentDir: 'content',
  // logo.png and showcase/ stay at /BeDD/logo.png and /BeDD/showcase/… (BeDD's README links them)
  publicDir: 'public',
  repo,
  // the sources live here now
  editLink: 'https://github.com/LiteLDev/liteldev.github.io/edit/main/docs/BeDD/content/:path',
  hostname: 'https://levimc.org',
  sitemap: { hostname: 'https://levimc.org' },
  i18n: {
    mode: 'folder',
    defaultLocale: 'root',
    localeFirst: true,
    locales: [
      { code: 'root', label: 'English', lang: 'en', prefix: '' },
      { code: 'zh', label: '简体中文', lang: 'zh-Hans', prefix: 'zh-Hans/', folder: 'zh', formerPrefixes: ['zh-Hans/', 'zh/'] },
      { code: 'zh-Hant', label: '繁體中文', lang: 'zh-Hant', prefix: 'zh-Hant/', convertFrom: 'zh', formerPrefixes: ['zh-Hant/'] },
    ],
  },
  urlStyle: 'html',
  cleanUrls: true,
  slug: 'vitepress',
  markdown: { compat: 'commonmark', containers: { vitepress: true } },
  outline: [2, 3],
  sidebar: 'tabs',
  redirects,
  nav: { root: nav('/', LABELS.root!), zh: nav('/zh-Hans/', LABELS.zh!) },
  // the resources slot: Download (the latest release), then the repository's GitHub icon (`repo`)
  header: { links: [{ kind: 'download', link: `${repo}/releases/latest` }] },
});
