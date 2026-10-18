import assert from "node:assert/strict";
import { test } from "node:test";
import type { CatalogEntry } from "../types.ts";
import {
  clearFilters,
  DEFAULT_STATE,
  filterCount,
  parseQuery,
  runQuery,
  serializeQuery,
  type QueryState,
} from "./catalog-query.ts";
import { searchCatalog } from "./search.ts";

const entry = (tooth: string, over: Partial<CatalogEntry> = {}): CatalogEntry => ({
  tooth,
  name: tooth.split("/").at(-1)!,
  description: "",
  owner: tooth.split("/")[1]!,
  tags: [],
  categories: [],
  platforms: ["levilamina"],
  env: ["server"],
  stars: 0,
  updated: "2026-01-01T00:00:00Z",
  ...over,
});

const CATALOG: CatalogEntry[] = [
  entry("github.com/LiteLDev/LeviLamina", { stars: 1694, categories: ["library"], env: ["server", "client"], updated: "2026-10-17T00:00:00Z", description: "A mod loader for Minecraft Bedrock" }),
  entry("github.com/LiteLDev/LegacyScriptEngine", { stars: 114, categories: ["library", "developer"], platforms: ["levilamina", "lse"], updated: "2026-10-10T00:00:00Z" }),
  entry("github.com/GlacieTeam/Glacie", { stars: 115, categories: ["protocol"], platforms: ["levilamina", "endstone"], env: ["server", "client"] }),
  entry("github.com/Nico6719/YEssential", { stars: 30, categories: ["utility", "management", "economy"], platforms: ["lse"], lang: "js", tags: ["plugin", "essential", "lse"] }),
  entry("github.com/a/Money", { stars: 3, categories: ["economy"], tags: ["economy", "platform:levilamina", "type:mod"], license: "MIT", created: "2025-01-01T00:00:00Z" }),
  entry("github.com/b/Bank", { stars: 3, categories: ["economy", "management"], tags: ["economy", "money"], updated: "2026-05-01T00:00:00Z", license: "NOASSERTION", created: "2026-02-01T00:00:00Z" }),
  entry("github.com/c/PLand", { stars: 40, categories: ["management"], description: "领地插件", tags: ["platform:levilamina", "type:mod"], license: "GPL-3.0" }),
  entry("github.com/d/Minimap", { stars: 0, categories: ["visual"], env: ["client"], tags: ["platform:levilamina", "type:mod"] }),
  entry("github.com/e/lualoader", { stars: 1, categories: ["developer"], platforms: ["other"], env: [] }),
];

const names = (items: CatalogEntry[]) => items.map((e) => e.name);
const run = (query: string) => {
  const state = parseQuery(new URLSearchParams(query));
  return runQuery(CATALOG, state, searchCatalog(CATALOG, state.q));
};

test("parse/serialize: defaults are omitted, so the default state is /", () => {
  assert.equal(serializeQuery(DEFAULT_STATE), "/");
  assert.deepEqual(parseQuery(new URLSearchParams("")), DEFAULT_STATE);
  assert.deepEqual(parseQuery(new URLSearchParams("sort=relevance&per=20&page=1")), DEFAULT_STATE);
});

test("parse/serialize round-trip in a fixed parameter order", () => {
  const url = "/?q=land claim&cat=economy,-library&platform=lse&env=client&license=oss&author=LiteLDev&tags=platform:levilamina&sort=stars&page=2";
  const state = parseQuery(new URLSearchParams(url.slice(2)));
  assert.equal(serializeQuery(state), "/?q=land%20claim&cat=economy,-library&platform=lse&env=client&license=oss&author=LiteLDev&tags=platform:levilamina&sort=stars&page=2");
  assert.deepEqual(parseQuery(new URLSearchParams(serializeQuery(state).slice(2))), state);
});

test("parse: comma lists and repeated keys, exclusions, unknown values dropped", () => {
  const a = parseQuery(new URLSearchParams("cat=economy&cat=utility,-library&cat=nope&platform=LSE,-other,bogus&env=client,-server,moon&tags=a%2Cb"));
  assert.deepEqual(a.cat, { inc: ["economy", "utility"], exc: ["library"] });
  assert.deepEqual(a.platform, { inc: ["lse"], exc: ["other"] });
  assert.deepEqual(a.env, ["client"]);
  assert.deepEqual(a.tags, ["a", "b"]);
  assert.equal(serializeQuery(a), "/?cat=economy,utility,-library&platform=lse,-other&env=client&tags=a,b");
});

test("parse: sorts and pages fall back; the page size is fixed", () => {
  assert.equal(serializeQuery(parseQuery(new URLSearchParams("per=100"))), "/");
  assert.equal(parseQuery(new URLSearchParams("sort=bogus")).sort, "relevance");
  assert.equal(parseQuery(new URLSearchParams("sort=downloads")).sort, "stars");
  assert.equal(parseQuery(new URLSearchParams("sort=newest")).sort, "newest");
  assert.equal(parseQuery(new URLSearchParams("sort=newest"), { created: false, license: false }).sort, "relevance");
  assert.equal(parseQuery(new URLSearchParams("license=oss"), { created: false, license: false }).license, false);
  assert.equal(parseQuery(new URLSearchParams("page=0")).page, 1);
  assert.equal(parseQuery(new URLSearchParams("page=x")).page, 1);
});

test("without a search, relevance is popularity: stars, then the latest update", () => {
  const { items } = run("");
  assert.deepEqual(names(items).slice(0, 3), ["LeviLamina", "Glacie", "LegacyScriptEngine"]);
  // equal stars: the more recently updated first
  assert.ok(names(items).indexOf("Bank") < names(items).indexOf("Money"));
  assert.deepEqual(run("sort=relevance").items, items);
});

test("sorting by stars, update and creation", () => {
  const stars = run("sort=stars").matched.map((e) => e.stars);
  assert.deepEqual(stars, [...stars].sort((x, y) => y - x));
  assert.equal(run("sort=updated").matched[0]?.name, "LeviLamina");
  assert.deepEqual(names(run("sort=newest").matched).slice(0, 2), ["Bank", "Money"]);
});

test("legacy tags: every tag, exact match (as the old listing filtered)", () => {
  assert.deepEqual(names(run("tags=economy").matched).sort(), ["Bank", "Money"]);
  assert.deepEqual(names(run("tags=platform:levilamina,type:mod").matched).sort(), ["Minimap", "Money", "PLand"]);
  assert.deepEqual(names(run("tags=economy,money").matched), ["Bank"]);
});

test("categories AND, platforms and environments OR, exclusions NOT, groups AND", () => {
  assert.deepEqual(names(run("cat=economy").matched), ["YEssential", "Bank", "Money"]);
  assert.deepEqual(names(run("cat=economy,management").matched), ["YEssential", "Bank"]);
  assert.deepEqual(names(run("platform=lse,endstone").matched), ["Glacie", "LegacyScriptEngine", "YEssential"]);
  assert.deepEqual(names(run("env=client").matched), ["LeviLamina", "Glacie", "Minimap"]);
  assert.ok(!names(run("cat=-library").matched).some((n) => n === "LeviLamina" || n === "LegacyScriptEngine"));
  assert.deepEqual(names(run("platform=-levilamina").matched), ["YEssential", "lualoader"]);
  assert.deepEqual(names(run("cat=economy&platform=lse").matched), ["YEssential"]);
  assert.deepEqual(names(run("license=oss").matched), ["PLand", "Money"]);
  assert.deepEqual(names(run("author=liteldev").matched), ["LeviLamina", "LegacyScriptEngine"]);
});

test("counts: an OR group's option ignores the group's own includes; zero counts stay", () => {
  const { counts } = run("platform=lse&cat=economy");
  // platform counts keep the category filter but not the platform include
  assert.equal(counts.platform.lse, 1);
  assert.equal(counts.platform.levilamina, 2);
  assert.equal(counts.platform.endstone, 0);
  // category counts: current results that also have the category
  assert.equal(counts.cat.economy, 1);
  assert.equal(counts.cat.management, 1);
  assert.equal(counts.cat.visual, 0);
  const all = run("").counts;
  assert.equal(all.env.client, 3);
  assert.equal(all.env.server, 7);
  assert.equal(all.license, 2);
});

test("search: name hits first, Chinese text found, popularity breaks ties", () => {
  assert.equal(run("q=levilamina").matched[0]?.name, "LeviLamina");
  assert.deepEqual(names(run("q=领地").matched), ["PLand"]);
  // the category label in Chinese finds the economy packages
  assert.deepEqual(names(run("q=经济").matched).sort(), ["Bank", "Money", "YEssential"]);
  assert.equal(run("q=zzzzqqq").matched.length, 0);
});

test("search: the rarer platforms are found by name (LeviLamina, on nearly every package, is not)", () => {
  assert.deepEqual([...(searchCatalog(CATALOG, "endstone")?.keys() ?? [])], ["github.com/GlacieTeam/Glacie"]);
  assert.deepEqual(names(run("q=Endstone").matched), ["Glacie"]);
  assert.deepEqual(names(run("q=lse").matched).sort(), ["LegacyScriptEngine", "YEssential"]);
  // "other" is too common a word to find the other loaders
  assert.ok(!names(run("q=other").matched).includes("lualoader"));
  // a LeviLamina-only package is not found by the platform name
  assert.ok(!names(run("q=levilamina").matched).includes("PLand"));
});

test("pages are clamped to the last one", () => {
  const many = Array.from({ length: 45 }, (_, i) => entry(`github.com/x/p${i}`, { stars: 100 - i }));
  const state = (q: string): QueryState => parseQuery(new URLSearchParams(q));
  assert.equal(runQuery(many, state(""), null).items.length, 20);
  assert.equal(runQuery(many, state(""), null).pageCount, 3);
  assert.equal(runQuery(many, state("page=3"), null).items.length, 5);
  const past = runQuery(many, state("page=99"), null);
  assert.equal(past.page, 3);
  assert.equal(past.items[0]?.name, "p40");
  assert.equal(runQuery(many, state("per=50"), null).pageCount, 3);
});

test("filter count and clear all (search and sort stay)", () => {
  const s = parseQuery(new URLSearchParams("q=x&cat=economy,-library&platform=lse&env=client&license=oss&author=a&tags=t&sort=stars&page=2"));
  assert.equal(filterCount(s), 7);
  assert.equal(serializeQuery(clearFilters(s)), "/?q=x&sort=stars");
});
