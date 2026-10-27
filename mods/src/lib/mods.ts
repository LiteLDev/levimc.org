import { BASE } from "../base-path.ts";
import type { Manifest, ModJson, RawModEntry } from "../types";
import { labelReadmes, type Readme } from "./readme-language.ts";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

/**
 * `fetch` that retries network errors and 5xx/429 answers a few times. A
 * single flaky request during the hourly rebuild would otherwise ship a page
 * without its README until the next one.
 */
export async function fetchWithRetry(url: string, init?: RequestInit, attempts = 3): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, init);
      if ((res.status < 500 && res.status !== 429) || attempt >= attempts) {
        return res;
      }
    } catch (error) {
      if (attempt >= attempts) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/** The repository owner in a tooth (`github.com/<owner>/<repo>`). */
export function ownerOf(tooth: string): string {
  return tooth.split("/")[1] ?? tooth;
}

/** A GitHub user's or organisation's avatar (answers 200 directly, no redirect). */
export function ownerAvatar(owner: string, size = 144): string {
  return `https://avatars.githubusercontent.com/${encodeURIComponent(owner)}?s=${size}`;
}

/** The page of a mod: `/mods/github.com/LiteLDev/LeviLamina/`. */
export function modPath(tooth: string): string {
  return `${BASE}${tooth}/`;
}

const MOD_PAGE = new RegExp(`^${BASE}(.+)/$`);

/** The tooth a mod page path names, or `null` for any other path. */
export function toothFromPath(pathname: string): string | null {
  const match = MOD_PAGE.exec(pathname);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/** The listing's data: `/mods/index.json` (see `server/api.ts`). */
export const CATALOG_JSON = `${BASE}index.json`;

/** A mod's data, every version's included: `/mods/github.com/LiteLDev/LeviLamina/index.json`. */
export function modJsonPath(tooth: string): string {
  return `${modPath(tooth)}index.json`;
}

export interface RepoBaseUrls {
  /** Raw file contents, e.g. `https://raw.githubusercontent.com/o/r/v1.0.0/`. */
  raw: string;
  /** Browsable files, e.g. `https://github.com/o/r/blob/v1.0.0/`. */
  blob: string;
}

/**
 * The repository a tooth was published from: `https://<tooth>`, or where that
 * repository lives now when the build could find out (see `server/github.ts`).
 */
export function getRepositoryUrl(tooth: string, current?: string): string {
  return current ?? `https://${tooth}`;
}

const GITHUB_REPO = /^https:\/\/github\.com\/([^/]+\/[^/]+)$/;

/** Top-level bases for the files of `repository` at a version's tag. */
export function getRepoBaseUrls(repository: string, version: string): RepoBaseUrls {
  const tag = `v${version}`;
  const github = GITHUB_REPO.exec(repository)?.[1];
  if (github) {
    return {
      raw: `https://raw.githubusercontent.com/${github}/${tag}/`,
      blob: `https://github.com/${github}/blob/${tag}/`,
    };
  }
  return {
    raw: `${repository}/raw/refs/tags/${tag}/`,
    blob: `${repository}/blob/refs/tags/${tag}/`,
  };
}

export function getReadmeUrl(repository: string, version: string, file = "README.md"): string {
  return `${getRepoBaseUrls(repository, version).raw}${file}`;
}

/** A version's `tooth.json`, as its repository has it. */
export function getManifestUrl(repository: string, version: string): string {
  return `${getRepoBaseUrls(repository, version).blob}tooth.json`;
}

/**
 * A version's release page on GitHub when the build saw that release (its
 * exact tag), else the repository's releases.
 */
export function getReleaseUrl(repository: string, release: { tag: string } | undefined): string {
  return release ? `${repository}/releases/tag/${encodeURIComponent(release.tag)}` : `${repository}/releases`;
}

// ---------------------------------------------------------------------------
// Mod details  (the latest version's are in the page; another version's
// manifest comes from the mod's index.json, its README from GitHub, which
// allows cross-origin reads)
// ---------------------------------------------------------------------------

const modJsons = new Map<string, Promise<ModJson | null>>();

/** A version's manifest, from the mod's index.json (read once per mod), or `null` when it cannot be loaded. */
export async function fetchManifest(tooth: string, version: string): Promise<Manifest | null> {
  let json = modJsons.get(tooth);
  if (!json) {
    json = fetchWithRetry(modJsonPath(tooth))
      .then((res) => (res.ok ? (res.json() as Promise<ModJson>) : null))
      .catch(() => null)
      .then((loaded) => {
        // a failed load is tried again for the next version
        if (!loaded) modJsons.delete(tooth);
        return loaded;
      });
    modJsons.set(tooth, json);
  }
  const found = (await json)?.versions.find((v) => v.version === version);
  return found ? { info: found.info, variants: found.variants } : null;
}

async function fetchReadme(repository: string, version: string, file: string): Promise<string | null> {
  try {
    const res = await fetchWithRetry(getReadmeUrl(repository, version, file));
    // raw files are never HTML: a host answering every path with a page (a parked domain) has no README
    if (!res.ok || res.headers.get("content-type")?.startsWith("text/html")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * A version's README in each of its languages (`files`: the README files the
 * repository has, see `readmeFiles`); empty when it has none.
 */
export async function fetchReadmes(repository: string, version: string, files: readonly string[]): Promise<Readme[]> {
  const texts = await Promise.all(files.map((file) => fetchReadme(repository, version, file)));
  return labelReadmes(files.flatMap((file, i) => (texts[i] === null ? [] : [{ file, text: texts[i]! }])));
}

/** Variants in display order, the default (`""`) variant first. */
export function getSortedVariants(mod: RawModEntry): string[] {
  return Object.keys(mod.variants).sort((a, b) => {
    if (a === "") return -1;
    if (b === "") return 1;
    return a.localeCompare(b);
  });
}

export function getVersionsForVariant(
  mod: RawModEntry,
  variant: string,
): string[] {
  const variantMeta = mod.variants[variant];
  if (!variantMeta) return [];
  return Array.from(new Set(variantMeta.versions));
}

/** Every version of a mod, over all variants, in index order. */
export function getAllVersions(mod: RawModEntry): string[] {
  return Array.from(new Set(Object.values(mod.variants).flatMap((v) => v.versions)));
}

/** A semver pre-release (`1.0.0-rc.1`, `0.3.0-mc26.51`). */
export function isPrerelease(version: string): boolean {
  return /^\d+\.\d+\.\d+-/.test(version);
}

export interface ModSelection {
  variant: string;
  version: string;
}

/** What a mod page shows when the URL asks for nothing in particular. */
export function getDefaultSelection(
  mod: RawModEntry,
): ModSelection | null {
  for (const variant of getSortedVariants(mod)) {
    const version = getVersionsForVariant(mod, variant).at(-1);
    if (version) return { variant, version };
  }
  return null;
}

/**
 * Honors the requested variant and version where the mod has them, and
 * falls back to the default variant and its latest version otherwise.
 */
export function resolveSelection(
  mod: RawModEntry,
  requestedVariant: string | null,
  requestedVersion: string | null,
): ModSelection | null {
  const fallback = getDefaultSelection(mod);
  if (!fallback) return null;

  const variant =
    requestedVariant !== null &&
    getVersionsForVariant(mod, requestedVariant).length > 0
      ? requestedVariant
      : fallback.variant;
  const versions = getVersionsForVariant(mod, variant);
  const version =
    requestedVersion !== null && versions.includes(requestedVersion)
      ? requestedVersion
      : versions.at(-1)!;
  return { variant, version };
}

/** The mod page's tabs; Description is the default and has no `tab=` (Gallery only when the mod has one). */
export const MOD_TABS = ["description", "gallery", "versions", "dependencies"] as const;
export type ModTab = (typeof MOD_TABS)[number];

export function parseTab(value: string | null): ModTab {
  return (MOD_TABS as readonly string[]).includes(value ?? "") ? (value as ModTab) : "description";
}

/**
 * The URL of a selection (and tab). The default selection on the Description
 * tab is the bare page, so it has one URL.
 */
export function buildModUrl(
  tooth: string,
  mod: RawModEntry,
  selection: ModSelection,
  tab: ModTab = "description",
): string {
  const fallback = getDefaultSelection(mod);
  const base = modPath(tooth);
  const query = new URLSearchParams();
  if (
    !fallback ||
    fallback.variant !== selection.variant ||
    fallback.version !== selection.version
  ) {
    query.set("variant", selection.variant);
    query.set("version", selection.version);
  }
  if (tab !== "description") query.set("tab", tab);
  const qs = query.toString();
  return qs ? `${base}?${qs}` : base;
}

/** The `lip install` command of a selection. */
export function installCommand(tooth: string, variant: string, version: string): string {
  return variant === "" ? `lip install ${tooth}@${version}` : `lip install ${tooth}#${variant}@${version}`;
}

/**
 * A command in parts that never break inside: `lip install `, the tooth's
 * path segments (`github.com/`, `LiteLDev/`, `LeviLamina`), then `#variant`
 * and `@version` — so a phone wraps it between them, never at the hyphen of
 * `1.0.0-rc.1`. Only a part wider than the whole box breaks (styles.css).
 */
export function commandParts(command: string): string[] {
  return command.split(/(?<=\/)|(?=[@#])|(?<=^lip install )/);
}
