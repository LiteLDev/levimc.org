import { useEffect, useRef, useState } from "react";
import { ICON_WIDTHS, iconPath } from "../lib/mods";

interface ProjectIconProps {
  /** The mod's own icon (checked at build time), if any. */
  icon?: string;
  /** The icon scaled down at build time (server/icons.ts), or the one drawn there: served instead of `icon`. */
  iconId?: string;
  /** Intrinsic size in CSS px; the stylesheet sizes the box per context. */
  size: number;
  /** Load at once (rows near the top) instead of when scrolled into view. */
  eager?: boolean;
  className?: string;
}

interface Source {
  src: string;
  srcSet?: string;
}

/**
 * A mod's icon: its own (as the build scaled it, else as published), else the
 * one the build drew for it (server/logo-art.ts), else the pixel chest. The box keeps its size whatever
 * loads, so nothing shifts.
 */
export function ProjectIcon({ icon, iconId, size, eager, className }: ProjectIconProps) {
  const sources: Source[] = [];
  if (iconId) {
    sources.push({
      // the smallest width that covers the slot at 2x; the browser picks by its own density from srcSet
      src: iconPath(iconId, ICON_WIDTHS.find((w) => w >= size * 2) ?? ICON_WIDTHS.at(-1)!),
      srcSet: ICON_WIDTHS.map((w) => `${iconPath(iconId, w)} ${w}w`).join(", "),
    });
  }
  if (icon) sources.push({ src: icon });
  const [failed, setFailed] = useState<string[]>([]);
  const source = sources.find((s) => !failed.includes(s.src));
  const src = source?.src;
  const ref = useRef<HTMLImageElement>(null);

  // An image that failed before hydration fired its `error` event before
  // React was listening: check what the browser already knows.
  useEffect(() => {
    const img = ref.current;
    // A size-less SVG can also report a zero width, so a decode failure has to confirm it.
    if (!img || !src || !img.complete || img.naturalWidth !== 0) return;
    img.decode().catch(() => setFailed((f) => (f.includes(src) ? f : [...f, src])));
  }, [src]);

  const classes = ["mods-icon", className].filter(Boolean).join(" ");
  if (source && src) {
    return (
      <img
        ref={ref}
        key={src}
        // sizes and srcSet before src: a client-rendered <img> then fetches only the width it needs
        sizes={source.srcSet ? `${size}px` : undefined}
        srcSet={source.srcSet}
        src={src}
        alt=""
        width={size}
        height={size}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        className={classes}
        onError={() => setFailed((f) => (f.includes(src) ? f : [...f, src]))}
      />
    );
  }
  return <span className={`${classes} mods-sprite mods-sprite-chest mods-icon-fallback`} aria-hidden="true" />;
}
