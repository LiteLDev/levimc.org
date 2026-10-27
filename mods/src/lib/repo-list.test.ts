import assert from "node:assert/strict";
import { test } from "node:test";
import { addRepo, parseRepoList } from "./repo-list.ts";

test("repos.txt: one owner/repo per line", () => {
  assert.deepEqual(parseRepoList("LiteLDev/LeviLamina\r\n\n# a comment\nGroupMountain/GMLIB-Release  # trailing\nliteldev/levilamina\n"), [
    "LiteLDev/LeviLamina",
    "GroupMountain/GMLIB-Release",
  ]);
  assert.throws(() => parseRepoList("github.com/LiteLDev/LeviLamina\n"), /not an owner\/repo/);
});

test("a repository is added in its place, once", () => {
  const text = "amatouhake/Lamium\nLiteLDev/LeviLamina\n";
  assert.equal(addRepo(text, "GroupMountain/GMLIB"), "amatouhake/Lamium\nGroupMountain/GMLIB\nLiteLDev/LeviLamina\n");
  assert.equal(addRepo(text, "liteldev/levilamina"), text);
});
