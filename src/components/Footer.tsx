import { SiteFooter } from '../../kit/components';
import { useI18n } from '../i18n';
import { SITE_ORIGIN } from '../routes';
import { RouterLink, isAppPath } from './SiteHeader';

/** The shared LeviMC footer — the same on every LeviMC site. */
export default function Footer() {
  const { chrome } = useI18n();
  return <SiteFooter locale={chrome} siteOrigin={SITE_ORIGIN} linkComponent={RouterLink} isAppPath={isAppPath} />;
}
