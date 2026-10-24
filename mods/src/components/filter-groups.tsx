import { useId, useMemo, useState, type ReactNode } from "react";
import { CATEGORIES, ENVIRONMENTS, PLATFORMS, type SpriteName } from "../data/categories";
import { formatNumber, useI18n } from "../i18n";
import type { Facet, FacetCounts, FacetOptions, QueryState } from "../lib/catalog-query";
import { PixelIcon } from "../kit-ui";
import { readStorage, STORAGE_KEYS, writeStorage } from "../lib/storage";
import { notifyStored, useStored } from "../lib/use-stored";
import type { CatalogFeatures } from "../types";
import { MaskIcon, Sprite } from "./sprite";

/** Categories (and the options of the long groups) shown before "Show more". */
const CATEGORY_LIMIT = 8;

type GroupId = "gameVersion" | "platform" | "category" | "environment" | "license" | "dependsOn" | "tags";

const readCollapsed = () => readStorage(STORAGE_KEYS.groups) ?? "[]";
const readMoreCategories = () => readStorage(STORAGE_KEYS.moreCategories);

/** Collapsed groups, remembered per viewer (never URL state). */
function useCollapsed(): [Set<GroupId>, (id: GroupId) => void] {
  const stored = useStored(readCollapsed, "[]");
  const collapsed = useMemo(() => {
    try {
      const saved = JSON.parse(stored) as unknown;
      return new Set<GroupId>(Array.isArray(saved) ? (saved as GroupId[]) : []);
    } catch {
      return new Set<GroupId>();
    }
  }, [stored]);
  const toggle = (id: GroupId) => {
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    writeStorage(STORAGE_KEYS.groups, next.size ? JSON.stringify([...next]) : null);
    notifyStored();
  };
  return [collapsed, toggle];
}

interface OptionProps {
  id: string;
  label: string;
  icon?: SpriteName;
  count: number;
  included: boolean;
  excluded?: boolean;
  onInclude: () => void;
  /** Absent: the group has no exclusions. */
  onExclude?: () => void;
}

function Option({ label, icon, count, included, excluded, onInclude, onExclude }: OptionProps) {
  const { t, locale } = useI18n();
  const dimmed = count === 0 && !included && !excluded;
  return (
    <li className={`mods-opt${excluded ? " is-excluded" : ""}${dimmed ? " is-dimmed" : ""}`}>
      <button
        type="button"
        className="mods-opt-btn"
        aria-pressed={included}
        aria-disabled={dimmed || undefined}
        onClick={dimmed ? undefined : onInclude}
      >
        <span className="mods-opt-mark" aria-hidden="true">
          {included ? <MaskIcon name="check" /> : icon ? <Sprite name={icon} /> : null}
        </span>
        <span className="mods-opt-label">{label}</span>
        <span className="mods-opt-count">{formatNumber(count, locale)}</span>
      </button>
      {onExclude ? (
        <button
          type="button"
          className="mc-icon-btn mods-opt-exclude"
          aria-label={t.exclude(label)}
          aria-pressed={!!excluded}
          aria-disabled={dimmed || undefined}
          onClick={dimmed ? undefined : onExclude}
        >
          <MaskIcon name="close" />
        </button>
      ) : (
        // keeps the exclude column, so every group's options end at the same edge
        <span className="mods-opt-exclude-spacer" aria-hidden="true" />
      )}
    </li>
  );
}

interface GroupProps {
  id: GroupId;
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  flat: boolean;
  children: ReactNode;
  footer?: ReactNode;
  /** false: the children bring their own list (see {@link LongOptions}). */
  list?: boolean;
}

function Group({ title, collapsed, onToggle, children, footer, list = true }: GroupProps) {
  const panel = useId();
  return (
    <section className="mods-group mods-group-flat">
      <h3 className="mods-group-heading">
        <button type="button" className="mods-group-toggle" aria-expanded={!collapsed} aria-controls={panel} onClick={onToggle}>
          <span>{title}</span>
          <MaskIcon name="chevronDown" className="mods-group-chevron" />
        </button>
      </h3>
      <div id={panel} className="mods-group-body" hidden={collapsed}>
        {list ? <ul className="mods-opts">{children}</ul> : children}
        {footer}
      </div>
    </section>
  );
}

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
const include = (f: Facet, id: string): Facet => ({ inc: toggleIn(f.inc, id), exc: f.exc.filter((x) => x !== id) });
const exclude = (f: Facet, id: string): Facet => ({ inc: f.inc.filter((x) => x !== id), exc: toggleIn(f.exc, id) });

interface LongOption {
  id: string;
  label: string;
  selected: boolean;
}

/**
 * The options of a group too long to show at once (game versions, mods,
 * tags): a search field over them, the first few, and "Show more". Selected
 * options always show.
 */
function LongOptions({
  options,
  counts,
  placeholder,
  onToggle,
}: {
  options: LongOption[];
  counts: Record<string, number>;
  placeholder: string;
  onToggle: (id: string) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [more, setMore] = useState(false);
  const q = query.trim().toLowerCase();
  const found = q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)) : options;
  const shown = q || more ? found : found.filter((o, i) => i < CATEGORY_LIMIT || o.selected);
  const hidden = found.length - shown.length;
  return (
    <>
      {options.length > CATEGORY_LIMIT ? (
        <label className="mc-input mods-group-search">
          <PixelIcon name="search" className="mods-search-icon" />
          <input
            type="search"
            placeholder={placeholder}
            aria-label={placeholder}
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      ) : null}
      <ul className="mods-opts">
        {shown.map((o) => (
          <Option
            key={o.id}
            id={o.id}
            label={o.label}
            count={counts[o.id] ?? 0}
            included={o.selected}
            onInclude={() => onToggle(o.id)}
          />
        ))}
      </ul>
      {!q && (hidden > 0 || more) ? (
        <button type="button" className="mc-btn mc-btn-ghost mc-btn-sm mods-group-more" aria-expanded={more} onClick={() => setMore(!more)}>
          <MaskIcon name={more ? "arrowUp" : "chevronDown"} />
          {more ? t.showFewer : t.showMore(hidden)}
        </button>
      ) : null}
    </>
  );
}

interface FilterGroupsProps {
  state: QueryState;
  counts: FacetCounts;
  /** The values of the Game Version, Depends On and Tags groups. */
  options: FacetOptions;
  /** Mod names by tooth, for Depends On. */
  names: ReadonlyMap<string, string>;
  features: CatalogFeatures;
  /** Category ids by how many mods they hold in the whole catalogue. */
  categoryOrder: string[];
  /** Applies a new state (a new history entry; the page goes back to 1). */
  apply: (next: QueryState) => void;
  /** In the drawer: sections with dividers instead of cards. */
  flat?: boolean;
}

/** The filter groups of the sidebar and the phone drawer. */
export function FilterGroups({ state, counts, options, names, features, categoryOrder, apply, flat = false }: FilterGroupsProps) {
  const { t, locale } = useI18n();
  const [collapsed, toggle] = useCollapsed();
  const moreCats = useStored(readMoreCategories, null) === "1";
  const set = (patch: Partial<QueryState>) => apply({ ...state, ...patch, page: 1 });

  const categories = categoryOrder
    .map((id) => CATEGORIES.find((c) => c.id === id))
    .filter((c): c is (typeof CATEGORIES)[number] => !!c);
  const shownCategories = moreCats
    ? categories
    : categories.filter(
        (c, i) => i < CATEGORY_LIMIT || state.cat.inc.includes(c.id) || state.cat.exc.includes(c.id),
      );
  const hiddenCount = categories.length - shownCategories.length;

  const lower = (list: string[]) => list.map((x) => x.toLowerCase());
  const deps = lower(state.dep);

  return (
    <div className="mods-groups mods-groups-flat">
      {options.gv.length ? (
        <Group id="gameVersion" title={t.groupGameVersion} collapsed={collapsed.has("gameVersion")} onToggle={() => toggle("gameVersion")} flat={flat} list={false}>
          <LongOptions
            options={options.gv.map((v) => ({ id: v, label: v, selected: state.gv.includes(v) }))}
            counts={counts.gv}
            placeholder={t.searchGameVersions}
            onToggle={(v) => set({ gv: toggleIn(state.gv, v) })}
          />
        </Group>
      ) : null}
      <Group id="platform" title={t.groupPlatform} collapsed={collapsed.has("platform")} onToggle={() => toggle("platform")} flat={flat}>
        {PLATFORMS.map((p) => (
          <Option
            key={p.id}
            id={p.id}
            label={p.label[locale]}
            icon={p.icon}
            count={counts.platform[p.id] ?? 0}
            included={state.platform.inc.includes(p.id)}
            excluded={state.platform.exc.includes(p.id)}
            onInclude={() => set({ platform: include(state.platform, p.id) })}
            onExclude={() => set({ platform: exclude(state.platform, p.id) })}
          />
        ))}
      </Group>
      <Group
        id="category"
        title={t.groupCategory}
        collapsed={collapsed.has("category")}
        onToggle={() => toggle("category")}
        flat={flat}
        footer={
          categories.length > CATEGORY_LIMIT ? (
            <button
              type="button"
              className="mc-btn mc-btn-ghost mc-btn-sm mods-group-more"
              aria-expanded={moreCats}
              onClick={() => {
                writeStorage(STORAGE_KEYS.moreCategories, moreCats ? null : "1");
                notifyStored();
              }}
            >
              <MaskIcon name={moreCats ? "arrowUp" : "chevronDown"} />
              {moreCats ? t.showFewer : t.showMore(hiddenCount)}
            </button>
          ) : null
        }
      >
        {shownCategories.map((c) => (
          <Option
            key={c.id}
            id={c.id}
            label={c.label[locale]}
            icon={c.icon}
            count={counts.cat[c.id] ?? 0}
            included={state.cat.inc.includes(c.id)}
            excluded={state.cat.exc.includes(c.id)}
            onInclude={() => set({ cat: include(state.cat, c.id) })}
            onExclude={() => set({ cat: exclude(state.cat, c.id) })}
          />
        ))}
      </Group>
      <Group id="environment" title={t.groupEnvironment} collapsed={collapsed.has("environment")} onToggle={() => toggle("environment")} flat={flat}>
        {ENVIRONMENTS.map((e) => (
          <Option
            key={e.id}
            id={e.id}
            label={e.label[locale]}
            icon={e.icon}
            count={counts.env[e.id] ?? 0}
            included={state.env.includes(e.id)}
            onInclude={() => set({ env: toggleIn(state.env, e.id) })}
          />
        ))}
      </Group>
      {features.license ? (
        <Group id="license" title={t.groupLicense} collapsed={collapsed.has("license")} onToggle={() => toggle("license")} flat={flat}>
          <Option
            id="oss"
            label={t.openSource}
            icon="paper"
            count={counts.license}
            included={state.license}
            onInclude={() => set({ license: !state.license })}
          />
        </Group>
      ) : null}
      {options.dep.length ? (
        <Group id="dependsOn" title={t.groupDependsOn} collapsed={collapsed.has("dependsOn")} onToggle={() => toggle("dependsOn")} flat={flat} list={false}>
          <LongOptions
            options={options.dep.map((d) => ({ id: d, label: names.get(d) ?? d.split("/").at(-1)!, selected: deps.includes(d.toLowerCase()) }))}
            counts={counts.dep}
            placeholder={t.searchMods}
            onToggle={(d) => set({ dep: deps.includes(d.toLowerCase()) ? state.dep.filter((x) => x.toLowerCase() !== d.toLowerCase()) : [...state.dep, d] })}
          />
        </Group>
      ) : null}
      {options.tags.length ? (
        <Group id="tags" title={t.tags} collapsed={collapsed.has("tags")} onToggle={() => toggle("tags")} flat={flat} list={false}>
          <LongOptions
            options={[...options.tags, ...state.tags.filter((tag) => !options.tags.includes(tag))].map((tag) => ({ id: tag, label: tag, selected: state.tags.includes(tag) }))}
            counts={counts.tags}
            placeholder={t.searchTags}
            onToggle={(tag) => set({ tags: toggleIn(state.tags, tag) })}
          />
        </Group>
      ) : null}
    </div>
  );
}
