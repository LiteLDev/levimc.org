// The build-time catalogue: the registry (`server/registry.ts`), enriched with
// what the listing filters and sorts on. GitHub's data is optional — a build
// without GITHUB_TOKEN still ships every page, with the parts that need it
// left out. Only the server bundle (prerender, dev server) imports this; it is
// memoised per build.
import { deriveFacets } from "../lib/facets";
import { resolveGameVersions, type LauncherIndex } from "../lib/game-versions";
import { classifyListings, type Listing } from "../lib/listing";
import { rankScores, type RankRow } from "../lib/ranking";
import { updateUrl, type RepositoryRenames } from "../lib/markdown";
import type { RegistryManifest } from "../lib/manifest";
import { getAllVersions, getDefaultSelection, getSortedVariants, ownerOf } from "../lib/mods";
import type { Catalog, CatalogEntry, Manifest, ModIndex, RawModEntry, RelatedMod } from "../types";
import { fetchRepoMeta, repositoryRenames, type RepoMeta } from "./github";
import { checkIcons } from "./icons";
import { loadRegistry } from "./registry";

const DESCRIPTION_MAX = 200;
const LEVILAMINA = "github.com/liteldev/levilamina";

export interface BuildData {
  index: ModIndex;
  /** The listed mods. */
  catalog: Catalog;
  /** Every mod with a page: the listed and the unlisted ones. */
  byTooth: Map<string, CatalogEntry>;
  /** How each package of the index is shown (see `lib/listing.ts`). */
  listings: Map<string, Listing>;
  meta: Map<string, RepoMeta>;
  renames: RepositoryRenames;
  /** The latest manifest of each mod's default selection. */
  manifests: Map<string, Manifest | null>;
  /** Every version's manifest, by tooth and version. */
  versions: Map<string, Map<string, RegistryManifest>>;
  launcher: LauncherIndex;
  /** Lower-case tooth → the mods whose latest version depends on it. */
  dependents: Map<string, string[]>;
  /** Lower-case tooth → the tooth as the index spells it. */
  canonical: Map<string, string>;
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
  const { index, launcher, manifests: versions } = await loadRegistry();
  const tooths = Object.keys(index.packages);
  const canonical = new Map(tooths.map((t) => [t.toLowerCase(), t]));

  const { meta, complete: metaComplete } = await fetchRepoMeta(tooths);
  // stars, and the repository's last update, as lipr's index has them
  for (const tooth of tooths) {
    const repo = meta.get(tooth);
    if (!repo) continue;
    index.packages[tooth]!.stargazer_count = repo.stars;
    index.packages[tooth]!.updated_at = repo.updatedAt;
  }
  const manifests = new Map(
    tooths.map((t) => {
      const selection = getDefaultSelection(index.packages[t]!);
      return [t, (selection && versions.get(t)?.get(selection.version)) ?? null];
    }),
  );
  const renames = repositoryRenames(meta);

  const listings = classifyListings(
    tooths.map((tooth) => {
      const repo = meta.get(tooth);
      const version = getDefaultSelection(index.packages[tooth]!)?.version;
      return {
        tooth,
        manifest: manifests.get(tooth) ?? null,
        ...(version ? { version } : {}),
        ...(repo ? { repo } : {}),
        updated: index.packages[tooth]!.updated_at,
      };
    }),
  );
  const status = (tooth: string) => listings.get(tooth)?.status ?? "listed";
  const paged = tooths.filter((t) => status(t) !== "excluded");
  const listed = paged.filter((t) => status(t) === "listed");
  logListings(listings);

  // Who depends on whom, from every mod's latest versions. Only listed mods count as dependents, and a
  // dependency on an old name of a repository is one on the name it is listed under.
  const dependents = new Map<string, string[]>();
  const dependsOn = new Map<string, string[]>();
  for (const tooth of listed) {
    for (const dep of latestDependencies(launcher, tooth, index.packages[tooth]!)) {
      if (dep === tooth.toLowerCase()) continue;
      const target = pageOf(listings, canonical.get(dep));
      if (target === tooth) continue;
      if (target && !dependsOn.get(tooth)?.includes(target)) {
        dependsOn.set(tooth, [...(dependsOn.get(tooth) ?? []), target]);
      }
      const key = target?.toLowerCase() ?? dep;
      const list = dependents.get(key) ?? [];
      if (!list.includes(tooth)) list.push(tooth);
      dependents.set(key, list);
    }
  }

  // Icons: the manifest's avatar where it loads, else the owner's (in the browser).
  const iconUrls = new Map<string, string>();
  for (const tooth of paged) {
    const url = index.packages[tooth]!.info.avatar_url;
    // "all": an icon that does not load as an image (an LFS pointer, say) is dropped by checkIcons
    if (url) iconUrls.set(tooth, updateUrl(url, renames, "all"));
  }
  const loadable = await checkIcons(iconUrls.values());
  const gameVersions = resolveGameVersions(launcher);

  const unranked: Omit<CatalogEntry, "rank">[] = paged.map((tooth) => {
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

  // The default order is fitted to the listed mods; the unlisted ones are never sorted.
  const ranked = unranked.filter((e) => status(e.tooth) === "listed");
  const { scores, model } = rankScores(ranked.map((e) => rankRow(e, meta.get(e.tooth), metaComplete)));
  const entries: CatalogEntry[] = ranked.map((e, i) => ({ ...e, rank: scores[i]! }));
  const unlisted: CatalogEntry[] = unranked.filter((e) => status(e.tooth) !== "listed").map((e) => ({ ...e, rank: 0 }));
  const coef = (names: string[], beta: number[]) => ["const", ...names].map((k, j) => `${k} ${beta[j]!.toFixed(2)}`).join(", ");
  console.log(
    `rank: ${model.rows} repositories; stars ~ ${coef(model.starsCovariates, model.stars.beta)} (r ${model.stars.r.toFixed(2)}); ` +
      `dependents ~ ${coef(["ln_age"], model.dependents.beta)}; shared r ${model.r.toFixed(2)}; q ${model.q.toFixed(3)}`,
  );

  const versionCount = listed.reduce((n, t) => n + getAllVersions(index.packages[t]!).length, 0);
  const catalog: Catalog = {
    entries,
    stats: {
      projects: entries.length,
      authors: new Set(entries.map((e) => e.owner.toLowerCase())).size,
      versions: versionCount,
    },
    features: { created: metaComplete, license: metaComplete },
  };
  console.log(
    `catalog: ${entries.length} mods, ${catalog.stats.authors} authors, ${versionCount} versions; ` +
      `${loadable.size} of ${new Set(iconUrls.values()).size} icons load; ` +
      `${[...manifests.values()].filter(Boolean).length} latest manifests`,
  );
  return {
    index,
    catalog,
    byTooth: new Map([...entries, ...unlisted].map((e) => [e.tooth, e])),
    listings,
    meta,
    renames,
    manifests,
    versions,
    launcher,
    dependents,
    canonical,
  };
}

/** The tooth whose page shows `tooth`: itself, the tooth its repository is listed under, or none (excluded). */
function pageOf(listings: Map<string, Listing>, tooth: string | undefined): string | undefined {
  if (!tooth) return undefined;
  const listing = listings.get(tooth);
  if (listing?.status === "excluded") return undefined;
  return listing?.status === "unlisted" && listing.reason === "duplicate" ? listing.canonical : tooth;
}

/** What the listing leaves out, and why, in the build log. */
function logListings(listings: Map<string, Listing>) {
  const byReason = new Map<string, string[]>();
  for (const [tooth, listing] of listings) {
    if (listing.status === "listed") continue;
    const label = listing.reason === "duplicate" ? `${tooth} (→ ${listing.canonical})` : tooth;
    const key = `${listing.status} as ${listing.reason}`;
    byReason.set(key, [...(byReason.get(key) ?? []), label]);
  }
  for (const [key, list] of byReason) console.log(`listing: ${list.length} ${key}: ${list.sort().join(", ")}`);
}

let data: Promise<BuildData> | undefined;

/** The catalogue and everything it was built from, once per build. */
export function loadBuildData(): Promise<BuildData> {
  data ??= build();
  return data;
}

/** A mod as dependency and dependent lists show it (an old name of a repository leads to the one it is listed under). */
export function related(data: BuildData, tooth: string): RelatedMod {
  const entry = data.byTooth.get(pageOf(data.listings, data.canonical.get(tooth.toLowerCase())) ?? "");
  if (entry) return { tooth: entry.tooth, name: entry.name, owner: entry.owner, ...(entry.icon ? { icon: entry.icon } : {}), listed: true };
  return { tooth, name: tooth.split("/").at(-1) ?? tooth, owner: ownerOf(tooth) };
}

/** The LeviLamina range each version of a mod requires, per variant, for the versions table. */
export function leviLaminaRanges(data: BuildData, tooth: string): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  const entry = data.launcher.packages[tooth];
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
  const entry = data.launcher.packages[tooth];
  const deps = new Set<string>();
  for (const variant of Object.values(entry?.variants ?? {})) {
    for (const { dependencies } of Object.values(variant.versions)) {
      for (const key of Object.keys(dependencies ?? {})) deps.add(dependencyTooth(key));
    }
  }
  return [...deps];
}
