import type { EnvId, PlatformId } from "./data/categories";

export interface ModInfo {
  name: string;
  description: string;
  tags: string[];
  avatar_url?: string;
}

export interface RawModEntry {
  info: ModInfo;
  updated_at: string;
  stargazer_count: number;
  variants: Record<string, { versions: string[] }>;
}

export interface ModIndex {
  format_version: number;
  format_uuid: string;
  packages: Record<string, RawModEntry>;
}

/** One variant of a version's manifest (`tooth.json`), as far as the site uses it. */
export interface ManifestVariant {
  label: string;
  platform?: string;
  dependencies?: Record<string, string>;
  assets?: { placements?: { dest?: string }[] }[];
}

/** A version's manifest, as far as the site uses it. */
export interface Manifest {
  info: ModInfo;
  variants: ManifestVariant[];
}

/**
 * A mod as the listing shows, searches and filters it. Built at build
 * time (see `server/catalog.ts`) and embedded in the home page.
 */
export interface CatalogEntry {
  tooth: string;
  name: string;
  /** Up to 200 characters. */
  description: string;
  /** The repository owner, where the repository lives today. */
  owner: string;
  /** The mod's own icon, when the build could load it; else the owner's avatar is shown. */
  icon?: string;
  /** Raw manifest tags. */
  tags: string[];
  categories: string[];
  platforms: PlatformId[];
  /** The language of an LSE plugin (`js`, `nodejs`). */
  lang?: string;
  /** Empty when unknown. */
  env: EnvId[];
  /** Minecraft versions any version runs on (through its LeviLamina ranges), newest first; empty when unknown. */
  gameVersions: string[];
  /** Listed mods the latest version depends on (as the index spells them). */
  dependsOn: string[];
  /** Mods whose latest version depends on this one (absent: none). */
  requiredBy?: number;
  stars: number;
  /** The default-order score (see `lib/ranking.ts`): higher first. */
  rank: number;
  /** SPDX id; absent when GitHub reports none or was not asked. */
  license?: string;
  /** Latest release date, or the index's `updated_at`. */
  updated: string;
  /** Repository creation date (needs GitHub data). */
  created?: string;
}

/** Totals shown in the home page's hero. */
export interface CatalogStats {
  projects: number;
  authors: number;
  versions: number;
}

/** What the listing can sort and filter on, given the data the build had. */
export interface CatalogFeatures {
  /** Repository creation dates are known ("Newest"). */
  created: boolean;
  /** Licenses are known (the License filter). */
  license: boolean;
}

export interface Catalog {
  entries: CatalogEntry[];
  stats: CatalogStats;
  features: CatalogFeatures;
}

/** A release of a mod's repository (see `server/github.ts`). */
export interface ReleaseInfo {
  /** The release's tag (`v1.2.0`). */
  tag: string;
  date: string;
  prerelease: boolean;
}

/** A mod another one refers to (dependencies, dependents). */
export interface RelatedMod {
  tooth: string;
  name: string;
  owner: string;
  icon?: string;
  /** The mod is in the index (it has a page here). */
  listed?: boolean;
}

/** Text a mod gives in the site's languages (`en` always; the others fall back to it). */
export type LocalizedText = { en: string } & Partial<Record<"zh-CN" | "zh-Hant", string>>;

/**
 * One picture, video or animation of a mod's gallery (the Gallery tab), from
 * `docs/showcase/showcase.json` on its default branch (see `server/showcase.ts`).
 */
export interface ShowcaseItem {
  kind: "image" | "video" | "svg";
  /** The file as this site serves it (under `/mods/showcase/`). */
  src: string;
  /** A video's still frame. */
  poster?: string;
  width: number;
  height: number;
  title: LocalizedText;
  caption?: LocalizedText;
}

// ---------------------------------------------------------------------------
// The site's JSON (`/mods/index.json`, `/mods/<tooth>/index.json`): what each
// page shows, for programs (see `server/api.ts`).
// ---------------------------------------------------------------------------

/** A mod the JSON refers to. */
export interface ModRefJson {
  tooth: string;
  name: string;
  owner: string;
  /** Its page here, when it has one. */
  url?: string;
}

/** A mod in the listing's JSON: its row, and where its page and JSON are. */
export interface CatalogEntryJson extends Omit<CatalogEntry, "rank" | "icon" | "requiredBy"> {
  url: string;
  json: string;
  /** The mod's icon, else its owner's avatar (as the row shows). */
  icon: string;
  /** How many listed mods' latest versions depend on it. */
  requiredBy: number;
}

/** `/mods/index.json`: the listing as `/mods/` shows it, unfiltered and in the default order. */
export interface CatalogJson {
  url: string;
  stats: CatalogStats;
  /** The order of `mods` (the listing's default). */
  sort: "relevance";
  mods: CatalogEntryJson[];
}

/** One variant of a version, as its manifest has it (where it puts its files aside). */
export interface VersionVariantJson extends Omit<ManifestVariant, "assets"> {
  /** The LeviLamina range it requires, when it requires LeviLamina. */
  leviLamina?: string;
  /** The `lip install` command. */
  install: string;
}

/** A version of a mod, newest first in {@link ModJson.versions}. */
export interface VersionJson {
  version: string;
  prerelease: boolean;
  /** When its GitHub release was published (needs GitHub data). */
  released?: string;
  /** Its GitHub release, else the repository's releases. */
  releaseUrl: string;
  /** Its `tooth.json` in the repository. */
  manifestUrl: string;
  /** Name, description and tags as this version's manifest has them. */
  info: ModInfo;
  variants: VersionVariantJson[];
}

/** `/mods/<tooth>/index.json`: the mod page, every version included. */
export interface ModJson {
  url: string;
  tooth: string;
  /** The page of the repository's current name, when this is an old one. */
  canonical?: string;
  name: string;
  description: string;
  owner: string;
  /** The mod's icon, else its owner's avatar. */
  icon: string;
  repository: string;
  issues?: string;
  releases: string;
  stars: number;
  /** Latest release, else the registry's update. */
  updated: string;
  /** The first GitHub release (needs GitHub data). */
  published?: string;
  /** Repository creation date (needs GitHub data). */
  created?: string;
  license?: string;
  categories: string[];
  platforms: PlatformId[];
  lang?: string;
  env: EnvId[];
  gameVersions: string[];
  tags: string[];
  /** What the page shows when its URL asks for nothing in particular. */
  latest: { variant: string; version: string; install: string };
  /** The latest version's README in each of its languages. */
  readmes: { file: string; lang: string | null; text: string }[];
  gallery: ShowcaseItem[];
  /** Variants (the default `""` first), each with its versions, newest first. */
  variants: { label: string; versions: string[] }[];
  versions: VersionJson[];
  /** Mods any version depends on, by lower-case tooth (names for the variants' dependency keys). */
  dependencies: Record<string, ModRefJson>;
  /** Listed mods whose latest version depends on this one. */
  requiredBy: ModRefJson[];
}
