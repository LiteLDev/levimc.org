// Locales converted from another one: a Traditional Chinese locale (`convertFrom: 'zh'`) gets every page, nav title
// and chrome override of the Simplified locale that it has no own translation of, converted character by character
// with OpenCC (`cn` → `tw`, or `hk` for a zh-HK / zh-MO locale; no phrase rewriting, so the wording stays the
// author's). Code, link targets and URLs are left as written — except links to another LeviMC site, which follow the
// script: https://levimc.org/<site>/zh-Hans/… becomes …/zh-Hant/… (kit 2.21.1; levimc.org's one locale scheme) — and relative
// links and images with a path segment naming the source locale (images/zh-Hans/x.svg), which point at the converted
// locale's file (images/zh-Hant/x.svg) where that file exists (kit 2.24.0). Only sites that use `convertFrom` load opencc-js
// (a devDependency of theirs), so the others build without it.

import { statSync } from 'node:fs';
import { join, posix } from 'node:path';
import type { NavEntry, ResolvedConfig, ResolvedLocale, SidebarConfig } from './config.ts';
import { SCHEME, safeDecode, splitHref } from './links.ts';

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
 * Spans kept as written: fenced code, inline code, link targets (`](…)`, `href="…"`, `src="…"`, a reference
 * definition's `[label]: …`), autolinks and bare URLs. A link target keeps its path; its `#fragment` is converted like
 * the heading it points at.
 */
const KEEP =
  /(?:^|\n)[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n[ \t]*\1[ \t]*(?=\n|$)|`[^`\n]+`|\]\([^)\s]*|\b(?:href|src)\s*=\s*(["'])[^"']*\2|(?<ref>(?<=(?:^|\n)[ \t]{0,3}\[(?!\^)[^\]\n]+\]:[ \t]*)[^\s<>]+)|<https?:[^>]*>|https?:\/\/[^\s)<>"']+/g;

const convertTarget = (target: string, convert: Convert) => {
  const hash = target.indexOf('#');
  return hash < 0 ? target : target.slice(0, hash + 1) + convert(target.slice(hash + 1));
};

/** Links to the Simplified Chinese of a LeviMC site (https://levimc.org/…/zh-Hans/…) → its Traditional Chinese. */
export const traditionalNetworkLinks = (s: string) => s.replace(/(https?:\/\/levimc\.org\/(?:[^\s)<>"'#?]*\/)?)zh-Hans\//g, '$1zh-Hant/');

/** Where a converted page comes from, so its relative links can follow the locale (kit 2.24.0). */
export interface ConvertPage {
  /** Source locale code (`zh-Hans`) and converted locale code (`zh-Hant`). */
  from: string;
  to: string;
  /** The content dir, and the page's source file relative to it (`zh-Hans/play/x.md`). */
  contentRoot: string;
  rel: string;
}


/**
 * A relative path with a segment naming the source locale (`../images/zh-Hans/x.svg`) → the same path with that
 * segment naming the converted locale, when that file exists in the content dir; else the path as written.
 */
export function localeTarget(target: string, page: ConvertPage): string {
  if (!target || SCHEME.test(target) || /^[/#?<]/.test(target)) return target;
  const { path, query, hash } = splitHref(target);
  const segs = path.split('/');
  if (!segs.includes(page.from)) return target;
  const moved = segs.map((s) => (s === page.from ? page.to : s)).join('/');
  const rel = posix.normalize(posix.join(posix.dirname(page.rel.replace(/\\/g, '/')), safeDecode(moved)));
  if (rel.startsWith('..') || !isFile(join(page.contentRoot, rel))) return target;
  return moved + query + hash;
}

const isFile = (abs: string) => {
  try {
    return statSync(abs).isFile();
  } catch {
    return false;
  }
};

/** A link target span (`](x`, `href="x"`, `src='x'`, a reference definition's `x`) with its path following the locale. */
const localeSpan = (span: string, page: ConvertPage) => {
  const m = /^(\]\(|(?:href|src)\s*=\s*(["']))(.*)$/s.exec(span);
  if (!m) return localeTarget(span, page);
  const quote = m[2] ?? '';
  const target = quote && m[3]!.endsWith(quote) ? m[3]!.slice(0, -1) : m[3]!;
  return m[1] + localeTarget(target, page) + m[3]!.slice(target.length);
};

/**
 * A markdown page in the other script: its prose, headings and front matter; not its code or link targets. Given
 * `page`, relative link and image targets that name the source locale's folder point at the converted locale's file
 * where it exists.
 */
export function convertMarkdown(md: string, convert: Convert, page?: ConvertPage): string {
  let out = '';
  let last = 0;
  for (const m of md.matchAll(KEEP)) {
    // code stays as written; link targets and bare URLs to another LeviMC site follow the script
    const code = /^\s*(`|~~~)/.test(m[0]);
    let span = code ? m[0] : traditionalNetworkLinks(m[0]);
    out += convert(md.slice(last, m.index));
    last = m.index + m[0].length;
    if (!code && (m.groups?.ref !== undefined || span.startsWith('](') || /^(href|src)/.test(span))) {
      if (page) span = localeSpan(span, page);
      span = convertTarget(span, convert);
    }
    out += span;
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
    if ('link' in e && typeof e.link === 'string') return { ...e, link: traditionalNetworkLinks(e.link), ...(typeof e.text === 'string' ? { text: convert(e.text) } : {}) };
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
