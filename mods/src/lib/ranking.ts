// The default order of the listing (Relevance without a search): one score
// per mod from popularity, adoption, compatibility and upkeep, computed at
// build time so the prerendered page and the browser agree. The listing then
// spreads authors out (see `spreadAuthors`).
import { compareVersions } from "./game-versions.ts";

export const RANK_WEIGHTS = {
  stars: 1.0,
  requiredBy: 1.0,
  compat: 1.5,
  fresh: 0.8,
  new: 0.5,
} as const;

/** Days over which the freshness signal falls to 1/e. */
const FRESH_DAYS = 90;
/** A mod created this recently gets the new-mod boost. */
const NEW_DAYS = 30;
/** Compatibility lost per game version a mod is behind the newest one. */
const COMPAT_STEP = 0.25;
/** Compatibility of a mod whose game versions are unknown. */
const COMPAT_UNKNOWN = 0.3;

const DAY = 86_400_000;

export interface RankInput {
  stars: number;
  requiredBy?: number;
  /** Newest first. */
  gameVersions: readonly string[];
  updated: string;
  created?: string;
}

const daysSince = (iso: string | undefined, now: number) => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? Infinity : Math.max(0, (now - t) / DAY);
};

/**
 * 1 for a mod that runs on the newest game version in the catalogue, less
 * per version it is behind (`allVersions`, newest first), 0 from four behind.
 */
export function compatibility(gameVersions: readonly string[], allVersions: readonly string[]): number {
  if (!gameVersions.length || !allVersions.length) return COMPAT_UNKNOWN;
  const newest = [...gameVersions].sort((a, b) => compareVersions(b, a))[0]!;
  const behind = allVersions.indexOf(newest);
  return behind < 0 ? COMPAT_UNKNOWN : Math.max(0, 1 - COMPAT_STEP * behind);
}

/** The default-order score of a mod (higher first), rounded to keep the embedded catalogue small. */
export function rankScore(entry: RankInput, allVersions: readonly string[], now: number): number {
  const w = RANK_WEIGHTS;
  const score =
    w.stars * Math.log1p(entry.stars) +
    w.requiredBy * Math.log1p(entry.requiredBy ?? 0) +
    w.compat * compatibility(entry.gameVersions, allVersions) +
    w.fresh * Math.exp(-daysSince(entry.updated, now) / FRESH_DAYS) +
    w.new * (daysSince(entry.created, now) <= NEW_DAYS ? 1 : 0);
  return Math.round(score * 1000) / 1000;
}

/**
 * At most `perAuthor` mods of one author in each `block` of results (a
 * page): the rest move on to the next block, in order.
 */
export function spreadAuthors<T extends { owner: string }>(sorted: readonly T[], block: number, perAuthor = 3): T[] {
  const out: T[] = [];
  let pending = [...sorted];
  while (pending.length) {
    const counts = new Map<string, number>();
    const taken: T[] = [];
    const rest: T[] = [];
    for (const item of pending) {
      const owner = item.owner.toLowerCase();
      const n = counts.get(owner) ?? 0;
      if (taken.length < block && n < perAuthor) {
        taken.push(item);
        counts.set(owner, n + 1);
      } else {
        rest.push(item);
      }
    }
    out.push(...taken);
    pending = rest;
  }
  return out;
}
