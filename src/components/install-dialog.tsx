import { useEffect, useId, useRef, useState } from "react";
import { BrandIcon, PixelIcon } from "../kit-ui";
import { useI18n } from "../i18n";
import { getReleaseUrl, getSortedVariants, getVersionsForVariant, type PackageSelection } from "../lib/packages";
import type { RawPackageEntry, ReleaseInfo } from "../types";
import { HotbarRadio } from "./hotbar-radio";
import { InstallCommand } from "./install-commands";

interface InstallDialogProps {
  open: boolean;
  onClose: () => void;
  name: string;
  tooth: string;
  pkg: RawPackageEntry;
  repository: string;
  /** The page's selection: the dialog starts there. */
  selection: PackageSelection;
  /** GitHub releases by version. */
  releases: Record<string, ReleaseInfo>;
}

/**
 * Modrinth's download dialog for a CLI: pick a variant and a version, copy
 * the `lip install` command, or open the release on GitHub.
 */
export function InstallDialog({ open, onClose, name, tooth, pkg, repository, selection, releases }: InstallDialogProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [variant, setVariant] = useState(selection.variant);
  const [version, setVersion] = useState(selection.version);
  const versionId = useId();
  // the id of the old page's Install heading, so #pkg-install-title links still land on a heading
  const titleId = "pkg-install-title";

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setVariant(selection.variant);
      setVersion(selection.version);
      dialog.showModal();
    } else if (!open && dialog.open) dialog.close();
  }, [open, selection.variant, selection.version]);

  const variants = getSortedVariants(pkg);
  const versions = getVersionsForVariant(pkg, variant).slice().reverse();
  const shownVersion = versions.includes(version) ? version : (versions[0] ?? version);
  const label = (v: string) => (v === "" ? t.defaultVariant : v);

  return (
    <dialog
      ref={ref}
      className="pkg-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className="px-card pkg-dialog-panel">
        <header className="pkg-dialog-head">
          <h2 id={titleId}>{t.installTitle(name)}</h2>
          <button type="button" className="mc-icon-btn" aria-label={t.close} onClick={() => ref.current?.close()}>
            <PixelIcon name="close" />
          </button>
        </header>
        {variants.length > 1 ? (
          <div className="pkg-dialog-field">
            <span className="pkg-dialog-label" aria-hidden="true">
              {t.variant}
            </span>
            <HotbarRadio
              label={t.variant}
              className="pkg-dialog-variants"
              options={variants.map((v) => ({ value: v, label: label(v) }))}
              value={variant}
              onChange={(v) => setVariant(v)}
            />
          </div>
        ) : null}
        <div className="pkg-dialog-field">
          <label className="pkg-dialog-label" htmlFor={versionId}>
            {t.version}
          </label>
          <select id={versionId} className="mc-input pkg-dialog-select" value={shownVersion} onChange={(e) => setVersion(e.target.value)}>
            {versions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <p className="pkg-dialog-hint">{t.installHint}</p>
        <InstallCommand tooth={tooth} variant={variant} version={shownVersion} />
        <a className="mc-btn pkg-dialog-download" href={getReleaseUrl(repository, releases[shownVersion])} target="_blank" rel="noopener noreferrer">
          <BrandIcon name="github" size={16} />
          {t.downloadFromGitHub}
          <PixelIcon name="external" />
        </a>
      </div>
    </dialog>
  );
}
