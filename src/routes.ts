// The site's routes. Canonical URLs use the trailing-slash form (GitHub Pages serves /projects/ from
// projects/index.html with 200; /projects would be a 301), so every link points at these paths exactly.
import type { Messages } from './i18n';
import { BLOG_ROUTES, blog, resolveBlogPath } from './blog/data';

export const SITE_ORIGIN = 'https://levimc.org';

/** LeviMC Mods: its own app in mods/, built separately and deployed into dist/mods/ (see .github/workflows/deploy.yml). */
export const MODS_PATH = '/mods/';

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

/** Every prerendered route (used by prerender.mjs): the pages above plus every blog page. */
export const ROUTE_PATHS: string[] = [...new Set([...ROUTES.map((r) => r.path), ...BLOG_ROUTES])];
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

/**
 * Route id for a pathname (with or without the trailing slash, or ending in index.html), or null for unknown
 * paths. Matching is case-sensitive like GitHub Pages: /About/ is a 404 there, so it is one here too.
 */
export function routeIdOf(pathname: string): RouteId | null {
  const c = canonicalPath(pathname);
  const p = c.endsWith('/') ? c : c + '/';
  const id = ROUTES.find((r) => r.path === p)?.id ?? null;
  if (id) return id;
  return resolveBlogPath(p) ? 'blog' : null;
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
  const c = canonicalPath(pathname);
  const view = resolveBlogPath(c.endsWith('/') ? c : c + '/');
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
