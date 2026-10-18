// Blocking <head> script, inlined into index.html at build time (see vite.config.ts). It runs before the
// stylesheet paints, so neither the theme nor the language ever flashes:
//  - theme: the cross-site LeviMC preference (cookie levimc_theme on levimc.org: Auto / Light / Dark, Auto by
//    default), applied as html.dark + data-theme-pref;
//  - language: the pages are prerendered in English; when the visitor's language (cookie levimc_lang, else the
//    browser languages) maps to another locale, the bar, <main> and the footer stay hidden until React has
//    re-rendered in it (kit usePreferredLocale, at most 1.5 s).
// The previous site's localStorage keys ("theme" = light | dark, "locale" = en | zh) are migrated once.
import { createThemeInitScript } from '../kit/components/theme.ts';
import { DEFAULT_LOCALE, LEGACY_LOCALE_KEY, LEGACY_LOCALE_MAP, LOCALES } from './i18n/config.ts';

export const PREPAINT_SCRIPT = createThemeInitScript({
  appLocales: { locales: LOCALES, prerendered: DEFAULT_LOCALE },
  legacyTheme: ['theme'],
  legacyLang: [{ key: LEGACY_LOCALE_KEY, map: LEGACY_LOCALE_MAP }],
});
