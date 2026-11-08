export interface PaintedBackdropProps {
  /** Show the painted scene band at the top of the page (Nymphéas / Impression, soleil levant). */
  scene?: boolean;
  /** Height of the scene band (CSS length). */
  sceneHeight?: string;
  /** Opacity of the scene band in light / dark (0–1). */
  sceneOpacity?: number;
  sceneOpacityDark?: number;
  className?: string;
}

/**
 * Decorative page background: impressionist colour dabs in the margins, brush-dab texture and canvas grain, and an
 * optional painted scene band at the top dissolving into the canvas in pixel blocks. Purely CSS and static.
 *
 * Since kit 2.19 the dabs, brush and grain are the page root's own scrolling background (theme/painterly.css, cached
 * tiles from theme/generated.css): the `.kit-backdrop` element rendered here is only the hook that turns it on
 * (`:root:has(.kit-backdrop)`) and paints nothing itself — no fixed full-viewport layer to composite on every frame.
 * Keep body and the app's shell transparent. Place it first inside the app's root; the scene band is positioned
 * against the document, so it scrolls away with the page top (give later content `.kit-above-backdrop` or any
 * positioned z-index ≥ 1 to sit above it).
 */
export function PaintedBackdrop({ scene = true, sceneHeight, sceneOpacity, sceneOpacityDark, className }: PaintedBackdropProps) {
  const style: Record<string, string | number> = {};
  if (sceneHeight) style['--kit-scene-height'] = sceneHeight;
  if (sceneOpacity !== undefined) style['--kit-scene-opacity'] = sceneOpacity;
  if (sceneOpacityDark !== undefined) style['--kit-scene-opacity-dark'] = sceneOpacityDark;
  return (
    <>
      <div className={className ? `kit-backdrop ${className}` : 'kit-backdrop'} aria-hidden="true" />
      {scene ? <div className="kit-backdrop-scene kit-dissolve-bottom" aria-hidden="true" style={style} /> : null}
    </>
  );
}
