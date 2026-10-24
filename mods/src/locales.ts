// The site's UI languages. The pages are prerendered in English; the visitor's
// cross-site language preference (levimc_lang, see kit/components/prefs.ts)
// switches the interface after hydration. Mod data (names, descriptions,
// READMEs) stays as published. Shared with vite.config.ts, whose pre-paint
// script hides the page until the switch so it never flashes in English.
export const LOCALES = [
  { code: "en", lang: "en", label: "English" },
  { code: "zh-CN", lang: "zh-CN", label: "简体中文" },
  { code: "zh-HK", lang: "zh-HK", label: "繁體中文" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];
