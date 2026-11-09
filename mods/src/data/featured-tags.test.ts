import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FEATURED_TAGS,
  featuredOf,
  featuredTagsOf,
  hasFeaturedTag,
  isHiddenTag,
  normalizeTag,
  plainTagsOf,
  tagKey,
  tagKeys,
  visibleTags,
} from "./featured-tags.ts";

test("normalization: lower case, without a category: prefix", () => {
  assert.equal(normalizeTag("Category:Utility"), "utility");
  assert.equal(normalizeTag(" LSE "), "lse");
  // other namespaces stay: they become plain tags
  assert.equal(normalizeTag("PLand:Library"), "pland:library");
  assert.equal(normalizeTag("platform:levilamina"), "platform:levilamina");
});

test("hidden tags: loader, kind and side tags; lse, quickjs and nodejs stay", () => {
  for (const tag of ["platform:levilamina", "type:mod", "levilamina", "ll", "mod", "plugin", "native", "client", "server", "minecraft-bedrock", ""]) {
    assert.ok(isHiddenTag(tag), tag);
  }
  for (const tag of ["lse", "quickjs", "nodejs", "pland:library", "economy"]) assert.ok(!isHiddenTag(tag), tag);
  assert.deepEqual(visibleTags(["Platform:LeviLamina", "type:mod", "LSE", "lse", "Mod", "Category:Economy", "Client"]), ["lse", "economy"]);
});

test("featured groups: the id and its aliases, any case, after normalization", () => {
  assert.equal(featuredOf("tp")?.id, "teleport");
  assert.equal(featuredOf("Category:TELEPORT")?.id, "teleport");
  assert.equal(featuredOf("pland:library")?.id, "library");
  assert.equal(featuredOf("lse"), undefined);
  assert.equal(tagKey("money"), "economy");
  assert.equal(tagKey("Economy"), "economy");
  assert.equal(tagKey("nodejs"), "nodejs");
  assert.equal(tagKey("type:library"), null);
  assert.deepEqual(tagKeys(["money", "economy", "tp", "type:mod", "quickjs"]), ["economy", "teleport", "quickjs"]);
});

test("a mod's featured tags in table order, with the raw tags behind each; the rest stay plain", () => {
  const tags = ["tp", "money", "Economy", "waystones", "lse", "platform:levilamina", "custom"];
  assert.deepEqual(
    featuredTagsOf(tags).map(({ tag, raw }) => [tag.id, raw]),
    [
      ["economy", ["money", "economy"]],
      ["teleport", ["tp", "waystones"]],
    ],
  );
  assert.deepEqual(plainTagsOf(tags), ["lse", "custom"]);
  assert.ok(hasFeaturedTag(["Fix"]));
  assert.ok(!hasFeaturedTag(["lse", "type:library"]));
});

test("the table: unique ids and aliases, none hidden, every label in every locale", () => {
  const all = FEATURED_TAGS.flatMap((f) => [f.id, ...f.aliases]);
  assert.equal(new Set(all).size, all.length);
  assert.deepEqual(
    FEATURED_TAGS.map((f) => f.id),
    ["library", "utility", "management", "game-mechanics", "adventure", "visual", "economy", "teleport", "anticheat", "optimization", "bugfix", "technology", "protocol"],
  );
  for (const tag of all) {
    assert.equal(normalizeTag(tag), tag);
    assert.ok(!isHiddenTag(tag), tag);
  }
  for (const f of FEATURED_TAGS) for (const label of Object.values(f.label)) assert.ok(label.trim(), f.id);
});
