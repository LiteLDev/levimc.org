// The kit sprites the site draws (`kit/assets/sprites.mjs`, by their keys there),
// each a CSS class in `styles.css` (`.mods-sprite-<name>`, or `.mods-mask-<name>`
// for the one-colour ones, see components/sprite.tsx).
import type { Locale } from "../locales.ts";

/** A kit sprite that `styles.css` provides as a CSS background or mask. */
export type SpriteName =
  | "apps"
  | "pickaxe"
  | "diamond"
  | "map"
  | "bookQuill"
  | "hash"
  | "torch"
  | "quote"
  | "bug"
  | "potion"
  | "tnt"
  | "compass"
  | "globe"
  | "emerald"
  | "arrowRight"
  | "grass"
  | "paper"
  | "chest"
  | "menu"
  | "monitor"
  | "clock"
  | "heart"
  | "history"
  | "moon";

/** Labels in the site's languages. */
export type Labels = Record<Locale, string>;
