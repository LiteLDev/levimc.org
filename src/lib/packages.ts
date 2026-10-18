import FlexSearch from "flexsearch";
import type {
  Package,
  PackageIndex,
  PackageInfo,
  RawPackageEntry,
} from "../types";

const PACKAGE_INDEX_URL = "https://lipr.levimc.org/index.json";
const PACKAGE_REGISTRY_URL = "https://lipr.levimc.org";

export const ITEMS_PER_PAGE = 60;
const SEARCH_LIMIT = 1000;
const SEARCH_NAME_WEIGHT = 3;
const SEARCH_TAG_WEIGHT = 2;
const MAX_RANK_BASE = 1000;

// Reuse a built search index across searches to avoid rebuilding FlexSearch
// every time the query changes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedSearchIndex: any | null = null;
let cachedSearchFingerprint = "";

export function normalizePackageIndex(index: PackageIndex): Package[] {
  return Object.entries(index.packages).map(([tooth, pkg]) => ({
    tooth,
    info: {
      ...pkg.info,
      tags: Array.isArray(pkg.info.tags) ? pkg.info.tags : [],
    },
    stars: pkg.stargazer_count,
    updated: pkg.updated_at,
    versions: Array.from(
      new Set(
        Object.values(pkg.variants).flatMap((variant) => variant.versions),
      ),
    ),
  }));
}

export type SortOption = "relevance" | "updated" | "stars";

function getUpdatedTimestamp(updated: string): number {
  const ts = Date.parse(updated);
  return Number.isNaN(ts) ? 0 : ts;
}

function buildSearchFingerprint(packages: Package[]): string {
  const first = packages[0];
  const last = packages.at(-1);
  if (!first || !last) return "0";

  return [
    String(packages.length),
    first.tooth,
    first.updated,
    last.tooth,
    last.updated,
  ].join("|");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSearchIndex(packages: Package[]): any {
  const nextFingerprint = buildSearchFingerprint(packages);
  if (cachedSearchIndex && cachedSearchFingerprint === nextFingerprint) {
    return cachedSearchIndex;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const idx: any = new FlexSearch.Document({
    document: {
      id: "tooth",
      index: [
        { field: "info:name", tokenize: "full" },
        { field: "info:description", tokenize: "full" },
        { field: "info:tags", tokenize: "strict" },
      ],
      store: true,
    },
  });

  for (const pkg of packages) {
    idx.add({ tooth: pkg.tooth, info: pkg.info });
  }

  cachedSearchIndex = idx;
  cachedSearchFingerprint = nextFingerprint;
  return idx;
}

// ---------------------------------------------------------------------------
// Data Fetching
// ---------------------------------------------------------------------------

/**
 * `fetch` that retries network errors and 5xx/429 answers a few times. A
 * single flaky request during the hourly rebuild would otherwise ship a page
 * without its README until the next one.
 */
async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url);
      if ((res.status < 500 && res.status !== 429) || attempt >= attempts) {
        return res;
      }
    } catch (error) {
      if (attempt >= attempts) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
}

/** The lipr index. The build fetches it once and bakes it into the pages. */
export async function fetchPackageIndex(): Promise<PackageIndex> {
  const res = await fetchWithRetry(PACKAGE_INDEX_URL);
  if (!res.ok) throw new Error("Failed to fetch package index");
  return res.json();
}

// ---------------------------------------------------------------------------
// Search  (FlexSearch, index reused across searches)
// ---------------------------------------------------------------------------

export function searchPackages(
  packages: Package[],
  query: string,
): { results: Package[]; scores: Map<string, number> } {
  if (!query.trim()) {
    return { results: packages, scores: new Map() };
  }

  const idx = getSearchIndex(packages);

  const searchResults = idx.search(query, { limit: SEARCH_LIMIT });
  const scores = new Map<string, number>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const fieldResult of searchResults as any[]) {
    let weight = 1;
    if (fieldResult.field === "info:name") weight = SEARCH_NAME_WEIGHT;
    else if (fieldResult.field === "info:tags") weight = SEARCH_TAG_WEIGHT;

    fieldResult.result.forEach((id: string, idx: number) => {
      const rankScore = (MAX_RANK_BASE - idx) * weight;
      scores.set(id, (scores.get(id) || 0) + rankScore);
    });
  }

  if (searchResults.length === 0) {
    return { results: [], scores };
  }

  const results = packages.filter((pkg) => scores.has(pkg.tooth));
  return { results, scores };
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

export function filterByTags(packages: Package[], tags: string[]): Package[] {
  if (tags.length === 0) return packages;
  return packages.filter((pkg) =>
    tags.every((tag) => (pkg.info.tags ?? []).includes(tag)),
  );
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

export function sortPackages(
  packages: Package[],
  sortBy: SortOption,
  scores: Map<string, number>,
  hasQuery: boolean,
): Package[] {
  return [...packages].sort((a, b) => {
    if (sortBy === "relevance") {
      if (!hasQuery) return 0;
      return (scores.get(b.tooth) || 0) - (scores.get(a.tooth) || 0);
    }
    if (sortBy === "stars") {
      return b.stars - a.stars;
    }
    // "updated"
    return getUpdatedTimestamp(b.updated) - getUpdatedTimestamp(a.updated);
  });
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export function paginatePackages(
  packages: Package[],
  page: number,
  perPage: number = ITEMS_PER_PAGE,
): { items: Package[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(packages.length / perPage));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * perPage;
  return {
    items: packages.slice(start, start + perPage),
    totalPages,
  };
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export function extractTags(packages: Package[]): string[] {
  const tagCounts = new Map<string, number>();
  for (const pkg of packages) {
    const tags = pkg.info.tags ?? [];
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  return Array.from(tagCounts.keys()).sort((a, b) => {
    const countDiff = (tagCounts.get(b) || 0) - (tagCounts.get(a) || 0);
    if (countDiff !== 0) return countDiff;
    return a.localeCompare(b);
  });
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/** The page of a package: `/packages/github.com/LiteLDev/LeviLamina/`. */
export function packagePath(tooth: string): string {
  return `/packages/${tooth}/`;
}

/** The tooth a package page path names, or `null` for any other path. */
export function toothFromPath(pathname: string): string | null {
  const match = /^\/packages\/(.+)\/$/.exec(pathname);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/**
 * A date as the visitor's browser formats it (their locale and time zone), or
 * — with `prerendered` — as the build prints it: US format in UTC. Pages
 * hydrate with the prerendered form and switch to the local one after.
 */
export function formatDate(value: string, prerendered = false): string {
  const date = new Date(value);
  return prerendered
    ? date.toLocaleDateString("en-US", { timeZone: "UTC" })
    : date.toLocaleDateString();
}

export function getPackageManifestUrl(tooth: string, version: string): string {
  return `${PACKAGE_REGISTRY_URL}/packages/${tooth}@${version}/tooth.json`;
}

export interface RepoBaseUrls {
  /** Raw file contents, e.g. `https://raw.githubusercontent.com/o/r/v1.0.0/`. */
  raw: string;
  /** Browsable files, e.g. `https://github.com/o/r/blob/v1.0.0/`. */
  blob: string;
}

/**
 * The repository a tooth was published from: `https://<tooth>`, or where that
 * repository lives now when the build could find out (see
 * `server/repositories.ts`).
 */
export function getRepositoryUrl(tooth: string, current?: string): string {
  return current ?? `https://${tooth}`;
}

const GITHUB_REPO = /^https:\/\/github\.com\/([^/]+\/[^/]+)$/;

/** Top-level bases for the files of `repository` at a version's tag. */
export function getRepoBaseUrls(repository: string, version: string): RepoBaseUrls {
  const tag = `v${version}`;
  const github = GITHUB_REPO.exec(repository)?.[1];
  if (github) {
    return {
      raw: `https://raw.githubusercontent.com/${github}/${tag}/`,
      blob: `https://github.com/${github}/blob/${tag}/`,
    };
  }
  return {
    raw: `${repository}/raw/refs/tags/${tag}/`,
    blob: `${repository}/blob/refs/tags/${tag}/`,
  };
}

export function getReadmeUrl(repository: string, version: string): string {
  return `${getRepoBaseUrls(repository, version).raw}README.md`;
}

// ---------------------------------------------------------------------------
// Package details  (fetched at build time for the latest version, and in the
// browser for any other; both hosts allow cross-origin reads)
// ---------------------------------------------------------------------------

export async function fetchManifestInfo(
  tooth: string,
  version: string,
): Promise<PackageInfo | null> {
  try {
    const res = await fetchWithRetry(getPackageManifestUrl(tooth, version));
    if (!res.ok) return null;
    const manifest = await res.json();
    return manifest?.info ?? null;
  } catch {
    return null;
  }
}

export async function fetchReadme(
  repository: string,
  version: string,
): Promise<string | null> {
  try {
    const res = await fetchWithRetry(getReadmeUrl(repository, version));
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Variants in display order, the default (`""`) variant first. */
export function getSortedVariants(pkg: RawPackageEntry): string[] {
  return Object.keys(pkg.variants).sort((a, b) => {
    if (a === "") return -1;
    if (b === "") return 1;
    return a.localeCompare(b);
  });
}

export function getVersionsForVariant(
  pkg: RawPackageEntry,
  variant: string,
): string[] {
  const variantMeta = pkg.variants[variant];
  if (!variantMeta) return [];
  return Array.from(new Set(variantMeta.versions));
}

export interface PackageSelection {
  variant: string;
  version: string;
}

/** What a package page shows when the URL asks for nothing in particular. */
export function getDefaultSelection(
  pkg: RawPackageEntry,
): PackageSelection | null {
  for (const variant of getSortedVariants(pkg)) {
    const version = getVersionsForVariant(pkg, variant).at(-1);
    if (version) return { variant, version };
  }
  return null;
}

/**
 * Honors the requested variant and version where the package has them, and
 * falls back to the default variant and its latest version otherwise.
 */
export function resolveSelection(
  pkg: RawPackageEntry,
  requestedVariant: string | null,
  requestedVersion: string | null,
): PackageSelection | null {
  const fallback = getDefaultSelection(pkg);
  if (!fallback) return null;

  const variant =
    requestedVariant !== null &&
    getVersionsForVariant(pkg, requestedVariant).length > 0
      ? requestedVariant
      : fallback.variant;
  const versions = getVersionsForVariant(pkg, variant);
  const version =
    requestedVersion !== null && versions.includes(requestedVersion)
      ? requestedVersion
      : versions.at(-1)!;
  return { variant, version };
}

/** Links to the bare page for the default selection, so it has one URL. */
export function buildPackageUrl(
  tooth: string,
  pkg: RawPackageEntry,
  selection: PackageSelection,
): string {
  const fallback = getDefaultSelection(pkg);
  const base = packagePath(tooth);
  if (
    fallback &&
    fallback.variant === selection.variant &&
    fallback.version === selection.version
  ) {
    return base;
  }

  const query = new URLSearchParams();
  query.set("variant", selection.variant);
  query.set("version", selection.version);
  return `${base}?${query.toString()}`;
}
