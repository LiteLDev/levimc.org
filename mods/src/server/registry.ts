// The registry the catalogue is built from: every repository in repos.txt,
// each `v<semver>` tag of it a version, read from the `tooth.json` at that tag
// (migrated to the current format, see `lib/manifest.ts`) — what lipr does,
// without its copies. Manifests are taken as their repositories have them,
// with the repairs lipr's maintainers made by hand:
//
// - the tag is the version (a manifest says `v1.2.0`, or was not bumped);
// - the manifest is filed under the tooth it names when that is where the
//   repository was before a rename (so an old release keeps its old address);
//   any other tooth (`CFSP`, a template's, another repository's, the
//   repository's own in another case) is the repository's address as
//   repos.txt spells it.
//
// What was read is kept in .cache/registry.json (the workflow keeps it in the
// Actions cache): a tag whose commit is unchanged is not read again. It is
// only a cache — without it everything is read anew.
import { execFile } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { promisify } from "node:util";
import { compareVersions, type LauncherIndex } from "../lib/game-versions";
import { migrateManifest, type RegistryManifest } from "../lib/manifest";
import { fetchWithRetry } from "../lib/mods";
import { parseRepoList } from "../lib/repo-list";
import type { ModIndex, RawModEntry } from "../types";
import { mapLimit } from "./map-limit";

const REPOS_FILE = "repos.txt";
const CACHE_FILE = process.env.MODS_REGISTRY_CACHE ?? ".cache/registry.json";
const CACHE_VERSION = 2;
/** lipr's: a tag is `v` and a semantic version. */
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const GITHUB = "github.com/";

const run = promisify(execFile);

interface CachedTag {
  /** The commit (or tag object) the tag pointed to when it was read. */
  sha: string;
  /** The manifest at the tag, as it is there (`null`: none lip can read). */
  manifest: RegistryManifest | null;
  /** When the build first saw the tag (the date of a version without GitHub data). */
  seen: string;
}

interface RegistryCache {
  version: number;
  /** Lower-case `owner/repo` → tag → what was read. */
  repos: Record<string, Record<string, CachedTag>>;
  /** Lower-case `owner/repo` a manifest names → the repository GitHub serves there (lower case), `null`: none. */
  aliases: Record<string, string | null>;
}

export interface Registry {
  /** The packages, as lipr's index.json has them (stars and dates are filled in from GitHub, see `server/catalog.ts`). */
  index: ModIndex;
  /** Every version's dependencies, as lipr's levilauncher.json has them. */
  launcher: LauncherIndex;
  /** Tooth → version → its manifest (tooth and version as filed). */
  manifests: Map<string, Map<string, RegistryManifest>>;
  /** Tooth → the repository (`owner/repo`) it was read from. */
  sources: Map<string, string>;
  /** Tooth → version → the repository, tag and commit its manifest was read at. */
  origins: Map<string, Map<string, ManifestOrigin>>;
}

/** Where a version's manifest was read: lipr serves the `tooth.json` there (see `server/api.ts`). */
export interface ManifestOrigin {
  repo: string;
  tag: string;
  /** The commit (or tag object) the tag pointed to. */
  sha: string;
}

function readCache(): RegistryCache {
  try {
    const cache = JSON.parse(readFileSync(CACHE_FILE, "utf8")) as RegistryCache;
    if (cache.version === CACHE_VERSION && cache.repos && cache.aliases) return cache;
  } catch {
    // no cache yet
  }
  return { version: CACHE_VERSION, repos: {}, aliases: {} };
}

/** The repository's version tags (`v1.2.0` → its commit), `null` when it is gone; throws when GitHub cannot be reached. */
async function listTags(repo: string): Promise<Map<string, string> | null> {
  try {
    // no credential helper: a missing repository must fail, not ask for a login
    const { stdout } = await run("git", ["-c", "credential.helper=", "ls-remote", "--tags", "--refs", `https://github.com/${repo}.git`], {
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never" },
      timeout: 60_000,
    });
    const tags = new Map<string, string>();
    for (const line of stdout.split("\n")) {
      const [sha, ref] = line.split("\t");
      const tag = ref?.trim().replace(/^refs\/tags\//, "");
      if (sha && tag?.startsWith("v") && SEMVER.test(tag.slice(1))) tags.set(tag, sha);
    }
    return tags;
  } catch (error) {
    // a repository that is gone (or private) asks for credentials
    if (/not found|could not read Username|terminal prompts disabled/i.test(String((error as { stderr?: string }).stderr ?? error))) return null;
    throw error;
  }
}

/** The manifest at a tag; `null`: none lip can read; `undefined`: GitHub could not be reached (read it next time). */
async function readTag(repo: string, tag: string): Promise<RegistryManifest | null | undefined> {
  try {
    const res = await fetchWithRetry(`https://raw.githubusercontent.com/${repo}/${encodeURIComponent(tag)}/tooth.json`);
    if (res.status === 404) return null;
    if (!res.ok) return undefined;
    try {
      return migrateManifest(JSON.parse(await res.text()));
    } catch {
      return null;
    }
  } catch {
    return undefined;
  }
}

/** Reads every repository's tags, and the manifests of those not read before. */
async function readRepos(repos: string[], cache: RegistryCache): Promise<Map<string, Map<string, CachedTag>>> {
  const now = new Date().toISOString();
  let read = 0;
  let unreachable = 0;
  const out = new Map<string, Map<string, CachedTag>>();
  await mapLimit(repos, async (repo) => {
    const key = repo.toLowerCase();
    const cached = cache.repos[key] ?? {};
    let tags: Map<string, string> | null;
    try {
      tags = await listTags(repo);
    } catch (error) {
      console.warn(`::warning::registry: could not list the tags of ${repo} (${String(error).split("\n")[0]}); using what was read before`);
      out.set(repo, new Map(Object.entries(cached)));
      unreachable++;
      return;
    }
    if (!tags) {
      console.warn(`::warning::registry: ${repo} is gone (repos.txt still names it)`);
      delete cache.repos[key];
      return;
    }
    const next: Record<string, CachedTag> = {};
    await mapLimit([...tags], async ([tag, sha]) => {
      const hit = cached[tag];
      if (hit?.sha === sha) {
        next[tag] = hit;
        return;
      }
      const manifest = await readTag(repo, tag);
      read++;
      if (manifest === undefined) {
        if (hit) next[tag] = hit;
        unreachable++;
        return;
      }
      next[tag] = { sha, manifest, seen: hit?.seen ?? now };
    });
    cache.repos[key] = next;
    out.set(repo, new Map(Object.entries(next)));
  });
  console.log(`registry: ${repos.length} repositories; read ${read} manifests${unreachable ? `, ${unreachable} could not be read` : ""}`);
  return out;
}

/** The `owner/repo` of a GitHub tooth (`github.com/o/r`), else `null`. */
function githubPath(tooth: string): string | null {
  const parts = tooth.split("/");
  return tooth.startsWith(GITHUB) && parts.length === 3 && parts[1] && parts[2] ? `${parts[1]}/${parts[2]}` : null;
}

/** Where GitHub serves `owner/repo` now (it follows renames and transfers), lower case; `null`: nowhere. */
async function resolveRepo(path: string): Promise<string | null | undefined> {
  const token = process.env.GITHUB_TOKEN;
  try {
    const res = await fetchWithRetry(`https://api.github.com/repos/${path}`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "levimc.org-mods-build", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (res.status === 404) return null;
    if (!res.ok) return undefined;
    return ((await res.json()) as { full_name: string }).full_name.toLowerCase();
  } catch {
    return undefined;
  }
}

/**
 * Whether a manifest of `repo` may keep the tooth it names: the tooth is the
 * repository's address, or one GitHub redirects to it (a former name).
 */
async function ownTooths(read: Map<string, Map<string, CachedTag>>, cache: RegistryCache): Promise<(repo: string, tooth: string) => boolean> {
  const foreign = new Set<string>();
  for (const [repo, tags] of read) {
    for (const { manifest } of tags.values()) {
      const path = manifest && githubPath(manifest.tooth)?.toLowerCase();
      if (path && path !== repo.toLowerCase() && !(path in cache.aliases)) foreign.add(path);
    }
  }
  await mapLimit([...foreign], async (path) => {
    const resolved = await resolveRepo(path);
    if (resolved !== undefined) cache.aliases[path] = resolved;
  });
  return (repo, tooth) => {
    const path = githubPath(tooth)?.toLowerCase();
    return !!path && (path === repo.toLowerCase() || cache.aliases[path] === repo.toLowerCase());
  };
}

/** The `>= 1.0.0` of a range as lip writes it, `>=1.0.0`. */
const tightRange = (range: string) => range.trim().replace(/(>=|<=|>|<|=|\^|~)\s+/g, "$1");

/** Files each version under its tooth and tag (see the top of this file). */
function fileManifests(read: Map<string, Map<string, CachedTag>>, repos: string[], own: (repo: string, tooth: string) => boolean) {
  const manifests = new Map<string, Map<string, RegistryManifest>>();
  const sources = new Map<string, string>();
  const origins = new Map<string, Map<string, ManifestOrigin>>();
  const seen = new Map<string, string>();
  const repaired = { tooth: 0, version: 0 };
  for (const repo of repos) {
    for (const [tag, { sha, manifest, seen: date }] of read.get(repo) ?? []) {
      if (!manifest) continue;
      const version = tag.slice(1);
      // the repository's own address as GitHub spells it (one tooth, not one per spelling)
      const path = githubPath(manifest.tooth)?.toLowerCase();
      const tooth = path !== repo.toLowerCase() && own(repo, manifest.tooth) ? manifest.tooth : `${GITHUB}${repo}`;
      if (tooth !== manifest.tooth) repaired.tooth++;
      if (version !== manifest.version) repaired.version++;
      const variants = manifest.variants.map((v) => ({
        ...v,
        dependencies: Object.fromEntries(Object.entries(v.dependencies ?? {}).map(([k, r]) => [k, tightRange(r)])),
      }));
      if (!sources.has(tooth)) sources.set(tooth, repo);
      if (!manifests.has(tooth)) manifests.set(tooth, new Map());
      // two repositories with one tooth (a release repository and a renamed one): the first has the version
      const versions = manifests.get(tooth)!;
      if (!versions.has(version)) {
        versions.set(version, { ...manifest, tooth, version, variants });
        if (!origins.has(tooth)) origins.set(tooth, new Map());
        origins.get(tooth)!.set(version, { repo, tag, sha });
      }
      if (!seen.get(tooth) || date > seen.get(tooth)!) seen.set(tooth, date);
    }
  }
  console.log(`registry: filed ${repaired.tooth} manifests under their repository's address, ${repaired.version} under their tag's version`);
  return { manifests, sources, origins, seen };
}

/** Assembles lipr's two indexes from the manifests (`generate-indexes.py`). */
function assemble(filed: ReturnType<typeof fileManifests>): Registry {
  const { manifests, sources, origins, seen } = filed;
  const index: ModIndex = { format_version: 3, format_uuid: "289f771f-2c9a-4d73-9f3f-8492495a924d", packages: {} };
  const launcher: LauncherIndex = { packages: {} };
  for (const tooth of [...manifests.keys()].sort()) {
    const versions = [...manifests.get(tooth)!.values()].sort((a, b) => compareVersions(a.version, b.version));
    const variants: RawModEntry["variants"] = {};
    const launcherVariants: LauncherIndex["packages"][string]["variants"] = {};
    for (const manifest of versions) {
      for (const variant of manifest.variants) {
        const versionList = (variants[variant.label] ??= { versions: [] }).versions;
        if (!versionList.includes(manifest.version)) versionList.push(manifest.version);
        const entry = ((launcherVariants[variant.label] ??= { versions: {} }).versions[manifest.version] ??= { dependencies: {} });
        Object.assign(entry.dependencies!, variant.dependencies);
      }
    }
    if (!Object.keys(variants).length) continue;
    const ordered = Object.keys(variants).sort((a, b) => (a === "" ? -1 : b === "" ? 1 : a.localeCompare(b)));
    index.packages[tooth] = {
      info: { ...versions.at(-1)!.info },
      // filled in from GitHub; without it, when the build first saw the latest version
      stargazer_count: 0,
      updated_at: seen.get(tooth)!,
      variants: Object.fromEntries(ordered.map((label) => [label, variants[label]!])),
    };
    launcher.packages[tooth] = { variants: Object.fromEntries(ordered.map((label) => [label, launcherVariants[label]!])) };
  }
  return { index, launcher, manifests, sources, origins };
}

/** The registry, read from the repositories in repos.txt (and the cache). */
export async function loadRegistry(): Promise<Registry> {
  const repos = parseRepoList(readFileSync(REPOS_FILE, "utf8"));
  const cache = readCache();
  const read = await readRepos(repos, cache);
  const own = await ownTooths(read, cache);
  // repositories no longer in repos.txt leave the cache
  const listed = new Set(repos.map((r) => r.toLowerCase()));
  for (const key of Object.keys(cache.repos)) if (!listed.has(key)) delete cache.repos[key];
  // in a stable order, so an unchanged cache is the same file (the workflow saves it only when it changed)
  const sorted = <T>(record: Record<string, T>) => Object.fromEntries(Object.entries(record).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  const stable: RegistryCache = {
    version: cache.version,
    repos: sorted(Object.fromEntries(Object.entries(cache.repos).map(([repo, tags]) => [repo, sorted(tags)]))),
    aliases: sorted(cache.aliases),
  };
  mkdirSync(dirname(CACHE_FILE), { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(stable));
  const registry = assemble(fileManifests(read, repos, own));
  const versions = [...registry.manifests.values()].reduce((n, m) => n + m.size, 0);
  console.log(`registry: ${Object.keys(registry.index.packages).length} packages, ${versions} versions`);
  return registry;
}
