// levimc.org/faq/: the questions people ask about the LeviMC projects, each with a short answer, in one place (the
// tutorials teach a task end to end; the project docs keep the guides and reference). Built from this folder by
// levimc.org's deploy and published at /faq/. English at /faq/, Simplified Chinese at /zh-Hans/faq/ (sources in
// content/zh-Hans/), Traditional Chinese at /zh-Hant/faq/, converted from it: levimc.org's one scheme, the language
// first. The sections follow the tutorials': run a server, play, make mods, script plugins. The pages and their
// order are in nav.ts.
import { defineDocsConfig } from './kit/docs/node/config.ts';
import { NAV } from './nav.ts';

const repo = 'https://github.com/LiteLDev/liteldev.github.io';

export default defineDocsConfig({
  base: '/faq/',
  title: 'LeviMC FAQ',
  titleTemplate: ':title - LeviMC FAQ',
  description: 'Frequently asked questions about LeviMC: running a modded Minecraft Bedrock server with LeviLamina and lip, playing with LeviLauncher, writing mods and script plugins.',
  // marks the FAQ tab of the LeviMC bar (kit 2.25)
  project: 'faq',
  logo: { src: 'https://levimc.org/logos/LeviLamina.webp', alt: 'LeviMC' },
  contentDir: 'content',
  repo,
  editLink: `${repo}/edit/main/faq/content/:path`,
  hostname: 'https://levimc.org',
  sitemap: { hostname: 'https://levimc.org' },
  i18n: {
    mode: 'folder',
    defaultLocale: 'en',
    localeFirst: true,
    locales: [
      { code: 'en', label: 'English', lang: 'en', prefix: '' },
      { code: 'zh-Hans', label: '简体中文', lang: 'zh-Hans', prefix: 'zh-Hans/' },
      { code: 'zh-Hant', label: '繁體中文', lang: 'zh-Hant', prefix: 'zh-Hant/', convertFrom: 'zh-Hans' },
    ],
  },
  urlStyle: 'directory',
  slug: 'vitepress',
  markdown: { compat: 'commonmark', containers: { vitepress: true } },
  // a page lists its questions: the groups (h2) and the questions (h2 or h3)
  outline: [2, 3],
  sidebar: 'tabs',
  nav: NAV,
});
