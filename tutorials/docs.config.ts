// levimc.org/tutorials/: every end-to-end tutorial of the LeviMC projects, in one place (the project docs keep the
// introductions, guides and reference). Built from this folder by levimc.org's deploy and published at /tutorials/.
// English at the root, Simplified Chinese in zh-Hans/, Traditional Chinese converted from it (levimc.org's one
// locale scheme). Writing rules: CONTRIBUTING.md at the repository root, "Tutorials".
import { defineDocsConfig, type NavEntry } from './kit/docs/node/config.ts';

const repo = 'https://github.com/LiteLDev/liteldev.github.io';

interface Labels {
  server: string;
  firstServer: string;
  commandLine: string;
  docker: string;
  installMods: string;
  letFriendsJoin: string;
  play: string;
  playWithMods: string;
  develop: string;
  firstMod: string;
  firstPlugin: string;
  firstAndroidMod: string;
  publishPackage: string;
  automate: string;
  bedd: string;
  bedboo: string;
}

const LABELS: Record<'en' | 'zh-Hans', Labels> = {
  en: {
    server: 'Run a server',
    firstServer: 'Your first server',
    commandLine: 'A server from the command line',
    docker: 'A server in Docker',
    installMods: 'Install mods on your server',
    letFriendsJoin: 'Let friends join your server',
    play: 'Play',
    playWithMods: 'Play with mods on Windows',
    develop: 'Make mods',
    firstMod: 'Your first LeviLamina mod',
    firstPlugin: 'Your first script plugin',
    firstAndroidMod: 'Your first Android native mod',
    publishPackage: 'Publish your mod with lip',
    automate: 'Automate',
    bedd: 'Drive the game client with Be.D.D.',
    bedboo: 'Your first bedboo bot',
  },
  'zh-Hans': {
    server: '开服',
    firstServer: '开你的第一个服务器',
    commandLine: '用命令行开服',
    docker: '在 Docker 中运行服务器',
    installMods: '给服务器安装模组',
    letFriendsJoin: '让朋友连上你的服务器',
    play: '游玩',
    playWithMods: '在 Windows 上玩模组',
    develop: '开发模组',
    firstMod: '你的第一个 LeviLamina 模组',
    firstPlugin: '你的第一个脚本插件',
    firstAndroidMod: '你的第一个 Android 原生模组',
    publishPackage: '用 lip 发布你的模组',
    automate: '自动化',
    bedd: '用 Be.D.D. 驱动游戏客户端',
    bedboo: '你的第一个 bedboo 机器人',
  },
};

/** The tutorial pages, by section: the one list the nav, the redirects of the project docs and the index read. */
export const TUTORIALS = {
  server: ['server/first-server', 'server/command-line', 'server/docker', 'server/install-mods', 'server/let-friends-join'],
  play: ['play/play-with-mods'],
  develop: ['develop/first-levilamina-mod', 'develop/first-script-plugin', 'develop/first-android-mod', 'develop/publish-a-package'],
  automate: ['automate/bedd', 'automate/first-bedboo-bot'],
} as const;

const KEY: Record<string, keyof Labels> = {
  'server/first-server': 'firstServer',
  'server/command-line': 'commandLine',
  'server/docker': 'docker',
  'server/install-mods': 'installMods',
  'server/let-friends-join': 'letFriendsJoin',
  'play/play-with-mods': 'playWithMods',
  'develop/first-levilamina-mod': 'firstMod',
  'develop/first-script-plugin': 'firstPlugin',
  'develop/first-android-mod': 'firstAndroidMod',
  'develop/publish-a-package': 'publishPackage',
  'automate/bedd': 'bedd',
  'automate/first-bedboo-bot': 'bedboo',
};

// Every top-level entry is a section: a header tab with the sidebar tree of its pages (kit "Navigation model").
const nav = (p: string, t: Labels): NavEntry[] =>
  (Object.keys(TUTORIALS) as (keyof typeof TUTORIALS)[]).map((section) => ({
    text: t[section],
    items: TUTORIALS[section].map((page) => ({ text: t[KEY[page]!], link: `${p}${page}/` })),
  }));

export default defineDocsConfig({
  base: '/tutorials/',
  title: 'LeviMC Tutorials',
  titleTemplate: ':title - LeviMC Tutorials',
  description: 'Step-by-step tutorials for LeviMC: run a modded Minecraft Bedrock server, play with mods, write your first mod, automate the game.',
  project: 'tutorials',
  logo: { src: 'https://levimc.org/logos/LeviLamina.webp', alt: 'LeviMC' },
  contentDir: 'content',
  repo,
  editLink: `${repo}/edit/main/tutorials/content/:path`,
  hostname: 'https://levimc.org',
  sitemap: { hostname: 'https://levimc.org' },
  i18n: {
    mode: 'folder',
    defaultLocale: 'en',
    locales: [
      { code: 'en', label: 'English', lang: 'en', prefix: '' },
      { code: 'zh-Hans', label: '简体中文', lang: 'zh-Hans', prefix: 'zh-Hans/' },
      { code: 'zh-Hant', label: '繁體中文', lang: 'zh-Hant', prefix: 'zh-Hant/', convertFrom: 'zh-Hans' },
    ],
  },
  urlStyle: 'directory',
  slug: 'vitepress',
  markdown: { compat: 'commonmark', containers: { vitepress: true } },
  outline: [2, 3],
  sidebar: 'tabs',
  nav: { en: nav('/', LABELS.en), 'zh-Hans': nav('/zh-Hans/', LABELS['zh-Hans']) },
});
