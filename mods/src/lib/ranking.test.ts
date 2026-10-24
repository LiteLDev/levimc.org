import assert from "node:assert/strict";
import { test } from "node:test";
import { digamma, fitNegBin, lnGamma, rankScores, spreadAuthors, versionsBehind, type RankRow } from "./ranking.ts";

/** A seeded uniform generator (mulberry32), so the synthetic data is the same on every run. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gamma(shape, 1) (Marsaglia–Tsang) and Poisson draws: S ~ Poisson(μ·θ), θ ~ Gamma(r, r) is NB2(μ, r). */
function sampler(seed: number) {
  const u = rng(seed);
  const normal = () => Math.sqrt(-2 * Math.log(u() || 1e-12)) * Math.cos(2 * Math.PI * u());
  const gamma = (shape: number): number => {
    if (shape < 1) return gamma(shape + 1) * Math.pow(u(), 1 / shape);
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    for (;;) {
      const x = normal();
      const v = (1 + c * x) ** 3;
      if (v > 0 && Math.log(u()) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v;
    }
  };
  const poisson = (mean: number) => {
    let k = 0;
    for (let t = -Math.log(u()); t < mean; t -= Math.log(u())) k++;
    return k;
  };
  return { u, negBin: (mu: number, r: number) => poisson((mu * gamma(r)) / r) };
}

test("lnGamma and digamma match known values", () => {
  assert.ok(Math.abs(lnGamma(1)) < 1e-12);
  assert.ok(Math.abs(lnGamma(0.5) - Math.log(Math.sqrt(Math.PI))) < 1e-12);
  assert.ok(Math.abs(lnGamma(10) - Math.log(362880)) < 1e-10);
  assert.ok(Math.abs(digamma(1) + 0.5772156649015329) < 1e-8);
  assert.ok(Math.abs(digamma(0.5) + 0.5772156649015329 + 2 * Math.log(2)) < 1e-8);
});

test("the NB fit recovers known coefficients and dispersion", () => {
  const { u, negBin } = sampler(1);
  const beta = [0.5, 1.0, -0.7];
  const r = 2;
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = 0; i < 3000; i++) {
    const x = [1, u() * 2, u() < 0.4 ? 1 : 0];
    X.push(x);
    y.push(negBin(Math.exp(x.reduce((s, v, j) => s + v * beta[j]!, 0)), r));
  }
  const fit = fitNegBin(y, X);
  fit.beta.forEach((b, j) => assert.ok(Math.abs(b - beta[j]!) < 0.1, `β${j} = ${b.toFixed(3)}, want ${beta[j]}`));
  assert.ok(fit.r > 1.6 && fit.r < 2.5, `r = ${fit.r.toFixed(2)}, want 2`);
});

const DAY_AGES = [10, 30, 60, 120, 240, 400, 600, 900, 1300, 1800];

/** A catalogue where stars grow with age (μ = 0.05·age) and a few mods have dependents. */
function catalogue(): RankRow[] {
  const { negBin } = sampler(7);
  const rows: RankRow[] = [];
  for (let i = 0; i < 160; i++) {
    const ageDays = DAY_AGES[i % DAY_AGES.length]! * (1 + (i % 7) / 10);
    rows.push({
      key: `m${i}`,
      stars: negBin(0.05 * ageDays, 0.8),
      dependents: i % 12 === 0 ? negBin(0.002 * ageDays, 0.5) : 0,
      ageDays,
      covariates: { icon: i % 3 === 0 ? 1 : 0 },
      gameVersions: ["1.21.0", "1.21.1"].slice(0, 1 + (i % 2)),
    });
  }
  return rows;
}

const scoreOf = (extra: RankRow[]) => {
  const { scores } = rankScores([...catalogue(), ...extra]);
  return scores.slice(-extra.length);
};
const mod = (key: string, stars: number, ageDays: number): RankRow => ({
  key,
  stars,
  dependents: 0,
  ageDays,
  covariates: { icon: 0 },
  gameVersions: ["1.21.1"],
});

test("an old mod with many stars and a young one with proportionally fewer score about the same", () => {
  const [old, young] = scoreOf([mod("old", 400, 1600), mod("young", 50, 200)]);
  assert.ok(Math.abs(old! - young!) < 0.25, `old ${old}, young ${young}`);
});

test("one star on a 10-day-old repository does not beat an established mod well above its expectation", () => {
  const [fresh, established] = scoreOf([mod("fresh", 1, 10), mod("established", 300, 900)]);
  assert.ok(established! > fresh!, `established ${established}, fresh ${fresh}`);
});

test("each game version behind costs the same factor q", () => {
  const versions = ["1.20.0", "1.20.1", "1.21.0", "1.21.1"];
  assert.deepEqual(
    versions.map((v) => versionsBehind([v], versions)),
    [3, 2, 1, 0],
  );
  assert.equal(versionsBehind([], versions), null);
  const base = catalogue();
  const behind = (versionsList: string[]) => {
    const { scores } = rankScores([...base, { ...mod("x", 20, 400), gameVersions: versionsList }]);
    return scores.at(-1)!;
  };
  const s = [behind(["1.21.1"]), behind(["1.21.0"])];
  assert.ok(s[0]! > s[1]!, `${s}`);
});

test("a repository listed under several tooths counts once in the fit", () => {
  const rows = catalogue();
  const once = rankScores(rows);
  const twice = rankScores([...rows, { ...rows[0]! }, { ...rows[1]! }]);
  assert.equal(twice.model.rows, rows.length);
  assert.deepEqual(twice.model.stars.beta, once.model.stars.beta);
  assert.equal(twice.model.r, once.model.r);
  assert.deepEqual(twice.scores.slice(0, rows.length), once.scores);
  assert.equal(twice.scores.at(-2), once.scores[0]);
});

test("spreadAuthors keeps the order and moves an author's fourth mod to the next block", () => {
  const items = ["a", "a", "a", "a", "b", "c"].map((owner, i) => ({ owner, i }));
  assert.deepEqual(spreadAuthors(items, 5).map((x) => x.i), [0, 1, 2, 4, 5, 3]);
  assert.deepEqual(spreadAuthors(items, 4).map((x) => x.i), [0, 1, 2, 4, 3, 5]);
});
