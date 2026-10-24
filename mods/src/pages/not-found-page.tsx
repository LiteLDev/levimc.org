import { PixelIcon } from "../kit-ui";
import { RouterLink } from "../components/router-link";
import { useI18n } from "../i18n";
import { BASE } from "../base-path";

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <main id="main" className="mods-main mods-notfound kit-notfound kit-above-backdrop" tabIndex={-1}>
      <div className="px-card kit-painted mods-notfound-card">
        <div className="kit-slot mods-notfound-compass" aria-hidden="true">
          <PixelIcon name="compass" size={64} className="kit-notfound-spin" />
        </div>
        <h1 className="kit-hero-title mods-notfound-code">
          <span className="kit-hero-name">404</span>
        </h1>
        <p className="mods-notfound-text">{t.notFoundText}</p>
        <RouterLink href={BASE} className="mc-btn mc-btn-primary">
          <PixelIcon name="grass" />
          {t.backToSearch}
        </RouterLink>
      </div>
    </main>
  );
}
