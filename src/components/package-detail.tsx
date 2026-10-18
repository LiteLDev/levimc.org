import { useState, type MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { BrandIcon, PixelIcon } from "../kit-ui";
import { CATEGORY_BY_ID } from "../data/categories";
import { formatNumber, useI18n } from "../i18n";
import { DEFAULT_STATE, serializeQuery } from "../lib/catalog-query";
import { buildPackageUrl, getRepoBaseUrls, type PackageSelection, type PackageTab, getAllVersions } from "../lib/packages";
import { readStorage, STORAGE_KEYS } from "../lib/storage";
import type { PageData } from "../page-data";
import { useHydrated } from "../page-store";
import { useRenames } from "../repository-renames";
import type { ManifestVariant, PackageInfo } from "../types";
import { DependenciesList } from "./dependencies-list";
import { InstallDialog } from "./install-dialog";
import { LazyMarkdown } from "./lazy-markdown";
import { RelativeDate } from "./local-date";
import { ProjectIcon } from "./project-icon";
import { RouterLink } from "./router-link";
import { Sprite } from "./sprite";
import { ProjectSidebar } from "./project-sidebar";
import { VersionsTable } from "./versions-table";

export type PackagePageData = Extract<PageData, { kind: "package" }>;

/** "‹ Back to search": the listing the visitor came from, as they left it. */
function BackLink() {
  const { t } = useI18n();
  const hydrated = useHydrated();
  const location = useLocation();
  const navigate = useNavigate();
  const href = (hydrated && readStorage(STORAGE_KEYS.lastSearch, true)) || "/";
  const fromListing = (location.state as { fromListing?: boolean } | null)?.fromListing === true;
  return (
    <RouterLink
      href={href}
      className="mc-btn mc-btn-ghost mc-btn-sm pkg-back"
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        if (!fromListing || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        // Back in history: the browser restores the listing's scroll position.
        e.preventDefault();
        navigate(-1);
      }}
    >
      <PixelIcon name="arrowLeft" />
      {t.backToSearch}
    </RouterLink>
  );
}

interface PackageDetailProps {
  data: PackagePageData;
  selection: PackageSelection;
  tab: PackageTab;
  /** The selected version's manifest info (`null`: use the index's). */
  info: PackageInfo | null;
  /** The selected version's manifest variants (`undefined` while loading, `null` without a manifest). */
  variants: ManifestVariant[] | null | undefined;
  /** `null` when the version has no README, `undefined` while it loads. */
  readme: string | null | undefined;
}

export function PackageDetail({ data, selection, tab, info: manifestInfo, variants, readme }: PackageDetailProps) {
  const { t, locale } = useI18n();
  const { tooth, pkg, entry, repository, releases } = data;
  const renames = useRenames();
  const [installing, setInstalling] = useState(false);
  const info = manifestInfo || pkg.info;
  const repoUrls = getRepoBaseUrls(repository, selection.version);
  const depCount = variants?.find((v) => v.label === selection.variant)?.dependencies;
  const tabs: { id: PackageTab; label: string }[] = [
    { id: "description", label: t.tabDescription },
    { id: "versions", label: `${t.tabVersions} (${formatNumber(getAllVersions(pkg).length, locale)})` },
    { id: "dependencies", label: depCount ? `${t.tabDependencies} (${Object.keys(depCount).length})` : t.tabDependencies },
  ];

  return (
    <div className="pkg-detail">
      <BackLink />

      <header className="pkg-project-head">
        <span className="kit-item-frame pkg-project-icon">
          <ProjectIcon icon={entry.icon} owner={entry.owner} size={96} eager />
        </span>
        <div className="pkg-project-heading">
          <h1 className="pkg-project-name">{info.name || entry.name}</h1>
          <p className="pkg-project-by">
            {t.by}{" "}
            <RouterLink href={serializeQuery({ ...DEFAULT_STATE, author: [entry.owner] })}>{entry.owner}</RouterLink>
          </p>
          {info.description ? <p className="pkg-project-summary">{info.description}</p> : null}
          <ul className="pkg-project-stats">
            {entry.stars > 0 ? (
              <li>
                <Sprite name="diamond" />
                {t.starsCount(formatNumber(entry.stars, locale))}
              </li>
            ) : null}
            <li>
              <Sprite name="clock" />
              <span>
                {t.updatedRelative("")}
                <RelativeDate value={entry.updated} />
              </span>
            </li>
            {(entry.requiredBy ?? 0) > 0 ? (
              <li>
                <Sprite name="bookQuill" />
                {t.requiredBy(entry.requiredBy ?? 0)}
              </li>
            ) : null}
            {entry.categories.map((id) => {
              const c = CATEGORY_BY_ID.get(id);
              return c ? (
                <li key={id} className="pkg-project-cat">
                  <RouterLink href={serializeQuery({ ...DEFAULT_STATE, cat: { inc: [id], exc: [] } })} className="pkg-chip pkg-chip-link">
                    <Sprite name={c.icon} />
                    {c.label[locale]}
                  </RouterLink>
                </li>
              ) : null;
            })}
          </ul>
        </div>
        <div className="pkg-project-actions">
          <div className="pkg-project-buttons">
            <button type="button" className="mc-btn mc-btn-primary mc-btn-lg pkg-install-btn" onClick={() => setInstalling(true)} aria-haspopup="dialog">
              <PixelIcon name="pickaxe" />
              {t.install}
            </button>
            <a className="mc-btn mc-btn-lg pkg-github-btn" href={repository} target="_blank" rel="noopener noreferrer" aria-label={t.viewOnGitHub} title={t.viewOnGitHub}>
              <BrandIcon name="github" size={18} />
            </a>
          </div>
          <span className="kit-badge kit-badge-grass pkg-project-version" title={t.version}>
            {selection.variant ? `${selection.variant} · ` : ""}
            {selection.version}
          </span>
        </div>
      </header>

      <nav className="pkg-tabs-nav" aria-label={t.tabsLabel}>
        <div className="hotbar pkg-tabs">
          {tabs.map((tb) => (
            <RouterLink
              key={tb.id}
              href={buildPackageUrl(tooth, pkg, selection, tb.id)}
              aria-current={tb.id === tab ? "page" : undefined}
            >
              {tb.label}
            </RouterLink>
          ))}
          <a href={`${repository}/releases`} target="_blank" rel="noopener noreferrer">
            {t.tabReleases}
            <PixelIcon name="external" />
          </a>
        </div>
      </nav>

      <div className="pkg-detail-grid">
        <div className="pkg-detail-main" data-tab={tab}>
          {tab === "description" ? (
            <section className="px-card pkg-panel pkg-readme" aria-labelledby="pkg-readme-title">
              <h2 id="pkg-readme-title" className="pkg-panel-title pkg-readme-title">
                <PixelIcon name="bookQuill" />
                {t.readme}
                <span className="pkg-readme-version">{selection.version}</span>
              </h2>
              {readme === undefined ? (
                <div className="pkg-skeleton" aria-busy="true">
                  <span className="pkg-skeleton-bar pkg-skeleton-title" />
                  <span className="pkg-skeleton-bar" />
                  <span className="pkg-skeleton-bar pkg-skeleton-90" />
                  <span className="pkg-skeleton-bar pkg-skeleton-70" />
                </div>
              ) : readme ? (
                <div className="kit-prose pkg-readme-body" data-doc-content="">
                  <LazyMarkdown rawBase={repoUrls.raw} blobBase={repoUrls.blob} renames={renames}>
                    {readme}
                  </LazyMarkdown>
                </div>
              ) : (
                <div className="pkg-empty pkg-readme-empty">
                  <p>{t.noReadme(selection.version)}</p>
                </div>
              )}
            </section>
          ) : tab === "versions" ? (
            <section className="px-card pkg-panel" aria-label={t.tabVersions} id="versions">
              <VersionsTable
                tooth={tooth}
                pkg={pkg}
                repository={repository}
                selection={selection}
                releases={releases}
                llRanges={data.llRanges}
              />
            </section>
          ) : (
            <section className="px-card pkg-panel" aria-label={t.tabDependencies}>
              <DependenciesList
                selection={selection}
                variants={variants}
                related={data.related}
                dependents={data.dependents}
                dependentsKnown={data.dependentsKnown}
              />
            </section>
          )}
        </div>

        <aside className="pkg-detail-side" aria-label={t.details}>
          <ProjectSidebar
            tooth={tooth}
            entry={entry}
            pkg={pkg}
            repository={repository}
            selection={selection}
            variants={variants}
            releases={releases}
            hasIssues={data.hasIssues}
          />
        </aside>
      </div>

      <InstallDialog
        open={installing}
        onClose={() => setInstalling(false)}
        name={info.name || entry.name}
        tooth={tooth}
        pkg={pkg}
        repository={repository}
        selection={selection}
        releases={releases}
      />
    </div>
  );
}
