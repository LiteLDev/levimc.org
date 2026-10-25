// Demo docs site for levimc-kit: MkDocs-style site (suffix i18n, directory URLs, pymdownx slugs,
// Python-Markdown compat) built from real LeviLamina / LegacyScriptEngine / lip / LeviLauncher fixtures.
import { defineDocsConfig } from './kit/docs/node/config.ts';

export default defineDocsConfig({
  base: '/Demo/',
  title: 'LeviMC Kit',
  description: 'Demo of the levimc-kit design system and static docs engine.',
  logo: 'logo.svg',
  favicon: 'favicon.ico',
  project: 'Demo',
  repo: 'https://github.com/LiteLDev',
  // The demo mixes fixtures from three repositories: map each source back to where it really lives.
  editLink: {
    pattern: (source) =>
      source.startsWith('apis/')
        ? `https://github.com/LiteLDev/LegacyScriptEngine/edit/main/docs/${source}`
        : source.startsWith('daemon/')
          ? `https://github.com/LiteLDev/lip/edit/main/docs/${source.replace(/\.zh\.md$/, '.md').replace(/^/, source.endsWith('.zh.md') ? 'zh/' : '')}`
          : /^(api_reference|developer_guides|user_guides)\//.test(source)
            ? `https://github.com/LiteLDev/LeviLamina/edit/develop/docs/main/contents/${source}`
            : undefined,
  },
  contentDir: 'content',
  hostname: 'https://docs.levimc.org',
  sitemap: { hostname: 'https://docs.levimc.org' },
  i18n: {
    mode: 'suffix',
    defaultLocale: 'en',
    locales: [
      { code: 'en', label: 'English', lang: 'en' },
      { code: 'zh', label: '简体中文', lang: 'zh' },
      // generated from the zh pages (kit 2.7)
      { code: 'zh-Hant', label: '繁體中文', lang: 'zh-Hant', convertFrom: 'zh' },
    ],
  },
  urlStyle: 'directory',
  slug: 'pymdownx',
  markdown: { compat: 'python-markdown', containers: { mkdocs: true, vitepress: true } },
  layouts: { showcase: './showcase/Showcase.tsx' },
  sidebar: 'tabs',
  nav: [
    { Home: 'index.md' },
    { Showcase: 'showcase.md' },
    {
      LeviLamina: [
        { 'User Guides': ['user_guides/install.md'] },
        {
          'How-to Guides': [
            'developer_guides/how_to_guides/find_function_guide.md',
            'developer_guides/how_to_guides/hook_guide.md',
            'developer_guides/how_to_guides/coro_guide.md',
            'developer_guides/how_to_guides/form_guide.md',
            'developer_guides/how_to_guides/data_driven_ui_guide.md',
          ],
        },
        {
          'API Reference': [
            { Base: 'api_reference/base.md' },
            { Chrono: 'api_reference/chrono.md' },
            { Config: 'api_reference/config.md' },
            { Coroutine: 'api_reference/coro.md' },
            { Data: 'api_reference/data.md' },
            { 'Data-driven UI': 'api_reference/data_driven_ui.md' },
            { Expected: 'api_reference/expected.md' },
            { Form: 'api_reference/form.md' },
            { I18n: 'api_reference/i18n.md' },
            { 'IO & Logger': 'api_reference/io.md' },
            { Mod: 'api_reference/mod.md' },
            { Reflection: 'api_reference/reflection.md' },
            { 'Reflection (Advanced)': 'api_reference/reflection_advanced.md' },
            { Thread: 'api_reference/thread.md' },
          ],
        },
      ],
    },
    {
      LegacyScriptEngine: [
        { DataAPI: ['apis/DataAPI/DataBase.md'] },
        { EventAPI: ['apis/EventAPI/BlockEvents.md'] },
        { NbtAPI: ['apis/NbtAPI/NBTList.md', 'apis/NbtAPI/NBTCompound.md'] },
        { ScriptAPI: ['apis/ScriptAPI/i18n.md'] },
      ],
    },
    { lip: ['daemon/overview.md', 'daemon/json_rpc_spec.md'] },
    { About: 'https://levimc.org/about/' },
  ],
  navTranslations: {
    zh: {
      Home: '主页',
      Showcase: '组件展示',
      'User Guides': '用户指南',
      'How-to Guides': '如何做到······',
      'API Reference': 'API 参考',
      Base: '基础类型',
      Chrono: '游戏时间',
      Config: '配置系统',
      Coroutine: '协程',
      Data: '数据结构',
      'Data-driven UI': '数据驱动 UI',
      Expected: '错误处理',
      Form: '表单 UI',
      I18n: '国际化',
      'IO & Logger': '日志系统',
      Mod: '模组系统',
      Reflection: '反射',
      'Reflection (Advanced)': '反射（进阶）',
      Thread: '线程工具',
      About: '关于我们',
    },
  },
  social: [{ icon: 'github', link: 'https://github.com/LiteLDev' }],
  footer: { copyright: 'Fixtures © LiteLDev contributors' },
});
