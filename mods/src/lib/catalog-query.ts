// The listing's state: what the URL says (`?q=&gv=&side=&platform=&tags=
// &license=&dep=&author=&sort=&page=`), how to write it back, and the results it
// selects. Pure functions, shared by the page and the unit tests, and the
// reference the launchers port (the shared contract's A3):
//
// | Facet        | URL          | Matches                                                        |
// |--------------|--------------|----------------------------------------------------------------|
// | Game version | `gv`         | any of them (OR), on `gameVersions`                            |
// | Side         | `side`/`env` | any of them (OR)                                               |
// | Platform     | `platform`   | any of them (OR); only RIDs some mod has                       |
// | Tags         | `tags`       | every one (AND), none of the `-tag` ones; featured groups whole |
// | License      | `license`    | any family or SPDX id (OR)                                     |
// | Dependencies | `dep`        | every bare id (AND), any case                                  |
// | Author       | `author`     | any owner (OR), any case                                       |
//
// Unknown keys and values are dropped (`cat=`, `license=oss`, `platform=endstone`).
import { BASE } from "../base-path.ts";
import { FEATURED_TAGS, tagKey, tagKeys } from "../data/featured-tags.ts";
import { isLicenseFamily, LICENSE_FAMILIES, licenseFamily, licenseOf, type LicenseFamilyId } from "../data/licenses.ts";
import { SIDES } from "../data/sides.ts";
import type { CatalogEntry, CatalogFeatures, Side } from "../types.ts";
import { compareVersions as compareVersionStrings } from "./game-versions.ts";
import { comparePlatforms } from "./manifest.ts";
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
  /** Sides: any of them (OR). */
  side: Side[];
  /** Platforms (RIDs): any of them (OR). */
  platform: string[];
  /** Tag keys (see `data/featured-tags.ts` tagKey): every included one (AND), none of the excluded. */
  tags: Facet;
  /** License families (lower case) and SPDX ids: any of them (OR). */
  license: string[];
  /** Mods the latest version depends on (bare ids, case-insensitive): every one of them (AND). */
  dep: string[];
  /** Repository owners, as written in the URL; matched case-insensitively (OR). */
  author: string[];
  sort: SortKey;
  page: number;
}

export const EMPTY_FACET: Facet = { inc: [], exc: [] };

export const DEFAULT_STATE: QueryState = {
  q: "",
  gv: [],
  side: [],
  platform: [],
  tags: EMPTY_FACET,
  license: [],
  dep: [],
  author: [],
  sort: "relevance",
  page: 1,
};

/** Query keys of the listing (a URL with one of them is not the prerendered default). */
export const LISTING_KEYS = ["q", "gv", "side", "env", "platform", "tags", "license", "dep", "author", "sort", "page"] as const;

const ALL_FEATURES: CatalogFeatures = { created: true, license: true };

/** Comma lists and repeated keys alike: `tags=a,b` = `tags=a&tags=b`. */
function list(params: URLSearchParams, ...keys: string[]): string[] {
  return keys
    .flatMap((key) => params.getAll(key))
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
}

const unique = <T>(values: T[]): T[] => [...new Set(values)];

/** Each value once, compared in any case; the first spelling stays. */
const uniqueAnyCase = (values: string[]) =>
  values.filter((v, i, all) => all.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i);

/** `-tag` excludes; a tag both included and excluded is excluded. Hidden tags are dropped, aliases become their featured tag. */
function tagFacet(values: string[]): Facet {
  const inc: string[] = [];
  const exc: string[] = [];
  for (const raw of values) {
    const excluded = raw.startsWith("-");
    const key = tagKey(excluded ? raw.slice(1) : raw);
    if (!key) continue;
    const into = excluded ? exc : inc;
    if (!into.includes(key)) into.push(key);
  }
  return { inc: inc.filter((key) => !exc.includes(key)), exc };
}

/** `value` as `known` spells it (any case), or undefined. */
const spelledAs = (known: readonly string[], value: string) => known.find((k) => k.toLowerCase() === value.toLowerCase());

/**
 * The values `platform=` and `license=` may take: the platforms and SPDX ids
 * some mod has (a {@link FacetOptions} does).
 */
export interface QueryVocabulary {
  platform: readonly string[];
  license: readonly { ids: readonly string[] }[];
}

/**
 * Reads the listing state from a query string. Unknown keys and values are
 * dropped; with a `vocabulary` (the catalogue's {@link facetOptions}), so are
 * platforms and SPDX ids no mod has, and the rest take the catalogue's spelling.
 */
export function parseQuery(
  params: URLSearchParams,
  features: CatalogFeatures = ALL_FEATURES,
  vocabulary?: QueryVocabulary,
): QueryState {
  let sort = (params.get("sort") ?? "").toLowerCase();
  // Download counts are not shown; links sorted by them get stars instead.
  if (sort === "downloads") sort = "stars";
  if (sort === "newest" && !features.created) sort = "relevance";
  const page = parseInt(params.get("page") ?? "1", 10);
  const sides = list(params, "side", "env").map((v) => v.toLowerCase());
  const platforms = uniqueAnyCase(
    list(params, "platform").flatMap((v) => (vocabulary ? (spelledAs(vocabulary.platform, v) ?? []) : [v])),
  );
  const spdxIds = vocabulary?.license.flatMap((family) => family.ids);
  const licenses = features.license
    ? uniqueAnyCase(
        list(params, "license").flatMap((v) => {
          if (isLicenseFamily(v.toLowerCase())) return [v.toLowerCase()];
          return spdxIds ? (spelledAs(spdxIds, v) ?? []) : [v];
        }),
      )
    : [];
  return {
    q: params.get("q") ?? "",
    gv: unique(list(params, "gv")),
    side: SIDES.map((s) => s.id).filter((id) => sides.includes(id)),
    platform: platforms,
    tags: tagFacet(list(params, "tags")),
    license: licenses,
    dep: uniqueAnyCase(list(params, "dep")),
    author: uniqueAnyCase(list(params, "author")),
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
  const add = (key: string, values: readonly string[]) => {
    if (values.length) parts.push([key, values.map(encode).join(",")]);
  };
  if (state.q.trim()) parts.push(["q", encode(state.q)]);
  add("gv", state.gv);
  add("side", state.side);
  add("platform", state.platform);
  add("tags", facetValues(state.tags));
  add("license", state.license);
  add("dep", state.dep);
  add("author", state.author);
  if (state.sort !== "relevance") parts.push(["sort", state.sort]);
  if (state.page > 1) parts.push(["page", String(state.page)]);
  return parts.length ? `${BASE}?${parts.map(([k, v]) => `${k}=${v}`).join("&")}` : BASE;
}

/** How many filters are on (the Filters button's badge): search and sort do not count. */
export function filterCount(state: QueryState): number {
  return (
    state.gv.length +
    state.side.length +
    state.platform.length +
    state.tags.inc.length +
    state.tags.exc.length +
    state.license.length +
    state.dep.length +
    state.author.length
  );
}

/** The state without any filter: search and sort stay. */
export function clearFilters(state: QueryState): QueryState {
  return { ...DEFAULT_STATE, q: state.q, sort: state.sort };
}

// ------------------------------------------------------------------ filtering

/** What the filters compare of a mod, worked out once per entry. */
interface Facts {
  tags: Set<string>;
  /** After the overrides (`data/licenses.ts`), lower case. */
  license: string | undefined;
  family: LicenseFamilyId;
  deps: Set<string>;
  platform: Set<string>;
  owner: string;
}

const factsCache = new WeakMap<CatalogEntry, Facts>();

function factsOf(e: CatalogEntry): Facts {
  let facts = factsCache.get(e);
  if (!facts) {
    const license = licenseOf(e);
    facts = {
      tags: new Set(tagKeys(e.tags)),
      license: license?.toLowerCase(),
      family: licenseFamily(license),
      deps: new Set(Object.keys(e.deps).map((d) => d.toLowerCase())),
      platform: new Set(e.platform.map((p) => p.toLowerCase())),
      owner: e.owner.toLowerCase(),
    };
    factsCache.set(e, facts);
  }
  return facts;
}

/** The filters of a state (everything but the search, the sort and the page). */
type Filters = Pick<QueryState, "gv" | "side" | "platform" | "tags" | "license" | "dep" | "author">;

/** Whether a mod passes the filters (the search is applied apart, see `searchCatalog`). */
export function matchesFilters(e: CatalogEntry, f: Filters): boolean {
  const facts = factsOf(e);
  return (
    (!f.gv.length || f.gv.some((v) => e.gameVersions.includes(v))) &&
    (!f.side.length || f.side.some((s) => e.side.includes(s))) &&
    (!f.platform.length || f.platform.some((p) => facts.platform.has(p.toLowerCase()))) &&
    f.tags.inc.every((key) => facts.tags.has(key)) &&
    !f.tags.exc.some((key) => facts.tags.has(key)) &&
    (!f.license.length || f.license.some((v) => v === facts.family || v.toLowerCase() === facts.license)) &&
    f.dep.every((d) => facts.deps.has(d.toLowerCase())) &&
    (!f.author.length || f.author.some((a) => a.toLowerCase() === facts.owner))
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
    a.id.toLowerCase() < b.id.toLowerCase() ? -1 : a.id.toLowerCase() > b.id.toLowerCase() ? 1 : 0;
  return (a: CatalogEntry, b: CatalogEntry): number => {
    let d: number;
    if (sort === "relevance") d = (scores ? (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) : 0) || b.rank - a.rank || byStars(a, b);
    else if (sort === "stars") d = byStars(a, b);
    else if (sort === "updated") d = time(b.updated) - time(a.updated) || b.stars - a.stars;
    else d = time(b.created) - time(a.created) || b.stars - a.stars;
    return d || byName(a, b);
  };
}

// ------------------------------------------------------------------ facet options

/** A license family and the SPDX ids under it. */
export interface LicenseOption {
  family: LicenseFamilyId;
  /** By how many mods have them (none for `none`). */
  ids: string[];
}

export interface FacetOptions {
  /** Newest first. */
  gv: string[];
  /** Sides some mod runs on, server first. */
  side: Side[];
  /** RIDs some mod runs on: the launchers' (`lib/manifest.ts` FORCED_PLATFORMS) first, in that order, then by name. */
  platform: string[];
  /** Tag keys: the featured tags some mod has, in their table's order, then every other by how many mods carry it. */
  tags: string[];
  /** The families some mod is under, in their table's order (`data/licenses.ts`). */
  license: LicenseOption[];
  /** Bare ids as the index spells them, by how many mods depend on them. */
  dep: string[];
  /** Owners, by how many mods they have. */
  author: string[];
}

/** Values by how many times they occur, then by name. */
const byFrequency = (values: Iterable<string>) => {
  const n = new Map<string, number>();
  for (const v of values) n.set(v, (n.get(v) ?? 0) + 1);
  return [...n.keys()].sort((a, b) => n.get(b)! - n.get(a)! || a.localeCompare(b));
};

const optionsCache = new WeakMap<readonly CatalogEntry[], FacetOptions>();

/** The values every filter group offers, from the whole catalogue. */
export function facetOptions(entries: readonly CatalogEntry[]): FacetOptions {
  const cached = optionsCache.get(entries);
  if (cached) return cached;
  const gv = [...new Set(entries.flatMap((e) => e.gameVersions))].sort((a, b) => compareVersionStrings(b, a));
  const platform = [...new Set(entries.flatMap((e) => e.platform))].sort(comparePlatforms);
  const tagCounts = byFrequency(entries.flatMap((e) => [...factsOf(e).tags]));
  const featured = FEATURED_TAGS.map((f) => f.id).filter((id) => tagCounts.includes(id));
  const licenses = entries.map((e) => licenseOf(e));
  const license = LICENSE_FAMILIES.map((f) => f.id)
    .filter((family) => licenses.some((l) => licenseFamily(l) === family))
    .map((family) => ({
      family,
      ids: byFrequency(licenses.filter((l): l is string => !!l && licenseFamily(l) === family)),
    }));
  const options: FacetOptions = {
    gv,
    side: SIDES.map((s) => s.id).filter((id) => entries.some((e) => e.side.includes(id))),
    platform,
    tags: [...featured, ...tagCounts.filter((key) => !featured.includes(key))],
    license,
    dep: byFrequency(entries.flatMap((e) => Object.keys(e.deps))),
    author: byFrequency(entries.map((e) => e.owner)),
  };
  optionsCache.set(entries, options);
  return options;
}

// ------------------------------------------------------------------ running a query

export interface FacetCounts {
  gv: Record<string, number>;
  side: Record<string, number>;
  platform: Record<string, number>;
  /** By tag key. */
  tags: Record<string, number>;
  /** By family id and by SPDX id. */
  license: Record<string, number>;
  /** Keyed by the bare id as the index spells it. */
  dep: Record<string, number>;
  /** Keyed by the owner as the index spells it. */
  author: Record<string, number>;
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
   * How many results each filter option would give: an OR group's option
   * (game version, side, platform, license, author) is counted as if it were
   * the group's only value; an AND group's (tags, dependencies) as if added to
   * the group (a tag excluded as if included instead). Every other group stays
   * as it is. Options of {@link facetOptions} and the state's own values are counted.
   */
  counts: FacetCounts;
}

const withExtra = (options: readonly string[], selected: readonly string[]) => [
  ...options,
  ...selected.filter((v) => !options.some((o) => o.toLowerCase() === v.toLowerCase())),
];

/** Applies a state to the catalog. `scores` are the search's (see `searchCatalog`), `null` without a query. */
export function runQuery(entries: readonly CatalogEntry[], state: QueryState, scores: Map<string, number> | null): QueryResult {
  const base = scores ? entries.filter((e) => scores.has(e.id)) : entries;
  const filters: Filters = {
    gv: state.gv,
    side: state.side,
    platform: state.platform,
    tags: state.tags,
    license: state.license,
    dep: state.dep,
    author: state.author,
  };
  const sorted = base.filter((e) => matchesFilters(e, filters)).sort(compareEntries(state.sort, scores));
  // the default order spreads authors out: at most three of one per page
  const matched = state.sort === "relevance" && !scores ? spreadAuthors(sorted, PAGE_SIZE) : sorted;

  const count = (patch: Partial<Filters>) => {
    const f = { ...filters, ...patch };
    return base.reduce((n, e) => n + (matchesFilters(e, f) ? 1 : 0), 0);
  };
  const has = (values: readonly string[], v: string) => values.some((x) => x.toLowerCase() === v.toLowerCase());
  const options = facetOptions(entries);
  const counts: FacetCounts = { gv: {}, side: {}, platform: {}, tags: {}, license: {}, dep: {}, author: {} };
  for (const v of withExtra(options.gv, state.gv)) counts.gv[v] = count({ gv: [v] });
  for (const s of SIDES) counts.side[s.id] = count({ side: [s.id] });
  for (const p of withExtra(options.platform, state.platform)) counts.platform[p] = count({ platform: [p] });
  for (const key of withExtra(options.tags, [...state.tags.inc, ...state.tags.exc])) {
    const inc = state.tags.inc.includes(key) ? state.tags.inc : [...state.tags.inc, key];
    counts.tags[key] = count({ tags: { inc, exc: state.tags.exc.filter((x) => x !== key) } });
  }
  const licenseValues = [...LICENSE_FAMILIES.map((f) => f.id), ...options.license.flatMap((o) => o.ids)];
  for (const v of withExtra(licenseValues, state.license)) counts.license[v] = count({ license: [v] });
  for (const d of withExtra(options.dep, state.dep)) {
    counts.dep[d] = count({ dep: has(state.dep, d) ? state.dep : [...state.dep, d] });
  }
  for (const a of withExtra(options.author, state.author)) counts.author[a] = count({ author: [a] });

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
