// Second demo: VitePress-style site (folder i18n, .html URLs, VitePress slugs, CommonMark) built from the
// real lip docs. This is what a VitePress → levimc-kit port looks like (compare lip/docs/.vitepress/config.mts).
import { defineDocsConfig, type NavEntry } from './kit/docs/node/config.ts';

const en = (p: string) => p;
const zh = (p: string) => '/zh' + p;

function sidebar(l: (p: string) => string, t: Record<string, string>): Record<string, NavEntry[]> {
  return {
    [l('/intro/')]: [{ text: t.intro!, items: [{ text: t.installation!, link: l('/intro/installation') }, { text: t.quick!, link: l('/intro/quick_start') }] }],
    [l('/concepts/')]: [
      {
        text: t.concepts!,
        items: [
          { text: t.architecture!, link: l('/concepts/architecture') },
          { text: t.manifest!, link: l('/concepts/package_manifest') },
          { text: t.lockfiles!, link: l('/concepts/lockfiles') },
        ],
      },
    ],
    [l('/cli/')]: [
      {
        text: t.cli!,
        items: [
          { text: t.overview!, link: l('/cli/overview') },
          { text: t.configuration!, link: l('/cli/configuration') },
          {
            text: t.commands!,
            items: ['cache_clean', 'config', 'init', 'install', 'list', 'migrate', 'uninstall', 'update', 'version', 'view'].map((c) => ({
              text: c.replace('_', ' '),
              link: l(`/cli/commands/${c}`),
            })),
          },
        ],
      },
    ],
    [l('/daemon/')]: [
      {
        text: t.daemon!,
        items: [
          { text: t.overview!, link: l('/daemon/overview') },
          { text: t.rpc!, link: l('/daemon/json_rpc_spec') },
          { text: t.commands!, items: [{ text: 'run', link: l('/daemon/commands/run') }] },
        ],
      },
    ],
    [l('/guides/')]: [
      {
        text: t.guides!,
        items: [
          { text: t.creating!, link: l('/guides/creating_packages') },
          { text: t.migrating!, link: l('/guides/migrating_packages') },
          { text: t.deps!, link: l('/guides/installing_dependencies') },
          { text: t.managing!, link: l('/guides/managing_configuration') },
          { text: t.internal!, link: l('/guides/internal_mechanism') },
        ],
      },
    ],
  };
}

const EN = {
  intro: 'Introduction',
  installation: 'Installation',
  quick: 'Quick Start',
  concepts: 'Concepts',
  architecture: 'Architecture',
  manifest: 'Package Manifest',
  lockfiles: 'Lockfiles',
  cli: 'CLI Reference',
  overview: 'Overview',
  configuration: 'Configuration',
  commands: 'Commands',
  daemon: 'Daemon (lipd)',
  rpc: 'JSON-RPC Spec',
  guides: 'How-to Guides',
  creating: 'Creating Packages',
  migrating: 'Migrating Packages',
  deps: 'Installing Dependencies',
  managing: 'Managing Configuration',
  internal: 'Internal Mechanism',
};
const ZH = {
  intro: '入门',
  installation: '安装',
  quick: '快速开始',
  concepts: '概念',
  architecture: '架构',
  manifest: '包清单',
  lockfiles: '锁文件',
  cli: 'CLI 参考',
  overview: '概览',
  configuration: '配置',
  commands: '命令',
  daemon: '守护进程（lipd）',
  rpc: 'JSON-RPC 规范',
  guides: '实践指南',
  creating: '创建包',
  migrating: '迁移包',
  deps: '安装依赖',
  managing: '管理配置',
  internal: '内部机制',
};

export default defineDocsConfig({
  base: '/lip/',
  title: 'lip',
  description: 'A general package installer',
  project: 'lip',
  contentDir: 'lip-content',
  outDir: 'dist-lip',
  repo: 'https://github.com/LiteLDev/lip',
  editLink: 'https://github.com/LiteLDev/lip/edit/main/docs/:path',
  hostname: 'https://docs.levimc.org',
  sitemap: { hostname: 'https://docs.levimc.org' },
  i18n: {
    mode: 'folder',
    defaultLocale: 'root',
    locales: [
      { code: 'root', label: 'English', lang: 'en', prefix: '' },
      { code: 'zh', label: '简体中文', lang: 'zh-CN', prefix: 'zh/' },
      { code: 'zh-Hant', label: '繁體中文', lang: 'zh-Hant', prefix: 'zh-Hant/', convertFrom: 'zh' },
    ],
  },
  urlStyle: 'html',
  cleanUrls: false,
  slug: 'vitepress',
  markdown: { compat: 'commonmark' },
  nav: {
    root: [
      { text: 'Intro', link: en('/intro/quick_start') },
      { text: 'Concepts', link: en('/concepts/architecture') },
      { text: 'Guides', link: en('/guides/creating_packages') },
      { text: 'CLI', link: en('/cli/overview') },
      { text: 'Daemon', link: en('/daemon/overview') },
    ],
    zh: [
      { text: '介绍', link: zh('/intro/quick_start') },
      { text: '概念', link: zh('/concepts/architecture') },
      { text: '指南', link: zh('/guides/creating_packages') },
      { text: 'CLI', link: zh('/cli/overview') },
      { text: '守护进程', link: zh('/daemon/overview') },
    ],
  },
  sidebar: { root: sidebar(en, EN), zh: sidebar(zh, ZH) },
  social: [{ icon: 'github', link: 'https://github.com/LiteLDev/lip' }],
});
