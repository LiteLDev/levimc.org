// The default order of the listing (Relevance without a search): how far each
// mod's stars and dependents are above what a mod like it would get, and how
// likely it runs on the newest game version. Fitted at build time over the
// whole catalogue (`rankScores`), so the prerendered page and the browser
// agree; nothing here is hand-tuned. The listing then spreads authors out
// (see `spreadAuthors`).
//
// - Expected stars μ_S and dependents μ_D: negative-binomial (NB2) GLMs with a
//   log link, fitted by IRLS with the dispersion profiled by maximum likelihood
//   — the standard model for over-dispersed counts (Cameron & Trivedi,
//   "Regression Analysis of Count Data"). Only pre-treatment covariates (age,
//   owner, icon, license, category, platforms, environments): release counts,
//   commits or days since the last update are themselves driven by popularity,
//   and controlling for them would remove part of what is measured (bad
//   controls: Rosenbaum 1984; Angrist & Pischke 2009). Stars keep the
//   covariates that backward elimination on BIC keeps (Schwarz 1978);
//   dependents, which only a handful of mods have, get age alone (about ten
//   events per covariate: Peduzzi et al. 1996).
// - Quality θ, shared by both counts: S ~ Poisson(μ_S·θ), D ~ Poisson(μ_D·θ),
//   θ ~ Gamma(r, r), with r from the negative-binomial marginal likelihood of
//   S + D. The score uses the posterior E[ln θ] = ψ(r + S + D) − ln(r + μ_S + μ_D):
//   observed against expected, shrunk towards 1 when there is little to go on
//   (Poisson–Gamma empirical Bayes: Clayton & Kaldor 1987).
// - Usability: support for the next game version is lost at a constant rate,
//   so a mod b versions behind the newest runs on it with probability q^b; q
//   is the share of mods supporting a version that also support the next one.
//   The score adds b·ln q (the catalogue's mean when the versions are unknown).

/** One mod as the model sees it. */
export interface RankRow {
  /** Mods with the same key are one repository listed under several tooths: they count once in the fits. */
  key: string;
  stars: number;
  dependents: number;
  /** Days since the repository was created (or, without GitHub data, since the index's update). */
  ageDays: number;
  /** Pre-treatment covariates (0/1 indicators), by name; `ln_age` is added from `ageDays`. */
  covariates: Record<string, number>;
  /** Game versions it runs on; empty when unknown. */
  gameVersions: readonly string[];
}

export interface NbFit {
  /** Intercept first, then the covariates in order. */
  beta: number[];
  /** Dispersion (shape) of the negative binomial. */
  r: number;
  logLik: number;
  bic: number;
}

export interface RankModel {
  /** Covariates of the stars model, in the order of `stars.beta` after the intercept. */
  starsCovariates: string[];
  stars: NbFit;
  dependents: NbFit;
  /** Shape of the shared quality's Gamma prior. */
  r: number;
  /** P(supports the next game version | supports this one). */
  q: number;
  /** Rows the model was fitted on (one per repository). */
  rows: number;
}

// ---------------------------------------------------------------------------
// Special functions
// ---------------------------------------------------------------------------

const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

/** ln Γ(x) for x > 0 (Lanczos, g = 7). */
export function lnGamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  x -= 1;
  let a = LANCZOS[0]!;
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LANCZOS[i]! / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** ψ(x) for x > 0: recurrence up to 6, then the asymptotic series. */
export function digamma(x: number): number {
  let result = 0;
  while (x < 6) {
    result -= 1 / x;
    x += 1;
  }
  const x2 = x * x;
  return result + Math.log(x) - 1 / (2 * x) - 1 / (12 * x2) + 1 / (120 * x2 * x2) - 1 / (252 * x2 * x2 * x2);
}

// ---------------------------------------------------------------------------
// Negative-binomial GLM
// ---------------------------------------------------------------------------

/** NB2 log-likelihood of counts `y` with means `mu` and shape `r`. */
export function nbLogLik(y: readonly number[], mu: readonly number[], r: number): number {
  let ll = 0;
  for (let i = 0; i < y.length; i++) {
    const yi = y[i]!;
    const mi = mu[i]!;
    ll += lnGamma(yi + r) - lnGamma(r) - lnGamma(yi + 1) + r * Math.log(r / (r + mi)) + yi * Math.log(mi / (r + mi));
  }
  return ll;
}

/** Shapes tried for the dispersion: log-spaced from 0.05 to 50. */
const shapes = (count: number) => Array.from({ length: count }, (_, i) => Math.exp(Math.log(0.05) + ((Math.log(50) - Math.log(0.05)) * i) / (count - 1)));

/** Solves A·x = b (A symmetric, small); a column without a usable pivot gets 0, like a least-squares fit dropping it. */
function solve(a: number[][], b: number[]): number[] {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]!]);
  const scale = Math.max(1e-300, ...a.map((row, i) => Math.abs(row[i]!)));
  const pivotOf = new Array<number>(n).fill(-1);
  let row = 0;
  for (let col = 0; col < n && row < n; col++) {
    let best = row;
    for (let i = row + 1; i < n; i++) if (Math.abs(m[i]![col]!) > Math.abs(m[best]![col]!)) best = i;
    if (Math.abs(m[best]![col]!) <= 1e-12 * scale) continue;
    [m[row], m[best]] = [m[best]!, m[row]!];
    for (let i = 0; i < n; i++) {
      if (i === row) continue;
      const f = m[i]![col]! / m[row]![col]!;
      if (f) for (let j = col; j <= n; j++) m[i]![j]! -= f * m[row]![j]!;
    }
    pivotOf[col] = row++;
  }
  return pivotOf.map((r, col) => (r < 0 ? 0 : m[r]![n]! / m[r]![col]!));
}

const linear = (x: readonly number[], beta: readonly number[]) => x.reduce((s, v, j) => s + v * beta[j]!, 0);
const clip = (v: number) => Math.min(20, Math.max(-20, v));

/** IRLS for a log-link NB2 GLM with a fixed shape `r`. */
function irls(y: readonly number[], X: readonly number[][], r: number): number[] {
  const p = X[0]!.length;
  const mean = y.reduce((s, v) => s + v, 0) / y.length;
  let beta = new Array<number>(p).fill(0);
  beta[0] = Math.log(mean + 1e-9);
  for (let iter = 0; iter < 100; iter++) {
    const xtwx = Array.from({ length: p }, () => new Array<number>(p).fill(0));
    const xtwz = new Array<number>(p).fill(0);
    for (let i = 0; i < y.length; i++) {
      const x = X[i]!;
      const eta = clip(linear(x, beta));
      const mu = Math.exp(eta);
      const w = mu / (1 + mu / r);
      const z = eta + (y[i]! - mu) / mu;
      for (let a = 0; a < p; a++) {
        xtwz[a]! += w * x[a]! * z;
        for (let b = 0; b < p; b++) xtwx[a]![b]! += w * x[a]! * x[b]!;
      }
    }
    const next = solve(xtwx, xtwz);
    const step = Math.max(...next.map((v, j) => Math.abs(v - beta[j]!)));
    beta = next;
    if (step < 1e-8) break;
  }
  return beta;
}

/** Means of the fitted model for design rows `X`. */
export const predict = (fit: NbFit, X: readonly number[][]) => X.map((x) => Math.exp(clip(linear(x, fit.beta))));

/**
 * A coefficient this large (a factor of e^15 on the mean) only comes from IRLS
 * chasing a likelihood that keeps rising as it goes to ±∞: some covariates
 * separate the rows with no counts from the rest, and no estimate exists.
 */
const DIVERGED = 15;

/**
 * Fits an NB2 GLM (log link; `X` includes the intercept column), the shape
 * profiled over a log grid by maximum likelihood. A model without an estimate
 * (separation, see `DIVERGED`) gets an infinite BIC, so selection never keeps it.
 */
export function fitNegBin(y: readonly number[], X: readonly number[][]): NbFit {
  let best: NbFit | undefined;
  for (const r of shapes(60)) {
    const beta = irls(y, X, r);
    const logLik = nbLogLik(y, X.map((x) => Math.exp(clip(linear(x, beta)))), r);
    if (!best || logLik > best.logLik) best = { beta, r, logLik, bic: 0 };
  }
  const separated = best!.beta.some((b) => Math.abs(b) > DIVERGED);
  best!.bic = separated ? Infinity : -2 * best!.logLik + (X[0]!.length + 1) * Math.log(y.length);
  return best!;
}

const design = (cols: Record<string, readonly number[]>, names: readonly string[], n: number) =>
  Array.from({ length: n }, (_, i) => [1, ...names.map((k) => cols[k]![i]!)]);

/**
 * Backward elimination on BIC: drops covariates while that lowers BIC. A
 * covariate that separates the data (its coefficient diverges, see
 * `DIVERGED`) has no estimate and is dropped first.
 */
export function selectCovariates(y: readonly number[], cols: Record<string, readonly number[]>): { names: string[]; fit: NbFit } {
  let names = Object.keys(cols);
  let fit = fitNegBin(y, design(cols, names, y.length));
  for (;;) {
    if (fit.bic === Infinity && names.length) {
      const coefs = fit.beta.slice(1).map(Math.abs);
      const drop = names[coefs.indexOf(Math.max(...coefs))]!;
      names = names.filter((k) => k !== drop);
      fit = fitNegBin(y, design(cols, names, y.length));
      continue;
    }
    let best: { names: string[]; fit: NbFit } | undefined;
    for (const drop of names) {
      const without = names.filter((k) => k !== drop);
      const f = fitNegBin(y, design(cols, without, y.length));
      if (!best || f.bic < best.fit.bic) best = { names: without, fit: f };
    }
    if (!best || !(best.fit.bic < fit.bic)) return { names, fit };
    ({ names, fit } = best);
  }
}

// ---------------------------------------------------------------------------
// Game versions
// ---------------------------------------------------------------------------

const versionParts = (v: string) => v.split(".").map(Number);
const compareAsc = (a: string, b: string) => {
  const x = versionParts(a);
  const y = versionParts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
};

/**
 * q = P(supports v_{k+1} | supports v_k), pooled over every pair of adjacent
 * catalogue versions (`versions` ascending).
 */
export function versionSurvival(rows: readonly { gameVersions: readonly string[] }[], versions: readonly string[]): number {
  let kept = 0;
  let total = 0;
  const sets = rows.map((r) => new Set(r.gameVersions));
  for (let k = 0; k + 1 < versions.length; k++) {
    for (const s of sets) {
      if (!s.has(versions[k]!)) continue;
      total++;
      if (s.has(versions[k + 1]!)) kept++;
    }
  }
  return total ? kept / total : 1;
}

/** How many catalogue versions (ascending) the newest supported one is behind the newest; null when unknown. */
export function versionsBehind(gameVersions: readonly string[], versions: readonly string[]): number | null {
  let newest = -1;
  for (const v of gameVersions) newest = Math.max(newest, versions.indexOf(v));
  return newest < 0 ? null : versions.length - 1 - newest;
}

// ---------------------------------------------------------------------------
// The score
// ---------------------------------------------------------------------------

/** Covariates that vary across the fitted rows (a constant one says nothing). */
function informative(cols: Record<string, number[]>): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const [k, v] of Object.entries(cols)) if (v.some((x) => x !== v[0])) out[k] = v;
  return out;
}

/** The default-order score of every row (higher first), rounded to keep the embedded catalogue small, and the model. */
export function rankScores(rows: readonly RankRow[]): { scores: number[]; model: RankModel } {
  const lnAge = (row: RankRow) => Math.log1p(Math.max(0, row.ageDays));
  const covariatesOf = (row: RankRow): Record<string, number> => ({ ln_age: lnAge(row), ...row.covariates });

  // One row per repository for every estimate.
  const seen = new Set<string>();
  const fitRows = rows.filter((row) => !seen.has(row.key) && seen.add(row.key));
  const names = [...new Set(fitRows.flatMap((row) => Object.keys(covariatesOf(row))))].sort((a, b) =>
    a === "ln_age" ? -1 : b === "ln_age" ? 1 : a.localeCompare(b),
  );
  const column = (k: string, list: readonly RankRow[]) => list.map((row) => covariatesOf(row)[k] ?? 0);
  const stars = fitRows.map((row) => row.stars);
  const dependents = fitRows.map((row) => row.dependents);
  const candidates = informative(Object.fromEntries(names.map((k) => [k, column(k, fitRows)])));
  const { names: starsCovariates, fit: starsFit } = selectCovariates(stars, candidates);
  const dependentsFit = fitNegBin(dependents, design({ ln_age: column("ln_age", fitRows) }, ["ln_age"], fitRows.length));

  const muS = (list: readonly RankRow[]) =>
    predict(starsFit, design(Object.fromEntries(starsCovariates.map((k) => [k, column(k, list)])), starsCovariates, list.length));
  const muD = (list: readonly RankRow[]) => predict(dependentsFit, design({ ln_age: column("ln_age", list) }, ["ln_age"], list.length));

  const fitTotals = fitRows.map((row) => row.stars + row.dependents);
  const fitMeans = muS(fitRows).map((m, i) => m + muD(fitRows)[i]!);
  let r = 1;
  let bestLl = -Infinity;
  for (const shape of shapes(400)) {
    const ll = nbLogLik(fitTotals, fitMeans, shape);
    if (ll > bestLl) [r, bestLl] = [shape, ll];
  }

  const versions = [...new Set(rows.flatMap((row) => row.gameVersions))].sort(compareAsc);
  const q = versionSurvival(fitRows, versions);
  const lnQ = Math.log(q);
  const known = fitRows.map((row) => versionsBehind(row.gameVersions, versions)).filter((b): b is number => b !== null);
  const unknownLnP = known.length ? (known.reduce((s, b) => s + b, 0) / known.length) * lnQ : 0;

  const meanS = muS(rows);
  const meanD = muD(rows);
  const scores = rows.map((row, i) => {
    const behind = versionsBehind(row.gameVersions, versions);
    const usable = behind === null ? unknownLnP : behind * lnQ;
    const quality = digamma(r + row.stars + row.dependents) - Math.log(r + meanS[i]! + meanD[i]!);
    return Math.round((quality + usable) * 1000) / 1000;
  });
  return { scores, model: { starsCovariates, stars: starsFit, dependents: dependentsFit, r, q, rows: fitRows.length } };
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
