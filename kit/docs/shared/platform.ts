// The visitor's device platform, for content that differs per platform (downloads, install steps, features that only
// one platform has). Tabs labelled with a platform name form one site-wide group, like Docusaurus' `groupId` tabs and
// Microsoft Learn's zone pivots: the visitor's choice is remembered and applies to every such tab set; `?platform=`
// in the URL wins (shareable links), else the remembered choice, else the device. Hero actions with a `platform`
// follow the same choice. The prerendered page always shows the author's default; the choice is made after hydration.

export const PLATFORMS = ['windows', 'android', 'ios', 'macos', 'linux'] as const;
export type DevicePlatform = (typeof PLATFORMS)[number];

/** Display names (the same in every language). */
export const PLATFORM_NAMES: Record<DevicePlatform, string> = {
  windows: 'Windows',
  android: 'Android',
  ios: 'iOS',
  macos: 'macOS',
  linux: 'Linux',
};

/** localStorage key of the visitor's chosen platform (shared by every docs site on the origin). */
export const PLATFORM_STORAGE_KEY = 'levimc_platform';
/** URL search parameter that selects a platform (`?platform=android`). */
export const PLATFORM_QUERY = 'platform';

const LABEL_RE = /\b(windows|android|ios|ipados|macos|linux)\b/i;

export function isPlatform(v: unknown): v is DevicePlatform {
  return typeof v === 'string' && (PLATFORMS as readonly string[]).includes(v);
}

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

/** The platform the visitor chose before (a platform tab they clicked), if any. */
export function storedPlatform(): DevicePlatform | undefined {
  try {
    const v = localStorage.getItem(PLATFORM_STORAGE_KEY);
    return isPlatform(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

export function storePlatform(p: DevicePlatform): void {
  try {
    localStorage.setItem(PLATFORM_STORAGE_KEY, p);
  } catch {
    /* private mode / blocked storage: the choice lasts for this page only */
  }
}

/** The platform to show: `?platform=` in the URL, else the visitor's earlier choice, else their device. */
export function preferredPlatform(search = typeof location === 'undefined' ? '' : location.search): DevicePlatform | undefined {
  const q = new URLSearchParams(search).get(PLATFORM_QUERY)?.toLowerCase();
  if (isPlatform(q)) return q;
  return storedPlatform() ?? detectPlatform();
}
