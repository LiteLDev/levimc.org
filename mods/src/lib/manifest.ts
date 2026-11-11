// A repository's `tooth.json` as the site reads it: the current format (3),
// or the older ones (1, 2) migrated the way `lip migrate` does
// (Lip.Core/Migration/PackageManifests in LiteLDev/lip), as far as the site
// uses them — info, and each variant's label, platform, dependencies and
// where its files go. Templates (`{{version}}`, `$(version)`) are filled in.
// That is what lipr serves (lip before v0.40); the site reads it as lip v0.40
// does, as a package file (`toothToV4`).
import type { LipDoc, LipEntry, Manifest, ManifestVariant, Side, VersionTarget } from "../types.ts";

/** A version's manifest, with the tooth and version it says it is. */
export interface RegistryManifest extends Manifest {
  tooth: string;
  version: string;
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const str = (value: unknown): string => (typeof value === "string" ? value : "");
const strings = (value: unknown): string[] => list(value).filter((v): v is string => typeof v === "string");

/** Fills `{{name}}` from `model` (Scriban leaves an unknown name empty). */
function render(template: string, model: Record<string, string>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, name: string) => model[name] ?? "");
}

/** Format 2's `$(name)` is format 3's `{{name}}`. */
const renderV2 = (template: string, model: Record<string, string>) => render(template.replace(/\$\(([^)]+?)\)/g, "{{$1}}"), model);

/**
 * npm ranges as lip writes them after a migration: `1.2.x` → `1.2.*`; `null`
 * for one it cannot read (a wildcard after an operator, `>=1.2.*`), which it leaves out.
 */
const npmRange = (range: string) => {
  const wild = range.replace(/(^|[\s.<>=^~|])[xX](?=$|[\s.|])/g, "$1*");
  return /[<>=^~]\s*[\d.]*\*/.test(wild) ? null : wild;
};

const dependenciesOf = (value: unknown, normalize: (range: string) => string | null = (r) => r) =>
  Object.fromEntries(
    Object.entries(isObject(value) ? value : {}).flatMap(([key, range]) => {
      const normalized = key && typeof range === "string" ? normalize(range) : null;
      return normalized === null ? [] : [[key, normalized]];
    }),
  );

const GOOS: Record<string, string> = { windows: "win", darwin: "osx", linux: "linux", ios: "ios", android: "android" };
const GOARCH: Record<string, string> = { amd64: "x64", "386": "x86", arm64: "arm64", arm: "arm", loong64: "loongarch64" };

function migrateV3(json: Json): Omit<RegistryManifest, "tooth" | "version"> {
  // every string of the manifest may use its top-level fields: `{{tooth}}`, `{{version}}`
  const model = Object.fromEntries(Object.entries(json).flatMap(([k, v]) => (typeof v === "string" || typeof v === "number" ? [[k, String(v)]] : [])));
  const r = (value: unknown) => render(str(value), model);
  const info = isObject(json["info"]) ? json["info"] : {};
  const variants: ManifestVariant[] = list(json["variants"])
    .filter(isObject)
    .map((v) => ({
      label: r(v["label"]),
      // lip reads a variant without a platform as one for any platform (format 1 and 2 have none: see toothToV4)
      ...(typeof v["platform"] === "string" ? { platform: r(v["platform"]) } : v["platform"] === undefined ? { platform: "" } : {}),
      dependencies: dependenciesOf(v["dependencies"], r),
      assets: list(v["assets"])
        .filter(isObject)
        .map((a) => ({ placements: list(a["placements"]).filter(isObject).map((p) => ({ dest: r(p["dest"]) })) })),
    }));
  return {
    info: { name: r(info["name"]), description: r(info["description"]), tags: strings(info["tags"]).map((t) => render(t, model)), avatar_url: r(info["avatar_url"]) },
    variants,
  };
}

/** Format 1 as format 2 (`MigrateV1ToV2`): information → info, placement → files, commands' platforms → platforms. */
function v1ToV2(json: Json): Json {
  const information = isObject(json["information"]) ? json["information"] : {};
  const dependencies = Object.fromEntries(
    Object.entries(isObject(json["dependencies"]) ? json["dependencies"] : {}).map(([key, groups]) => [
      key,
      list(groups)
        .map((group) => strings(group).join(" && "))
        .join(" || "),
    ]),
  );
  const platforms: Json[] = [];
  for (const command of list(json["commands"]).filter(isObject)) {
    const goos = str(command["GOOS"]);
    if (!goos) continue;
    const goarch = typeof command["GOARCH"] === "string" ? command["GOARCH"] : undefined;
    if (!platforms.some((p) => p["goos"] === goos && p["goarch"] === goarch)) platforms.push({ goos, ...(goarch ? { goarch } : {}) });
  }
  const placement = list(json["placement"]).filter(isObject);
  return {
    tooth: json["tooth"],
    version: json["version"],
    info: { name: str(information["name"]), description: str(information["description"]), tags: strings(information["tags"]) },
    dependencies,
    ...(placement.length || Array.isArray(json["placement"])
      ? { files: { place: placement.map((p) => ({ src: str(p["source"]), dest: str(p["destination"]).replace(/\*+$/, "") })) } }
      : {}),
    ...(platforms.length ? { platforms } : {}),
  };
}

/** Format 2 as format 3 (`MigrateV2ToV3`), or `null` for a platform lip does not know. */
function migrateV2(json: Json): Omit<RegistryManifest, "tooth" | "version"> | null {
  const model = { version: str(json["version"]), path: str(json["tooth"]), tooth: str(json["tooth"]) };
  const r = (value: unknown) => renderV2(str(value), model);
  const info = isObject(json["info"]) ? json["info"] : {};
  const placesOf = (files: unknown) => (isObject(files) && Array.isArray(files["place"]) ? files["place"].filter(isObject) : undefined);
  const placements = (places: Json[] | undefined) => (places ?? []).map((p) => ({ dest: r(p["dest"]) }));
  const variants: ManifestVariant[] = [];
  const platforms = list(json["platforms"]).filter(isObject);
  if (Array.isArray(json["platforms"])) {
    for (const p of platforms) {
      const os = GOOS[str(p["goos"])];
      const arch = p["goarch"] == null ? "*" : GOARCH[str(p["goarch"])];
      if (!os || !arch) return null;
      // lip places no files for a platform without an asset URL (the repository itself is the asset);
      // the site still reads where they would go, as evidence of what the package is (lib/listing.ts)
      variants.push({
        label: "",
        platform: `${os}-${arch}`,
        dependencies: dependenciesOf(p["dependencies"] ?? json["dependencies"], npmRange),
        assets: [{ placements: placements(placesOf(p["files"]) ?? placesOf(json["files"])) }],
      });
    }
  } else {
    const places = placesOf(json["files"]);
    variants.push({
      label: "",
      dependencies: dependenciesOf(json["dependencies"], npmRange),
      assets: json["asset_url"] != null || places ? [{ placements: placements(places) }] : [],
    });
  }
  return {
    info: { name: str(info["name"]), description: str(info["description"]), tags: strings(info["tags"]), avatar_url: r(info["avatar_url"]) },
    variants,
  };
}

/** A `tooth.json` in any format as the site reads it; `null`: not a manifest lip can read. */
export function migrateManifest(json: unknown): RegistryManifest | null {
  if (!isObject(json)) return null;
  const tooth = str(json["tooth"]);
  const version = str(json["version"]);
  if (!tooth || !version) return null;
  let manifest: Omit<RegistryManifest, "tooth" | "version"> | null;
  switch (json["format_version"]) {
    case 1:
      manifest = migrateV2(v1ToV2(json));
      break;
    case 2:
      manifest = migrateV2(json);
      break;
    case 3:
      manifest = migrateV3(json);
      break;
    default:
      return null;
  }
  return manifest && { tooth, version, ...manifest };
}

// ---------------------------------------------------------------------------
// tooth.json as a package file (lip v0.40's ToothMigrator, as far as the site
// uses it): each label is a variant, with an entry per side and platform.
// ---------------------------------------------------------------------------

/** The platforms launchers force (and the site lists): a variant for any platform has entries for each. */
export const FORCED_PLATFORMS: readonly string[] = ["win-x64", "win-arm64", "linux-x64", "linux-arm64", "android-arm64"];

/** The order pages list platforms in: {@link FORCED_PLATFORMS} first, in that order, then the others by name. */
export function comparePlatforms(a: string, b: string): number {
  const rank = (p: string) => {
    const i = FORCED_PLATFORMS.indexOf(p);
    return i < 0 ? FORCED_PLATFORMS.length : i;
  };
  return rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0);
}

/** What a format 1 or 2 manifest without platforms ran on: LeviLamina's only platform then. */
const LEGACY_PLATFORM = "win-x64";

export const LEVILAMINA_PATH = "github.com/liteldev/levilamina";

/** A dependency key's bare id (`github.com/o/r#client` → `github.com/o/r`) and variant. */
export function splitDependency(key: string): { id: string; variant: string } {
  const hash = key.indexOf("#");
  return hash < 0 ? { id: key, variant: "" } : { id: key.slice(0, hash), variant: key.slice(hash + 1) };
}

const isPattern = (platform: string) => /[*?[]/.test(platform);

/** A DotNet.Glob pattern (`win-*`, `linux-[ax]*`) as a regular expression. */
function globRegex(pattern: string): RegExp | null {
  let re = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]!;
    if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else if (c === "[") {
      const end = pattern.indexOf("]", i + 2);
      if (end < 0) return null;
      let body = pattern.slice(i + 1, end);
      const negate = body.startsWith("!");
      if (negate) body = body.slice(1);
      re += `[${negate ? "^" : ""}${body.replace(/[\\\]^]/g, "\\$&")}]`;
      i = end;
    } else re += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  try {
    return new RegExp(`^${re}$`);
  } catch {
    return null;
  }
}

/** The platforms a variant's `platform` stands for: itself, every forced one (`""`), or those a pattern matches. */
function platformsOf(platform: string | undefined): string[] {
  if (platform === undefined) return [LEGACY_PLATFORM];
  if (platform === "") return [...FORCED_PLATFORMS];
  if (!isPattern(platform)) return [platform];
  const re = globRegex(platform);
  return re ? FORCED_PLATFORMS.filter((p) => re.test(p)) : [];
}

/**
 * The sides of an entry, from its dependencies (lip's SidesOf): the client
 * when it depends on LeviLamina's variant `client`, the server when on
 * another variant of it, both when it does not depend on it (narrowed by
 * {@link narrowSides} where the registry is known).
 */
function sidesOf(deps: Record<string, string>): Side[] {
  const ll = Object.keys(deps).map(splitDependency).filter((d) => d.id.toLowerCase() === LEVILAMINA_PATH);
  if (!ll.length) return ["server", "client"];
  return ll.some((d) => d.variant === "client") ? ["client"] : ["server"];
}

/**
 * A `tooth.json` (as {@link migrateManifest} reads it) as the package file lip
 * v0.40 reads it as, for every forced platform — the way `lip migrate`
 * (ToothMigrator) would write it, answering its questions so:
 *
 * - each label is a variant; its variants that apply to a platform are merged
 *   (a platform where two of them declare the same dependency has no entries,
 *   as lip cannot install it there);
 * - a concrete platform is kept; `""` stands for every forced platform, a
 *   pattern for those it matches, and a format 1 or 2 manifest without
 *   platforms for `win-x64`;
 * - the sides come from LeviLamina's variant (see {@link sidesOf}); LeviLamina's
 *   own `client` variant is the client's, its others the server's;
 * - `avatar_url` is the logo when it is an `https://` URL.
 *
 * Unlike lip, assets of a type lip v0.40 cannot install (tar, tgz,
 * uncompressed) do not remove an entry: the site's model of a manifest does
 * not keep asset types (and the cache it is read from never had them).
 */
export function toothToV4(manifest: RegistryManifest): LipDoc {
  const labels = [...new Set(manifest.variants.map((v) => v.label))];
  const applies = (v: ManifestVariant, platform: string) =>
    v.platform === undefined
      ? platform === LEGACY_PLATFORM
      : v.platform === "" || v.platform === platform || (isPattern(v.platform) && !!globRegex(v.platform)?.test(platform));
  const merged = new Map<string, Map<string, { deps: Record<string, string>; dests: string[] }>>();
  const failed = new Set<string>();
  for (const label of labels) {
    const labeled = manifest.variants.filter((v) => v.label === label);
    const platforms = [...new Set(labeled.flatMap((v) => platformsOf(v.platform)))];
    const byPlatform = new Map<string, { deps: Record<string, string>; dests: string[] }>();
    for (const platform of platforms) {
      const deps: Record<string, string> = {};
      const dests: string[] = [];
      for (const v of labeled.filter((v) => applies(v, platform))) {
        for (const [key, range] of Object.entries(v.dependencies ?? {})) {
          if (key in deps) failed.add(platform);
          deps[key] = range;
        }
        for (const a of v.assets ?? []) for (const p of a.placements ?? []) dests.push(p.dest ?? "");
      }
      byPlatform.set(platform, { deps, dests });
    }
    merged.set(label, byPlatform);
  }
  const isLeviLamina = manifest.tooth.toLowerCase() === LEVILAMINA_PATH;
  const variants: Record<string, LipEntry[]> = {};
  for (const [label, byPlatform] of merged) {
    const entries: LipEntry[] = [];
    for (const [platform, { deps, dests }] of byPlatform) {
      // lip cannot merge them there, so it cannot read the manifest there at all
      if (failed.has(platform)) continue;
      const sides: Side[] = isLeviLamina ? [label === "client" ? "client" : "server"] : sidesOf(deps);
      for (const side of sides) entries.push({ side, platform, deps: { ...deps }, dests: [...dests] });
    }
    if (entries.length) variants[label] = entries;
  }
  const { name, description, tags, avatar_url } = manifest.info;
  return {
    id: manifest.tooth,
    version: manifest.version,
    info: { name, description, tags, ...(avatar_url?.startsWith("https://") ? { logo: avatar_url } : {}) },
    variants,
  };
}

/** The sides a dependency (`<id>[#<variant>]`) runs on; `undefined`: unknown (it constrains nothing). */
export type SideResolver = (key: string) => readonly Side[] | undefined;

/**
 * Narrows the sides of a `tooth.json`'s entries for both sides (those not
 * depending on LeviLamina) by what they depend on, transitively: an entry
 * depending on `X#v` runs only where X's variant v runs (a package
 * depending on GMLIB, a server library, is the server's). Several
 * dependencies narrow it to the sides all of them run on; when none would
 * remain, it is left as it was. lip's SidesOf looks at LeviLamina only.
 */
export function narrowSides(doc: LipDoc, resolve: SideResolver): LipDoc {
  const variants: Record<string, LipEntry[]> = {};
  for (const [name, entries] of Object.entries(doc.variants)) {
    variants[name] = entries.filter((entry) => {
      const twin = entries.some((e) => e !== entry && e.platform === entry.platform && e.side !== entry.side);
      if (!twin) return true;
      let sides: Side[] = ["server", "client"];
      for (const key of Object.keys(entry.deps)) {
        const of = resolve(key);
        if (of) sides = sides.filter((s) => of.includes(s));
      }
      return !sides.length || sides.includes(entry.side);
    });
  }
  return { ...doc, variants };
}

/** The sides of a package file's entries (server first). */
export function sidesIn(entries: Iterable<Pick<LipEntry, "side">>): Side[] {
  const all = new Set([...entries].map((e) => e.side));
  return (["server", "client"] as const).filter((s) => all.has(s));
}

/**
 * What a variant's entries run on (one version of it): their sides, their
 * platforms in the order pages list them, and the LeviLamina range they
 * depend on (several joined by ` || `).
 */
export function targetOf(entries: readonly Pick<LipEntry, "side" | "platform" | "deps">[]): VersionTarget {
  const ranges = new Set<string>();
  for (const e of entries) {
    for (const [key, range] of Object.entries(e.deps)) if (splitDependency(key).id.toLowerCase() === LEVILAMINA_PATH) ranges.add(range);
  }
  return {
    side: sidesIn(entries),
    platform: [...new Set(entries.map((e) => e.platform))].sort(comparePlatforms),
    ...(ranges.size ? { leviLamina: [...ranges].join(" || ") } : {}),
  };
}

/**
 * Whether a version's package file is a real `lip.toml` (lip v0.40's format 4),
 * not one derived from a `tooth.json` ({@link toothToV4}): its `manifestUrl`
 * ends in `/lip.toml`. That is what launchers key rule A2 on (the mod page's
 * `versions[i].format` says the same, but launchers read the URL). The site
 * itself knows the file a version was read from (`ManifestOrigin.file`) and
 * decides through {@link versionFormat}; `manifestUrl` ends in that file name
 * (lib/mods.ts getManifestUrl), so the two agree.
 */
export const isNativeFormat4 = (manifestUrl: string): boolean => /\/lip\.toml$/.test(manifestUrl);

/**
 * The format of a version read from `file`, as its mod page's JSON says it:
 * `{ format: 4 }` for a real `lip.toml`, nothing for a `tooth.json` (or when
 * unknown). The site's one place deciding "native format 4" from the file.
 */
export const versionFormat = (file: "lip.toml" | "tooth.json" | undefined): { format?: 4 } => (file === "lip.toml" ? { format: 4 } : {});

/**
 * The variant to install for a side (and a platform, when one is forced),
 * among those with an entry for it — rule A2 of the catalogue contract, shared
 * with LeviLauncher (internal/lipindex, frontend/src/utils/lipCatalog.ts) and
 * LeviLauncher-Android (core/packages/Catalog.java):
 *
 * - a native `lip.toml` version ({@link isNativeFormat4}): the default `""`,
 *   then `client`, then the others in alphabetical order — its `""` is the
 *   bare identity both sides install, `client` a legacy alias of it;
 * - a `tooth.json` version: `client`, then `""`, then the others (there, a
 *   label applies to any side, and `""` is usually the server's build).
 *
 * `undefined`: none has one.
 */
export function preferredVariant(
  variants: Record<string, readonly LipEntry[]>,
  side: Side,
  platform?: string,
  nativeFormat4 = false,
): string | undefined {
  const qualifying = Object.keys(variants).filter((name) => variants[name]!.some((e) => e.side === side && (platform === undefined || e.platform === platform)));
  const [first, second] = nativeFormat4 ? ["", "client"] : ["client", ""];
  const rank = (name: string) => (name === first ? 0 : name === second ? 1 : 2);
  return qualifying.sort((a, b) => rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0))[0];
}
