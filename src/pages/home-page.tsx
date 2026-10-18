import { CompactHero } from "../components/compact-hero";
import { PackageBrowser } from "../components/package-browser";
import { formatNumber, useI18n } from "../i18n";
import type { Catalog } from "../types";

/**
 * The listing. A compact painted hero with the catalogue's size, then the
 * results right away.
 */
export function HomePage({ catalog }: { catalog: Catalog }) {
  const { t, locale } = useI18n();
  const { projects, authors, versions } = catalog.stats;
  const n = (v: number) => formatNumber(v, locale);
  return (
    <main id="main" className="pkg-main pkg-home kit-above-backdrop" tabIndex={-1}>
      <CompactHero name={t.siteName} tagline={t.tagline}>
        <p className={`pkg-hero-stats${locale === "en" ? " kit-pixel-label" : ""}`}>
          <span>{t.statProjects(n(projects))}</span>
          <span className="pkg-hero-sep" aria-hidden="true">
            ·
          </span>
          <span>{t.statAuthors(n(authors))}</span>
          <span className="pkg-hero-sep pkg-hero-extra" aria-hidden="true">
            ·
          </span>
          <span className="pkg-hero-extra">{t.statVersions(n(versions))}</span>
        </p>
      </CompactHero>
      <PackageBrowser catalog={catalog} />
    </main>
  );
}
