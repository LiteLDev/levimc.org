// The build-time catalogue: the lipr index, enriched with what the listing
// filters and sorts on. Every input except the index is optional — a build
// without GITHUB_TOKEN or without levilauncher.json still ships every page,
// with the parts that need the missing data left out. Only the server bundle
// (prerender, dev server) imports this; it is memoised per build.
import { deriveFacets } from "../lib/facets";
import { resolveGameVersions, type LauncherIndex } from "../lib/game-versions";
import { rankScores, type RankRow } from "../lib/ranking";
import { updateUrl, type RepositoryRenames } from "../lib/markdown";
import {
  fetchManifest,
  fetchModIndex,
  fetchWithRetry,
  getAllVersions,
  getDefaultSelection,
  getSortedVariants,
  ownerOf,
} from "../lib/mods";
import type { Catalog, CatalogEntry, Manifest, ModIndex, RawModEntry, RelatedMod } from "../types";
import { fetchRepoMeta, repositoryRenames, type RepoMeta } from "./github";
import { checkIcons } from "./icons";

const LEVILAUNCHER_URL = process.env.LIPR_LEVILAUNCHER_URL ?? "https://lipr.levimc.org/levilauncher.json";
const DESCRIPTION_MAX = 200;
const CONCURRENCY = 8;
const LEVILAMINA = "github.com/liteldev/levilamina";

export interface BuildData {
  index: ModIndex;
  catalog: Catalog;
  byTooth: Map<string, CatalogEntry>;
  meta: Map<string, RepoMeta>;
  renames: RepositoryRenames;
  /** The latest manifest of each mod's default selection (`null`: lipr has none). */
  manifests: Map<string, Manifest | null>;
  launcher: LauncherIndex | null;
  /** Lower-case tooth → the mods whose latest version depends on it. */
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

/** The dependencies of a mod's latest version in each variant. */
function latestDependencies(launcher: LauncherIndex, tooth: string, mod: RawModEntry): string[] {
  const entry = launcher.packages[tooth];
  if (!entry) return [];
  const deps = new Set<string>();
  for (const [label, variant] of Object.entries(mod.variants)) {
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

const DAY = 86_400_000;

/**
 * A mod as the default order's model sees it (`lib/ranking.ts`): one key per
 * repository (renamed repositories are listed under several tooths), and only
 * covariates fixed before anyone could star it. Without GitHub data the age
 * runs from the index's update and the owner is not known.
 */
function rankRow(e: Omit<CatalogEntry, "rank">, repo: RepoMeta | undefined, withOwner: boolean): RankRow {
  const since = Date.parse(e.created ?? e.updated);
  const covariates: Record<string, number> = {
    icon: e.icon ? 1 : 0,
    license: e.license ? 1 : 0,
    category: e.categories.length ? 1 : 0,
  };
  if (withOwner) covariates["org"] = repo?.orgOwned ? 1 : 0;
  for (const p of e.platforms) covariates[`plat:${p}`] = 1;
  for (const env of e.env) covariates[`env:${env}`] = 1;
  return {
    key: (repo?.url ?? e.tooth).toLowerCase(),
    stars: e.stars,
    dependents: e.requiredBy ?? 0,
    ageDays: Number.isNaN(since) ? 0 : Math.max(0, (Date.now() - since) / DAY),
    covariates,
    gameVersions: e.gameVersions,
  };
}

async function build(): Promise<BuildData> {
  const index = await fetchModIndex();
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

  // Who depends on whom, from every mod's latest versions.
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
    const mod = index.packages[tooth]!;
    const tags = Array.isArray(mod.info.tags) ? mod.info.tags : [];
    const manifest = manifests.get(tooth) ?? null;
    const variants = getSortedVariants(mod);
    const facets = deriveFacets({ tags, manifestVariants: manifest?.variants ?? null, labels: variants });
    const repo = meta.get(tooth);
    const owner = repo ? (repo.url.split("/")[3] ?? ownerOf(tooth)) : ownerOf(tooth);
    const icon = iconUrls.get(tooth);
    return {
      tooth,
      name: mod.info.name || tooth.split("/").at(-1)!,
      description: truncate(mod.info.description ?? ""),
      owner,
      ...(icon && loadable.has(icon) ? { icon } : {}),
      tags,
      ...facets,
      gameVersions: gameVersions.get(tooth.toLowerCase()) ?? [],
      dependsOn: dependsOn.get(tooth) ?? [],
      ...(dependents.get(tooth.toLowerCase())?.length ? { requiredBy: dependents.get(tooth.toLowerCase())!.length } : {}),
      stars: mod.stargazer_count ?? 0,
      ...(repo?.license ? { license: repo.license } : {}),
      updated: repo?.latestRelease ?? mod.updated_at,
      ...(repo?.createdAt ? { created: repo.createdAt } : {}),
    };
  });

  const { scores, model } = rankScores(unranked.map((e) => rankRow(e, meta.get(e.tooth), metaComplete)));
  const entries: CatalogEntry[] = unranked.map((e, i) => ({ ...e, rank: scores[i]! }));
  const coef = (names: string[], beta: number[]) => ["const", ...names].map((k, j) => `${k} ${beta[j]!.toFixed(2)}`).join(", ");
  console.log(
    `rank: ${model.rows} repositories; stars ~ ${coef(model.starsCovariates, model.stars.beta)} (r ${model.stars.r.toFixed(2)}); ` +
      `dependents ~ ${coef(["ln_age"], model.dependents.beta)}; shared r ${model.r.toFixed(2)}; q ${model.q.toFixed(3)}`,
  );

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
    `catalog: ${entries.length} mods, ${catalog.stats.authors} authors, ${versions} versions; ` +
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

/** A mod as dependency and dependent lists show it. */
export function related(data: BuildData, tooth: string): RelatedMod {
  const entry = data.byTooth.get(data.canonical.get(tooth.toLowerCase()) ?? "");
  if (entry) return { tooth: entry.tooth, name: entry.name, owner: entry.owner, ...(entry.icon ? { icon: entry.icon } : {}), listed: true };
  return { tooth, name: tooth.split("/").at(-1) ?? tooth, owner: ownerOf(tooth) };
}

/**
 * The LeviLamina range each version of a mod requires, per variant (from
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

/** Every mod any version of `tooth` depends on (lower-case tooths). */
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
