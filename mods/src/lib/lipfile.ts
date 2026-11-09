// A repository's `lip.toml` (format 4, lip v0.40) as the site reads it:
// parsed as TOML, every string rendered as a Scriban template with the whole
// document as its scope (lib/scriban.ts), then validated the way lip's
// PackageFileParser does, as far as the site uses the file — info, and each
// variant's entries: side, platform and dependencies, and where its files go.
// A file lip would reject is `null` here too: the tag has no package (lip
// never falls back to `tooth.json` when there is a `lip.toml`).
//
// That `id` is the repository's own address (in any case, or one GitHub
// serves it under) is checked where repositories are known (server/registry.ts).
import { parse as parseToml, TomlDate } from "smol-toml";
import type { LipDoc, LipEntry, LipInfo, Side } from "../types.ts";
import { renderDocument, TemplateError, TemplateNumber, TemplateObject, type TemplateValue } from "./scriban.ts";

/** The format of `lip.toml`. */
export const LIP_FORMAT = 4;

/** What lip v0.40 says of a file that uses the keys of an older lip. */
export const OLD_KEYS_MESSAGE =
  'uses the keys "platform" and "runtime" of lip before v0.40; rename "platform" to "side" and "runtime" to "platform"';

/** A .NET runtime identifier without wildcards (`win-x64`, `linux-musl-arm64`, `osx.13-arm64`). */
export const RID = /^[A-Za-z0-9_]+(?:[.-][A-Za-z0-9_]+)*$/;

/** A variant other than the default (`""`). */
export const VARIANT = /^[a-z0-9_]+(?:\/[a-z0-9_]+)?$/;

/** lip's (and lipr's) versions: semantic versions. */
export const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export const SIDES: readonly Side[] = ["server", "client"];

/**
 * A Go module path, as lip checks a package id (`golang.org/x/mod/module.CheckPath`):
 * a host name with a dot, then path elements; ASCII only.
 */
export function isModulePath(path: string): boolean {
  const elems = path.split("/");
  if (elems.some((e) => e === "" || e.startsWith(".") || e.endsWith(".")) || /\.\.|[^\x21-\x7e]/.test(path)) return false;
  const [first, ...rest] = elems;
  return !!first && first.includes(".") && !first.startsWith("-") && /^[a-z0-9.-]+$/.test(first) && rest.every((e) => /^[A-Za-z0-9._~+-]+$/.test(e));
}

/** A dependency key: `<package id>` or `<package id>#<variant>` (no `@ref` in a package file). */
export function isDependencyKey(key: string): boolean {
  const hash = key.indexOf("#");
  const id = hash < 0 ? key : key.slice(0, hash);
  return isModulePath(id) && (hash < 0 || VARIANT.test(key.slice(hash + 1)));
}

export type LipFileResult = { doc: LipDoc; error?: undefined } | { doc?: undefined; error: string };

class Invalid extends Error {}

const invalid = (path: string, reason: string) => new Invalid(`Invalid package file at ${path}: ${reason}.`);

/** A TOML value as a template value; dates and the floats inf and nan are not values lip reads. */
function fromToml(value: unknown, path: string): TemplateValue {
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return new TemplateNumber(value.toString());
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Invalid(`The value of ${path} is inf or nan, which JSON cannot represent`);
    return new TemplateNumber(String(value));
  }
  if (Array.isArray(value)) return value.map((v, i) => fromToml(v, `${path}[${i}]`));
  if (value && typeof value === "object" && !(value instanceof TomlDate)) {
    return new TemplateObject(Object.entries(value).map(([k, v]) => [k, fromToml(v, path ? `${path}.${k}` : k)]));
  }
  throw new Invalid(`The value of ${path} is a date or a time, which lip does not read`);
}

const describe = (v: TemplateValue | undefined) =>
  v instanceof TemplateObject ? "an object" : Array.isArray(v) ? "an array" : typeof v === "string" ? "a string" : v instanceof TemplateNumber ? "a number" : typeof v === "boolean" ? "a boolean" : "null";

function object(v: TemplateValue | undefined, path: string): TemplateObject {
  if (v instanceof TemplateObject) return v;
  throw invalid(path, `must be an object, not ${describe(v)}`);
}

function string(v: TemplateValue | undefined, path: string): string {
  if (typeof v === "string") return v;
  throw invalid(path, `must be a string, not ${describe(v)}`);
}

function array(v: TemplateValue | undefined, path: string, nonEmpty = false): TemplateValue[] {
  if (!Array.isArray(v)) throw invalid(path, `must be an array, not ${describe(v)}`);
  if (nonEmpty && !v.length) throw invalid(path, "must not be empty");
  return v;
}

function required(o: TemplateObject, key: string, path: string): TemplateValue {
  const v = o.get(key);
  if (v === undefined) throw invalid(`${path}.${key}`, "is required");
  return v;
}

function readInfo(v: TemplateValue, path: string): LipInfo {
  const o = object(v, path);
  const opt = (key: string) => o.get(key);
  const name = opt("name") === undefined ? "" : string(opt("name"), `${path}.name`);
  const description = opt("description") === undefined ? "" : string(opt("description"), `${path}.description`);
  const tags = opt("tags") === undefined ? [] : array(opt("tags"), `${path}.tags`).map((t, i) => string(t, `${path}.tags[${i}]`));
  const info: LipInfo = { name, description, tags };
  if (opt("logo") !== undefined) {
    const logo = string(opt("logo"), `${path}.logo`);
    if (!logo.startsWith("https://")) throw invalid(`${path}.logo`, `'${logo}' does not start with "https://"`);
    info.logo = logo;
  }
  return info;
}

/** Where an entry's assets put files (an mcmod asset goes where the loader loads mods from). */
function readDests(v: TemplateValue | undefined, path: string): string[] {
  if (v === undefined) return [];
  const dests: string[] = [];
  let mcmods = 0;
  array(v, path).forEach((a, i) => {
    const asset = object(a, `${path}[${i}]`);
    const type = string(required(asset, "type", `${path}[${i}]`), `${path}[${i}].type`);
    if (type === "mcmod") {
      if (asset.get("place") !== undefined) throw invalid(`${path}[${i}].place`, 'is not allowed for an asset of type "mcmod"');
      if (++mcmods > 1) throw invalid(path, 'has more than one asset of type "mcmod"');
      dests.push("mods/");
    } else if (type === "self" || type === "zip") {
      if (type === "zip") array(required(asset, "urls", `${path}[${i}]`), `${path}[${i}].urls`, true);
      const place = asset.get("place");
      if (place !== undefined) {
        array(place, `${path}[${i}].place`).forEach((p, j) => {
          const at = `${path}[${i}].place[${j}]`;
          const placement = object(p, at);
          string(required(placement, "src", at), `${at}.src`);
          dests.push(string(required(placement, "dest", at), `${at}.dest`));
        });
      }
    } else {
      throw invalid(`${path}[${i}].type`, 'must be "self", "zip" or "mcmod"');
    }
  });
  return dests;
}

function readEntry(v: TemplateValue, path: string): LipEntry {
  const o = object(v, path);
  // before the keys are read: a file of an older lip fails with what to rename, not with "side is required"
  const platform = o.get("platform");
  if (o.get("runtime") !== undefined || platform === "server" || platform === "client") throw new Invalid(`The package file ${OLD_KEYS_MESSAGE}`);
  const dests = readDests(o.get("assets"), `${path}.assets`);
  const side = required(o, "side", path);
  if (side !== "server" && side !== "client") throw invalid(`${path}.side`, 'must be "server" or "client"');
  const rid = string(required(o, "platform", path), `${path}.platform`);
  if (!RID.test(rid)) throw invalid(`${path}.platform`, `'${rid}' is not a runtime identifier`);
  const deps: Record<string, string> = {};
  const depsValue = o.get("deps");
  if (depsValue !== undefined) {
    for (const [key, range] of object(depsValue, `${path}.deps`).members) {
      const at = `${path}.deps["${key}"]`;
      if (!isDependencyKey(key)) throw invalid(at, `'${key}' is not <package id> or <package id>#<variant>`);
      const text = string(range, at);
      if (!text.trim()) throw invalid(at, `'${text}' is not a version range`);
      deps[key] = text;
    }
  }
  return { side, platform: rid, deps, dests };
}

/** Validates a rendered package file (protocol/package.md §3, lip.schema.toml), in lip's order. */
function readDocument(root: TemplateValue): LipDoc {
  const o = object(root, "$");
  const format = o.get("format");
  const n = format instanceof TemplateNumber && /^-?\d+$/.test(format.text) ? Number(format.text) : null;
  if (n !== null && n > LIP_FORMAT) throw new Invalid(`The package file has "format": ${n}, a format this lip does not know`);
  if (n !== LIP_FORMAT) throw invalid("$.format", `must be ${LIP_FORMAT}`);
  const id = string(required(o, "id", "$"), "$.id");
  if (!isModulePath(id)) throw invalid("$.id", `'${id}' is not a valid Go module path`);
  const version = string(required(o, "version", "$"), "$.version");
  if (!SEMVER.test(version)) throw invalid("$.version", `'${version}' is not a version`);
  const infoValue = o.get("info");
  const info = infoValue === undefined ? { name: "", description: "", tags: [] } : readInfo(infoValue, "$.info");
  const variants: Record<string, LipEntry[]> = {};
  for (const [name, value] of object(required(o, "variants", "$"), "$.variants").members) {
    const path = `$.variants["${name}"]`;
    if (name !== "" && !VARIANT.test(name)) throw invalid(path, `'${name}' is not a variant`);
    const entries = array(value, path, true).map((e, i) => readEntry(e, `${path}[${i}]`));
    entries.forEach((e, i) => {
      const j = entries.findIndex((f) => f.side === e.side && f.platform === e.platform);
      if (j < i) throw invalid(`${path}[${i}]`, `has the side and the platform of ${path}[${j}]`);
    });
    variants[name] = entries;
  }
  return { id, version, info, variants };
}

/** A TOML file as the JSON value lip reads it as (dates, inf and nan are not values); throws when it is not one. */
export function readToml(text: string): TemplateValue {
  return fromToml(parseToml(text.replace(/^\uFEFF/, ""), { integersAsBigInt: "asNeeded" }), "");
}

/** A `lip.toml` as the site reads it, or why lip would not read it. */
export function parseLipToml(text: string): LipFileResult {
  let root: TemplateValue;
  try {
    root = readToml(text);
  } catch (error) {
    return { error: `The lip.toml is not a valid TOML file of the kind lip reads: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}` };
  }
  try {
    root = renderDocument(root);
  } catch (error) {
    if (error instanceof TemplateError) return { error: `The lip.toml has a template that cannot be rendered: ${error.message}` };
    throw error;
  }
  try {
    return { doc: readDocument(root) };
  } catch (error) {
    if (error instanceof Invalid) return { error: error.message };
    throw error;
  }
}
