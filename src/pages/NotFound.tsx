import { Link } from 'react-router';
import { DOCS_PROJECTS, PixelIcon, uiStrings } from '../../kit/components';
import { useI18n, kitLocale } from '../i18n';
import { pathOf } from '../routes';

/**
 * Themed 404 (also prerendered to 404.html, which GitHub Pages serves for unknown paths). The same card as the
 * docs' 404 (red "Error 404" label, title, text, two actions) plus, like docs.levimc.org's 404, the projects with
 * documentation, so a mistyped docs link still gets somewhere.
 */
export default function NotFound() {
  const { t, locale } = useI18n();
  const ui = uiStrings(kitLocale[locale]);

  return (
    <div className="kit-notfound lm-notfound">
      <div className="kit-notfound-card px-card kit-painted">
        <div className="kit-notfound-compass kit-slot" aria-hidden="true">
          <PixelIcon name="compass" size={64} className="kit-notfound-spin" />
        </div>
        <p className="kit-notfound-code kit-pixel-label">Error 404</p>
        <h1 className="kit-notfound-title">{ui.notFoundTitle}</h1>
        <p className="kit-notfound-text">{ui.notFoundText}</p>
        <div className="kit-notfound-actions">
          <Link className="mc-btn mc-btn-primary" to={pathOf('home')}>
            <PixelIcon name="grass" />
            {t.nav.home}
          </Link>
          <Link className="mc-btn" to="/#projects">
            <PixelIcon name="map" />
            {t.nav.projects}
          </Link>
        </div>
        <p className="kit-notfound-text lm-notfound-pick">{t.meta.pickProject}</p>
        <div className="kit-static-grid">
          {DOCS_PROJECTS.map((p) => (
            <a key={p.id} className="px-card kit-card" href={p.url}>
              <span className="kit-card-icon kit-slot">
                <img src={p.logo} width={52} height={52} alt="" className="kit-card-logo" loading="lazy" decoding="async" />
              </span>
              <span className="kit-card-body">
                <span className="kit-card-title">{p.name}</span> <span className="kit-card-desc">{ui.projectBlurbs[p.id] ?? ''}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
