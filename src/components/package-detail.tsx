import { BrandIcon, PixelIcon } from "../../kit/components";
import {
  buildPackageUrl,
  getRepoBaseUrls,
  getSortedVariants,
  getVersionsForVariant,
} from "../lib/packages";
import type { PackageSelection } from "../lib/packages";
import { useRenames } from "../repository-renames";
import type { PackageInfo, RawPackageEntry } from "../types";
import { Avatar } from "./avatar";
import { InstallCommands } from "./install-commands";
import { LazyMarkdown } from "./lazy-markdown";
import { LocalDate } from "./local-date";
import { RouterLink } from "./router-link";

interface PackageDetailProps {
  tooth: string;
  pkg: RawPackageEntry;
  /** The package's repository ("View on GitHub", README links). */
  repository: string;
  selection: PackageSelection;
  /** The selected version's manifest info, or `null` to use the index's. */
  info: PackageInfo | null;
  /** `null` when the version has no README, `undefined` while it loads. */
  readme: string | null | undefined;
}

export function PackageDetail({
  tooth,
  pkg,
  repository,
  selection,
  info: manifestInfo,
  readme,
}: Readonly<PackageDetailProps>) {
  const { variant: selectedVariant, version: selectedVersion } = selection;
  const variants = getSortedVariants(pkg);
  const versionCandidates = getVersionsForVariant(pkg, selectedVariant);
  const repoUrls = getRepoBaseUrls(repository, selectedVersion);
  const renames = useRenames();
  const info = manifestInfo || pkg.info;
  const tags = pkg.info.tags ?? [];

  return (
    <div className="pkg-detail">
      <RouterLink href="/" className="mc-btn mc-btn-ghost mc-btn-sm pkg-back">
        <PixelIcon name="arrowLeft" />
        Back to packages
      </RouterLink>

      <div className="pkg-detail-grid">
        <div className="pkg-detail-main">
          <header className="px-card kit-painted pkg-detail-head">
            <div className="kit-item-frame pkg-detail-avatar">
              <Avatar src={info.avatar_url} alt={info.name} size={64} />
            </div>
            <div className="pkg-detail-heading">
              <h1 className="pkg-detail-name">{info.name}</h1>
              <p className="pkg-detail-desc">{info.description}</p>
            </div>
          </header>

          <InstallCommands
            tooth={tooth}
            version={selectedVersion}
            variant={selectedVariant}
          />

          <section className="px-card pkg-panel pkg-readme" aria-labelledby="pkg-readme-title">
            <h2 id="pkg-readme-title" className="pkg-panel-title pkg-readme-title">
              <PixelIcon name="bookQuill" />
              README
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
                <LazyMarkdown
                  rawBase={repoUrls.raw}
                  blobBase={repoUrls.blob}
                  renames={renames}
                >
                  {readme}
                </LazyMarkdown>
              </div>
            ) : (
              <div className="pkg-empty pkg-readme-empty">
                <p>No README available for version {selectedVersion}</p>
              </div>
            )}
          </section>
        </div>

        <aside className="pkg-detail-side">
          <section className="px-card pkg-panel" aria-labelledby="pkg-meta-title">
            <h2 id="pkg-meta-title" className="pkg-panel-title">
              Metadata
            </h2>
            <dl className="pkg-meta">
              <div className="pkg-meta-row">
                <dt>
                  <PixelIcon name="chest" /> Version
                </dt>
                <dd className="pkg-meta-version">{selectedVersion}</dd>
              </div>

              <div className="pkg-meta-row">
                <dt>
                  <PixelIcon name="diamond" /> Stars
                </dt>
                <dd>{pkg.stargazer_count}</dd>
              </div>

              <div className="pkg-meta-row">
                <dt>
                  <PixelIcon name="clock" /> Updated
                </dt>
                <dd>
                  <LocalDate value={pkg.updated_at} />
                </dd>
              </div>

              <div className="pkg-meta-tags">
                <dt>
                  <PixelIcon name="paper" /> Tags
                </dt>
                <dd>
                  {tags.length > 0 ? (
                    <ul className="pkg-chips">
                      {tags.map((tag: string) => (
                        <li key={tag} className="pkg-tag">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="pkg-meta-none">No tags</span>
                  )}
                </dd>
              </div>
            </dl>

            <a
              href={repository}
              target="_blank"
              rel="noopener noreferrer"
              className="mc-btn mc-btn-primary pkg-repo-link"
            >
              <BrandIcon name="github" size={16} />
              <span>View on GitHub</span>
            </a>
          </section>

          <section className="px-card pkg-panel" aria-labelledby="pkg-variants-title">
            <h2 id="pkg-variants-title" className="pkg-panel-title">
              Variants
            </h2>
            <ul className="pkg-chips">
              {variants.map((variant) => {
                const variantVersions = getVersionsForVariant(pkg, variant);
                const variantLatest = variantVersions.at(-1);
                if (!variantLatest) return null;
                const targetVersion = variantVersions.includes(selectedVersion)
                  ? selectedVersion
                  : variantLatest;
                const isCurrent = variant === selectedVariant;
                const variantUrl = buildPackageUrl(tooth, pkg, {
                  variant,
                  version: targetVersion,
                });
                return (
                  <li key={variant}>
                    <RouterLink
                      href={variantUrl}
                      className="pkg-chip pkg-chip-link pkg-chip-mono"
                      aria-current={isCurrent ? "true" : undefined}
                    >
                      {variant === "" ? "(default)" : variant}
                    </RouterLink>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="px-card pkg-panel" aria-labelledby="pkg-versions-title">
            <h2 id="pkg-versions-title" className="pkg-panel-title">
              Versions
            </h2>
            <ul className="pkg-chips pkg-versions">
              {versionCandidates
                .slice()
                .reverse()
                .map((version) => {
                  const isCurrent = version === selectedVersion;
                  const versionUrl = buildPackageUrl(tooth, pkg, {
                    variant: selectedVariant,
                    version,
                  });
                  return (
                    <li key={version}>
                      <RouterLink
                        href={versionUrl}
                        className="pkg-chip pkg-chip-link pkg-chip-mono"
                        aria-current={isCurrent ? "true" : undefined}
                      >
                        {version}
                      </RouterLink>
                    </li>
                  );
                })}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
