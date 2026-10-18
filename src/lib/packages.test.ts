import assert from "node:assert/strict";
import { test } from "node:test";
import type { Package, RawPackageEntry } from "../types.ts";
import {
  buildPackageUrl,
  extractTags,
  filterByTags,
  getDefaultSelection,
  getRepoBaseUrls,
  getRepositoryUrl,
  packagePath,
  paginatePackages,
  resolveSelection,
  searchPackages,
  sortPackages,
  toothFromPath,
} from "./packages.ts";

const TOOTH = "github.com/LiteLDev/LeviLamina";
const entry: RawPackageEntry = {
  info: { name: "LeviLamina", description: "Mod loader", tags: [] },
  updated_at: "2026-10-17T00:00:00Z",
  stargazer_count: 1,
  variants: {
    "": { versions: ["1.0.0", "1.1.0"] },
    client: { versions: ["1.0.0"] },
  },
};

const pkg = (tooth: string, name: string, tags: string[], stars: number, updated: string): Package => ({
  tooth,
  info: { name, description: `${name} description`, tags },
  stars,
  updated,
  versions: ["1.0.0"],
});
const packages = [
  pkg("github.com/a/alpha", "Alpha", ["mod", "lse"], 5, "2026-01-01T00:00:00Z"),
  pkg("github.com/b/beta", "Beta", ["mod"], 50, "2026-03-01T00:00:00Z"),
  pkg("github.com/c/levilamina-thing", "LeviLamina Thing", ["library"], 1, "2026-02-01T00:00:00Z"),
];

test("package paths round-trip", () => {
  assert.equal(packagePath(TOOTH), "/packages/github.com/LiteLDev/LeviLamina/");
  assert.equal(toothFromPath(packagePath(TOOTH)), TOOTH);
  assert.equal(toothFromPath("/packages/github.com/x"), null);
  assert.equal(toothFromPath("/"), null);
});

test("the default selection is the default variant's latest version", () => {
  assert.deepEqual(getDefaultSelection(entry), { variant: "", version: "1.1.0" });
});

test("selections fall back to what the package has", () => {
  assert.deepEqual(resolveSelection(entry, "client", "1.0.0"), { variant: "client", version: "1.0.0" });
  assert.deepEqual(resolveSelection(entry, "client", "9.9.9"), { variant: "client", version: "1.0.0" });
  assert.deepEqual(resolveSelection(entry, "nope", "1.0.0"), { variant: "", version: "1.0.0" });
  assert.deepEqual(resolveSelection(entry, null, null), { variant: "", version: "1.1.0" });
});

test("the default selection has the bare URL", () => {
  assert.equal(buildPackageUrl(TOOTH, entry, { variant: "", version: "1.1.0" }), packagePath(TOOTH));
  assert.equal(
    buildPackageUrl(TOOTH, entry, { variant: "client", version: "1.0.0" }),
    `${packagePath(TOOTH)}?variant=client&version=1.0.0`,
  );
});

test("repository URLs: the tooth, or where the repository lives now", () => {
  assert.equal(getRepositoryUrl(TOOTH), "https://github.com/LiteLDev/LeviLamina");
  assert.equal(getRepositoryUrl("github.com/old/name", "https://github.com/new/name"), "https://github.com/new/name");
  assert.deepEqual(getRepoBaseUrls("https://github.com/new/name", "1.0.0"), {
    raw: "https://raw.githubusercontent.com/new/name/v1.0.0/",
    blob: "https://github.com/new/name/blob/v1.0.0/",
  });
  assert.deepEqual(getRepoBaseUrls("https://gitlab.example/o/r", "2.0.0"), {
    raw: "https://gitlab.example/o/r/raw/refs/tags/v2.0.0/",
    blob: "https://gitlab.example/o/r/blob/refs/tags/v2.0.0/",
  });
});

test("search ranks name matches and filters the rest out", () => {
  const { results, scores } = searchPackages(packages, "levilamina");
  assert.deepEqual(results.map((p) => p.info.name), ["LeviLamina Thing"]);
  assert.ok((scores.get("github.com/c/levilamina-thing") ?? 0) > 0);
  assert.equal(searchPackages(packages, "  ").results, packages);
});

test("tag filters need every selected tag", () => {
  assert.deepEqual(filterByTags(packages, ["mod"]).map((p) => p.info.name), ["Alpha", "Beta"]);
  assert.deepEqual(filterByTags(packages, ["mod", "lse"]).map((p) => p.info.name), ["Alpha"]);
});

test("sorting by stars and by update time", () => {
  const none = new Map<string, number>();
  assert.deepEqual(sortPackages(packages, "stars", none, false).map((p) => p.stars), [50, 5, 1]);
  assert.deepEqual(sortPackages(packages, "updated", none, false).map((p) => p.info.name), ["Beta", "LeviLamina Thing", "Alpha"]);
  assert.deepEqual(sortPackages(packages, "relevance", none, false), packages);
});

test("pagination clamps the page", () => {
  const many = Array.from({ length: 130 }, (_, i) => pkg(`github.com/x/p${i}`, `P${i}`, [], 0, ""));
  assert.equal(paginatePackages(many, 1).items.length, 60);
  assert.equal(paginatePackages(many, 3).items.length, 10);
  assert.equal(paginatePackages(many, 99).items[0]?.info.name, "P120");
  assert.equal(paginatePackages([], 1).totalPages, 1);
});

test("tags are ordered by use, then by name", () => {
  assert.deepEqual(extractTags(packages), ["mod", "library", "lse"]);
});
