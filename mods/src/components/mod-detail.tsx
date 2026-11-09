import { BASE } from "../base-path";
import { useState, type MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { BrandIcon, PixelIcon } from "../kit-ui";
import { featuredTagsOf } from "../data/featured-tags";
import { formatNumber, useI18n } from "../i18n";
import { DEFAULT_STATE, serializeQuery } from "../lib/catalog-query";
import { buildModUrl, getAllVersions, getRepoBaseUrls, ownerUrl, variantDeps, type ModSelection, type ModTab } from "../lib/mods";
import { pickReadme, readmeLabel, type Readme } from "../lib/readme-language";
import { readStorage, STORAGE_KEYS } from "../lib/storage";
import type { PageData } from "../page-data";
import { useHydrated } from "../page-store";
import { useRenames } from "../repository-renames";
import type { EntryJson, LipInfo } from "../types";
import { DependenciesList } from "./dependencies-list";
import { HotbarRadio } from "./hotbar-radio";
import { InstallDialog } from "./install-dialog";
import { LazyMarkdown } from "./lazy-markdown";
import { RelativeDate } from "./local-date";
import { ProjectIcon } from "./project-icon";
import { RouterLink } from "./router-link";
import { Sprite } from "./sprite";
import { ProjectSidebar } from "./project-sidebar";
import { ShowcaseGallery } from "./showcase-gallery";
import { VersionsTable } from "./versions-table";

export type ModPageData = Extract<PageData, { kind: "mod" }>;

/** "‹ Back to search": the listing the visitor came from, as they left it. */
function BackLink() {
  const { t } = useI18n();
  const hydrated = useHydrated();
  const location = useLocation();
  const navigate = useNavigate();
  const href = (hydrated && readStorage(STORAGE_KEYS.lastSearch, true)) || BASE;
  const fromListing = (location.state as { fromListing?: boolean } | null)?.fromListing === true;
  return (
    <RouterLink
      href={href}
      className="mc-btn mc-btn-ghost mc-btn-sm mods-back"
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

interface ModDetailProps {
  data: ModPageData;
  selection: ModSelection;
  tab: ModTab;
  /** The selected version's package file info (`null`: use the index's). */
  info: LipInfo | null;
  /** The selected version's variants: name → entries (`undefined` while loading, `null` without a package file). */
  variants: Record<string, EntryJson[]> | null | undefined;
  /** The version's README in each of its languages (empty: none), `undefined` while they load. */
  readmes: Readme[] | undefined;
}

export function ModDetail({ data, selection, tab: requestedTab, info: manifestInfo, variants, readmes }: ModDetailProps) {
  const { t, locale } = useI18n();
  // the README in the interface language, unless the visitor picked another (kept across versions that have it)
  const [readmeFile, setReadmeFile] = useState<string>();
  const readme = readmes && (readmes.find((r) => r.file === readmeFile) ?? pickReadme(readmes, locale));
  const { id: modId, mod, entry, repository, releases } = data;
  const renames = useRenames();
  const [installing, setInstalling] = useState(false);
  const info = manifestInfo || mod.info;
  const repoUrls = getRepoBaseUrls(repository, selection.version);
  const depCount = variants ? Object.keys(variantDeps(variants[selection.variant])).length : 0;
  // a mod without a gallery has no Gallery tab (an old ?tab=gallery link shows the Description)
  const showcase = data.showcase ?? [];
  const tab = requestedTab === "gallery" && !showcase.length ? "description" : requestedTab;
  const tabs: { id: ModTab; label: string }[] = [
    { id: "description", label: t.tabDescription },
    ...(showcase.length ? [{ id: "gallery" as const, label: `${t.tabGallery} (${formatNumber(showcase.length, locale)})` }] : []),
    { id: "versions", label: `${t.tabVersions} (${formatNumber(getAllVersions(mod).length, locale)})` },
    { id: "dependencies", label: depCount ? `${t.tabDependencies} (${depCount})` : t.tabDependencies },
  ];

  return (
    <div className="mods-detail">
      <BackLink />

      <header className="mods-project-head">
        <span className="kit-item-frame mods-project-icon">
          <ProjectIcon icon={entry.logo} iconId={entry.logoId} owner={entry.owner} size={96} eager />
        </span>
        <div className="mods-project-heading">
          <h1 className="mods-project-name">{info.name || entry.name}</h1>
          <p className="mods-project-by">
            {t.by}{" "}
            <a href={ownerUrl(entry.owner)} target="_blank" rel="noopener noreferrer">
              {entry.owner}
            </a>
          </p>
          {info.description ? <p className="mods-project-summary">{info.description}</p> : null}
          <ul className="mods-project-stats">
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
            {featuredTagsOf(entry.tags).map(({ tag, raw }) => (
              <li key={tag.id} className="mods-project-cat">
                <RouterLink href={serializeQuery({ ...DEFAULT_STATE, tags: { inc: [tag.id], exc: [] } })} className="mods-chip mods-chip-link">
                  <Sprite name={tag.icon} />
                  {tag.label[locale]}
                  <span className="mods-raw-tag">{raw.join(" ")}</span>
                </RouterLink>
              </li>
            ))}
          </ul>
        </div>
        <div className="mods-project-actions">
          <div className="mods-project-buttons">
            <button type="button" className="mc-btn mc-btn-primary mc-btn-lg mods-install-btn" onClick={() => setInstalling(true)} aria-haspopup="dialog">
              <PixelIcon name="pickaxe" />
              {t.install}
            </button>
            <a className="mc-btn mc-btn-lg mods-github-btn" href={repository} target="_blank" rel="noopener noreferrer" aria-label={t.viewOnGitHub} title={t.viewOnGitHub}>
              <BrandIcon name="github" size={18} />
            </a>
          </div>
          <span className="kit-badge kit-badge-grass mods-project-version" title={t.version}>
            {selection.variant ? `${selection.variant} · ` : ""}
            {selection.version}
          </span>
        </div>
      </header>

      <nav className="mods-tabs-nav" aria-label={t.tabsLabel}>
        <div className="hotbar mods-tabs">
          {tabs.map((tb) => (
            <RouterLink
              key={tb.id}
              href={buildModUrl(modId, mod, selection, tb.id)}
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

      <div className="mods-detail-grid">
        <div className="mods-detail-main" data-tab={tab}>
          {tab === "description" ? (
            <section className="px-card mods-panel mods-readme" aria-labelledby="mods-readme-title">
              <div className="mods-readme-head">
                <h2 id="mods-readme-title" className="mods-panel-title mods-readme-title">
                  <PixelIcon name="bookQuill" />
                  {t.readme}
                  <span className="mods-readme-version">{selection.version}</span>
                </h2>
                {readme && readmes.length > 1 ? (
                  <HotbarRadio
                    label={t.readmeLanguage}
                    className="mods-readme-langs"
                    options={readmes.map((r) => ({ value: r.file, label: readmeLabel(r) }))}
                    value={readme.file}
                    onChange={setReadmeFile}
                  />
                ) : null}
              </div>
              {readmes === undefined ? (
                <div className="mods-skeleton" aria-busy="true">
                  <span className="mods-skeleton-bar mods-skeleton-title" />
                  <span className="mods-skeleton-bar" />
                  <span className="mods-skeleton-bar mods-skeleton-90" />
                  <span className="mods-skeleton-bar mods-skeleton-70" />
                </div>
              ) : readme ? (
                <div className="kit-prose mods-readme-body" data-doc-content="" lang={readme.lang ?? undefined}>
                  <LazyMarkdown rawBase={repoUrls.raw} blobBase={repoUrls.blob} renames={renames}>
                    {readme.text}
                  </LazyMarkdown>
                </div>
              ) : (
                <div className="mods-empty mods-readme-empty">
                  <p>{t.noReadme(selection.version)}</p>
                </div>
              )}
            </section>
          ) : tab === "gallery" ? (
            <ShowcaseGallery items={showcase} name={info.name || entry.name} />
          ) : tab === "versions" ? (
            <section className="px-card mods-panel" aria-label={t.tabVersions} id="versions">
              <VersionsTable
                modId={modId}
                mod={mod}
                repository={repository}
                selection={selection}
                releases={releases}
                targets={data.targets}
              />
            </section>
          ) : (
            <section className="px-card mods-panel" aria-label={t.tabDependencies}>
              <DependenciesList
                selection={selection}
                variants={variants}
                related={data.related}
                dependents={data.dependents}
              />
            </section>
          )}
        </div>

        <aside className="mods-detail-side" aria-label={t.details}>
          <ProjectSidebar
            modId={modId}
            entry={entry}
            mod={mod}
            repository={repository}
            selection={selection}
            targets={data.targets}
            lipToml={data.lipToml}
            releases={releases}
            hasIssues={data.hasIssues}
          />
        </aside>
      </div>

      <InstallDialog
        open={installing}
        onClose={() => setInstalling(false)}
        name={info.name || entry.name}
        modId={modId}
        mod={mod}
        repository={repository}
        selection={selection}
        releases={releases}
        targets={data.targets}
      />
    </div>
  );
}
