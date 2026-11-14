import assert from "node:assert/strict";
import test from "node:test";
import { popularityScores } from "./popularity.ts";

test("downloads lift a library that few star", () => {
  const [lib, starred, quiet] = popularityScores([
    { key: "lib", stars: 10, downloads: 20000 },
    { key: "starred", stars: 60, downloads: 500 },
    { key: "quiet", stars: 2, downloads: 50 },
  ]);
  assert.ok(lib! > starred!, `${lib} > ${starred}`);
  assert.ok(starred! > quiet!, `${starred} > ${quiet}`);
});

test("more of both is more popular", () => {
  const scores = popularityScores([
    { key: "a", stars: 1, downloads: 10 },
    { key: "b", stars: 5, downloads: 100 },
    { key: "c", stars: 50, downloads: 1000 },
  ]);
  assert.deepEqual([...scores].sort((x, y) => x - y), scores);
});

test("unknown downloads count as many as the stars say, not as none", () => {
  const [unknown, none] = popularityScores([
    { key: "unknown", stars: 30 },
    { key: "none", stars: 30, downloads: 0 },
    { key: "x", stars: 1, downloads: 100 },
    { key: "y", stars: 100, downloads: 5000 },
  ]);
  assert.ok(unknown! > none!, `${unknown} > ${none}`);
});

test("one repository under several ids counts once, and they score alike", () => {
  const rows = [
    { key: "r", stars: 100, downloads: 1000 },
    { key: "r", stars: 100, downloads: 1000 },
    { key: "s", stars: 1, downloads: 10 },
  ];
  const [a, b, c] = popularityScores(rows);
  assert.equal(a, b);
  // standardised over the two repositories: ±1 each
  assert.equal(a, 1);
  assert.equal(c, -1);
});

test("a catalogue where nothing varies scores 0", () => {
  assert.deepEqual(popularityScores([{ key: "a", stars: 0 }, { key: "b", stars: 0 }]), [0, 0]);
  assert.deepEqual(popularityScores([]), []);
});
