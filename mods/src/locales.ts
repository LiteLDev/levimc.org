// The site's UI languages. The language is part of the URL, like on every LeviMC site: the locale segment
// follows the base — English at /mods/…, Simplified Chinese at /mods/zh-Hans/…, Traditional Chinese at
// /mods/zh-Hant/… — and every page is prerendered in each. Only /mods/ itself redirects, to the visitor's
// stored language (levimc_lang, see kit/components/prefs.ts) or else the browser's (vite.config.ts). Mod data
// (names, descriptions, READMEs) stays as published. Kept free of React: vite.config.ts loads it in Node.
import { BASE } from "./base-path.ts";

export const LOCALES = [
  // `code`: the key of the strings (and of mods' localized texts, `LocalizedText`); `lang`: the BCP-47 tag of
  // <html lang>, hreflang and the cross-site preference; `prefix`: the URL segment below BASE
  { code: "en", lang: "en", label: "English", prefix: "" },
  { code: "zh-CN", lang: "zh-Hans", label: "简体中文", prefix: "zh-Hans/" },
  { code: "zh-Hant", lang: "zh-Hant", label: "繁體中文", prefix: "zh-Hant/" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];
export const DEFAULT_LOCALE: Locale = "en";

export const localeInfo = (code: Locale) => LOCALES.find((l) => l.code === code) ?? LOCALES[0];

/**
 * A pathname split into its locale and the same page's English path:
 * `/mods/zh-Hans/github.com/a/b/` → { locale: "zh-CN", path: "/mods/github.com/a/b/" }; `/mods/zh-Hant` → `/mods/`.
 * Paths outside BASE and English ones come back as they are.
 */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  if (pathname.startsWith(BASE)) {
    const rest = pathname.slice(BASE.length);
    for (const l of LOCALES) {
      if (!l.prefix) continue;
      const seg = l.prefix.slice(0, -1);
      if (rest === seg) return { locale: l.code, path: BASE };
      if (rest.startsWith(l.prefix)) return { locale: l.code, path: BASE + rest.slice(l.prefix.length) };
    }
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

/** The English path of a page (see {@link splitLocale}). */
export const stripLocale = (pathname: string) => splitLocale(pathname).path;

/**
 * A link to a page of the site (`/mods/…`, may carry ?query / #hash) in `locale`: `/mods/x/` → `/mods/zh-Hans/x/`.
 * A link that names a locale already, or leads outside BASE, stays as it is.
 */
export function withLocale(href: string, locale: Locale): string {
  const { prefix } = localeInfo(locale);
  if (!prefix || !href.startsWith(BASE)) return href;
  const bare = href.replace(/[?#].*$/, "");
  if (splitLocale(bare.endsWith("/") ? bare : `${bare}/`).locale !== DEFAULT_LOCALE) return href;
  return BASE + prefix + href.slice(BASE.length);
}

/** The page at `pathname` in every locale (hreflang alternates, the language menu). */
export function localeAlternates(pathname: string): Record<Locale, string> {
  const path = stripLocale(pathname);
  return Object.fromEntries(LOCALES.map((l) => [l.code, withLocale(path, l.code)])) as Record<Locale, string>;
}
