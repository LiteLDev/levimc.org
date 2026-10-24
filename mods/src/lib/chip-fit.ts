// Which of a row's chips fit on its one line of tags. The rest go behind a
// "+N" chip, so a chip is never cut off, whatever the row's width (list,
// grid, phone).

/** Chips shown before a row is measured (the prerendered page, no script): a fixed count, so server and client agree. */
export const MAX_CHIPS = 4;

/** The chips shown before measuring: all of up to `MAX_CHIPS`, else the first `MAX_CHIPS - 1` and "+N". */
export const initialFit = (count: number): boolean[] =>
  Array.from({ length: count }, (_, i) => count <= MAX_CHIPS || i < MAX_CHIPS - 1);

/**
 * Which chips to show in `room` pixels: all when they fit; else, in order,
 * each chip that still fits next to the "+N" chip — a long chip is skipped
 * rather than costing the shorter ones after it (a long category name must
 * not hide the platform). `widths` are the chips' widths, `gap` the space
 * between two chips. At least one chip is shown (shortened with an ellipsis
 * when even it does not fit).
 */
export function fitChips(widths: readonly number[], gap: number, moreWidth: number, room: number): boolean[] {
  // half a pixel of slack for sub-pixel rounding
  const space = room + 0.5;
  const all = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, widths.length - 1);
  if (all <= space) return widths.map(() => true);
  const budget = space - gap - moreWidth;
  let used = 0;
  let count = 0;
  const shown = widths.map((w) => {
    const next = used + (count ? gap : 0) + w;
    if (next > budget) return false;
    used = next;
    count++;
    return true;
  });
  if (!count && shown.length) shown[0] = true;
  return shown;
}
