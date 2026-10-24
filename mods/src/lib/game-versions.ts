// Which Minecraft versions a mod runs on, for the Game Version filter.
// Nothing in lipr says so directly: LeviLamina's versions depend on a `bds`
// version, and every other mod reaches LeviLamina through its
// dependency ranges (directly, or through LegacyScriptEngine and the like).
// Resolved at build time from levilauncher.json.

/** levilauncher.json: every version's dependencies, per variant. */
export interface LauncherIndex {
  packages: Record<string, { variants: Record<string, { versions: Record<string, { dependencies?: Record<string, string> }> }> }>;
}

const LEVILAMINA = "github.com/liteldev/levilamina";
const BDS = "github.com/liteldev/bds";

interface Version {
  nums: number[];
  pre: string;
}

function parse(version: string): Version | null {
  const m = /^v?(\d+(?:\.\d+)*)(?:-([0-9A-Za-z.-]+))?(?:\+.*)?$/.exec(version.trim());
  if (!m) return null;
  return { nums: m[1]!.split(".").map(Number), pre: m[2] ?? "" };
}

function comparePre(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const pa = a.split(".");
  const pb = b.split(".");
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i];
    const y = pb[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const nx = /^\d+$/.test(x) ? Number(x) : NaN;
    const ny = /^\d+$/.test(y) ? Number(y) : NaN;
    const d = !Number.isNaN(nx) && !Number.isNaN(ny) ? nx - ny : x < y ? -1 : x > y ? 1 : 0;
    if (d) return d;
  }
  return 0;
}

/** Semver-like order; unparsable versions sort first. */
export function compareVersions(a: string, b: string): number {
  const va = parse(a);
  const vb = parse(b);
  if (!va || !vb) return va ? 1 : vb ? -1 : a.localeCompare(b);
  for (let i = 0; i < Math.max(va.nums.length, vb.nums.length); i++) {
    const d = (va.nums[i] ?? 0) - (vb.nums[i] ?? 0);
    if (d) return d;
  }
  return comparePre(va.pre, vb.pre);
}

/** One comparator of a range: `1.2.*`, `>=1.2.0`, `<2.0.0`, `1.2.3`. */
function satisfiesOne(version: string, comparator: string): boolean {
  const m = /^(>=|<=|>|<|=|\^|~)?\s*(.+)$/.exec(comparator);
  if (!m) return false;
  const [, op = "", target] = m;
  if (target === "*" || target === "x") return true;
  if (/[*x]$/i.test(target!)) {
    const prefix = target!.replace(/\.?[*x]$/i, "").split(".").filter(Boolean).map(Number);
    const v = parse(version);
    return !!v && prefix.every((n, i) => v.nums[i] === n);
  }
  const d = compareVersions(version, target!);
  switch (op) {
    case ">=":
      return d >= 0;
    case "<=":
      return d <= 0;
    case ">":
      return d > 0;
    case "<":
      return d < 0;
    case "^": {
      const t = parse(target!);
      const v = parse(version);
      return !!t && !!v && d >= 0 && v.nums[0] === t.nums[0];
    }
    case "~": {
      const t = parse(target!);
      const v = parse(version);
      return !!t && !!v && d >= 0 && v.nums[0] === t.nums[0] && v.nums[1] === t.nums[1];
    }
    default:
      return d === 0;
  }
}

/** A lip version range: comparators joined by spaces (AND) and `||` (OR). */
export function satisfies(version: string, range: string): boolean {
  return range.split("||").some((part) => {
    const comparators = part.trim().split(/\s+/).filter(Boolean);
    return comparators.length > 0 && comparators.every((c) => satisfiesOne(version, c));
  });
}

/**
 * The game versions a `bds` range names: each exact version (`1.20.50 ||
 * 1.20.51`), or the lower bound of an interval (`>=1.21.0 <1.21.10`), without
 * build suffixes (`1.21.132-patch.3` → `1.21.132`).
 */
export function bdsVersions(range: string): string[] {
  const out = new Set<string>();
  for (const part of range.split("||")) {
    const first = part.trim().split(/\s+/)[0] ?? "";
    const m = /^(?:>=|=)?\s*(\d+(?:\.\d+)+)/.exec(first);
    if (m) out.add(m[1]!);
  }
  return [...out];
}

const toothOf = (key: string) => key.split("#")[0]!.toLowerCase();
const variantOf = (key: string) => key.split("#")[1] ?? "";

/**
 * Every mod's game versions (lower-case tooth → versions, newest first),
 * over all of its versions and variants.
 */
export function resolveGameVersions(launcher: LauncherIndex): Map<string, string[]> {
  const mods = new Map(Object.entries(launcher.packages).map(([t, p]) => [t.toLowerCase(), p]));

  // LeviLamina version → game versions, from the server variant's `bds` dependency.
  const leviLamina = new Map<string, string[]>();
  for (const variant of Object.values(mods.get(LEVILAMINA)?.variants ?? {})) {
    for (const [version, { dependencies }] of Object.entries(variant.versions)) {
      const key = Object.keys(dependencies ?? {}).find((k) => toothOf(k) === BDS);
      if (key && !leviLamina.has(version)) leviLamina.set(version, bdsVersions(dependencies![key]!));
    }
  }

  const memo = new Map<string, Set<string>>();
  const visiting = new Set<string>();

  function ofVersion(tooth: string, variant: string, version: string): Set<string> {
    const id = `${tooth}#${variant}@${version}`;
    const cached = memo.get(id);
    if (cached) return cached;
    const out = new Set<string>();
    if (tooth === LEVILAMINA) {
      for (const v of leviLamina.get(version) ?? []) out.add(v);
      memo.set(id, out);
      return out;
    }
    if (visiting.has(id)) return out;
    visiting.add(id);
    const deps = mods.get(tooth)?.variants[variant]?.versions[version]?.dependencies ?? {};
    for (const [key, range] of Object.entries(deps)) {
      const depTooth = toothOf(key);
      if (depTooth === tooth) continue;
      const depVariant = variantOf(key);
      const versions = depTooth === LEVILAMINA ? [...leviLamina.keys()] : Object.keys(mods.get(depTooth)?.variants[depVariant]?.versions ?? {});
      for (const v of versions) {
        if (satisfies(v, range)) for (const g of ofVersion(depTooth, depVariant, v)) out.add(g);
      }
    }
    visiting.delete(id);
    memo.set(id, out);
    return out;
  }

  const result = new Map<string, string[]>();
  for (const [tooth, mod] of mods) {
    const all = new Set<string>();
    for (const [variant, { versions }] of Object.entries(mod.variants)) {
      for (const version of Object.keys(versions)) for (const g of ofVersion(tooth, variant, version)) all.add(g);
    }
    result.set(tooth, [...all].sort((a, b) => compareVersions(b, a)));
  }
  return result;
}
