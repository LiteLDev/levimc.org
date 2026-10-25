// A mod's README in several languages: `README.md` plus `README.<lang>.md`
// files next to it (`README.en.md`, `README.zh.md`, `README.zh-Hans.md`,
// `README.zh-Hant.md`, and the other spellings repositories use:
// `README_zh-CN.md`, `README.CN.md` …). Each file's language comes from its
// name; `README.md` and `README.zh.md` say less, so their text decides (Chinese
// or not, Simplified or Traditional). The page shows the one in the visitor's
// language.
import type { Locale } from "../locales";

/** A README file of a version. `lang`: `en`, `zh-Hans`, `zh-Hant`, another BCP-47 tag, or `null` (unknown). */
export interface Readme {
  file: string;
  lang: string | null;
  text: string;
}

/** The files tried when the build could not list the repository's files. */
export const DEFAULT_README_FILES = ["README.md", "README.en.md", "README.zh.md", "README.zh-Hans.md", "README.zh-Hant.md"];

const README_FILE = /^readme(?:[._-]([a-z]{2,3}(?:[-_][a-z0-9]{2,8})*))?\.md$/i;

/**
 * The README files among a repository's top-level file names, `README.md`
 * first (`["README.md"]` when there is none: what the site always tried).
 */
export function readmeFiles(names: readonly string[]): string[] {
  const files = names.filter((n) => README_FILE.test(n));
  files.sort((a, b) => Number(!!README_FILE.exec(a)?.[1]) - Number(!!README_FILE.exec(b)?.[1]));
  return files.length ? files : ["README.md"];
}

/** Suffixes that are not language tags but name one (`README.CN.md`). */
const SUFFIX_ALIASES: Record<string, string> = { cn: "zh-Hans", chs: "zh-Hans", cht: "zh-Hant" };
const HANS = /^zh-(hans|cn|sg|my)\b/;
const HANT = /^zh-(hant|tw|hk|mo)\b/;

/**
 * The language a file name gives: `en`, `zh-Hans`, `zh-Hant`, another tag,
 * `zh` (Chinese, script unknown) or `null` (no suffix).
 */
export function languageOfFileName(file: string): string | null {
  const suffix = README_FILE.exec(file)?.[1];
  if (!suffix) return null;
  const tag = suffix.toLowerCase().replace(/_/g, "-");
  if (SUFFIX_ALIASES[tag]) return SUFFIX_ALIASES[tag];
  if (HANS.test(tag)) return "zh-Hans";
  if (HANT.test(tag)) return "zh-Hant";
  const base = tag.split("-")[0]!;
  return base === "en" || base === "zh" ? base : tag;
}

/** Prose only: code, HTML tags, URLs and link targets say nothing about a README's language. */
function prose(markdown: string): string {
  return markdown
    .replace(/^(```|~~~)[\s\S]*?^\1/gm, " ")
    .replace(/`[^`\n]*`/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/https?:\/\/\S+/g, " ");
}

/** Written in Chinese: as many Han characters as half the English words, and not Japanese (kana). */
export function isChinese(markdown: string): boolean {
  const text = prose(markdown);
  const han = text.match(/\p{Script=Han}/gu)?.length ?? 0;
  const kana = text.match(/[\p{Script=Hiragana}\p{Script=Katakana}]/gu)?.length ?? 0;
  const words = text.match(/[A-Za-z]+/g)?.length ?? 0;
  return han > 0 && han * 2 >= words && kana * 10 < han;
}

// Common characters written one way in Simplified and another in Traditional
// Chinese (pairs at the same position), leaving out those both scripts use
// (后, 于, 里, 着, 内, 户 …).
const SIMPLIFIED =
  "这个们为说时会来对发过还动进实现开关种样经没与让认机体点无将长问题间学东两门车见头话应变号数据设载运务组块档库装码项录页链软网络线输显击选择单钮图标册错误讯级调试测验证权读写删览杂简统计储缓环类属态当获处资节约条产业专区华国语汉译释帮状况报维护许协议贡献请际难虽吗历战伤杀乐买卖钱银领传边远观视觉画声风电脑优稳归极启闭结构编镜挂签书记评论补换转闪备给";
const TRADITIONAL =
  "這個們為說時會來對發過還動進實現開關種樣經沒與讓認機體點無將長問題間學東兩門車見頭話應變號數據設載運務組塊檔庫裝碼項錄頁鏈軟網絡線輸顯擊選擇單鈕圖標冊錯誤訊級調試測驗證權讀寫刪覽雜簡統計儲緩環類屬態當獲處資節約條產業專區華國語漢譯釋幫狀況報維護許協議貢獻請際難雖嗎歷戰傷殺樂買賣錢銀領傳邊遠觀視覺畫聲風電腦優穩歸極啟閉結構編鏡掛簽書記評論補換轉閃備給啓";
const SIMPLIFIED_SET = new Set(SIMPLIFIED);
const TRADITIONAL_SET = new Set(TRADITIONAL);

/** Simplified (`zh-Hans`) unless more of the characters are Traditional-only. */
export function chineseScript(markdown: string): "zh-Hans" | "zh-Hant" {
  let simplified = 0;
  let traditional = 0;
  for (const ch of prose(markdown)) {
    if (SIMPLIFIED_SET.has(ch)) simplified++;
    else if (TRADITIONAL_SET.has(ch)) traditional++;
  }
  return traditional > simplified ? "zh-Hant" : "zh-Hans";
}

/**
 * The languages of a version's README files (in `files` order, without the
 * missing ones); a later file in a language an earlier one has is left out.
 * `README.md` is Chinese when its text is, else English — or unknown when a
 * `README.en.md` is there too.
 */
export function labelReadmes(found: readonly { file: string; text: string }[]): Readme[] {
  const named = found.map((f) => languageOfFileName(f.file));
  const hasEnglish = named.includes("en");
  const out: Readme[] = [];
  for (const [i, { file, text }] of found.entries()) {
    let lang: string | null = named[i] ?? null;
    if (lang === "zh") lang = chineseScript(text);
    else if (lang === null) lang = isChinese(text) ? chineseScript(text) : hasEnglish ? null : "en";
    if (lang !== null && out.some((r) => r.lang === lang)) continue;
    out.push({ file, lang, text });
  }
  return out;
}

const WANTED: Record<Locale, string[]> = {
  en: ["en"],
  "zh-CN": ["zh-Hans", "zh-Hant"],
  "zh-Hant": ["zh-Hant", "zh-Hans"],
};

/** The README for the interface language: one in that language (or the other Chinese script), else the first (`README.md`). */
export function pickReadme(readmes: readonly Readme[], locale: Locale): Readme | undefined {
  for (const lang of WANTED[locale]) {
    const hit = readmes.find((r) => r.lang === lang);
    if (hit) return hit;
  }
  return readmes[0];
}

const LANGUAGE_NAMES: Record<string, string> = { en: "English", "zh-Hans": "简体中文", "zh-Hant": "繁體中文" };

/** A README's language in its own words ("English", "简体中文", "日本語"), or its file name. */
export function readmeLabel(readme: Readme): string {
  if (!readme.lang) return readme.file;
  if (LANGUAGE_NAMES[readme.lang]) return LANGUAGE_NAMES[readme.lang]!;
  try {
    return new Intl.DisplayNames([readme.lang], { type: "language" }).of(readme.lang) ?? readme.file;
  } catch {
    return readme.file;
  }
}
