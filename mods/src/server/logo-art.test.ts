import assert from "node:assert/strict";
import test from "node:test";
import { EMBLEMS, LAYOUT_KEYS, MATERIAL_KEYS, SKIES, catalogPlans, logoPlan, logoSvg, planKey, topicsOf } from "./logo-art.ts";

const mod = (id: string, name: string, description = "", tags: string[] = []) => ({ id, name, description, tags });

test("the topic comes from the name first, then the tags, then the description", () => {
  assert.equal(topicsOf(mod("github.com/a/LegacyMoney", "LegacyMoney", "LLMoney, adapted"))[0]?.key, "economy");
  assert.equal(topicsOf(mod("github.com/a/TeleportSystem", "TeleportSystem"))[0]?.key, "teleport");
  assert.equal(topicsOf(mod("github.com/a/x", "x", "", ["platform:levilamina", "anticheat"]))[0]?.key, "security");
  assert.equal(topicsOf(mod("github.com/a/x", "x", "跨服联合封禁黑名单"))[0]?.key, "moderation");
  // whole words only: "http" is no teleport, "for the mod loader" says nothing, OreUI is no ore
  assert.deepEqual(topicsOf(mod("github.com/a/x", "x", "Fetches http pages")).map((t) => t.key), ["network"]);
  assert.deepEqual(topicsOf(mod("github.com/a/x", "x", "A mod for the LeviLamina mod loader.")), []);
  assert.equal(topicsOf(mod("github.com/a/DearOreUI", "DearOreUI")).some((t) => t.key === "mining"), false);
});

test("a plan is the same every time, and a salt gives another", () => {
  const m = mod("github.com/a/LegacyMoney", "LegacyMoney");
  assert.deepEqual(logoPlan(m), logoPlan(m));
  assert.equal(logoPlan(m).topic, "economy");
  const salted = Array.from({ length: 6 }, (_, i) => JSON.stringify(logoPlan(m, i + 1)));
  assert.ok(salted.some((p) => p !== JSON.stringify(logoPlan(m))));
});

test("a mod nothing is known about still gets a plan", () => {
  const plan = logoPlan(mod("github.com/a/NeuroDragon", "NeuroDragon", "Description of NeuroDragon"));
  assert.equal(plan.topic, "general");
  assert.ok(plan.icon);
});

test("a catalogue's plans differ where they can", () => {
  const mods = Array.from({ length: 12 }, (_, i) => mod(`github.com/o${i}/Money${i}`, `Money${i}`, "an economy plugin"));
  const keys = [...catalogPlans(mods).values()].map(planKey);
  assert.equal(new Set(keys).size, keys.length);
});

test("the logo is an SVG with the icon and the avatar badge, and no text", () => {
  const input = { ...mod("github.com/a/LegacyMoney", "Legacy <Money>"), owner: "a", avatar: "data:image/png;base64,AAAA" };
  const svg = logoSvg(input);
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="288" height="288"/);
  assert.match(svg, /<image [^>]*href="data:image\/png;base64,AAAA"/);
  assert.match(svg, /<title>Legacy &lt;Money&gt;<\/title>/);
  assert.doesNotMatch(svg, /<text/);
  // without an avatar the badge shows a person
  assert.doesNotMatch(logoSvg({ ...input, avatar: undefined }), /<image/);
});

test("every material, layout, emblem and sky draws", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 400; i++) {
    const input = { ...mod(`github.com/o/m${i}`, `m${i}`), owner: "o" };
    const plan = logoPlan(input);
    seen.add(plan.material).add(plan.layout).add(plan.emblem).add(plan.sky);
    const svg = logoSvg(input, plan);
    assert.doesNotMatch(svg, /NaN|undefined|Infinity/);
  }
  for (const key of [...MATERIAL_KEYS, ...LAYOUT_KEYS, ...EMBLEMS, ...SKIES]) assert.ok(seen.has(key), key);
});

test("a topic is built from its own materials", () => {
  assert.ok(["gold", "quartz", "planks"].includes(logoPlan(mod("github.com/a/LegacyMoney", "LegacyMoney")).material));
  for (let i = 0; i < 20; i++) assert.ok(["ore", "stone", "planks"].includes(logoPlan(mod(`github.com/o${i}/VeinMiner`, "VeinMiner")).material));
});
