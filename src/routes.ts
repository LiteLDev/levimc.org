// The site's routes. Canonical URLs use the trailing-slash form (GitHub Pages serves /projects/ from
// projects/index.html with 200; /projects would be a 301), so every link points at these paths exactly.
import type { Messages } from './i18n';
import { BLOG_ROUTES, blog, resolveBlogPath } from './blog/data';

export const SITE_ORIGIN = 'https://levimc.org';

export type RouteId = 'home' | 'community' | 'about' | 'support' | 'blog';

export const ROUTES: readonly { id: RouteId; path: string }[] = [
  { id: 'home', path: '/' },
  { id: 'community', path: '/community/' },
  { id: 'about', path: '/about/' },
  { id: 'support', path: '/support/' },
  { id: 'blog', path: '/blog/' },
];

/**
 * Pages that became sections of the home page (kit 2: the bar's Projects menu replaced the projects page). Each
 * old URL is a redirect page to its section (prerender.mjs), so links and bookmarks keep working.
 */
export const MOVED: Record<string, string> = {
  '/projects/': '/#projects',
  '/features/': '/#features',
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

export const HOME_TITLE = 'LeviMC - Open Source Bedrock Modding Framework';

/** <title> and meta description of a page, built from the site's existing copy (and the blog's posts). */
export function routeMeta(pathname: string, t: Messages): { title: string; description: string } {
  const hero = `${t.hero.description} ${t.hero.descriptionHighlight}${t.hero.descriptionEnd} C++${t.hero.descriptionLanguages} JavaScript, Lua, Python ${t.hero.descriptionLSE}`;
  const id = routeIdOf(pathname);
  switch (id) {
    case 'home':
      return { title: HOME_TITLE, description: hero.replace(/\s+([。，])/g, '$1') };
    case 'community':
      return { title: `${t.nav.community} - LeviMC`, description: t.community.description };
    case 'about':
      return { title: `${t.about.pageTitle}`, description: t.about.pageSubtitle };
    case 'support':
      return { title: `${t.support.pageTitle}`, description: t.support.pageDesc };
    case 'blog':
      return blogMeta(pathname, t);
    default:
      return { title: `404 - LeviMC`, description: hero };
  }
}

function blogMeta(pathname: string, t: Messages): { title: string; description: string } {
  const c = canonicalPath(pathname);
  const view = resolveBlogPath(c.endsWith('/') ? c : c + '/');
  const b = t.blog;
  const site = b.name;
  const paged = (title: string, page: number) => (page > 1 ? `${title} (${b.page(page)})` : title);
  const description = b.tagline;
  if (!view) return { title: site, description };
  switch (view.kind) {
    case 'index':
      return { title: paged(site, view.page), description };
    case 'post':
      return { title: `${view.post.title} - ${site}`, description: view.post.excerpt };
    case 'page':
      return { title: `${blog.pages[view.name]?.title ?? view.name} - ${site}`, description };
    case 'tags':
      return { title: `${b.tags} - ${site}`, description };
    case 'categories':
      return { title: `${b.categories} - ${site}`, description };
    case 'tag':
      return { title: paged(`${b.tagTitle(view.term.name)} - ${site}`, view.page), description };
    case 'category':
      return { title: paged(`${b.categoryTitle(view.term.name)} - ${site}`, view.page), description };
    case 'archives':
      return { title: paged(`${view.year ? b.archiveTitle(view.year, view.month) : b.archives} - ${site}`, view.page), description };
  }
}
