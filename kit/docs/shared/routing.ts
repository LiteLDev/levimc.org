// Route matching shared by SSR, the client router and the prerenderer.
import type { RouteMeta, SiteData } from './types.ts';

/** What URL mapping needs to know about a site (SiteData, or the build's ResolvedConfig). */
export type SiteUrlInfo = { base: string; locales: readonly { prefix: string }[]; localeFirst?: boolean };

function decode(pathname: string): string {
  try {
    return decodeURI(pathname);
  } catch {
    return pathname;
  }
}

export function stripBase(pathname: string, base: string): string | null {
  return stripDecoded(decode(pathname), base);
}

/** stripBase of a pathname that is decoded already. */
function stripDecoded(p: string, base: string): string | null {
  if (p === base.slice(0, -1)) return '';
  if (!p.startsWith(base)) return null;
  return p.slice(base.length);
}

const sortedPrefixes = new WeakMap<object, string[]>();
/** The locale prefixes of a site, longest first ('' left out); computed once per locales array. */
function prefixes(site: SiteUrlInfo): string[] {
  let list = sortedPrefixes.get(site.locales);
  if (!list) {
    list = site.locales
      .map((l) => l.prefix)
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    sortedPrefixes.set(site.locales, list);
  }
  return list;
}

/**
 * Where a locale's pages live: base + prefix, or (kit 2.23, `i18n.localeFirst`) '/' + prefix + base without its
 * leading slash — /zh-Hans/LeviLamina/ — so the language is the first segment of every levimc.org URL.
 */
export function localeRoot(site: SiteUrlInfo, prefix: string): string {
  return site.localeFirst && prefix ? '/' + prefix + site.base.slice(1) : site.base + prefix;
}

/**
 * The URL pathname of a site path (a route path: the locale prefix, then the page, e.g. 'zh-Hans/guide/').
 * Without localeFirst it is base + path; with it a localized path moves its prefix in front of the base:
 * 'zh-Hans/guide/' on /LeviLamina/ → /zh-Hans/LeviLamina/guide/. Assets, search indexes and _kit/ stay under base
 * (their paths name no locale).
 */
export function pathUrl(site: SiteUrlInfo, path: string): string {
  if (site.localeFirst) {
    const prefix = prefixes(site).find((p) => path.startsWith(p));
    if (prefix) return localeRoot(site, prefix) + path.slice(prefix.length);
  }
  return site.base + path;
}

/**
 * The inverse of {@link pathUrl}: the site path of a URL pathname, or null when the pathname is not this site's.
 * With localeFirst, a localized path under base (/LeviLamina/zh-Hans/x/, the URLs before kit 2.23) is no page of
 * the site: it is a redirect page (formerPrefixes), served as a file.
 */
export function sitePath(site: SiteUrlInfo, pathname: string): string | null {
  if (!site.localeFirst) return stripBase(pathname, site.base);
  const p = decode(pathname);
  for (const prefix of prefixes(site)) {
    const root = localeRoot(site, prefix);
    if (p === root.slice(0, -1)) return prefix;
    if (p.startsWith(root)) return prefix + p.slice(root.length);
  }
  const rel = stripDecoded(p, site.base);
  if (rel === null || prefixes(site).some((x) => rel.startsWith(x))) return null;
  return rel;
}

/** Every URL prefix the site's pages are served under: base, then each locale's root when localeFirst. */
export function siteRoots(site: SiteUrlInfo): string[] {
  return [site.base, ...(site.localeFirst ? prefixes(site).map((p) => localeRoot(site, p)) : [])];
}

/** All the request paths GitHub Pages would serve for a canonical route path. */
export function pathVariants(path: string): string[] {
  const out = [path];
  if (path === '' || path.endsWith('/')) out.push(path + 'index.html', path + 'index');
  else if (path.endsWith('.html')) out.push(path.slice(0, -5));
  else out.push(path + '.html', path + '/');
  return out;
}

export function createRouteMatcher(routes: RouteMeta[]) {
  const map = new Map<string, RouteMeta>();
  for (const r of routes) for (const v of pathVariants(r.path)) if (!map.has(v)) map.set(v, r);
  return (relPath: string | null): RouteMeta | undefined => (relPath === null ? undefined : map.get(relPath));
}

/** Output file (relative to outDir) for a canonical route path. */
export function outFileFor(path: string): string {
  if (path === '' || path.endsWith('/')) return path + 'index.html';
  if (path.endsWith('.html')) return path;
  return path + '.html';
}

/** Locale of an arbitrary path (relative to base) from its prefix. */
export function localeFromPath(site: Pick<SiteData, 'locales' | 'defaultLocale'>, relPath: string | null): string {
  if (relPath) {
    const hit = site.locales.filter((l) => l.prefix && relPath.startsWith(l.prefix)).sort((a, b) => b.prefix.length - a.prefix.length)[0];
    if (hit) return hit.code;
  }
  return site.defaultLocale;
}
