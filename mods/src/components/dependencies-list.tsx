import { useI18n } from "../i18n";
import { modPath, type ModSelection } from "../lib/mods";
import type { ManifestVariant, RelatedMod } from "../types";
import { ProjectIcon } from "./project-icon";
import { RouterLink } from "./router-link";

function RelatedCard({ mod, range, notListed }: { mod: RelatedMod; range?: string; notListed: string }) {
  return (
    <li className="px-card mods-dep">
      <span className="kit-slot mods-dep-icon">
        <ProjectIcon icon={mod.icon} owner={mod.listed ? mod.owner : ""} size={40} />
      </span>
      <span className="mods-dep-text">
        <span className="mods-dep-title">
          {mod.listed ? (
            <RouterLink href={modPath(mod.tooth)} className="mods-dep-name">
              {mod.name}
            </RouterLink>
          ) : (
            <span className="mods-dep-name">{mod.name}</span>
          )}
        </span>
        {mod.listed ? (
          <span className="mods-dep-meta">{mod.owner}</span>
        ) : (
          <span className="mods-dep-meta mods-dep-unlisted">
            <span className="kit-badge kit-badge-stone">{notListed}</span>
            <span className="mods-dep-tooth" title={mod.tooth}>
              {mod.tooth}
            </span>
          </span>
        )}
      </span>
      {range ? (
        <code className="mods-chip mods-chip-mono mods-dep-range" title={range}>
          {range}
        </code>
      ) : null}
    </li>
  );
}

interface DependenciesListProps {
  selection: ModSelection;
  /** The selected version's manifest variants (`undefined` while loading, `null` without a manifest). */
  variants: ManifestVariant[] | null | undefined;
  related: Record<string, RelatedMod>;
  dependents: RelatedMod[];
  dependentsKnown: boolean;
}

/** What the selected version needs, and which mods need this one. */
export function DependenciesList({ selection, variants, related, dependents, dependentsKnown }: DependenciesListProps) {
  const { t } = useI18n();
  const variant = variants?.find((v) => v.label === selection.variant);
  const deps = Object.entries(variant?.dependencies ?? {});
  const relatedOf = (key: string): RelatedMod => {
    const [tooth = key, label] = key.split("#");
    const found = related[tooth.toLowerCase()];
    // a mod outside the index is shown as the manifest spells it
    const base = found?.listed ? found : { tooth: key, name: tooth.split("/").at(-1) ?? tooth, owner: "" };
    return label ? { ...base, name: `${base.name} #${label}` } : base;
  };
  return (
    <div className="mods-deps-tab">
      <section aria-labelledby="mods-deps-required">
        <h3 id="mods-deps-required" className="mods-section-title">
          {t.depsRequired} <span className="mods-section-note">{t.depsOf(selection.version)}</span>
        </h3>
        {variants === undefined ? (
          <p className="mods-empty-note">{t.loading}</p>
        ) : variants === null ? (
          <p className="mods-empty-note">{t.depsUnavailable}</p>
        ) : deps.length ? (
          <ul className="mods-deps">
            {deps.map(([key, range]) => (
              <RelatedCard key={key} mod={relatedOf(key)} range={range} notListed={t.depsNotIndexed} />
            ))}
          </ul>
        ) : (
          <p className="mods-empty-note">{t.depsNone}</p>
        )}
      </section>
      {dependentsKnown ? (
        <section aria-labelledby="mods-deps-dependents">
          <h3 id="mods-deps-dependents" className="mods-section-title">
            {t.depsRequiredBy(dependents.length)}
          </h3>
          {dependents.length ? (
            <ul className="mods-deps">
              {dependents.map((d) => (
                <RelatedCard key={d.tooth} mod={d} notListed={t.depsNotIndexed} />
              ))}
            </ul>
          ) : (
            <p className="mods-empty-note">{t.depsNoDependents}</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
