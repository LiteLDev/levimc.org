import assert from "node:assert/strict";
import { test } from "node:test";
import { chineseScript, isChinese, labelReadmes, languageOfFileName, pickReadme, readmeFiles, readmeLabel } from "./readme-language.ts";

const EN = "# Land\n\nA land plugin for LeviLamina servers. Claim an area, share it with friends, protect it from griefers.";
const HANS = "# 领地\n\n这是一个适用于 LeviLamina 服务器的领地插件。圈出一块区域，与朋友共享，防止它被破坏。";
const HANT = "# 領地\n\n這是一個適用於 LeviLamina 伺服器的領地外掛。圈出一塊區域，與朋友共享，防止它被破壞。";

test("README files among a repository's files, README.md first", () => {
  assert.deepEqual(readmeFiles(["src", "README.zh.md", "LICENSE", "README.md", "readme_en.md", "README.md.bak"]), [
    "README.md",
    "README.zh.md",
    "readme_en.md",
  ]);
  assert.deepEqual(readmeFiles(["src", "LICENSE"]), ["README.md"]);
});

test("a file name's language", () => {
  assert.equal(languageOfFileName("README.md"), null);
  assert.equal(languageOfFileName("README.en.md"), "en");
  assert.equal(languageOfFileName("README_en-US.md"), "en");
  assert.equal(languageOfFileName("README.zh.md"), "zh");
  assert.equal(languageOfFileName("README.zh-Hans.md"), "zh-Hans");
  assert.equal(languageOfFileName("README_zh_CN.md"), "zh-Hans");
  assert.equal(languageOfFileName("README.CN.md"), "zh-Hans");
  assert.equal(languageOfFileName("README.zh-Hant.md"), "zh-Hant");
  assert.equal(languageOfFileName("README.zh-TW.md"), "zh-Hant");
  assert.equal(languageOfFileName("README-zh-HK.md"), "zh-Hant");
  assert.equal(languageOfFileName("README.ja.md"), "ja");
});

test("Chinese or not, Simplified or Traditional", () => {
  assert.equal(isChinese(EN), false);
  assert.equal(isChinese(`${EN}\n\nSearch tip: try 领地.`), false);
  assert.equal(isChinese(HANS), true);
  assert.equal(isChinese(`${HANS}\n\n\`\`\`sh\nlip install github.com/example/land and many more english words here\n\`\`\``), true);
  assert.equal(isChinese("# ランド\n\nLeviLamina サーバー用の土地プラグインです。"), false);
  assert.equal(chineseScript(HANS), "zh-Hans");
  assert.equal(chineseScript(HANT), "zh-Hant");
  assert.equal(chineseScript("# 插件"), "zh-Hans");
});

test("README.md is labelled from its text", () => {
  // README.md in Simplified Chinese next to README.en.md
  assert.deepEqual(
    labelReadmes([
      { file: "README.md", text: HANS },
      { file: "README.en.md", text: EN },
    ]).map((r) => r.lang),
    ["zh-Hans", "en"],
  );
  // README.md in English next to README.zh.md (in Traditional)
  assert.deepEqual(
    labelReadmes([
      { file: "README.md", text: EN },
      { file: "README.zh.md", text: HANT },
    ]).map((r) => r.lang),
    ["en", "zh-Hant"],
  );
  // an English README.md next to README.en.md is the same language twice: unknown, kept as the default
  assert.deepEqual(
    labelReadmes([
      { file: "README.md", text: EN },
      { file: "README.en.md", text: EN },
    ]).map((r) => r.lang),
    [null, "en"],
  );
  // a second file in a language already there is left out
  assert.deepEqual(
    labelReadmes([
      { file: "README.md", text: HANS },
      { file: "README.zh-CN.md", text: HANS },
    ]).map((r) => r.file),
    ["README.md"],
  );
});

test("the README in the interface language", () => {
  const readmes = labelReadmes([
    { file: "README.md", text: HANS },
    { file: "README.en.md", text: EN },
  ]);
  assert.equal(pickReadme(readmes, "en")?.file, "README.en.md");
  assert.equal(pickReadme(readmes, "zh-CN")?.file, "README.md");
  // Traditional falls back to Simplified
  assert.equal(pickReadme(readmes, "zh-Hant")?.file, "README.md");
  const three = labelReadmes([
    { file: "README.md", text: EN },
    { file: "README.zh-Hans.md", text: HANS },
    { file: "README.zh-Hant.md", text: HANT },
  ]);
  assert.equal(pickReadme(three, "zh-Hant")?.file, "README.zh-Hant.md");
  assert.equal(pickReadme(three, "zh-CN")?.file, "README.zh-Hans.md");
  // no README in the language: README.md
  assert.equal(pickReadme(labelReadmes([{ file: "README.md", text: HANS }]), "en")?.file, "README.md");
  assert.equal(pickReadme([], "en"), undefined);
});

test("a README's language in its own words", () => {
  assert.equal(readmeLabel({ file: "README.md", lang: "zh-Hant", text: "" }), "繁體中文");
  assert.equal(readmeLabel({ file: "README.ja.md", lang: "ja", text: "" }), "日本語");
  assert.equal(readmeLabel({ file: "README.md", lang: null, text: "" }), "README.md");
});
