// Which packages of the registry the catalogue lists. It has every package
// lip installs, so it also holds what is not a mod: the loader and its runtime,
// templates, programs and files that go nowhere the game or a loader loads
// from, and old addresses of renamed repositories. Each package is
//
// - listed: in the listing, search, filters, counts and sitemap;
// - unlisted: its page stays (dependency cards, old links and launchers
//   looking up what they installed lead there), but it is not in the listing
//   — the loader and what it depends on, what does not run on LeviLamina
//   (its latest version does not depend on it, directly or through other
//   packages), and the other ids of a repository the index has under several
//   names;
// - excluded: no page at all.
//
// The rules read only the packages' latest versions and their repositories, so a
// new package is judged the moment it is in the index. Exclusions win over
// duplicates: a template never stands in for its repository. Only what a
// manifest places is evidence: a package whose manifest cannot be found, or
// places nothing (older manifests often list no files), is not judged by it.
import type { LipDoc } from "../types.ts";
import { compareVersions } from "./game-versions.ts";

/** The mod loader: it and everything it depends on are the platform, not mods. */
export const LOADERS: readonly string[] = ["github.com/liteldev/levilamina"];

/** Where a loader looks for mods, from the game's folder. */
const LOADER_DIRS = ["plugins/", "mods/"];

/**
 * Where the game loads add-ons from, at any depth (the server's folder, a
 * world's, the client's `com.mojang`), and add-on files themselves.
 */
const ADDON_DIR = /(?:^|\/)(?:(?:development_)?(?:behavior|resource|skin)_packs|worlds|world_templates|minecraftWorlds)\//i;
const ADDON_FILE = /\.(?:mcpack|mcaddon|mcworld|mctemplate)$/i;

/** Repository names of templates, examples and tests. */
const TEMPLATE_NAME = /(?:^|[-_.])(?:templates?|examples?|demos?|samples?|tests?)$/i;

export type ListingReason =
  /** The loader or something it depends on. */
  | "platform"
  /** Another id of the same repository is listed (`canonical`). */
  | "duplicate"
  /** Its latest version does not depend on LeviLamina, directly or transitively. */
  | "no-levilamina"
  /** A template repository, or one named as a template, example, demo or test. */
  | "template"
  /** Places files, but none where the game or a loader loads mods and add-ons from (images, scripts, programs). */
  | "not-a-mod";

export type Listing =
  | { status: "listed" }
  | { status: "unlisted"; reason: "platform" | "no-levilamina" }
  | { status: "unlisted"; reason: "duplicate"; canonical: string }
  | { status: "excluded"; reason: "template" | "not-a-mod" };

export interface ListingInput {
  id: string;
  /** The package file of the latest version; `null`: none could be found (nothing is judged from it). */
  doc: LipDoc | null;
  /** The latest version of the default selection. */
  version?: string;
  /** What GitHub knows about the repository; absent without GitHub data. */
  repo?: { url: string; isTemplate: boolean; latestRelease?: string };
  /** The index's update date, when there is no release date. */
  updated: string;
}

const normalizeDest = (dest: string) => dest.replace(/\\/g, "/").replace(/^(?:\.\/)+/, "");

/** A placement puts mod content where the game or a loader loads it from. */
export function isModContent(dest: string): boolean {
  const path = normalizeDest(dest);
  return LOADER_DIRS.some((dir) => path.startsWith(dir)) || ADDON_DIR.test(path) || ADDON_FILE.test(path);
}

/**
 * Whether the package installs a mod: some placement is mod content (true),
 * it places files but none is (false), or it places nothing to tell by (null).
 */
export function installsMod(doc: LipDoc): boolean | null {
  const dests = Object.values(doc.variants).flatMap((entries) => entries.flatMap((e) => e.dests));
  const placed = dests.filter((dest) => normalizeDest(dest) !== "");
  return placed.length ? placed.some(isModContent) : null;
}

/** The repository's name today (else the id's last segment). */
const repoName = (input: ListingInput) => (input.repo?.url ?? input.id).replace(/\/+$/, "").split("/").at(-1) ?? "";

/** The lower-case bare ids a package's latest version depends on (any variant, any entry). */
const depsOf = (input: ListingInput | undefined) =>
  new Set(Object.values(input?.doc?.variants ?? {}).flatMap((entries) => entries.flatMap((e) => Object.keys(e.deps).map((k) => k.split("#")[0]!.toLowerCase()))));

/** Lower-case ids of the loaders and everything their latest versions depend on, among `inputs`. */
function platformIds(byId: Map<string, ListingInput>): Set<string> {
  const platform = new Set<string>();
  const queue = LOADERS.filter((t) => byId.has(t));
  while (queue.length) {
    const id = queue.pop()!;
    if (platform.has(id)) continue;
    platform.add(id);
    for (const dep of depsOf(byId.get(id))) if (byId.has(dep)) queue.push(dep);
  }
  return platform;
}

/** Lower-case ids whose latest version depends on a loader, directly or through other packages of `inputs`. */
function onLoader(byId: Map<string, ListingInput>): Set<string> {
  const deps = new Map([...byId].map(([id, input]) => [id, depsOf(input)]));
  const reached = new Set<string>(LOADERS);
  for (let changed = true; changed; ) {
    changed = false;
    for (const [id, of] of deps) {
      if (!reached.has(id) && [...of].some((d) => reached.has(d))) {
        reached.add(id);
        changed = true;
      }
    }
  }
  return reached;
}

/**
 * Which of several ids of one repository is listed: the one GitHub serves
 * the repository under (spelled the same, then in any case), else the one
 * with the latest version, else the most recently released.
 */
function preferred(group: readonly ListingInput[]): ListingInput {
  const path = (i: ListingInput) => i.id.replace(/^github\.com\//i, "");
  const current = (i: ListingInput) => i.repo?.url.replace(/^https:\/\/github\.com\//i, "") ?? "";
  const score = (i: ListingInput) => (path(i) === current(i) ? 2 : path(i).toLowerCase() === current(i).toLowerCase() ? 1 : 0);
  const date = (i: ListingInput) => i.repo?.latestRelease ?? i.updated;
  const version = (a: ListingInput, b: ListingInput) => (a.version && b.version ? compareVersions(b.version, a.version) : 0);
  return [...group].sort(
    (a, b) => score(b) - score(a) || version(a, b) || date(b).localeCompare(date(a)) || a.id.localeCompare(b.id),
  )[0]!;
}

/** How each package is shown, by id. */
export function classifyListings(inputs: readonly ListingInput[]): Map<string, Listing> {
  const out = new Map<string, Listing>();
  const byId = new Map(inputs.map((i) => [i.id.toLowerCase(), i]));
  const platform = platformIds(byId);
  const loaded = onLoader(byId);
  const candidates: ListingInput[] = [];
  for (const input of inputs) {
    if (input.repo?.isTemplate || TEMPLATE_NAME.test(repoName(input))) {
      out.set(input.id, { status: "excluded", reason: "template" });
    } else if (platform.has(input.id.toLowerCase())) {
      out.set(input.id, { status: "unlisted", reason: "platform" });
    } else if (input.doc && installsMod(input.doc) === false) {
      out.set(input.id, { status: "excluded", reason: "not-a-mod" });
    } else if (input.doc && !loaded.has(input.id.toLowerCase())) {
      out.set(input.id, { status: "unlisted", reason: "no-levilamina" });
    } else {
      candidates.push(input);
    }
  }

  // One repository, one entry: GitHub follows renames and transfers, and ids differ in case.
  const groups = new Map<string, ListingInput[]>();
  for (const input of candidates) {
    const key = (input.repo?.url.replace(/^https:\/\/github\.com\//i, "github.com/") ?? input.id).toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), input]);
  }
  for (const group of groups.values()) {
    const kept = preferred(group);
    for (const input of group) {
      out.set(input.id, input === kept ? { status: "listed" } : { status: "unlisted", reason: "duplicate", canonical: kept.id });
    }
  }
  return out;
}
