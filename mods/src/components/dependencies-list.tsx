import { useI18n } from "../i18n";
import { modPath, variantDeps, type ModSelection } from "../lib/mods";
import type { EntryJson, RelatedMod } from "../types";
import { ProjectIcon } from "./project-icon";
import { RouterLink } from "./router-link";

function RelatedCard({ mod, range, notListed }: { mod: RelatedMod; range?: string; notListed: string }) {
  return (
    <li className="px-card mods-dep">
      <span className="kit-slot mods-dep-icon">
        <ProjectIcon icon={mod.logo} iconId={mod.logoId} size={40} />
      </span>
      <span className="mods-dep-text">
        <span className="mods-dep-title">
          {mod.listed ? (
            <RouterLink href={modPath(mod.id)} className="mods-dep-name">
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
            <span className="mods-dep-id" title={mod.id}>
              {mod.id}
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
  /** The selected version's variants: name → entries (`undefined` while loading, `null` without a package file). */
  variants: Record<string, EntryJson[]> | null | undefined;
  related: Record<string, RelatedMod>;
  dependents: RelatedMod[];
}

/** What the selected version needs, and which mods need this one. */
export function DependenciesList({ selection, variants, related, dependents }: DependenciesListProps) {
  const { t } = useI18n();
  // every entry's (one per side and platform), together
  const deps = Object.entries(variantDeps(variants?.[selection.variant]));
  const relatedOf = (key: string): RelatedMod => {
    const [id = key, label] = key.split("#");
    const found = related[id.toLowerCase()];
    // a mod outside the index is shown as the manifest spells it
    const base = found?.listed ? found : { id: key, name: id.split("/").at(-1) ?? id, owner: "" };
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
      <section aria-labelledby="mods-deps-dependents">
        <h3 id="mods-deps-dependents" className="mods-section-title">
          {t.depsRequiredBy(dependents.length)}
        </h3>
        {dependents.length ? (
          <ul className="mods-deps">
            {dependents.map((d) => (
              <RelatedCard key={d.id} mod={d} notListed={t.depsNotIndexed} />
            ))}
          </ul>
        ) : (
          <p className="mods-empty-note">{t.depsNoDependents}</p>
        )}
      </section>
    </div>
  );
}
