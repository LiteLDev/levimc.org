import assert from "node:assert/strict";
import { test } from "node:test";
import type { RawModEntry } from "../types.ts";
import {
  buildModUrl,
  commandParts,
  getDefaultSelection,
  getReleaseUrl,
  getRepoBaseUrls,
  getRepositoryUrl,
  installCommand,
  isPrerelease,
  ownerAvatar,
  ownerOf,
  modPath,
  parseTab,
  resolveSelection,
  toothFromPath,
} from "./mods.ts";

const TOOTH = "github.com/LiteLDev/LeviLamina";
const entry: RawModEntry = {
  info: { name: "LeviLamina", description: "Mod loader", tags: [] },
  updated_at: "2026-10-17T00:00:00Z",
  stargazer_count: 1,
  variants: {
    "": { versions: ["1.0.0", "1.1.0"] },
    client: { versions: ["1.0.0"] },
  },
};

test("mod paths round-trip", () => {
  assert.equal(modPath(TOOTH), "/mods/github.com/LiteLDev/LeviLamina/");
  assert.equal(toothFromPath(modPath(TOOTH)), TOOTH);
  assert.equal(toothFromPath("/mods/github.com/x"), null);
  assert.equal(toothFromPath("/mods/"), null);
  assert.equal(toothFromPath("/mods/index.html"), null);
  assert.equal(toothFromPath("/github.com/LiteLDev/LeviLamina/"), null);
});

test("owners and their avatars", () => {
  assert.equal(ownerOf(TOOTH), "LiteLDev");
  assert.equal(ownerAvatar("LiteLDev"), "https://avatars.githubusercontent.com/LiteLDev?s=144");
});

test("the default selection is the default variant's latest version", () => {
  assert.deepEqual(getDefaultSelection(entry), { variant: "", version: "1.1.0" });
});

test("selections fall back to what the mod has", () => {
  assert.deepEqual(resolveSelection(entry, "client", "1.0.0"), { variant: "client", version: "1.0.0" });
  assert.deepEqual(resolveSelection(entry, "client", "9.9.9"), { variant: "client", version: "1.0.0" });
  assert.deepEqual(resolveSelection(entry, "nope", "1.0.0"), { variant: "", version: "1.0.0" });
  assert.deepEqual(resolveSelection(entry, null, null), { variant: "", version: "1.1.0" });
});

test("the default selection has the bare URL; tabs add tab=", () => {
  assert.equal(buildModUrl(TOOTH, entry, { variant: "", version: "1.1.0" }), modPath(TOOTH));
  assert.equal(
    buildModUrl(TOOTH, entry, { variant: "client", version: "1.0.0" }),
    `${modPath(TOOTH)}?variant=client&version=1.0.0`,
  );
  assert.equal(buildModUrl(TOOTH, entry, { variant: "", version: "1.1.0" }, "versions"), `${modPath(TOOTH)}?tab=versions`);
  assert.equal(
    buildModUrl(TOOTH, entry, { variant: "client", version: "1.0.0" }, "dependencies"),
    `${modPath(TOOTH)}?variant=client&version=1.0.0&tab=dependencies`,
  );
});

test("tabs: unknown values show the description", () => {
  assert.equal(parseTab("versions"), "versions");
  assert.equal(parseTab("dependencies"), "dependencies");
  assert.equal(parseTab("gallery"), "description");
  assert.equal(parseTab(null), "description");
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

test("release links: the exact tag when known, else the releases page", () => {
  const repo = "https://github.com/LiteLDev/LeviLamina";
  assert.equal(getReleaseUrl(repo, { tag: "v1.1.0" }), `${repo}/releases/tag/v1.1.0`);
  assert.equal(getReleaseUrl(repo, undefined), `${repo}/releases`);
});

test("install commands and pre-releases", () => {
  assert.equal(installCommand(TOOTH, "", "1.1.0"), `lip install ${TOOTH}@1.1.0`);
  assert.equal(installCommand(TOOTH, "client", "1.0.0"), `lip install ${TOOTH}#client@1.0.0`);
  assert.ok(isPrerelease("1.0.0-rc.1"));
  assert.ok(isPrerelease("0.3.0-mc26.51"));
  assert.ok(!isPrerelease("26.51.7"));
});

test("install commands break between the tooth's parts, never inside a version", () => {
  assert.deepEqual(commandParts(`lip install ${TOOTH}#client@1.0.0-rc.1`), [
    "lip install ",
    "github.com/",
    "LiteLDev/",
    "LeviLamina",
    "#client",
    "@1.0.0-rc.1",
  ]);
  assert.equal(commandParts(installCommand(TOOTH, "", "1.1.0")).join(""), `lip install ${TOOTH}@1.1.0`);
});
