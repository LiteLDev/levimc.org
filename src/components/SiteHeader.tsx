import type { MouseEvent } from 'react';
import { Link } from 'react-router';
import {
  DOCS_PROJECTS,
  GlobalBar,
  LINKS,
  LocaleSwitcher,
  ThemeToggle,
  uiStrings,
  type GlobalNavItem,
  type LinkLikeProps,
} from '../../kit/components';
import { useI18n, localeNames, kitLocale, LOCALES, type Locale } from '../i18n';
import { pathOf, type RouteId } from '../routes';

/** Same-site entries of the bar navigate inside the app (no full reload). */
function RouterLink({ href, children, ...rest }: LinkLikeProps) {
  return (
    <Link to={href} {...(rest as Record<string, unknown>)}>
      {children}
    </Link>
  );
}

/**
 * The language is app state (localStorage "locale"), not part of the URL, so the menu items are buttons:
 * there is no page to open in a new tab. Choosing one closes the menu and returns focus to its trigger.
 */
function LocaleButton({ href: _href, hrefLang: _hrefLang, children, onClick, ...rest }: LinkLikeProps) {
  return (
    <button
      type="button"
      {...(rest as Record<string, unknown>)}
      onClick={(e) => {
        onClick?.(e as unknown as MouseEvent<HTMLAnchorElement>);
        const menu = e.currentTarget.closest('details');
        if (menu) {
          menu.open = false;
          menu.querySelector('summary')?.focus();
        }
      }}
    >
      {children}
    </button>
  );
}

/**
 * levimc.org is the home of the LeviMC network, so the kit GlobalBar is the site's only navigation bar:
 * the site's own pages (labels unchanged from the old header) plus the network's Docs menu and Blog.
 */
export default function SiteHeader({ current }: { current: RouteId | null }) {
  const { t, locale, setLocale } = useI18n();
  const ui = uiStrings(kitLocale[locale]);

  const items: GlobalNavItem[] = [
    { id: 'home', label: t.nav.home, url: pathOf('home') },
    { id: 'mods', label: t.nav.mods, url: LINKS.packages },
    { id: 'projects', label: t.nav.projects, url: pathOf('projects') },
    { id: 'docs', label: ui.docs, url: DOCS_PROJECTS[0]!.url },
    { id: 'features', label: t.nav.features, url: pathOf('features') },
    { id: 'community', label: t.nav.community, url: pathOf('community') },
    { id: 'blog', label: ui.blog, url: LINKS.blog },
    { id: 'about', label: t.nav.about, url: pathOf('about') },
    { id: 'support', label: t.nav.support, url: pathOf('support') },
  ];

  const localeOptions = LOCALES.map((code) => ({ code, label: localeNames[code], short: code.toUpperCase(), lang: code, href: '' }));

  return (
    <header className="lm-banner">
      <GlobalBar
        current={current ?? undefined}
        locale={kitLocale[locale]}
        strings={{ home: t.nav.home }}
        items={items}
        linkComponent={RouterLink}
        end={
          <>
            <LocaleSwitcher
              options={localeOptions}
              current={locale}
              onSelect={(code) => setLocale(code as Locale)}
              linkComponent={LocaleButton}
              className="lm-gbar-locale"
            />
            <ThemeToggle locale={kitLocale[locale]} />
          </>
        }
      />
    </header>
  );
}
