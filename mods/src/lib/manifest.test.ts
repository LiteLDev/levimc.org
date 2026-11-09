import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { gunzipSync } from "node:zlib";
import { parse as parseToml } from "smol-toml";
import type { LipDoc } from "../types.ts";
import { installsMod } from "./listing.ts";
import { comparePlatforms, migrateManifest, narrowSides, preferredVariant, targetOf, toothToV4, type RegistryManifest } from "./manifest.ts";

test("format 3 is read as it is, its templates filled in", () => {
  const manifest = migrateManifest({
    format_version: 3,
    tooth: "github.com/o/M",
    version: "1.2.0",
    info: { name: "M", description: "d", tags: ["type:mod", 1], avatar_url: "https://{{tooth}}/raw/v{{version}}/icon.png" },
    variants: [
      { label: "client", platform: "win-x64", dependencies: { "github.com/LiteLDev/LeviLamina": "1.*" }, assets: [{ type: "zip", placements: [{ dest: "mods/M/" }] }] },
      { dependencies: {} },
    ],
  });
  assert.deepEqual(manifest, {
    tooth: "github.com/o/M",
    version: "1.2.0",
    info: { name: "M", description: "d", tags: ["type:mod"], avatar_url: "https://github.com/o/M/raw/v1.2.0/icon.png" },
    variants: [
      { label: "client", platform: "win-x64", dependencies: { "github.com/LiteLDev/LeviLamina": "1.*" }, assets: [{ placements: [{ dest: "mods/M/" }] }] },
      { label: "", platform: "", dependencies: {}, assets: [] },
    ],
  });
});

test("format 2 is migrated as lip does: platforms become variants, `x` ranges `*`", () => {
  // LeviLamina 0.9.0, as lipr has it after `lip migrate`
  const manifest = migrateManifest({
    format_version: 2,
    tooth: "github.com/LiteLDev/LeviLamina",
    version: "0.9.0",
    info: { name: "LeviLamina", description: "d", author: "LiteLDev", tags: [] },
    asset_url: "https://github.com/LiteLDev/LeviLamina/releases/download/v$(version)/levilamina-release-windows-x64.zip",
    dependencies: { "github.com/LiteLDev/bds": "1.20.62", "github.com/LiteLDev/CrashLogger": "1.1.x", "github.com/LiteLDev/levilamina-loc": "0.x" },
    files: { place: [{ src: "LeviLamina.dll", dest: "LeviLamina.dll" }] },
    platforms: [{ goos: "windows", goarch: "amd64" }],
  });
  assert.deepEqual(manifest?.variants, [
    {
      label: "",
      platform: "win-x64",
      dependencies: { "github.com/LiteLDev/bds": "1.20.62", "github.com/LiteLDev/CrashLogger": "1.1.*", "github.com/LiteLDev/levilamina-loc": "0.*" },
      assets: [{ placements: [{ dest: "LeviLamina.dll" }] }],
    },
  ]);
  assert.deepEqual(manifest?.info, { name: "LeviLamina", description: "d", tags: [], avatar_url: "" });
  // a range lip cannot read is left out; a platform it does not know fails the whole manifest
  const wild = migrateManifest({ format_version: 2, tooth: "t", version: "1.0.0", info: {}, dependencies: { a: ">=0.10.*", b: ">=1.0.0" } });
  assert.deepEqual(wild?.variants[0]?.dependencies, { b: ">=1.0.0" });
  assert.equal(migrateManifest({ format_version: 2, tooth: "t", version: "1.0.0", info: {}, platforms: [{ goos: "plan9" }] }), null);
});

test("format 2's files tell what a package is, for the whole package or per platform", () => {
  // Organization: files for the whole package
  const whole = migrateManifest({ format_version: 2, tooth: "t", version: "1.0.0", info: { name: "O" }, files: { place: [{ src: "./*", dest: "plugins/Organization/" }] } });
  assert.equal(whole && installsMod(toothToV4(whole)), true);
  // lualoader: a program, per platform (no asset URL: lip places nothing, the site still reads where it would go)
  const program = migrateManifest({
    format_version: 2,
    tooth: "t",
    version: "1.0.0",
    info: { name: "lualoader" },
    platforms: [{ goos: "windows", files: { place: [{ src: "lualoader.exe", dest: "lualoader.exe" }] } }],
  });
  assert.equal(program?.variants[0]?.platform, "win-*");
  assert.equal(program && installsMod(toothToV4(program)), false);
  // HitokotoWelcome: no files, so nothing to tell by
  const bare = migrateManifest({ format_version: 2, tooth: "t", version: "1.0.0", info: { name: "H", tags: ["lse"] }, files: {} });
  assert.equal(bare && installsMod(toothToV4(bare)), null);
});

test("format 1 is migrated through format 2", () => {
  const manifest = migrateManifest({
    format_version: 1,
    tooth: "github.com/o/Old",
    version: "0.1.0",
    information: { name: "Old", description: "d", tags: ["lse"] },
    dependencies: { "github.com/LiteLDev/LiteLoaderBDS": [[">=2.9.0"], ["2.8.x"]] },
    placement: [{ source: "Old.js", destination: "plugins/Old.js*" }],
  });
  assert.deepEqual(manifest, {
    tooth: "github.com/o/Old",
    version: "0.1.0",
    info: { name: "Old", description: "d", tags: ["lse"], avatar_url: "" },
    variants: [{ label: "", dependencies: { "github.com/LiteLDev/LiteLoaderBDS": ">=2.9.0 || 2.8.*" }, assets: [{ placements: [{ dest: "plugins/Old.js" }] }] }],
  });
});

test("what is not a manifest lip can read", () => {
  assert.equal(migrateManifest("404: Not Found"), null);
  assert.equal(migrateManifest({ format_version: 3, variants: [] }), null);
  assert.equal(migrateManifest({ format_version: 4, tooth: "t", version: "1.0.0" }), null);
});

const tooth = (variants: object[], extra: object = {}): RegistryManifest =>
  migrateManifest({ format_version: 3, tooth: "github.com/o/M", version: "1.0.0", info: { name: "M", tags: [] }, variants, ...extra })!;

/** A package file's entries as `variant side platform`. */
const entries = (doc: LipDoc) => Object.entries(doc.variants).flatMap(([name, list]) => list.map((e) => `${name} ${e.side} ${e.platform}`));

test("tooth.json as a package file: labels are variants, LeviLamina's variant the side", () => {
  const doc = toothToV4(
    tooth(
      [
        { label: "", platform: "win-x64", dependencies: { "github.com/LiteLDev/LeviLamina": "1.*" }, assets: [{ placements: [{ dest: "plugins/M/" }] }] },
        { label: "client", platform: "win-x64", dependencies: { "github.com/LiteLDev/LeviLamina#client": "1.*" } },
        { label: "lib", platform: "win-x64", dependencies: { "github.com/o/Other": "2.*" } },
      ],
      { info: { name: "M", description: "d", tags: ["t"], avatar_url: "https://{{tooth}}/logo.png" } },
    ),
  );
  assert.deepEqual(entries(doc), [" server win-x64", "client client win-x64", "lib server win-x64", "lib client win-x64"]);
  assert.deepEqual(doc.variants[""], [{ side: "server", platform: "win-x64", deps: { "github.com/LiteLDev/LeviLamina": "1.*" }, dests: ["plugins/M/"] }]);
  assert.deepEqual(doc.info, { name: "M", description: "d", tags: ["t"], logo: "https://github.com/o/M/logo.png" });
  // only an https:// avatar is a logo
  assert.equal(toothToV4(tooth([], { info: { name: "M", avatar_url: "http://x/logo.png" } })).info.logo, undefined);
});

test("tooth.json as a package file: a variant for any platform has an entry for each forced platform", () => {
  const platforms = (variants: object[]) => [...new Set(Object.values(toothToV4(tooth(variants)).variants).flat().map((e) => e.platform))];
  assert.deepEqual(platforms([{ platform: "" }]), ["win-x64", "win-arm64", "linux-x64", "linux-arm64", "android-arm64"]);
  assert.deepEqual(platforms([{ platform: "win-*" }]), ["win-x64", "win-arm64"]);
  assert.deepEqual(platforms([{ platform: "linux-[ax]*" }]), ["linux-x64", "linux-arm64"]);
  assert.deepEqual(platforms([{ platform: "osx-arm64" }]), ["osx-arm64"]);
  // format 1 and 2 without platforms: what LeviLamina ran on then
  const legacy = migrateManifest({ format_version: 2, tooth: "github.com/o/M", version: "1.0.0", info: {}, files: { place: [{ src: "a", dest: "plugins/a" }] } })!;
  assert.deepEqual(entries(toothToV4(legacy)), [" server win-x64", " client win-x64"]);
});

test("tooth.json as a package file: variants that apply to a platform are merged; one where they cannot be has none", () => {
  const doc = toothToV4(
    tooth([
      { platform: "", dependencies: { "github.com/o/A": "1" } },
      { platform: "win-x64", dependencies: { "github.com/o/B": "1" } },
      { platform: "linux-*", dependencies: { "github.com/o/A": "2" } },
    ]),
  );
  const at = (platform: string) => doc.variants[""]!.find((e) => e.platform === platform)?.deps;
  assert.deepEqual(at("win-x64"), { "github.com/o/A": "1", "github.com/o/B": "1" });
  assert.deepEqual(at("win-arm64"), { "github.com/o/A": "1" });
  // github.com/o/A twice: lip cannot install it there
  assert.equal(at("linux-x64"), undefined);
});

test("tooth.json as a package file: LeviLamina's own variants are the sides", () => {
  const ll = toothToV4({ ...tooth([{ platform: "win-x64" }, { label: "client", platform: "win-x64" }]), tooth: "github.com/LiteLDev/LeviLamina" });
  assert.deepEqual(entries(ll), [" server win-x64", "client client win-x64"]);
});

test("sides narrowed through dependencies: a mod runs only where all it depends on runs", () => {
  const doc = toothToV4(
    tooth([
      { platform: "win-x64", dependencies: { "github.com/o/ServerLib": "1" } },
      { label: "js", platform: "win-x64", dependencies: { "github.com/o/LSE#client_js": "1", "github.com/o/Unknown": "1" } },
      { label: "both", platform: "win-x64", dependencies: { "github.com/o/ServerLib": "1", "github.com/o/LSE#client_js": "1" } },
      { label: "free", platform: "win-x64" },
    ]),
  );
  const sides: Record<string, ("server" | "client")[]> = { "github.com/o/ServerLib": ["server"], "github.com/o/LSE#client_js": ["client"] };
  assert.deepEqual(entries(narrowSides(doc, (key) => sides[key])), [
    " server win-x64",
    "js client win-x64",
    // contradictory: left as it was
    "both server win-x64",
    "both client win-x64",
    "free server win-x64",
    "free client win-x64",
  ]);
});

test("the variant to install: client, then the default, then the others; for the side (and the platform) asked", () => {
  const entry = (side: "server" | "client", platform = "win-x64") => ({ side, platform, deps: {}, dests: [] });
  const variants = { b: [entry("server")], "": [entry("server"), entry("client", "linux-x64")], client: [entry("client")], a: [entry("server", "linux-x64")] };
  assert.equal(preferredVariant(variants, "server"), "");
  assert.equal(preferredVariant(variants, "client"), "client");
  assert.equal(preferredVariant(variants, "client", "linux-x64"), "");
  assert.equal(preferredVariant(variants, "server", "linux-x64"), "a");
  assert.equal(preferredVariant(variants, "server", "android-arm64"), undefined);
  assert.equal(preferredVariant({ client: [entry("server")], "": [entry("server")] }, "server"), "client");
});

// testdata/derive.jsonl.gz is LeviLauncher's (internal/lipcore/compat/testdata), its package files rewritten for lip
// v0.40's keys: what lip derives from a tooth.json for one side and platform. The variants and dependencies the site
// reads for that platform are lip's (for format 3; the site's own migration of formats 1 and 2 is lipr's, see above).
test("tooth.json as a package file: lip's variants and dependencies, platform by platform (LeviLauncher's golden cases)", () => {
  const rows = gunzipSync(readFileSync(new URL("./testdata/derive.jsonl.gz", import.meta.url)))
    .toString("utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l) as { name: string; tooth: string; results: { side: string; platform: string; tag?: string; toml?: string }[] });
  let compared = 0;
  for (const row of rows) {
    let json: { format_version?: unknown; variants?: { assets?: { type?: string }[] }[] } | null;
    try {
      json = JSON.parse(row.tooth);
    } catch {
      continue;
    }
    // lip v0.40 cannot install tar, tgz or uncompressed assets: the site does not tell (see toothToV4)
    if (json?.format_version !== 3 || json.variants?.some((v) => v?.assets?.some((a) => a && a.type !== "zip" && a.type !== "self"))) continue;
    const manifest = migrateManifest(json);
    for (const result of row.results) {
      if (result.tag || !result.toml || !manifest) continue;
      const want = parseToml(result.toml) as { variants?: Record<string, { deps?: Record<string, string> }[]> };
      const doc = toothToV4(manifest);
      const got = Object.fromEntries(
        Object.entries(doc.variants).flatMap(([name, list]) => {
          const e = list.find((e) => e.platform === result.platform);
          return e ? [[name, Object.keys(e.deps)]] : [];
        }),
      );
      assert.deepEqual(got, Object.fromEntries(Object.entries(want.variants ?? {}).map(([name, list]) => [name, Object.keys(list[0]!.deps ?? {})])), `${row.name} ${result.platform}`);
      compared++;
    }
  }
  assert.ok(compared > 700, `${compared} compared`);
});

test("comparePlatforms: the launchers' platforms first, in their order, then the others by name", () => {
  assert.deepEqual(
    ["osx-arm64", "android-arm64", "linux-x64", "win-x64", "linux-musl-x64", "win-arm64"].sort(comparePlatforms),
    ["win-x64", "win-arm64", "linux-x64", "android-arm64", "linux-musl-x64", "osx-arm64"],
  );
});

test("targetOf: a variant's sides, platforms and LeviLamina range", () => {
  const LL = "github.com/LiteLDev/LeviLamina";
  assert.deepEqual(
    targetOf([
      { side: "client", platform: "win-x64", deps: { [`${LL}#client`]: "1.5.*" } },
      { side: "server", platform: "linux-x64", deps: { [LL]: "1.5.*" } },
      { side: "server", platform: "win-x64", deps: { [LL]: ">=1.5.0" } },
    ]),
    { side: ["server", "client"], platform: ["win-x64", "linux-x64"], leviLamina: "1.5.* || >=1.5.0" },
  );
  assert.deepEqual(targetOf([{ side: "server", platform: "win-x64", deps: {} }]), { side: ["server"], platform: ["win-x64"] });
});
