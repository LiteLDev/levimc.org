// The site's JSON, next to the pages it is the data of: `/mods/index.json`
// (the listing as `/mods/` shows it, unfiltered and in the default order) and
// `/mods/<tooth>/index.json` (the mod page, every version included — the page
// loads another version's manifest from it). Only the server bundle imports this.
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
  getSortedVariants,
  getVersionsForVariant,
  installCommand,
  isPrerelease,
  modJsonPath,
  modPath,
  ownerAvatar,
} from "../lib/mods";
import { SITE_ORIGIN } from "../page-data";
import type { CatalogJson, ModJson, ModRefJson, RelatedMod, VersionJson } from "../types";
import { listRoutes, loadPageData } from "./build-data";
import { loadBuildData } from "./catalog";

const url = (path: string) => `${SITE_ORIGIN}${encodeURI(path)}`;

const ref = ({ tooth, name, owner, listed }: RelatedMod): ModRefJson => ({ tooth, name, owner, ...(listed ? { url: url(modPath(tooth)) } : {}) });

export async function catalogJson(): Promise<CatalogJson> {
  const { catalog } = await loadBuildData();
  const { matched } = runQuery(catalog.entries, DEFAULT_STATE, null);
  return {
    url: url(BASE),
    stats: catalog.stats,
    sort: DEFAULT_STATE.sort as "relevance",
    mods: matched.map(({ rank: _rank, icon, requiredBy, ...entry }) => ({
      ...entry,
      url: url(modPath(entry.tooth)),
      json: url(modJsonPath(entry.tooth)),
      icon: icon ?? ownerAvatar(entry.owner),
      requiredBy: requiredBy ?? 0,
    })),
  };
}

/** A mod page's JSON; `null` when `tooth` has no page. */
export async function modJson(tooth: string): Promise<ModJson | null> {
  const page = await loadPageData(modPath(tooth));
  if (page.kind !== "mod") return null;
  const data = await loadBuildData();
  const { mod, entry, repository, releases, llRanges, prerendered } = page;
  const info = prerendered.info ?? mod.info;
  const manifests = data.versions.get(tooth);
  const versions: VersionJson[] = getAllVersions(mod)
    .sort((a, b) => compareVersions(b, a))
    .flatMap((version) => {
      const manifest = manifests?.get(version);
      if (!manifest) return [];
      const release = releases[version];
      return [
        {
          version,
          prerelease: release?.prerelease ?? isPrerelease(version),
          ...(release ? { released: release.date } : {}),
          releaseUrl: getReleaseUrl(repository, release),
          manifestUrl: getManifestUrl(repository, version),
          info: manifest.info,
          variants: manifest.variants.map(({ assets: _assets, ...variant }) => {
            const leviLamina = llRanges[variant.label]?.[version];
            return { ...variant, ...(leviLamina ? { leviLamina } : {}), install: installCommand(tooth, variant.label, version) };
          }),
        },
      ];
    });
  const published = Object.values(releases).reduce<string | undefined>((min, r) => (!min || r.date < min ? r.date : min), undefined);
  return {
    url: url(modPath(tooth)),
    tooth,
    ...(page.canonicalTooth ? { canonical: url(modPath(page.canonicalTooth)) } : {}),
    name: info.name || entry.name,
    description: info.description,
    owner: entry.owner,
    icon: entry.icon ?? ownerAvatar(entry.owner),
    repository,
    ...(page.hasIssues ? { issues: `${repository}/issues` } : {}),
    releases: `${repository}/releases`,
    stars: entry.stars,
    updated: entry.updated,
    ...(published ? { published } : {}),
    ...(entry.created ? { created: entry.created } : {}),
    ...(entry.license ? { license: entry.license } : {}),
    categories: entry.categories,
    platforms: entry.platforms,
    ...(entry.lang ? { lang: entry.lang } : {}),
    env: entry.env,
    gameVersions: entry.gameVersions,
    tags: mod.info.tags ?? [],
    latest: {
      variant: prerendered.variant,
      version: prerendered.version,
      install: installCommand(tooth, prerendered.variant, prerendered.version),
    },
    readmes: prerendered.readmes,
    gallery: page.showcase,
    variants: getSortedVariants(mod).map((label) => ({ label, versions: getVersionsForVariant(mod, label).slice().reverse() })),
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
 * Every package of the registry is in them, listed on the site or not.
 */
export async function liprFiles(): Promise<Map<string, string>> {
  const { index, launcher, origins } = await loadBuildData();
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

/** Every JSON file, by its path under `/mods/`. */
export async function jsonFiles(): Promise<Map<string, string>> {
  const files = new Map<string, string>([[CATALOG_JSON.slice(BASE.length), JSON.stringify(await catalogJson())]]);
  for (const route of await listRoutes()) {
    if (route === BASE) continue;
    const tooth = route.slice(BASE.length, -1);
    const json = await modJson(tooth);
    if (json) files.set(modJsonPath(tooth).slice(BASE.length), JSON.stringify(json));
  }
  for (const [path, body] of await liprFiles()) files.set(path, body);
  return files;
}
