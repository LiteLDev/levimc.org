// Rendered by build-static.mjs with react-dom/server into plain HTML snippets for non-React pages.
// kit.js drives their menus (theme, language) and translates the chrome into the visitor's language.
import { renderToStaticMarkup } from 'react-dom/server';
import { GlobalBar, GlobalNavList } from '../components/GlobalBar';
import { PixelIcon, type PixelIconName } from '../components/PixelIcon';
import { SiteFooter } from '../components/SiteFooter';
import type { ProjectId, SiteId } from '../components/projects';

export function globalBarHtml(opts: { locale?: string; current?: SiteId; currentProject?: ProjectId | string; menu?: boolean } = {}): string {
  return renderToStaticMarkup(<GlobalBar locale={opts.locale} current={opts.current} currentProject={opts.currentProject} menu={opts.menu} />);
}

/** The bar's links as a vertical list (a page's own menu when the bar's menu is off, e.g. Doxygen on phones). */
export function globalNavListHtml(opts: { locale?: string; current?: SiteId; currentProject?: ProjectId | string } = {}): string {
  return renderToStaticMarkup(<GlobalNavList locale={opts.locale} current={opts.current} currentProject={opts.currentProject} />);
}

export function footerHtml(opts: { locale?: string } = {}): string {
  return renderToStaticMarkup(<SiteFooter locale={opts.locale} />);
}

/** A decorative pixel icon (aria-hidden) as plain SVG markup, e.g. the external-link mark on the Doxygen row. */
export function pixelIconHtml(name: PixelIconName, className?: string): string {
  return renderToStaticMarkup(<PixelIcon name={name} className={className} />);
}
