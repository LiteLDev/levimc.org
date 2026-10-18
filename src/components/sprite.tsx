import type { SpriteName } from "../data/categories";

/**
 * A kit sprite as a CSS background (`.pkg-sprite-<name>` in styles.css): a
 * page of 20 rows with five sprites each holds one copy of every sprite, in
 * the stylesheet, instead of a hundred inline SVGs.
 */
export function Sprite({ name, className }: { name: SpriteName; className?: string }) {
  // One-colour sprites are drawn in the text colour (a mask), so they read in both themes.
  const kind = MONO.has(name) ? "pkg-mask pkg-mask" : "pkg-sprite pkg-sprite";
  return <span className={`${kind}-${name}${className ? ` ${className}` : ""}`} aria-hidden="true" />;
}

/** Kit sprites drawn in `currentColor` (as an image they would be black). */
const MONO = new Set<SpriteName>(["apps", "menu", "hash", "quote", "globe", "history"]);

export type MaskName = "close" | "check" | "chevronDown" | "arrowUp" | "external";

/**
 * A one-colour kit sprite drawn in the text colour (a CSS mask), for the
 * small glyphs that repeat on every filter option: no inline SVG per use.
 */
export function MaskIcon({ name, className }: { name: MaskName; className?: string }) {
  return <span className={`pkg-mask pkg-mask-${name}${className ? ` ${className}` : ""}`} aria-hidden="true" />;
}
