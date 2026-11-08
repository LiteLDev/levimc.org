// Navigation: MkDocs nav trees (untitled entries take the page H1 per locale, group titles translated via
// nav_translations, external links allowed) and VitePress nav/sidebar objects (single or multi-sidebar).

import { posix } from 'node:path';
import type { NavEntry, ResolvedConfig, SidebarConfig } from './config.ts';
import type { ContentScan, PageRoute } from './content.ts';
import { findSource } from './links.ts';
import type { NavItem, SidebarData } from '../shared/types.ts';

type Node =
  | { kind: 'page'; key: string; locale?: string; text?: string; external?: false }
  | { kind: 'link'; text: string; href: string; internal?: boolean }
  | { kind: 'group'; text: string; children: Node[]; collapsed?: boolean };

const isExternal = (s: string) => /^[a-z][a-z0-9+.-]*:|^\/\//i.test(s);

function findSourceForNav(scan: ContentScan, cfg: ResolvedConfig, link: string): { key: string; locale?: string } | null {
  let p = link.split('#')[0]!.split('?')[0]!;
  if (p.startsWith(cfg.base)) p = p.slice(cfg.base.length);
  p = posix.normalize(p.replace(/^\/+/, '') || '.').replace(/^\.$/, '');
  const found = findSource({ cfg, scan }, p);
  if (found) return { key: found.src.key, locale: found.explicit ? found.src.locale : undefined };
  const direct = scan.byPath.get(p) ?? scan.byPath.get(p + '/');
  if (direct) return { key: direct.key, locale: direct.locale };
  return null;
}

export function parseNav(entries: NavEntry[], scan: ContentScan, cfg: ResolvedConfig, warn: (m: string) => void): Node[] {
  const out: Node[] = [];
  const asTarget = (text: string | undefined, link: string): Node | null => {
    if (isExternal(link)) {
      // own-site absolute URL pointing into this build → internal page, or a same-site link (below)
      if (cfg.hostname && link.startsWith(cfg.hostname + cfg.base)) {
        const t = findSourceForNav(scan, cfg, link.slice(cfg.hostname.length));
        if (t) return { kind: 'page', key: t.key, locale: t.locale, text };
        return { kind: 'link', text: text ?? link, href: link.slice(cfg.hostname.length + cfg.base.length), internal: true };
      }
      return { kind: 'link', text: text ?? link, href: link };
    }
    const t = findSourceForNav(scan, cfg, link);
    // a root-absolute path under base that is no page of the docs (e.g. the Doxygen output merged into dist/api/):
    // a link of this site, opened in place like a page
    if (!t && link.startsWith(cfg.base)) return { kind: 'link', text: text ?? link, href: link.slice(cfg.base.length), internal: true };
    if (!t) {
      warn(`nav: cannot resolve '${link}'`);
      return null;
    }
    return { kind: 'page', key: t.key, locale: t.locale, text };
  };
  for (const e of entries) {
    if (typeof e === 'string') {
      const n = asTarget(undefined, e);
      if (n) out.push(n);
    } else if ('items' in e && Array.isArray(e.items)) {
      const children = parseNav(e.items as NavEntry[], scan, cfg, warn);
      if (typeof e.link === 'string' && e.link) {
        const head = asTarget(String(e.text), e.link);
        if (head) children.unshift(head);
      }
      out.push({ kind: 'group', text: String(e.text), children, collapsed: (e as { collapsed?: boolean }).collapsed });
    } else if ('link' in e && typeof e.link === 'string') {
      const n = asTarget(typeof e.text === 'string' ? e.text : undefined, e.link);
      if (n) out.push(n);
    } else {
      for (const [title, v] of Object.entries(e as Record<string, string | NavEntry[]>)) {
        if (typeof v === 'string') {
          const n = asTarget(title, v);
          if (n) out.push(n);
        } else if (Array.isArray(v)) out.push({ kind: 'group', text: title, children: parseNav(v, scan, cfg, warn) });
      }
    }
  }
  return out;
}

export interface NavBuildInput {
  cfg: ResolvedConfig;
  scan: ContentScan;
  /** route id → page title in that locale */
  titles: Map<string, string>;
  warn: (m: string) => void;
}

export interface NavPlacement {
  sidebar?: string;
  nav?: number;
  prev?: { text: string; path: string };
  next?: { text: string; path: string };
}

export interface NavBuildResult {
  nav: Record<string, NavItem[]>;
  sidebars: Record<string, SidebarData>;
  /** route id → { sidebar id, nav index, prev, next } */
  placement: Map<string, NavPlacement>;
  /** `${locale}:${key}` → explicit (translated) nav title, for pages listed with a title in the nav. */
  navTitles: Map<string, string>;
}

/** Sections whose sidebar holds at most this many links open every group; longer ones only the current page's. */
export const OPEN_ALL_MAX_LINKS = 24;

/** The home page is never a section's page, a pager target or a tab (the brand links it). */
export const HOME_KEY = 'index';

export function countLinks(items: NavItem[]): number {
  let n = 0;
  for (const it of items) {
    if (it.link !== undefined) n++;
    if (it.items) n += countLinks(it.items);
  }
  return n;
}

/** Pager order of a tree: every internal page once, depth first, without the home page. */
function flatten(items: NavItem[], acc: NavItem[] = []): NavItem[] {
  for (const it of items) {
    // `link !== undefined`: the default locale's home path is '' (falsy) — test presence, not truthiness
    if (it.link !== undefined && it.key && it.key !== HOME_KEY && !it.external && !acc.some((a) => a.link === it.link)) acc.push(it);
    if (it.items) flatten(it.items, acc);
  }
  return acc;
}

const contains = (it: NavItem, key: string): boolean => it.key === key || !!it.items?.some((c) => contains(c, key));

function firstLink(items: NavItem[]): NavItem | undefined {
  for (const it of items) {
    if (it.link !== undefined && !it.external) return it;
    if (it.items) {
      const f = firstLink(it.items);
      if (f) return f;
    }
  }
  return undefined;
}

function pager(flat: NavItem[], key: string): Pick<NavPlacement, 'prev' | 'next'> {
  const pos = flat.findIndex((it) => it.key === key);
  if (pos < 0) return {};
  const at = (i: number) => (i >= 0 && i < flat.length ? { text: flat[i]!.text, path: flat[i]!.link! } : undefined);
  return { prev: at(pos - 1), next: at(pos + 1) };
}

/**
 * One sidebar policy for every docs site (kit 2.19): the section's title over its tree; every group open when
 * the section is short (≤ OPEN_ALL_MAX_LINKS links, or `sidebarExpand`), else only the group(s) holding the
 * current page (plus groups marked `collapsed: false`).
 */
function sidebarOf(cfg: ResolvedConfig, items: NavItem[], title?: string): SidebarData {
  return { ...(title ? { title } : {}), items, openAll: !!cfg.sidebarExpand || countLinks(items) <= OPEN_ALL_MAX_LINKS };
}

export function buildNavigation({ cfg, scan, titles, warn }: NavBuildInput): NavBuildResult {
  const nav: Record<string, NavItem[]> = {};
  const sidebars: Record<string, SidebarData> = {};
  const placement: NavBuildResult['placement'] = new Map();
  const navTitles = new Map<string, string>();
  // nav lint runs per locale, but each problem is reported once
  const warned = new Set<string>();
  const warnOnce = (m: string) => {
    if (warned.has(m)) return;
    warned.add(m);
    warn(m);
  };
  const perLocale = <T,>(v: T[] | Record<string, T[]> | undefined, code: string): T[] | undefined => {
    if (!v) return undefined;
    if (Array.isArray(v)) return v;
    return v[code] ?? v[cfg.defaultLocale];
  };
  const tr = (code: string, text: string) => cfg.navTranslations?.[code]?.[text] ?? text;

  const convertedFrom = new Map(cfg.locales.filter((l) => l.convertFrom).map((l) => [l.code, l.convertFrom!]));
  const routeOf = (key: string, locale: string | undefined, code: string): PageRoute | undefined => {
    const m = scan.byKey.get(key);
    if (!m) return undefined;
    // a converted locale's nav (derived from its source locale's) names the source locale's pages: use its own
    const want = locale !== undefined && convertedFrom.get(code) === locale ? code : locale;
    return m.get(want ?? code) ?? m.get(cfg.defaultLocale) ?? [...m.values()][0];
  };

  const materialize = (nodes: Node[], code: string): NavItem[] =>
    nodes
      .map((n): NavItem | null => {
        if (n.kind === 'link') return n.internal ? { text: tr(code, n.text), link: n.href } : { text: tr(code, n.text), link: n.href, external: true };
        if (n.kind === 'page') {
          const r = routeOf(n.key, n.locale, code);
          if (!r) return null;
          if (n.text && !navTitles.has(`${code}:${n.key}`)) navTitles.set(`${code}:${n.key}`, tr(code, n.text));
          return { text: n.text ? tr(code, n.text) : (titles.get(r.id) ?? n.key), link: r.path, key: r.key };
        }
        return { text: tr(code, n.text), items: materialize(n.children, code), collapsed: n.collapsed };
      })
      .filter((x): x is NavItem => !!x);

  const mode = cfg.sidebar === undefined ? 'tabs' : cfg.sidebar;
  const isMkdocsMode = mode === 'tabs' || mode === 'tree';
  if (mode && typeof mode === 'object') {
    warn(
      "sidebar: the object form (VitePress sidebar / multi-sidebar by URL prefix) is deprecated since kit 2.19 — use sidebar: 'tabs' " +
        'with one nav section per sidebar tree (README: Site config API). It keeps working for now.',
    );
  }

  for (const loc of cfg.locales) {
    const code = loc.code;
    const navEntries = perLocale<NavEntry>(cfg.nav as NavEntry[] | Record<string, NavEntry[]> | undefined, code) ?? [];
    const tree = materialize(parseNav(navEntries, scan, cfg, warn), code);

    if (isMkdocsMode) {
      if (mode === 'tabs' && loc.isDefault) {
        // the canonical IA (kit 2.19): every top-level entry is a section = one sidebar tree; the brand is the
        // only home link and external resources go to header.links
        for (const it of tree) {
          if (it.items) {
            if (!firstLink(it.items)) warnOnce(`nav: section '${it.text}' has no page`);
            continue;
          }
          if (it.external) warnOnce(`nav: top-level entry '${it.text}' is not a section (an external link: put it in header.links)`);
          else if (it.key === HOME_KEY) warnOnce(`nav: top-level entry '${it.text}' is not a section (the home page: the brand already links it, remove the entry)`);
          else if (it.key) warnOnce(`nav: top-level entry '${it.text}' is not a section (a single page: put it into a section, e.g. its 'Help' group)`);
        }
      }
      // header: top-level entries; groups link to their first page
      nav[code] = tree.map((it) => {
        if (!it.items) return { ...it, activePrefix: undefined };
        const f = firstLink(it.items);
        return { text: it.text, link: f?.link, key: f?.key, items: undefined };
      });
      if (mode === 'tree') sidebars[`${code}:tree`] = sidebarOf(cfg, tree);
      tree.forEach((it, i) => {
        if (mode === 'tabs' && it.items) sidebars[`${code}:tab${i}`] = sidebarOf(cfg, it.items, it.text);
      });
      // prev/next: inside the active section (tabs) or the whole tree ('tree'); never the home page
      const flats = tree.map((it) => (it.items ? flatten(it.items) : []));
      const flatAll = mode === 'tree' ? flatten(tree) : [];
      for (const r of scan.routes.filter((x) => x.locale === code)) {
        const isHome = r.key === HOME_KEY;
        const idx = isHome ? -1 : tree.findIndex((it) => contains(it, r.key));
        const sidebar = isHome ? undefined : mode === 'tree' ? `${code}:tree` : idx >= 0 && tree[idx]!.items ? `${code}:tab${idx}` : undefined;
        placement.set(r.id, {
          sidebar,
          nav: idx >= 0 ? idx : undefined,
          ...(isHome ? {} : mode === 'tree' ? pager(flatAll, r.key) : idx >= 0 ? pager(flats[idx]!, r.key) : {}),
        });
      }
    } else {
      // VitePress: explicit nav + sidebar(s) (deprecated for LeviMC sites, see the warning above)
      const prefixOf = (link: string) => posix.dirname('/' + link).replace(/^\/$/, '') + '/';
      // N4: a header link claims its folder as active prefix, unless that folder is a locale root: the link
      // '/ja-JP/download' must not light up on every ja-JP page (it is active on its own page only)
      const roots = new Set(['/', ...cfg.locales.map((l) => '/' + l.prefix)]);
      nav[code] = tree.map((it) => {
        const p = it.link !== undefined && !it.external && !it.items ? prefixOf(it.link) : undefined;
        return { ...it, activePrefix: p && !roots.has(p) ? p : undefined };
      });
      // active prefixes per header item (build-time only): its own, or a dropdown's internal links'
      const navPrefixes = nav[code]!.map((it) =>
        it.activePrefix ? [it.activePrefix] : [...new Set((it.items ?? []).filter((c) => c.link && !c.external).map((c) => prefixOf(c.link!)))],
      );
      let sb: SidebarConfig | undefined;
      if (mode && typeof mode === 'object') {
        const rec = mode as Record<string, SidebarConfig> | SidebarConfig;
        if (Array.isArray(rec)) sb = rec;
        else {
          const keys = Object.keys(rec);
          const looksLikeLocales = keys.every((k) => cfg.locales.some((l) => l.code === k));
          sb = looksLikeLocales ? (rec as Record<string, SidebarConfig>)[code] : (rec as SidebarConfig);
        }
      }
      const groups: { prefix: string; id: string; items: NavItem[]; flat: NavItem[] }[] = [];
      if (Array.isArray(sb)) {
        const id = `${code}:main`;
        const items = materialize(parseNav(sb, scan, cfg, warn), code);
        sidebars[id] = sidebarOf(cfg, items);
        groups.push({ prefix: '/', id, items, flat: flatten(items) });
      } else if (sb) {
        Object.entries(sb).forEach(([prefix, entries], i) => {
          const id = `${code}:sb${i}`;
          const items = materialize(parseNav(entries, scan, cfg, warn), code);
          sidebars[id] = sidebarOf(cfg, items);
          groups.push({ prefix: prefix.startsWith('/') ? prefix : '/' + prefix, id, items, flat: flatten(items) });
        });
      }
      for (const r of scan.routes.filter((x) => x.locale === code)) {
        if (r.key === HOME_KEY) {
          placement.set(r.id, {});
          continue;
        }
        const url = '/' + r.path;
        // N4: a sidebar that lists the page wins over the URL prefix (a 'Help' group may link a page outside its folder)
        const g =
          groups.find((x) => x.items.some((it) => contains(it, r.key))) ??
          groups.filter((x) => url.startsWith(x.prefix) || ('/' + r.source.rel).startsWith(x.prefix)).sort((a, b) => b.prefix.length - a.prefix.length)[0];
        // header item: exact match first, then a dropdown listing the page (VitePress), then the link into the
        // page's sidebar, else the longest active
        // prefix; on a tie a plain link beats a dropdown, then the earlier item wins
        const items = nav[code]!;
        let navIdx = items.findIndex((it) => it.key === r.key);
        if (navIdx < 0) navIdx = items.findIndex((it) => !!it.items && contains(it, r.key));
        // the header link whose page is in this page's sidebar (privacy-policy listed in the /guide/ sidebar → Guide)
        if (navIdx < 0 && g) navIdx = items.findIndex((it) => !it.items && !!it.key && g.items.some((x) => contains(x, it.key!)));
        if (navIdx < 0) {
          let best = -1;
          let bestLen = 1;
          navPrefixes.forEach((prefixes, i) => {
            for (const p of prefixes) {
              if (!url.startsWith(p)) continue;
              const tieWin = p.length === bestLen && best >= 0 && !!items[best]!.items && !items[i]!.items;
              if (p.length > bestLen || tieWin) {
                best = i;
                bestLen = p.length;
              }
            }
          });
          navIdx = best;
        }
        placement.set(r.id, { sidebar: g?.id, nav: navIdx >= 0 ? navIdx : undefined, ...(g ? pager(g.flat, r.key) : {}) });
      }
    }
  }
  return { nav, sidebars, placement, navTitles };
}
