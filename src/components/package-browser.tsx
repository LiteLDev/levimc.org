import {
  searchPackages,
  filterByTags,
  sortPackages,
  paginatePackages,
  extractTags,
  ITEMS_PER_PAGE,
} from "../lib/packages";
import type { SortOption } from "../lib/packages";
import type { Package } from "../types";
import { PackageList } from "./package-list";
import { Pagination } from "./pagination";
import { RouterLink } from "./router-link";
import { Sidebar } from "./sidebar";

export interface BrowseParams {
  q?: string;
  tags?: string;
  sort?: string;
  page?: string;
}

interface PackageBrowserProps {
  packages: Package[];
  params: BrowseParams;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "updated", label: "Updated" },
  { value: "stars", label: "Stars" },
];

/**
 * Search, tag filters, sorting and pagination, all over the index baked into
 * the page: the query string never reaches the static host.
 */
export function PackageBrowser({ packages, params }: PackageBrowserProps) {
  const query = params.q || "";
  const selectedTags = params.tags
    ? params.tags.split(",").filter(Boolean)
    : [];
  const sortBy: SortOption = (["relevance", "updated", "stars"] as const).includes(
    params.sort as SortOption,
  )
    ? (params.sort as SortOption)
    : "relevance";
  const requestedPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  // Extract tags from full dataset (before filtering)
  const allTags = extractTags(packages);

  // Search
  const { results: searched, scores } = searchPackages(packages, query);

  // Filter by tags
  const filtered = filterByTags(searched, selectedTags);

  // Sort
  const sorted = sortPackages(filtered, sortBy, scores, !!query);

  // Paginate
  const { items: paginatedPackages, totalPages } = paginatePackages(
    sorted,
    requestedPage,
    ITEMS_PER_PAGE,
  );
  const page = Math.min(requestedPage, totalPages);

  // Build base params for links (without page)
  function buildUrl(overrides: Record<string, string | undefined>): string {
    const p = new URLSearchParams();
    const merged = { q: query, tags: params.tags, sort: sortBy, ...overrides };
    if (merged.q) p.set("q", merged.q);
    if (merged.tags) p.set("tags", merged.tags);
    if (merged.sort && merged.sort !== "relevance") p.set("sort", merged.sort);
    const pageVal = overrides.page;
    if (pageVal && pageVal !== "1") p.set("page", pageVal);
    const qs = p.toString();
    return qs ? `/?${qs}` : "/";
  }

  return (
    <div className="pkg-browse">
      <Sidebar
        tags={allTags}
        selectedTags={selectedTags}
        currentParams={params}
      />

      <section
        className="pkg-results"
        aria-labelledby="pkg-results-title"
        data-pkg-results=""
        data-scroll-anchor=""
      >
        <h2 id="pkg-results-title" className="kit-sr-only">
          Packages
        </h2>
        <div className="pkg-toolbar">
          <div className="pkg-sort">
            <span className="pkg-sort-label">Sort by:</span>
            <div className="hotbar">
              {SORT_OPTIONS.map((opt) => (
                <RouterLink
                  key={opt.value}
                  href={buildUrl({ sort: opt.value, page: "1" })}
                  aria-current={sortBy === opt.value ? "true" : undefined}
                  className={sortBy === opt.value ? "is-active" : undefined}
                >
                  {opt.label}
                </RouterLink>
              ))}
            </div>
          </div>

          <div className="pkg-count">Showing {sorted.length} packages</div>
        </div>

        <PackageList packages={paginatedPackages} />

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            windowPage={requestedPage}
            totalPages={totalPages}
            buildUrl={(p) => buildUrl({ page: String(p) })}
          />
        )}

        {sorted.length === 0 && (
          <p className="pkg-empty-note">No packages found</p>
        )}
      </section>
    </div>
  );
}
