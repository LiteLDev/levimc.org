import assert from "node:assert/strict";
import { test } from "node:test";
import { isLicenseFamily, licenseFamily, licenseOf } from "./licenses.ts";

test("families of SPDX ids", () => {
  const cases: [string | undefined, string][] = [
    ["MIT", "permissive"],
    ["Apache-2.0", "permissive"],
    ["BSD-3-Clause", "permissive"],
    ["BSD-2-Clause", "permissive"],
    ["ISC", "permissive"],
    ["Zlib", "permissive"],
    ["CC0-1.0", "permissive"],
    ["Unlicense", "permissive"],
    ["0BSD", "permissive"],
    ["LGPL-3.0", "weak-copyleft"],
    ["LGPL-2.1-or-later", "weak-copyleft"],
    ["MPL-2.0", "weak-copyleft"],
    ["EPL-2.0", "weak-copyleft"],
    ["GPL-3.0", "copyleft"],
    ["GPL-2.0-only", "copyleft"],
    ["AGPL-3.0", "copyleft"],
    ["NOASSERTION", "other"],
    ["WTFPL", "other"],
    ["CC-BY-4.0", "other"],
    ["mit", "permissive"],
    [undefined, "none"],
    ["", "none"],
  ];
  for (const [spdx, family] of cases) assert.equal(licenseFamily(spdx), family, String(spdx));
});

test("overrides by repository, any case, for the licenses GitHub cannot tell", () => {
  assert.equal(licenseOf({ id: "github.com/copper-lamp/BSChat", license: "NOASSERTION" }), "AGPL-3.0");
  assert.equal(licenseOf({ id: "github.com/IECKSEYR/hologramlib" }), "MIT");
  assert.equal(licenseOf({ id: "github.com/LiteLDev/LeviLamina", license: "LGPL-3.0" }), "LGPL-3.0");
  assert.equal(licenseOf({ id: "github.com/x/y" }), undefined);
  assert.equal(licenseFamily(licenseOf({ id: "github.com/copper-lamp/BSChat", license: "NOASSERTION" })), "copyleft");
});

test("family ids", () => {
  assert.ok(isLicenseFamily("weak-copyleft"));
  assert.ok(isLicenseFamily("none"));
  assert.ok(!isLicenseFamily("oss"));
  assert.ok(!isLicenseFamily("MIT"));
});
