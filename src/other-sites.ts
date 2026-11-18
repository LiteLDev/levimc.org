// Kept free of app imports: vite.config.ts (prepaint.ts) loads it in Node.
import { DOCS_PROJECTS, NETWORK_LANGUAGE_SEGMENTS } from '../kit/components/projects.ts';

/** levimc.org/mods/: LeviMC Mods, a separate app (mods/). */
export const MODS_PATH = '/mods/';
/** levimc.org/tutorials/: the tutorials, a separate docs build of this repository (tutorials/). */
export const TUTORIALS_PATH = '/tutorials/';
/** levimc.org/faq/: questions and answers for every project, a separate docs build of this repository (faq/). */
export const FAQ_PATH = '/faq/';

/** Paths of this origin that other builds serve: LeviMC Mods, the tutorials, the FAQ and each project's docs
 *  (/<Project>/). Their links load in full — and are the ones worth prerendering (prepaint.ts): the app's router
 *  serves everything else without a navigation. Each is also served under a language (2026-11-16, the language
 *  first: /zh-Hans/mods/, /zh-Hant/tutorials/, /ja/LeviLauncher/): see {@link isOtherSitePath}. */
export const OTHER_SITES: readonly string[] = [MODS_PATH, TUTORIALS_PATH, FAQ_PATH, ...DOCS_PROJECTS.map((p) => new URL(p.url).pathname)];

/** A root-relative path without its leading language segment (/zh-Hans/mods/x → /mods/x; others unchanged). */
export function withoutLanguage(path: string): string {
  const seg = path.split('/')[1] ?? '';
  return NETWORK_LANGUAGE_SEGMENTS.includes(seg) ? path.slice(seg.length + 1) || '/' : path;
}

/** Whether another build serves this root-relative path: /mods/…, /zh-Hans/mods/…, /ja/LeviLauncher/… */
export function isOtherSitePath(path: string): boolean {
  const p = withoutLanguage(path);
  return OTHER_SITES.some((prefix) => p.startsWith(prefix));
}

/** URL patterns of the other builds in `languages` (their URL segments) and English: speculation rules (prepaint.ts). */
export function otherSitePatterns(languages: readonly string[]): string[] {
  return ['', ...languages.map((l) => '/' + l)].flatMap((l) => OTHER_SITES.map((p) => l + p + '*'));
}
