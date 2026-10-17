import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { BrandIcon, LINKS, LocaleSwitcher, PixelIcon, ThemeToggle, uiStrings, type LinkLikeProps } from '../../kit/components';
import { useFocusTrap } from '../../kit/docs/app/components/focus.ts';
import { useI18n, localeNames, kitLocale, LOCALES, type Locale } from '../i18n';
import { pathOf } from '../routes';
import logoUrl from '../icons/logo.svg';


interface NavItem {
  label: string;
  path: string;
  external?: boolean;
}

function useNavItems(): NavItem[] {
  const { t } = useI18n();
  return [
    { label: t.nav.home, path: pathOf('home') },
    { label: t.nav.mods, path: 'https://pkg.levimc.org/', external: true },
    { label: t.nav.projects, path: pathOf('projects') },
    { label: t.nav.features, path: pathOf('features') },
    { label: t.nav.community, path: pathOf('community') },
    { label: t.nav.about, path: pathOf('about') },
    { label: t.nav.support, path: pathOf('support') },
  ];
}

/** The language is app state (not part of the URL): switching stays on the current page. */
function LocaleLink({ href, children, onClick, ...rest }: LinkLikeProps) {
  return (
    <a
      href={href}
      {...(rest as Record<string, unknown>)}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        // modified clicks (new tab / window) keep the browser's default and do not switch this tab
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        onClick?.(e);
        e.preventDefault();
      }}
    >
      {children}
    </a>
  );
}

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link className="kit-site-brand" to={pathOf('home')} onClick={onClick}>
      <img className="kit-site-logo" src={logoUrl} alt="" width={28} height={28} />
      <span className="kit-site-title">
        Levi<span className="lm-brand-accent">MC</span>
      </span>
    </Link>
  );
}

function MobileDrawer({ items, onClose }: { items: NavItem[]; onClose: () => void }) {
  const { locale } = useI18n();
  const ui = uiStrings(kitLocale[locale]);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true, onClose);
  useEffect(() => {
    document.documentElement.classList.add('kit-scroll-lock');
    return () => document.documentElement.classList.remove('kit-scroll-lock');
  }, []);
  return (
    <div className="kit-drawer-root" data-open="">
      <div className="kit-drawer-scrim" onClick={onClose} aria-hidden="true" />
      <div ref={ref} id="kit-drawer" className="kit-drawer" role="dialog" aria-modal="true" aria-label={ui.menu}>
        <div className="kit-drawer-head">
          <span className="kit-drawer-title">LeviMC</span>
          <button type="button" className="mc-icon-btn" onClick={onClose} aria-label={ui.close} data-autofocus="">
            <PixelIcon name="close" />
          </button>
        </div>
        <nav className="kit-drawer-nav" aria-label={ui.mainNav}>
          <ul>
            {items.map((item) => (
              <li key={item.path}>
                {item.external ? (
                  <a href={item.path} target="_blank" rel="noopener" className="kit-drawer-link" onClick={onClose}>
                    {item.label}
                    <PixelIcon name="external" />
                  </a>
                ) : (
                  <NavLink to={item.path} end className={({ isActive }) => (isActive ? 'kit-drawer-link is-active' : 'kit-drawer-link')} onClick={onClose}>
                    {item.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default function SiteHeader() {
  const { locale, setLocale } = useI18n();
  const ui = uiStrings(kitLocale[locale]);
  const items = useNavItems();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer whenever the route changes.
  useEffect(() => setDrawerOpen(false), [pathname]);

  const localeOptions = LOCALES.map((code) => ({ code, label: localeNames[code], lang: code, href: pathname }));

  return (
    <>
      <header className="kit-site-header">
        <div className="kit-site-header-inner">
          <button
            type="button"
            className="mc-icon-btn kit-nav-toggle"
            data-kit-nav-toggle=""
            aria-label={ui.menu}
            aria-expanded={drawerOpen}
            aria-controls="kit-drawer"
            onClick={() => setDrawerOpen(true)}
          >
            <PixelIcon name="menu" />
          </button>
          <Brand />
          <nav className="kit-site-nav" aria-label={ui.mainNav}>
            <ul>
              {items.map((item) => (
                <li key={item.path}>
                  {item.external ? (
                    <a className="kit-site-nav-link" href={item.path} target="_blank" rel="noopener">
                      {item.label}
                      <PixelIcon name="external" className="kit-site-nav-ext" />
                    </a>
                  ) : (
                    <NavLink to={item.path} end className={({ isActive }) => (isActive ? 'kit-site-nav-link is-active' : 'kit-site-nav-link')}>
                      {item.label}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="kit-site-actions">
            <LocaleSwitcher
              options={localeOptions}
              current={locale}
              onSelect={(code) => setLocale(code as Locale)}
              linkComponent={LocaleLink}
              className="kit-site-locale"
            />
            <ThemeToggle locale={kitLocale[locale]} />
            <a className="mc-icon-btn kit-site-social" href={LINKS.github} target="_blank" rel="noopener" aria-label="GitHub" title="GitHub">
              <BrandIcon name="github" size={18} />
            </a>
          </div>
        </div>
      </header>
      {/* outside the header: its backdrop-filter would otherwise contain the fixed drawer */}
      {drawerOpen ? <MobileDrawer items={items} onClose={() => setDrawerOpen(false)} /> : null}
    </>
  );
}
