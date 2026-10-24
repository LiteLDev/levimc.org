import assert from "node:assert/strict";
import { test } from "node:test";
import { compatibility, rankScore, spreadAuthors } from "./ranking.ts";

const ALL = ["1.26.51", "1.26.40", "1.26.32", "1.26.20", "1.26.10", "1.21.132"];
const NOW = Date.parse("2026-10-21T00:00:00Z");

test("compatibility: the newest game version is 1, less per version behind, unknown in between", () => {
  assert.equal(compatibility(["1.26.40", "1.26.51"], ALL), 1);
  assert.equal(compatibility(["1.26.40"], ALL), 0.75);
  assert.equal(compatibility(["1.21.132"], ALL), 0);
  assert.equal(compatibility([], ALL), 0.3);
});

test("rank: a maintained, compatible package outranks a stale one with more stars", () => {
  const fresh = rankScore({ stars: 10, gameVersions: ["1.26.51"], updated: "2026-10-15T00:00:00Z" }, ALL, NOW);
  const stale = rankScore({ stars: 40, gameVersions: ["1.21.132"], updated: "2025-01-01T00:00:00Z" }, ALL, NOW);
  assert.ok(fresh > stale);
  const library = rankScore({ stars: 10, requiredBy: 20, gameVersions: ["1.26.51"], updated: "2026-10-15T00:00:00Z" }, ALL, NOW);
  assert.ok(library > fresh);
  const brandNew = rankScore({ stars: 10, gameVersions: ["1.26.51"], updated: "2026-10-15T00:00:00Z", created: "2026-10-10T00:00:00Z" }, ALL, NOW);
  assert.ok(brandNew > fresh);
});

test("spreadAuthors keeps the order and moves an author's fourth package to the next block", () => {
  const items = ["a", "a", "a", "a", "b", "c"].map((owner, i) => ({ owner, i }));
  assert.deepEqual(spreadAuthors(items, 5).map((x) => x.i), [0, 1, 2, 4, 5, 3]);
  assert.deepEqual(spreadAuthors(items, 4).map((x) => x.i), [0, 1, 2, 4, 3, 5]);
});
