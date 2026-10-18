import type { ReactNode } from "react";
import { ENV_BY_ID, LSE_LANGUAGES, PLATFORM_BY_ID } from "../data/categories";
import { formatNumber, useI18n } from "../i18n";
import { serializeQuery, DEFAULT_STATE } from "../lib/catalog-query";
import {
  buildPackageUrl,
  getAllVersions,
  getPackageManifestUrl,
  getSortedVariants,
  getVersionsForVariant,
  ownerAvatar,
  type PackageSelection,
} from "../lib/packages";

/** Versions listed in the sidebar; the Versions tab has them all. */
const RECENT = 6;
import type { CatalogEntry, ManifestVariant, RawPackageEntry, ReleaseInfo } from "../types";
import { CopyButton } from "./copy-button";
import { LocalDate } from "./local-date";
import { RouterLink } from "./router-link";
import { MaskIcon } from "./sprite";

function Panel({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="px-card pkg-panel pkg-side-panel" aria-labelledby={id}>
      <h2 id={id} className="pkg-panel-title">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="pkg-side-link">
      {children}
      <MaskIcon name="external" className="pkg-side-link-ext" />
    </a>
  );
}

interface ProjectSidebarProps {
  tooth: string;
  entry: CatalogEntry;
  pkg: RawPackageEntry;
  repository: string;
  selection: PackageSelection;
  /** The selected version's manifest variants (`undefined` while loading, `null` without a manifest). */
  variants: ManifestVariant[] | null | undefined;
  releases: Record<string, ReleaseInfo>;
  hasIssues: boolean;
}

/** Compatibility, links, creators, details and tags, like Modrinth's right column. */
export function ProjectSidebar({ tooth, entry, pkg, repository, selection, variants, releases, hasIssues }: ProjectSidebarProps) {
  const { t, locale } = useI18n();
  const os = [...new Set((variants ?? []).filter((v) => v.label === selection.variant).map((v) => v.platform ?? ""))];
  const firstRelease = Object.values(releases).reduce<string | undefined>((min, r) => (!min || r.date < min ? r.date : min), undefined);
  const labels = getSortedVariants(pkg);
  /** The latest versions of the selected variant. */
  const recent = getVersionsForVariant(pkg, selection.variant).slice(-RECENT).reverse();
  return (
    <>
      <Panel id="pkg-side-compat" title={t.compatibility}>
        <dl className="pkg-facts">
          <div>
            <dt>{t.platforms}</dt>
            <dd className="pkg-fact-chips">
              {entry.platforms.map((id) => {
                const p = PLATFORM_BY_ID.get(id);
                if (!p) return null;
                const lang = id === "lse" && entry.lang ? LSE_LANGUAGES[entry.lang] : undefined;
                return (
                  <RouterLink key={id} href={serializeQuery({ ...DEFAULT_STATE, platform: { inc: [id], exc: [] } })} className={`kit-badge kit-badge-${p.tone}`}>
                    {lang ? `${p.short} · ${lang}` : p.label[locale]}
                  </RouterLink>
                );
              })}
            </dd>
          </div>
          {entry.env.length ? (
            <div>
              <dt>{t.environment}</dt>
              <dd className="pkg-fact-chips">
                {entry.env.map((id) => (
                  <span key={id} className="pkg-chip">
                    {ENV_BY_ID.get(id)?.label[locale]}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
          {os.length ? (
            <div>
              <dt>{t.os}</dt>
              <dd className="pkg-fact-chips">
                {os.map((p) => (
                  <span key={p} className="pkg-chip pkg-chip-mono">
                    {p || t.osAny}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
      </Panel>

      <Panel id="pkg-side-links" title={t.links}>
        <ul className="pkg-side-links">
          <li>
            <ExternalLink href={repository}>{t.sourceCode}</ExternalLink>
          </li>
          {hasIssues ? (
            <li>
              <ExternalLink href={`${repository}/issues`}>{t.issues}</ExternalLink>
            </li>
          ) : null}
          <li>
            <ExternalLink href={`${repository}/releases`}>{t.releases}</ExternalLink>
          </li>
          {variants ? (
            // only when lipr has the manifest (it lacks some versions it lists)
            <li>
              <ExternalLink href={getPackageManifestUrl(tooth, selection.version)}>{t.manifest}</ExternalLink>
            </li>
          ) : null}
        </ul>
      </Panel>

      <Panel id="pkg-side-creators" title={t.creators}>
        <a className="pkg-creator" href={`https://github.com/${entry.owner}`} target="_blank" rel="noopener noreferrer">
          <img className="pkg-creator-avatar" src={ownerAvatar(entry.owner, 64)} alt="" width={32} height={32} loading="lazy" referrerPolicy="no-referrer" />
          <span className="pkg-creator-text">
            <span className="pkg-creator-name">{entry.owner}</span>
            <span className="pkg-creator-role">{t.owner}</span>
          </span>
        </a>
      </Panel>

      {/* the panels keep the ids of the old page's (#pkg-variants-title, #pkg-versions-title, #pkg-meta-title) */}
      <Panel id="pkg-variants-title" title={t.variants}>
        <ul className="pkg-chips">
          {labels.map((v) => {
            const versions = getVersionsForVariant(pkg, v);
            const version = versions.includes(selection.version) ? selection.version : versions.at(-1);
            if (!version) return null;
            return (
              <li key={v}>
                <RouterLink
                  href={buildPackageUrl(tooth, pkg, { variant: v, version })}
                  className="pkg-chip pkg-chip-link pkg-chip-mono"
                  aria-current={v === selection.variant ? "true" : undefined}
                >
                  {v === "" ? t.defaultVariant : v}
                </RouterLink>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel id="pkg-versions-title" title={t.versions}>
        <ul className="pkg-chips">
          {recent.map((version) => (
            <li key={version}>
              <RouterLink
                href={buildPackageUrl(tooth, pkg, { variant: selection.variant, version })}
                className="pkg-chip pkg-chip-link pkg-chip-mono"
                aria-current={version === selection.version ? "true" : undefined}
              >
                {version}
              </RouterLink>
            </li>
          ))}
        </ul>
        <RouterLink href={buildPackageUrl(tooth, pkg, selection, "versions")} className="pkg-side-link pkg-side-all">
          {t.allVersions(formatNumber(getAllVersions(pkg).length, locale))}
        </RouterLink>
      </Panel>

      <Panel id="pkg-meta-title" title={t.details}>
        <dl className="pkg-meta">
          {entry.license ? (
            <div className="pkg-meta-row">
              <dt>{t.license}</dt>
              <dd className="pkg-meta-mono">{entry.license === "NOASSERTION" ? "Other" : entry.license}</dd>
            </div>
          ) : null}
          {firstRelease ? (
            <div className="pkg-meta-row">
              <dt>{t.published}</dt>
              <dd>
                <LocalDate value={firstRelease} />
              </dd>
            </div>
          ) : null}
          <div className="pkg-meta-row">
            <dt>{t.updated}</dt>
            <dd>
              <LocalDate value={entry.updated} />
            </dd>
          </div>
          <div className="pkg-meta-row pkg-meta-stack">
            <dt>{t.packageId}</dt>
            <dd className="pkg-meta-id">
              <code>{tooth}</code>
              <CopyButton text={tooth} />
            </dd>
          </div>
        </dl>
      </Panel>

      {pkg.info.tags?.length ? (
        <Panel id="pkg-side-tags" title={t.tags}>
          <ul className="pkg-chips">
            {pkg.info.tags.map((tag) => (
              <li key={tag}>
                <RouterLink href={serializeQuery({ ...DEFAULT_STATE, tags: [tag] })} className="pkg-chip pkg-chip-link">
                  #{tag}
                </RouterLink>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </>
  );
}
