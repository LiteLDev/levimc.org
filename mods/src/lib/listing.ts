// Which packages of the lipr index the catalogue lists. lipr is lip's
// registry, so it also holds what is not a mod: the loader and its runtime,
// templates, scripts and files that install outside the mod folders, and old
// addresses of renamed repositories. Each package is
//
// - listed: in the listing, search, filters, counts and sitemap;
// - unlisted: its page stays (dependency cards and old links lead there), but
//   it is not in the listing — the loader and what it depends on, and the
//   other tooths of a repository the index has under several names;
// - excluded: no page at all.
//
// The rules read only the package's latest manifest and its repository, so a
// new package is judged the moment it is in the index. Exclusions win over
// duplicates: a template never stands in for its repository. A package whose
// manifest cannot be found is not judged by it (lipr files some manifests
// under another path than their tooth).
import type { Manifest, ManifestVariant } from "../types.ts";
import { compareVersions } from "./game-versions.ts";

/** The mod loader: it and everything it depends on are the platform, not mods. */
export const LOADERS: readonly string[] = ["github.com/liteldev/levilamina"];

/** Where a loader looks for mods: a mod puts at least one file under one of these. */
const MOD_DIRS = ["plugins/", "mods/"];

/** Repository names of templates, examples and tests. */
const TEMPLATE_NAME = /(?:^|[-_.])(?:templates?|examples?|demos?|samples?|tests?)$/i;

export type ListingReason =
  /** The loader or something it depends on. */
  | "platform"
  /** Another tooth of the same repository is listed (`canonical`). */
  | "duplicate"
  /** A template repository, or one named as a template, example, demo or test. */
  | "template"
  /** Installs nothing into a mod folder (images, scripts, programs, or nothing at all). */
  | "not-a-mod";

export type Listing =
  | { status: "listed" }
  | { status: "unlisted"; reason: "platform" }
  | { status: "unlisted"; reason: "duplicate"; canonical: string }
  | { status: "excluded"; reason: "template" | "not-a-mod" };

export interface ListingInput {
  tooth: string;
  /** The latest manifest of the default selection; `null`: none could be found (nothing is judged from it). */
  manifest: Manifest | null;
  /** The latest version of the default selection. */
  version?: string;
  /** What GitHub knows about the repository; absent without GitHub data. */
  repo?: { url: string; isTemplate: boolean; latestRelease?: string };
  /** The index's update date, when there is no release date. */
  updated: string;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const placesOf = (files: unknown) =>
  list(isObject(files) ? files["place"] : undefined).map((p) => ({ dest: isObject(p) && typeof p["dest"] === "string" ? p["dest"] : "" }));
const dependenciesOf = (value: unknown) =>
  isObject(value) ? Object.fromEntries(Object.entries(value).filter((e): e is [string, string] => typeof e[1] === "string")) : {};

/**
 * What the rules read of a `tooth.json` as a repository has it: the current
 * format (variants with asset placements), or the older ones lip migrates
 * (`files.place`, per platform or for the whole package). `null`: not a manifest.
 */
export function manifestOf(json: unknown): Manifest | null {
  if (!isObject(json) || !isObject(json["info"])) return null;
  const info = json["info"];
  const variants: ManifestVariant[] = Array.isArray(json["variants"])
    ? json["variants"].filter(isObject).map((v) => ({
        label: typeof v["label"] === "string" ? v["label"] : "",
        dependencies: dependenciesOf(v["dependencies"]),
        assets: list(v["assets"]).filter(isObject).map((a) => ({ placements: list(a["placements"]).filter(isObject).map((p) => ({ dest: typeof p["dest"] === "string" ? p["dest"] : "" })) })),
      }))
    : [json, ...list(json["platforms"]).filter(isObject)].map((p) => ({
        label: "",
        dependencies: dependenciesOf(json["dependencies"]),
        assets: [{ placements: placesOf(p["files"]) }],
      }));
  return {
    info: {
      name: typeof info["name"] === "string" ? info["name"] : "",
      description: typeof info["description"] === "string" ? info["description"] : "",
      tags: list(info["tags"]).filter((t): t is string => typeof t === "string"),
    },
    variants,
  };
}

const normalizeDest = (dest: string) => dest.replace(/\\/g, "/").replace(/^(?:\.\/)+/, "");

/** The manifest puts at least one file into a mod folder. */
export function installsMod(manifest: Manifest): boolean {
  return manifest.variants.some((variant) =>
    (variant.assets ?? []).some((asset) =>
      (asset.placements ?? []).some((p) => MOD_DIRS.some((dir) => normalizeDest(p.dest ?? "").startsWith(dir))),
    ),
  );
}

/** The repository's name today (else the tooth's last segment). */
const repoName = (input: ListingInput) => (input.repo?.url ?? input.tooth).replace(/\/+$/, "").split("/").at(-1) ?? "";

/** Lower-case tooths of the loaders and everything their latest versions depend on, among `inputs`. */
function platformTooths(inputs: readonly ListingInput[]): Set<string> {
  const byTooth = new Map(inputs.map((i) => [i.tooth.toLowerCase(), i]));
  const platform = new Set<string>();
  const queue = LOADERS.filter((t) => byTooth.has(t));
  while (queue.length) {
    const tooth = queue.pop()!;
    if (platform.has(tooth)) continue;
    platform.add(tooth);
    for (const variant of byTooth.get(tooth)?.manifest?.variants ?? []) {
      for (const key of Object.keys(variant.dependencies ?? {})) {
        const dep = key.split("#")[0]!.toLowerCase();
        if (byTooth.has(dep)) queue.push(dep);
      }
    }
  }
  return platform;
}

/**
 * Which of several tooths of one repository is listed: the one GitHub serves
 * the repository under (spelled the same, then in any case), else the one
 * with the latest version, else the most recently released.
 */
function preferred(group: readonly ListingInput[]): ListingInput {
  const path = (i: ListingInput) => i.tooth.replace(/^github\.com\//i, "");
  const current = (i: ListingInput) => i.repo?.url.replace(/^https:\/\/github\.com\//i, "") ?? "";
  const score = (i: ListingInput) => (path(i) === current(i) ? 2 : path(i).toLowerCase() === current(i).toLowerCase() ? 1 : 0);
  const date = (i: ListingInput) => i.repo?.latestRelease ?? i.updated;
  const version = (a: ListingInput, b: ListingInput) => (a.version && b.version ? compareVersions(b.version, a.version) : 0);
  return [...group].sort(
    (a, b) => score(b) - score(a) || version(a, b) || date(b).localeCompare(date(a)) || a.tooth.localeCompare(b.tooth),
  )[0]!;
}

/** How each package is shown, by tooth. */
export function classifyListings(inputs: readonly ListingInput[]): Map<string, Listing> {
  const out = new Map<string, Listing>();
  const platform = platformTooths(inputs);
  const candidates: ListingInput[] = [];
  for (const input of inputs) {
    if (input.repo?.isTemplate || TEMPLATE_NAME.test(repoName(input))) {
      out.set(input.tooth, { status: "excluded", reason: "template" });
    } else if (platform.has(input.tooth.toLowerCase())) {
      out.set(input.tooth, { status: "unlisted", reason: "platform" });
    } else if (input.manifest && !installsMod(input.manifest)) {
      out.set(input.tooth, { status: "excluded", reason: "not-a-mod" });
    } else {
      candidates.push(input);
    }
  }

  // One repository, one entry: GitHub follows renames and transfers, and tooths differ in case.
  const groups = new Map<string, ListingInput[]>();
  for (const input of candidates) {
    const key = (input.repo?.url.replace(/^https:\/\/github\.com\//i, "github.com/") ?? input.tooth).toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), input]);
  }
  for (const group of groups.values()) {
    const kept = preferred(group);
    for (const input of group) {
      out.set(input.tooth, input === kept ? { status: "listed" } : { status: "unlisted", reason: "duplicate", canonical: kept.tooth });
    }
  }
  return out;
}
