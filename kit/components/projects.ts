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
  /** Tutorials for every project, end to end (kit 2.21): a docs build of levimc.org's repository. */
  tutorials: 'https://levimc.org/tutorials/',
  /** Questions and answers for every project (kit 2.25): a docs build of levimc.org's repository. */
  faq: 'https://levimc.org/faq/',
  /** LeviMC Mods (it was pkg.levimc.org). */
  mods: 'https://levimc.org/mods/',
  /** The blog moved into levimc.org (blog.levimc.org no longer resolves). */
  blog: 'https://levimc.org/blog/',
  github: 'https://github.com/LiteLDev',
  /** Project logos (levimc.org's public/logos/, built by scripts/build-logos.mjs): <base><ProjectId>.webp, 128×128. */
  logos: 'https://levimc.org/logos/',
} as const;

/**
 * Tabs of the GlobalBar. `projects` is the Projects menu (kit 2: it replaces the Docs menu and the former
 * levimc.org/projects/ page); on a project's docs (levimc.org/<Project>/) it is the current tab, with the open project marked in it.
 */
export type SiteId = 'home' | 'tutorials' | 'faq' | 'projects' | 'community' | 'about' | 'mods' | 'blog';

export type ProjectGroupId = 'core' | 'mods';

export type ProjectId =
  | 'LeviLamina'
  | 'LegacyScriptEngine'
  | 'LeviStone'
  | 'lip'
  | 'LeviLauncher'
  | 'BeDD'
  | 'bedboo'
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
  /** Page on LeviMC Mods (levimc.org/mods/<tooth>/), for the official mods and the core projects installed as mods. */
  mod?: string;
  /** The project's logo (square, 128×128): its own where it has one, else one in the kit's style. */
  logo: string;
  /** @deprecated kit < 2.5 showed a pixel sprite; kept for sites that still read it. Show `logo`. */
  icon: PixelIconName;
  /**
   * The docs' languages besides English and zh-Hans / zh-Hant (every LeviMC site has those): base language → the
   * URL's first segment, e.g. `{ es: 'es' }` for levimc.org/es/LeviLauncher/ (kit 2.23, {@link localizeNetworkUrl}).
   */
  docsLocales?: Record<string, string>;
  /** Paths under the docs that have no languages (relative to the docs URL), e.g. LeviLamina's Doxygen `api/`. */
  docsUnlocalized?: string[];
}

const logo = (id: ProjectId) => `${LINKS.logos}${id}.webp`;
const modPage = (repo: string) => `${LINKS.mods}github.com/LiteLDev/${repo}/`;

/**
 * Every LeviMC project, in the order of the Projects menu (grouped by `group`, see PROJECT_GROUPS). This is the one
 * list of projects: the bar's Projects menu, the docs' 404 page and levimc.org's project cards all read it.
 */
export const PROJECTS: readonly Project[] = [
  {
    id: 'LeviLamina',
    name: 'LeviLamina',
    group: 'core',
    repo: 'https://github.com/LiteLDev/LeviLamina',
    docs: 'https://levimc.org/LeviLamina/',
    logo: logo('LeviLamina'),
    icon: 'grass',
    docsUnlocalized: ['api/'],
  },
  {
    id: 'LegacyScriptEngine',
    name: 'LegacyScriptEngine',
    group: 'core',
    repo: 'https://github.com/LiteLDev/LegacyScriptEngine',
    docs: 'https://levimc.org/LegacyScriptEngine/',
    logo: logo('LegacyScriptEngine'),
    icon: 'bookQuill',
  },
  { id: 'LeviStone', name: 'LeviStone', group: 'core', repo: 'https://github.com/LiteLDev/LeviStone', logo: logo('LeviStone'), icon: 'emerald' },
  { id: 'lip', name: 'lip', group: 'core', repo: 'https://github.com/LiteLDev/lip', docs: 'https://levimc.org/lip/', logo: logo('lip'), icon: 'chest' },
  {
    id: 'LeviLauncher',
    name: 'LeviLauncher',
    group: 'core',
    repo: 'https://github.com/LiteLDev/LeviLauncher',
    docs: 'https://levimc.org/LeviLauncher/',
    logo: logo('LeviLauncher'),
    icon: 'map',
    docsLocales: { es: 'es', ru: 'ru', de: 'de', ja: 'ja', ko: 'ko', fr: 'fr' },
  },
  { id: 'BeDD', name: 'Be.D.D.', group: 'core', repo: 'https://github.com/LiteLDev/BeDD', docs: 'https://levimc.org/BeDD/', logo: logo('BeDD'), icon: 'monitor' },
  { id: 'bedboo', name: 'bedboo', group: 'core', repo: 'https://github.com/LiteLDev/bedboo', docs: 'https://levimc.org/bedboo/', logo: logo('bedboo'), icon: 'pickaxe' },
  { id: 'LeviOptimize', name: 'LeviOptimize', group: 'mods', repo: 'https://github.com/LiteLDev/LeviOptimize', mod: modPage('LeviOptimize'), logo: logo('LeviOptimize'), icon: 'potion' },
  { id: 'LeviAntiCheat', name: 'LeviAntiCheat', group: 'mods', repo: 'https://github.com/LiteLDev/LeviAntiCheat', mod: modPage('LeviAntiCheat'), logo: logo('LeviAntiCheat'), icon: 'torch' },
  { id: 'MoreDimensions', name: 'MoreDimensions', group: 'mods', repo: 'https://github.com/LiteLDev/MoreDimensions', mod: modPage('MoreDimensions'), logo: logo('MoreDimensions'), icon: 'compass' },
];

/** Where a project leads (its home page): its LeviMC Mods page, else the docs, else the repository. */
export function projectHome(p: Project): string {
  return p.mod ?? p.docs ?? p.repo;
}

export const PROJECT_GROUPS: readonly ProjectGroupId[] = ['core', 'mods'];

/** The projects that have a documentation site (levimc.org/<id>/, published by the project's repository). */
export type DocsProjectId = 'LeviLamina' | 'LegacyScriptEngine' | 'lip' | 'LeviLauncher' | 'BeDD' | 'bedboo';

export interface DocsProject {
  id: DocsProjectId;
  name: string;
  url: string;
  repo: string;
  logo: string;
  /** @deprecated show `logo`. */
  icon: PixelIconName;
}

/** The projects with docs, in menu order (the cards of the docs' 404 page). */
export const DOCS_PROJECTS: readonly DocsProject[] = PROJECTS.filter((p) => p.docs).map((p) => ({
  id: p.id as DocsProjectId,
  name: p.name,
  url: p.docs!,
  repo: p.repo,
  logo: p.logo,
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
 * Home · Tutorials · FAQ · Projects ▾ · Mods · Blog · Community · About.
 */
export function globalNav(t: UiStrings): GlobalNavEntry[] {
  return [
    { id: 'home', label: t.home, url: LINKS.home },
    { id: 'tutorials', label: t.tutorials, url: LINKS.tutorials },
    { id: 'faq', label: t.faq, url: LINKS.faq },
    { id: 'projects', label: t.projects, url: LINKS.github },
    { id: 'mods', label: t.mods, url: LINKS.mods },
    { id: 'blog', label: t.blog, url: LINKS.blog },
    { id: 'community', label: t.community, url: LINKS.community },
    { id: 'about', label: t.about, url: LINKS.about },
  ];
}

/** The origin every LeviMC site shares (the site, /mods/, /tutorials/, /faq/, each project's docs). */
export const NETWORK_ORIGIN = 'https://levimc.org';

/**
 * Whether a link opens in a new tab (kit 2.21.1): an absolute http(s) URL outside levimc.org. Links to another
 * LeviMC site (https://levimc.org/<Project>/…) stay in the tab — a cross-site navigation, with the view transition
 * and prerendering — and get no external-link icon.
 */
export function opensInNewTab(url: string): boolean {
  if (!/^(https?:)?\/\//i.test(url)) return false;
  return originOf(url.startsWith('//') ? 'https:' + url : url) !== NETWORK_ORIGIN;
}

/** `target` / `rel` for a link: a new tab exactly when {@link opensInNewTab}. */
export function newTabProps(url: string): { target?: '_blank'; rel?: string } {
  return opensInNewTab(url) ? { target: '_blank', rel: 'noopener' } : {};
}

/**
 * The first segment of a levimc.org path that names a language (kit 2.23: every language but English is the first
 * segment): zh-Hans, zh-Hant, and the docs' other languages (`docsLocales`).
 */
export const NETWORK_LANGUAGE_SEGMENTS: readonly string[] = [
  'zh-Hans',
  'zh-Hant',
  ...new Set(PROJECTS.flatMap((p) => Object.values(p.docsLocales ?? {}))),
];
/** A path segment that names a language: a network one, or the forms of the URLs before kit 2.23 (zh, es-ES …). */
const LOCALE_SEGMENT = new RegExp(`^(?:${NETWORK_LANGUAGE_SEGMENTS.join('|')}|zh|[a-z]{2}-[A-Z]{2})(?:/|$)`);
const TRADITIONAL = /^zh-(tw|hk|mo|hant)\b/i;

/**
 * A levimc.org link in the visitor's language (kit 2.22.2; language first since kit 2.23): every LeviMC site —
 * levimc.org itself, /mods/, /tutorials/, /faq/ and each project's docs — puts the language FIRST in the path
 * (levimc.org/zh-Hans/about/, /zh-Hans/mods/, /zh-Hant/tutorials/, /zh-Hans/lip/, /ja/LeviLauncher/), so the bar, the
 * Projects menu and the footer link the target in the reader's language directly — without it the target's root
 * would redirect (a second page load: a flash, and a wasted prerender). Chinese goes to zh-Hans / zh-Hant everywhere;
 * other languages only to the docs that have them (`docsLocales`); English, other origins, links naming a language
 * already (first, or after a site's base as before kit 2.23) and paths without languages (`docsUnlocalized`) stay as
 * they are. Absolute and root-relative URLs keep their form.
 */
export function localizeNetworkUrl(url: string, lang: string | undefined): string {
  if (!lang) return url;
  const abs = url.startsWith(NETWORK_ORIGIN + '/');
  const path = abs ? url.slice(NETWORK_ORIGIN.length) : url;
  if (!path.startsWith('/') || path.startsWith('//')) return url;
  if (LOCALE_SEGMENT.test(path.slice(1))) return url;
  const tag = lang.toLowerCase().replace(/_/g, '-');
  const project = PROJECTS.find((p) => p.docs && path.startsWith(new URL(p.docs).pathname));
  const base = project ? new URL(project.docs!).pathname : path.startsWith('/mods/') ? '/mods/' : path.startsWith('/tutorials/') ? '/tutorials/' : path.startsWith('/faq/') ? '/faq/' : '';
  if (base) {
    const rest = path.slice(base.length);
    if (LOCALE_SEGMENT.test(rest) || project?.docsUnlocalized?.some((u) => rest.startsWith(u))) return url;
  }
  const primary = tag.split('-')[0]!;
  const segment = primary === 'zh' ? (TRADITIONAL.test(tag) ? 'zh-Hant' : 'zh-Hans') : project?.docsLocales?.[primary];
  if (!segment) return url;
  return (abs ? NETWORK_ORIGIN : '') + '/' + segment + path;
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

