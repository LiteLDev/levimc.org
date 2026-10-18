import { Link } from 'react-router';
import { GlobalBar, type LinkLikeProps, type SiteId } from '../../kit/components';
import { useI18n, kitLocale, LOCALES } from '../i18n';
import { SITE_ORIGIN, type RouteId } from '../routes';

/** Same-site links of the bar and footer navigate inside the app (no full reload). */
export function RouterLink({ href, children, ...rest }: LinkLikeProps) {
  return (
    <Link to={href} {...(rest as Record<string, unknown>)}>
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

const LANGUAGE_OPTIONS = LOCALES.map(({ code, label, lang }) => ({ code, label, lang }));

/**
 * levimc.org is the home of the LeviMC network and of the kit: the GlobalBar — identical on every LeviMC site
 * (Home · Projects ▾ · Mods · Blog · Community · About, then language · theme · GitHub) — is the site's only header.
 * Its language menu switches this site's own languages (app state, stored as the cross-site preference).
 */
export default function SiteHeader({ current }: { current: RouteId | null }) {
  const { locale, setLocale } = useI18n();

  return (
    <GlobalBar
      current={current ? BAR_TAB[current] : undefined}
      locale={kitLocale[locale]}
      sticky
      siteOrigin={SITE_ORIGIN}
      linkComponent={RouterLink}
      languages={{ options: LANGUAGE_OPTIONS, current: locale, onSelect: (code) => setLocale(code as typeof locale) }}
    />
  );
}
