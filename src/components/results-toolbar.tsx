import { useRef, type MouseEvent } from "react";
import { Pagination, PixelIcon, useDismissableDetails } from "../kit-ui";
import { useI18n, type Strings } from "../i18n";
import { PAGE_SIZES, serializeQuery, type PageSize, type QueryState, type SortKey } from "../lib/catalog-query";
import { HotbarRadio } from "./hotbar-radio";

export type ViewMode = "list" | "grid";

export function sortOptions(t: Strings, newest: boolean): { value: SortKey; label: string }[] {
  return [
    { value: "relevance", label: t.sortRelevance },
    { value: "stars", label: t.sortStars },
    { value: "updated", label: t.sortUpdated },
    ...(newest ? [{ value: "newest" as const, label: t.sortNewest }] : []),
  ];
}

/** The sort order as a menu: phones, where the hotbar does not fit. */
function SortMenu({ value, options, onChange }: { value: SortKey; options: { value: SortKey; label: string }[]; onChange: (s: SortKey) => void }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDetailsElement>(null);
  useDismissableDetails(ref);
  const current = options.find((o) => o.value === value) ?? options[0]!;
  return (
    <details ref={ref} className="kit-menu pkg-sort-menu">
      <summary className="mc-btn mc-btn-sm kit-menu-trigger" aria-label={`${t.sortLabel}: ${current.label}`}>
        <span>{t.sortShort(current.label)}</span>
        <PixelIcon name="chevronDown" className="kit-menu-chevron" />
      </summary>
      <div className="kit-menu-panel" role="menu" aria-label={t.sortLabel}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="menuitemradio"
            aria-checked={o.value === value}
            className={`kit-menu-item${o.value === value ? " is-active" : ""}`}
            onClick={() => {
              if (ref.current) ref.current.open = false;
              onChange(o.value);
            }}
          >
            <span>{o.label}</span>
            {o.value === value ? <PixelIcon name="check" className="kit-menu-check" /> : null}
          </button>
        ))}
      </div>
    </details>
  );
}

export function PageSizeControl({ value, onChange, className }: { value: PageSize; onChange: (n: PageSize) => void; className?: string }) {
  const { t } = useI18n();
  return (
    <HotbarRadio
      label={t.perPageLabel}
      className={`hotbar-pixel pkg-per${className ? ` ${className}` : ""}`}
      options={PAGE_SIZES.map((n) => ({ value: n, label: String(n) }))}
      value={value}
      onChange={onChange}
    />
  );
}

interface PagerProps {
  state: QueryState;
  page: number;
  pageCount: number;
  go: (href: string) => void;
  className?: string;
}

/** The kit's hotbar pagination with real links, followed inside the app. */
export function Pager({ state, page, pageCount, go, className }: PagerProps) {
  const { t } = useI18n();
  const hrefFor = (p: number) => serializeQuery({ ...state, page: p });
  return (
    <Pagination
      page={page}
      pageCount={pageCount}
      hrefFor={hrefFor}
      onNavigate={(p, e: MouseEvent<HTMLAnchorElement>) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        go(hrefFor(p));
      }}
      label={t.pagination}
      previousLabel={t.previousPage}
      nextLabel={t.nextPage}
      className={`pkg-pager${className ? ` ${className}` : ""}`}
    />
  );
}

interface ResultsToolbarProps {
  state: QueryState;
  newest: boolean;
  view: ViewMode;
  onView: (v: ViewMode) => void;
  filterCount: number;
  onOpenFilters: () => void;
  filtersButton: React.Ref<HTMLButtonElement>;
  apply: (next: QueryState) => void;
  page: number;
  pageCount: number;
  go: (href: string) => void;
}

/** Filters (narrow screens), sort, page size, view and the top pager. */
export function ResultsToolbar({ state, newest, view, onView, filterCount, onOpenFilters, filtersButton, apply, page, pageCount, go }: ResultsToolbarProps) {
  const { t } = useI18n();
  const sorts = sortOptions(t, newest);
  const setSort = (sort: SortKey) => apply({ ...state, sort, page: 1 });
  return (
    <div className="pkg-toolbar">
      <button ref={filtersButton} type="button" className="mc-btn mc-btn-sm pkg-filters-btn" onClick={onOpenFilters} aria-haspopup="dialog">
        <PixelIcon name="menu" />
        {filterCount ? t.filtersCount(filterCount) : t.filters}
      </button>
      <HotbarRadio label={t.sortLabel} className="pkg-sort" options={sorts} value={state.sort} onChange={setSort} />
      <SortMenu value={state.sort} options={sorts} onChange={setSort} />
      <PageSizeControl className="pkg-per-toolbar" value={state.per} onChange={(per) => apply({ ...state, per, page: 1 })} />
      <HotbarRadio
        label={t.viewLabel}
        className="pkg-view"
        options={[
          { value: "list", label: <PixelIcon name="menu" />, ariaLabel: t.viewList, tooltip: t.viewList },
          { value: "grid", label: <PixelIcon name="apps" />, ariaLabel: t.viewGrid, tooltip: t.viewGrid },
        ]}
        value={view}
        onChange={onView}
      />
      <Pager state={state} page={page} pageCount={pageCount} go={go} className="pkg-pager-top" />
    </div>
  );
}
