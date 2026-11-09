import { FEATURED_BY_ID } from "../data/featured-tags";
import { LICENSE_FAMILY_BY_ID } from "../data/licenses";
import { SIDE_BY_ID } from "../data/sides";
import type { SpriteName } from "../data/sprites";
import { useI18n } from "../i18n";
import { clearFilters, serializeQuery, type QueryState } from "../lib/catalog-query";
import { RouterLink } from "./router-link";
import { MaskIcon, Sprite } from "./sprite";

interface ActiveChip {
  key: string;
  label: string;
  icon?: SpriteName;
  excluded?: boolean;
  /** The state without this filter. */
  without: QueryState;
}

/** One chip per filter that is on, in the order of the sidebar. */
export function useActiveChips(state: QueryState, names?: ReadonlyMap<string, string>): ActiveChip[] {
  const { t, locale } = useI18n();
  const reset = { page: 1 };
  const chips: ActiveChip[] = [];
  for (const v of state.gv) {
    chips.push({ key: `g${v}`, label: v, without: { ...state, ...reset, gv: state.gv.filter((x) => x !== v) } });
  }
  for (const id of state.side) {
    const side = SIDE_BY_ID.get(id);
    if (side) chips.push({ key: `s${id}`, label: side.label[locale], icon: side.icon, without: { ...state, ...reset, side: state.side.filter((x) => x !== id) } });
  }
  for (const id of state.platform) {
    chips.push({ key: `p${id}`, label: id, without: { ...state, ...reset, platform: state.platform.filter((x) => x !== id) } });
  }
  for (const key of state.tags.inc) {
    const f = FEATURED_BY_ID.get(key);
    chips.push({ key: `t+${key}`, label: f ? f.label[locale] : `#${key}`, icon: f?.icon, without: { ...state, ...reset, tags: { ...state.tags, inc: state.tags.inc.filter((x) => x !== key) } } });
  }
  for (const key of state.tags.exc) {
    const f = FEATURED_BY_ID.get(key);
    chips.push({ key: `t-${key}`, label: t.notLabel(f ? f.label[locale] : `#${key}`), icon: f?.icon, excluded: true, without: { ...state, ...reset, tags: { ...state.tags, exc: state.tags.exc.filter((x) => x !== key) } } });
  }
  for (const v of state.license) {
    const family = LICENSE_FAMILY_BY_ID.get(v as never);
    chips.push({ key: `l${v}`, label: family ? family.label[locale] : v, without: { ...state, ...reset, license: state.license.filter((x) => x !== v) } });
  }
  for (const d of state.dep) {
    const name = [...(names ?? [])].find(([tooth]) => tooth.toLowerCase() === d.toLowerCase())?.[1] ?? d.split("/").at(-1)!;
    chips.push({ key: `d${d}`, label: t.dependsOnLabel(name), without: { ...state, ...reset, dep: state.dep.filter((x) => x !== d) } });
  }
  for (const a of state.author) {
    chips.push({ key: `a${a}`, label: t.byOwner(a), without: { ...state, ...reset, author: state.author.filter((x) => x !== a) } });
  }
  return chips;
}

/** "Clear all" and one removable chip per filter. */
export function ActiveFilters({ state, names, className }: { state: QueryState; names?: ReadonlyMap<string, string>; className?: string }) {
  const { t } = useI18n();
  const chips = useActiveChips(state, names);
  if (!chips.length) return null;
  return (
    <ul className={`mods-active${className ? ` ${className}` : ""}`} aria-label={t.activeFilters}>
      <li>
        <RouterLink href={serializeQuery(clearFilters(state))} className="mods-chip mods-chip-link mods-chip-clear">
          <MaskIcon name="close" />
          {t.clearAll}
        </RouterLink>
      </li>
      {chips.map((c) => (
        <li key={c.key}>
          <RouterLink
            href={serializeQuery(c.without)}
            className={`mods-chip mods-chip-link mods-chip-active${c.excluded ? " is-excluded" : ""}`}
            aria-label={t.removeFilter(c.label)}
          >
            <span className="mods-chip-x" aria-hidden="true">
              ×
            </span>
            {c.icon ? <Sprite name={c.icon} /> : null}
            {c.label}
          </RouterLink>
        </li>
      ))}
    </ul>
  );
}
