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

test("category: tags win over the tag map", () => {
  const upstream = deriveFacets({ tags: ["category:Utility", "category:unknown", "economy"], manifestVariants: null, labels: [""] });
  assert.deepEqual(upstream.categories, ["utility"]);
  const plain = deriveFacets({ tags: ["platform:levilamina", "type:mod"], manifestVariants: null, labels: [""] });
  assert.deepEqual(plain, { categories: [], platforms: ["levilamina"], env: ["server"] });
});

test("categories and platforms from the tag map", () => {
  const f = deriveFacets({ tags: ["lse", "quickjs", "economy", "money", "welcome"], manifestVariants: null, labels: [""] });
  assert.deepEqual(f.categories, ["economy", "social"]);
  assert.deepEqual(f.platforms, ["lse"]);
  assert.equal(f.lang, "js");
  const endstone = deriveFacets({ tags: ["platform:levilamina", "platform:endstone"], manifestVariants: null, labels: [""] });
  assert.deepEqual(endstone.platforms, ["levilamina", "endstone"]);
  assert.equal(endstone.lang, undefined);
  assert.deepEqual(deriveFacets({ tags: ["lualoader"], manifestVariants: null, labels: [""] }).platforms, ["other"]);
});
