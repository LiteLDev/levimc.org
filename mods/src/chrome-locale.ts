// The language of the LeviMC chrome (bar, footer, skip link), by the rule every LeviMC site shares (kit 2.19, as
// levimc.org's src/i18n): the content language when the site has the visitor's preferred language; otherwise the
// stored preference, if the kit has chrome strings for it — a visitor who chose Deutsch on another LeviMC site
// gets a German bar and footer around the English pages. The pre-paint script (vite.config.ts, `chromeLocales`)
// hides the chrome until then.
import { useEffect, useLayoutEffect, useState } from "react";
import { readLanguagePreference } from "../kit/components/prefs";
import { resolveUiLocale } from "../kit/components/i18n";
import { LOCALES } from "./locales";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const base = (tag: string) => tag.toLowerCase().split(/[-_]/)[0]!;

export function chromeLocaleFor(contentLang: string, preference: string | null): string {
  if (!preference || LOCALES.some((l) => base(l.lang) === base(preference))) return contentLang;
  const ui = resolveUiLocale(preference);
  return base(ui) === base(preference) ? ui : contentLang;
}

/** {@link chromeLocaleFor} for this visitor: the content language until hydrated, then the stored preference's. */
export function useChromeLocale(contentLang: string): string {
  const [preference, setPreference] = useState<string | null>(null);
  // a layout effect, in the same commit as usePreferredLocale's switch: the chrome is shown once, in its language
  useIsoLayoutEffect(() => {
    const sync = () => setPreference(readLanguagePreference());
    sync();
    const onPref = (e: Event) => {
      if ((e as CustomEvent<{ kind: string }>).detail?.kind === "lang") sync();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    window.addEventListener("levimc-pref-change", onPref);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("levimc-pref-change", onPref);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return chromeLocaleFor(contentLang, preference);
}
