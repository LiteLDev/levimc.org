// The build-time catalogue: the lipr index, enriched with what the listing
// filters and sorts on. Every input except the index is optional — a build
// without GITHUB_TOKEN or without levilauncher.json still ships every page,
// with the parts that need the missing data left out. Only the server bundle
// (prerender, dev server) imports this; it is memoised per build.
import { deriveFacets } from "../lib/facets";
import { compareVersions, resolveGameVersions, type LauncherIndex } from "../lib/game-versions";
import { rankScore } from "../lib/ranking";
import { updateUrl, type RepositoryRenames } from "../lib/markdown";
import {
  fetchManifest,
  fetchPackageIndex,
  fetchWithRetry,
  getAllVersions,
  getDefaultSelection,
  getSortedVariants,
  ownerOf,
} from "../lib/packages";
import type { Catalog, CatalogEntry, Manifest, PackageIndex, RawPackageEntry, RelatedPackage } from "../types";
import { fetchRepoMeta, repositoryRenames, type RepoMeta } from "./github";
import { checkIcons } from "./icons";

const LEVILAUNCHER_URL = process.env.LIPR_LEVILAUNCHER_URL ?? "https://lipr.levimc.org/levilauncher.json";
const DESCRIPTION_MAX = 200;
const CONCURRENCY = 8;
const LEVILAMINA = "github.com/liteldev/levilamina";

export interface BuildData {
  index: PackageIndex;
  catalog: Catalog;
  byTooth: Map<string, CatalogEntry>;
  meta: Map<string, RepoMeta>;
  renames: RepositoryRenames;
  /** The latest manifest of each package's default selection (`null`: lipr has none). */
  manifests: Map<string, Manifest | null>;
  launcher: LauncherIndex | null;
  /** Lower-case tooth → the packages whose latest version depends on it. */
  dependents: Map<string, string[]>;
  /** Lower-case tooth → the tooth as the index spells it. */
  canonical: Map<string, string>;
}

/** Runs `fn` over `items`, `CONCURRENCY` at a time. */
async function mapLimit<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]!);
      }
    }),
  );
  return out;
}

async function fetchLauncherIndex(): Promise<LauncherIndex | null> {
  try {
    const res = await fetchWithRetry(LEVILAUNCHER_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as LauncherIndex;
  } catch (error) {
    console.warn(`::warning::levilauncher.json is unavailable (${String(error)}): no "Required by" or LeviLamina ranges`);
    return null;
  }
}

/** A dependency key (`github.com/o/r#client`) as a lower-case tooth. */
export const dependencyTooth = (key: string) => key.split("#")[0]!.toLowerCase();

/** The dependencies of a package's latest version in each variant. */
function latestDependencies(launcher: LauncherIndex, tooth: string, pkg: RawPackageEntry): string[] {
  const entry = launcher.packages[tooth];
  if (!entry) return [];
  const deps = new Set<string>();
  for (const [label, variant] of Object.entries(pkg.variants)) {
    const latest = variant.versions.at(-1);
    const versionDeps = latest ? entry.variants[label]?.versions[latest]?.dependencies : undefined;
    for (const key of Object.keys(versionDeps ?? {})) deps.add(dependencyTooth(key));
  }
  return [...deps];
}

const truncate = (text: string) => {
  const chars = [...text.trim()];
  return chars.length > DESCRIPTION_MAX ? `${chars.slice(0, DESCRIPTION_MAX - 1).join("").trimEnd()}…` : chars.join("");
};

async function build(): Promise<BuildData> {
  const index = await fetchPackageIndex();
  const tooths = Object.keys(index.packages);
  const canonical = new Map(tooths.map((t) => [t.toLowerCase(), t]));

  const [{ meta, complete: metaComplete }, launcher, manifestList] = await Promise.all([
    fetchRepoMeta(tooths),
    fetchLauncherIndex(),
    mapLimit(tooths, async (tooth) => {
      const selection = getDefaultSelection(index.packages[tooth]!);
      return selection ? fetchManifest(tooth, selection.version) : null;
    }),
  ]);
  const manifests = new Map(tooths.map((t, i) => [t, manifestList[i] ?? null]));
  const renames = repositoryRenames(meta);

  // Who depends on whom, from every package's latest versions.
  const dependents = new Map<string, string[]>();
  const dependsOn = new Map<string, string[]>();
  if (launcher) {
    for (const tooth of tooths) {
      for (const dep of latestDependencies(launcher, tooth, index.packages[tooth]!)) {
        if (dep === tooth.toLowerCase()) continue;
        const listed = canonical.get(dep);
        if (listed) dependsOn.set(tooth, [...(dependsOn.get(tooth) ?? []), listed]);
        const list = dependents.get(dep) ?? [];
        if (!list.includes(tooth)) list.push(tooth);
        dependents.set(dep, list);
      }
    }
  }

  // Icons: the manifest's avatar where it loads, else the owner's (in the browser).
  const iconUrls = new Map<string, string>();
  for (const tooth of tooths) {
    const url = index.packages[tooth]!.info.avatar_url;
    // "all": an icon that does not load as an image (an LFS pointer, say) is dropped by checkIcons
    if (url) iconUrls.set(tooth, updateUrl(url, renames, "all"));
  }
  const loadable = await checkIcons(iconUrls.values());
  const gameVersions = launcher ? resolveGameVersions(launcher) : new Map<string, string[]>();

  const unranked: Omit<CatalogEntry, "rank">[] = tooths.map((tooth) => {
    const pkg = index.packages[tooth]!;
    const tags = Array.isArray(pkg.info.tags) ? pkg.info.tags : [];
    const manifest = manifests.get(tooth) ?? null;
    const variants = getSortedVariants(pkg);
    const facets = deriveFacets({ tags, manifestVariants: manifest?.variants ?? null, labels: variants });
    const repo = meta.get(tooth);
    const owner = repo ? (repo.url.split("/")[3] ?? ownerOf(tooth)) : ownerOf(tooth);
    const icon = iconUrls.get(tooth);
    return {
      tooth,
      name: pkg.info.name || tooth.split("/").at(-1)!,
      description: truncate(pkg.info.description ?? ""),
      owner,
      ...(icon && loadable.has(icon) ? { icon } : {}),
      tags,
      ...facets,
      gameVersions: gameVersions.get(tooth.toLowerCase()) ?? [],
      dependsOn: dependsOn.get(tooth) ?? [],
      ...(dependents.get(tooth.toLowerCase())?.length ? { requiredBy: dependents.get(tooth.toLowerCase())!.length } : {}),
      stars: pkg.stargazer_count ?? 0,
      ...(repo?.license ? { license: repo.license } : {}),
      updated: repo?.latestRelease ?? pkg.updated_at,
      ...(repo?.createdAt ? { created: repo.createdAt } : {}),
    };
  });

  const allGameVersions = [...new Set(unranked.flatMap((e) => e.gameVersions))].sort((a, b) => compareVersions(b, a));
  const now = Date.now();
  const entries: CatalogEntry[] = unranked.map((e) => ({ ...e, rank: rankScore(e, allGameVersions, now) }));

  const versions = tooths.reduce((n, t) => n + getAllVersions(index.packages[t]!).length, 0);
  const catalog: Catalog = {
    entries,
    stats: {
      projects: entries.length,
      authors: new Set(entries.map((e) => e.owner.toLowerCase())).size,
      versions,
    },
    features: { created: metaComplete, license: metaComplete },
  };
  console.log(
    `catalog: ${entries.length} packages, ${catalog.stats.authors} authors, ${versions} versions; ` +
      `${loadable.size} of ${new Set(iconUrls.values()).size} icons load; ` +
      `${[...manifests.values()].filter(Boolean).length} latest manifests`,
  );
  return {
    index,
    catalog,
    byTooth: new Map(entries.map((e) => [e.tooth, e])),
    meta,
    renames,
    manifests,
    launcher,
    dependents,
    canonical,
  };
}

let data: Promise<BuildData> | undefined;

/** The catalogue and everything it was built from, once per build. */
export function loadBuildData(): Promise<BuildData> {
  data ??= build();
  return data;
}

/** A package as dependency and dependent lists show it. */
export function related(data: BuildData, tooth: string): RelatedPackage {
  const entry = data.byTooth.get(data.canonical.get(tooth.toLowerCase()) ?? "");
  if (entry) return { tooth: entry.tooth, name: entry.name, owner: entry.owner, ...(entry.icon ? { icon: entry.icon } : {}), listed: true };
  return { tooth, name: tooth.split("/").at(-1) ?? tooth, owner: ownerOf(tooth) };
}

/**
 * The LeviLamina range each version of a package requires, per variant (from
 * levilauncher.json), for the versions table.
 */
export function leviLaminaRanges(data: BuildData, tooth: string): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  const entry = data.launcher?.packages[tooth];
  if (!entry || tooth.toLowerCase() === LEVILAMINA) return out;
  for (const [label, variant] of Object.entries(entry.variants)) {
    for (const [version, { dependencies }] of Object.entries(variant.versions)) {
      const key = Object.keys(dependencies ?? {}).find((k) => dependencyTooth(k) === LEVILAMINA);
      if (key) (out[label] ??= {})[version] = dependencies![key]!;
    }
  }
  return out;
}

/** Every package any version of `tooth` depends on (lower-case tooths). */
export function allDependencies(data: BuildData, tooth: string): string[] {
  const entry = data.launcher?.packages[tooth];
  const deps = new Set<string>();
  for (const variant of Object.values(entry?.variants ?? {})) {
    for (const { dependencies } of Object.values(variant.versions)) {
      for (const key of Object.keys(dependencies ?? {})) deps.add(dependencyTooth(key));
    }
  }
  return [...deps];
}
