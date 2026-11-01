import assert from "node:assert/strict";
import { test } from "node:test";
import type { RegistryManifest } from "../lib/manifest.ts";
import { fileManifests, ownTooths, type CachedTag, type RegistryCache, type RepoResolver } from "./registry.ts";

const manifest = (tooth: string, version: string) =>
  ({ tooth, version, info: { name: "X", description: "", tags: [], avatar_url: "" }, variants: [{ label: "", dependencies: {}, assets: [] }] }) as unknown as RegistryManifest;

/** What readRepos returns: repo → tag → manifest. */
const readOf = (repos: Record<string, Record<string, string>>) =>
  new Map(
    Object.entries(repos).map(([repo, tags]) => [
      repo,
      new Map<string, CachedTag>(Object.entries(tags).map(([tag, tooth]) => [tag, { sha: tag, manifest: manifest(tooth, tag.slice(1)), seen: "2026-01-01T00:00:00Z" }])),
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

async function file(repos: Record<string, Record<string, string>>, cache: RegistryCache = { version: 2, repos: {}, aliases: {} }, resolve = resolver) {
  const read = readOf(repos);
  const own = await ownTooths(read, cache, resolve);
  const { manifests } = fileManifests(read, Object.keys(repos), own);
  return { own, cache, filed: Object.fromEntries([...manifests].map(([tooth, versions]) => [tooth, [...versions.keys()]])) };
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
  const stale = (): RegistryCache => ({ version: 2, repos: {}, aliases: { "liteldev/bei": "liteldev/barelyenoughitems", "gone/unused": "gone/unused" } });
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
