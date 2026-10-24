// The kit components this site uses, imported from their own modules rather
// than the kit's barrel: the barrel also brings PaintedHero, whose cached
// scenes (theme/hero.css, ~200 KB) and scene generator this site does not
// need (its compact hero is a file per theme, see server/hero.ts).
export { GlobalBar } from "../kit/components/GlobalBar";
export { SiteFooter } from "../kit/components/SiteFooter";
export { PaintedBackdrop } from "../kit/components/PaintedBackdrop";
export { Pagination } from "../kit/components/Hotbar";
export { PixelIcon, BrandIcon } from "../kit/components/PixelIcon";
export { ThemeProvider, useTheme } from "../kit/components/theme";
export { usePreferredLocale } from "../kit/components/locale";
export { useDismissableDetails } from "../kit/components/menu";
export type { LinkLikeProps } from "../kit/components/LocaleSwitcher";
