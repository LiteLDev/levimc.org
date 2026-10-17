// The site's routes. Canonical URLs use the trailing-slash form (GitHub Pages serves /projects/ from
// projects/index.html with 200; /projects would be a 301), so every link points at these paths exactly.
import type { Messages } from './i18n';

export const SITE_ORIGIN = 'https://levimc.org';

export type RouteId = 'home' | 'projects' | 'features' | 'community' | 'about' | 'support';

export const ROUTES: readonly { id: RouteId; path: string }[] = [
  { id: 'home', path: '/' },
  { id: 'projects', path: '/projects/' },
  { id: 'features', path: '/features/' },
  { id: 'community', path: '/community/' },
  { id: 'about', path: '/about/' },
  { id: 'support', path: '/support/' },
];

/** Every prerendered route (used by prerender.mjs). */
export const ROUTE_PATHS: string[] = ROUTES.map((r) => r.path);
/** Rendered into 404.html. */
export const NOT_FOUND_PATH = '/404';

export const pathOf = (id: RouteId): string => ROUTES.find((r) => r.id === id)!.path;

/** Route id for a pathname (with or without the trailing slash), or null for unknown paths. */
export function routeIdOf(pathname: string): RouteId | null {
  const p = pathname.endsWith('/') ? pathname : pathname + '/';
  return ROUTES.find((r) => r.path === p)?.id ?? null;
}

export const HOME_TITLE = 'LeviMC - Open Source Bedrock Modding Framework';

/** <title> and meta description of a route, built from the site's existing copy. */
export function routeMeta(id: RouteId | null, t: Messages): { title: string; description: string } {
  const hero = `${t.hero.description} ${t.hero.descriptionHighlight}${t.hero.descriptionEnd} C++${t.hero.descriptionLanguages} JavaScript, Lua, Python ${t.hero.descriptionLSE}`;
  switch (id) {
    case 'home':
      return { title: HOME_TITLE, description: hero.replace(/\s+([。，])/g, '$1') };
    case 'projects':
      return { title: `${t.projects.allProjectsTitle} - LeviMC`, description: t.projects.allProjectsDesc };
    case 'features':
      return { title: `${t.nav.features} - LeviMC`, description: t.features.description };
    case 'community':
      return { title: `${t.nav.community} - LeviMC`, description: t.community.description };
    case 'about':
      return { title: `${t.about.pageTitle}`, description: t.about.pageSubtitle };
    case 'support':
      return { title: `${t.support.pageTitle}`, description: t.support.pageDesc };
    default:
      return { title: `404 - LeviMC`, description: hero };
  }
}
