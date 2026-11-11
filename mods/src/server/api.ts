// The site's JSON, version 4 (lip v0.40's keys): `/api/v4/mods/index.json`
// (the listing as `/mods/` shows it, unfiltered and in the default order) and
// `/api/v4/mods/<id>/index.json` (the mod page, every version included — the
// page loads another version's manifest from it). Launchers read both.
// Next to the pages, `/mods/index.json` and `/mods/<id>/index.json` keep the
// JSON from before version 4 for older launchers (see `legacy-json.ts`).
// Only the server bundle imports this.
// Also lipr's indexes under `/mods/lipr/`, which LiteLDev/lipr serves at
// lipr.levimc.org for lip and older LeviLaunchers (see `liprFiles`).
import { BASE } from "../base-path";
import { DEFAULT_STATE, runQuery } from "../lib/catalog-query";
import { compareVersions } from "../lib/game-versions";
import {
  CATALOG_JSON,
  getAllVersions,
  getManifestUrl,
  getReleaseUrl,
  installCommand,
  isPrerelease,
  LEGACY_CATALOG_JSON,
  legacyModJsonPath,
  modJsonPath,
  modPath,
  ownerAvatar,
} from "../lib/mods";
import { SITE_ORIGIN } from "../page-data";
import type { CatalogEntry, CatalogEntryJson, CatalogJson, ModJson, ModRefJson, RelatedMod, VersionJson } from "../types";
import { listRoutes, loadPageData, variantsJson } from "./build-data";
import { loadBuildData } from "./catalog";
import { legacyCatalogEntry, legacyModJson, type LegacyCatalogJson, type LegacyModJson } from "./legacy-json";

const url = (path: string) => `${SITE_ORIGIN}${encodeURI(path)}`;

const ref = ({ id, name, owner, listed }: RelatedMod): ModRefJson => ({ id, name, owner, ...(listed ? { url: url(modPath(id)) } : {}) });

const entryJson = (e: CatalogEntry): CatalogEntryJson => ({
  id: e.id,
  name: e.name,
  description: e.description,
  owner: e.owner,
  logo: e.logo ?? ownerAvatar(e.owner),
  tags: e.tags,
  side: e.side,
  platform: e.platform,
  gameVersions: e.gameVersions,
  deps: e.deps,
  stars: e.stars,
  ...(e.license ? { license: e.license } : {}),
  updated: e.updated,
  ...(e.created ? { created: e.created } : {}),
  url: url(modPath(e.id)),
  json: url(modJsonPath(e.id)),
  requiredBy: e.requiredBy ?? 0,
});

export async function catalogJson(): Promise<CatalogJson> {
  const { catalog } = await loadBuildData();
  const { matched } = runQuery(catalog.entries, DEFAULT_STATE, null);
  return {
    url: url(BASE),
    stats: catalog.stats,
    sort: DEFAULT_STATE.sort as "relevance",
    mods: matched.map(entryJson),
  };
}

/**
 * `/mods/index.json`: the listing before version 4. It also has the mods that
 * are unlisted only because they do not depend on LeviLamina (after the
 * listed ones, most stars first), as the listing before version 4 had them.
 */
export async function legacyCatalogJson(): Promise<LegacyCatalogJson> {
  const { catalog, byId, listings } = await loadBuildData();
  const listed = (await catalogJson()).mods;
  const extra = [...byId.values()]
    .filter((e) => {
      const l = listings.get(e.id);
      return l?.status === "unlisted" && l.reason === "no-levilamina";
    })
    .sort((a, b) => b.stars - a.stars || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map(entryJson);
  return {
    url: url(BASE),
    stats: catalog.stats,
    sort: "relevance",
    mods: await Promise.all(
      [...listed, ...extra].map(async (e) =>
        legacyCatalogEntry(e, url(legacyModJsonPath(e.id)), (await legacyModJsonOf(e.id))?.env ?? e.side),
      ),
    ),
  };
}

/** `/mods/<id>/index.json`: a mod page's JSON before version 4; `null` when `id` has no page. */
export async function legacyModJsonOf(id: string): Promise<LegacyModJson | null> {
  const json = await modJson(id);
  if (!json) return null;
  const { lipr } = await loadBuildData();
  const packages = lipr.launcher.packages;
  const pkg = packages[id] ?? Object.entries(packages).find(([tooth]) => tooth.toLowerCase() === id.toLowerCase())?.[1];
  return legacyModJson(json, pkg);
}

/** A mod page's JSON; `null` when `id` has no page. */
export async function modJson(id: string): Promise<ModJson | null> {
  const page = await loadPageData(modPath(id));
  if (page.kind !== "mod") return null;
  const data = await loadBuildData();
  const { mod, entry, repository, releases, prerendered } = page;
  const info = prerendered.info ?? mod.info;
  const docs = data.docs.get(id);
  const origins = data.origins.get(id);
  const versions: VersionJson[] = getAllVersions(mod)
    .sort((a, b) => compareVersions(b, a))
    .flatMap((version) => {
      const doc = docs?.get(version);
      if (!doc) return [];
      const release = releases[version];
      const file = origins?.get(version)?.file;
      return [
        {
          version,
          prerelease: release?.prerelease ?? isPrerelease(version),
          ...(release ? { released: release.date } : {}),
          releaseUrl: getReleaseUrl(repository, release),
          manifestUrl: getManifestUrl(repository, version, file),
          ...(file === "lip.toml" ? { format: 4 as const } : {}),
          info: doc.info,
          variants: variantsJson(doc),
        },
      ];
    });
  const published = Object.values(releases).reduce<string | undefined>((min, r) => (!min || r.date < min ? r.date : min), undefined);
  return {
    url: url(modPath(id)),
    id,
    ...(page.canonical ? { canonical: url(modPath(page.canonical)) } : {}),
    name: info.name || entry.name,
    description: info.description,
    owner: entry.owner,
    logo: entry.logo ?? ownerAvatar(entry.owner),
    repository,
    ...(page.hasIssues ? { issues: `${repository}/issues` } : {}),
    releases: `${repository}/releases`,
    stars: entry.stars,
    updated: entry.updated,
    ...(published ? { published } : {}),
    ...(entry.created ? { created: entry.created } : {}),
    ...(entry.license ? { license: entry.license } : {}),
    side: entry.side,
    platform: entry.platform,
    gameVersions: entry.gameVersions,
    tags: mod.info.tags ?? [],
    latest: {
      variant: prerendered.variant,
      version: prerendered.version,
      install: installCommand(id, prerendered.variant, prerendered.version),
    },
    readmes: prerendered.readmes,
    gallery: page.showcase,
    versions,
    dependencies: Object.fromEntries(Object.entries(page.related).map(([key, related]) => [key, ref(related)])),
    requiredBy: page.dependents.map(ref),
  };
}

const sortedKeys = <T>(record: Record<string, T>) => Object.fromEntries(Object.keys(record).sort().map((key) => [key, record[key]!]));

/**
 * lipr's two indexes, as its `generate-indexes.py` wrote them: `index.json`
 * (lip's: each variant's versions) and `levilauncher.json` (LeviLauncher's:
 * each version's dependencies too), plus `sources.json`, where each version's
 * `tooth.json` is (lipr serves it, migrated, at `packages/<tooth>@<version>/`).
 * Every package of the registry with a `tooth.json` is in them, listed on the
 * site or not, read as lipr always read it (a version with a `lip.toml` too
 * has its `tooth.json` here; one with a `lip.toml` alone is not here: lip
 * before v0.40 cannot read it).
 */
export async function liprFiles(): Promise<Map<string, string>> {
  const { index, launcher, origins } = (await loadBuildData()).lipr;
  const root = { format_version: index.format_version, format_uuid: index.format_uuid };
  const tooths = Object.keys(index.packages).sort();
  const meta = (tooth: string) => {
    const { stargazer_count, updated_at, info } = index.packages[tooth]!;
    return { stargazer_count, updated_at, info: { name: info.name, description: info.description, tags: info.tags, avatar_url: info.avatar_url ?? "" } };
  };
  const lip = Object.fromEntries(tooths.map((tooth) => [tooth, { ...meta(tooth), variants: index.packages[tooth]!.variants }]));
  const levilauncher = Object.fromEntries(
    tooths.map((tooth) => {
      const variants = launcher.packages[tooth]?.variants ?? {};
      return [
        tooth,
        {
          ...meta(tooth),
          variants: Object.fromEntries(
            Object.entries(variants).map(([label, { versions }]) => [
              label,
              { versions: Object.fromEntries(Object.entries(versions).map(([version, { dependencies }]) => [version, { dependencies: sortedKeys(dependencies ?? {}) }])) },
            ]),
          ),
        },
      ];
    }),
  );
  const sources = Object.fromEntries(tooths.map((tooth) => [tooth, Object.fromEntries(origins.get(tooth) ?? [])]));
  return new Map([
    ["lipr/index.json", JSON.stringify({ ...root, packages: lip })],
    ["lipr/levilauncher.json", JSON.stringify({ ...root, packages: levilauncher })],
    ["lipr/sources.json", JSON.stringify({ packages: sources })],
  ]);
}

/** Every JSON file, by its path on the site without the leading `/` (`api/v4/mods/…`, `mods/…`). */
export async function jsonFiles(): Promise<Map<string, string>> {
  const files = new Map<string, string>([
    [CATALOG_JSON.slice(1), JSON.stringify(await catalogJson())],
    [LEGACY_CATALOG_JSON.slice(1), JSON.stringify(await legacyCatalogJson())],
  ]);
  for (const route of await listRoutes()) {
    if (route === BASE) continue;
    const id = route.slice(BASE.length, -1);
    const json = await modJson(id);
    if (!json) continue;
    files.set(modJsonPath(id).slice(1), JSON.stringify(json));
    files.set(legacyModJsonPath(id).slice(1), JSON.stringify(await legacyModJsonOf(id)));
  }
  for (const [path, body] of await liprFiles()) files.set(`${BASE.slice(1)}${path}`, body);
  return files;
}
