import { BASE } from "../base-path.ts";
import type { Manifest, ModIndex, RawModEntry } from "../types";

const MOD_INDEX_URL = "https://lipr.levimc.org/index.json";
const MOD_REGISTRY_URL = "https://lipr.levimc.org";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

/**
 * `fetch` that retries network errors and 5xx/429 answers a few times. A
 * single flaky request during the hourly rebuild would otherwise ship a page
 * without its README until the next one.
 */
export async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url);
      if ((res.status < 500 && res.status !== 429) || attempt >= attempts) {
        return res;
      }
    } catch (error) {
      if (attempt >= attempts) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
}

/** The lipr index. The build fetches it once and bakes it into the pages. */
export async function fetchModIndex(): Promise<ModIndex> {
  const res = await fetchWithRetry(MOD_INDEX_URL);
  if (!res.ok) throw new Error("Failed to fetch mod index");
  return res.json();
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

export function getModManifestUrl(tooth: string, version: string): string {
  return `${MOD_REGISTRY_URL}/packages/${tooth}@${version}/tooth.json`;
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

export function getReadmeUrl(repository: string, version: string): string {
  return `${getRepoBaseUrls(repository, version).raw}README.md`;
}

/**
 * A version's release page on GitHub when the build saw that release (its
 * exact tag), else the repository's releases.
 */
export function getReleaseUrl(repository: string, release: { tag: string } | undefined): string {
  return release ? `${repository}/releases/tag/${encodeURIComponent(release.tag)}` : `${repository}/releases`;
}

// ---------------------------------------------------------------------------
// Mod details  (fetched at build time for the latest version, and in the
// browser for any other; both hosts allow cross-origin reads)
// ---------------------------------------------------------------------------

/** A version's manifest (`tooth.json`), or `null` when lipr has none for it. */
export async function fetchManifest(tooth: string, version: string): Promise<Manifest | null> {
  try {
    const res = await fetchWithRetry(getModManifestUrl(tooth, version));
    if (!res.ok) return null;
    const manifest = (await res.json()) as Partial<Manifest> | null;
    if (!manifest?.info) return null;
    return {
      info: { ...manifest.info, tags: Array.isArray(manifest.info.tags) ? manifest.info.tags : [] },
      variants: Array.isArray(manifest.variants)
        ? manifest.variants.map(({ label, platform, dependencies, assets }) => ({
            label: label ?? "",
            ...(platform ? { platform } : {}),
            ...(dependencies ? { dependencies } : {}),
            ...(assets ? { assets: assets.map((a) => ({ placements: (a.placements ?? []).map((p) => ({ dest: p.dest })) })) } : {}),
          }))
        : [],
    };
  } catch {
    return null;
  }
}

export async function fetchReadme(
  repository: string,
  version: string,
): Promise<string | null> {
  try {
    const res = await fetchWithRetry(getReadmeUrl(repository, version));
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
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

/** The mod page's tabs; Description is the default and has no `tab=`. */
export const MOD_TABS = ["description", "versions", "dependencies"] as const;
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
