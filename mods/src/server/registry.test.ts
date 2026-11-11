import assert from "node:assert/strict";
import { test } from "node:test";
import { toothToV4, type RegistryManifest } from "../lib/manifest.ts";
import type { LipDoc } from "../types.ts";
import { installCommand } from "../lib/mods.ts";
import { defaultVariantOf, fileManifests, narrowRegistrySides, ownTooths, readTag, type CachedTag, type RegistryCache, type RepoResolver } from "./registry.ts";

const manifest = (tooth: string, version: string) =>
  ({ tooth, version, info: { name: "X", description: "", tags: [], avatar_url: "" }, variants: [{ label: "", platform: "win-x64", dependencies: {}, assets: [] }] }) as RegistryManifest;

/** A tag read from its tooth.json. */
const fromTooth = (tooth: string, tag: string): CachedTag => {
  const v3 = manifest(tooth, tag.slice(1));
  return { sha: tag, kind: "tooth", v3, v4: toothToV4(v3), seen: "2026-01-01T00:00:00Z" };
};

/** What readRepos returns: repo → tag → what was read (a tooth: a tooth.json naming it). */
const readOf = (repos: Record<string, Record<string, string | CachedTag>>) =>
  new Map(
    Object.entries(repos).map(([repo, tags]) => [
      repo,
      new Map<string, CachedTag>(Object.entries(tags).map(([tag, read]) => [tag, typeof read === "string" ? fromTooth(read, tag) : read])),
    ]),
  );

/** GitHub after the transfer to MiracleForest (and BarelyEnoughItems' earlier rename from bei). */
const github: Record<string, string | null> = {
  "liteldev/lepton": "miracleforest/lepton",
  "miracleforest/lepton": "miracleforest/lepton",
  "liteldev/barelyenoughitems": "miracleforest/barelyenoughitems",
  "liteldev/bei": "miracleforest/barelyenoughitems",
  "miracleforest/barelyenoughitems": "miracleforest/barelyenoughitems",
  "liteldev/levilamina-mod-template": "liteldev/levilamina-mod-template",
  "someone/coolmod": "someone/coolmod",
  "someone/my-mod": null,
};
const resolver: RepoResolver = async (path) => github[path] ?? null;

async function file(repos: Record<string, Record<string, string | CachedTag>>, cache: RegistryCache = { version: 3, repos: {}, aliases: {} }, resolve = resolver) {
  const read = readOf(repos);
  const own = await ownTooths(read, cache, resolve);
  const { docs, lipr } = fileManifests(read, Object.keys(repos), own);
  const filed = Object.fromEntries([...docs].map(([id, versions]) => [id, [...versions.keys()]]));
  // lipr files the same tooth.json files the same way
  assert.deepEqual(Object.fromEntries([...lipr.manifests].map(([tooth, versions]) => [tooth, [...versions.keys()]])), filed);
  return { own, cache, filed, docs, lipr };
}

test("ownTooths: listed under the old owner, a tag naming the new one keeps it", async () => {
  const { filed } = await file({ "LiteLDev/Lepton": { "v1.0.0": "github.com/LiteLDev/Lepton", "v1.1.0": "github.com/MiracleForest/Lepton" } });
  assert.deepEqual(filed, { "github.com/LiteLDev/Lepton": ["1.0.0"], "github.com/MiracleForest/Lepton": ["1.1.0"] });
});

test("ownTooths: listed under the new owner, a tag naming the old one keeps it", async () => {
  const { filed } = await file({
    "MiracleForest/Lepton": { "v1.0.0": "github.com/LiteLDev/Lepton", "v1.1.0": "github.com/MiracleForest/Lepton" },
    "MiracleForest/BarelyEnoughItems": { "v0.1.0": "github.com/LiteLDev/bei", "v0.2.0": "github.com/LiteLDev/BarelyEnoughItems" },
  });
  assert.deepEqual(filed, {
    "github.com/LiteLDev/Lepton": ["1.0.0"],
    "github.com/MiracleForest/Lepton": ["1.1.0"],
    "github.com/LiteLDev/bei": ["0.1.0"],
    "github.com/LiteLDev/BarelyEnoughItems": ["0.2.0"],
  });
});

test("ownTooths: a cached alias is looked up again; the cached one is kept only when the lookup fails", async () => {
  const stale = (): RegistryCache => ({ version: 3, repos: {}, aliases: { "liteldev/bei": "liteldev/barelyenoughitems", "gone/unused": "gone/unused" } });
  const repos = { "MiracleForest/BarelyEnoughItems": { "v0.1.0": "github.com/LiteLDev/bei" } };

  const fresh = await file(repos, stale());
  assert.deepEqual(fresh.filed, { "github.com/LiteLDev/bei": ["0.1.0"] });
  assert.equal(fresh.cache.aliases["liteldev/bei"], "miracleforest/barelyenoughitems");
  assert.ok(!("gone/unused" in fresh.cache.aliases));

  // GitHub unreachable: the cached aliases stand in
  const offline = await file(repos, { ...stale(), aliases: { "liteldev/bei": "miracleforest/barelyenoughitems", "miracleforest/barelyenoughitems": "miracleforest/barelyenoughitems" } }, async () => undefined);
  assert.deepEqual(offline.filed, { "github.com/LiteLDev/bei": ["0.1.0"] });
  assert.equal(offline.cache.aliases["liteldev/bei"], "miracleforest/barelyenoughitems");
});

test("ownTooths: another repository's tooth (a template's) is filed under the listed repository", async () => {
  const { filed, own } = await file({
    "someone/coolmod": { "v1.0.0": "github.com/someone/my-mod", "v1.1.0": "github.com/LiteLDev/levilamina-mod-template", "v1.2.0": "github.com/someone/coolmod" },
    "MiracleForest/Lepton": { "v1.0.0": "github.com/someone/coolmod" },
  });
  assert.deepEqual(filed, { "github.com/someone/coolmod": ["1.0.0", "1.1.0", "1.2.0"], "github.com/MiracleForest/Lepton": ["1.0.0"] });
  assert.equal(own("someone/coolmod", "github.com/someone/my-mod"), false);
  assert.equal(own("someone/coolmod", "not a github tooth"), false);
});

const lipDoc = (id: string, version: string, variants: LipDoc["variants"] = { "": [{ side: "server", platform: "win-x64", deps: {}, dests: [] }] }): LipDoc => ({
  id,
  version,
  info: { name: "L", description: "", tags: [] },
  variants,
});
const fromLip = (id: string, tag: string, tooth?: string): CachedTag => ({
  sha: tag,
  kind: "lip",
  ...(tooth ? { v3: manifest(tooth, tag.slice(1)) } : {}),
  v4: lipDoc(id, tag.slice(1)),
  seen: "2026-01-01T00:00:00Z",
});

test("lip.toml: filed under the repository's id; another package's id is not read; its tooth.json is still lipr's", async () => {
  const read = readOf({
    "someone/coolmod": {
      "v1.0.0": "github.com/someone/coolmod",
      // a lip.toml and a tooth.json at one tag: the site reads the lip.toml, lipr the tooth.json
      "v2.0.0": fromLip("github.com/someone/CoolMod", "v2.0.0", "github.com/someone/coolmod"),
      // lip.toml only: not lipr's
      "v3.0.0": fromLip("github.com/someone/coolmod", "v3.0.0"),
      // another package's id (a template's): not read
      "v4.0.0": fromLip("github.com/LiteLDev/levilamina-mod-template", "v4.0.0"),
      // a lip.toml lip cannot read: no version (no fallback to the tooth.json, which lipr still has)
      "v5.0.0": { sha: "v5.0.0", kind: "lip", v3: manifest("github.com/someone/coolmod", "5.0.0"), v4: null, seen: "2026-01-01T00:00:00Z" },
    },
  });
  const own = await ownTooths(read, { version: 3, repos: {}, aliases: {} }, resolver);
  const { docs, origins, lipr } = fileManifests(read, ["someone/coolmod"], own);
  assert.deepEqual([...docs.get("github.com/someone/coolmod")!.keys()], ["1.0.0", "2.0.0", "3.0.0"]);
  assert.deepEqual([...lipr.manifests.get("github.com/someone/coolmod")!.keys()], ["1.0.0", "2.0.0", "5.0.0"]);
  assert.deepEqual([...origins.get("github.com/someone/coolmod")!.values()].map((o) => o.file), ["tooth.json", "lip.toml", "lip.toml"]);
  assert.deepEqual([...docs.keys()], ["github.com/someone/coolmod"]);
});

test("sides of tooth.json versions narrowed through every package's latest version; lip.toml sides as written", () => {
  const both = (deps: Record<string, string>) => [
    { side: "server" as const, platform: "win-x64", deps, dests: [] },
    { side: "client" as const, platform: "win-x64", deps, dests: [] },
  ];
  const docs = new Map<string, Map<string, LipDoc>>([
    // a server library (its latest version), from a lip.toml
    ["github.com/o/Lib", new Map([["2.0.0", lipDoc("github.com/o/Lib", "2.0.0")]])],
    // a lip.toml package with a client entry in its default variant
    ["github.com/o/Both", new Map([["1.0.0", lipDoc("github.com/o/Both", "1.0.0", { "": both({}) })]])],
    // tooth.json packages
    ["github.com/o/A", new Map([["1.0.0", lipDoc("github.com/o/A", "1.0.0", { "": both({ "github.com/o/lib": "2" }) })]])],
    ["github.com/o/B", new Map([["1.0.0", lipDoc("github.com/o/B", "1.0.0", { "": both({ "github.com/o/A": "1" }) })]])],
    ["github.com/o/C", new Map([["1.0.0", lipDoc("github.com/o/C", "1.0.0", { "": both({ "github.com/o/Both#client": "1" }) })]])],
    ["github.com/o/D", new Map([["1.0.0", lipDoc("github.com/o/D", "1.0.0", { "": both({ "github.com/o/E": "1" }) })]])],
    ["github.com/o/E", new Map([["1.0.0", lipDoc("github.com/o/E", "1.0.0", { "": both({ "github.com/o/D": "1" }) })]])],
  ]);
  const lip = new Set(["github.com/o/Lib", "github.com/o/Both"]);
  narrowRegistrySides(docs, (id) => (lip.has(id) ? "lip" : "tooth"));
  const sides = (id: string) => [...docs.get(id)!.values()][0]!.variants[""]!.map((e) => e.side);
  assert.deepEqual(sides("github.com/o/A"), ["server"]);
  // through A, which depends on Lib
  assert.deepEqual(sides("github.com/o/B"), ["server"]);
  // `#client` of a lip.toml package without such a variant: its default variant's client entries
  assert.deepEqual(sides("github.com/o/C"), ["client"]);
  // a cycle constrains nothing
  assert.deepEqual(sides("github.com/o/D"), ["server", "client"]);
  assert.deepEqual(sides("github.com/o/Both"), ["server", "client"]);
});

test("a tag: lip.toml first, tooth.json only for lipr and when there is none; a version 2 cache's tags only look for lip.toml", async (t) => {
  const files: Record<string, string> = {};
  const asked: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string) => {
    asked.push(url.split("/").at(-1)!);
    const body = files[url.split("/").at(-1)!];
    return new Response(body ?? "404: Not Found", { status: body === undefined ? 404 : 200 });
  });
  const toothJson = JSON.stringify({ format_version: 3, tooth: "github.com/o/M", version: "1.0.0", info: { name: "M" }, variants: [{ platform: "win-x64" }] });
  const lipToml = 'format = 4\nid = "github.com/o/M"\nversion = "1.0.0"\n[[variants.""]]\nside = "server"\nplatform = "win-x64"\n';

  files["tooth.json"] = toothJson;
  const tooth = await readTag("o/M", "v1.0.0");
  assert.equal(tooth?.kind, "tooth");
  assert.deepEqual(tooth?.v4?.variants[""]?.map((e) => e.side), ["server", "client"]);

  files["lip.toml"] = lipToml;
  const both = await readTag("o/M", "v1.0.0");
  assert.equal(both?.kind, "lip");
  assert.equal(both?.v3?.tooth, "github.com/o/M");
  assert.deepEqual(both?.v4?.variants[""]?.map((e) => e.side), ["server"]);

  // a lip.toml lip cannot read: no version, and no falling back to the tooth.json
  files["lip.toml"] = lipToml.replace('side = "server"', 'platform = "server"');
  const invalid = await readTag("o/M", "v1.0.0");
  assert.equal(invalid?.kind, "lip");
  assert.equal(invalid?.v4, null);

  // migrating a version 2 cache: one request
  delete files["lip.toml"];
  asked.length = 0;
  const legacy = await readTag("o/M", "v1.0.0", { sha: "s", manifest: tooth!.v3!, seen: "2026-01-01T00:00:00Z" });
  assert.deepEqual(asked, ["lip.toml"]);
  assert.deepEqual(legacy, tooth);
});

test("the default variant (latest.variant, latest.install): a lip.toml version's bare identity, a tooth.json one's client", () => {
  const LL = "github.com/LiteLDev/LeviLamina";
  const BEI = "github.com/MiracleForest/BarelyEnoughItems";
  const client = (deps: Record<string, string>) => ({ side: "client" as const, platform: "win-x64", deps, dests: [] });
  const server = (deps: Record<string, string>) => ({ side: "server" as const, platform: "win-x64", deps, dests: [] });
  // a client mod migrated to format 4: "" for the client, client kept as an alias of it
  const bei = lipDoc(BEI, "0.2.0", { "": [client({ [`${LL}#client`]: "26.60.*" })], client: [client({ [`${LL}#client`]: "26.60.*" })] });
  assert.equal(defaultVariantOf(bei, true), "");
  assert.equal(installCommand(BEI, defaultVariantOf(bei, true)!, "0.2.0"), `lip install ${BEI}@0.2.0`);
  // the same variants from a tooth.json: client, as before
  assert.equal(defaultVariantOf(bei, false), "client");
  assert.equal(installCommand(BEI, defaultVariantOf(bei, false)!, "0.2.0"), `lip install ${BEI}#client@0.2.0`);
  // a package for both sides shows its server variant either way
  const ll = lipDoc(LL, "26.70.0", { "": [server({}), client({})], client: [client({})] });
  assert.equal(defaultVariantOf(ll, true), "");
  const llTooth = lipDoc(LL, "26.60.6", { "": [server({})], client: [client({})] });
  assert.equal(defaultVariantOf(llTooth, false), "");
});
