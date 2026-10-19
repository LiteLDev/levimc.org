import { useId, useMemo, type ReactNode } from "react";
import { CATEGORIES, ENVIRONMENTS, PLATFORMS, type SpriteName } from "../data/categories";
import { formatNumber, useI18n } from "../i18n";
import type { Facet, FacetCounts, QueryState } from "../lib/catalog-query";
import { readStorage, STORAGE_KEYS, writeStorage } from "../lib/storage";
import { notifyStored, useStored } from "../lib/use-stored";
import type { CatalogFeatures } from "../types";
import { MaskIcon, Sprite } from "./sprite";

/** Categories shown before "Show more". */
const CATEGORY_LIMIT = 8;

type GroupId = "platform" | "category" | "environment" | "license";

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
    <li className={`pkg-opt${excluded ? " is-excluded" : ""}${dimmed ? " is-dimmed" : ""}`}>
      <button
        type="button"
        className="pkg-opt-btn"
        aria-pressed={included}
        aria-disabled={dimmed || undefined}
        onClick={dimmed ? undefined : onInclude}
      >
        <span className="pkg-opt-mark" aria-hidden="true">
          {included ? <MaskIcon name="check" /> : icon ? <Sprite name={icon} /> : null}
        </span>
        <span className="pkg-opt-label">{label}</span>
        <span className="pkg-opt-count">{formatNumber(count, locale)}</span>
      </button>
      {onExclude ? (
        <button
          type="button"
          className="mc-icon-btn pkg-opt-exclude"
          aria-label={t.exclude(label)}
          aria-pressed={!!excluded}
          aria-disabled={dimmed || undefined}
          onClick={dimmed ? undefined : onExclude}
        >
          <MaskIcon name="close" />
        </button>
      ) : (
        // keeps the exclude column, so every group's options end at the same edge
        <span className="pkg-opt-exclude-spacer" aria-hidden="true" />
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
}

function Group({ title, collapsed, onToggle, flat, children, footer }: GroupProps) {
  const panel = useId();
  return (
    <section className="pkg-group pkg-group-flat">
      <h3 className="pkg-group-heading">
        <button type="button" className="pkg-group-toggle" aria-expanded={!collapsed} aria-controls={panel} onClick={onToggle}>
          <span>{title}</span>
          <MaskIcon name="chevronDown" className="pkg-group-chevron" />
        </button>
      </h3>
      <div id={panel} className="pkg-group-body" hidden={collapsed}>
        <ul className="pkg-opts">{children}</ul>
        {footer}
      </div>
    </section>
  );
}

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
const include = (f: Facet, id: string): Facet => ({ inc: toggleIn(f.inc, id), exc: f.exc.filter((x) => x !== id) });
const exclude = (f: Facet, id: string): Facet => ({ inc: f.inc.filter((x) => x !== id), exc: toggleIn(f.exc, id) });

interface FilterGroupsProps {
  state: QueryState;
  counts: FacetCounts;
  features: CatalogFeatures;
  /** Category ids by how many packages they hold in the whole catalogue. */
  categoryOrder: string[];
  /** Applies a new state (a new history entry; the page goes back to 1). */
  apply: (next: QueryState) => void;
  /** In the drawer: sections with dividers instead of cards. */
  flat?: boolean;
}

/** The filter groups of the sidebar and the phone drawer. */
export function FilterGroups({ state, counts, features, categoryOrder, apply, flat = false }: FilterGroupsProps) {
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

  return (
    <div className="pkg-groups pkg-groups-flat">
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
              className="mc-btn mc-btn-ghost mc-btn-sm pkg-group-more"
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
    </div>
  );
}
