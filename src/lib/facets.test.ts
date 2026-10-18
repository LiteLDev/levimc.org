import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveEnv, deriveFacets } from "./facets.ts";

const placed = (label: string, dest: string, deps: Record<string, string> = {}) => ({
  label,
  dependencies: deps,
  assets: [{ placements: [{ dest }] }],
});

test("environment from the manifest: plugins/ is the server, mods/ the client", () => {
  assert.deepEqual(deriveEnv([placed("", "plugins/X/")], [""]), ["server"]);
  assert.deepEqual(deriveEnv([placed("", "mods/X/")], [""]), ["client"]);
  assert.deepEqual(deriveEnv([placed("", "plugins/X/"), placed("client", "mods/X/")], ["", "client"]), ["server", "client"]);
  // a client dependency or a client variant also counts
  assert.deepEqual(deriveEnv([{ label: "", dependencies: { "github.com/LiteLDev/LeviLamina#client": "1.*" } }], [""]), ["client"]);
  // no placements: unknown
  assert.deepEqual(deriveEnv([{ label: "" }], [""]), []);
});

test("environment without a manifest: client… labels are the client, the rest the server", () => {
  assert.deepEqual(deriveEnv(null, ["", "client"]), ["server", "client"]);
  assert.deepEqual(deriveEnv(null, ["client_26_51"]), ["client"]);
  assert.deepEqual(deriveEnv(null, [""]), ["server"]);
});

test("curation wins over tags; category: tags win over curation", () => {
  const curated = deriveFacets({
    tags: ["platform:levilamina", "type:mod"],
    curation: { categories: ["economy"], platforms: ["lse"], lang: "nodejs" },
    manifestVariants: null,
    labels: [""],
  });
  assert.deepEqual(curated, { categories: ["economy"], platforms: ["lse"], lang: "nodejs", env: ["server"] });
  const upstream = deriveFacets({
    tags: ["category:Utility", "category:unknown"],
    curation: { categories: ["economy"] },
    manifestVariants: null,
    labels: [""],
  });
  assert.deepEqual(upstream.categories, ["utility"]);
});

test("uncurated packages: categories and platforms from the tag map", () => {
  const f = deriveFacets({ tags: ["lse", "quickjs", "economy", "money", "welcome"], manifestVariants: null, labels: [""] });
  assert.deepEqual(f.categories, ["economy", "social"]);
  assert.deepEqual(f.platforms, ["lse"]);
  assert.equal(f.lang, "js");
  const endstone = deriveFacets({ tags: ["platform:levilamina", "platform:endstone"], manifestVariants: null, labels: [""] });
  assert.deepEqual(endstone.platforms, ["levilamina", "endstone"]);
  assert.equal(endstone.lang, undefined);
  assert.deepEqual(deriveFacets({ tags: ["lualoader"], manifestVariants: null, labels: [""] }).platforms, ["other"]);
});
