import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { gunzipSync } from "node:zlib";
import { isDependencyKey, OLD_KEYS_MESSAGE, parseLipToml, readToml } from "./lipfile.ts";
import { renderTemplate, TemplateNumber, TemplateObject, type TemplateValue } from "./scriban.ts";

// testdata/templates.jsonl and testdata/tomlparse.jsonl.gz are LeviLauncher's
// (internal/lipcore/migrate/testdata/golden, internal/lipcore/doc/testdata):
// Scriban 7.5.0's renderings, and what lip's TOML reader (Tomlyn) accepts.
const testdata = (file: string) => new URL(`./testdata/${file}`, import.meta.url);

/** A JSON text as a template model, member order and number literals kept. */
function jsonModel(text: string): TemplateValue {
  let i = 0;
  const ws = () => {
    while (/\s/.test(text[i] ?? "")) i++;
  };
  const value = (): TemplateValue => {
    ws();
    const c = text[i];
    if (c === "{") {
      i++;
      const members: [string, TemplateValue][] = [];
      ws();
      if (text[i] === "}") return i++, new TemplateObject(members);
      for (;;) {
        ws();
        const key = value() as string;
        ws();
        i++; // :
        members.push([key, value()]);
        ws();
        if (text[i++] === "}") return new TemplateObject(members);
      }
    }
    if (c === "[") {
      i++;
      const items: TemplateValue[] = [];
      ws();
      if (text[i] === "]") return i++, items;
      for (;;) {
        items.push(value());
        ws();
        if (text[i++] === "]") return items;
      }
    }
    if (c === '"') {
      const start = i;
      for (i++; text[i] !== '"'; i++) if (text[i] === "\\") i++;
      return JSON.parse(text.slice(start, ++i)) as string;
    }
    const m = /^(?:true|false|null|-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)/.exec(text.slice(i))![0];
    i += m.length;
    return m === "true" ? true : m === "false" ? false : m === "null" ? null : new TemplateNumber(m);
  };
  return value();
}

test("templates render as Scriban renders them (LeviLauncher's golden cases)", () => {
  const lines = readFileSync(testdata("templates.jsonl"), "utf8").split("\n").filter(Boolean);
  assert.ok(lines.length >= 100);
  for (const line of lines) {
    const c = JSON.parse(line) as { template: string; model: string; want: string | null; err: string | null };
    const model = jsonModel(c.model) as TemplateObject;
    let got: string | Error;
    try {
      got = renderTemplate(c.template, (name) => model.get(name));
    } catch (error) {
      got = error as Error;
    }
    if (c.err) assert.ok(got instanceof Error, `${c.template}: rendered ${String(got)}, Scriban failed with ${c.err}`);
    else assert.equal(got, c.want, c.template);
  }
});

test("TOML files are read or rejected as lip reads them (Tomlyn's cases, but for TOML 1.1 and .NET string corners)", () => {
  const rows = gunzipSync(readFileSync(testdata("tomlparse.jsonl.gz")))
    .toString("utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as { in: string; kind: "OK" | "ERR" });
  const strict = new TextDecoder("utf-8", { fatal: true });
  let differ = 0;
  for (const row of rows) {
    let read: boolean;
    try {
      readToml(strict.decode(Buffer.from(row.in, "base64")));
      read = true;
    } catch {
      read = false;
    }
    if (read !== (row.kind === "OK")) differ++;
  }
  // smol-toml reads TOML 1.0: 46 of 9838 differ (TOML 1.1 tables, UTF-16 byte order marks, lone surrogates in keys)
  assert.ok(differ <= rows.length * 0.005, `${differ} of ${rows.length} differ`);
});

const FILE = `format = 4
id = "github.com/o/Mod"
version = "1.2.0"

[info]
name = "{{ info.tags[0] }} mod"
description = "for {{ id }}@{{version}}"
tags = ["utility", "tp"]
logo = "https://{{id}}/raw/v{{version}}/logo.png"

[[variants.""]]
side = "server"
platform = "win-x64"
assets = [{ type = "zip", urls = ["https://{{id}}/releases/download/v{{version}}/mod.zip"], place = [{ src = "Mod/", dest = "plugins/Mod/" }] }]

[variants."".deps]
"github.com/LiteLDev/LeviLamina" = ">=1.0.0"

[[variants.client]]
side = "client"
platform = "win-x64"
assets = [{ type = "mcmod", urls = ["https://x/mod.zip"] }]
deps = { "github.com/LiteLDev/LeviLamina#client" = "1.*" }
`;

test("lip.toml: read with every string rendered against the whole document", () => {
  const { doc, error } = parseLipToml(FILE);
  assert.equal(error, undefined);
  assert.deepEqual(doc, {
    id: "github.com/o/Mod",
    version: "1.2.0",
    info: { name: "utility mod", description: "for github.com/o/Mod@1.2.0", tags: ["utility", "tp"], logo: "https://github.com/o/Mod/raw/v1.2.0/logo.png" },
    variants: {
      "": [{ side: "server", platform: "win-x64", deps: { "github.com/LiteLDev/LeviLamina": ">=1.0.0" }, dests: ["plugins/Mod/"] }],
      client: [{ side: "client", platform: "win-x64", deps: { "github.com/LiteLDev/LeviLamina#client": "1.*" }, dests: ["mods/"] }],
    },
  });
  // a byte order mark, no info
  assert.deepEqual(parseLipToml(`\uFEFFformat = 4\nid = "github.com/o/M"\nversion = "0.1.0-rc.1"\nvariants = {}\n`).doc?.info, { name: "", description: "", tags: [] });
});

test("lip.toml: what lip v0.40 does not read", () => {
  const error = (text: string) => parseLipToml(text).error ?? "";
  const swap = (from: string, to: string) => error(FILE.replace(from, to));
  // the keys of lip before v0.40, before anything else of the entry is read
  for (const [old, path] of [
    [swap('side = "server"\nplatform = "win-x64"', 'platform = "server"\nruntime = "win-x64"'), '$.variants[""][0]'],
    [swap('side = "server"', 'side = "server"\nruntime = "win-x64"'), '$.variants[""][0]'],
    [swap('side = "client"\nplatform = "win-x64"', 'platform = "client"'), '$.variants["client"][0]'],
  ]) {
    assert.equal(old, `Invalid package file at ${path}: ${OLD_KEYS_MESSAGE}.`);
  }
  assert.match(swap('side = "server"', 'side = "both"'), /\$\.variants\[""\]\[0\]\.side: must be "server" or "client"/);
  assert.match(swap('side = "server"\n', ""), /side: is required/);
  assert.match(swap('platform = "win-x64"', 'platform = "win-*"'), /is not a runtime identifier/);
  assert.match(swap('"github.com/LiteLDev/LeviLamina" =', '"github.com/LiteLDev/LeviLamina@v1.0.0" ='), /is not <package id> or <package id>#<variant>/);
  assert.match(swap("format = 4", "format = 3"), /\$\.format: must be 4/);
  assert.match(swap("format = 4", "format = 5"), /a format this lip does not know/);
  assert.match(swap('version = "1.2.0"', 'version = "v1.2.0"'), /is not a version/);
  assert.match(swap('id = "github.com/o/Mod"', 'id = "Mod"'), /is not a valid Go module path/);
  assert.match(swap("logo = \"https://", 'logo = "http://'), /does not start with "https:\/\/"/);
  assert.match(swap("[[variants.client]]", "[[variants.Client]]"), /'Client' is not a variant/);
  assert.match(swap('platform = "win-x64"\nassets = [{ type = "mcmod"', 'platform = "win-x64"\nassets = [{ type = "tar"'), /must be "self", "zip" or "mcmod"/);
  assert.match(swap("[[variants.client]]\nside = \"client\"", '[[variants.""]]\nside = "server"').replace(/\n/g, " "), /has the side and the platform of/);
  // what is not TOML, or not a value lip reads; a template it cannot render
  assert.match(error("format = "), /not a valid TOML file/);
  assert.match(swap('version = "1.2.0"', 'version = "1.2.0"\nreleased = 2026-01-01'), /a date or a time/);
  assert.match(swap("{{ info.tags[0] }}", "{{ info.tags | array.first }}"), /cannot be rendered/);
  assert.match(swap("{{ info.tags[0] }}", "{{ info.missing.deep }}"), /cannot be rendered/);
});

test("dependency keys: a package id, maybe a variant", () => {
  assert.ok(isDependencyKey("github.com/LiteLDev/LeviLamina"));
  assert.ok(isDependencyKey("github.com/LiteLDev/LegacyScriptEngine#client_nodejs"));
  assert.ok(isDependencyKey("gitea.litebds.com/ShrBox/7-zip"));
  assert.ok(!isDependencyKey("github.com/LiteLDev/LeviLamina#"));
  assert.ok(!isDependencyKey("github.com/LiteLDev/LeviLamina#Client"));
  assert.ok(!isDependencyKey("LeviLamina"));
  assert.ok(!isDependencyKey("github.com/o/r@v1.0.0"));
});
