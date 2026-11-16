// Kept free of app imports: vite.config.ts (prepaint.ts) loads it in Node.
import { DOCS_PROJECTS } from '../kit/components/projects.ts';

/** levimc.org/mods/: LeviMC Mods, a separate app (mods/). */
export const MODS_PATH = '/mods/';
/** levimc.org/tutorials/: the tutorials, a separate docs build of this repository (tutorials/). */
export const TUTORIALS_PATH = '/tutorials/';

/** Paths of this origin that other builds serve: LeviMC Mods, the tutorials and each project's docs
 *  (/<Project>/, published by the project's repository). Their links load in full — and are the ones worth
 *  prerendering (prepaint.ts): the app's router serves everything else without a navigation. */
export const OTHER_SITES: readonly string[] = [MODS_PATH, TUTORIALS_PATH, ...DOCS_PROJECTS.map((p) => new URL(p.url).pathname)];
