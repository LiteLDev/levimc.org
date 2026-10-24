// The listing's state: what the URL says (`?q=&gv=&platform=&cat=&env=
// &license=&dep=&tags=&author=&sort=&page=`), how to write it back, and the results it
// selects. Pure functions, shared by the page and the unit tests.
import { BASE } from "../base-path.ts";
import { CATEGORY_BY_ID, ENV_BY_ID, PLATFORM_BY_ID } from "../data/categories.ts";
import type { CatalogEntry, CatalogFeatures } from "../types.ts";
import { compareVersions as compareVersionStrings } from "./game-versions.ts";
import { spreadAuthors } from "./ranking.ts";

/** Results per page: fixed (old `?per=` links are ignored). */
export const PAGE_SIZE = 20;

export const SORTS = ["relevance", "stars", "updated", "newest"] as const;
export type SortKey = (typeof SORTS)[number];

/** Values a filter group includes, and values it excludes (`-id` in the URL). */
export interface Facet {
  inc: string[];
  exc: string[];
}

export interface QueryState {
  q: string;
  /** Game versions: any of them (OR). */
  gv: string[];
  /** Categories: every included one (AND), none of the excluded. */
  cat: Facet;
  /** Platforms: any included one (OR), none of the excluded. */
  platform: Facet;
  /** Environments: any of them (OR). */
  env: string[];
  /** Only mods under an open-source license. */
  license: boolean;
  /** Mods the latest version depends on (tooths, case-insensitive): every one of them (AND). */
  dep: string[];
  /** Repository owners, as written in the URL; matched case-insensitively (OR). */
  author: string[];
  /** Raw lipr tags, every one of them (AND). */
  tags: string[];
  sort: SortKey;
  page: number;
}

export const EMPTY_FACET: Facet = { inc: [], exc: [] };

export const DEFAULT_STATE: QueryState = {
  q: "",
  gv: [],
  cat: EMPTY_FACET,
  platform: EMPTY_FACET,
  env: [],
  license: false,
  dep: [],
  author: [],
  tags: [],
  sort: "relevance",
  page: 1,
};

/** Query keys of the listing (a URL with one of them is not the prerendered default). */
export const LISTING_KEYS = ["q", "gv", "dep", "cat", "platform", "env", "license", "author", "tags", "sort", "page"] as const;

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
  const page = parseInt(params.get("page") ?? "1", 10);
  return {
    q: params.get("q") ?? "",
    gv: unique(list(params, "gv")),
    cat: facet(list(params, "cat"), (id) => CATEGORY_BY_ID.has(id)),
    platform: facet(list(params, "platform"), (id) => PLATFORM_BY_ID.has(id as never)),
    env: facet(list(params, "env"), (id) => ENV_BY_ID.has(id as never), false).inc,
    license: features.license && params.get("license") === "oss",
    dep: list(params, "dep").filter((d, i, all) => all.findIndex((x) => x.toLowerCase() === d.toLowerCase()) === i),
    author: list(params, "author").filter((a, i, all) => all.findIndex((b) => b.toLowerCase() === a.toLowerCase()) === i),
    tags: unique(list(params, "tags")),
    sort: (SORTS as readonly string[]).includes(sort) ? (sort as SortKey) : "relevance",
    page: Number.isFinite(page) && page >= 1 ? page : 1,
  };
}

/** A query value with `,`, `:` and `/` left readable (all are valid in a query string). */
const encode = (value: string) =>
  encodeURIComponent(value).replace(/%2C/gi, ",").replace(/%3A/gi, ":").replace(/%2F/gi, "/");

const facetValues = ({ inc, exc }: Facet) => [...inc, ...exc.map((id) => `-${id}`)];

/** The listing URL for a state: `/mods/`, or `/mods/?…` with the non-default values in a fixed order. */
export function serializeQuery(state: QueryState): string {
  const parts: [string, string][] = [];
  const add = (key: string, values: string[]) => {
    if (values.length) parts.push([key, values.map(encode).join(",")]);
  };
  if (state.q.trim()) parts.push(["q", encode(state.q)]);
  add("gv", state.gv);
  add("platform", facetValues(state.platform));
  add("cat", facetValues(state.cat));
  add("env", state.env);
  if (state.license) parts.push(["license", "oss"]);
  add("dep", state.dep);
  add("tags", state.tags);
  add("author", state.author);
  if (state.sort !== "relevance") parts.push(["sort", state.sort]);
  if (state.page > 1) parts.push(["page", String(state.page)]);
  return parts.length ? `${BASE}?${parts.map(([k, v]) => `${k}=${v}`).join("&")}` : BASE;
}

/** How many filters are on (the Filters button's badge): search and sort do not count. */
export function filterCount(state: QueryState): number {
  return (
    state.gv.length +
    state.dep.length +
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

/** The state without any filter: search and sort stay. */
export function clearFilters(state: QueryState): QueryState {
  return { ...DEFAULT_STATE, q: state.q, sort: state.sort };
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
  gv: string[];
  cat: Facet;
  platform: Facet;
  env: string[];
  license: boolean;
  dep: string[];
  tags: string[];
}

const hasTooth = (tooths: readonly string[], tooth: string) => tooths.some((t) => t.toLowerCase() === tooth.toLowerCase());

/** A tag the Tags filter offers: `platform:…`, `type:…` and other namespaced tags are left out. */
export const isPlainTag = (tag: string) => !tag.includes(":");

function matches(e: CatalogEntry, f: Filters): boolean {
  return (
    (!f.gv.length || f.gv.some((v) => e.gameVersions.includes(v))) &&
    f.dep.every((d) => hasTooth(e.dependsOn, d)) &&
    f.tags.every((tag) => e.tags.includes(tag)) &&
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
 * The order of the listing. Relevance is the search score or, without a
 * search, the default-order score (`entry.rank`: stars and dependents
 * against what a mod like it would get, and how likely it runs on the newest
 * game version; see `lib/ranking.ts`), which also breaks search ties.
 */
export function compareEntries(sort: SortKey, scores: Map<string, number> | null) {
  const byStars = (a: CatalogEntry, b: CatalogEntry) => b.stars - a.stars || time(b.updated) - time(a.updated);
  const byName = (a: CatalogEntry, b: CatalogEntry) =>
    a.tooth.toLowerCase() < b.tooth.toLowerCase() ? -1 : a.tooth.toLowerCase() > b.tooth.toLowerCase() ? 1 : 0;
  return (a: CatalogEntry, b: CatalogEntry): number => {
    let d: number;
    if (sort === "relevance") d = (scores ? (scores.get(b.tooth) ?? 0) - (scores.get(a.tooth) ?? 0) : 0) || b.rank - a.rank || byStars(a, b);
    else if (sort === "stars") d = byStars(a, b);
    else if (sort === "updated") d = time(b.updated) - time(a.updated) || b.stars - a.stars;
    else d = time(b.created) - time(a.created) || b.stars - a.stars;
    return d || byName(a, b);
  };
}

// ------------------------------------------------------------------ running a query

export interface FacetCounts {
  gv: Record<string, number>;
  cat: Record<string, number>;
  platform: Record<string, number>;
  env: Record<string, number>;
  license: number;
  /** Keyed by the tooth as the index spells it. */
  dep: Record<string, number>;
  tags: Record<string, number>;
}

export interface QueryResult {
  /** The page shown. */
  items: CatalogEntry[];
  /** Every mod matching the query, in order. */
  matched: CatalogEntry[];
  /** Mods listed in all. */
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

export interface FacetOptions {
  /** Newest first. */
  gv: string[];
  /** Tooths as the index spells them, by how many mods depend on them. */
  dep: string[];
  /** Plain tags (see {@link isPlainTag}), by how many mods carry them. */
  tags: string[];
}

const byFrequency = (values: Iterable<string>) => {
  const n = new Map<string, number>();
  for (const v of values) n.set(v, (n.get(v) ?? 0) + 1);
  return [...n.keys()].sort((a, b) => n.get(b)! - n.get(a)! || a.localeCompare(b));
};

const optionsCache = new WeakMap<readonly CatalogEntry[], FacetOptions>();

/** The values the Game Version, Depends On and Tags groups offer, from the whole catalogue. */
export function facetOptions(entries: readonly CatalogEntry[]): FacetOptions {
  const cached = optionsCache.get(entries);
  if (cached) return cached;
  const gv = [...new Set(entries.flatMap((e) => e.gameVersions))].sort((a, b) => compareVersionStrings(b, a));
  const options = {
    gv,
    dep: byFrequency(entries.flatMap((e) => e.dependsOn)),
    tags: byFrequency(entries.flatMap((e) => [...new Set(e.tags)].filter(isPlainTag))),
  };
  optionsCache.set(entries, options);
  return options;
}

/** Applies a state to the catalog. `scores` are the search's (see `searchCatalog`), `null` without a query. */
export function runQuery(entries: readonly CatalogEntry[], state: QueryState, scores: Map<string, number> | null): QueryResult {
  const base = entries.filter(
    (e) =>
      (!scores || scores.has(e.tooth)) &&
      (!state.author.length || state.author.some((a) => a.toLowerCase() === e.owner.toLowerCase())),
  );
  const filters: Filters = {
    gv: state.gv,
    cat: state.cat,
    platform: state.platform,
    env: state.env,
    license: state.license,
    dep: state.dep,
    tags: state.tags,
  };
  const sorted = base.filter((e) => matches(e, filters)).sort(compareEntries(state.sort, scores));
  // the default order spreads authors out: at most three of one per page
  const matched = state.sort === "relevance" && !scores ? spreadAuthors(sorted, PAGE_SIZE) : sorted;

  const count = (f: Filters) => base.reduce((n, e) => n + (matches(e, f) ? 1 : 0), 0);
  const without = (f: Facet, id: string) => f.exc.filter((x) => x !== id);
  const counts: FacetCounts = { gv: {}, cat: {}, platform: {}, env: {}, license: 0, dep: {}, tags: {} };
  const options = facetOptions(entries);
  for (const v of options.gv) counts.gv[v] = count({ ...filters, gv: [v] });
  for (const d of options.dep) {
    counts.dep[d] = count({ ...filters, dep: hasTooth(state.dep, d) ? state.dep : [...state.dep, d] });
  }
  for (const tag of options.tags) {
    counts.tags[tag] = count({ ...filters, tags: state.tags.includes(tag) ? state.tags : [...state.tags, tag] });
  }
  for (const id of CATEGORY_BY_ID.keys()) {
    const inc = state.cat.inc.includes(id) ? state.cat.inc : [...state.cat.inc, id];
    counts.cat[id] = count({ ...filters, cat: { inc, exc: without(state.cat, id) } });
  }
  for (const id of PLATFORM_BY_ID.keys()) {
    counts.platform[id] = count({ ...filters, platform: { inc: [id], exc: without(state.platform, id) } });
  }
  for (const id of ENV_BY_ID.keys()) counts.env[id] = count({ ...filters, env: [id] });
  counts.license = count({ ...filters, license: true });

  const pageCount = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const page = Math.min(state.page, pageCount);
  return {
    items: matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    matched,
    total: entries.length,
    page,
    pageCount,
    counts,
  };
}
