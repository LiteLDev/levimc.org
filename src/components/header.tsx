import { useI18n } from "../i18n";
import { RouterLink } from "./router-link";
import { HeaderSearch } from "./search";

/**
 * The site's own row on the package and 404 pages, under the LeviMC bar:
 * the LeviMC Mods brand and a search field. A light row on the page's canvas,
 * not a second bar: it has no controls of its own (theme, language and GitHub
 * live in the LeviMC bar) and scrolls away with the page.
 */
export function Header() {
  const { t } = useI18n();
  return (
    <header className="pkg-header">
      <div className="pkg-header-inner">
        <RouterLink href="/" className="pkg-brand" aria-label={t.homeLink}>
          <img src="/icon.png" alt="" width={24} height={24} className="pkg-brand-icon" />
          <span className="pkg-brand-name">{t.siteName}</span>
        </RouterLink>
        <div className="pkg-header-search">
          <HeaderSearch />
        </div>
      </div>
    </header>
  );
}
