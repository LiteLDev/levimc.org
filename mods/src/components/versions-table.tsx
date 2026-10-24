import { useState } from "react";
import { PixelIcon, Pagination } from "../kit-ui";
import { useI18n } from "../i18n";
import {
  buildModUrl,
  getReleaseUrl,
  getSortedVariants,
  getVersionsForVariant,
  installCommand,
  isPrerelease,
  type ModSelection,
} from "../lib/mods";
import type { RawModEntry, ReleaseInfo } from "../types";
import { CopyButton } from "./copy-button";
import { HotbarRadio } from "./hotbar-radio";
import { RelativeDate } from "./local-date";
import { RouterLink } from "./router-link";

const PER_PAGE = 20;

interface VersionsTableProps {
  tooth: string;
  mod: RawModEntry;
  repository: string;
  selection: ModSelection;
  releases: Record<string, ReleaseInfo>;
  llRanges: Record<string, Record<string, string>>;
}

/**
 * Every version of a variant, newest first: channel, version (opens its
 * README), the variants that have it, the LeviLamina range it needs, when it
 * was published, and its install command and release.
 */
export function VersionsTable({ tooth, mod, repository, selection, releases, llRanges }: VersionsTableProps) {
  const { t } = useI18n();
  const variants = getSortedVariants(mod);
  const [variant, setVariant] = useState(selection.variant);
  const all = getVersionsForVariant(mod, variant).slice().reverse();
  const onlyPre = all.length > 0 && all.every(isPrerelease);
  const [showPre, setShowPre] = useState(true);
  const [page, setPage] = useState(1);
  const versions = showPre || onlyPre ? all : all.filter((v) => !isPrerelease(v));
  const pageCount = Math.max(1, Math.ceil(versions.length / PER_PAGE));
  const current = Math.min(page, pageCount);
  const shown = versions.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const label = (v: string) => (v === "" ? t.defaultVariant : v);
  const variantsOf = (version: string) => variants.filter((v) => mod.variants[v]?.versions.includes(version));
  const hasRanges = Object.keys(llRanges).length > 0;
  const hasDates = Object.keys(releases).length > 0;

  return (
    <div className="mods-versions-tab">
      <div className="mods-versions-bar">
        {variants.length > 1 ? (
          <HotbarRadio
            label={t.variant}
            options={variants.map((v) => ({ value: v, label: label(v) }))}
            value={variant}
            onChange={(v) => {
              setVariant(v);
              setPage(1);
            }}
          />
        ) : null}
        {!onlyPre && all.some(isPrerelease) ? (
          <button
            type="button"
            className="mc-btn mc-btn-sm mods-toggle"
            aria-pressed={showPre}
            onClick={() => {
              setShowPre(!showPre);
              setPage(1);
            }}
          >
            <PixelIcon name={showPre ? "check" : "close"} />
            {t.showPrereleases}
          </button>
        ) : null}
        <Pagination
          page={current}
          pageCount={pageCount}
          hrefFor={() => "#versions"}
          onNavigate={(p, e) => {
            e.preventDefault();
            setPage(p);
          }}
          label={t.pagination}
          previousLabel={t.previousPage}
          nextLabel={t.nextPage}
          className="mods-versions-pager"
        />
      </div>
      {shown.length ? (
        <table className="mods-versions-table">
          <thead>
            <tr>
              <th scope="col">
                <span className="kit-sr-only">{t.release}</span>
              </th>
              <th scope="col">{t.colVersion}</th>
              <th scope="col">{t.colVariants}</th>
              {hasRanges ? <th scope="col">{t.colLeviLamina}</th> : null}
              {hasDates ? <th scope="col">{t.colPublished}</th> : null}
              <th scope="col">
                <span className="kit-sr-only">{t.colActions}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((version) => {
              const pre = releases[version]?.prerelease ?? isPrerelease(version);
              const isCurrent = version === selection.version && variant === selection.variant;
              const range = llRanges[variant]?.[version];
              return (
                <tr key={version} aria-current={isCurrent ? "true" : undefined}>
                  <td className="mods-vt-channel">
                    <span className={`px-dot mods-channel ${pre ? "is-pre" : "is-release"}`} title={pre ? t.prerelease : t.release} />
                    <span className="kit-sr-only">{pre ? t.prerelease : t.release}</span>
                  </td>
                  <td className="mods-vt-version">
                    <RouterLink href={buildModUrl(tooth, mod, { variant, version })} aria-current={isCurrent ? "page" : undefined}>
                      {version}
                    </RouterLink>
                    {isCurrent ? <span className="kit-sr-only"> ({t.current})</span> : null}
                  </td>
                  <td className="mods-vt-variants">
                    {variantsOf(version).map((v) => (
                      <span key={v} className="mods-chip mods-chip-mono">
                        {label(v)}
                      </span>
                    ))}
                  </td>
                  {hasRanges ? <td className="mods-vt-range">{range ? <code>{range}</code> : null}</td> : null}
                  {hasDates ? (
                    <td className="mods-vt-date">{releases[version] ? <RelativeDate value={releases[version]!.date} /> : null}</td>
                  ) : null}
                  <td className="mods-vt-actions">
                    <CopyButton text={installCommand(tooth, variant, version)} label={t.copyInstall(version)} />
                    <a
                      className="mc-icon-btn"
                      href={getReleaseUrl(repository, releases[version])}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t.releaseOnGitHub(version)}
                    >
                      <PixelIcon name="external" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="mods-empty-note">{t.noVersions(label(variant))}</p>
      )}
    </div>
  );
}
