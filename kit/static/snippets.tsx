// Rendered by build-static.mjs with react-dom/server into plain HTML snippets for non-React pages.
// kit.js drives their menus (theme, language) and translates the chrome into the visitor's language.
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrandMark, GlobalBar, GlobalNavList } from '../components/GlobalBar';
import { BrandIcon, PixelIcon, type BrandIconName, type PixelIconName } from '../components/PixelIcon';
import { SiteFooter } from '../components/SiteFooter';
import type { ProjectId, SiteId } from '../components/projects';

type LangOption = { code: string; label: string; lang: string };

export function globalBarHtml(
  opts: {
    locale?: string;
    current?: SiteId;
    currentProject?: ProjectId | string;
    menu?: boolean;
    /** the site's own locales (Doxygen: the docs' locales) instead of the 9 chrome languages; rendered as buttons */
    languages?: { options: LangOption[]; current: string };
    /** the bar's menu button opens the page's own drawer (kit.js) instead of the bar's menu (kit 2.19 `onMenu`) */
    drawerMenu?: boolean;
  } = {},
): string {
  // `onMenu` renders the bar's menu button as a plain button; kit.js binds it on static pages (data-kit-gbar-menu)
  const extra = opts.drawerMenu ? ({ onMenu: () => {} } as object) : {};
  const languages = opts.languages ? { ...opts.languages, onSelect: () => {} } : undefined;
  return renderToStaticMarkup(
    <GlobalBar locale={opts.locale} current={opts.current} currentProject={opts.currentProject} menu={opts.menu} languages={languages} {...extra} />,
  );
}

/** The bar's links as a vertical list (a page's own menu when the bar's menu is off, e.g. the Doxygen drawer). */
export function globalNavListHtml(opts: { locale?: string; current?: SiteId; currentProject?: ProjectId | string; brandHeading?: boolean } = {}): string {
  // the docs drawer's heading (MobileDrawer): the LeviMC mark + name
  const heading: ReactNode = opts.brandHeading ? (
    <p className="kit-drawer-network-title">
      <BrandMark />
      <span>LeviMC</span>
    </p>
  ) : undefined;
  return renderToStaticMarkup(<GlobalNavList locale={opts.locale} current={opts.current} currentProject={opts.currentProject} heading={heading} />);
}

export function footerHtml(opts: { locale?: string } = {}): string {
  return renderToStaticMarkup(<SiteFooter locale={opts.locale} />);
}

/** A decorative pixel icon (aria-hidden) as plain SVG markup, e.g. the external-link mark on the Doxygen row. */
export function pixelIconHtml(name: PixelIconName, className?: string, size?: number): string {
  return renderToStaticMarkup(<PixelIcon name={name} className={className} size={size} />);
}

/** A brand icon (GitHub …) as plain SVG markup, e.g. the project's repository in the Doxygen row. */
export function brandIconHtml(name: BrandIconName, size = 16): string {
  return renderToStaticMarkup(<BrandIcon name={name} size={size} />);
}
