// The build-time catalogue: the registry (`server/registry.ts`), enriched with
// what the listing filters and sorts on. GitHub's data is optional — a build
// without GITHUB_TOKEN still ships every page, with the parts that need it
// left out. Only the server bundle (prerender, dev server) imports this; it is
// memoised per build.
import { hasFeaturedTag } from "../data/featured-tags";
import { resolveGameVersions, type LauncherIndex } from "../lib/game-versions";
import { classifyListings, type Listing } from "../lib/listing";
import { LEVILAMINA_PATH, sidesIn, splitDependency, targetOf } from "../lib/manifest";
import { rankScores, type RankRow } from "../lib/ranking";
import { updateUrl, type RepositoryRenames } from "../lib/markdown";
import { getAllVersions, getDefaultSelection, ownerOf } from "../lib/mods";
import type { Catalog, CatalogEntry, LipDoc, LipEntry, ModIndex, RelatedMod, VersionTarget } from "../types";
import { fetchRepoMeta, repositoryRenames, type RepoMeta } from "./github";
import { checkIcons } from "./icons";
import { loadRegistry, type LiprRegistry, type ManifestOrigin } from "./registry";

const DESCRIPTION_MAX = 200;

export interface BuildData {
  index: ModIndex;
  /** The listed mods. */
  catalog: Catalog;
  /** Every mod with a page: the listed and the unlisted ones. */
  byId: Map<string, CatalogEntry>;
  /** How each package of the index is shown (see `lib/listing.ts`). */
  listings: Map<string, Listing>;
  meta: Map<string, RepoMeta>;
  renames: RepositoryRenames;
  /** The package file of each mod's default selection (its latest version). */
  latest: Map<string, LipDoc | null>;
  /** Every version's package file, by id and version. */
  docs: Map<string, Map<string, LipDoc>>;
  /** Where each version's package file was read, by id and version. */
  origins: Map<string, Map<string, ManifestOrigin>>;
  /** Every version's dependencies, per variant. */
  launcher: LauncherIndex;
  /** lipr's indexes (`tooth.json` only, see `server/api.ts` liprFiles). */
  lipr: LiprRegistry;
  /** Lower-case id → the mods whose latest version depends on it. */
  dependents: Map<string, string[]>;
  /** Lower-case id → the id as the index spells it. */
  canonical: Map<string, string>;
}

/** A dependency key (`github.com/o/r#client`) as a lower-case id. */
export const dependencyId = (key: string) => splitDependency(key).id.toLowerCase();

/** Every entry of a package file. */
const entriesOf = (doc: LipDoc | null | undefined): LipEntry[] => Object.values(doc?.variants ?? {}).flat();

const truncate = (text: string) => {
  const chars = [...text.trim()];
  return chars.length > DESCRIPTION_MAX ? `${chars.slice(0, DESCRIPTION_MAX - 1).join("").trimEnd()}…` : chars.join("");
};

const DAY = 86_400_000;

/**
 * A mod as the default order's model sees it (`lib/ranking.ts`): one key per
 * repository (renamed repositories are listed under several ids), and only
 * covariates fixed before anyone could star it. Without GitHub data the age
 * runs from the index's update and the owner is not known.
 */
function rankRow(e: Omit<CatalogEntry, "rank">, repo: RepoMeta | undefined, withOwner: boolean): RankRow {
  const since = Date.parse(e.created ?? e.updated);
  const covariates: Record<string, number> = {
    icon: e.logo ? 1 : 0,
    license: e.license ? 1 : 0,
    featured: hasFeaturedTag(e.tags) ? 1 : 0,
  };
  if (withOwner) covariates["org"] = repo?.orgOwned ? 1 : 0;
  for (const side of e.side) covariates[`side:${side}`] = 1;
  return {
    key: (repo?.url ?? e.id).toLowerCase(),
    stars: e.stars,
    dependents: e.requiredBy ?? 0,
    ageDays: Number.isNaN(since) ? 0 : Math.max(0, (Date.now() - since) / DAY),
    covariates,
    gameVersions: e.gameVersions,
  };
}

async function build(): Promise<BuildData> {
  const { index, launcher, docs, origins, lipr } = await loadRegistry();
  const ids = Object.keys(index.packages);
  const canonical = new Map(ids.map((t) => [t.toLowerCase(), t]));

  const liprOnly = Object.keys(lipr.index.packages).filter((t) => !index.packages[t]);
  const { meta, complete: metaComplete } = await fetchRepoMeta([...ids, ...liprOnly]);
  // stars, and the repository's last update, as lipr's index has them
  for (const id of [...ids, ...liprOnly]) {
    const repo = meta.get(id);
    if (!repo) continue;
    for (const pkg of [index.packages[id], lipr.index.packages[id]]) {
      if (!pkg) continue;
      pkg.stargazer_count = repo.stars;
      pkg.updated_at = repo.updatedAt;
    }
  }
  const latest = new Map(
    ids.map((id) => {
      const selection = getDefaultSelection(index.packages[id]!);
      return [id, (selection && docs.get(id)?.get(selection.version)) ?? null];
    }),
  );
  const renames = repositoryRenames(meta);

  const listings = classifyListings(
    ids.map((id) => {
      const repo = meta.get(id);
      const version = getDefaultSelection(index.packages[id]!)?.version;
      return {
        id,
        doc: latest.get(id) ?? null,
        ...(version ? { version } : {}),
        ...(repo ? { repo } : {}),
        updated: index.packages[id]!.updated_at,
      };
    }),
  );
  const status = (id: string) => listings.get(id)?.status ?? "listed";
  const paged = ids.filter((t) => status(t) !== "excluded");
  const listed = paged.filter((t) => status(t) === "listed");
  logListings(listings);

  // What each mod's latest version depends on, by the id whose page shows it (a dependency on an old name of a
  // repository is one on the name it is listed under), ranges of several entries joined.
  const depsOf = (id: string): Record<string, string> => {
    const ranges = new Map<string, string[]>();
    for (const entry of entriesOf(latest.get(id))) {
      for (const [key, range] of Object.entries(entry.deps)) {
        const bare = splitDependency(key).id;
        const known = canonical.get(bare.toLowerCase());
        const target = pageOf(listings, known) ?? known ?? bare;
        if (target.toLowerCase() === id.toLowerCase()) continue;
        const list = ranges.get(target) ?? [];
        if (!list.includes(range)) list.push(range);
        ranges.set(target, list);
      }
    }
    return Object.fromEntries([...ranges].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([dep, list]) => [dep, list.join(" || ")]));
  };
  const deps = new Map(paged.map((id) => [id, depsOf(id)]));

  // Who depends on whom, from every mod's latest version. Only listed mods count as dependents.
  const dependents = new Map<string, string[]>();
  for (const id of listed) {
    for (const dep of Object.keys(deps.get(id) ?? {})) {
      const key = dep.toLowerCase();
      const list = dependents.get(key) ?? [];
      if (!list.includes(id)) list.push(id);
      dependents.set(key, list);
    }
  }

  // Logos: the manifest's where they load, else the owner's avatar (in the browser).
  const logoUrls = new Map<string, string>();
  for (const id of paged) {
    const url = index.packages[id]!.info.logo;
    // "all": a logo that does not load as an image (an LFS pointer, say) is dropped by checkIcons
    if (url) logoUrls.set(id, updateUrl(url, renames, "all"));
  }
  // the logos that load, each scaled down to the sizes the pages show (server/icons.ts)
  const loadable = await checkIcons(logoUrls.values());
  const gameVersions = resolveGameVersions(launcher);

  const unranked: Omit<CatalogEntry, "rank">[] = paged.map((id) => {
    const mod = index.packages[id]!;
    const tags = Array.isArray(mod.info.tags) ? mod.info.tags : [];
    const entries = entriesOf(latest.get(id));
    const repo = meta.get(id);
    const owner = repo ? (repo.url.split("/")[3] ?? ownerOf(id)) : ownerOf(id);
    const logo = logoUrls.get(id);
    return {
      id,
      name: mod.info.name || id.split("/").at(-1)!,
      description: truncate(mod.info.description ?? ""),
      owner,
      ...(logo && loadable.has(logo) ? { logo, ...(loadable.get(logo)!.id ? { logoId: loadable.get(logo)!.id } : {}) } : {}),
      tags,
      side: sidesIn(entries),
      platform: [...new Set(entries.map((e) => e.platform))].sort(),
      gameVersions: gameVersions.get(id.toLowerCase()) ?? [],
      deps: deps.get(id) ?? {},
      ...(dependents.get(id.toLowerCase())?.length ? { requiredBy: dependents.get(id.toLowerCase())!.length } : {}),
      stars: mod.stargazer_count ?? 0,
      ...(repo?.license ? { license: repo.license } : {}),
      updated: repo?.latestRelease ?? mod.updated_at,
      ...(repo?.createdAt ? { created: repo.createdAt } : {}),
    };
  });

  // The default order is fitted to the listed mods; the unlisted ones are never sorted.
  const ranked = unranked.filter((e) => status(e.id) === "listed");
  const { scores, model } = rankScores(ranked.map((e) => rankRow(e, meta.get(e.id), metaComplete)));
  const entries: CatalogEntry[] = ranked.map((e, i) => ({ ...e, rank: scores[i]! }));
  const unlisted: CatalogEntry[] = unranked.filter((e) => status(e.id) !== "listed").map((e) => ({ ...e, rank: 0 }));
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
      `${loadable.size} of ${new Set(logoUrls.values()).size} logos load; ` +
      `${[...latest.values()].filter(Boolean).length} latest manifests`,
  );
  return {
    index,
    catalog,
    byId: new Map([...entries, ...unlisted].map((e) => [e.id, e])),
    listings,
    meta,
    renames,
    latest,
    docs,
    origins,
    launcher,
    lipr,
    dependents,
    canonical,
  };
}

/** The id whose page shows `id`: itself, the id its repository is listed under, or none (excluded). */
function pageOf(listings: Map<string, Listing>, id: string | undefined): string | undefined {
  if (!id) return undefined;
  const listing = listings.get(id);
  if (listing?.status === "excluded") return undefined;
  return listing?.status === "unlisted" && listing.reason === "duplicate" ? listing.canonical : id;
}

/** What the listing leaves out, and why, in the build log. */
function logListings(listings: Map<string, Listing>) {
  const byReason = new Map<string, string[]>();
  for (const [id, listing] of listings) {
    if (listing.status === "listed") continue;
    const label = listing.reason === "duplicate" ? `${id} (→ ${listing.canonical})` : id;
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
export function related(data: BuildData, id: string): RelatedMod {
  const entry = data.byId.get(pageOf(data.listings, data.canonical.get(id.toLowerCase())) ?? "");
  if (entry) {
    return {
      id: entry.id,
      name: entry.name,
      owner: entry.owner,
      ...(entry.logo ? { logo: entry.logo } : {}),
      ...(entry.logoId ? { logoId: entry.logoId } : {}),
      listed: true,
    };
  }
  return { id, name: id.split("/").at(-1) ?? id, owner: ownerOf(id) };
}

/**
 * What each version of a mod runs on, per variant (variant → version →
 * target): its entries' sides and platforms, and the LeviLamina range they
 * depend on (none for LeviLamina itself).
 */
export function versionTargets(data: BuildData, id: string): Record<string, Record<string, VersionTarget>> {
  const out: Record<string, Record<string, VersionTarget>> = {};
  const isLeviLamina = id.toLowerCase() === LEVILAMINA_PATH;
  for (const [version, doc] of data.docs.get(id) ?? []) {
    for (const [variant, entries] of Object.entries(doc.variants)) {
      const target = targetOf(entries);
      if (isLeviLamina) delete target.leviLamina;
      (out[variant] ??= {})[version] = target;
    }
  }
  return out;
}

/** Every mod any version of `id` depends on (lower-case ids). */
export function allDependencies(data: BuildData, id: string): string[] {
  const entry = data.launcher.packages[id];
  const deps = new Set<string>();
  for (const variant of Object.values(entry?.variants ?? {})) {
    for (const { dependencies } of Object.values(variant.versions)) {
      for (const key of Object.keys(dependencies ?? {})) deps.add(dependencyId(key));
    }
  }
  return [...deps];
}
