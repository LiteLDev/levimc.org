import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyListings, installsMod, manifestOf, type ListingInput } from "./listing.ts";
import type { Manifest } from "../types.ts";

const manifest = (dests: string[], deps: Record<string, string> = {}): Manifest => ({
  info: { name: "", description: "", tags: [] },
  variants: [{ label: "", dependencies: deps, assets: [{ placements: dests.map((dest) => ({ dest })) }] }],
});

const mod = (tooth: string, extra: Partial<ListingInput> = {}): ListingInput => ({
  tooth,
  manifest: manifest([`plugins/${tooth.split("/").at(-1)}/`]),
  updated: "2026-01-01T00:00:00Z",
  ...extra,
});

const repo = (path: string, extra: { isTemplate?: boolean; latestRelease?: string } = {}) => ({
  url: `https://github.com/${path}`,
  isTemplate: false,
  ...extra,
});

const statuses = (inputs: ListingInput[]) => Object.fromEntries(classifyListings(inputs));

test("a mod puts a file under plugins/ or mods/", () => {
  assert.equal(installsMod(manifest(["plugins/X/"])), true);
  assert.equal(installsMod(manifest(["mods/X/"])), true);
  assert.equal(installsMod(manifest(["./mods/X/"])), true);
  assert.equal(installsMod(manifest(["mods\\X\\"])), true);
  // one placement in a mod folder is enough (Glacie also ships libraries/)
  assert.equal(installsMod(manifest(["libraries/x.dll", "plugins/X/"])), true);
  // images (Lip-Sese), a launcher script (LeviBox), a program (lualoader), nothing at all
  assert.equal(installsMod(manifest(["photo/"])), false);
  assert.equal(installsMod(manifest(["levibox"])), false);
  assert.equal(installsMod(manifest(["lualoader.exe"])), false);
  assert.equal(installsMod(manifest(["pluginsX/"])), false);
  assert.equal(installsMod({ info: { name: "", description: "", tags: [] }, variants: [{ label: "" }] }), false);
});

test("what installs nothing into a mod folder is excluded; without a manifest nothing is judged", () => {
  assert.deepEqual(
    statuses([
      mod("github.com/a/Images", { manifest: manifest(["photo/"]) }),
      mod("github.com/a/Empty", { manifest: { info: { name: "", description: "", tags: [] }, variants: [{ label: "" }] } }),
      mod("github.com/a/Unknown", { manifest: null }),
      mod("github.com/a/Mod"),
    ]),
    {
      "github.com/a/Images": { status: "excluded", reason: "not-a-mod" },
      "github.com/a/Empty": { status: "excluded", reason: "not-a-mod" },
      "github.com/a/Unknown": { status: "listed" },
      "github.com/a/Mod": { status: "listed" },
    },
  );
});

test("templates are excluded: GitHub's flag, or the repository's name", () => {
  assert.deepEqual(
    statuses([
      mod("github.com/LiteLDev/levilamina-mod-template", { repo: repo("LiteLDev/levilamina-mod-template", { isTemplate: true }) }),
      mod("github.com/x/MyPlugin", { repo: repo("x/MyPlugin", { isTemplate: true }) }),
      mod("github.com/x/lualoader-plugin-demo"),
      mod("github.com/x/old-name", { repo: repo("x/plugin-example") }),
      mod("github.com/x/test"),
      // only the end of the name counts, and only as a word of it
      mod("github.com/x/TemplateEngine"),
      mod("github.com/x/Contest"),
    ]),
    {
      "github.com/LiteLDev/levilamina-mod-template": { status: "excluded", reason: "template" },
      "github.com/x/MyPlugin": { status: "excluded", reason: "template" },
      "github.com/x/lualoader-plugin-demo": { status: "excluded", reason: "template" },
      "github.com/x/old-name": { status: "excluded", reason: "template" },
      "github.com/x/test": { status: "excluded", reason: "template" },
      "github.com/x/TemplateEngine": { status: "listed" },
      "github.com/x/Contest": { status: "listed" },
    },
  );
});

test("the loader and what it depends on are unlisted; mods that depend on it are not", () => {
  const ll = mod("github.com/LiteLDev/LeviLamina", {
    manifest: manifest(["plugins/LeviLamina/"], { "github.com/LiteLDev/CrashLogger#client": "1.*", "github.com/LiteLDev/bds": "1.26" }),
  });
  assert.deepEqual(
    statuses([
      ll,
      mod("github.com/LiteLDev/CrashLogger", { manifest: manifest(["plugins/CrashLogger/"], { "github.com/x/Runtime": "1" }) }),
      mod("github.com/x/Runtime"),
      mod("github.com/x/Mod", { manifest: manifest(["plugins/Mod/"], { "github.com/LiteLDev/LeviLamina": "1.*" }) }),
    ]),
    {
      "github.com/LiteLDev/LeviLamina": { status: "unlisted", reason: "platform" },
      "github.com/LiteLDev/CrashLogger": { status: "unlisted", reason: "platform" },
      "github.com/x/Runtime": { status: "unlisted", reason: "platform" },
      "github.com/x/Mod": { status: "listed" },
    },
  );
});

test("one repository under several tooths is listed once, under the name GitHub serves it as", () => {
  assert.deepEqual(
    statuses([
      // renamed: the old tooth redirects to the new one
      mod("github.com/lwenk/Stats", { repo: repo("LeafKnife/Stats", { latestRelease: "2026-09-01T00:00:00Z" }) }),
      mod("github.com/lwenk/LK-Stats", { repo: repo("LeafKnife/Stats") }),
      mod("github.com/LeafKnife/Stats", { repo: repo("LeafKnife/Stats") }),
      // differing in case only: the exact spelling wins
      mod("github.com/lgc-LLDev/NbsPlayer", { repo: repo("lgc-LLDev/NBSPlayer") }),
      mod("github.com/lgc-LLDev/NBSPlayer", { repo: repo("lgc-LLDev/NBSPlayer") }),
      // renamed, the new name not in the index: listed under the old one
      mod("github.com/x/OldName", { repo: repo("x/NewName") }),
    ]),
    {
      "github.com/lwenk/Stats": { status: "unlisted", reason: "duplicate", canonical: "github.com/LeafKnife/Stats" },
      "github.com/lwenk/LK-Stats": { status: "unlisted", reason: "duplicate", canonical: "github.com/LeafKnife/Stats" },
      "github.com/LeafKnife/Stats": { status: "listed" },
      "github.com/lgc-LLDev/NbsPlayer": { status: "unlisted", reason: "duplicate", canonical: "github.com/lgc-LLDev/NBSPlayer" },
      "github.com/lgc-LLDev/NBSPlayer": { status: "listed" },
      "github.com/x/OldName": { status: "listed" },
    },
  );
});

test("among old names only, the latest release wins; without GitHub data, tooths that differ in case are one", () => {
  assert.deepEqual(
    statuses([
      mod("github.com/a/One", { repo: repo("b/Three", { latestRelease: "2026-01-01T00:00:00Z" }) }),
      mod("github.com/a/Two", { repo: repo("b/Three", { latestRelease: "2026-05-01T00:00:00Z" }) }),
      mod("github.com/c/Mod", { updated: "2026-01-01T00:00:00Z" }),
      mod("github.com/c/mod", { updated: "2026-03-01T00:00:00Z" }),
    ]),
    {
      "github.com/a/One": { status: "unlisted", reason: "duplicate", canonical: "github.com/a/Two" },
      "github.com/a/Two": { status: "listed" },
      "github.com/c/Mod": { status: "unlisted", reason: "duplicate", canonical: "github.com/c/mod" },
      "github.com/c/mod": { status: "listed" },
    },
  );
});

test("an excluded tooth never stands in for its repository", () => {
  assert.deepEqual(
    statuses([
      mod("github.com/a/Old", { repo: repo("a/New"), manifest: manifest(["photo/"]) }),
      mod("github.com/a/New", { repo: repo("a/New") }),
    ]),
    {
      "github.com/a/Old": { status: "excluded", reason: "not-a-mod" },
      "github.com/a/New": { status: "listed" },
    },
  );
});

test("among old names only, the latest version wins", () => {
  assert.deepEqual(
    statuses([
      mod("github.com/zimuya4153/LSE_Waila", { version: "1.4.1", repo: repo("MiracleForest/LSE_Waila") }),
      mod("github.com/ZMBlocks/LSE_Waila", { version: "1.4.5", repo: repo("MiracleForest/LSE_Waila") }),
    ]),
    {
      "github.com/zimuya4153/LSE_Waila": { status: "unlisted", reason: "duplicate", canonical: "github.com/ZMBlocks/LSE_Waila" },
      "github.com/ZMBlocks/LSE_Waila": { status: "listed" },
    },
  );
});

test("a repository's tooth.json is read in the current and the older formats", () => {
  const current = manifestOf({
    format_version: 3,
    info: { name: "M", description: "d", tags: ["type:mod", 1] },
    variants: [{ label: "client", dependencies: { "github.com/LiteLDev/LeviLamina": "1.*" }, assets: [{ type: "zip", placements: [{ dest: "mods/M/" }] }] }],
  });
  assert.deepEqual(current, {
    info: { name: "M", description: "d", tags: ["type:mod"] },
    variants: [{ label: "client", dependencies: { "github.com/LiteLDev/LeviLamina": "1.*" }, assets: [{ placements: [{ dest: "mods/M/" }] }] }],
  });
  // format 2: files for the whole package (Organization) or per platform (lualoader)
  const whole = manifestOf({ format_version: 2, info: { name: "O" }, files: { place: [{ src: "./*", dest: "plugins/Organization/" }] } });
  assert.equal(whole && installsMod(whole), true);
  const program = manifestOf({
    format_version: 2,
    info: { name: "lualoader" },
    platforms: [{ goos: "windows", files: { place: [{ src: "lualoader.exe", dest: "lualoader.exe" }] } }],
  });
  assert.equal(program && installsMod(program), false);
  assert.equal(manifestOf("404: Not Found"), null);
  assert.equal(manifestOf({ variants: [] }), null);
});
