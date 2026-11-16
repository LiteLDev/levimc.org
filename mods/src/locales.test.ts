import assert from "node:assert/strict";
import { test } from "node:test";
import { isSitePath, legacyLocale, localeAlternates, localeBase, splitLocale, withLocale } from "./locales.ts";

const MOD = "github.com/LiteLDev/LeviLamina/";

test("the language comes first in the URL", () => {
  assert.equal(localeBase("en"), "/mods/");
  assert.equal(localeBase("zh-CN"), "/zh-Hans/mods/");
  assert.equal(localeBase("zh-Hant"), "/zh-Hant/mods/");
  assert.deepEqual(splitLocale(`/zh-Hans/mods/${MOD}`), { locale: "zh-CN", path: `/mods/${MOD}` });
  assert.deepEqual(splitLocale("/zh-Hant/mods"), { locale: "zh-Hant", path: "/mods/" });
  assert.deepEqual(splitLocale(`/mods/${MOD}`), { locale: "en", path: `/mods/${MOD}` });
  // levimc.org's own pages in Chinese are not this site's
  assert.deepEqual(splitLocale("/zh-Hans/about/"), { locale: "en", path: "/zh-Hans/about/" });
  assert.equal(isSitePath("/zh-Hans/about/"), false);
  assert.equal(isSitePath("/zh-Hans/mods/"), true);
  assert.equal(isSitePath("/mods/"), true);
});

test("links to the site's pages in a language", () => {
  assert.equal(withLocale(`/mods/${MOD}`, "en"), `/mods/${MOD}`);
  assert.equal(withLocale(`/mods/${MOD}`, "zh-CN"), `/zh-Hans/mods/${MOD}`);
  assert.equal(withLocale("/mods/?q=land#results", "zh-Hant"), "/zh-Hant/mods/?q=land#results");
  // a link naming a language keeps it
  assert.equal(withLocale("/zh-Hant/mods/", "zh-CN"), "/zh-Hant/mods/");
  // the old URLs (the language after the base) become the new ones, in their language
  assert.equal(withLocale(`/mods/zh-Hans/${MOD}`, "en"), `/zh-Hans/mods/${MOD}`);
  assert.equal(withLocale("/mods/zh-Hant/?q=x", "zh-CN"), "/zh-Hant/mods/?q=x");
  assert.equal(withLocale("/mods/zh-Hans?q=x", "en"), "/zh-Hans/mods/?q=x");
  assert.equal(withLocale("/mods/zh-Hans", "en"), "/zh-Hans/mods/");
  // other paths stay as they are
  assert.equal(withLocale("/about/", "zh-CN"), "/about/");
  assert.deepEqual(legacyLocale(`/mods/zh-Hant/${MOD}`), { locale: "zh-Hant", path: `/mods/${MOD}` });
  assert.equal(legacyLocale(`/mods/${MOD}`), null);
});

test("every page has an alternate in each language", () => {
  const expected = { en: `/mods/${MOD}`, "zh-CN": `/zh-Hans/mods/${MOD}`, "zh-Hant": `/zh-Hant/mods/${MOD}` };
  assert.deepEqual(localeAlternates(`/zh-Hant/mods/${MOD}`), expected);
  assert.deepEqual(localeAlternates(`/mods/${MOD}`), expected);
  assert.deepEqual(localeAlternates("/zh-Hans/mods/"), { en: "/mods/", "zh-CN": "/zh-Hans/mods/", "zh-Hant": "/zh-Hant/mods/" });
});
