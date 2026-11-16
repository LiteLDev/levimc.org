// Blocking <head> scripts, inlined into index.html at build time (see vite.config.ts). They run before the
// stylesheet paints:
//  - theme: the cross-site LeviMC preference (cookie levimc_theme on levimc.org: Auto / Light / Dark, Auto by
//    default), applied as html.dark + data-theme-pref;
//  - language: every page is prerendered in its URL's language (/, /zh-Hans/, /zh-Hant/, see src/i18n/config.ts),
//    so nothing waits for it. Only the root redirects (ROOT_REDIRECT_SCRIPT, like the docs' root): exactly / goes
//    to the visitor's stored language (cookie levimc_lang), else the browser language's locale; deep links never;
//  - chrome language: a stored language the site has no content in but the kit has chrome strings for (de, ja …)
//    is the bar's and footer's language (src/i18n chromeLocaleFor): they stay hidden until React has rendered them
//    in it (html.kit-chrome-pending, at most 1.5 s; never for English or Chinese, which have pages).
// The previous site's localStorage keys ("theme" = light | dark, "locale" = en | zh) are migrated once.
import { createThemeInitScript } from '../kit/components/theme.ts';
import { UI_LOCALES } from '../kit/components/i18n.ts';
import { PREFS_CORE_JS } from '../kit/components/prefs.ts';
import { localeRedirectScript } from '../kit/docs/shared/head.ts';
import { otherSitePatterns } from './other-sites.ts';
import { DEFAULT_LOCALE, LEGACY_LOCALE_KEY, LEGACY_LOCALE_MAP, LOCALES } from './i18n/config.ts';

const base = (tag: string) => tag.toLowerCase().split('-')[0]!;
/** Languages the site has pages in (by base language): their chrome is the page's own. */
const CONTENT_BASES = [...new Set(LOCALES.map((l) => base(l.lang)))];

/** html.kit-chrome-pending when the stored language is one only the kit's chrome speaks (chromeLocaleFor). */
const CHROME_PENDING_JS =
  `(function(){try{${PREFS_CORE_JS}var l=rp("lang");if(!l)return;var b=l.toLowerCase().split("-")[0];if(${JSON.stringify(CONTENT_BASES)}.indexOf(b)>=0)return;` +
  `var C=${JSON.stringify(UI_LOCALES.map((c) => ({ c, l: c })))},a=ml(l,C);` +
  `if(a>=0&&C[a].l.toLowerCase().split("-")[0]===b)document.documentElement.classList.add("kit-chrome-pending")}catch(e){}})();`;

export const PREPAINT_SCRIPT =
  createThemeInitScript({
    legacyTheme: ['theme'],
    legacyLang: [{ key: LEGACY_LOCALE_KEY, map: LEGACY_LOCALE_MAP }],
    // prerender only the other builds' pages, in English and this site's languages (/zh-Hans/mods/*, the language
    // first): the router serves this app's own without a navigation
    speculation: { include: otherSitePatterns(LOCALES.filter((l) => l.prefix).map((l) => l.prefix.slice(0, -1))) },
  }) + CHROME_PENDING_JS;

/** The root-only language redirect (/ → /zh-Hans/ …), the docs' own (kit/docs/shared/head.ts). */
export const ROOT_REDIRECT_SCRIPT = localeRedirectScript({ base: '/', siteKey: 'levimc', locales: [...LOCALES], defaultLocale: DEFAULT_LOCALE });
