import { useRef, type ComponentType, type ReactNode } from 'react';
import { PixelIcon, BrandIcon } from './PixelIcon';
import { useDismissableDetails } from './menu';
import { uiStrings, type UiStrings } from './i18n';
import { DOCS_PROJECTS, LINKS, globalNav, type DocsProjectId, type SiteId } from './projects';
import type { LinkLikeProps } from './LocaleSwitcher';

/** One entry of the bar. `id: 'docs'` renders the Docs menu; `id: 'home'` also sets the brand link. */
export interface GlobalNavItem {
  id: string;
  label: string;
  url: string;
}

export interface GlobalBarProps {
  /** Which LeviMC site this is (highlights the matching item; with custom `items`, any item id). */
  current?: SiteId | (string & {});
  /** On docs.levimc.org: which project's docs are open. */
  currentDocs?: DocsProjectId | string;
  /** UI locale (any BCP-47 tag). */
  locale?: string;
  strings?: Partial<UiStrings>;
  /** Extra controls rendered at the right end (e.g. ThemeToggle/LocaleSwitcher on non-docs sites). */
  end?: ReactNode;
  /**
   * Replaces the default network items (`globalNav()`), e.g. on levimc.org, where the bar is also the
   * site's own navigation. Root-relative URLs (`/about/`) are rendered with `linkComponent`.
   */
  items?: GlobalNavItem[];
  /** Router-aware link component for root-relative item URLs (same-site navigation without a reload). */
  linkComponent?: ComponentType<LinkLikeProps>;
  className?: string;
}

function DocsMenuPanel({ t, currentDocs }: { t: UiStrings; currentDocs?: string }) {
  return (
    <div className="kit-gbar-docs-grid">
      {DOCS_PROJECTS.map((p) => (
        <a key={p.id} href={p.url} className="kit-gbar-docs-item" aria-current={p.id === currentDocs ? 'page' : undefined}>
          <span className="kit-slot kit-gbar-docs-slot" aria-hidden="true">
            <PixelIcon name={p.icon} size={16} />
          </span>
          <span className="kit-gbar-docs-text">
            <span className="kit-gbar-docs-name">{p.name}</span>
            <span className="kit-gbar-docs-blurb">{t.projectBlurbs[p.id]}</span>
          </span>
        </a>
      ))}
    </div>
  );
}

const isSameSite = (url: string) => url.startsWith('/') && !url.startsWith('//');

/**
 * The thin cross-site bar shown at the very top of every LeviMC site (levimc.org, pkg.levimc.org,
 * docs.levimc.org/*, Doxygen API pages). Uses <details> dropdowns so it works without JavaScript.
 */
export function GlobalBar({ current, currentDocs, locale, strings, end, items: customItems, linkComponent, className }: GlobalBarProps) {
  const t = uiStrings(locale, strings);
  const docsRef = useRef<HTMLDetailsElement>(null);
  const moreRef = useRef<HTMLDetailsElement>(null);
  useDismissableDetails(docsRef);
  useDismissableDetails(moreRef);
  const items: GlobalNavItem[] = customItems ?? globalNav(t);
  const homeItem = items.find((i) => i.id === 'home');
  const homeUrl = homeItem?.url ?? LINKS.home;
  const isCurrent = (id: string) => (id === current ? 'page' : undefined);
  const RouterLink = linkComponent;
  const link = (url: string, props: { className: string; 'aria-current'?: 'page' }, children: ReactNode, key?: string) =>
    RouterLink && isSameSite(url) ? (
      <RouterLink key={key} href={url} {...props}>
        {children}
      </RouterLink>
    ) : (
      <a key={key} className={props.className} href={url} aria-current={props['aria-current']}>
        {children}
      </a>
    );

  return (
    <div className={className ? `kit-gbar ${className}` : 'kit-gbar'} data-kit-globalbar="">
      <div className="kit-gbar-inner">
        {link(
          homeUrl,
          // with a Home entry in the nav, that entry is the one marked as the current page
          { className: 'kit-gbar-brand', 'aria-current': homeItem ? undefined : isCurrent('home') },
          <>
            <PixelIcon name="grass" size={16} />
            <span className="kit-gbar-brand-text">LeviMC</span>
          </>,
        )}
        <nav className="kit-gbar-nav" aria-label={t.network}>
          <ul>
            {items.map((item) =>
              item.id === 'docs' ? (
                <li key={item.id}>
                  <details ref={docsRef} className="kit-menu kit-gbar-docs">
                    <summary className="kit-gbar-link" aria-current={isCurrent('docs')}>
                      {item.label}
                      <PixelIcon name="chevronDown" className="kit-menu-chevron" />
                    </summary>
                    <div className="kit-menu-panel kit-gbar-docs-panel">
                      <DocsMenuPanel t={t} currentDocs={currentDocs} />
                    </div>
                  </details>
                </li>
              ) : (
                <li key={item.id}>{link(item.url, { className: 'kit-gbar-link', 'aria-current': isCurrent(item.id) }, item.label)}</li>
              ),
            )}
          </ul>
        </nav>
        <div className="kit-gbar-end">
          {end}
          <a className="kit-gbar-icon" href={LINKS.github} aria-label="GitHub" title="GitHub">
            <BrandIcon name="github" size={16} />
          </a>
          <details ref={moreRef} className="kit-menu kit-gbar-more">
            <summary className="kit-gbar-icon" aria-label={t.network} title={t.network}>
              <PixelIcon name="apps" />
            </summary>
            <div className="kit-menu-panel kit-gbar-more-panel">
              <nav aria-label={t.network}>
                {link(homeUrl, { className: 'kit-gbar-more-link', 'aria-current': isCurrent('home') }, t.home)}
                {items
                  .filter((i) => i.id !== 'docs' && i.id !== 'home')
                  .map((item) => link(item.url, { className: 'kit-gbar-more-link', 'aria-current': isCurrent(item.id) }, item.label, item.id))}
                <p className="kit-gbar-more-heading">{t.docs}</p>
                <DocsMenuPanel t={t} currentDocs={currentDocs} />
              </nav>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
