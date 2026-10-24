// The home page's painted strip: the kit's two scenes, drawn as a wide, low
// band and served as files (`/mods/hero-light.svg`, `/mods/hero-dark.svg`). The browser
// fetches the one of the current theme and caches it — nothing of it sits in
// the page or in the stylesheet.
import { harborSunrise, lilyPond, sceneToSvg } from "../../kit/components/paint";

const SIZE = { width: 1600, height: 280, detail: 0.5, seed: 7 };

export const HERO_FILES = ["hero-light.svg", "hero-dark.svg"] as const;

/** The SVG of `/mods/hero-light.svg` or `/mods/hero-dark.svg`. */
export function heroSvg(file: (typeof HERO_FILES)[number]): string {
  const scene = file === "hero-dark.svg" ? harborSunrise({ ...SIZE, boats: true }) : lilyPond({ ...SIZE, bridge: true });
  return sceneToSvg(scene, { animate: true });
}
