// The visitor's device platform, for content that offers one version per platform (downloads, install steps):
// tabs labelled with a platform name and hero actions with a `platform` pick the visitor's one in the browser.
// The prerendered page always shows the author's default; the choice is made after hydration.

export const PLATFORMS = ['windows', 'android', 'ios', 'macos', 'linux'] as const;
export type DevicePlatform = (typeof PLATFORMS)[number];

const LABEL_RE = /\b(windows|android|ios|ipados|macos|linux)\b/i;

/** The platform a tab label names ("Windows", "Android 版", "iOS"…), if exactly one. */
export function platformOfLabel(label: string): DevicePlatform | undefined {
  const all = label.match(new RegExp(LABEL_RE.source, 'gi'));
  if (!all) return undefined;
  const found = new Set(all.map((m) => (m.toLowerCase() === 'ipados' ? 'ios' : (m.toLowerCase() as DevicePlatform))));
  return found.size === 1 ? [...found][0] : undefined;
}

/** The visitor's platform (browser only; undefined on the server or when it cannot be told). */
export function detectPlatform(): DevicePlatform | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const ua = navigator.userAgent ?? '';
  // Android's user agent also says "Linux", and iPadOS 13+ says "Macintosh": test those first
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  const hint = ((navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? '').toLowerCase();
  if (hint === 'windows' || /Windows/i.test(ua)) return 'windows';
  if (hint === 'macos' || /Macintosh|Mac OS X/i.test(ua)) return 'macos';
  if (hint === 'linux' || hint === 'chrome os' || /Linux|CrOS/i.test(ua)) return 'linux';
  return undefined;
}
