import { useEffect, useRef, useState } from 'react';
import { newTabProps, opensInNewTab } from '../../../components/projects.ts';
import type { NavItem, ResourceLink, RouteMeta, SidebarData } from '../../shared/types';
import { href, site } from '../data';
import { KitLink } from './KitLink';
import { SidebarTree } from './Sidebar';
import { afterPaint, revealIn } from './reveal';
import { PixelIcon, BrandIcon, type BrandIconName } from '../../../components/PixelIcon';
import type { UiStrings } from '../../../components/i18n';

/** The tree of section `i` (tabs mode: one sidebar per section), else the page's own sidebar for the active section. */
function treeOf(locale: string, i: number, item: NavItem, active: boolean, route?: RouteMeta): SidebarData | undefined {
  const tab = site.sidebars[`${locale}:tab${i}`];
  if (tab) return tab;
  if (active && route?.sidebar) return site.sidebars[route.sidebar];
  // VitePress-style dropdown: its links are the section's tree
  return item.items ? { items: item.items } : undefined;
}

function firstLink(items: NavItem[]): string | undefined {
  for (const it of items) {
    if (it.link !== undefined && !it.external) return it.link;
    const inner = it.items ? firstLink(it.items) : undefined;
    if (inner !== undefined) return inner;
  }
  return undefined;
}

function Section({ item, tree, active, path, idPrefix, onNavigate }: { item: NavItem; tree: SidebarData; active: boolean; path: string; idPrefix: string; onNavigate?: () => void }) {
  const [open, setOpen] = useState(active);
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);
  const listId = `kit-sn-${idPrefix}`;
  return (
    <li className={active ? 'kit-sn-section is-active' : 'kit-sn-section'}>
      <button type="button" className="kit-sn-section-btn" aria-expanded={open} aria-controls={listId} onClick={() => setOpen(!open)}>
        <span>{item.text}</span>
        <PixelIcon name="chevronRight" className="kit-sb-chevron" />
      </button>
      <div id={listId} className="kit-sn-tree" hidden={!open}>
        <SidebarTree data={tree} path={path} onNavigate={onNavigate} idPrefix={`${idPrefix}-`} />
      </div>
    </li>
  );
}

function Resource({ r }: { r: ResourceLink }) {
  const url = r.external ? r.link : href(r.link);
  const ext = r.external && opensInNewTab(r.link);
  const body =
    r.kind === 'github' ? (
      <>
        <BrandIcon name="github" size={16} />
        <span>{r.text}</span>
      </>
    ) : (
      <span>{r.text}</span>
    );
  const cls = r.kind === 'download' ? 'mc-btn mc-btn-primary kit-sn-download' : 'kit-sn-resource';
  return r.external ? (
    <a className={cls} href={url} {...newTabProps(r.link)} data-kit-resource={r.kind}>
      {body}
      {ext && r.kind !== 'download' ? <PixelIcon name="external" className="kit-sb-ext" /> : null}
    </a>
  ) : (
    <KitLink className={cls} href={url} data-kit-resource={r.kind}>
      {body}
    </KitLink>
  );
}

/**
 * The site's navigation, in the left column of every docs page (kit 2.22: it replaces the docs' header row): the
 * brand (logo + name → the docs home), every section of the site — the current one open with its tree, the others
 * one click from theirs —, then the resources (Download, the repository). Search lives in the LeviMC bar above.
 */
export function SiteNav({ route, locale, t, onNavigate }: { route?: RouteMeta; locale: string; t: UiStrings; onNavigate?: () => void }) {
  const items = site.nav[locale] ?? [];
  const resources = site.resources?.[locale] ?? [];
  const home = href(site.homePaths[locale] ?? '');
  const path = route?.path ?? '';
  const ref = useRef<HTMLElement>(null);
  const revealed = useRef(false);
  // keep the current page's link in view in the sticky column
  useEffect(
    () =>
      afterPaint(() => {
        const nav = ref.current;
        revealIn(nav?.closest<HTMLElement>('.kit-doc-sidebar-inner') ?? null, nav?.querySelector<HTMLElement>('.kit-sb-link.is-active') ?? null, revealed.current ? 'nearest' : 'center');
        revealed.current = true;
      }),
    [path],
  );
  const isHome = path === (site.homePaths[locale] ?? '');
  return (
    <nav ref={ref} className="kit-sitenav" aria-label={t.mainNav}>
      <KitLink className={isHome ? 'kit-site-brand kit-sn-brand is-active' : 'kit-site-brand kit-sn-brand'} href={home} aria-current={isHome ? 'page' : undefined} onClick={onNavigate}>
        {site.logo ? <img className="kit-site-logo" src={site.logo.src} alt="" width={28} height={28} /> : <PixelIcon name="grass" size={28} className="kit-site-logo" />}
        <span className="kit-site-title">{site.title}</span>
      </KitLink>
      {items.length ? (
        <ul className="kit-sn-sections">
          {items.map((it, i) => {
            const active = route?.nav === i;
            const tree = treeOf(locale, i, it, active, route);
            if (tree && tree.items.length) return <Section key={i} item={it} tree={tree} active={active} path={path} idPrefix={String(i)} onNavigate={onNavigate} />;
            if (it.external && it.link)
              return (
                <li key={i} className="kit-sn-section">
                  <a className="kit-sn-section-btn kit-sn-section-link" href={it.link} {...newTabProps(it.link)}>
                    <span>{it.text}</span>
                    {opensInNewTab(it.link) ? <PixelIcon name="external" className="kit-sb-ext" /> : null}
                  </a>
                </li>
              );
            const link = it.link ?? (it.items ? firstLink(it.items) : undefined);
            return link !== undefined ? (
              <li key={i} className={active ? 'kit-sn-section is-active' : 'kit-sn-section'}>
                <KitLink className="kit-sn-section-btn kit-sn-section-link" href={href(link)} aria-current={active ? 'true' : undefined} onClick={onNavigate}>
                  <span>{it.text}</span>
                </KitLink>
              </li>
            ) : null;
          })}
        </ul>
      ) : null}
      {resources.length || site.social.length ? (
        <div className="kit-sn-resources" data-kit-resources="">
          {resources.map((r) => (
            <Resource key={r.kind + r.link} r={r} />
          ))}
          {site.social.map((s) => (
            <a key={s.link} className="kit-sn-resource" href={s.link} {...newTabProps(s.link)}>
              <BrandIcon name={(s.icon as BrandIconName) ?? 'github'} size={16} />
              <span>{s.label ?? s.icon}</span>
            </a>
          ))}
        </div>
      ) : null}
    </nav>
  );
}
