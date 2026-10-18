import { SiteFooter } from '../../kit/components';
import { useI18n, kitLocale } from '../i18n';
import { SITE_ORIGIN } from '../routes';
import { RouterLink } from './SiteHeader';

/** The shared LeviMC footer — the same on every LeviMC site. */
export default function Footer() {
  const { locale } = useI18n();
  return <SiteFooter locale={kitLocale[locale]} siteOrigin={SITE_ORIGIN} linkComponent={RouterLink} />;
}
