// A repository's `tooth.json` as the site reads it: the current format (3),
// or the older ones (1, 2) migrated the way `lip migrate` does
// (Lip.Core/Migration/PackageManifests in LiteLDev/lip), as far as the site
// uses them — info, and each variant's label, platform, dependencies and
// where its files go. Templates (`{{version}}`, `$(version)`) are filled in.
import type { Manifest, ManifestVariant } from "../types.ts";

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
      ...(typeof v["platform"] === "string" ? { platform: r(v["platform"]) } : {}),
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
