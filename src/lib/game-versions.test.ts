import assert from "node:assert/strict";
import { test } from "node:test";
import { bdsVersions, compareVersions, resolveGameVersions, satisfies } from "./game-versions.ts";

test("lip ranges", () => {
  assert.ok(satisfies("1.9.3", "1.9.*"));
  assert.ok(!satisfies("1.10.0", "1.9.*"));
  assert.ok(satisfies("26.51.4", ">=26.51.2 <26.60.0"));
  assert.ok(!satisfies("26.60.0", ">=26.51.2 <26.60.0"));
  assert.ok(satisfies("1.2.0-rc.2", "1.2.0-rc.2"));
  assert.ok(satisfies("1.20.51", "1.20.50 || 1.20.51"));
  assert.ok(compareVersions("1.0.0-rc.3", "1.0.0") < 0);
  assert.ok(compareVersions("26.10.0", "1.21.132") > 0);
});

test("bds ranges name game versions", () => {
  assert.deepEqual(bdsVersions("1.20.50 || 1.20.51"), ["1.20.50", "1.20.51"]);
  assert.deepEqual(bdsVersions(">=1.21.0 <1.21.10"), ["1.21.0"]);
  assert.deepEqual(bdsVersions("1.21.132-patch.3"), ["1.21.132"]);
});

test("game versions through LeviLamina, directly and transitively", () => {
  const v = (deps: Record<string, string> = {}) => ({ dependencies: deps });
  const result = resolveGameVersions({
    packages: {
      "github.com/LiteLDev/LeviLamina": {
        variants: {
          "": { versions: { "1.9.0": v({ "github.com/LiteLDev/bds": "1.21.132-patch.3" }), "26.51.0": v({ "github.com/LiteLDev/bds": "1.26.51" }) } },
          client: { versions: { "26.51.0": v() } },
        },
      },
      "github.com/LiteLDev/LegacyScriptEngine": {
        variants: { "": { versions: { "0.1.0": v({ "github.com/LiteLDev/LeviLamina": "26.51.*" }) } } },
      },
      "github.com/a/Plugin": {
        variants: {
          "": { versions: { "1.0.0": v({ "github.com/LiteLDev/LegacyScriptEngine": ">=0.1.0" }) } },
          client: { versions: { "1.0.0": v({ "github.com/LiteLDev/LeviLamina#client": "1.9.*" }) } },
        },
      },
      "github.com/a/Standalone": { variants: { "": { versions: { "1.0.0": v() } } } },
    },
  });
  assert.deepEqual(result.get("github.com/a/plugin"), ["1.26.51", "1.21.132"]);
  assert.deepEqual(result.get("github.com/a/standalone"), []);
});
