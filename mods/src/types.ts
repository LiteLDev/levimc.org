/** Where an entry of a package file runs: the dedicated server or the client. */
export type Side = "server" | "client";

/** A `tooth.json`'s info (lip before v0.40, and lipr). */
export interface ModInfo {
  name: string;
  description: string;
  tags: string[];
  avatar_url?: string;
}

/** A `lip.toml`'s info, as far as the site uses it (and a `tooth.json`'s, read as one). */
export interface LipInfo {
  name: string;
  description: string;
  tags: string[];
  /** An `https://` URL. */
  logo?: string;
}

/** An entry of a variant of a package file (`lip.toml`, or a `tooth.json` read as one, see `lib/manifest.ts`). */
export interface LipEntry {
  side: Side;
  /** A .NET runtime identifier (`win-x64`). */
  platform: string;
  /** Dependency key (`<id>[#<variant>]`) → version range. */
  deps: Record<string, string>;
  /** Where its assets put files (`lib/listing.ts` tells mods by them); not in the site's JSON. */
  dests: string[];
}

/** A version's package file, as far as the site uses it. */
export interface LipDoc {
  id: string;
  version: string;
  info: LipInfo;
  /** Variant name (`""`: the default) → its entries. */
  variants: Record<string, LipEntry[]>;
}

/** A package of the site's registry: every package with a version the site can read. */
export interface RawModEntry {
  info: LipInfo;
  updated_at: string;
  stargazer_count: number;
  variants: Record<string, { versions: string[] }>;
  /** The variant a page shows when its URL asks for none (the server's, see `lib/manifest.ts` preferredVariant). */
  defaultVariant?: string;
}

export interface ModIndex {
  packages: Record<string, RawModEntry>;
}

/** A package of lipr's index (tooth.json-sourced only, see `server/api.ts` liprFiles). */
export interface LiprEntry {
  info: ModInfo;
  updated_at: string;
  stargazer_count: number;
  variants: Record<string, { versions: string[] }>;
}

export interface LiprIndex {
  format_version: number;
  format_uuid: string;
  packages: Record<string, LiprEntry>;
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
  id: string;
  name: string;
  /** Up to 200 characters. */
  description: string;
  /** The repository owner, where the repository lives today (the author). */
  owner: string;
  /** The mod's own logo, when the build could load it. */
  logo?: string;
  /**
   * The logo scaled down at build time (`lib/mods.ts` iconPath): shown instead of `logo` (which stays the
   * original); for a mod without a logo that loads, the one the build drew (`server/logo-art.ts`).
   */
  logoId?: string;
  /** `logoId` is a drawn logo, not the mod's own. */
  logoGenerated?: true;
  /** Raw manifest tags. */
  tags: string[];
  /** Sides any entry of the latest version runs on (server first); empty when it has none. */
  side: Side[];
  /** Platforms (RIDs) any entry of the latest version runs on, sorted. */
  platform: string[];
  /** Minecraft versions any version runs on (through its LeviLamina ranges), newest first; empty when unknown. */
  gameVersions: string[];
  /** What the latest version depends on: bare id (as the index spells it) → range (several ranges joined by ` || `). */
  deps: Record<string, string>;
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

/** What one version of a variant runs on, and the LeviLamina it needs (the versions table, the install dialog). */
export interface VersionTarget {
  /** Server first. */
  side: Side[];
  /** In the order pages list them (`lib/manifest.ts` comparePlatforms). */
  platform: string[];
  /** The LeviLamina range its entries depend on (several joined by ` || `). */
  leviLamina?: string;
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
  id: string;
  name: string;
  owner: string;
  logo?: string;
  logoId?: string;
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
// The site's JSON (`/api/v4/mods/index.json`, `/api/v4/mods/<id>/index.json`):
// what each page shows, for programs (see `server/api.ts`). Launchers read it
// too (LeviLauncher): its keys are a contract. The JSON from before version 4
// is in `server/legacy-json.ts`.
// ---------------------------------------------------------------------------

/** A mod the JSON refers to. */
export interface ModRefJson {
  id: string;
  name: string;
  owner: string;
  /** Its page here, when it has one. */
  url?: string;
}

/** A mod in the listing's JSON: its row, and where its page and JSON are. */
export interface CatalogEntryJson {
  id: string;
  name: string;
  description: string;
  owner: string;
  /** The mod's logo, else the one the build drew for it (as the row shows; 288 px WebP). */
  logo: string;
  tags: string[];
  side: Side[];
  platform: string[];
  gameVersions: string[];
  deps: Record<string, string>;
  stars: number;
  license?: string;
  updated: string;
  created?: string;
  url: string;
  json: string;
  /** How many listed mods' latest versions depend on it. */
  requiredBy: number;
}

/** `/api/v4/mods/index.json`: the listing as `/mods/` shows it, unfiltered and in the default order. */
export interface CatalogJson {
  url: string;
  stats: CatalogStats;
  /** The order of `mods` (the listing's default). */
  sort: "relevance";
  mods: CatalogEntryJson[];
}

/** An entry of a variant, as the JSON has it. */
export interface EntryJson {
  side: Side;
  platform: string;
  deps: Record<string, string>;
}

/** A version of a mod, newest first in {@link ModJson.versions}. */
export interface VersionJson {
  version: string;
  prerelease: boolean;
  /** When its GitHub release was published (needs GitHub data). */
  released?: string;
  /** Its GitHub release, else the repository's releases. */
  releaseUrl: string;
  /** Its `lip.toml` (or `tooth.json`) in the repository. */
  manifestUrl: string;
  /**
   * `4` when its package file is a real `lip.toml` (lip v0.40's format 4), left
   * out when it is read from a `tooth.json`. Says what `manifestUrl` ending in
   * `/lip.toml` says (launchers read that, see `lib/manifest.ts` isNativeFormat4).
   */
  format?: 4;
  /** Name, description, tags and logo as this version's manifest has them. */
  info: LipInfo;
  /** Variant name → its entries. */
  variants: Record<string, EntryJson[]>;
}

/** `/api/v4/mods/<id>/index.json`: the mod page, every version included. */
export interface ModJson {
  url: string;
  id: string;
  /** The page of the repository's current name, when this is an old one. */
  canonical?: string;
  name: string;
  description: string;
  owner: string;
  /** The mod's logo, else the one the build drew for it (288 px WebP). */
  logo: string;
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
  side: Side[];
  platform: string[];
  gameVersions: string[];
  tags: string[];
  /** What the page shows when its URL asks for nothing in particular. */
  latest: { variant: string; version: string; install: string };
  /** The latest version's README in each of its languages. */
  readmes: { file: string; lang: string | null; text: string }[];
  gallery: ShowcaseItem[];
  versions: VersionJson[];
  /** Mods any version depends on, by lower-case id (names for the entries' dependency keys). */
  dependencies: Record<string, ModRefJson>;
  /** Listed mods whose latest version depends on this one. */
  requiredBy: ModRefJson[];
}
