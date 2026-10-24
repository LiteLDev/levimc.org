// Cross-site registry for LeviMC. Every URL here is the exact, redirect-free canonical form
// (trailing slash on directory URLs, https, no www unless the host requires it). Verified by
// scripts/linkcheck.mjs --external. Do not "simplify" these.

import type { PixelIconName } from './pixel-icons';
import type { UiStrings } from './i18n';

export const LINKS = {
  home: 'https://levimc.org/',
  community: 'https://levimc.org/community/',
  about: 'https://levimc.org/about/',
  /** Donations (linked from the footer: it has no bar tab). */
  support: 'https://levimc.org/support/',
  /** LeviMC Mods (it was pkg.levimc.org). */
  mods: 'https://levimc.org/mods/',
  /** The blog moved into levimc.org (blog.levimc.org no longer resolves). */
  blog: 'https://levimc.org/blog/',
  github: 'https://github.com/LiteLDev',
} as const;

/**
 * Tabs of the GlobalBar. `projects` is the Projects menu (kit 2: it replaces the Docs menu and the former
 * levimc.org/projects/ page); on docs.levimc.org it is the current tab, with the open project marked in it.
 */
export type SiteId = 'home' | 'projects' | 'community' | 'about' | 'mods' | 'blog';

export type ProjectGroupId = 'core' | 'launchers' | 'mods';

export type ProjectId =
  | 'LeviLamina'
  | 'LegacyScriptEngine'
  | 'lip'
  | 'LeviLauncher'
  | 'LeviLaunchroid'
  | 'LeviOptimize'
  | 'LeviAntiCheat'
  | 'MoreDimensions';

export interface Project {
  id: ProjectId;
  name: string;
  group: ProjectGroupId;
  /** GitHub repository. */
  repo: string;
  /** Documentation site, when the project has one. */
  docs?: string;
  icon: PixelIconName;
}

/**
 * Every LeviMC project, in the order of the Projects menu (grouped by `group`, see PROJECT_GROUPS). This is the one
 * list of projects: the bar's Projects menu, the docs.levimc.org root and levimc.org's project cards all read it.
 */
export const PROJECTS: readonly Project[] = [
  { id: 'LeviLamina', name: 'LeviLamina', group: 'core', repo: 'https://github.com/LiteLDev/LeviLamina', docs: 'https://docs.levimc.org/LeviLamina/', icon: 'grass' },
  {
    id: 'LegacyScriptEngine',
    name: 'LegacyScriptEngine',
    group: 'core',
    repo: 'https://github.com/LiteLDev/LegacyScriptEngine',
    docs: 'https://docs.levimc.org/LegacyScriptEngine/',
    icon: 'bookQuill',
  },
  { id: 'lip', name: 'lip', group: 'core', repo: 'https://github.com/LiteLDev/lip', docs: 'https://docs.levimc.org/lip/', icon: 'chest' },
  { id: 'LeviLauncher', name: 'LeviLauncher', group: 'launchers', repo: 'https://github.com/LiteLDev/LeviLauncher', docs: 'https://docs.levimc.org/LeviLauncher/', icon: 'map' },
  {
    id: 'LeviLaunchroid',
    name: 'LeviLaunchroid',
    group: 'launchers',
    repo: 'https://github.com/LiteLDev/LeviLaunchroid',
    docs: 'https://docs.levimc.org/LeviLaunchroid/',
    icon: 'pickaxe',
  },
  { id: 'LeviOptimize', name: 'LeviOptimize', group: 'mods', repo: 'https://github.com/LiteLDev/LeviOptimize', icon: 'potion' },
  { id: 'LeviAntiCheat', name: 'LeviAntiCheat', group: 'mods', repo: 'https://github.com/LiteLDev/LeviAntiCheat', icon: 'torch' },
  { id: 'MoreDimensions', name: 'MoreDimensions', group: 'mods', repo: 'https://github.com/LiteLDev/MoreDimensions', icon: 'compass' },
];

export const PROJECT_GROUPS: readonly ProjectGroupId[] = ['core', 'launchers', 'mods'];

/** The projects that have a documentation site (docs.levimc.org/<id>/). */
export type DocsProjectId = 'LeviLamina' | 'LegacyScriptEngine' | 'lip' | 'LeviLauncher' | 'LeviLaunchroid';

export interface DocsProject {
  id: DocsProjectId;
  name: string;
  url: string;
  repo: string;
  icon: PixelIconName;
}

/** The projects with docs, in menu order (the docs.levimc.org root's cards). */
export const DOCS_PROJECTS: readonly DocsProject[] = PROJECTS.filter((p) => p.docs).map((p) => ({
  id: p.id as DocsProjectId,
  name: p.name,
  url: p.docs!,
  repo: p.repo,
  icon: p.icon,
}));

export type SocialId = 'discord' | 'telegram' | 'x' | 'youtube' | 'email' | 'github';

export interface SocialLink {
  id: SocialId;
  label: string;
  url: string;
}

export const SOCIAL: readonly SocialLink[] = [
  { id: 'discord', label: 'Discord', url: 'https://discord.gg/v5R5P4vRZk' },
  { id: 'telegram', label: 'Telegram', url: 'https://t.me/LiteLoader' },
  { id: 'x', label: 'X', url: 'https://x.com/levimc_org' },
  { id: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@LeviLamina' },
  { id: 'email', label: 'contact@levimc.org', url: 'mailto:contact@levimc.org' },
];

export const COPYRIGHT_HOLDER = 'LeviMC';

/** levimc.org/mods/ ("LeviMC Mods"): display name and one-line description come from i18n (`modsName`, `modsBlurb`). */
export const MODS_SITE: { id: 'mods'; url: string; icon: PixelIconName } = { id: 'mods', url: LINKS.mods, icon: 'chest' };

export interface GlobalNavEntry {
  id: SiteId;
  label: string;
  /** For `projects` (a menu, not a page): where the tab leads without the menu (the GitHub organisation). */
  url: string;
}

/**
 * The canonical tabs of the GlobalBar, identical on every LeviMC site (kit ≥ 2.0):
 * Home · Projects ▾ · Mods · Blog · Community · About.
 */
export function globalNav(t: UiStrings): GlobalNavEntry[] {
  return [
    { id: 'home', label: t.home, url: LINKS.home },
    { id: 'projects', label: t.projects, url: LINKS.github },
    { id: 'mods', label: t.mods, url: LINKS.mods },
    { id: 'blog', label: t.blog, url: LINKS.blog },
    { id: 'community', label: t.community, url: LINKS.community },
    { id: 'about', label: t.about, url: LINKS.about },
  ];
}

/** Origin of an absolute http(s) URL, lower-cased ('' for anything else). */
export function originOf(url: string): string {
  const m = /^(https?:\/\/[^/?#]+)/i.exec(url);
  return m ? m[1]!.toLowerCase() : '';
}

/**
 * For links rendered by a router: the root-relative path of `url` when it belongs to `siteOrigin`
 * (e.g. 'https://levimc.org/about/' on levimc.org → '/about/'), else undefined (an ordinary cross-site link).
 * Two apps share levimc.org (the site, and LeviMC Mods at /mods/): each passes `isAppPath` for its own part.
 */
export function sameSitePath(url: string, siteOrigin: string | undefined): string | undefined {
  if (!siteOrigin) return undefined;
  const o = originOf(url);
  if (!o || o !== siteOrigin.replace(/\/+$/, '').toLowerCase()) return undefined;
  return url.slice(o.length) || '/';
}

