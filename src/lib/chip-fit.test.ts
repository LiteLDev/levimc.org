import assert from "node:assert/strict";
import { test } from "node:test";
import { fitChips, initialFit } from "./chip-fit.ts";

const Y = true;
const N = false;

test("chips: all that fit, else those that fit next to +N", () => {
  // 3 chips of 50 with gaps of 4: 158 wide
  assert.deepEqual(fitChips([50, 50, 50], 4, 24, 158), [Y, Y, Y]);
  assert.deepEqual(fitChips([50, 50, 50], 4, 24, 200), [Y, Y, Y]);
  // 157: the third does not fit; two and +N need 50+4+50+4+24 = 132
  assert.deepEqual(fitChips([50, 50, 50], 4, 24, 157), [Y, Y, N]);
  // 131: one chip and +N (50+4+24 = 78)
  assert.deepEqual(fitChips([50, 50, 50], 4, 24, 131), [Y, N, N]);
  // never no chip at all (the first is shortened)
  assert.deepEqual(fitChips([300, 50], 4, 24, 60), [Y, N]);
  assert.deepEqual(fitChips([], 4, 24, 120), []);
  // sub-pixel rounding
  assert.deepEqual(fitChips([50.3, 50.3], 4, 24, 104.4), [Y, Y]);
});

test("chips: a long chip is skipped, the shorter ones after it stay", () => {
  // Glacie on a phone: Client & server, Protocol & multi-version, LeviLamina, Endstone in 334px
  assert.deepEqual(fitChips([124, 178, 86, 73], 4, 34, 334), [Y, N, Y, Y]);
  // a very wide first chip does not hide the others
  assert.deepEqual(fitChips([300, 50], 4, 24, 120), [N, Y]);
});

test("chips before measuring: up to four, else three and +N", () => {
  assert.deepEqual(initialFit(0), []);
  assert.deepEqual(initialFit(4), [Y, Y, Y, Y]);
  assert.deepEqual(initialFit(5), [Y, Y, Y, N, N]);
});
