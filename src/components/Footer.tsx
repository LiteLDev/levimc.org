import { Link } from 'react-router';
import { SiteFooter } from '../../kit/components';
import { useI18n, kitLocale } from '../i18n';
import { SITE_ORIGIN, pathOf } from '../routes';
import { RouterLink } from './SiteHeader';

/**
 * The shared LeviMC footer (its Home / Projects / Mods / Blog / About / Community labels are the GlobalBar's,
 * so header and footer name every destination alike), with this site's tagline and its own "Resources" row:
 * the docs, the blog and the two pages that have no tab in the network bar (Features, Support Us).
 */
export default function Footer() {
  const { t, locale } = useI18n();

  return (
    <SiteFooter
      locale={kitLocale[locale]}
      strings={{ tagline: t.footer.tagline, footerConnect: t.footer.connect }}
      siteOrigin={SITE_ORIGIN}
      linkComponent={RouterLink}
      extra={
        <nav className="kit-footer-col lm-footer-resources" aria-label={t.footer.resources}>
          <h2 className="kit-footer-heading">{t.footer.resources}</h2>
          <ul>
            <li>
              <a href="https://docs.levimc.org/LeviLamina/">{t.footer.ll_documentation}</a>
            </li>
            <li>
              <a href="https://docs.levimc.org/LegacyScriptEngine/">{t.footer.lse_documentation}</a>
            </li>
            <li>
              <Link to={pathOf('blog')}>{t.footer.blog}</Link>
            </li>
            <li>
              <Link to={pathOf('features')}>{t.nav.features}</Link>
            </li>
            <li>
              <Link to={pathOf('support')}>{t.nav.support}</Link>
            </li>
          </ul>
        </nav>
      }
    />
  );
}
