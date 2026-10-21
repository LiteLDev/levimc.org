import type { EnvId, PlatformId } from "./data/categories";

export interface PackageInfo {
  name: string;
  description: string;
  tags: string[];
  avatar_url?: string;
}

export interface RawPackageEntry {
  info: PackageInfo;
  updated_at: string;
  stargazer_count: number;
  variants: Record<string, { versions: string[] }>;
}

export interface PackageIndex {
  format_version: number;
  format_uuid: string;
  packages: Record<string, RawPackageEntry>;
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
  info: PackageInfo;
  variants: ManifestVariant[];
}

/**
 * A package as the listing shows, searches and filters it. Built at build
 * time (see `server/catalog.ts`) and embedded in the home page.
 */
export interface CatalogEntry {
  tooth: string;
  name: string;
  /** Up to 200 characters. */
  description: string;
  /** The repository owner, where the repository lives today. */
  owner: string;
  /** The package's own icon, when the build could load it; else the owner's avatar is shown. */
  icon?: string;
  /** Raw lipr tags. */
  tags: string[];
  categories: string[];
  platforms: PlatformId[];
  /** The language of an LSE plugin (`js`, `nodejs`). */
  lang?: string;
  /** Empty when unknown. */
  env: EnvId[];
  /** Minecraft versions any version runs on (through its LeviLamina ranges), newest first; empty when unknown. */
  gameVersions: string[];
  /** Listed packages the latest version depends on (as the index spells them). */
  dependsOn: string[];
  /** Packages whose latest version depends on this one (absent: none). */
  requiredBy?: number;
  stars: number;
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

/** A release of a package's repository (see `server/github.ts`). */
export interface ReleaseInfo {
  /** The release's tag (`v1.2.0`). */
  tag: string;
  date: string;
  prerelease: boolean;
}

/** A package another one refers to (dependencies, dependents). */
export interface RelatedPackage {
  tooth: string;
  name: string;
  owner: string;
  icon?: string;
  /** The package is in the index (it has a page here). */
  listed?: boolean;
}
