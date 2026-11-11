// The registry the catalogue is built from: every repository in repos.txt,
// each `v<semver>` tag of it a version, read from the `lip.toml` at that tag
// (lib/lipfile.ts), else — only when there is none, as lip does — from its
// `tooth.json` (read as a package file, see `lib/manifest.ts` toothToV4). A
// `lip.toml` lip cannot read makes the tag no version.
//
// lipr's indexes (server/api.ts liprFiles) are what lipr always was: every
// tag's `tooth.json` (migrated to format 3), whether or not it has a
// `lip.toml`; a package with only `lip.toml` files is not in them.
//
// Manifests are taken as their repositories have them,
// with the repairs lipr's maintainers made by hand:
//
// - the tag is the version (a manifest says `v1.2.0`, or was not bumped);
// - the manifest is filed under the tooth it names when GitHub serves that
//   address from where it serves the repository (a former name or owner, so
//   an old release keeps its old address, whichever name repos.txt has);
//   any other tooth (`CFSP`, a template's, another repository's, the
//   repository's own in another case) is the repository's address as
//   repos.txt spells it. A `lip.toml` naming another package's id is not
//   read (lip would not install it as this repository's).
//
// What was read is kept in .cache/registry.json (the workflow keeps it in the
// Actions cache): a tag whose commit is unchanged is not read again. It is
// only a cache — without it everything is read anew.
import { execFile } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { promisify } from "node:util";
import { compareVersions, type LauncherIndex } from "../lib/game-versions.ts";
import { parseLipToml } from "../lib/lipfile.ts";
import {
  migrateManifest,
  narrowSides,
  preferredVariant,
  sidesIn,
  splitDependency,
  toothToV4,
  type RegistryManifest,
  type SideResolver,
} from "../lib/manifest.ts";
import { fetchWithRetry } from "../lib/mods.ts";
import { parseRepoList } from "../lib/repo-list.ts";
import type { LipDoc, LiprEntry, LiprIndex, ModIndex, RawModEntry, Side } from "../types";
import { mapLimit } from "./map-limit.ts";

const REPOS_FILE = "repos.txt";
const CACHE_FILE = process.env.MODS_REGISTRY_CACHE ?? ".cache/registry.json";
/** 3: lip.toml (`v4`) beside tooth.json (`v3`); a version 2 cache is migrated (see readRepos). */
const CACHE_VERSION = 3;
/** lipr's: a tag is `v` and a semantic version. */
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const GITHUB = "github.com/";

const run = promisify(execFile);

export interface CachedTag {
  /** The commit (or tag object) the tag pointed to when it was read. */
  sha: string;
  /** The file the package was read from: `lip.toml`, else (only when there is none) `tooth.json`; absent: neither. */
  kind?: "lip" | "tooth";
  /** The tag's `tooth.json`, as lipr reads it (absent: none lip before v0.40 can read). */
  v3?: RegistryManifest;
  /** The package at the tag, as lip v0.40 reads it (`null`: none it can read). */
  v4: LipDoc | null;
  /** When the build first saw the tag (the date of a version without GitHub data). */
  seen: string;
}

/** A tag as a version 2 cache has it: its `tooth.json` alone. */
export interface LegacyTag {
  sha: string;
  manifest: RegistryManifest | null;
  seen: string;
}

export interface RegistryCache {
  version: number;
  /** Lower-case `owner/repo` → tag → what was read. */
  repos: Record<string, Record<string, CachedTag>>;
  /** What a version 2 cache read (`tooth.json` only), until each tag is migrated; never written. */
  legacy?: Record<string, Record<string, LegacyTag>>;
  /**
   * Lower-case `owner/repo` (a manifest's tooth, or a listed repository with such a manifest) → the repository GitHub
   * serves there now (lower case), `null`: none. Looked up again by every build; the value here is only for when the
   * lookup fails.
   */
  aliases: Record<string, string | null>;
}

export interface Registry {
  /** The packages (stars and dates are filled in from GitHub, see `server/catalog.ts`). */
  index: ModIndex;
  /** Every version's dependencies, per variant (all its entries'). */
  launcher: LauncherIndex;
  /** Id → version → its package file (id and version as filed). */
  docs: Map<string, Map<string, LipDoc>>;
  /** Id → the repository (`owner/repo`) it was read from. */
  sources: Map<string, string>;
  /** Id → version → where its package file was read. */
  origins: Map<string, Map<string, ManifestOrigin>>;
  /** lipr's indexes: every version with a `tooth.json` (see `server/api.ts` liprFiles). */
  lipr: LiprRegistry;
}

export interface LiprRegistry {
  /** The packages, as lipr's index.json has them. */
  index: LiprIndex;
  /** Every version's dependencies, as lipr's levilauncher.json has them. */
  launcher: LauncherIndex;
  /** Tooth → version → the repository, tag and commit its `tooth.json` was read at. */
  origins: Map<string, Map<string, LiprOrigin>>;
}

/** Where a version's `tooth.json` was read: lipr serves it from there (see `server/api.ts`). */
export interface LiprOrigin {
  repo: string;
  tag: string;
  /** The commit (or tag object) the tag pointed to. */
  sha: string;
}

/** Where a version's package file was read. */
export interface ManifestOrigin extends LiprOrigin {
  file: "lip.toml" | "tooth.json";
}

function readCache(): RegistryCache {
  try {
    const cache = JSON.parse(readFileSync(CACHE_FILE, "utf8")) as RegistryCache & { repos: Record<string, Record<string, unknown>> };
    if (cache.version === CACHE_VERSION && cache.repos && cache.aliases) return cache;
    // version 2: every tag's tooth.json is kept; each is migrated by looking for a lip.toml only
    if (cache.version === 2 && cache.repos && cache.aliases) {
      return { version: CACHE_VERSION, repos: {}, aliases: cache.aliases, legacy: cache.repos as Record<string, Record<string, LegacyTag>> };
    }
  } catch {
    // no cache yet
  }
  return { version: CACHE_VERSION, repos: {}, aliases: {} };
}

/** A version 2 cache's tag, as if no lip.toml had been found (what is used when GitHub cannot be asked). */
const fromLegacy = ({ sha, manifest, seen }: LegacyTag): CachedTag =>
  manifest ? { sha, kind: "tooth", v3: manifest, v4: toothToV4(manifest), seen } : { sha, v4: null, seen };

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

/** A file at a tag; `null`: there is none; `undefined`: GitHub could not be reached (or limits the build). */
async function readFile(repo: string, tag: string, file: string): Promise<string | null | undefined> {
  try {
    const res = await fetchWithRetry(`https://raw.githubusercontent.com/${repo}/${encodeURIComponent(tag)}/${file}`);
    if (res.status === 404) return null;
    if (!res.ok) return undefined;
    return await res.text();
  } catch {
    return undefined;
  }
}

/** A `tooth.json` as lipr reads it, `null` when lip cannot. */
function readTooth(text: string | null): RegistryManifest | null {
  if (text === null) return null;
  try {
    return migrateManifest(JSON.parse(text));
  } catch {
    return null;
  }
}

/**
 * What a tag has (`undefined`: GitHub could not be reached; read it next
 * time). `legacy`: its `tooth.json` as a version 2 cache read it, so only the
 * `lip.toml` is looked for.
 */
export async function readTag(repo: string, tag: string, legacy?: LegacyTag): Promise<Omit<CachedTag, "sha" | "seen"> | undefined> {
  const [lip, tooth] = await Promise.all([readFile(repo, tag, "lip.toml"), legacy ? legacy.manifest : readFile(repo, tag, "tooth.json").then((t) => (t === undefined ? undefined : readTooth(t)))]);
  if (lip === undefined || tooth === undefined) return undefined;
  const v3 = tooth ? { v3: tooth } : {};
  if (lip !== null) {
    const { doc, error } = parseLipToml(lip);
    if (error) console.warn(`::warning::registry: ${repo} ${tag}: ${error}`);
    return { kind: "lip", ...v3, v4: doc ?? null };
  }
  return tooth ? { kind: "tooth", ...v3, v4: toothToV4(tooth) } : { v4: null };
}

/** Reads every repository's tags, and the manifests of those not read before. */
async function readRepos(repos: string[], cache: RegistryCache): Promise<Map<string, Map<string, CachedTag>>> {
  const now = new Date().toISOString();
  let read = 0;
  let migrated = 0;
  let unreachable = 0;
  const out = new Map<string, Map<string, CachedTag>>();
  await mapLimit(repos, async (repo) => {
    const key = repo.toLowerCase();
    const cached = cache.repos[key] ?? {};
    const legacy = cache.legacy?.[key] ?? {};
    let tags: Map<string, string> | null;
    try {
      tags = await listTags(repo);
    } catch (error) {
      console.warn(`::warning::registry: could not list the tags of ${repo} (${String(error).split("\n")[0]}); using what was read before`);
      const before = new Map(Object.entries(legacy).map(([tag, old]) => [tag, fromLegacy(old)]));
      for (const [tag, hit] of Object.entries(cached)) before.set(tag, hit);
      out.set(repo, before);
      unreachable++;
      return;
    }
    if (!tags) {
      console.warn(`::warning::registry: ${repo} is gone (repos.txt still names it)`);
      delete cache.repos[key];
      return;
    }
    const next: Record<string, CachedTag> = {};
    // what this build uses: the cache, and tags it could not migrate (looked for again next time)
    const used: Record<string, CachedTag> = {};
    await mapLimit([...tags], async ([tag, sha]) => {
      const hit = cached[tag];
      if (hit?.sha === sha) {
        next[tag] = used[tag] = hit;
        return;
      }
      const old = legacy[tag]?.sha === sha ? legacy[tag] : undefined;
      const found = await readTag(repo, tag, old);
      if (old) migrated++;
      else read++;
      if (found === undefined) {
        if (hit) next[tag] = used[tag] = hit;
        else if (old) used[tag] = fromLegacy(old);
        unreachable++;
        return;
      }
      next[tag] = used[tag] = { sha, ...found, seen: hit?.seen ?? old?.seen ?? now };
    });
    cache.repos[key] = next;
    out.set(repo, new Map(Object.entries(used)));
  });
  console.log(
    `registry: ${repos.length} repositories; read ${read} tags` +
      `${migrated ? `, looked for lip.toml at ${migrated} tags read before` : ""}${unreachable ? `, ${unreachable} could not be read` : ""}`,
  );
  return out;
}

/** The `owner/repo` of a GitHub tooth (`github.com/o/r`), else `null`. */
function githubPath(tooth: string): string | null {
  const parts = tooth.split("/");
  return tooth.startsWith(GITHUB) && parts.length === 3 && parts[1] && parts[2] ? `${parts[1]}/${parts[2]}` : null;
}

/** Where GitHub serves `owner/repo` now (it follows renames and transfers), lower case; `null`: nowhere; `undefined`: GitHub could not be reached. */
export type RepoResolver = (path: string) => Promise<string | null | undefined>;

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
 * repository's address, or one GitHub serves the same repository at (a former
 * name or owner) — compared where GitHub serves both now, so it holds whether
 * repos.txt has the repository's old name or its new one.
 *
 * Every address is looked up again on each build (a repository moves after its
 * first lookup); the cached one is used only when the lookup fails.
 */
export async function ownTooths(
  read: Map<string, Map<string, CachedTag>>,
  cache: RegistryCache,
  resolve: RepoResolver = resolveRepo,
): Promise<(repo: string, tooth: string) => boolean> {
  const paths = new Set<string>();
  for (const [repo, tags] of read) {
    for (const { v3, v4 } of tags.values()) {
      for (const id of [v3?.tooth, v4?.id]) {
        const path = id && githubPath(id)?.toLowerCase();
        if (path && path !== repo.toLowerCase()) paths.add(path).add(repo.toLowerCase());
      }
    }
  }
  const aliases: Record<string, string | null> = {};
  await mapLimit([...paths], async (path) => {
    const resolved = await resolve(path);
    if (resolved !== undefined) aliases[path] = resolved;
    else if (path in cache.aliases) aliases[path] = cache.aliases[path]!;
  });
  // only what this build's manifests name stays
  cache.aliases = aliases;
  // where GitHub serves an address now (itself when that is not known)
  const current = (path: string) => (path in aliases ? aliases[path] : path);
  return (repo, tooth) => {
    const path = githubPath(tooth)?.toLowerCase();
    if (!path) return false;
    if (path === repo.toLowerCase()) return true;
    const here = current(repo.toLowerCase());
    return !!here && current(path) === here;
  };
}

/** The `>= 1.0.0` of a range as lip writes it, `>=1.0.0`. */
const tightRange = (range: string) => range.trim().replace(/(>=|<=|>|<|=|\^|~)\s+/g, "$1");

const tightDeps = (deps: Record<string, string> | undefined) => Object.fromEntries(Object.entries(deps ?? {}).map(([k, r]) => [k, tightRange(r)]));

/** Files each version under its tooth (id) and tag (see the top of this file): the site's package files, and lipr's manifests. */
export function fileManifests(read: Map<string, Map<string, CachedTag>>, repos: string[], own: (repo: string, tooth: string) => boolean) {
  // the site's
  const docs = new Map<string, Map<string, LipDoc>>();
  const sources = new Map<string, string>();
  const origins = new Map<string, Map<string, ManifestOrigin>>();
  const seen = new Map<string, string>();
  // lipr's
  const manifests = new Map<string, Map<string, RegistryManifest>>();
  const liprOrigins = new Map<string, Map<string, LiprOrigin>>();
  const liprSeen = new Map<string, string>();
  const repaired = { tooth: 0, version: 0, foreign: 0 };
  /** Where a version naming `id` is filed: the repository's address as GitHub spells it, or `id` when GitHub serves it there too. */
  const fileAs = (repo: string, id: string) => {
    const path = githubPath(id)?.toLowerCase();
    return path !== repo.toLowerCase() && own(repo, id) ? id : `${GITHUB}${repo}`;
  };
  const later = (map: Map<string, string>, key: string, date: string) => {
    if (!map.get(key) || date > map.get(key)!) map.set(key, date);
  };
  for (const repo of repos) {
    for (const [tag, { sha, kind, v3, v4, seen: date }] of read.get(repo) ?? []) {
      const version = tag.slice(1);
      if (v4 && kind) {
        const id = fileAs(repo, v4.id);
        if (kind === "lip" && id !== v4.id && githubPath(v4.id)?.toLowerCase() !== repo.toLowerCase()) {
          // lip.toml names another package: lip would not install it as this repository's
          console.warn(`::warning::registry: ${repo} ${tag}: lip.toml has the id ${v4.id}, not this repository's`);
          repaired.foreign++;
        } else {
          if (id !== v4.id) repaired.tooth++;
          if (version !== v4.version) repaired.version++;
          // a tooth.json's ranges as lip writes them; a lip.toml's as it has them
          const variants =
            kind === "tooth"
              ? Object.fromEntries(Object.entries(v4.variants).map(([name, entries]) => [name, entries.map((e) => ({ ...e, deps: tightDeps(e.deps) }))]))
              : v4.variants;
          if (!sources.has(id)) sources.set(id, repo);
          if (!docs.has(id)) docs.set(id, new Map());
          // two repositories with one id (a release repository and a renamed one): the first has the version
          const versions = docs.get(id)!;
          if (!versions.has(version)) {
            versions.set(version, { ...v4, id, version, variants });
            if (!origins.has(id)) origins.set(id, new Map());
            origins.get(id)!.set(version, { repo, tag, sha, file: kind === "lip" ? "lip.toml" : "tooth.json" });
          }
          later(seen, id, date);
        }
      }
      if (v3) {
        const tooth = fileAs(repo, v3.tooth);
        if (!manifests.has(tooth)) manifests.set(tooth, new Map());
        const versions = manifests.get(tooth)!;
        if (!versions.has(version)) {
          const variants = v3.variants.map((v) => ({ ...v, dependencies: tightDeps(v.dependencies) }));
          versions.set(version, { ...v3, tooth, version, variants });
          if (!liprOrigins.has(tooth)) liprOrigins.set(tooth, new Map());
          liprOrigins.get(tooth)!.set(version, { repo, tag, sha });
        }
        later(liprSeen, tooth, date);
      }
    }
  }
  console.log(
    `registry: filed ${repaired.tooth} manifests under their repository's address, ${repaired.version} under their tag's version` +
      `${repaired.foreign ? `; left out ${repaired.foreign} lip.toml files of another package` : ""}`,
  );
  return { docs, sources, origins, seen, lipr: { manifests, origins: liprOrigins, seen: liprSeen } };
}

const byVersion = (a: { version: string }, b: { version: string }) => compareVersions(a.version, b.version);

/** Variant names, the default (`""`) first. */
const variantOrder = (a: string, b: string) => (a === "" ? -1 : b === "" ? 1 : a.localeCompare(b));

/**
 * The sides each `tooth.json`-sourced version runs on, narrowed by what its
 * entries depend on (lib/manifest.ts narrowSides), through every package's
 * latest version. A `lip.toml` says its sides; it is taken as it is.
 */
export function narrowRegistrySides(docs: Map<string, Map<string, LipDoc>>, kinds: (id: string, version: string) => "lip" | "tooth" | undefined) {
  const latest = new Map<string, LipDoc>();
  for (const [id, versions] of docs) {
    const doc = [...versions.values()].sort(byVersion).at(-1);
    if (doc) latest.set(id.toLowerCase(), doc);
  }
  const narrowed = new Map<string, LipDoc>();
  const visiting = new Set<string>();
  const latestOf = (lower: string): LipDoc | undefined => {
    const done = narrowed.get(lower);
    if (done) return done;
    const doc = latest.get(lower);
    // a cycle: the package's own sides, as they are
    if (!doc || visiting.has(lower)) return doc;
    visiting.add(lower);
    const result = kinds(doc.id, doc.version) === "tooth" ? narrowSides(doc, resolve) : doc;
    visiting.delete(lower);
    narrowed.set(lower, result);
    return result;
  };
  const resolve: SideResolver = (key) => {
    const { id, variant } = splitDependency(key);
    const lower = id.toLowerCase();
    const doc = latestOf(lower);
    if (!doc) return undefined;
    let entries = doc.variants[variant];
    let only: Side[] | undefined;
    // `#client` of a lip.toml package that has no such variant: its default variant's client entries
    if (!entries && variant === "client" && kinds(doc.id, doc.version) === "lip") {
      entries = doc.variants[""];
      only = ["client"];
    }
    if (!entries) return undefined;
    const sides = sidesIn(entries);
    const narrowedSides = only ? sides.filter((s) => only.includes(s)) : sides;
    return narrowedSides.length ? narrowedSides : sides;
  };
  let changed = 0;
  for (const [id, versions] of docs) {
    for (const [version, doc] of versions) {
      if (kinds(id, version) !== "tooth") continue;
      const next = narrowSides(doc, resolve);
      if (Object.values(next.variants).flat().length !== Object.values(doc.variants).flat().length) changed++;
      versions.set(version, next);
    }
  }
  return changed;
}

/**
 * The variant a mod page shows by default (and `latest.variant` of its JSON):
 * rule A2 (lib/manifest.ts preferredVariant) among the latest version's
 * variants with a server entry, else among those with a client one. For a
 * `lip.toml` version that is its default `""` (its bare identity), not a
 * legacy `client` alias of it.
 */
export function defaultVariantOf(latest: LipDoc, lipToml: boolean): string | undefined {
  return preferredVariant(latest.variants, "server", undefined, lipToml) ?? preferredVariant(latest.variants, "client", undefined, lipToml);
}

/** Assembles the site's index and lipr's two indexes (`generate-indexes.py`) from the manifests. */
function assemble(filed: ReturnType<typeof fileManifests>): Registry {
  const { docs, sources, origins, seen, lipr } = filed;
  const kinds = (id: string, version: string) => {
    const file = origins.get(id)?.get(version)?.file;
    return file === "lip.toml" ? "lip" : file === "tooth.json" ? "tooth" : undefined;
  };
  const narrowed = narrowRegistrySides(docs, kinds);
  console.log(`registry: narrowed the sides of ${narrowed} tooth.json versions by their dependencies`);

  const index: ModIndex = { packages: {} };
  const launcher: LauncherIndex = { packages: {} };
  for (const id of [...docs.keys()].sort()) {
    const versions = [...docs.get(id)!.values()].sort(byVersion);
    const variants: RawModEntry["variants"] = {};
    const launcherVariants: LauncherIndex["packages"][string]["variants"] = {};
    for (const doc of versions) {
      for (const [name, entries] of Object.entries(doc.variants)) {
        (variants[name] ??= { versions: [] }).versions.push(doc.version);
        const entry = ((launcherVariants[name] ??= { versions: {} }).versions[doc.version] ??= { dependencies: {} });
        for (const e of entries) Object.assign(entry.dependencies!, e.deps);
      }
    }
    if (!Object.keys(variants).length) continue;
    const ordered = Object.keys(variants).sort(variantOrder);
    const latest = versions.at(-1)!;
    const defaultVariant = defaultVariantOf(latest, kinds(id, latest.version) === "lip");
    index.packages[id] = {
      info: { ...latest.info },
      // filled in from GitHub; without it, when the build first saw the latest version
      stargazer_count: 0,
      updated_at: seen.get(id)!,
      variants: Object.fromEntries(ordered.map((name) => [name, variants[name]!])),
      ...(defaultVariant !== undefined ? { defaultVariant } : {}),
    };
    launcher.packages[id] = { variants: Object.fromEntries(ordered.map((name) => [name, launcherVariants[name]!])) };
  }

  const liprIndex: LiprIndex = { format_version: 3, format_uuid: "289f771f-2c9a-4d73-9f3f-8492495a924d", packages: {} };
  const liprLauncher: LauncherIndex = { packages: {} };
  for (const tooth of [...lipr.manifests.keys()].sort()) {
    const versions = [...lipr.manifests.get(tooth)!.values()].sort(byVersion);
    const variants: LiprEntry["variants"] = {};
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
    const ordered = Object.keys(variants).sort(variantOrder);
    liprIndex.packages[tooth] = {
      info: { ...versions.at(-1)!.info },
      stargazer_count: 0,
      updated_at: lipr.seen.get(tooth)!,
      variants: Object.fromEntries(ordered.map((label) => [label, variants[label]!])),
    };
    liprLauncher.packages[tooth] = { variants: Object.fromEntries(ordered.map((label) => [label, launcherVariants[label]!])) };
  }
  return { index, launcher, docs, sources, origins, lipr: { index: liprIndex, launcher: liprLauncher, origins: lipr.origins } };
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
    version: CACHE_VERSION,
    repos: sorted(Object.fromEntries(Object.entries(cache.repos).map(([repo, tags]) => [repo, sorted(tags)]))),
    aliases: sorted(cache.aliases),
  };
  mkdirSync(dirname(CACHE_FILE), { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(stable));
  const registry = assemble(fileManifests(read, repos, own));
  const versions = [...registry.docs.values()].reduce((n, m) => n + m.size, 0);
  console.log(
    `registry: ${Object.keys(registry.index.packages).length} packages, ${versions} versions; ` +
      `lipr: ${Object.keys(registry.lipr.index.packages).length} packages`,
  );
  return registry;
}
