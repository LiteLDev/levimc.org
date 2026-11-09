// The site's JSON as it was before api/v4 (keys from `tooth.json`: `tooth`,
// `icon`, `env`, `dependsOn`, `variants: [{label, dependencies}]`), still
// served at `/mods/index.json` and `/mods/<tooth>/index.json` for the
// launchers that read it there (LeviLauncher 1.0.6 to 1.1.0-beta.3). It is
// made from the api/v4 JSON and lipr's `tooth.json` data, so it has only the
// versions a `tooth.json` describes: lip before v0.40 cannot read the others.
// Frozen: new keys go to api/v4 only.
import type { CatalogEntryJson, CatalogJson, ModJson, ModRefJson } from "../types.ts";

/** A package of lipr's `levilauncher.json`: label → version → its `tooth.json` dependencies. */
export interface LegacyPackage {
  variants: Record<string, { versions: Record<string, { dependencies?: Record<string, string> }> }>;
}

export interface LegacyRefJson {
  tooth: string;
  name: string;
  owner: string;
  url?: string;
}

export interface LegacyCatalogEntryJson {
  tooth: string;
  name: string;
  description: string;
  owner: string;
  tags: string[];
  categories: string[];
  platforms: string[];
  env: string[];
  gameVersions: string[];
  dependsOn: string[];
  stars: number;
  license?: string;
  updated: string;
  created?: string;
  url: string;
  json: string;
  icon: string;
  requiredBy: number;
}

export interface LegacyCatalogJson {
  url: string;
  stats: CatalogJson["stats"];
  sort: "relevance";
  mods: LegacyCatalogEntryJson[];
}

export interface LegacyVariantJson {
  label: string;
  platform?: string;
  dependencies: Record<string, string>;
  leviLamina?: string;
  install: string;
}

export interface LegacyVersionJson {
  version: string;
  prerelease: boolean;
  released?: string;
  releaseUrl: string;
  manifestUrl: string;
  info: { name: string; description: string; tags: string[]; avatar_url?: string };
  variants: LegacyVariantJson[];
}

export interface LegacyModJson {
  url: string;
  tooth: string;
  canonical?: string;
  name: string;
  description: string;
  owner: string;
  icon: string;
  repository: string;
  issues?: string;
  releases: string;
  stars: number;
  updated: string;
  published?: string;
  created?: string;
  license?: string;
  categories: string[];
  platforms: string[];
  env: string[];
  gameVersions: string[];
  tags: string[];
  latest: ModJson["latest"];
  readmes: ModJson["readmes"];
  gallery: ModJson["gallery"];
  variants: { label: string; versions: string[] }[];
  versions: LegacyVersionJson[];
  dependencies: Record<string, LegacyRefJson>;
  requiredBy: LegacyRefJson[];
}

const LEVILAMINA = "github.com/liteldev/levilamina";

const installCommand = (tooth: string, label: string, version: string) =>
  label === "" ? `lip install ${tooth}@${version}` : `lip install ${tooth}#${label}@${version}`;

/** Labels as the old JSON ordered them: the default `""` first, then by name. */
const byLabel = (a: string, b: string) => (a === b ? 0 : a === "" ? -1 : b === "" ? 1 : a < b ? -1 : 1);

const ref = ({ id, name, owner, url }: ModRefJson): LegacyRefJson => ({ tooth: id, name, owner, ...(url ? { url } : {}) });

/**
 * `env` as it was worked out before version 4: the sides of the entries, and
 * the client too when the latest `tooth.json` has a label starting with
 * `client` or depends on a `#client` variant (lip v0.40 puts a `client`
 * label that depends on LeviLamina's server variant on the server, but older
 * launchers offer it on the client).
 */
function legacyEnv(side: readonly string[], latest: LegacyVersionJson | undefined): string[] {
  const env = new Set(side);
  for (const v of latest?.variants ?? []) {
    if (v.label.toLowerCase().startsWith("client") || Object.keys(v.dependencies).some((k) => k.toLowerCase().endsWith("#client"))) {
      env.add("client");
    }
  }
  return ["server", "client"].filter((e) => env.has(e));
}

/**
 * A listing entry in the old shape. `json` is where the old mod document is
 * (`legacyJsonUrl`) and `env` is that document's; the old `platforms` and
 * `categories` are no longer worked out and stay empty.
 */
export function legacyCatalogEntry(e: CatalogEntryJson, legacyJsonUrl: string, env: string[]): LegacyCatalogEntryJson {
  return {
    tooth: e.id,
    name: e.name,
    description: e.description,
    owner: e.owner,
    tags: e.tags,
    categories: [],
    platforms: [],
    env,
    gameVersions: e.gameVersions,
    dependsOn: Object.keys(e.deps),
    stars: e.stars,
    ...(e.license ? { license: e.license } : {}),
    updated: e.updated,
    ...(e.created ? { created: e.created } : {}),
    url: e.url,
    json: legacyJsonUrl,
    icon: e.logo,
    requiredBy: e.requiredBy,
  };
}

/**
 * A mod document in the old shape, from its api/v4 document and its
 * `tooth.json` data (`undefined`: the mod has none, so no version is listed).
 */
export function legacyModJson(mod: ModJson, pkg: LegacyPackage | undefined): LegacyModJson {
  const labels = Object.keys(pkg?.variants ?? {}).sort(byLabel);
  const versions: LegacyVersionJson[] = mod.versions.flatMap((v) => {
    const variants: LegacyVariantJson[] = labels.flatMap((label) => {
      const found = pkg!.variants[label]!.versions[v.version];
      if (!found) return [];
      const dependencies = found.dependencies ?? {};
      const ll = Object.entries(dependencies).find(([key]) => key.split("#")[0]!.toLowerCase() === LEVILAMINA)?.[1];
      const platform = v.variants[label]?.[0]?.platform;
      return [
        {
          label,
          ...(platform ? { platform } : {}),
          dependencies,
          ...(ll ? { leviLamina: ll } : {}),
          install: installCommand(mod.id, label, v.version),
        },
      ];
    });
    if (!variants.length) return [];
    const { logo, ...info } = v.info;
    return [
      {
        version: v.version,
        prerelease: v.prerelease,
        ...(v.released ? { released: v.released } : {}),
        releaseUrl: v.releaseUrl,
        manifestUrl: v.manifestUrl,
        info: { ...info, ...(logo ? { avatar_url: logo } : {}) },
        variants,
      },
    ];
  });
  return {
    url: mod.url,
    tooth: mod.id,
    ...(mod.canonical ? { canonical: mod.canonical } : {}),
    name: mod.name,
    description: mod.description,
    owner: mod.owner,
    icon: mod.logo,
    repository: mod.repository,
    ...(mod.issues ? { issues: mod.issues } : {}),
    releases: mod.releases,
    stars: mod.stars,
    updated: mod.updated,
    ...(mod.published ? { published: mod.published } : {}),
    ...(mod.created ? { created: mod.created } : {}),
    ...(mod.license ? { license: mod.license } : {}),
    categories: [],
    platforms: [],
    env: legacyEnv(mod.side, versions[0]),
    gameVersions: mod.gameVersions,
    tags: mod.tags,
    latest: mod.latest,
    readmes: mod.readmes,
    gallery: mod.gallery,
    variants: labels
      .map((label) => ({ label, versions: versions.filter((v) => v.variants.some((x) => x.label === label)).map((v) => v.version) }))
      .filter((v) => v.versions.length),
    versions,
    dependencies: Object.fromEntries(Object.entries(mod.dependencies).map(([key, r]) => [key, ref(r)])),
    requiredBy: mod.requiredBy.map(ref),
  };
}
