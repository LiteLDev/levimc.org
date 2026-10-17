import { Link } from 'react-router';
import { PixelIcon, uiStrings } from '../../kit/components';
import { useI18n, kitLocale } from '../i18n';
import { pathOf } from '../routes';

/** Themed 404 (also prerendered to 404.html, which GitHub Pages serves for unknown paths). */
export default function NotFound() {
  const { t, locale } = useI18n();
  const ui = uiStrings(kitLocale[locale]);

  return (
    <div className="kit-notfound">
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
          <Link className="mc-btn" to={pathOf('projects')}>
            <PixelIcon name="map" />
            {t.nav.projects}
          </Link>
        </div>
      </div>
    </div>
  );
}
