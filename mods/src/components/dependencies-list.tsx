import { useI18n } from "../i18n";
import { packagePath, type PackageSelection } from "../lib/packages";
import type { ManifestVariant, RelatedPackage } from "../types";
import { ProjectIcon } from "./project-icon";
import { RouterLink } from "./router-link";

function RelatedCard({ pkg, range, notListed }: { pkg: RelatedPackage; range?: string; notListed: string }) {
  return (
    <li className="px-card pkg-dep">
      <span className="kit-slot pkg-dep-icon">
        <ProjectIcon icon={pkg.icon} owner={pkg.listed ? pkg.owner : ""} size={40} />
      </span>
      <span className="pkg-dep-text">
        <span className="pkg-dep-title">
          {pkg.listed ? (
            <RouterLink href={packagePath(pkg.tooth)} className="pkg-dep-name">
              {pkg.name}
            </RouterLink>
          ) : (
            <span className="pkg-dep-name">{pkg.name}</span>
          )}
        </span>
        {pkg.listed ? (
          <span className="pkg-dep-meta">{pkg.owner}</span>
        ) : (
          <span className="pkg-dep-meta pkg-dep-unlisted">
            <span className="kit-badge kit-badge-stone">{notListed}</span>
            <span className="pkg-dep-tooth" title={pkg.tooth}>
              {pkg.tooth}
            </span>
          </span>
        )}
      </span>
      {range ? (
        <code className="pkg-chip pkg-chip-mono pkg-dep-range" title={range}>
          {range}
        </code>
      ) : null}
    </li>
  );
}

interface DependenciesListProps {
  selection: PackageSelection;
  /** The selected version's manifest variants (`undefined` while loading, `null` without a manifest). */
  variants: ManifestVariant[] | null | undefined;
  related: Record<string, RelatedPackage>;
  dependents: RelatedPackage[];
  dependentsKnown: boolean;
}

/** What the selected version needs, and which packages need this one. */
export function DependenciesList({ selection, variants, related, dependents, dependentsKnown }: DependenciesListProps) {
  const { t } = useI18n();
  const variant = variants?.find((v) => v.label === selection.variant);
  const deps = Object.entries(variant?.dependencies ?? {});
  const relatedOf = (key: string): RelatedPackage => {
    const [tooth = key, label] = key.split("#");
    const found = related[tooth.toLowerCase()];
    // a package outside the index is shown as the manifest spells it
    const base = found?.listed ? found : { tooth: key, name: tooth.split("/").at(-1) ?? tooth, owner: "" };
    return label ? { ...base, name: `${base.name} #${label}` } : base;
  };
  return (
    <div className="pkg-deps-tab">
      <section aria-labelledby="pkg-deps-required">
        <h3 id="pkg-deps-required" className="pkg-section-title">
          {t.depsRequired} <span className="pkg-section-note">{t.depsOf(selection.version)}</span>
        </h3>
        {variants === undefined ? (
          <p className="pkg-empty-note">{t.loading}</p>
        ) : variants === null ? (
          <p className="pkg-empty-note">{t.depsUnavailable}</p>
        ) : deps.length ? (
          <ul className="pkg-deps">
            {deps.map(([key, range]) => (
              <RelatedCard key={key} pkg={relatedOf(key)} range={range} notListed={t.depsNotIndexed} />
            ))}
          </ul>
        ) : (
          <p className="pkg-empty-note">{t.depsNone}</p>
        )}
      </section>
      {dependentsKnown ? (
        <section aria-labelledby="pkg-deps-dependents">
          <h3 id="pkg-deps-dependents" className="pkg-section-title">
            {t.depsRequiredBy(dependents.length)}
          </h3>
          {dependents.length ? (
            <ul className="pkg-deps">
              {dependents.map((d) => (
                <RelatedCard key={d.tooth} pkg={d} notListed={t.depsNotIndexed} />
              ))}
            </ul>
          ) : (
            <p className="pkg-empty-note">{t.depsNoDependents}</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
