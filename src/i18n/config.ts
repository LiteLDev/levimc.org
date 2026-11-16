// Locale constants shared by the React app, the prerender and the pre-paint <head> script (vite.config.ts).
// The language is part of the URL, like on every LeviMC site: English at the site's own paths (/, /about/ …),
// Simplified Chinese under /zh-Hans/ (/zh-Hans/about/ …), Traditional Chinese under /zh-Hant/. Every page is
// prerendered in each language. Only the root (/) redirects: to the visitor's stored language (cookie levimc_lang),
// else to the browser language's locale (see ROOT_REDIRECT_SCRIPT in src/prepaint.ts).
export type Locale = 'en' | 'zh-Hans' | 'zh-Hant';

export interface SiteLocale {
  /** The site's own code (keys of src/i18n/locales): also the URL segment and the BCP-47 tag. */
  code: Locale;
  /** BCP-47 tag: <html lang>, hreflang, the kit chrome's locale, and the value stored as the cross-site preference. */
  lang: string;
  /** Native name in the language menu (and its trigger, like on every LeviMC site). */
  label: string;
  /** URL prefix below the site root: '' for English, 'zh-Hans/' … */
  prefix: string;
}

export const LOCALES: readonly SiteLocale[] = [
  { code: 'en', lang: 'en', label: 'English', prefix: '' },
  { code: 'zh-Hans', lang: 'zh-Hans', label: '简体中文', prefix: 'zh-Hans/' },
  { code: 'zh-Hant', lang: 'zh-Hant', label: '繁體中文', prefix: 'zh-Hant/' },
];
export const DEFAULT_LOCALE: Locale = 'en';

/** The previous site stored the language as localStorage["locale"] = "en" | "zh" (migrated once). */
export const LEGACY_LOCALE_KEY = 'locale';
export const LEGACY_LOCALE_MAP: Record<string, string> = { en: 'en', zh: 'zh-Hans' };

/** BCP-47 tag of a site locale (the locale passed to the kit chrome: GlobalBar, SiteFooter …). */
export const kitLocale: Record<Locale, string> = {
  en: 'en',
  'zh-Hans': 'zh-Hans',
  'zh-Hant': 'zh-Hant',
};

export const isLocale = (v: unknown): v is Locale => v === 'en' || v === 'zh-Hans' || v === 'zh-Hant';

/** Simplified or Traditional Chinese (the Chinese community's QQ groups, the blog's Chinese posts). */
export const isChineseLocale = (locale: Locale) => locale === 'zh-Hans' || locale === 'zh-Hant';

export const localeInfo = (code: Locale): SiteLocale => LOCALES.find((l) => l.code === code) ?? LOCALES[0]!;

/** The site locale of a BCP-47 tag (a blog post's `lang`, zh-CN → zh-Hans), English when none matches. */
export function localeOfTag(tag: string): Locale {
  const t = tag.toLowerCase();
  if (t.startsWith('zh')) return /^zh-(tw|hk|mo|hant)\b/.test(t) ? 'zh-Hant' : 'zh-Hans';
  return 'en';
}

/**
 * A root-relative pathname split into its locale and the path below the locale prefix:
 * '/zh-Hans/about/' → { locale: 'zh-Hans', path: '/about/' }, '/zh-Hant' → { 'zh-Hant', '/' }, '/about/' → { 'en', '/about/' }.
 */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  for (const l of LOCALES) {
    if (!l.prefix) continue;
    const seg = '/' + l.prefix.slice(0, -1);
    if (pathname === seg) return { locale: l.code, path: '/' };
    if (pathname.startsWith(seg + '/')) return { locale: l.code, path: pathname.slice(seg.length) };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

/** `path` (root-relative, unprefixed; may carry ?query / #hash) in `locale`: '/about/' → '/zh-Hans/about/'. */
export function withLocale(path: string, locale: Locale): string {
  const { prefix } = localeInfo(locale);
  return prefix ? '/' + prefix + path.replace(/^\//, '') : path;
}
