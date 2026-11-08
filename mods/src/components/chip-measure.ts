// Measuring the rows' chips for `fitChips` without making the browser lay the page out once per row.
//
// A chip's width depends only on its label and the fonts, never on the row (list, grid, phone), so the widths are
// measured once per label set and cached. One ResizeObserver watches every row's tag line: its callback gets each
// line's content width from the observer (no read), measures in one batch the label sets it has not seen — every
// such line switched to `is-measuring` first, then all widths read, then every class removed: one layout for the
// whole page instead of one per row — and computes each row's fit arithmetically. A resize then costs no DOM
// reads or class changes at all. When the web fonts arrive the cache is dropped and every line measured again,
// in one batch.
import { fitChips } from "../lib/chip-fit";

interface Widths {
  chips: number[];
  /** The "+N" chip. */
  more: number;
}

interface Line {
  /** The chips' labels, one per line of text: the cache key. */
  signature: string;
  /** Called with the fit ("1"/"0" per chip) whenever it may have changed. */
  onFit: (fit: string) => void;
  /** The line's content width at its last fit (from the observer), or -1 before the first. */
  room: number;
}

const lines = new Map<HTMLElement, Line>();
const cache = new Map<string, Widths>();
/** The gap between two chips (one stylesheet value for every line). */
let gap: number | null = null;
let observer: ResizeObserver | null = null;
let fontsHooked = false;

/** One line per label set: the others share its widths. */
function uniqueSignatures(uls: Iterable<HTMLElement>): HTMLElement[] {
  const seen = new Set<string>();
  const out: HTMLElement[] = [];
  for (const ul of uls) {
    const signature = lines.get(ul)?.signature;
    if (signature === undefined || seen.has(signature) || cache.has(signature)) continue;
    seen.add(signature);
    out.push(ul);
  }
  return out;
}

function measure(targets: HTMLElement[]) {
  if (!targets.length) return;
  // writes, then reads, then writes: one forced layout for the whole batch
  for (const ul of targets) ul.classList.add("is-measuring");
  if (gap === null) gap = parseFloat(getComputedStyle(targets[0]!).columnGap) || 0;
  const measured = targets.map((ul) => ({
    chips: [...ul.querySelectorAll<HTMLElement>(":scope > [data-chip]")].map((li) => li.getBoundingClientRect().width),
    more: ul.querySelector<HTMLElement>(":scope > .mods-row-more-li")?.getBoundingClientRect().width ?? 0,
  }));
  for (const ul of targets) ul.classList.remove("is-measuring");
  targets.forEach((ul, i) => cache.set(lines.get(ul)!.signature, measured[i]!));
}

function fit(ul: HTMLElement, line: Line) {
  const widths = cache.get(line.signature);
  if (!widths || line.room < 0) return;
  line.onFit(fitChips(widths.chips, gap ?? 0, widths.more, line.room).map(Number).join(""));
}

function update(entries: ResizeObserverEntry[]) {
  const changed: [HTMLElement, Line][] = [];
  for (const entry of entries) {
    const ul = entry.target as HTMLElement;
    const line = lines.get(ul);
    if (!line) continue;
    // the content box: the room for the chips, padding excluded
    const room = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
    // the observer also reports height changes (the line stops wrapping once fitted): nothing to do then
    if (room === line.room && cache.has(line.signature)) continue;
    line.room = room;
    changed.push([ul, line]);
  }
  measure(uniqueSignatures(changed.map(([ul]) => ul)));
  for (const [ul, line] of changed) fit(ul, line);
}

function hookFonts() {
  if (fontsHooked || typeof document === "undefined" || !document.fonts || document.fonts.status === "loaded") return;
  fontsHooked = true;
  // the web fonts change the chips' widths, not the lines': measure every line again, in one batch
  void document.fonts.ready.then(() => {
    cache.clear();
    gap = null;
    measure(uniqueSignatures(lines.keys()));
    for (const [ul, line] of lines) fit(ul, line);
  });
}

/** Fit `ul`'s chips now and whenever its width changes; returns the function that stops it. */
export function watchChips(ul: HTMLElement, signature: string, onFit: (fit: string) => void): () => void {
  if (typeof ResizeObserver === "undefined") return () => {};
  observer ??= new ResizeObserver(update);
  lines.set(ul, { signature, onFit, room: -1 });
  // the observer's first callback (before the next paint) measures and fits it, batched with every other row
  observer.observe(ul);
  hookFonts();
  return () => {
    lines.delete(ul);
    observer?.unobserve(ul);
  };
}
