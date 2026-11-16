import { Link, useLocation } from 'react-router';
import { GlobalBar, type LinkLikeProps, type SiteId } from '../../kit/components';
import { useI18n, LOCALES } from '../i18n';
import { isOtherSitePath } from '../other-sites';
import { localeAlternates, localizePath, SITE_ORIGIN, type RouteId } from '../routes';

/**
 * Paths of this origin the app's router renders: everything but the other builds (/mods/, /tutorials/, the docs),
 * in any language (/zh-Hans/mods/, /ja/LeviLauncher/).
 */
export const isAppPath = (path: string) => !isOtherSitePath(path);

/**
 * Same-site links of the bar and footer, in the page's locale (/about/ → /zh-Hans/about/, /mods/ → /zh-Hans/mods/):
 * the app's own pages navigate inside the app (no full reload), the other builds' load in full.
 */
export function RouterLink({ href, ...rest }: LinkLikeProps) {
  const { href: localize } = useI18n();
  return <ExactLink href={localize(href)} {...rest} />;
}

/** A same-site link to exactly `href` (already in the locale it should be: the language menu's options). */
function ExactLink({ href: to, children, ...rest }: LinkLikeProps) {
  // other builds (and absolute URLs: the projects' docs) load in full
  if (!to.startsWith('/') || !isAppPath(to))
    return (
      <a href={to} {...(rest as Record<string, unknown>)}>
        {children}
      </a>
    );
  return (
    <Link to={to} {...(rest as Record<string, unknown>)}>
      {children}
    </Link>
  );
}

/** The bar tab of each page (Support Us has none: it is linked from the footer). */
const BAR_TAB: Partial<Record<RouteId, SiteId>> = {
  home: 'home',
  community: 'community',
  about: 'about',
  blog: 'blog',
};

/**
 * levimc.org is the home of the LeviMC network and of the kit: the GlobalBar — identical on every LeviMC site
 * (Home · Tutorials · Projects ▾ · Mods · Blog · Community · About, then language · theme · GitHub) — is the site's
 * only header. Its language menu links each language to the same page in it (a blog post, written in one language,
 * to the blog in the others) and stores the choice as the cross-site preference; the bar itself speaks the chrome
 * language (`chromeLocaleFor`: the content language, or a stored language the kit has strings for and the site has
 * no content in). It is sticky because it is the page's only header — on the docs the project row is the sticky
 * header and the bar scrolls away (kit Design rules).
 */
export default function SiteHeader({ current }: { current: RouteId | null }) {
  const { locale, chrome } = useI18n();
  const { pathname } = useLocation();
  const alternates = localeAlternates(pathname);
  const options = LOCALES.map(({ code, label, lang }) => ({
    code,
    label,
    lang,
    // the page in that language; else (a blog post in another one) its blog, (an unknown URL) its home
    href: alternates?.[code] ?? localizePath(current === 'blog' ? '/blog/' : '/', code),
  }));

  return (
    <GlobalBar
      current={current ? BAR_TAB[current] : undefined}
      locale={chrome}
      sticky
      siteOrigin={SITE_ORIGIN}
      linkComponent={RouterLink}
      // every same-site link goes through RouterLink, which adds the locale (the other builds' too)
      isAppPath={() => true}
      languages={{ options, current: locale, linkComponent: ExactLink }}
    />
  );
}
