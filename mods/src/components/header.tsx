import { BASE } from "../base-path";
import { useI18n } from "../i18n";
import { RouterLink } from "./router-link";
import { HeaderSearch } from "./search";

/**
 * The site's own row on the mod and 404 pages, under the LeviMC bar:
 * the LeviMC Mods brand and a search field. A light row on the page's canvas,
 * not a second bar: it has no controls of its own (theme, language and GitHub
 * live in the LeviMC bar) and scrolls away with the page.
 */
export function Header() {
  const { t } = useI18n();
  return (
    <header className="mods-header">
      <div className="mods-header-inner">
        <RouterLink href={BASE} className="mods-brand" aria-label={t.homeLink}>
          <img src={`${BASE}icon.png`} alt="" width={24} height={24} className="mods-brand-icon" />
          <span className="mods-brand-name">{t.siteName}</span>
        </RouterLink>
        <div className="mods-header-search">
          <HeaderSearch />
        </div>
      </div>
    </header>
  );
}
