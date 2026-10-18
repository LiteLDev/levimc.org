import { SiteFooter } from '../../kit/components';
import { useI18n, kitLocale } from '../i18n';

/** The shared LeviMC footer, plus this site's own tagline and "Resources" links. */
export default function Footer() {
  const { t, locale } = useI18n();

  return (
    <SiteFooter
      locale={kitLocale[locale]}
      strings={{ tagline: t.footer.tagline, footerConnect: t.footer.connect }}
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
              <a href="https://blog.levimc.org/">{t.footer.blog}</a>
            </li>
          </ul>
        </nav>
      }
    />
  );
}
