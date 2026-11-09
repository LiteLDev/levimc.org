import { useId, useMemo, useState, type ReactNode } from "react";
import { FEATURED_BY_ID } from "../data/featured-tags";
import { LICENSE_FAMILY_BY_ID } from "../data/licenses";
import { SIDES } from "../data/sides";
import type { SpriteName } from "../data/sprites";
import { formatNumber, useI18n } from "../i18n";
import type { Facet, FacetCounts, FacetOptions, QueryState } from "../lib/catalog-query";
import { PixelIcon } from "../kit-ui";
import { readStorage, STORAGE_KEYS, writeStorage } from "../lib/storage";
import { notifyStored, useStored } from "../lib/use-stored";
import type { CatalogFeatures } from "../types";
import { MaskIcon, Sprite } from "./sprite";

/** Options of the long groups shown before "Show more". */
const OPTION_LIMIT = 8;

type GroupId = "gameVersion" | "side" | "platform" | "tags" | "license" | "dependencies";

const readCollapsed = () => readStorage(STORAGE_KEYS.groups) ?? "[]";

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
  /** Small grey text after the label: the tag a featured tag stands for, in manifests. */
  raw?: string;
  /** Monospace label (platforms, SPDX ids). */
  mono?: boolean;
  /** An option under another (an SPDX id under its family): indented. */
  nested?: boolean;
  count: number;
  included: boolean;
  excluded?: boolean;
  onInclude: () => void;
  /** Absent: the group has no exclusions. */
  onExclude?: () => void;
  /** Options under this one, shown or not (a license family's SPDX ids): a toggle in the exclude column. */
  expand?: { open: boolean; label: string; onToggle: () => void };
}

function Option({ label, icon, raw, mono, nested, count, included, excluded, onInclude, onExclude, expand }: OptionProps) {
  const { t, locale } = useI18n();
  const dimmed = count === 0 && !included && !excluded;
  const className = ["mods-opt", excluded && "is-excluded", dimmed && "is-dimmed", nested && "is-nested"].filter(Boolean).join(" ");
  return (
    <li className={className}>
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
        <span className={mono ? "mods-opt-label mods-opt-mono" : "mods-opt-label"}>
          {label}
          {raw ? <span className="mods-raw-tag">{raw}</span> : null}
        </span>
        <span className="mods-opt-count">{formatNumber(count, locale)}</span>
      </button>
      {expand ? (
        <button
          type="button"
          className="mc-icon-btn mods-opt-expand"
          aria-label={expand.label}
          aria-expanded={expand.open}
          onClick={expand.onToggle}
        >
          <MaskIcon name="chevronDown" />
        </button>
      ) : onExclude ? (
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
  icon?: SpriteName;
  raw?: string;
  mono?: boolean;
  selected: boolean;
  excluded?: boolean;
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
  onExclude,
}: {
  options: LongOption[];
  counts: Record<string, number>;
  placeholder: string;
  onToggle: (id: string) => void;
  /** Absent: the group has no exclusions. */
  onExclude?: (id: string) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [more, setMore] = useState(false);
  const q = query.trim().toLowerCase();
  const found = q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)) : options;
  const shown = q || more ? found : found.filter((o, i) => i < OPTION_LIMIT || o.selected || o.excluded);
  const hidden = found.length - shown.length;
  return (
    <>
      {options.length > OPTION_LIMIT ? (
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
            icon={o.icon}
            raw={o.raw}
            mono={o.mono}
            count={counts[o.id] ?? 0}
            included={o.selected}
            excluded={o.excluded}
            onInclude={() => onToggle(o.id)}
            onExclude={onExclude ? () => onExclude(o.id) : undefined}
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

/**
 * The License group: each family, and under it (behind a toggle, open while
 * one of them is picked) the SPDX ids of the mods in it.
 */
function LicenseOptions({ state, counts, options, set }: { state: QueryState; counts: FacetCounts; options: FacetOptions; set: (patch: Partial<QueryState>) => void }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const picked = (v: string) => state.license.some((x) => x.toLowerCase() === v.toLowerCase());
  const toggle = (v: string) => set({ license: picked(v) ? state.license.filter((x) => x.toLowerCase() !== v.toLowerCase()) : [...state.license, v] });
  return (
    <ul className="mods-opts">
      {options.license.flatMap(({ family, ids }) => {
        const label = LICENSE_FAMILY_BY_ID.get(family)!.label[locale];
        const expanded = open.has(family) || ids.some(picked);
        return [
          <Option
            key={family}
            id={family}
            label={label}
            count={counts.license[family] ?? 0}
            included={picked(family)}
            onInclude={() => toggle(family)}
            expand={
              ids.length
                ? {
                    open: expanded,
                    label: t.licenseIds(label),
                    onToggle: () => {
                      const next = new Set(open);
                      if (expanded) next.delete(family);
                      else next.add(family);
                      setOpen(next);
                    },
                  }
                : undefined
            }
          />,
          ...(expanded
            ? ids.map((id) => (
                <Option
                  key={`${family}/${id}`}
                  id={id}
                  label={id}
                  mono
                  nested
                  count={counts.license[id] ?? 0}
                  included={picked(id)}
                  onInclude={() => toggle(id)}
                />
              ))
            : []),
        ];
      })}
    </ul>
  );
}

interface FilterGroupsProps {
  state: QueryState;
  counts: FacetCounts;
  /** The values of every group. */
  options: FacetOptions;
  /** Mod names by id, for Dependencies. */
  names: ReadonlyMap<string, string>;
  features: CatalogFeatures;
  /** Applies a new state (a new history entry; the page goes back to 1). */
  apply: (next: QueryState) => void;
  /** In the drawer: sections with dividers instead of cards. */
  flat?: boolean;
}

/**
 * The filter groups of the sidebar and the phone drawer: Game version, Side,
 * Platform, Tags (the featured ones first, see `data/featured-tags.ts`),
 * License (families, then their SPDX ids) and Dependencies.
 */
export function FilterGroups({ state, counts, options, names, features, apply, flat = false }: FilterGroupsProps) {
  const { t, locale } = useI18n();
  const [collapsed, toggle] = useCollapsed();
  const set = (patch: Partial<QueryState>) => apply({ ...state, ...patch, page: 1 });
  const chosen = (tag: string) => state.tags.inc.includes(tag) || state.tags.exc.includes(tag);
  // tags in the URL that no mod has stay, so they can be taken off
  const tagOptions = [...options.tags, ...[...state.tags.inc, ...state.tags.exc].filter((tag) => !options.tags.includes(tag))];
  // a featured tag is offered while it matches something (or is picked)
  const featured = tagOptions.filter((tag) => FEATURED_BY_ID.has(tag) && ((counts.tags[tag] ?? 0) > 0 || chosen(tag)));
  const plain = tagOptions.filter((tag) => !FEATURED_BY_ID.has(tag));

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
      <Group id="side" title={t.groupSide} collapsed={collapsed.has("side")} onToggle={() => toggle("side")} flat={flat}>
        {SIDES.map((side) => (
          <Option
            key={side.id}
            id={side.id}
            label={side.label[locale]}
            icon={side.icon}
            count={counts.side[side.id] ?? 0}
            included={state.side.includes(side.id)}
            onInclude={() => set({ side: SIDES.map((x) => x.id).filter((id) => (id === side.id) !== state.side.includes(id)) })}
          />
        ))}
      </Group>
      {options.platform.length ? (
        <Group id="platform" title={t.groupPlatform} collapsed={collapsed.has("platform")} onToggle={() => toggle("platform")} flat={flat}>
          {options.platform.map((p) => (
            <Option
              key={p}
              id={p}
              label={p}
              mono
              count={counts.platform[p] ?? 0}
              included={state.platform.includes(p)}
              onInclude={() => set({ platform: toggleIn(state.platform, p) })}
            />
          ))}
        </Group>
      ) : null}
      {tagOptions.length ? (
        <Group id="tags" title={t.tags} collapsed={collapsed.has("tags")} onToggle={() => toggle("tags")} flat={flat} list={false}>
          {featured.length ? (
            <ul className="mods-opts">
              {featured.map((tag) => {
                const f = FEATURED_BY_ID.get(tag)!;
                return (
                  <Option
                    key={tag}
                    id={tag}
                    label={f.label[locale]}
                    icon={f.icon}
                    raw={tag}
                    count={counts.tags[tag] ?? 0}
                    included={state.tags.inc.includes(tag)}
                    excluded={state.tags.exc.includes(tag)}
                    onInclude={() => set({ tags: include(state.tags, tag) })}
                    onExclude={() => set({ tags: exclude(state.tags, tag) })}
                  />
                );
              })}
            </ul>
          ) : null}
          {plain.length ? (
            <>
              {featured.length ? <h4 className="mods-group-sub">{t.groupOtherTags}</h4> : null}
              <LongOptions
                options={plain.map((tag) => ({
                  id: tag,
                  label: `#${tag}`,
                  selected: state.tags.inc.includes(tag),
                  excluded: state.tags.exc.includes(tag),
                }))}
                counts={counts.tags}
                placeholder={t.searchTags}
                onToggle={(tag) => set({ tags: include(state.tags, tag) })}
                onExclude={(tag) => set({ tags: exclude(state.tags, tag) })}
              />
            </>
          ) : null}
        </Group>
      ) : null}
      {features.license && options.license.length ? (
        <Group id="license" title={t.groupLicense} collapsed={collapsed.has("license")} onToggle={() => toggle("license")} flat={flat} list={false}>
          <LicenseOptions state={state} counts={counts} options={options} set={set} />
        </Group>
      ) : null}
      {options.dep.length ? (
        <Group id="dependencies" title={t.groupDependencies} collapsed={collapsed.has("dependencies")} onToggle={() => toggle("dependencies")} flat={flat} list={false}>
          <LongOptions
            options={options.dep.map((d) => ({ id: d, label: names.get(d) ?? d.split("/").at(-1)!, selected: deps.includes(d.toLowerCase()) }))}
            counts={counts.dep}
            placeholder={t.searchMods}
            onToggle={(d) => set({ dep: deps.includes(d.toLowerCase()) ? state.dep.filter((x) => x.toLowerCase() !== d.toLowerCase()) : [...state.dep, d] })}
          />
        </Group>
      ) : null}
    </div>
  );
}
