import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveAvatarUrl, resolveMarkdownUrl, resolveSrcSet, themedMedia, updateUrl } from "./markdown.ts";

const BASES = {
  raw: "https://raw.githubusercontent.com/o/r/v1.0.0/",
  blob: "https://github.com/o/r/blob/v1.0.0/",
};
const link = (url: string | undefined) => resolveMarkdownUrl(url, "link", BASES);
const image = (url: string) => resolveMarkdownUrl(url, "image", BASES);

test("relative README links point into the repository", () => {
  assert.equal(link("docs/a.md"), `${BASES.blob}docs/a.md`);
  assert.equal(link("./LICENSE"), `${BASES.blob}LICENSE`);
  assert.equal(link("/assets/x.png"), `${BASES.blob}assets/x.png`);
  assert.equal(link("docs/../README.zh.md#用法"), `${BASES.blob}README.zh.md#用法`);
  assert.equal(link("docs/./a.md?plain=1"), `${BASES.blob}docs/a.md?plain=1`);
  assert.equal(image("assets/icon.png"), `${BASES.raw}assets/icon.png`);
  assert.equal(image("./assets/icon.png"), `${BASES.raw}assets/icon.png`);
});

test("relative URLs that climb out of the repository resolve as on GitHub", () => {
  // The workflow badge trick: README at blob/<ref>/, two levels up is the repository page.
  assert.equal(
    image("../../actions/workflows/build.yml/badge.svg"),
    "https://github.com/o/r/actions/workflows/build.yml/badge.svg",
  );
  assert.equal(link("../../actions/workflows/build.yml"), "https://github.com/o/r/actions/workflows/build.yml");
  assert.equal(link("../../issues?q=is%3Aopen"), "https://github.com/o/r/issues?q=is%3Aopen");
  assert.equal(link("../docs/a.md"), "https://github.com/o/r/blob/docs/a.md");
  // Other hosts: the ref (`refs/tags/v1`) is one level, as on GitHub.
  const other = { raw: "https://git.example/o/r/raw/refs/tags/v1/", blob: "https://git.example/o/r/blob/refs/tags/v1/" };
  assert.equal(resolveMarkdownUrl("../../actions/x.svg", "image", other), "https://git.example/o/r/actions/x.svg");
  assert.equal(resolveMarkdownUrl("../docs/a.md", "link", other), "https://git.example/o/r/blob/docs/a.md");
});

test("srcset URLs resolve like image sources", () => {
  assert.equal(
    resolveSrcSet("docs/a.png 1x, ./docs/b.png 2x", BASES),
    `${BASES.raw}docs/a.png 1x, ${BASES.raw}docs/b.png 2x`,
  );
  assert.equal(resolveSrcSet("docs/dark.svg", BASES), `${BASES.raw}docs/dark.svg`);
  // Commas inside a URL belong to it.
  const chart = "https://api.star-history.com/svg?repos=a/b,c/d&type=Date";
  assert.equal(resolveSrcSet(`${chart} 2x,docs/x.png`, BASES), `${chart} 2x, ${BASES.raw}docs/x.png`);
  assert.equal(
    resolveSrcSet("https://lamina.levimc.org/logo.svg", BASES),
    "https://docs.levimc.org/LeviLamina/logo.svg",
  );
});

test("absolute URLs, mail links and anchors pass through", () => {
  assert.equal(link("https://example.com/x"), "https://example.com/x");
  assert.equal(link("mailto:a@b.c"), "mailto:a@b.c");
  assert.equal(link("//cdn.example/x.png"), "//cdn.example/x.png");
  assert.equal(link("#usage"), "#usage");
  assert.equal(link(undefined), undefined);
});

test("percent-encoded anchors are spelled like heading ids", () => {
  assert.equal(link("#%E7%89%B9%E6%80%A7"), "#特性");
  assert.equal(link("#%E0%A4%A"), "#%E0%A4%A");
});

test("retired documentation hosts point at pages that exist on docs.levimc.org", () => {
  const LL = "https://docs.levimc.org/LeviLamina/";
  const cases: [string, string][] = [
    ["https://lamina.levimc.org/", LL],
    ["https://lamina.levimc.org", LL],
    ["https://lamina.levimc.org/quickstart/", `${LL}user_guides/install/`],
    ["https://lamina.levimc.org/quickstart", `${LL}user_guides/install/`],
    ["https://levilamina.liteldev.com/quickstart/", `${LL}user_guides/install/`],
    ["https://levilamina.liteldev.com", LL],
    ["https://lamina.levimc.org/user_guides/install/", `${LL}user_guides/install/`],
    ["https://lamina.levimc.org/user_guides/install_on_client/#client", `${LL}user_guides/install_on_client/#client`],
    [
      "https://lamina.levimc.org/developer_guides/tutorials/create_your_first_mod/",
      `${LL}developer_guides/tutorials/create_your_first_mod/`,
    ],
    // A page that is not known to exist goes to the docs home, not to a 404.
    ["https://lamina.levimc.org/no/such/page/#x", LL],
    ["http://lse.levimc.org", "https://docs.levimc.org/LegacyScriptEngine/"],
    ["https://lse.liteldev.com", "https://docs.levimc.org/LegacyScriptEngine/"],
    ["https://legacy-script-engine.levimc.org", "https://docs.levimc.org/LegacyScriptEngine/"],
    ["https://lip.levimc.org/guide/", "https://docs.levimc.org/lip/"],
    ["https://lip.futrime.com", "https://docs.levimc.org/lip/"],
    [
      "https://lip.docs.litebds.com/en/#/tutorials/create_a_lip_tooth",
      "https://docs.levimc.org/lip/guides/creating_packages.html",
    ],
    ["https://lip.docs.litebds.com/zh-cn/#/", "https://docs.levimc.org/lip/"],
    ["https://levilauncher.levimc.org/", "https://docs.levimc.org/LeviLauncher/"],
    ["https://levimc.org/software/levilamina", LL],
  ];
  for (const [from, to] of cases) assert.equal(link(from), to, from);
  // Look-alikes stay as they are.
  assert.equal(link("https://lamina.levimc.org.example/"), "https://lamina.levimc.org.example/");
  assert.equal(link("https://docs.levimc.org/LeviLamina/"), LL);
});

test("LiteLDev repositories and pages that moved", () => {
  const cases: [string, string][] = [
    ["https://github.com/futrime/lip", "https://github.com/LiteLDev/lip"],
    ["https://github.com/futrime/lip/releases", "https://github.com/LiteLDev/lip/releases"],
    ["https://github.com/LeviLamina/LeviLamina", "https://github.com/LiteLDev/LeviLamina"],
    ["https://github.com/LiteLDev/HelperLib", "https://github.com/LiteLDev/legacy-script-engine-api"],
    ["https://github.com/LiteLDev/HelperLib/releases", "https://github.com/LiteLDev/legacy-script-engine-api/releases"],
    ["https://github.com/LiteLDev/LegacyScriptEngine_API", "https://github.com/LiteLDev/legacy-script-engine-api"],
    [
      "https://github.com/LiteLDev/levilamina-plugin-template/issues/new/choose",
      "https://github.com/LiteLDev/levilamina-mod-template/issues/new/choose",
    ],
    [
      "https://github.com/LiteLDev/LeviLamina/blob/develop/src/ll/api/i18n",
      "https://github.com/LiteLDev/LeviLamina/tree/main/src/ll/api/i18n",
    ],
    [
      "https://github.com/LiteLDev/LeviLamina/blob/develop/README.md",
      "https://github.com/LiteLDev/LeviLamina/blob/main/README.md",
    ],
    [
      "https://github.com/LiteLDev/MoreDimensions/actions/workflows/test_build.yml",
      "https://github.com/LiteLDev/MoreDimensions/actions/workflows/build.yml",
    ],
  ];
  for (const [from, to] of cases) assert.equal(link(from), to, from);
  assert.equal(link("https://afdian.tv/a/GlacieTeam"), "https://afdian.com/a/GlacieTeam");
  assert.equal(link("https://afdian.tvx/a/b"), "https://afdian.tvx/a/b");
  // Look-alikes and live addresses stay as they are.
  for (const url of [
    "https://github.com/futrime/lipr",
    "https://github.com/LiteLDev/HelperLibrary",
    "https://github.com/LiteLDev/LeviLamina/blob/main/README.md",
    "https://github.com/LiteLDev/MoreDimensions/blob/develop/src/test/TestCustomDimension.cpp",
    "https://github.com/LiteLDev/legacy-script-engine-api",
  ]) {
    assert.equal(link(url), url);
  }
});

test("links to renamed package repositories skip GitHub's redirect", () => {
  const renames = { "zimuya4153/lse_waila": "MiracleForest/LSE_Waila", "lwenk/stats": "LeafKnife/Stats" };
  const at = (url: string) => resolveMarkdownUrl(url, "link", BASES, renames);
  assert.equal(
    at("https://github.com/zimuya4153/LSE_Waila/blob/main/image/form.png?raw=true"),
    "https://github.com/MiracleForest/LSE_Waila/blob/main/image/form.png?raw=true",
  );
  assert.equal(at("https://github.com/lwenk/Stats/releases"), "https://github.com/LeafKnife/Stats/releases");
  assert.equal(at("https://GitHub.com/LWENK/stats"), "https://github.com/LeafKnife/Stats");
  assert.equal(at("https://github.com/lwenk/Stats.git"), "https://github.com/LeafKnife/Stats.git");
  assert.equal(
    at("https://raw.githubusercontent.com/lwenk/Stats/main/logo.png"),
    "https://raw.githubusercontent.com/LeafKnife/Stats/main/logo.png",
  );
  assert.equal(at("https://github.com/lwenk/Stats2"), "https://github.com/lwenk/Stats2");
  assert.equal(at("https://github.com/lwenk"), "https://github.com/lwenk");
  assert.equal(updateUrl("https://github.com/lwenk/Stats", renames), "https://github.com/LeafKnife/Stats");
});

test("avatars on retired hosts and renamed repositories are rewritten, others kept", () => {
  assert.equal(resolveAvatarUrl("https://lamina.levimc.org/logo.svg"), "https://docs.levimc.org/LeviLamina/logo.svg");
  assert.equal(
    resolveAvatarUrl("https://github.com/lwenk/Stats/raw/main/logo.png", { "lwenk/stats": "LeafKnife/Stats" }),
    "https://github.com/LeafKnife/Stats/raw/main/logo.png",
  );
  assert.equal(resolveAvatarUrl("https://example.com/a.png"), "https://example.com/a.png");
  assert.equal(resolveAvatarUrl(undefined), undefined);
});

test("light/dark <picture> sources follow the picked theme", () => {
  assert.equal(themedMedia("(prefers-color-scheme: dark)", "dark"), "all");
  assert.equal(themedMedia("(prefers-color-scheme: dark)", "light"), "not all");
  assert.equal(themedMedia(" ( prefers-color-scheme : LIGHT ) ", "light"), "all");
  // No explicit pick: the operating system decides, as on GitHub.
  assert.equal(themedMedia("(prefers-color-scheme: dark)", null), "(prefers-color-scheme: dark)");
  assert.equal(themedMedia("(min-width: 600px)", "dark"), "(min-width: 600px)");
  assert.equal(themedMedia(undefined, "dark"), undefined);
});
