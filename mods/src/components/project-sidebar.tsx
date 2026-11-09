import type { ReactNode } from "react";
import { featuredTagsOf, plainTagsOf } from "../data/featured-tags";
import { LICENSE_FAMILY_BY_ID, licenseFamily, licenseOf } from "../data/licenses";
import { SIDE_BY_ID } from "../data/sides";
import { formatNumber, useI18n } from "../i18n";
import { DEFAULT_STATE, serializeQuery, type QueryState } from "../lib/catalog-query";
import {
  buildModUrl,
  getAllVersions,
  getManifestUrl,
  getSortedVariants,
  getVersionsForVariant,
  ownerAvatar,
  ownerUrl,
  type ModSelection,
} from "../lib/mods";
import type { CatalogEntry, RawModEntry, ReleaseInfo, VersionTarget } from "../types";
import { CopyButton } from "./copy-button";
import { LocalDate } from "./local-date";
import { RouterLink } from "./router-link";
import { MaskIcon, Sprite } from "./sprite";

/** Versions listed in the sidebar; the Versions tab has them all. */
const RECENT = 6;

/** The listing filtered by one thing. */
const listing = (patch: Partial<QueryState>) => serializeQuery({ ...DEFAULT_STATE, ...patch });

function Panel({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="px-card mods-panel mods-side-panel" aria-labelledby={id}>
      <h2 id={id} className="mods-panel-title">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="mods-side-link">
      {children}
      <MaskIcon name="external" className="mods-side-link-ext" />
    </a>
  );
}

interface ProjectSidebarProps {
  modId: string;
  entry: CatalogEntry;
  mod: RawModEntry;
  repository: string;
  selection: ModSelection;
  /** What each version runs on, per variant. */
  targets: Record<string, Record<string, VersionTarget>>;
  /** The versions read from a `lip.toml`. */
  lipToml: string[];
  releases: Record<string, ReleaseInfo>;
  hasIssues: boolean;
}

/** Compatibility, links, creators, details and tags, like Modrinth's right column. */
export function ProjectSidebar({ modId, entry, mod, repository, selection, targets, lipToml, releases, hasIssues }: ProjectSidebarProps) {
  const { t, locale } = useI18n();
  // the selection's sides and platforms (the mod's latest, when the build did not read that version)
  const target = targets[selection.variant]?.[selection.version] ?? { side: entry.side, platform: entry.platform };
  const firstRelease = Object.values(releases).reduce<string | undefined>((min, r) => (!min || r.date < min ? r.date : min), undefined);
  const labels = getSortedVariants(mod);
  /** The latest versions of the selected variant. */
  const recent = getVersionsForVariant(mod, selection.variant).slice(-RECENT).reverse();
  const license = licenseOf(entry);
  const family = LICENSE_FAMILY_BY_ID.get(licenseFamily(license))!;
  const featured = featuredTagsOf(entry.tags);
  const plain = plainTagsOf(entry.tags);
  return (
    <>
      <Panel id="mods-side-compat" title={t.compatibility}>
        <dl className="mods-facts">
          {target.side.length ? (
            <div>
              <dt>{t.side}</dt>
              <dd className="mods-fact-chips">
                {target.side.map((id) => {
                  const side = SIDE_BY_ID.get(id)!;
                  return (
                    <RouterLink key={id} href={listing({ side: [id] })} className="mods-chip mods-chip-link">
                      <Sprite name={side.icon} />
                      {side.label[locale]}
                    </RouterLink>
                  );
                })}
              </dd>
            </div>
          ) : null}
          {target.platform.length ? (
            <div>
              <dt>{t.platform}</dt>
              <dd className="mods-fact-chips">
                {target.platform.map((id) => (
                  <RouterLink key={id} href={listing({ platform: [id] })} className="mods-chip mods-chip-link mods-chip-mono">
                    {id}
                  </RouterLink>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
      </Panel>

      <Panel id="mods-side-links" title={t.links}>
        <ul className="mods-side-links">
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
          <li>
            <ExternalLink href={getManifestUrl(repository, selection.version, lipToml.includes(selection.version) ? "lip.toml" : "tooth.json")}>
              {t.manifest}
            </ExternalLink>
          </li>
        </ul>
      </Panel>

      <Panel id="mods-side-creators" title={t.creators}>
        <a className="mods-creator" href={ownerUrl(entry.owner)} target="_blank" rel="noopener noreferrer">
          <img className="mods-creator-avatar" src={ownerAvatar(entry.owner, 64)} alt="" width={32} height={32} loading="lazy" referrerPolicy="no-referrer" />
          <span className="mods-creator-text">
            <span className="mods-creator-name">{entry.owner}</span>
            <span className="mods-creator-role">{t.author}</span>
          </span>
        </a>
        <RouterLink href={listing({ author: [entry.owner] })} className="mods-side-link mods-side-all">
          {t.moreByOwner(entry.owner)}
        </RouterLink>
      </Panel>

      {/* the panels keep the ids of the old page's (#mods-variants-title, #mods-versions-title, #mods-meta-title) */}
      <Panel id="mods-variants-title" title={t.variants}>
        <ul className="mods-chips">
          {labels.map((v) => {
            const versions = getVersionsForVariant(mod, v);
            const version = versions.includes(selection.version) ? selection.version : versions.at(-1);
            if (!version) return null;
            return (
              <li key={v}>
                <RouterLink
                  href={buildModUrl(modId, mod, { variant: v, version })}
                  className="mods-chip mods-chip-link mods-chip-mono"
                  aria-current={v === selection.variant ? "true" : undefined}
                >
                  {v === "" ? t.defaultVariant : v}
                </RouterLink>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel id="mods-versions-title" title={t.versions}>
        <ul className="mods-chips">
          {recent.map((version) => (
            <li key={version}>
              <RouterLink
                href={buildModUrl(modId, mod, { variant: selection.variant, version })}
                className="mods-chip mods-chip-link mods-chip-mono"
                aria-current={version === selection.version ? "true" : undefined}
              >
                {version}
              </RouterLink>
            </li>
          ))}
        </ul>
        <RouterLink href={buildModUrl(modId, mod, selection, "versions")} className="mods-side-link mods-side-all">
          {t.allVersions(formatNumber(getAllVersions(mod).length, locale))}
        </RouterLink>
      </Panel>

      <Panel id="mods-meta-title" title={t.details}>
        <dl className="mods-meta">
          {license ? (
            <div className="mods-meta-row">
              <dt>{t.license}</dt>
              <dd className="mods-meta-license">
                <RouterLink href={listing({ license: [family.id] })}>{family.label[locale]}</RouterLink>
                {license !== "NOASSERTION" ? <code className="mods-meta-mono">{license}</code> : null}
              </dd>
            </div>
          ) : null}
          {firstRelease ? (
            <div className="mods-meta-row">
              <dt>{t.published}</dt>
              <dd>
                <LocalDate value={firstRelease} />
              </dd>
            </div>
          ) : null}
          <div className="mods-meta-row">
            <dt>{t.updated}</dt>
            <dd>
              <LocalDate value={entry.updated} />
            </dd>
          </div>
          <div className="mods-meta-row mods-meta-stack">
            <dt>{t.modId}</dt>
            <dd className="mods-meta-id">
              <code>{modId}</code>
              <CopyButton text={modId} />
            </dd>
          </div>
        </dl>
      </Panel>

      {featured.length || plain.length ? (
        <Panel id="mods-side-tags" title={t.tags}>
          <ul className="mods-chips">
            {featured.map(({ tag, raw }) => (
              <li key={tag.id}>
                <RouterLink href={listing({ tags: { inc: [tag.id], exc: [] } })} className="mods-chip mods-chip-link">
                  <Sprite name={tag.icon} />
                  {tag.label[locale]}
                  <span className="mods-raw-tag">{raw.join(" ")}</span>
                </RouterLink>
              </li>
            ))}
            {plain.map((tag) => (
              <li key={tag}>
                <RouterLink href={listing({ tags: { inc: [tag], exc: [] } })} className="mods-chip mods-chip-link">
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
