// The site's JSON, next to the pages it is the data of: `/mods/index.json`
// (the listing as `/mods/` shows it, unfiltered and in the default order) and
// `/mods/<tooth>/index.json` (the mod page, every version included — the page
// loads another version's manifest from it). Only the server bundle imports this.
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

/** Every JSON file, by its path under `/mods/`. */
export async function jsonFiles(): Promise<Map<string, string>> {
  const files = new Map<string, string>([[CATALOG_JSON.slice(BASE.length), JSON.stringify(await catalogJson())]]);
  for (const route of await listRoutes()) {
    if (route === BASE) continue;
    const tooth = route.slice(BASE.length, -1);
    const json = await modJson(tooth);
    if (json) files.set(modJsonPath(tooth).slice(BASE.length), JSON.stringify(json));
  }
  return files;
}
