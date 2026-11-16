// The site's UI languages. The language is part of the URL, like on every LeviMC site: the locale segment comes
// first, before the base — English at /mods/…, Simplified Chinese at /zh-Hans/mods/…, Traditional Chinese at
// /zh-Hant/mods/… — and every page is prerendered in each. Only /mods/ itself redirects, to the visitor's
// stored language (levimc_lang, see kit/components/prefs.ts) or else the browser's (vite.config.ts). Mod data
// (names, descriptions, READMEs) stays as published. The old URLs (/mods/zh-Hans/…, from before the language came
// first) are redirect pages (prerender.mjs). Kept free of React: vite.config.ts loads it in Node.
import { BASE } from "./base-path.ts";

export const LOCALES = [
  // `code`: the key of the strings (and of mods' localized texts, `LocalizedText`); `lang`: the BCP-47 tag of
  // <html lang>, hreflang and the cross-site preference; `prefix`: the URL segment before BASE
  { code: "en", lang: "en", label: "English", prefix: "" },
  { code: "zh-CN", lang: "zh-Hans", label: "简体中文", prefix: "zh-Hans/" },
  { code: "zh-Hant", lang: "zh-Hant", label: "繁體中文", prefix: "zh-Hant/" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];
export const DEFAULT_LOCALE: Locale = "en";

export const localeInfo = (code: Locale) => LOCALES.find((l) => l.code === code) ?? LOCALES[0];

/** Where the pages in a language live: `/mods/`, `/zh-Hans/mods/`, `/zh-Hant/mods/`. */
export const localeBase = (code: Locale) => `/${localeInfo(code).prefix}${BASE.slice(1)}`;

/**
 * A pathname split into its locale and the same page's English path:
 * `/zh-Hans/mods/github.com/a/b/` → { locale: "zh-CN", path: "/mods/github.com/a/b/" }; `/zh-Hant/mods` → `/mods/`.
 * Paths outside the site and English ones come back as they are.
 */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  for (const l of LOCALES) {
    if (!l.prefix) continue;
    const base = localeBase(l.code);
    if (pathname === base.slice(0, -1)) return { locale: l.code, path: BASE };
    if (pathname.startsWith(base)) return { locale: l.code, path: BASE + pathname.slice(base.length) };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

/** The English path of a page (see {@link splitLocale}). */
export const stripLocale = (pathname: string) => splitLocale(pathname).path;

/** Whether `pathname` is on this site, in any language (`/mods/…`, `/zh-Hans/mods/…`). */
export const isSitePath = (pathname: string) => stripLocale(pathname).startsWith(BASE);

/**
 * The language an old URL names after the base (`/mods/zh-Hans/x/`, from before the language came first) and the
 * page's English path; `null` for any other path.
 */
export function legacyLocale(pathname: string): { locale: Locale; path: string } | null {
  if (!pathname.startsWith(BASE)) return null;
  const rest = pathname.slice(BASE.length);
  for (const l of LOCALES) {
    if (!l.prefix) continue;
    if (rest === l.prefix.slice(0, -1)) return { locale: l.code, path: BASE };
    if (rest.startsWith(l.prefix)) return { locale: l.code, path: BASE + rest.slice(l.prefix.length) };
  }
  return null;
}

/**
 * A link to a page of the site (`/mods/…`, may carry ?query / #hash) in `locale`: `/mods/x/` → `/zh-Hans/mods/x/`.
 * A link that names a language already keeps it (`/zh-Hant/mods/x/`; the old `/mods/zh-Hant/x/` becomes
 * `/zh-Hant/mods/x/`), and one that leads outside the site stays as it is.
 */
export function withLocale(href: string, locale: Locale): string {
  if (!href.startsWith(BASE)) return href;
  const bare = href.replace(/[?#].*$/, "");
  const legacy = legacyLocale(bare);
  if (legacy) {
    // what follows the old locale segment: "", "/x/…", "?q=…" or "#…"
    const rest = href.slice(BASE.length + localeInfo(legacy.locale).prefix.length - 1);
    return localeBase(legacy.locale) + rest.replace(/^\//, "");
  }
  const { prefix } = localeInfo(locale);
  return prefix ? `/${prefix}${href.slice(1)}` : href;
}

/** The page at `pathname` in every locale (hreflang alternates, the language menu). */
export function localeAlternates(pathname: string): Record<Locale, string> {
  const path = stripLocale(pathname);
  return Object.fromEntries(LOCALES.map((l) => [l.code, withLocale(path, l.code)])) as Record<Locale, string>;
}
