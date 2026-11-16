// The site's routes. Canonical URLs use the trailing-slash form (GitHub Pages serves /projects/ from
// projects/index.html with 200; /projects would be a 301), so every link points at these paths exactly.
// Every page exists in each locale (src/i18n/config.ts): /about/, /zh-Hans/about/, /zh-Hant/about/. The blog's posts
// and pages are the exception: they are written in one language (Chinese) and have one URL each (/blog/…, as on the
// old blog), shown in the language they are written in; the blog's listings (index, tags, categories, archives)
// exist in every locale.
import type { Messages } from './i18n';
import { DEFAULT_LOCALE, LOCALES, localeOfTag, splitLocale, withLocale, type Locale } from './i18n/config';
import { BLOG_ROUTES, blog, resolveBlogPath, type BlogView } from './blog/data';
import { MODS_PATH, OTHER_SITES, TUTORIALS_PATH, withoutLanguage } from './other-sites';
import { localizeNetworkUrl } from '../kit/components/projects.ts';

export const SITE_ORIGIN = 'https://levimc.org';

/** LeviMC Mods: its own app in mods/, built separately and deployed into dist/mods/ (see .github/workflows/deploy.yml). */
export { MODS_PATH, TUTORIALS_PATH } from './other-sites.ts';

export type RouteId = 'home' | 'community' | 'about' | 'support' | 'blog';

export const ROUTES: readonly { id: RouteId; path: string }[] = [
  { id: 'home', path: '/' },
  { id: 'community', path: '/community/' },
  { id: 'about', path: '/about/' },
  { id: 'support', path: '/support/' },
  { id: 'blog', path: '/blog/' },
];

/**
 * The pages that are chunks of their own (React.lazy, see App.tsx) by their source module (the key in Vite's
 * manifest), so prerender.mjs can modulepreload the chunk of the page each file shows. Keep in step with App.tsx.
 */
export const ROUTE_MODULES: Partial<Record<RouteId, string>> = {
  community: 'src/pages/Community.tsx',
  about: 'src/pages/About.tsx',
  support: 'src/pages/Support.tsx',
  blog: 'src/blog/Blog.tsx',
};

/** A blog post or one of the blog's pages: written in one language, at one URL (never prefixed with a locale). */
const isBlogDoc = (view: BlogView | null) => view?.kind === 'post' || view?.kind === 'page';
/** The language a blog post or page is written in (the pages are Chinese, like the posts). */
const docLang = (view: BlogView) => (view.kind === 'post' ? view.post.lang : 'zh-CN');

/** Every prerendered route (used by prerender.mjs): the pages above and the blog's listings in every locale, plus each blog post and page once. */
export const ROUTE_PATHS: string[] = [
  ...new Set([
    ...LOCALES.flatMap((l) => [...ROUTES.map((r) => r.path), ...BLOG_ROUTES.filter((p) => !isBlogDoc(resolveBlogPath(p)))].map((p) => withLocale(p, l.code))),
    ...BLOG_ROUTES.filter((p) => isBlogDoc(resolveBlogPath(p))),
  ]),
];
/** Rendered into 404.html. */
export const NOT_FOUND_PATH = '/404';

export const pathOf = (id: RouteId): string => ROUTES.find((r) => r.id === id)!.path;

/**
 * The canonical form of a pathname that GitHub Pages serves with the same file: repeated slashes collapsed
 * and a trailing "index.html" dropped ("/about/index.html" and "/about//" both serve about/index.html).
 */
export function canonicalPath(pathname: string): string {
  return pathname.replace(/\/{2,}/g, '/').replace(/(^|\/)index\.html$/, '$1') || '/';
}

export interface PageInfo {
  /** The page's route, or null for unknown paths (the 404 page). */
  id: RouteId | null;
  /** The locale of the URL (its prefix; English without one). */
  urlLocale: Locale;
  /** The language the page is shown in: the URL's, but a blog post's or page's own language (they have no prefix). */
  locale: Locale;
  /** The canonical path below the locale prefix ('/zh-Hans/about/' → '/about/'), with the trailing slash. */
  path: string;
  /** What a blog URL shows (null: not a blog page). */
  blogView: BlogView | null;
}

/**
 * What a pathname shows (with or without the trailing slash, or ending in index.html, with or without a locale
 * prefix). Matching is case-sensitive like GitHub Pages: /About/ is a 404 there, so it is one here too.
 */
export function pageInfo(pathname: string): PageInfo {
  const c = canonicalPath(pathname);
  const { locale: urlLocale, path: rest } = splitLocale(c);
  const path = rest.endsWith('/') ? rest : rest + '/';
  const routeId = ROUTES.find((r) => r.path === path)?.id ?? null;
  let blogView = routeId && routeId !== 'blog' ? null : resolveBlogPath(path);
  // a post or page has no locale-prefixed URL
  if (isBlogDoc(blogView) && urlLocale !== DEFAULT_LOCALE) blogView = null;
  const id = routeId ?? (blogView ? 'blog' : null);
  const locale = blogView && isBlogDoc(blogView) ? localeOfTag(docLang(blogView)) : urlLocale;
  return { id, urlLocale, locale, path, blogView };
}

/**
 * Route id for a pathname (with or without the trailing slash, or ending in index.html, with or without a locale
 * prefix), or null for unknown paths.
 */
export function routeIdOf(pathname: string): RouteId | null {
  return pageInfo(pathname).id;
}

/** The locale the page at `pathname` is shown in (see {@link PageInfo.locale}). */
export const localeOfPath = (pathname: string): Locale => pageInfo(pathname).locale;

/** The site's own path (root-relative, unprefixed, may carry ?query / #hash) in `locale`; blog posts and pages keep their one URL. */
export function localizePath(path: string, locale: Locale): string {
  const bare = path.replace(/[?#].*$/, '');
  if (bare.startsWith('/blog/') && isBlogDoc(resolveBlogPath(bare.endsWith('/') ? bare : bare + '/'))) return path;
  return withLocale(path, locale);
}

/** The builds with the same locales as this site (zh-Hans, zh-Hant): LeviMC Mods and the tutorials. */
const LOCALIZED_SITES = [MODS_PATH, TUTORIALS_PATH];
const PROJECT_PATHS = OTHER_SITES.filter((p) => !LOCALIZED_SITES.includes(p));
const LOCALE_SEGMENT = new RegExp(`^(?:${LOCALES.filter((l) => l.prefix).map((l) => l.prefix.slice(0, -1)).join('|')})(?:/|$)`);

/**
 * A link on levimc.org in `locale`. The language is the first segment of every levimc.org URL (2026-11-16): the
 * site's own pages, LeviMC Mods and the tutorials get the locale prefix (/about/ → /zh-Hans/about/, /mods/ →
 * /zh-Hans/mods/); a link that names a locale already (first, or after the base as the URLs did before) stays; the
 * projects' docs (always absolute) get theirs from the kit (localizeNetworkUrl); other origins stay as they are.
 * Other levimc.org URLs come back root-relative.
 */
export function localizeHref(href: string, locale: Locale): string {
  const path = href.startsWith(SITE_ORIGIN + '/') ? href.slice(SITE_ORIGIN.length) : href;
  if (!path.startsWith('/') || path.startsWith('//')) return href;
  // the projects' docs: their canonical absolute URL, in the page's language (kit localizeNetworkUrl: their root would
  // redirect otherwise)
  if (PROJECT_PATHS.some((p) => withoutLanguage(path).startsWith(p))) return localizeNetworkUrl(SITE_ORIGIN + path, locale);
  if (locale === DEFAULT_LOCALE) return path;
  if (LOCALE_SEGMENT.test(path.slice(1))) return path;
  const site = LOCALIZED_SITES.find((p) => path.startsWith(p));
  if (site) return LOCALE_SEGMENT.test(path.slice(site.length)) ? path : withLocale(path, locale);
  return localizePath(path, locale);
}

/**
 * The page at `pathname` in each locale (hreflang alternates and the language menu): every page has one per locale,
 * a blog post or page only its own URL (null for the other locales); null for unknown paths.
 */
export function localeAlternates(pathname: string): Record<Locale, string | null> | null {
  const info = pageInfo(pathname);
  if (!info.id) return null;
  const doc = isBlogDoc(info.blogView);
  return Object.fromEntries(LOCALES.map((l) => [l.code, doc ? (l.code === info.locale ? info.path : null) : withLocale(info.path, l.code)])) as Record<Locale, string | null>;
}

export const HOME_TITLE = 'LeviMC - Open-Source Tools for Minecraft Bedrock';

/**
 * The site's name in every <title>. Titles follow one convention across the LeviMC sites (kit 2.19, D7):
 * "<Page> - LeviMC" for the site's pages (the home keeps HOME_TITLE), "<Page> - <Section> - LeviMC" inside the
 * blog (and LeviMC Mods: "<mod> - Mods - LeviMC"), "Page not found - LeviMC" for the 404; the docs use
 * "<Page> - <Project> Docs".
 */
export const SITE_NAME = 'LeviMC';
const titled = (...parts: string[]) => [...parts, SITE_NAME].join(' - ');

/** <title> and meta description of a page, built from the site's existing copy (and the blog's posts). */
export function routeMeta(pathname: string, t: Messages): { title: string; description: string } {
  const hero = t.hero.tagline;
  const id = routeIdOf(pathname);
  switch (id) {
    case 'home':
      return { title: HOME_TITLE, description: hero };
    case 'community':
      return { title: titled(t.nav.community), description: t.community.description };
    case 'about':
      return { title: titled(t.nav.about), description: t.about.pageSubtitle };
    case 'support':
      return { title: titled(t.nav.support), description: t.support.pageDesc };
    case 'blog':
      return blogMeta(pathname, t);
    default:
      return { title: titled(t.meta.notFound), description: hero };
  }
}

function blogMeta(pathname: string, t: Messages): { title: string; description: string } {
  const view = pageInfo(pathname).blogView;
  const b = t.blog;
  const section = t.meta.blog;
  const inBlog = (title: string) => titled(title, section);
  const paged = (title: string, page: number) => (page > 1 ? `${title} (${b.page(page)})` : title);
  const description = b.tagline;
  if (!view) return { title: titled(section), description };
  switch (view.kind) {
    case 'index':
      return { title: view.page > 1 ? inBlog(b.page(view.page)) : titled(section), description };
    case 'post':
      return { title: inBlog(view.post.title), description: view.post.excerpt };
    case 'page':
      return { title: inBlog(blog.pages[view.name]?.title ?? view.name), description };
    case 'tags':
      return { title: inBlog(b.tags), description };
    case 'categories':
      return { title: inBlog(b.categories), description };
    case 'tag':
      return { title: inBlog(paged(b.tagTitle(view.term.name), view.page)), description };
    case 'category':
      return { title: inBlog(paged(b.categoryTitle(view.term.name), view.page)), description };
    case 'archives':
      return { title: inBlog(paged(view.year ? b.archiveTitle(view.year, view.month) : b.archives, view.page)), description };
  }
}
