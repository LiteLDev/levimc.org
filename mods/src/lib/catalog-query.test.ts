import assert from "node:assert/strict";
import { test } from "node:test";
import type { CatalogEntry } from "../types.ts";
import {
  clearFilters,
  DEFAULT_STATE,
  facetOptions,
  filterCount,
  parseQuery,
  runQuery,
  serializeQuery,
  type QueryState,
} from "./catalog-query.ts";
import { searchCatalog } from "./search.ts";

const entry = (id: string, over: Partial<CatalogEntry> = {}): CatalogEntry => ({
  id,
  name: id.split("/").at(-1)!,
  description: "",
  owner: id.split("/")[1]!,
  tags: [],
  side: ["server"],
  platform: ["win-x64"],
  gameVersions: [],
  deps: {},
  stars: 0,
  rank: 0,
  updated: "2026-01-01T00:00:00Z",
  ...over,
});

const LL = "github.com/LiteLDev/LeviLamina";

const CATALOG: CatalogEntry[] = [
  entry(LL, { stars: 1694, tags: ["library", "platform:levilamina"], side: ["server", "client"], platform: ["android-arm64", "win-x64"], license: "LGPL-3.0", updated: "2026-10-17T00:00:00Z", description: "A mod loader for Minecraft Bedrock" }),
  entry("github.com/LiteLDev/LegacyScriptEngine", { stars: 114, tags: ["library", "lse"], license: "GPL-3.0", deps: { [LL]: "1.*" }, updated: "2026-10-10T00:00:00Z" }),
  entry("github.com/GlacieTeam/Glacie", { stars: 115, tags: ["protocol", "platform:endstone"], side: ["server", "client"], platform: ["linux-x64", "win-x64"], license: "MIT" }),
  entry("github.com/Nico6719/YEssential", { stars: 30, tags: ["plugin", "essential", "lse", "money"], deps: { "github.com/LiteLDev/LegacyScriptEngine": "0.*" } }),
  entry("github.com/a/Money", { stars: 3, tags: ["economy", "platform:levilamina", "type:mod"], license: "MIT", deps: { [LL]: "1.*" }, created: "2025-01-01T00:00:00Z" }),
  entry("github.com/b/Bank", { stars: 3, tags: ["Category:Economy", "management"], updated: "2026-05-01T00:00:00Z", license: "NOASSERTION", deps: { [LL]: "1.*", "github.com/a/Money": "1.*" }, created: "2026-02-01T00:00:00Z" }),
  entry("github.com/c/PLand", { stars: 40, description: "领地插件", tags: ["land", "pland:library"], license: "GPL-3.0" }),
  entry("github.com/d/Minimap", { stars: 0, side: ["client"], platform: ["osx-arm64", "win-x64"], tags: ["hud", "client"] }),
  entry("github.com/copper-lamp/BSChat", { stars: 0, tags: ["chat"], license: "NOASSERTION" }),
  entry("github.com/e/lualoader", { stars: 1, side: [], platform: [], tags: ["lualoader"] }),
];

const OPTIONS = facetOptions(CATALOG);
const names = (items: CatalogEntry[]) => items.map((e) => e.name);
const parse = (query: string) => parseQuery(new URLSearchParams(query), undefined, OPTIONS);
const run = (query: string) => {
  const state = parse(query);
  return runQuery(CATALOG, state, searchCatalog(CATALOG, state.q));
};
const matched = (query: string) => names(run(query).matched).sort();

test("parse/serialize: defaults are omitted, so the default state is /", () => {
  assert.equal(serializeQuery(DEFAULT_STATE), "/mods/");
  assert.deepEqual(parse(""), DEFAULT_STATE);
  assert.deepEqual(parse("sort=relevance&per=20&page=1"), DEFAULT_STATE);
});

test("parse/serialize round-trip in a fixed parameter order", () => {
  const query =
    "page=2&sort=stars&author=LiteLDev&dep=github.com/LiteLDev/LeviLamina&license=permissive,GPL-3.0&tags=economy,-library&platform=win-x64&env=client&gv=1.21.0&q=land claim";
  const state = parse(query);
  const url = serializeQuery(state);
  assert.equal(
    url,
    "/mods/?q=land%20claim&gv=1.21.0&side=client&platform=win-x64&tags=economy,-library&license=permissive,GPL-3.0&dep=github.com/LiteLDev/LeviLamina&author=LiteLDev&sort=stars&page=2",
  );
  assert.deepEqual(parse(url.split("?")[1]!), state);
});

test("parse: removed keys and values are dropped (cat, license=oss, loader platforms)", () => {
  assert.equal(serializeQuery(parse("cat=economy&license=oss&platform=endstone,lse")), "/mods/");
  assert.deepEqual(parse("platform=-win-x64").platform, []);
});

test("parse: side, with env as its alias, in a fixed order", () => {
  assert.deepEqual(parse("side=Client,moon&env=server").side, ["server", "client"]);
  assert.deepEqual(parse("env=client").side, ["client"]);
  assert.equal(serializeQuery(parse("env=client")), "/mods/?side=client");
});

test("parse: platforms are RIDs some mod has, in the catalogue's spelling", () => {
  assert.deepEqual(parse("platform=WIN-X64,linux-x64&platform=win-x64,linux-arm64").platform, ["win-x64", "linux-x64"]);
  // without a vocabulary, nothing to check them against
  assert.deepEqual(parseQuery(new URLSearchParams("platform=linux-arm64")).platform, ["linux-arm64"]);
});

test("parse: tags are normalised, aliases become their featured tag, hidden tags are dropped", () => {
  assert.deepEqual(parse("tags=money,Category:Teleport,lse").tags, { inc: ["economy", "teleport", "lse"], exc: [] });
  assert.deepEqual(parse("tags=TP,-teleport").tags, { inc: [], exc: ["teleport"] });
  assert.deepEqual(parse("tags=platform:levilamina,type:mod,-client,plugin").tags, { inc: [], exc: [] });
  assert.equal(serializeQuery(parse("tags=Money&tags=-pland:library")), "/mods/?tags=economy,-library");
});

test("parse: licenses are families or SPDX ids some mod has, any case", () => {
  assert.deepEqual(parse("license=Permissive,mit,gpl-3.0,WTFPL,none").license, ["permissive", "MIT", "GPL-3.0", "none"]);
  assert.deepEqual(parseQuery(new URLSearchParams("license=WTFPL")).license, ["WTFPL"]);
  assert.deepEqual(parse("license=AGPL-3.0").license, ["AGPL-3.0"]); // only through the override
  assert.deepEqual(parseQuery(new URLSearchParams("license=mit"), { created: true, license: false }, OPTIONS).license, []);
});

test("parse: dependencies and authors once each, in any case", () => {
  const s = parse("dep=github.com/x/A,github.com/X/a&author=LiteLDev,liteldev");
  assert.deepEqual(s.dep, ["github.com/x/A"]);
  assert.deepEqual(s.author, ["LiteLDev"]);
});

test("parse: sorts and pages fall back; the page size is fixed", () => {
  assert.equal(serializeQuery(parse("per=100")), "/mods/");
  assert.equal(parse("sort=bogus").sort, "relevance");
  assert.equal(parse("sort=downloads").sort, "stars");
  assert.equal(parse("sort=newest").sort, "newest");
  assert.equal(parseQuery(new URLSearchParams("sort=newest"), { created: false, license: false }).sort, "relevance");
  assert.equal(parse("page=0").page, 1);
  assert.equal(parse("page=x").page, 1);
});

test("without a search and without ranks, relevance falls back to stars, then the latest update", () => {
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

test("tags: every one (AND), whole featured groups, -tag excludes", () => {
  assert.deepEqual(matched("tags=economy"), ["Bank", "Money", "YEssential"]);
  assert.deepEqual(matched("tags=money"), ["Bank", "Money", "YEssential"]);
  assert.deepEqual(matched("tags=economy,management"), ["Bank"]);
  assert.deepEqual(matched("tags=library"), ["LeviLamina", "LegacyScriptEngine", "PLand"].sort());
  assert.deepEqual(matched("tags=lse"), ["LegacyScriptEngine", "YEssential"]);
  assert.deepEqual(matched("tags=-library,-economy"), ["BSChat", "Glacie", "Minimap", "lualoader"]);
  assert.deepEqual(matched("tags=lse,-library"), ["YEssential"]);
  assert.deepEqual(matched("tags=nothing-has-this"), []);
});

test("side and platform: any of them (OR)", () => {
  assert.deepEqual(matched("side=client"), ["Glacie", "LeviLamina", "Minimap"]);
  assert.deepEqual(matched("env=client"), matched("side=client"));
  assert.equal(run("side=server,client").matched.length, CATALOG.length - 1);
  assert.deepEqual(matched("platform=linux-x64"), ["Glacie"]);
  assert.deepEqual(matched("platform=android-arm64,linux-x64"), ["Glacie", "LeviLamina"]);
  assert.deepEqual(matched("platform=osx-arm64&side=server"), []);
});

test("license: any family or SPDX id (OR), after the overrides", () => {
  assert.deepEqual(matched("license=permissive"), ["Glacie", "Money"]);
  assert.deepEqual(matched("license=weak-copyleft"), ["LeviLamina"]);
  assert.deepEqual(matched("license=copyleft"), ["BSChat", "LegacyScriptEngine", "PLand"]);
  assert.deepEqual(matched("license=other"), ["Bank"]);
  assert.deepEqual(matched("license=none"), ["Minimap", "YEssential", "lualoader"]);
  assert.deepEqual(matched("license=permissive,GPL-3.0"), ["Glacie", "LegacyScriptEngine", "Money", "PLand"]);
  assert.deepEqual(matched("license=AGPL-3.0"), ["BSChat"]);
});

test("dependencies (AND, any case), authors (OR, any case), groups AND", () => {
  assert.deepEqual(matched("dep=github.com/liteldev/levilamina"), ["Bank", "LegacyScriptEngine", "Money"]);
  assert.deepEqual(matched("dep=github.com/liteldev/levilamina,github.com/A/money"), ["Bank"]);
  assert.deepEqual(matched("author=liteldev,C"), ["LeviLamina", "LegacyScriptEngine", "PLand"].sort());
  assert.deepEqual(matched("author=liteldev&tags=lse"), ["LegacyScriptEngine"]);
  assert.deepEqual(matched("tags=economy&license=permissive&dep=github.com/LiteLDev/LeviLamina"), ["Money"]);
});

test("counts: an OR option as the group's only value, an AND option added, every other group as it is", () => {
  const { counts } = run("side=client&tags=library");
  // side counts keep the tag filter but not the side
  assert.equal(counts.side.server, 3);
  assert.equal(counts.side.client, 1);
  // tag counts: library mods on the client that also have the tag
  assert.equal(counts.tags.library, 1);
  assert.equal(counts.tags.lse, 0);
  assert.equal(counts.platform["android-arm64"], 1);
  assert.equal(counts.platform["linux-x64"], 0);
  assert.equal(counts.license["weak-copyleft"], 1);
  assert.equal(counts.license["LGPL-3.0"], 1);
  assert.equal(counts.license.copyleft, 0);
  assert.equal(counts.author.LiteLDev, 1);

  const economy = run("tags=economy").counts;
  assert.equal(economy.tags.economy, 3);
  assert.equal(economy.tags.management, 1);
  assert.equal(economy.side.client, 0);
  assert.equal(economy.license.permissive, 1);
  assert.equal(economy.license.none, 1);
  assert.equal(economy.license.NOASSERTION, 1);
  assert.equal(economy.dep["github.com/LiteLDev/LeviLamina"], 2);
  assert.equal(economy.dep["github.com/a/Money"], 1);

  // an excluded tag counts as if it were included instead
  const excluded = run("tags=-library").counts;
  assert.equal(excluded.tags.library, 3);
  assert.equal(excluded.tags.lse, 1);
  // values in the URL that no mod has are counted too
  assert.equal(run("tags=nothing-has-this").counts.tags["nothing-has-this"], 0);
  // hidden tags are never offered
  assert.equal(run("").counts.tags["platform:levilamina"], undefined);
});

test("options: featured tags with mods first in table order, then the rest by frequency", () => {
  assert.deepEqual(OPTIONS.tags, ["library", "utility", "management", "visual", "economy", "protocol", "lse", "chat", "lualoader"]);
  assert.deepEqual(OPTIONS.side, ["server", "client"]);
  assert.deepEqual(OPTIONS.platform, ["win-x64", "linux-x64", "android-arm64", "osx-arm64"]);
  assert.deepEqual(OPTIONS.license, [
    { family: "permissive", ids: ["MIT"] },
    { family: "weak-copyleft", ids: ["LGPL-3.0"] },
    { family: "copyleft", ids: ["GPL-3.0", "AGPL-3.0"] },
    { family: "other", ids: ["NOASSERTION"] },
    { family: "none", ids: [] },
  ]);
  assert.deepEqual(OPTIONS.dep, [LL, "github.com/a/Money", "github.com/LiteLDev/LegacyScriptEngine"]);
  assert.equal(OPTIONS.author[0], "LiteLDev");
  assert.equal(OPTIONS.author.length, 9);
});

test("search: name hits first, Chinese text found, popularity breaks ties", () => {
  assert.equal(run("q=levilamina").matched[0]?.name, "LeviLamina");
  assert.deepEqual(names(run("q=领地").matched), ["PLand"]);
  assert.equal(run("q=zzzzqqq").matched.length, 0);
});

test("search: featured labels in every language and normalised tags; hidden tags are not searched", () => {
  assert.deepEqual(matched("q=经济"), ["Bank", "Money", "YEssential"]);
  assert.deepEqual(matched("q=前置庫"), ["LeviLamina", "LegacyScriptEngine", "PLand"].sort());
  assert.deepEqual(matched("q=economy"), ["Bank", "Money", "YEssential"]);
  assert.deepEqual(matched("q=lse"), ["LegacyScriptEngine", "YEssential"]);
  // a raw alias tag is found as itself
  assert.deepEqual(matched("q=money"), ["Money", "YEssential"]);
  // loader tags are hidden: LeviLamina is not found on every mod, nor Endstone on Glacie
  assert.deepEqual(matched("q=levilamina"), ["LeviLamina"]);
  assert.deepEqual(matched("q=endstone"), []);
  // every word must match
  assert.deepEqual(matched("q=lse 前置库"), ["LegacyScriptEngine"]);
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
  const s = parse("q=x&gv=1.21.0&side=client&platform=win-x64&tags=economy,-library&license=permissive,MIT&dep=a/b&author=a&sort=stars&page=2");
  assert.equal(filterCount(s), 9);
  assert.equal(serializeQuery(clearFilters(s)), "/mods/?q=x&sort=stars");
});

test("game version (OR) and its counts", () => {
  const entries = [
    entry("github.com/x/A", { gameVersions: ["1.26.51", "1.26.40"], tags: ["economy"] }),
    entry("github.com/x/B", { gameVersions: ["1.26.40"], tags: ["economy", "money"] }),
    entry("github.com/x/C", { gameVersions: ["1.21.132"] }),
  ];
  const run = (state: Partial<QueryState>) => runQuery(entries, { ...DEFAULT_STATE, ...state }, null);
  assert.deepEqual(names(run({ gv: ["1.26.51", "1.21.132"] }).matched), ["A", "C"]);
  assert.deepEqual(facetOptions(entries).gv, ["1.26.51", "1.26.40", "1.21.132"]);
  const result = run({ tags: { inc: ["economy"], exc: [] } });
  assert.equal(result.counts.gv["1.26.40"], 2);
  assert.equal(result.counts.gv["1.21.132"], 0);
});

test("without a search, relevance is the rank, at most three mods of one author per page", () => {
  const entries = [
    ...Array.from({ length: 5 }, (_, i) => entry(`github.com/big/P${i}`, { rank: 10 - i })),
    entry("github.com/x/Other", { rank: 1, stars: 999 }),
  ];
  const order = runQuery(entries, DEFAULT_STATE, null).matched.map((e) => e.name);
  assert.deepEqual(order.slice(0, 4), ["P0", "P1", "P2", "Other"]);
  // a search orders by its score; the rank breaks ties
  const searched = runQuery(entries, DEFAULT_STATE, new Map(entries.map((e) => [e.id, 1]))).matched.map((e) => e.name);
  assert.deepEqual(searched, ["P0", "P1", "P2", "P3", "P4", "Other"]);
});
