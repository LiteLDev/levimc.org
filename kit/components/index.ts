// levimc-kit — shared React components for every LeviMC site.
export { GlobalBar, GlobalNavList, BrandMark, type GlobalBarProps, type GlobalBarLanguages, type GlobalNavListProps } from './GlobalBar';
export { SiteFooter, type SiteFooterProps } from './SiteFooter';
export { ThemeSwitcher, ThemeToggle, type ThemeSwitcherProps, type ThemeToggleProps } from './ThemeToggle';
export { LocaleSwitcher, type LocaleSwitcherProps, type LocaleOption, type LinkLikeProps } from './LocaleSwitcher';
export { PaintedBackdrop, type PaintedBackdropProps } from './PaintedBackdrop';
export { PaintedHero, type PaintedHeroProps, type HeroAction } from './PaintedHero';
export { PixelButton, pixelButtonClass, type PixelButtonProps } from './PixelButton';
export { Card, type CardProps } from './Card';
export { Badge, type BadgeProps, type BadgeTone } from './Badge';
export { Tooltip, type TooltipProps } from './Tooltip';
export { HotbarTabs, Pagination, type HotbarTab, type HotbarTabsProps, type PaginationProps } from './Hotbar';
export { PixelIcon, BrandIcon, type PixelIconProps, type PixelIconName, type BrandIconName } from './PixelIcon';
export { PIXEL_ICONS } from './pixel-icons';
export {
  ThemeProvider,
  useTheme,
  useMounted,
  themeInitScript,
  createThemeInitScript,
  applyThemePreference,
  readThemePreference,
  resolveTheme,
  nextThemePreference,
  THEME_STORAGE_KEY,
  THEME_COOKIE,
  type ThemePreference,
  type ResolvedTheme,
} from './theme';
export {
  PREF_COOKIES,
  PREF_STORAGE_KEYS,
  PREF_PARENT_DOMAIN,
  PREF_MAX_AGE,
  PREFS_CORE_JS,
  prefCookieDomain,
  serializePrefCookie,
  readCookie,
  readPref,
  writePref,
  readThemeChoice,
  readLanguagePreference,
  preferredLanguages,
  matchLocale,
  pickLocale,
  createPrefsInitScript,
  type ThemeChoice,
  type PrefKind,
} from './prefs';
export {
  LINKS,
  PROJECTS,
  PROJECT_GROUPS,
  DOCS_PROJECTS,
  SOCIAL,
  COPYRIGHT_HOLDER,
  MODS_SITE,
  globalNav,
  projectHome,
  originOf,
  sameSitePath,
  type Project,
  type ProjectId,
  type ProjectGroupId,
  type DocsProject,
  type DocsProjectId,
  type SiteId,
  type SocialLink,
  type GlobalNavEntry,
} from './projects';
export { UI_LOCALES, UI_STRINGS, UI_LOCALE_NAMES, resolveUiLocale, uiLocaleName, uiStrings, type UiLocale, type UiStrings } from './i18n';
export { GOOGLE_FONTS_HREF, FONT_HEAD_HTML } from './fonts';
export { KIT_VERSION, KIT_GENERATOR, GENERATOR_META } from './version';
export { useDismissableDetails } from './menu';
export { usePreferredLocale, revealPendingChrome, type AppLocale } from './locale';
export { lilyPond, harborSunrise, sceneToSvg, type Scene, type Shape } from './paint';
