// Locales converted from another one: a Traditional Chinese locale (`convertFrom: 'zh'`) gets every page, nav title
// and chrome override of the Simplified locale that it has no own translation of, converted character by character
// with OpenCC (`cn` → `tw`, or `hk` for a zh-HK / zh-MO locale; no phrase rewriting, so the wording stays the
// author's). Code, link targets and URLs are left as written. Only sites that use `convertFrom` load opencc-js
// (a devDependency of theirs), so the others build without it.

import type { NavEntry, ResolvedConfig, ResolvedLocale, SidebarConfig } from './config.ts';

export type Convert = (text: string) => string;

const converters = new Map<string, Promise<Convert>>();

/** The OpenCC target of a locale: Hong Kong characters for zh-HK / zh-MO, else Taiwan's (the usual zh-Hant). */
const variantOf = (lang: string) => (/^zh-(hk|mo)\b|^zh-hant-(hk|mo)\b/i.test(lang) ? 'hk' : 'tw');

export function loadConverter(lang: string): Promise<Convert> {
  const to = variantOf(lang);
  let c = converters.get(to);
  if (!c) {
    c = import('opencc-js/cn2t').then(
      (OpenCC) => OpenCC.Converter({ from: 'cn', to }),
      (e: unknown) => {
        throw new Error(`a locale with convertFrom needs opencc-js: npm i -D opencc-js@1.4.2 (${String(e)})`);
      },
    );
    converters.set(to, c);
  }
  return c;
}

/**
 * Spans kept as written: fenced code, inline code, link targets (`](…)`, `href="…"`, `src="…"`), autolinks and bare
 * URLs. A link target keeps its path; its `#fragment` is converted like the heading it points at.
 */
const KEEP =
  /(?:^|\n)[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n[ \t]*\1[ \t]*(?=\n|$)|`[^`\n]+`|\]\([^)\s]*|\b(?:href|src)\s*=\s*(["'])[^"']*\2|<https?:[^>]*>|https?:\/\/[^\s)<>"']+/g;

const convertTarget = (target: string, convert: Convert) => {
  const hash = target.indexOf('#');
  return hash < 0 ? target : target.slice(0, hash + 1) + convert(target.slice(hash + 1));
};

/** A markdown page in the other script: its prose, headings and front matter; not its code or link targets. */
export function convertMarkdown(md: string, convert: Convert): string {
  let out = '';
  let last = 0;
  for (const m of md.matchAll(KEEP)) {
    const span = m[0];
    out += convert(md.slice(last, m.index));
    out += span.startsWith('](') || /^(href|src)/.test(span) ? convertTarget(span, convert) : span;
    last = m.index + span.length;
  }
  return out + convert(md.slice(last));
}

/** Every string of a value (UI overrides, label maps), keys and structure unchanged. */
function convertStrings<T>(value: T, convert: Convert): T {
  if (typeof value === 'string') return convert(value) as T;
  if (Array.isArray(value)) return value.map((v) => convertStrings(v, convert)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, convertStrings(v, convert)])) as T;
  }
  return value;
}

/** Nav entries with converted titles; links keep pointing at the source locale's pages (nav.ts maps them over). */
function convertNav(entries: NavEntry[], convert: Convert): NavEntry[] {
  return entries.map((e): NavEntry => {
    if (typeof e === 'string') return e;
    if ('items' in e && Array.isArray(e.items)) return { ...e, text: convert(String(e.text)), items: convertNav(e.items as NavEntry[], convert) };
    if ('link' in e && typeof e.link === 'string') return { ...e, ...(typeof e.text === 'string' ? { text: convert(e.text) } : {}) };
    return Object.fromEntries(
      Object.entries(e as Record<string, string | NavEntry[]>).map(([title, v]) => [convert(title), typeof v === 'string' ? v : convertNav(v, convert)]),
    );
  });
}

/** A sidebar for the converted locale: path-prefix keys of the source locale (`/zh/guide/`) move to its prefix. */
function convertSidebar(sb: SidebarConfig, from: ResolvedLocale, to: ResolvedLocale, convert: Convert): SidebarConfig {
  if (Array.isArray(sb)) return convertNav(sb, convert);
  return Object.fromEntries(
    Object.entries(sb).map(([prefix, entries]) => {
      const lead = prefix.startsWith('/') ? '/' : '';
      const rest = prefix.slice(lead.length);
      const moved = from.prefix && rest.startsWith(from.prefix) ? lead + to.prefix + rest.slice(from.prefix.length) : prefix;
      return [moved, convertNav(entries, convert)];
    }),
  );
}

const done = new WeakSet<ResolvedConfig>();

/**
 * Load the converters of the converted locales and give each locale what its source locale has in the config and it
 * has not: nav and sidebar (per-locale maps), nav translations, chrome overrides and the edit link label.
 * Returns locale code → converter (empty when no locale converts).
 */
export async function prepareConvertedLocales(cfg: ResolvedConfig): Promise<Map<string, Convert>> {
  const out = new Map<string, Convert>();
  for (const loc of cfg.locales) {
    if (!loc.convertFrom) continue;
    const from = cfg.locales.find((l) => l.code === loc.convertFrom)!;
    const convert = await loadConverter(loc.lang);
    out.set(loc.code, convert);
    if (done.has(cfg)) continue;
    const { code } = loc;
    if (cfg.nav && !Array.isArray(cfg.nav) && cfg.nav[from.code] && !cfg.nav[code]) cfg.nav[code] = convertNav(cfg.nav[from.code]!, convert);
    const sb = cfg.sidebar;
    if (sb && typeof sb === 'object' && !Array.isArray(sb)) {
      const perLocale = Object.keys(sb).every((k) => cfg.locales.some((l) => l.code === k));
      const rec = sb as Record<string, SidebarConfig>;
      if (perLocale && rec[from.code] && !rec[code]) rec[code] = convertSidebar(rec[from.code]!, from, loc, convert);
    }
    const tr = cfg.navTranslations?.[from.code];
    if (tr) {
      const own = cfg.navTranslations![code] ?? {};
      const derived: Record<string, string> = {};
      // nav titles are converted too (convertNav), so both spellings of a key translate
      for (const [k, v] of Object.entries(tr)) derived[k] = derived[convert(k)] = convert(v);
      cfg.navTranslations![code] = { ...derived, ...own };
    }
    if (cfg.ui?.[from.code]) cfg.ui[code] = { ...convertStrings(cfg.ui[from.code]!, convert), ...cfg.ui[code] };
    const text = cfg.editLink?.text;
    if (text?.[from.code] && !text[code]) text[code] = convert(text[from.code]!);
  }
  done.add(cfg);
  return out;
}
