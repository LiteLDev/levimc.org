import type { ReactNode } from "react";
import { ENV_BY_ID, LSE_LANGUAGES, PLATFORM_BY_ID } from "../data/categories";
import { formatNumber, useI18n } from "../i18n";
import { serializeQuery, DEFAULT_STATE } from "../lib/catalog-query";
import {
  buildModUrl,
  getAllVersions,
  getManifestUrl,
  getSortedVariants,
  getVersionsForVariant,
  ownerAvatar,
  type ModSelection,
} from "../lib/mods";

/** Versions listed in the sidebar; the Versions tab has them all. */
const RECENT = 6;
import type { CatalogEntry, ManifestVariant, RawModEntry, ReleaseInfo } from "../types";
import { CopyButton } from "./copy-button";
import { LocalDate } from "./local-date";
import { RouterLink } from "./router-link";
import { MaskIcon } from "./sprite";

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
  tooth: string;
  entry: CatalogEntry;
  mod: RawModEntry;
  repository: string;
  selection: ModSelection;
  /** The selected version's manifest variants (`undefined` while loading, `null` without a manifest). */
  variants: ManifestVariant[] | null | undefined;
  releases: Record<string, ReleaseInfo>;
  hasIssues: boolean;
}

/** Compatibility, links, creators, details and tags, like Modrinth's right column. */
export function ProjectSidebar({ tooth, entry, mod, repository, selection, variants, releases, hasIssues }: ProjectSidebarProps) {
  const { t, locale } = useI18n();
  const os = [...new Set((variants ?? []).filter((v) => v.label === selection.variant).map((v) => v.platform ?? ""))];
  const firstRelease = Object.values(releases).reduce<string | undefined>((min, r) => (!min || r.date < min ? r.date : min), undefined);
  const labels = getSortedVariants(mod);
  /** The latest versions of the selected variant. */
  const recent = getVersionsForVariant(mod, selection.variant).slice(-RECENT).reverse();
  return (
    <>
      <Panel id="mods-side-compat" title={t.compatibility}>
        <dl className="mods-facts">
          <div>
            <dt>{t.platforms}</dt>
            <dd className="mods-fact-chips">
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
              <dd className="mods-fact-chips">
                {entry.env.map((id) => (
                  <span key={id} className="mods-chip">
                    {ENV_BY_ID.get(id)?.label[locale]}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
          {os.length ? (
            <div>
              <dt>{t.os}</dt>
              <dd className="mods-fact-chips">
                {os.map((p) => (
                  <span key={p} className="mods-chip mods-chip-mono">
                    {p || t.osAny}
                  </span>
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
            <ExternalLink href={getManifestUrl(repository, selection.version)}>{t.manifest}</ExternalLink>
          </li>
        </ul>
      </Panel>

      <Panel id="mods-side-creators" title={t.creators}>
        <a className="mods-creator" href={`https://github.com/${entry.owner}`} target="_blank" rel="noopener noreferrer">
          <img className="mods-creator-avatar" src={ownerAvatar(entry.owner, 64)} alt="" width={32} height={32} loading="lazy" referrerPolicy="no-referrer" />
          <span className="mods-creator-text">
            <span className="mods-creator-name">{entry.owner}</span>
            <span className="mods-creator-role">{t.owner}</span>
          </span>
        </a>
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
                  href={buildModUrl(tooth, mod, { variant: v, version })}
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
                href={buildModUrl(tooth, mod, { variant: selection.variant, version })}
                className="mods-chip mods-chip-link mods-chip-mono"
                aria-current={version === selection.version ? "true" : undefined}
              >
                {version}
              </RouterLink>
            </li>
          ))}
        </ul>
        <RouterLink href={buildModUrl(tooth, mod, selection, "versions")} className="mods-side-link mods-side-all">
          {t.allVersions(formatNumber(getAllVersions(mod).length, locale))}
        </RouterLink>
      </Panel>

      <Panel id="mods-meta-title" title={t.details}>
        <dl className="mods-meta">
          {entry.license ? (
            <div className="mods-meta-row">
              <dt>{t.license}</dt>
              <dd className="mods-meta-mono">{entry.license === "NOASSERTION" ? "Other" : entry.license}</dd>
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
              <code>{tooth}</code>
              <CopyButton text={tooth} />
            </dd>
          </div>
        </dl>
      </Panel>

      {mod.info.tags?.length ? (
        <Panel id="mods-side-tags" title={t.tags}>
          <ul className="mods-chips">
            {mod.info.tags.map((tag) => (
              <li key={tag}>
                <RouterLink href={serializeQuery({ ...DEFAULT_STATE, tags: [tag] })} className="mods-chip mods-chip-link">
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
