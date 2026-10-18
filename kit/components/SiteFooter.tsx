import type { ComponentType, ReactNode } from 'react';
import { PixelIcon, BrandIcon } from './PixelIcon';
import { uiStrings, type UiStrings } from './i18n';
import { LINKS, SOCIAL, COPYRIGHT_HOLDER, sameSitePath } from './projects';
import { BrandMark } from './GlobalBar';
import type { LinkLikeProps } from './LocaleSwitcher';

export interface SiteFooterProps {
  locale?: string;
  /** Chrome strings in a language the kit lacks (labels only: the footer's content is the same on every site). */
  strings?: Partial<UiStrings>;
  /** @deprecated kit 2: the footer is identical on every LeviMC site; ignored. */
  extra?: ReactNode;
  /** @deprecated kit 2: every site shows "© <year> LeviMC"; ignored. */
  copyright?: ReactNode;
  /** Copyright year (defaults to the build year; kit.js / the app keep it current). */
  year?: number;
  /** Origin of the current site: footer links on it are rendered with `linkComponent` (in-app navigation). */
  siteOrigin?: string;
  /** Router-aware link component for same-site links (see `siteOrigin`). */
  linkComponent?: ComponentType<LinkLikeProps>;
  /** Which same-site paths the router renders (default: all); others stay plain links (see GlobalBar). */
  isAppPath?: (path: string) => boolean;
  className?: string;
}

const BUILD_YEAR = new Date().getFullYear();

interface NavCtx {
  siteOrigin?: string;
  linkComponent?: ComponentType<LinkLikeProps>;
  isAppPath?: (path: string) => boolean;
}

/** An <a>, or the router link for same-site URLs (module level, so its type is stable across renders). */
function FooterLink({ nav, url, className, children }: { nav: NavCtx; url: string; className?: string; children: ReactNode }) {
  const RouterLink = nav.linkComponent;
  let path = RouterLink ? sameSitePath(url, nav.siteOrigin) : undefined;
  if (path !== undefined && nav.isAppPath && !nav.isAppPath(path)) path = undefined;
  return RouterLink && path !== undefined ? (
    <RouterLink href={path} className={className}>
      {children}
    </RouterLink>
  ) : (
    <a href={url} className={className}>
      {children}
    </a>
  );
}

/**
 * The footer of every LeviMC site, identical everywhere: grass horizon over "soil"; the LeviMC mark and tagline
 * with each social channel once (as icons), then one legal row — © year · Support us, and the Minecraft trademark
 * notice. No link columns: the bar above already carries the navigation (Projects menu, Mods, Blog, Community, About).
 */
export function SiteFooter({ locale, strings, year = BUILD_YEAR, siteOrigin, linkComponent, isAppPath, className }: SiteFooterProps) {
  const t = uiStrings(locale, strings);
  const nav: NavCtx = { siteOrigin, linkComponent, isAppPath };
  const social = [...SOCIAL.filter((s) => s.id !== 'email'), { id: 'github' as const, label: 'GitHub', url: LINKS.github }, ...SOCIAL.filter((s) => s.id === 'email')];
  return (
    <footer className={className ? `kit-footer ${className}` : 'kit-footer'} data-kit-footer="" lang={locale}>
      <div className="grass-divider" aria-hidden="true" />
      <div className="kit-footer-soil">
        <div className="kit-footer-inner">
          <div className="kit-footer-brand">
            <FooterLink nav={nav} url={LINKS.home} className="kit-footer-logo">
              <BrandMark className="kit-brand-mark-lg" />
              <span>LeviMC</span>
            </FooterLink>
            <p className="kit-footer-tagline" data-kit-t="tagline">
              {t.tagline}
            </p>
          </div>
          <ul className="kit-footer-social" aria-label={t.footerConnect} data-kit-t-aria="footerConnect">
            {social.map((s) => (
              <li key={s.id}>
                <a href={s.url} className="kit-footer-social-link" aria-label={s.id === 'email' ? `${t.email}: ${s.label}` : s.label} title={s.label}>
                  <BrandIcon name={s.id} size={18} />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="kit-footer-legal">
          <div className="kit-footer-inner kit-footer-legal-inner">
            <p>
              <span suppressHydrationWarning>
                © <span data-kit-year="">{year}</span> {COPYRIGHT_HOLDER}
              </span>
              <span className="kit-footer-sep" aria-hidden="true">
                ·
              </span>
              <FooterLink nav={nav} url={LINKS.support} className="kit-footer-support">
                <PixelIcon name="heart" />
                <span data-kit-t="supportUs">{t.supportUs}</span>
              </FooterLink>
            </p>
            <p className="kit-footer-notice" data-kit-t="notAffiliated">
              {t.notAffiliated}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
