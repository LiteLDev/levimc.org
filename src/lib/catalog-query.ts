// The listing's state: what the URL says (`?q=&cat=&platform=&env=&license=
// &author=&tags=&sort=&per=&page=`), how to write it back, and the results it
// selects. Pure functions, shared by the page and the unit tests.
import { CATEGORY_BY_ID, ENV_BY_ID, PLATFORM_BY_ID } from "../data/categories.ts";
import type { CatalogEntry, CatalogFeatures } from "../types.ts";

export const PAGE_SIZES = [20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 20;

export const SORTS = ["relevance", "stars", "updated", "newest"] as const;
export type SortKey = (typeof SORTS)[number];

/** Values a filter group includes, and values it excludes (`-id` in the URL). */
export interface Facet {
  inc: string[];
  exc: string[];
}

export interface QueryState {
  q: string;
  /** Categories: every included one (AND), none of the excluded. */
  cat: Facet;
  /** Platforms: any included one (OR), none of the excluded. */
  platform: Facet;
  /** Environments: any of them (OR). */
  env: string[];
  /** Only packages under an open-source license. */
  license: boolean;
  /** Repository owners, as written in the URL; matched case-insensitively (OR). */
  author: string[];
  /** Raw lipr tags, every one of them (AND) — the filter of the old listing, kept for its links. */
  tags: string[];
  sort: SortKey;
  per: PageSize;
  page: number;
}

export const EMPTY_FACET: Facet = { inc: [], exc: [] };

export const DEFAULT_STATE: QueryState = {
  q: "",
  cat: EMPTY_FACET,
  platform: EMPTY_FACET,
  env: [],
  license: false,
  author: [],
  tags: [],
  sort: "relevance",
  per: DEFAULT_PAGE_SIZE,
  page: 1,
};

/** Query keys of the listing (a URL with one of them is not the prerendered default). */
export const LISTING_KEYS = ["q", "cat", "platform", "env", "license", "author", "tags", "sort", "per", "page"] as const;

const ALL_FEATURES: CatalogFeatures = { created: true, license: true };

/** Comma lists and repeated keys alike: `cat=a,b` = `cat=a&cat=b`. */
function list(params: URLSearchParams, key: string): string[] {
  return params
    .getAll(key)
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
}

const unique = <T>(values: T[]): T[] => [...new Set(values)];

function facet(values: string[], known: (id: string) => boolean, exclusions = true): Facet {
  const inc: string[] = [];
  const exc: string[] = [];
  for (const raw of values) {
    const value = raw.toLowerCase();
    const excluded = exclusions && value.startsWith("-");
    const id = excluded ? value.slice(1) : value;
    if (!known(id)) continue;
    if (excluded) {
      if (!exc.includes(id)) exc.push(id);
    } else if (!inc.includes(id)) {
      inc.push(id);
    }
  }
  return { inc: inc.filter((id) => !exc.includes(id)), exc };
}

/** Reads the listing state from a query string. Unknown keys and values are dropped. */
export function parseQuery(params: URLSearchParams, features: CatalogFeatures = ALL_FEATURES): QueryState {
  let sort = (params.get("sort") ?? "").toLowerCase();
  // Download counts are not shown; links sorted by them get stars instead.
  if (sort === "downloads") sort = "stars";
  if (sort === "newest" && !features.created) sort = "relevance";
  const per = Number(params.get("per"));
  const page = parseInt(params.get("page") ?? "1", 10);
  return {
    q: params.get("q") ?? "",
    cat: facet(list(params, "cat"), (id) => CATEGORY_BY_ID.has(id)),
    platform: facet(list(params, "platform"), (id) => PLATFORM_BY_ID.has(id as never)),
    env: facet(list(params, "env"), (id) => ENV_BY_ID.has(id as never), false).inc,
    license: features.license && params.get("license") === "oss",
    author: list(params, "author").filter((a, i, all) => all.findIndex((b) => b.toLowerCase() === a.toLowerCase()) === i),
    tags: unique(list(params, "tags")),
    sort: (SORTS as readonly string[]).includes(sort) ? (sort as SortKey) : "relevance",
    per: (PAGE_SIZES as readonly number[]).includes(per) ? (per as PageSize) : DEFAULT_PAGE_SIZE,
    page: Number.isFinite(page) && page >= 1 ? page : 1,
  };
}

/** A query value with `,`, `:` and `/` left readable (all are valid in a query string). */
const encode = (value: string) =>
  encodeURIComponent(value).replace(/%2C/gi, ",").replace(/%3A/gi, ":").replace(/%2F/gi, "/");

const facetValues = ({ inc, exc }: Facet) => [...inc, ...exc.map((id) => `-${id}`)];

/** The listing URL for a state: `/`, or `/?…` with the non-default values in a fixed order. */
export function serializeQuery(state: QueryState): string {
  const parts: [string, string][] = [];
  const add = (key: string, values: string[]) => {
    if (values.length) parts.push([key, values.map(encode).join(",")]);
  };
  if (state.q.trim()) parts.push(["q", encode(state.q)]);
  add("cat", facetValues(state.cat));
  add("platform", facetValues(state.platform));
  add("env", state.env);
  if (state.license) parts.push(["license", "oss"]);
  add("author", state.author);
  add("tags", state.tags);
  if (state.sort !== "relevance") parts.push(["sort", state.sort]);
  if (state.per !== DEFAULT_PAGE_SIZE) parts.push(["per", String(state.per)]);
  if (state.page > 1) parts.push(["page", String(state.page)]);
  return parts.length ? `/?${parts.map(([k, v]) => `${k}=${v}`).join("&")}` : "/";
}

/** How many filters are on (the Filters button's badge): search and sort do not count. */
export function filterCount(state: QueryState): number {
  return (
    state.cat.inc.length +
    state.cat.exc.length +
    state.platform.inc.length +
    state.platform.exc.length +
    state.env.length +
    (state.license ? 1 : 0) +
    state.author.length +
    state.tags.length
  );
}

/** The state without any filter: search, sort and page size stay. */
export function clearFilters(state: QueryState): QueryState {
  return { ...DEFAULT_STATE, q: state.q, sort: state.sort, per: state.per };
}

/** An SPDX id that names an open-source license (GitHub's NOASSERTION means "some other text"). */
export function isOpenSource(license: string | undefined): boolean {
  return !!license && license !== "NOASSERTION" && license !== "NONE";
}

// ------------------------------------------------------------------ filtering

const orFacet = (values: readonly string[], f: Facet) =>
  (!f.inc.length || f.inc.some((id) => values.includes(id))) && !f.exc.some((id) => values.includes(id));
const andFacet = (values: readonly string[], f: Facet) =>
  f.inc.every((id) => values.includes(id)) && !f.exc.some((id) => values.includes(id));

interface Filters {
  cat: Facet;
  platform: Facet;
  env: string[];
  license: boolean;
}

function matches(e: CatalogEntry, f: Filters): boolean {
  return (
    andFacet(e.categories, f.cat) &&
    orFacet(e.platforms, f.platform) &&
    (!f.env.length || f.env.some((id) => (e.env as string[]).includes(id))) &&
    (!f.license || isOpenSource(e.license))
  );
}

// ------------------------------------------------------------------ sorting

const time = (iso: string | undefined) => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? 0 : t;
};

/**
 * The order of the listing. Relevance is the search score (ties: the more
 * popular first) or, without a search, popularity: GitHub stars, then the
 * most recently updated.
 */
export function compareEntries(sort: SortKey, scores: Map<string, number> | null) {
  const byStars = (a: CatalogEntry, b: CatalogEntry) => b.stars - a.stars || time(b.updated) - time(a.updated);
  const byName = (a: CatalogEntry, b: CatalogEntry) =>
    a.tooth.toLowerCase() < b.tooth.toLowerCase() ? -1 : a.tooth.toLowerCase() > b.tooth.toLowerCase() ? 1 : 0;
  return (a: CatalogEntry, b: CatalogEntry): number => {
    let d: number;
    if (sort === "relevance") d = scores ? (scores.get(b.tooth) ?? 0) - (scores.get(a.tooth) ?? 0) || byStars(a, b) : byStars(a, b);
    else if (sort === "stars") d = byStars(a, b);
    else if (sort === "updated") d = time(b.updated) - time(a.updated) || b.stars - a.stars;
    else d = time(b.created) - time(a.created) || b.stars - a.stars;
    return d || byName(a, b);
  };
}

// ------------------------------------------------------------------ running a query

export interface FacetCounts {
  cat: Record<string, number>;
  platform: Record<string, number>;
  env: Record<string, number>;
  license: number;
}

export interface QueryResult {
  /** The page shown. */
  items: CatalogEntry[];
  /** Every package matching the query, in order. */
  matched: CatalogEntry[];
  /** Packages listed in all. */
  total: number;
  /** The page shown, clamped to the last one. */
  page: number;
  pageCount: number;
  /**
   * How many results each filter option would give: an OR group's option is
   * counted as if it were the group's only include, a category as if added to
   * the included ones; every other group stays as it is.
   */
  counts: FacetCounts;
}

/** Applies a state to the catalog. `scores` are the search's (see `searchCatalog`), `null` without a query. */
export function runQuery(entries: readonly CatalogEntry[], state: QueryState, scores: Map<string, number> | null): QueryResult {
  const base = entries.filter(
    (e) =>
      (!scores || scores.has(e.tooth)) &&
      state.tags.every((tag) => e.tags.includes(tag)) &&
      (!state.author.length || state.author.some((a) => a.toLowerCase() === e.owner.toLowerCase())),
  );
  const filters: Filters = { cat: state.cat, platform: state.platform, env: state.env, license: state.license };
  const matched = base.filter((e) => matches(e, filters)).sort(compareEntries(state.sort, scores));

  const count = (f: Filters) => base.reduce((n, e) => n + (matches(e, f) ? 1 : 0), 0);
  const without = (f: Facet, id: string) => f.exc.filter((x) => x !== id);
  const counts: FacetCounts = { cat: {}, platform: {}, env: {}, license: 0 };
  for (const id of CATEGORY_BY_ID.keys()) {
    const inc = state.cat.inc.includes(id) ? state.cat.inc : [...state.cat.inc, id];
    counts.cat[id] = count({ ...filters, cat: { inc, exc: without(state.cat, id) } });
  }
  for (const id of PLATFORM_BY_ID.keys()) {
    counts.platform[id] = count({ ...filters, platform: { inc: [id], exc: without(state.platform, id) } });
  }
  for (const id of ENV_BY_ID.keys()) counts.env[id] = count({ ...filters, env: [id] });
  counts.license = count({ ...filters, license: true });

  const pageCount = Math.max(1, Math.ceil(matched.length / state.per));
  const page = Math.min(state.page, pageCount);
  return {
    items: matched.slice((page - 1) * state.per, page * state.per),
    matched,
    total: entries.length,
    page,
    pageCount,
    counts,
  };
}
