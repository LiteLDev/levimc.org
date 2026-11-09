import { useEffect, useId, useRef, useState } from "react";
import { BrandIcon, PixelIcon } from "../kit-ui";
import { SIDE_BY_ID } from "../data/sides";
import { useI18n } from "../i18n";
import { getReleaseUrl, getSortedVariants, getVersionsForVariant, type ModSelection } from "../lib/mods";
import type { RawModEntry, ReleaseInfo, VersionTarget } from "../types";
import { HotbarRadio } from "./hotbar-radio";
import { InstallCommand } from "./install-commands";
import { Sprite } from "./sprite";

interface InstallDialogProps {
  open: boolean;
  onClose: () => void;
  name: string;
  modId: string;
  mod: RawModEntry;
  repository: string;
  /** The page's selection: the dialog starts there. */
  selection: ModSelection;
  /** GitHub releases by version. */
  releases: Record<string, ReleaseInfo>;
  /** What each version runs on, per variant. */
  targets: Record<string, Record<string, VersionTarget>>;
}

/**
 * Modrinth's download dialog for a CLI: pick a variant and a version, see
 * the sides and platforms it runs on, copy the `lip install` command (when it
 * has a server entry: lip installs into server folders), follow the
 * LeviLauncher hint (when it has a client entry), or open the release on GitHub.
 */
export function InstallDialog({ open, onClose, name, modId, mod, repository, selection, releases, targets }: InstallDialogProps) {
  const { t, locale } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [variant, setVariant] = useState(selection.variant);
  const [version, setVersion] = useState(selection.version);
  const versionId = useId();
  // the id of the old page's Install heading, so #mods-install-title links still land on a heading
  const titleId = "mods-install-title";

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setVariant(selection.variant);
      setVersion(selection.version);
      dialog.showModal();
    } else if (!open && dialog.open) dialog.close();
  }, [open, selection.variant, selection.version]);

  const variants = getSortedVariants(mod);
  const versions = getVersionsForVariant(mod, variant).slice().reverse();
  const shownVersion = versions.includes(version) ? version : (versions[0] ?? version);
  const label = (v: string) => (v === "" ? t.defaultVariant : v);
  // a version the build did not read shows both ways to install it
  const target = targets[variant]?.[shownVersion];
  const server = !target || target.side.includes("server");
  const client = !target || target.side.includes("client");

  return (
    <dialog
      ref={ref}
      className="mods-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className="px-card mods-dialog-panel">
        <header className="mods-dialog-head">
          <h2 id={titleId}>{t.installTitle(name)}</h2>
          <button type="button" className="mc-icon-btn" aria-label={t.close} onClick={() => ref.current?.close()}>
            <PixelIcon name="close" />
          </button>
        </header>
        {variants.length > 1 ? (
          <div className="mods-dialog-field">
            <span className="mods-dialog-label" aria-hidden="true">
              {t.variant}
            </span>
            <HotbarRadio
              label={t.variant}
              className="mods-dialog-variants"
              options={variants.map((v) => ({ value: v, label: label(v) }))}
              value={variant}
              onChange={(v) => setVariant(v)}
            />
          </div>
        ) : null}
        <div className="mods-dialog-field">
          <label className="mods-dialog-label" htmlFor={versionId}>
            {t.version}
          </label>
          <select id={versionId} className="mc-input mods-dialog-select" value={shownVersion} onChange={(e) => setVersion(e.target.value)}>
            {versions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        {target?.platform.length ? (
          <div className="mods-dialog-field">
            <span className="mods-dialog-label">{t.installPlatforms}</span>
            <ul className="mods-chips mods-dialog-targets">
              {target.side.map((id) => {
                const side = SIDE_BY_ID.get(id)!;
                return (
                  <li key={id}>
                    <span className="mods-chip">
                      <Sprite name={side.icon} />
                      {side.label[locale]}
                    </span>
                  </li>
                );
              })}
              {target.platform.map((id) => (
                <li key={id}>
                  <span className="mods-chip mods-chip-mono">{id}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {server ? (
          <>
            <p className="mods-dialog-hint">{t.installHint}</p>
            <InstallCommand modId={modId} variant={variant} version={shownVersion} />
          </>
        ) : null}
        {client ? (
          <p className="mods-dialog-hint">
            {t.clientHint}{" "}
            <a href={t.clientHintUrl} target="_blank" rel="noopener noreferrer">
              LeviLauncher
            </a>
          </p>
        ) : null}
        <a className="mc-btn mods-dialog-download" href={getReleaseUrl(repository, releases[shownVersion])} target="_blank" rel="noopener noreferrer">
          <BrandIcon name="github" size={16} />
          {t.downloadFromGitHub}
          <PixelIcon name="external" />
        </a>
      </div>
    </dialog>
  );
}
