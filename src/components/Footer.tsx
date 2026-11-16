import { SiteFooter } from '../../kit/components';
import { useI18n } from '../i18n';
import { SITE_ORIGIN } from '../routes';
import { RouterLink } from './SiteHeader';

/** The shared LeviMC footer — the same on every LeviMC site; its links in the page's locale (see RouterLink). */
export default function Footer() {
  const { chrome } = useI18n();
  return <SiteFooter locale={chrome} siteOrigin={SITE_ORIGIN} linkComponent={RouterLink} isAppPath={() => true} />;
}
