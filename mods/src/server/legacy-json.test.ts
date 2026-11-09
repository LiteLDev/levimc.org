import assert from "node:assert/strict";
import { test } from "node:test";
import type { CatalogEntryJson, ModJson } from "../types.ts";
import { legacyCatalogEntry, legacyModJson, type LegacyPackage } from "./legacy-json.ts";

const ID = "github.com/LiteLDev/LegacyMoney";

const mod: ModJson = {
  url: `https://levimc.org/mods/${ID}/`,
  id: ID,
  name: "LegacyMoney",
  description: "Economy",
  owner: "LiteLDev",
  logo: "https://example.com/logo.png",
  repository: `https://${ID}`,
  releases: `https://${ID}/releases`,
  stars: 50,
  updated: "2026-01-01T00:00:00Z",
  side: ["server", "client"],
  platform: ["win-x64"],
  gameVersions: ["1.26.60"],
  tags: ["economy"],
  latest: { variant: "", version: "1.0.0", install: `lip install ${ID}@1.0.0` },
  readmes: [],
  gallery: [],
  versions: [
    {
      // only a lip.toml: not in lipr's data
      version: "1.0.0",
      prerelease: false,
      releaseUrl: `https://${ID}/releases`,
      manifestUrl: `https://${ID}/blob/v1.0.0/lip.toml`,
      info: { name: "LegacyMoney", description: "Economy", tags: ["economy"], logo: "https://example.com/logo.png" },
      variants: { "": [{ side: "client", platform: "win-x64", deps: { "github.com/LiteLDev/LeviLamina": "26.60.*" } }] },
    },
    {
      version: "0.9.2",
      prerelease: false,
      released: "2025-12-01T00:00:00Z",
      releaseUrl: `https://${ID}/releases/tag/v0.9.2`,
      manifestUrl: `https://${ID}/blob/v0.9.2/tooth.json`,
      info: { name: "LegacyMoney", description: "Economy", tags: ["economy"] },
      variants: {
        "": [{ side: "server", platform: "win-x64", deps: { "github.com/LiteLDev/LeviLamina": "26.60.*" } }],
        client: [{ side: "client", platform: "win-x64", deps: { "github.com/LiteLDev/LeviLamina#client": "26.60.*" } }],
      },
    },
  ],
  dependencies: { "github.com/liteldev/levilamina": { id: "github.com/LiteLDev/LeviLamina", name: "LeviLamina", owner: "LiteLDev", url: "u" } },
  requiredBy: [{ id: "github.com/a/b", name: "B", owner: "a" }],
};

const pkg: LegacyPackage = {
  variants: {
    client: { versions: { "0.9.2": { dependencies: { "github.com/LiteLDev/LeviLamina#client": "26.60.*" } } } },
    "": { versions: { "0.9.2": { dependencies: { "github.com/LiteLDev/LeviLamina": "26.60.*" } } } },
  },
};

test("legacyModJson keeps the keys and shape from before version 4", () => {
  const json = legacyModJson(mod, pkg);
  assert.equal(json.tooth, ID);
  assert.equal(json.icon, "https://example.com/logo.png");
  assert.deepEqual(json.env, ["server", "client"]);
  assert.deepEqual(json.variants, [
    { label: "", versions: ["0.9.2"] },
    { label: "client", versions: ["0.9.2"] },
  ]);
  assert.equal(json.versions.length, 1, "a version without a tooth.json is left out");
  const [v] = json.versions;
  assert.equal(v!.version, "0.9.2");
  assert.deepEqual(v!.info, { name: "LegacyMoney", description: "Economy", tags: ["economy"] });
  assert.deepEqual(v!.variants, [
    {
      label: "",
      platform: "win-x64",
      dependencies: { "github.com/LiteLDev/LeviLamina": "26.60.*" },
      leviLamina: "26.60.*",
      install: `lip install ${ID}@0.9.2`,
    },
    {
      label: "client",
      platform: "win-x64",
      dependencies: { "github.com/LiteLDev/LeviLamina#client": "26.60.*" },
      leviLamina: "26.60.*",
      install: `lip install ${ID}#client@0.9.2`,
    },
  ]);
  assert.deepEqual(json.dependencies["github.com/liteldev/levilamina"], {
    tooth: "github.com/LiteLDev/LeviLamina",
    name: "LeviLamina",
    owner: "LiteLDev",
    url: "u",
  });
  assert.deepEqual(json.requiredBy, [{ tooth: "github.com/a/b", name: "B", owner: "a" }]);
  for (const key of ["id", "logo", "side", "platform"]) assert.ok(!(key in json), `no ${key}`);
});

test("legacyModJson keeps a client label on the client in env", () => {
  // lip v0.40 puts this client label on the server: it depends on LeviLamina's server variant
  const server = { ...mod, side: ["server" as const] };
  const labelled: LegacyPackage = {
    variants: { client: { versions: { "0.9.2": { dependencies: { "github.com/LiteLDev/LeviLamina": ">=26.10.0" } } } } },
  };
  assert.deepEqual(legacyModJson(server, labelled).env, ["server", "client"]);
  assert.deepEqual(legacyModJson(server, undefined).env, ["server"]);
});

test("legacyModJson without tooth.json data lists no version", () => {
  const json = legacyModJson(mod, undefined);
  assert.deepEqual(json.versions, []);
  assert.deepEqual(json.variants, []);
});

test("legacyCatalogEntry renames the keys", () => {
  const entry: CatalogEntryJson = {
    id: ID,
    name: "LegacyMoney",
    description: "Economy",
    owner: "LiteLDev",
    logo: "https://example.com/logo.png",
    tags: [],
    side: ["client"],
    platform: ["win-x64"],
    gameVersions: [],
    deps: { "github.com/LiteLDev/LeviLamina": "26.60.*" },
    stars: 1,
    updated: "2026-01-01T00:00:00Z",
    url: `https://levimc.org/mods/${ID}/`,
    json: `https://levimc.org/api/v4/mods/${ID}/index.json`,
    requiredBy: 0,
  };
  const legacy = legacyCatalogEntry(entry, `https://levimc.org/mods/${ID}/index.json`, ["client"]);
  assert.equal(legacy.tooth, ID);
  assert.deepEqual(legacy.env, ["client"]);
  assert.deepEqual(legacy.dependsOn, ["github.com/LiteLDev/LeviLamina"]);
  assert.equal(legacy.icon, entry.logo);
  assert.equal(legacy.json, `https://levimc.org/mods/${ID}/index.json`);
});
