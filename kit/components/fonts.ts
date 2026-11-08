// Web fonts for every LeviMC site. CJK text uses the system stack (no CJK webfont is shipped).
//   Inter            UI and body copy
//   Manrope          display headings only (hero, H1/H2, section titles)
//   JetBrains Mono   code
// The pixel face (Silkscreen) is no longer loaded (kit 2.19): its only use, the LeviMC wordmark, is a mask
// (.kit-wordmark, theme/generated.css --kit-wordmark).
export const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=JetBrains+Mono:wght@400..600&family=Manrope:wght@500..800&display=swap';

/** Paste into <head> (index.html) of any LeviMC app. */
export const FONT_HEAD_HTML =
  '<link rel="preconnect" href="https://fonts.googleapis.com" />' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />' +
  `<link rel="stylesheet" href="${GOOGLE_FONTS_HREF}" />`;
