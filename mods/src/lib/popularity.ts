// The "Popularity" sort: how widely a mod is used, from the two counts GitHub
// gives — how many times its release files were downloaded (lip and the
// launchers install from them, so these are installs, players' and servers'
// alike) and its stars (mostly developers'). Neither alone is enough: a
// library everything needs is downloaded tens of thousands of times with a
// dozen stars, and a mod installed some other way has no release files to
// count. Fitted at build time over the whole catalogue (`popularityScores`),
// like the default order (`lib/ranking.ts`); nothing here is hand-tuned.
//
// Both counts are heavy-tailed, so each is taken as ln(1 + n) and standardised
// over the catalogue (one row per repository); the score is the mean of the
// two z-scores, so each count weighs the same. A mod without release files
// (or without GitHub data on them) has unknown downloads, not none: it gets
// its stars' z-score for both.

/** One mod as the score sees it. */
export interface PopularityRow {
  /** Mods with the same key are one repository listed under several tooths: they count once in the fit. */
  key: string;
  stars: number;
  /** Release downloads; undefined when unknown. */
  downloads?: number;
}

/** Standardises ln(1 + x) with the mean and standard deviation of `fit` (0 when they do not vary). */
function standardiser(fit: readonly number[]): (x: number) => number {
  const logs = fit.map((x) => Math.log1p(x));
  const mean = logs.reduce((s, v) => s + v, 0) / (logs.length || 1);
  const sd = Math.sqrt(logs.reduce((s, v) => s + (v - mean) ** 2, 0) / (logs.length || 1));
  return (x) => (sd > 0 ? (Math.log1p(x) - mean) / sd : 0);
}

/** The popularity of every row (higher first), rounded to keep the embedded catalogue small. */
export function popularityScores(rows: readonly PopularityRow[]): number[] {
  const seen = new Set<string>();
  const fitRows = rows.filter((row) => !seen.has(row.key) && seen.add(row.key));
  const zStars = standardiser(fitRows.map((row) => row.stars));
  const zDownloads = standardiser(fitRows.flatMap((row) => (row.downloads === undefined ? [] : [row.downloads])));
  return rows.map((row) => {
    const s = zStars(row.stars);
    const d = row.downloads === undefined ? s : zDownloads(row.downloads);
    return Math.round(((s + d) / 2) * 1000) / 1000;
  });
}
