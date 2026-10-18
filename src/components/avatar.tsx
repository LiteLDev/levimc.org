import { useEffect, useRef, useState } from "react";
import { resolveAvatarUrl } from "../lib/markdown";
import { useRenames } from "../repository-renames";

interface AvatarProps {
  src?: string;
  alt: string;
  /** Intrinsic size in CSS px; the stylesheet sets the box per context. */
  size: 32 | 64;
  className?: string;
}

/**
 * A package's avatar, or a pixel chest when it has none or it fails to load.
 * Many avatars point at files that no longer exist, so failures are expected.
 */
export function Avatar({ src, alt, size, className }: AvatarProps) {
  const url = resolveAvatarUrl(src, useRenames());
  const [failedUrl, setFailedUrl] = useState<string>();
  const ref = useRef<HTMLImageElement>(null);

  // An image that failed before hydration fired its `error` event before
  // React was listening: check what the browser already knows.
  useEffect(() => {
    const img = ref.current;
    // A size-less SVG can also report a zero width, so a decode failure has
    // to confirm it.
    if (!img || !url || !img.complete || img.naturalWidth !== 0) return;
    img.decode().catch(() => setFailedUrl(url));
  }, [url]);

  const classes = ["pkg-avatar", className].filter(Boolean).join(" ");

  if (url && failedUrl !== url) {
    return (
      <img
        ref={ref}
        src={url}
        alt={alt}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={classes}
        onError={() => setFailedUrl(url)}
      />
    );
  }

  // The kit's chest sprite as a CSS background (one copy for every card).
  return (
    <span
      role="img"
      aria-label={alt}
      className={`${classes} pkg-sprite pkg-sprite-chest pkg-avatar-fallback`}
    />
  );
}
