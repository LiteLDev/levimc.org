import { CATEGORY_BY_ID, ENV_BY_ID, PLATFORM_BY_ID, type SpriteName } from "../data/categories";
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
  for (const id of state.platform.inc) {
    const p = PLATFORM_BY_ID.get(id as never);
    if (p) chips.push({ key: `p+${id}`, label: p.label[locale], icon: p.icon, without: { ...state, ...reset, platform: { ...state.platform, inc: state.platform.inc.filter((x) => x !== id) } } });
  }
  for (const id of state.platform.exc) {
    const p = PLATFORM_BY_ID.get(id as never);
    if (p) chips.push({ key: `p-${id}`, label: t.notLabel(p.label[locale]), icon: p.icon, excluded: true, without: { ...state, ...reset, platform: { ...state.platform, exc: state.platform.exc.filter((x) => x !== id) } } });
  }
  for (const id of state.cat.inc) {
    const c = CATEGORY_BY_ID.get(id);
    if (c) chips.push({ key: `c+${id}`, label: c.label[locale], icon: c.icon, without: { ...state, ...reset, cat: { ...state.cat, inc: state.cat.inc.filter((x) => x !== id) } } });
  }
  for (const id of state.cat.exc) {
    const c = CATEGORY_BY_ID.get(id);
    if (c) chips.push({ key: `c-${id}`, label: t.notLabel(c.label[locale]), icon: c.icon, excluded: true, without: { ...state, ...reset, cat: { ...state.cat, exc: state.cat.exc.filter((x) => x !== id) } } });
  }
  for (const id of state.env) {
    const e = ENV_BY_ID.get(id as never);
    if (e) chips.push({ key: `e${id}`, label: e.label[locale], icon: e.icon, without: { ...state, ...reset, env: state.env.filter((x) => x !== id) } });
  }
  if (state.license) chips.push({ key: "license", label: t.openSource, icon: "paper", without: { ...state, ...reset, license: false } });
  for (const d of state.dep) {
    const name = [...(names ?? [])].find(([tooth]) => tooth.toLowerCase() === d.toLowerCase())?.[1] ?? d.split("/").at(-1)!;
    chips.push({ key: `d${d}`, label: t.dependsOnLabel(name), without: { ...state, ...reset, dep: state.dep.filter((x) => x !== d) } });
  }
  for (const tag of state.tags) {
    chips.push({ key: `t${tag}`, label: `#${tag}`, without: { ...state, ...reset, tags: state.tags.filter((x) => x !== tag) } });
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
    <ul className={`pkg-active${className ? ` ${className}` : ""}`} aria-label={t.activeFilters}>
      <li>
        <RouterLink href={serializeQuery(clearFilters(state))} className="pkg-chip pkg-chip-link pkg-chip-clear">
          <MaskIcon name="close" />
          {t.clearAll}
        </RouterLink>
      </li>
      {chips.map((c) => (
        <li key={c.key}>
          <RouterLink
            href={serializeQuery(c.without)}
            className={`pkg-chip pkg-chip-link pkg-chip-active${c.excluded ? " is-excluded" : ""}`}
            aria-label={t.removeFilter(c.label)}
          >
            <span className="pkg-chip-x" aria-hidden="true">
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
