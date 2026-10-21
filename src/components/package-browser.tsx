import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { PixelIcon } from "../kit-ui";
import { useI18n } from "../i18n";
import {
  clearFilters,
  DEFAULT_STATE,
  facetOptions,
  filterCount,
  PAGE_SIZE,
  parseQuery,
  runQuery,
  serializeQuery,
  type QueryState,
} from "../lib/catalog-query";
import { searchCatalog } from "../lib/search";
import { STORAGE_KEYS, writeStorage } from "../lib/storage";
import { notifyStored, useStored } from "../lib/use-stored";
import { useHydrated } from "../page-store";
import type { Catalog } from "../types";
import { ActiveFilters } from "./active-filters";
import { FilterDrawer } from "./filter-drawer";
import { FilterGroups } from "./filter-groups";
import { ProjectRow } from "./project-row";
import { Pager, ResultsToolbar, type ViewMode } from "./results-toolbar";
import { ListingSearch } from "./search";

/** Rows whose icons load at once; the rest load when scrolled to. */
const EAGER_ROWS = 6;

const readView = (): ViewMode => (document.documentElement.getAttribute("data-view") === "grid" ? "grid" : "list");

/** List or grid, per viewer: the pre-paint script in index.html applies it before the first paint. */
function useViewMode(): [ViewMode, (v: ViewMode) => void] {
  const view = useStored(readView, "list");
  const change = (v: ViewMode) => {
    document.documentElement.setAttribute("data-view", v);
    writeStorage(STORAGE_KEYS.view, v === "grid" ? "grid" : null);
    notifyStored();
  };
  return [view, change];
}

function EmptyState({ state, apply }: { state: QueryState; apply: (s: QueryState) => void }) {
  const { t } = useI18n();
  const filters = filterCount(state);
  const q = state.q.trim();
  return (
    <div className="pkg-empty">
      <span className="kit-slot pkg-empty-slot" aria-hidden="true">
        <PixelIcon name="compass" size={32} />
      </span>
      <p className="pkg-empty-title">
        {q ? t.emptyQuery(q) + (filters ? t.emptyWithFilters(filters) : "") : t.emptyFilters}
      </p>
      <div className="pkg-empty-actions">
        {q ? (
          <button type="button" className="mc-btn mc-btn-sm" onClick={() => apply({ ...state, q: "", page: 1 })}>
            {t.clearSearch}
          </button>
        ) : null}
        {filters ? (
          <button type="button" className="mc-btn mc-btn-sm" onClick={() => apply(clearFilters(state))}>
            {t.clearAllFilters}
          </button>
        ) : null}
      </div>
      {q ? <p className="pkg-empty-hint">{t.emptyHint}</p> : null}
    </div>
  );
}

/**
 * The listing: search, filters, sort, page size, view and pagination, all
 * over the catalogue baked into the page. The query string never reaches the
 * static host: the page is prerendered in its default state and applies the
 * URL right after hydrating.
 */
export function PackageBrowser({ catalog }: { catalog: Catalog }) {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const key = hydrated ? params.toString() : "";
  const state = useMemo(
    () => (hydrated ? parseQuery(new URLSearchParams(key), catalog.features) : DEFAULT_STATE),
    [hydrated, key, catalog.features],
  );
  const scores = useMemo(() => searchCatalog(catalog.entries, state.q), [catalog.entries, state.q]);
  const result = useMemo(() => runQuery(catalog.entries, state, scores), [catalog.entries, state, scores]);
  const categoryOrder = useMemo(() => {
    const totals = runQuery(catalog.entries, DEFAULT_STATE, null).counts.cat;
    return Object.keys(totals).sort((a, b) => (totals[b] ?? 0) - (totals[a] ?? 0));
  }, [catalog.entries]);

  const options = useMemo(() => facetOptions(catalog.entries), [catalog.entries]);
  const names = useMemo(() => new Map(catalog.entries.map((e) => [e.tooth, e.name])), [catalog.entries]);

  const [view, setView] = useViewMode();
  const [drawer, setDrawer] = useState(false);
  const filtersButton = useRef<HTMLButtonElement>(null);

  // The URL is applied: show the results (index.html hid them while a query was pending).
  useEffect(() => {
    if (hydrated) document.documentElement.removeAttribute("data-pkg-pending");
  }, [hydrated]);

  // "Back to search" on a package page returns to this exact listing.
  useEffect(() => {
    if (hydrated) writeStorage(STORAGE_KEYS.lastSearch, location.pathname + location.search, true);
  }, [hydrated, location.pathname, location.search]);

  const go = (href: string, replace = false) => navigate(href, { replace });
  const apply = (next: QueryState) => go(serializeQuery(next));
  const filters = filterCount(state);
  const { items, matched, total, page, pageCount, counts } = result;
  const from = matched.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = (page - 1) * PAGE_SIZE + items.length;
  const plain = !state.q.trim() && !filters;
  const status = plain ? t.statusShowing(from, to, total) : t.statusResults(matched.length, total);
  const groups = (flat: boolean) => (
    <FilterGroups
      state={state}
      counts={counts}
      options={options}
      names={names}
      features={catalog.features}
      categoryOrder={categoryOrder}
      apply={apply}
      flat={flat}
    />
  );
  const ownerHref = (owner: string) => serializeQuery({ ...DEFAULT_STATE, author: [owner] });

  return (
    <>
      <div className="pkg-browse">
        <section className="pkg-results" aria-labelledby="pkg-results-title" data-pkg-results="" data-scroll-anchor="">
          <h2 id="pkg-results-title" className="kit-sr-only">
            {t.resultsHeading}
          </h2>
          <ListingSearch
            query={state.q}
            total={total}
            onSearch={(q) => {
              // the URL as it is now: a filter picked while the search was pending stays
              const current = parseQuery(new URLSearchParams(window.location.search), catalog.features);
              go(serializeQuery({ ...current, q, page: 1 }), true);
            }}
          />
          <ResultsToolbar
            state={state}
            newest={catalog.features.created}
            view={view}
            onView={setView}
            filterCount={filters}
            onOpenFilters={() => setDrawer(true)}
            filtersButton={filtersButton}
            apply={apply}
            page={page}
            pageCount={matched.length ? pageCount : 1}
            go={(href) => go(href)}
          />
          <div className="pkg-statusbar">
            <p id="pkg-status" className="pkg-status" aria-live="polite" tabIndex={-1}>
              {status}
              <span className="pkg-status-page">{pageCount > 1 ? t.statusPage(page, pageCount) : ""}</span>
            </p>
            <ActiveFilters state={state} names={names} />
          </div>
          <div className="pkg-results-body">
            {items.length ? (
              <ol className="pkg-results-list">
                {items.map((entry, i) => (
                  <li key={entry.tooth}>
                    <ProjectRow entry={entry} eager={i < EAGER_ROWS} ownerHref={ownerHref(entry.owner)} />
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState state={state} apply={apply} />
            )}
            <div className="pkg-skeleton-list" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className="px-card pkg-skeleton-row" />
              ))}
            </div>
          </div>
          {matched.length ? (
            <Pager state={state} page={page} pageCount={pageCount} go={(href) => go(href)} className="pkg-pager-bottom" />
          ) : null}
        </section>
        <aside className="pkg-sidebar" aria-label={t.filters}>
          {groups(false)}
        </aside>
      </div>
      <FilterDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        returnFocus={filtersButton}
        resultCount={matched.length}
        canClear={filters > 0}
        onClearAll={() => apply(clearFilters(state))}
      >
        {drawer ? groups(true) : null}
      </FilterDrawer>
    </>
  );
}
