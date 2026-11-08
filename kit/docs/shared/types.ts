// Data shapes shared by the build (docs/node) and the runtime app (docs/app).
// Everything here is plain JSON so it can be serialised into virtual modules and page HTML.

export interface LocaleInfo {
  code: string;
  label: string;
  lang: string;
  /** URL prefix relative to base: '' for the default locale, e.g. 'zh/' or 'zh-CN/'. */
  prefix: string;
}

export interface NavLink {
  text: string;
  /** Path relative to base (internal) or absolute URL (external). */
  link: string;
  external?: boolean;
  /** For internal links: the page key, used for active-state matching. */
  key?: string;
}

export interface NavItem extends Partial<NavLink> {
  text: string;
  items?: NavItem[];
  /** Internal path prefix that marks this item active (relative to base). */
  activePrefix?: string;
  collapsed?: boolean;
}

export interface TocEntry {
  level: number;
  id: string;
  text: string;
}

export interface HeroData {
  name?: string;
  text?: string;
  tagline?: string;
  image?: { src: string; alt?: string; width?: number; height?: number };
  /**
   * `platform` (windows, android, ios, macos, linux): the action is for that platform. When the visitor is on one of
   * the actions' platforms, its actions come first as brand buttons and the other platforms' turn alt.
   */
  actions?: { theme?: 'brand' | 'alt'; text: string; link: string; external?: boolean; platform?: string }[];
}

export interface FeatureData {
  title: string;
  details?: string;
  icon?: string;
  link?: string;
  linkText?: string;
  external?: boolean;
}

export interface RouteMeta {
  /** Canonical path relative to base ('' = site root). */
  path: string;
  locale: string;
  /** Page module id (stable, URL-safe). */
  page: string;
  /** Page key without locale (e.g. 'api_reference/data'). */
  key: string;
  title: string;
  description?: string;
  /** 'doc' | 'home' | 'page' | a custom layout name from config.layouts */
  layout: string;
  /** Locale code → canonical path of the same page in that locale. */
  alternates: Record<string, string>;
  /** Source path relative to the content dir (for edit links). */
  source?: string;
  lastUpdated?: number;
  /** Last-updated date, formatted at build time in the route's locale (no Intl at hydration). */
  updated?: { iso: string; text: string };
  /** "Edit this page" URL (computed at build time from config.editLink). */
  editUrl?: string;
  /** True when the page shows default-locale content at a localized URL (missing translation). */
  fallback?: boolean;
  sidebar?: string;
  nav?: number;
  prev?: { text: string; path: string };
  next?: { text: string; path: string };
}

/**
 * Per-page metadata that is not needed for routing: kept out of the route table in the client bundle and
 * delivered with the page (its chunk / the embedded #kit-page-data); the app merges it into the route.
 */
export type PageMeta = Pick<RouteMeta, 'description' | 'source' | 'editUrl' | 'lastUpdated' | 'updated' | 'prev' | 'next'>;
export const PAGE_META_KEYS = ['description', 'source', 'editUrl', 'lastUpdated', 'updated', 'prev', 'next'] as const;

export interface SidebarData {
  /** The section's name (tabs mode): shown over the tree. */
  title?: string;
  items: NavItem[];
  /**
   * Every group starts open (short sections, see nav.ts OPEN_ALL_MAX_LINKS, or `sidebarExpand`); otherwise only the
   * group(s) holding the current page. Groups marked `collapsed: false` are always open, `collapsed: true` closed.
   */
  openAll?: boolean;
}

/** The fixed RESOURCES slot at the end of the docs header (and in the drawer): config header.links, then the repo. */
export interface ResourceLink {
  kind: 'download' | 'changelog' | 'github';
  /** Label in the locale (the GitHub one is the accessible name of the icon button). */
  text: string;
  /** Path relative to base (internal) or absolute URL. */
  link: string;
  external?: boolean;
}

export interface SiteData {
  base: string;
  title: string;
  description: string;
  hostname?: string;
  logo?: { src: string; alt: string; dark?: string };
  /** og:image path (base-resolved) or absolute URL; falls back to logo.src. */
  ogImage?: string;
  favicon?: string;
  project?: string;
  siteKey: string;
  urlStyle: 'directory' | 'html';
  cleanUrls: boolean;
  defaultLocale: string;
  locales: LocaleInfo[];
  nav: Record<string, NavItem[]>;
  sidebars: Record<string, SidebarData>;
  social: { icon: string; link: string; label?: string }[];
  editLink?: { text?: Record<string, string> };
  footer?: { message?: string; copyright?: string };
  outline: [number, number];
  search: Record<string, string>;
  ui: Record<string, Record<string, unknown>>;
  titleTemplate: string;
  lastUpdated: boolean;
  homePaths: Record<string, string>;
  /** Docs header layout (config `header`). */
  header: { tabsRow: boolean | 'auto' };
  /** The project's repository (config `repo`, else a `social` GitHub link): the GitHub icon of the resources slot. */
  github?: string;
  /** locale → the resources slot (header.links + the repository), labels resolved. */
  resources: Record<string, ResourceLink[]>;
}

export interface PageData {
  html: string;
  toc: TocEntry[];
  meta?: PageMeta;
  hero?: HeroData;
  features?: FeatureData[];
  frontmatter?: Record<string, unknown>;
}

/** Embedded into every prerendered page as <script type="application/json" id="kit-page-data">. */
export interface EmbeddedPageData {
  page: string;
  toc: TocEntry[];
  meta?: PageMeta;
  hero?: HeroData;
  features?: FeatureData[];
  frontmatter?: Record<string, unknown>;
}

export interface SearchDoc {
  id: number;
  /** Section heading (or page title for the intro section). */
  title: string;
  /** Page title. */
  page: string;
  /** Breadcrumb trail (group titles), may be empty. */
  crumbs: string;
  /** Path relative to base, with #anchor. */
  path: string;
  text: string;
}
