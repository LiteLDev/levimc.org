import { PixelIcon } from "../kit-ui";
import { uiStrings } from "../../kit/components/i18n";
import { RouterLink } from "../components/router-link";
import { useI18n } from "../i18n";
import { LOCALES } from "../locales";
import { BASE } from "../base-path";

/**
 * The 404 of LeviMC Mods: the card every LeviMC 404 shares (levimc.org, the docs) — the spinning compass, the
 * red "Error 404" label, the title, a line of text and two actions: back to the listing, and levimc.org.
 */
export function NotFoundPage() {
  const { t, locale } = useI18n();
  const ui = uiStrings(LOCALES.find((l) => l.code === locale)?.lang ?? "en");

  return (
    <main id="main" className="mods-main mods-notfound kit-notfound kit-above-backdrop" tabIndex={-1}>
      <div className="px-card kit-painted mods-notfound-card">
        <div className="kit-slot mods-notfound-compass" aria-hidden="true">
          <PixelIcon name="compass" size={64} className="kit-notfound-spin" />
        </div>
        <p className="kit-pixel-label mods-notfound-code">Error 404</p>
        <h1 className="mods-notfound-title">{ui.notFoundTitle}</h1>
        <p className="mods-notfound-text">{t.notFoundText}</p>
        <div className="mods-notfound-actions">
          <RouterLink href={BASE} className="mc-btn mc-btn-primary">
            <PixelIcon name="grass" />
            {t.backToSearch}
          </RouterLink>
          <a href="/" className="mc-btn">
            <PixelIcon name="map" />
            {ui.home}
          </a>
        </div>
      </div>
    </main>
  );
}
