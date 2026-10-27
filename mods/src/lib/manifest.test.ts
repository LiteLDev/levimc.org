import assert from "node:assert/strict";
import { test } from "node:test";
import { installsMod } from "./listing.ts";
import { migrateManifest } from "./manifest.ts";

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
      { label: "", dependencies: {}, assets: [] },
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
  assert.equal(whole && installsMod(whole), true);
  // lualoader: a program, per platform (no asset URL: lip places nothing, the site still reads where it would go)
  const program = migrateManifest({
    format_version: 2,
    tooth: "t",
    version: "1.0.0",
    info: { name: "lualoader" },
    platforms: [{ goos: "windows", files: { place: [{ src: "lualoader.exe", dest: "lualoader.exe" }] } }],
  });
  assert.equal(program?.variants[0]?.platform, "win-*");
  assert.equal(program && installsMod(program), false);
  // HitokotoWelcome: no files, so nothing to tell by
  const bare = migrateManifest({ format_version: 2, tooth: "t", version: "1.0.0", info: { name: "H", tags: ["lse"] }, files: {} });
  assert.equal(bare && installsMod(bare), null);
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
