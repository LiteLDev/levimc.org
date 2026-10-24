import { useEffect, useRef, useState } from "react";
import { ownerAvatar } from "../lib/packages";

interface ProjectIconProps {
  /** The package's own icon (checked at build time), if any. */
  icon?: string;
  owner: string;
  /** Intrinsic size in CSS px; the stylesheet sizes the box per context. */
  size: number;
  /** Load at once (rows near the top) instead of when scrolled into view. */
  eager?: boolean;
  className?: string;
}

/**
 * A package's icon: its own, else its owner's GitHub avatar, else the pixel
 * chest. The box keeps its size whatever loads, so nothing shifts.
 */
export function ProjectIcon({ icon, owner, size, eager, className }: ProjectIconProps) {
  const sources = [icon, owner ? ownerAvatar(owner) : undefined].filter((s): s is string => !!s);
  const [failed, setFailed] = useState<string[]>([]);
  const src = sources.find((s) => !failed.includes(s));
  const ref = useRef<HTMLImageElement>(null);

  // An image that failed before hydration fired its `error` event before
  // React was listening: check what the browser already knows.
  useEffect(() => {
    const img = ref.current;
    // A size-less SVG can also report a zero width, so a decode failure has to confirm it.
    if (!img || !src || !img.complete || img.naturalWidth !== 0) return;
    img.decode().catch(() => setFailed((f) => (f.includes(src) ? f : [...f, src])));
  }, [src]);

  const classes = ["pkg-icon", className].filter(Boolean).join(" ");
  if (src) {
    return (
      <img
        ref={ref}
        key={src}
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
  return <span className={`${classes} pkg-sprite pkg-sprite-chest pkg-icon-fallback`} aria-hidden="true" />;
}
