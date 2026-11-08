import { useRef, type ComponentType, type ReactNode } from 'react';
import { PixelIcon, BrandIcon } from './PixelIcon';
import { useDismissableDetails } from './menu';
import { UI_LOCALES, UI_LOCALE_NAMES, resolveUiLocale, uiLocaleName, uiStrings, type UiStrings } from './i18n';
import { LINKS, PROJECTS, globalNav, projectHome, sameSitePath, type Project, type ProjectId, type SiteId } from './projects';
import { LocaleSwitcher, type LinkLikeProps, type LocaleOption } from './LocaleSwitcher';
import { ThemeSwitcher } from './ThemeToggle';

/** The language menu of the bar: the site's own locales (docs: every option links to the equivalent page). */
export interface GlobalBarLanguages {
  options: LocaleOption[];
  /** `code` of the current option. */
  current: string;
  /** Called after the choice was stored as the cross-site preference (link options then navigate). */
  onSelect?: (code: string, option: LocaleOption) => void;
  /** Router-aware link component for options with an `href`. */
  linkComponent?: ComponentType<LinkLikeProps>;
}

export interface GlobalBarProps {
  /** Which LeviMC site this is (highlights its tab; docs.levimc.org: 'projects'). */
  current?: SiteId;
  /** On docs.levimc.org: which project's docs are open (marked in the Projects menu; implies current='projects'). */
  currentProject?: ProjectId | string;
  /** @deprecated kit 1.x name of `currentProject`. */
  currentDocs?: ProjectId | string;
  /** UI locale of the chrome (any BCP-47 tag). */
  locale?: string;
  strings?: Partial<UiStrings>;
  /**
   * The language menu. Omit it on single-language sites: the bar then offers the chrome languages, stores the
   * choice as the cross-site preference and calls `onLanguageChange` (default: reload the page).
   */
  languages?: GlobalBarLanguages;
  /** With the default language menu: apply a newly chosen BCP-47 language (default: location.reload()). */
  onLanguageChange?: (lang: string) => void;
  /** @deprecated kit 2: the GitHub button always opens the LiteLDev organisation (each project's repository is in the Projects menu); ignored. */
  github?: string;
  /** @deprecated kit 2: every site shows the LeviMC mark; ignored. */
  brandIcon?: ReactNode;
  /**
   * Origin of the current site (e.g. 'https://levimc.org'): bar links on this origin are rendered with
   * `linkComponent` as root-relative paths, so they navigate inside the app.
   */
  siteOrigin?: string;
  /** Router-aware link component for same-site links (see `siteOrigin`). */
  linkComponent?: ComponentType<LinkLikeProps>;
  /**
   * Which same-site paths the router renders (default: all). Paths it does not (e.g. static pages such as
   * levimc.org/blog/) stay plain links, so they load from the server.
   */
  isAppPath?: (path: string) => boolean;
  /**
   * The bar's own phone menu (the tabs and the Projects list folded behind one button). Pass false when the site
   * provides one menu button that opens a drawer with the same links (docs sites: {@link GlobalNavList}).
   */
  menu?: boolean;
  /**
   * Phones and tablets (≤ 960px): the bar's menu button opens the site's own menu instead of the bar's dropdown —
   * docs sites (React and Doxygen) open their drawer (sections, the section's sidebar, resources, the LeviMC links:
   * {@link GlobalNavList}). The button is the same and in the same place as the bar's own menu button on
   * levimc.org; it is a plain `<button>` (`data-kit-gbar-menu`) that calls this. Takes precedence over `menu`.
   * Static markup (Doxygen, build-static) renders the same button with `menuControls` alone and binds it in kit.js.
   */
  onMenu?: () => void;
  /** With `onMenu`: whether the menu it opens is open (`aria-expanded`). */
  menuOpen?: boolean;
  /** With `onMenu`: the id of the menu it opens (`aria-controls`, e.g. the drawer's dialog). */
  menuControls?: string;
  /** Keep the bar at the top while scrolling (sites where it is the only header). Docs headers scroll it away. */
  sticky?: boolean;
  className?: string;
  /** @deprecated kit 1.0: extra controls. The bar's controls are fixed in 1.1 (language, theme, GitHub); ignored. */
  end?: ReactNode;
}

interface LinkCtx {
  siteOrigin?: string;
  linkComponent?: ComponentType<LinkLikeProps>;
  isAppPath?: (path: string) => boolean;
}

/** An <a>, or the router link for same-site URLs. */
function BarLink({ url, ctx, className, current, children }: { url: string; ctx: LinkCtx; className: string; current?: boolean; children: ReactNode }) {
  let path = ctx.linkComponent ? sameSitePath(url, ctx.siteOrigin) : undefined;
  if (path !== undefined && ctx.isAppPath && !ctx.isAppPath(path)) path = undefined;
  const RouterLink = ctx.linkComponent;
  if (RouterLink && path !== undefined)
    return (
      <RouterLink href={path} className={className} aria-current={current ? 'page' : undefined}>
        {children}
      </RouterLink>
    );
  return (
    <a className={className} href={url} aria-current={current ? 'page' : undefined}>
      {children}
    </a>
  );
}

/** The LeviMC leaf on its framed tile (theme/chrome.css draws it), in front of "LeviMC" in the bar and the footer. */
export function BrandMark({ className }: { className?: string }) {
  return <span className={className ? `kit-brand-mark ${className}` : 'kit-brand-mark'} aria-hidden="true" />;
}

/**
 * One project: the whole row leads to its home page (projectHome: LeviMC Mods page, docs, or repository). A row that
 * leads to the repository says so with a GitHub mark beside the name.
 */
function ProjectItem({ p, t, current, ctx }: { p: Project; t: UiStrings; current: boolean; ctx: LinkCtx }) {
  const home = projectHome(p);
  return (
    <li className="kit-proj-item">
      <BarLink url={home} ctx={ctx} className="kit-proj-main" current={current}>
        <span className="kit-slot kit-proj-slot" aria-hidden="true">
          <img className="kit-proj-logo" src={p.logo} alt="" width={36} height={36} loading="lazy" decoding="async" />
        </span>
        <span className="kit-proj-text">
          <span className="kit-proj-name">
            {p.name}
            {home === p.repo ? (
              <>
                <BrandIcon name="github" size={11} className="kit-proj-repo-mark" aria-hidden="true" />
                <span className="kit-sr-only"> (GitHub)</span>
              </>
            ) : null}
          </span>
          <span className="kit-proj-blurb" data-kit-t={`projectBlurbs.${p.id}`}>
            {t.projectBlurbs[p.id]}
          </span>
        </span>
        <PixelIcon name="arrowRight" className="kit-proj-go" />
      </BarLink>
    </li>
  );
}

/** The projects the Projects menu lists: those with a documentation site (the others have their project cards). */
const MENU_PROJECTS = PROJECTS.filter((p) => p.docs);

/** The Projects menu: every project with a documentation site, each leading to its docs, then the GitHub organisation. */
function ProjectsPanel({ t, currentProject, ctx }: { t: UiStrings; currentProject?: string; ctx: LinkCtx }) {
  return (
    <div className="kit-proj">
      <p className="kit-proj-heading" aria-hidden="true">
        <span data-kit-t="docs">{t.docs}</span>
        <span className="kit-proj-count">{MENU_PROJECTS.length}</span>
      </p>
      <ul className="kit-proj-list" aria-label={t.docs} data-kit-t-aria="docs">
        {MENU_PROJECTS.map((p) => (
          <ProjectItem key={p.id} p={p} t={t} current={p.id === currentProject} ctx={ctx} />
        ))}
      </ul>
      <a className="kit-proj-all" href={LINKS.github}>
        <BrandIcon name="github" size={14} />
        <span data-kit-t="allRepositories">{t.allRepositories}</span>
        <PixelIcon name="arrowRight" />
      </a>
    </div>
  );
}

export interface GlobalNavListProps {
  current?: SiteId;
  currentProject?: string;
  /** @deprecated kit 1.x name of `currentProject`. */
  currentDocs?: string;
  locale?: string;
  strings?: Partial<UiStrings>;
  siteOrigin?: string;
  linkComponent?: ComponentType<LinkLikeProps>;
  isAppPath?: (path: string) => boolean;
  /** Called after a link is followed (e.g. close a drawer). */
  onNavigate?: () => void;
  /** Heading above the list (default: none). */
  heading?: ReactNode;
  className?: string;
}

/**
 * The bar's tabs as a vertical list (Home … About, with the projects under "Projects"): the phone menu of
 * the bar, and the "LeviMC" section of a site's own drawer when the bar's menu is off (`menu={false}`).
 */
export function GlobalNavList({ current, currentProject, currentDocs, locale, strings, siteOrigin, linkComponent, isAppPath, onNavigate, heading, className }: GlobalNavListProps) {
  const t = uiStrings(locale, strings);
  const project = currentProject ?? currentDocs;
  const tab = project ? 'projects' : current;
  const ctx: LinkCtx = { siteOrigin, linkComponent, isAppPath };
  return (
    <div className={className ? `kit-gbar-list ${className}` : 'kit-gbar-list'} onClick={(e) => ((e.target as Element).closest('a') ? onNavigate?.() : undefined)}>
      {heading}
      {globalNav(t).map((item) =>
        item.id === 'projects' ? (
          // a collapsed section, so the tabs after it (Mods … About) stay on the first screen of a phone
          <details key={item.id} className="kit-gbar-more-acc">
            <summary className="kit-gbar-more-link" aria-current={tab === 'projects' ? 'page' : undefined}>
              <span data-kit-t="projects">{item.label}</span>
              <PixelIcon name="chevronDown" className="kit-menu-chevron" />
            </summary>
            <ProjectsPanel t={t} currentProject={project} ctx={ctx} />
          </details>
        ) : (
          <BarLink key={item.id} url={item.url} ctx={ctx} className="kit-gbar-more-link" current={item.id === tab}>
            <span data-kit-t={item.id}>{item.label}</span>
          </BarLink>
        ),
      )}
    </div>
  );
}

/** Chrome languages offered by the bar on sites without their own locales. */
function chromeLanguageOptions(): LocaleOption[] {
  return UI_LOCALES.map((code) => ({ code, label: UI_LOCALE_NAMES[code], lang: code }));
}

/**
 * The bar at the very top of every LeviMC site (levimc.org, levimc.org/mods/, docs.levimc.org/*, the Doxygen API
 * pages and the static pages): the same brand, the same tabs (Home · Projects ▾ · Mods · Blog · Community · About)
 * and, on the right, the same controls (language, theme, GitHub → LiteLDev) everywhere. Only the current tab (and
 * on docs pages the current project in the Projects menu) and the language menu's options differ per site. Menus are <details>, so the bar works
 * without JavaScript.
 */
export function GlobalBar({
  current,
  currentProject,
  currentDocs,
  locale,
  strings,
  languages,
  onLanguageChange,
  siteOrigin,
  linkComponent,
  isAppPath,
  menu = true,
  onMenu,
  menuOpen = false,
  menuControls,
  sticky = false,
  className,
}: GlobalBarProps) {
  const t = uiStrings(locale, strings);
  const project = currentProject ?? currentDocs;
  const tab = project ? 'projects' : current;
  const projRef = useRef<HTMLDetailsElement>(null);
  const moreRef = useRef<HTMLDetailsElement>(null);
  useDismissableDetails(projRef);
  useDismissableDetails(moreRef);
  const ctx: LinkCtx = { siteOrigin, linkComponent, isAppPath };
  const items = globalNav(t);
  // the button that opens the site's own menu (docs drawer), else the bar's own dropdown (menu), else none
  const menuButton = onMenu !== undefined || menuControls !== undefined;
  const cls = ['kit-gbar', sticky ? 'kit-gbar-sticky' : '', menu || menuButton ? '' : 'kit-gbar-no-menu', className ?? ''].filter(Boolean).join(' ');

  const lang = languages ?? {
    options: chromeLanguageOptions(),
    current: resolveUiLocale(locale),
    onSelect: (_code: string, o: LocaleOption) => (onLanguageChange ? onLanguageChange(o.lang) : typeof location !== 'undefined' && location.reload()),
  };
  // every site names its languages the kit's way (and shows the full name on the trigger)
  const langOptions = lang.options.map((o) => ({ ...o, label: uiLocaleName(o.lang) ?? o.label, short: undefined }));

  return (
    <div className={cls} data-kit-globalbar="" role="region" aria-label="LeviMC" lang={locale}>
      <div className="kit-gbar-inner">
        <BarLink url={LINKS.home} ctx={ctx} className="kit-gbar-brand">
          <BrandMark />
          <span className="kit-gbar-brand-text kit-wordmark">LeviMC</span>
        </BarLink>
        <nav className="kit-gbar-nav" aria-label={t.network} data-kit-t-aria="network">
          <ul>
            {items.map((item) =>
              item.id === 'projects' ? (
                <li key={item.id} className="kit-gbar-projects-tab">
                  <details ref={projRef} className="kit-menu kit-gbar-projects">
                    <summary className="kit-gbar-link" aria-current={tab === 'projects' ? 'page' : undefined}>
                      <span data-kit-t="projects">{item.label}</span>
                      <PixelIcon name="chevronDown" className="kit-menu-chevron" />
                    </summary>
                    <div className="kit-menu-panel kit-gbar-projects-panel">
                      <ProjectsPanel t={t} currentProject={project} ctx={ctx} />
                    </div>
                  </details>
                </li>
              ) : (
                <li key={item.id}>
                  <BarLink url={item.url} ctx={ctx} className="kit-gbar-link" current={item.id === tab}>
                    <span data-kit-t={item.id}>{item.label}</span>
                  </BarLink>
                </li>
              ),
            )}
          </ul>
        </nav>
        <div className="kit-gbar-end">
          <LocaleSwitcher
            options={langOptions}
            current={lang.current}
            onSelect={lang.onSelect}
            linkComponent={languages?.linkComponent}
            strings={strings}
            className="kit-gbar-locale"
          />
          <ThemeSwitcher locale={locale} strings={strings} className="kit-gbar-theme" />
          <a className="kit-gbar-icon kit-gbar-github" href={LINKS.github} aria-label="GitHub" title="GitHub">
            <BrandIcon name="github" size={16} />
          </a>
          {menuButton ? (
            <button
              type="button"
              className="kit-gbar-icon kit-gbar-menu-btn"
              aria-label={t.menu}
              title={t.menu}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls={menuControls}
              data-kit-gbar-menu=""
              data-kit-t-aria="menu"
              data-kit-t-title="menu"
              onClick={onMenu}
            >
              <PixelIcon name="menu" />
            </button>
          ) : menu ? (
            <details ref={moreRef} className="kit-menu kit-gbar-more">
              <summary className="kit-gbar-icon" aria-label={t.menu} title={t.menu} data-kit-gbar-menu="" data-kit-t-aria="menu" data-kit-t-title="menu">
                <PixelIcon name="menu" />
              </summary>
              <div className="kit-menu-panel kit-gbar-more-panel">
                <nav aria-label={t.network} data-kit-t-aria="network">
                  <GlobalNavList current={tab} currentProject={project} locale={locale} strings={strings} siteOrigin={siteOrigin} linkComponent={linkComponent} isAppPath={isAppPath} />
                </nav>
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}
