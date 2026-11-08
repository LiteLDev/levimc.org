import { useEffect, useRef, useState } from 'react';
import type { NavItem, RouteMeta, SidebarData } from '../../shared/types';
import { href, langOf, site } from '../data';
import { docsStrings } from '../../shared/strings';
import { KitLink } from './KitLink';
import { Sidebar } from './Sidebar';
import { useFocusTrap } from './focus';
import { afterPaint, revealIn } from './reveal';
import { BrandIcon, PixelIcon } from '../../../components/PixelIcon';
import { BrandMark, GlobalNavList } from '../../../components/GlobalBar';
import type { UiStrings } from '../../../components/i18n';

/**
 * The docs' one menu (phones and tablets, or when the section tabs do not fit), opened by the LeviMC bar's menu
 * button: the site's sections, the current section's tree (titled with the section), the resources (header.links
 * and the repository), then the LeviMC network links of the bar. The Doxygen API pages render the same markup
 * (kit/static): keep the class names in sync.
 *
 * The body is rendered only once the drawer was first opened: until then the closed drawer is an empty shell
 * (no second sidebar, no network list to hydrate and style on every page).
 */
export function MobileDrawer({
  open,
  onClose,
  route,
  locale,
  sidebar,
  path,
  t,
  chromeLang,
  chromeT,
}: {
  open: boolean;
  onClose: () => void;
  route?: RouteMeta;
  locale: string;
  sidebar?: SidebarData;
  path: string;
  t: UiStrings;
  /** Language and strings of the LeviMC chrome — the same the bar gets, so its links read the same here. */
  chromeLang: string;
  chromeT: UiStrings;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(false);
  if (open && !opened) setOpened(true);
  useFocusTrap(ref, open, onClose);
  // open the drawer with the current page's link in view
  useEffect(() => {
    if (!open) return;
    return afterPaint(() => {
      const d = ref.current;
      revealIn(d, d?.querySelector<HTMLElement>('.kit-sb-link.is-active') ?? d?.querySelector<HTMLElement>('.kit-drawer-link.is-active') ?? null, 'center');
    });
  }, [open, path]);
  const items: NavItem[] = site.nav[locale] ?? [];
  const resources = site.resources?.[locale] ?? [];
  const ds = docsStrings(langOf(locale));
  return (
    <div className="kit-drawer-root" data-open={open ? '' : undefined} hidden={!open}>
      <div className="kit-drawer-scrim" onClick={onClose} aria-hidden="true" />
      <div ref={ref} id="kit-drawer" className="kit-drawer" role="dialog" aria-modal="true" aria-label={t.menu}>
        <div className="kit-drawer-head">
          <KitLink className="kit-drawer-brand" href={href(site.homePaths[locale] ?? '')} onClick={onClose}>
            {site.logo ? <img className="kit-site-logo" src={site.logo.src} alt="" width={24} height={24} /> : <PixelIcon name="grass" size={24} className="kit-site-logo" />}
            <span className="kit-drawer-title">{site.title}</span>
          </KitLink>
          <button type="button" className="mc-icon-btn" onClick={onClose} aria-label={t.close} data-autofocus="">
            <PixelIcon name="close" />
          </button>
        </div>
        {opened ? (
          <>
            {items.length ? (
              <nav className="kit-drawer-nav" aria-label={t.mainNav}>
                <ul>
                  {items.map((it, i) => {
                    // a dropdown tab (deprecated nav form): its links as a titled group
                    if (it.items)
                      return (
                        <li key={i} className="kit-drawer-group">
                          <span className="kit-drawer-group-title">{it.text}</span>
                          <ul>
                            {it.items.map((c, j) =>
                              c.link === undefined ? null : (
                                <li key={j}>
                                  {c.external ? (
                                    <a href={c.link} target="_blank" rel="noopener" className="kit-drawer-link">
                                      {c.text}
                                      <PixelIcon name="external" />
                                    </a>
                                  ) : (
                                    <KitLink
                                      href={href(c.link)}
                                      className={c.link === path ? 'kit-drawer-link is-active' : 'kit-drawer-link'}
                                      aria-current={c.link === path ? 'page' : undefined}
                                      onClick={onClose}
                                    >
                                      {c.text}
                                    </KitLink>
                                  )}
                                </li>
                              ),
                            )}
                          </ul>
                        </li>
                      );
                    if (it.link === undefined) return null;
                    const active = route?.nav === i;
                    return (
                      <li key={i}>
                        {it.external ? (
                          <a href={it.link} target="_blank" rel="noopener" className="kit-drawer-link">
                            {it.text}
                            <PixelIcon name="external" />
                          </a>
                        ) : (
                          <KitLink href={href(it.link)} className={active ? 'kit-drawer-link is-active' : 'kit-drawer-link'} aria-current={active ? 'true' : undefined} onClick={onClose}>
                            {it.text}
                          </KitLink>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ) : null}
            {sidebar ? (
              <div className="kit-drawer-sidebar">
                <Sidebar data={sidebar} path={path} label={t.sidebarNav} onNavigate={onClose} />
              </div>
            ) : null}
            {resources.length ? (
              <nav className="kit-drawer-resources" aria-label={ds.resources}>
                <p className="kit-drawer-section-title">{ds.resources}</p>
                <ul>
                  {resources.map((r) => (
                    <li key={r.kind + r.link}>
                      {r.external ? (
                        <a href={r.link} target="_blank" rel="noopener" className="kit-drawer-link" data-kit-resource={r.kind}>
                          <span className="kit-drawer-link-label">
                            {r.kind === 'github' ? <BrandIcon name="github" size={16} /> : null}
                            {r.text}
                          </span>
                          <PixelIcon name="external" />
                        </a>
                      ) : (
                        <KitLink href={href(r.link)} className={r.link === path ? 'kit-drawer-link is-active' : 'kit-drawer-link'} data-kit-resource={r.kind} onClick={onClose}>
                          {r.text}
                        </KitLink>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
            <nav className="kit-drawer-network" aria-label={chromeT.network} lang={chromeLang}>
              <GlobalNavList
                currentProject={site.project}
                locale={chromeLang}
                strings={chromeT}
                heading={
                  <p className="kit-drawer-network-title">
                    <BrandMark />
                    <span>LeviMC</span>
                  </p>
                }
              />
            </nav>
          </>
        ) : null}
      </div>
    </div>
  );
}
