import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import type { NavItem, ResourceLink, RouteMeta } from '../../shared/types';
import { href, site } from '../data';
import { KitLink } from './KitLink';
import { PixelIcon, BrandIcon, type BrandIconName } from '../../../components/PixelIcon';
import { useDismissableDetails } from '../../../components/menu';
import type { UiStrings } from '../../../components/i18n';

function NavDropdown({ item, active, path }: { item: NavItem; active: boolean; path?: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useDismissableDetails(ref);
  return (
    <details ref={ref} className="kit-menu kit-site-nav-menu">
      <summary className={active ? 'kit-site-nav-link is-active' : 'kit-site-nav-link'}>
        {item.text}
        <PixelIcon name="chevronDown" className="kit-menu-chevron" />
      </summary>
      <div className="kit-menu-panel">
        {item.items!.map((c, i) =>
          c.external ? (
            <a key={i} className="kit-menu-item" href={c.link} target="_blank" rel="noopener">
              <span>{c.text}</span>
              <PixelIcon name="external" />
            </a>
          ) : c.link !== undefined ? (
            <KitLink
              key={i}
              className={c.link === path ? 'kit-menu-item is-active' : 'kit-menu-item'}
              href={href(c.link)}
              aria-current={c.link === path ? 'page' : undefined}
            >
              <span>{c.text}</span>
            </KitLink>
          ) : null,
        )}
      </div>
    </details>
  );
}

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Header states tried in order until the section tabs fit (html[data-kit-nav-fit], see docs.css):
 * "search" (icon-only search), "tabs" (the tabs get their own row below brand + search), "drawer" (the tabs
 * move into the drawer, as below 960px). `header.tabsRow`: 'auto' uses all three, false skips "tabs",
 * true shows the tabs row from the start.
 */
function fitSteps(): string[] {
  const t = site.header?.tabsRow ?? 'auto';
  return t === 'auto' ? ['search', 'tabs', 'drawer'] : ['search', 'drawer'];
}

/**
 * Natural widths of the header, measured once in the unfitted state (no data-kit-nav-fit): the inner row's
 * content width `w`, the tabs' content width `need` and the room they had `have`, the search trigger's
 * width `trig` (0 when the viewport already made it compact) and the root font size. Every later state is
 * computed from these arithmetically — a resize reads nothing and writes the root attribute only on change.
 */
interface FitMeasure {
  w: number;
  need: number;
  have: number;
  trig: number;
  rem: number;
  /** the viewport made search compact (max-width: 1180px) when measured */
  compact: boolean;
  /** document.fonts was still loading when measured */
  loading: boolean;
}

declare global {
  interface Window {
    __kitNavFit?: FitMeasure;
  }
}

/**
 * Pre-paint measurement + first state, inlined right after the header: the first paint (and visitors without
 * JavaScript) already gets the right state, so nothing is clipped before hydration and nothing shifts after.
 * The toggles here are cheap — nothing below the header has been parsed yet. The measurement is kept on
 * window.__kitNavFit for the app.
 */
function navFitScript(): string {
  return (
    `(function(){try{var d=document.documentElement,s=document.currentScript,h=s&&s.previousElementSibling,` +
    `i=h&&h.querySelector(".kit-site-header-inner"),u=h&&h.querySelector(".kit-site-nav > ul"),t=h&&h.querySelector(".kit-search-trigger"),` +
    `S=${JSON.stringify(fitSteps())},k,c,m,a,z;if(!u||!i)return;d.removeAttribute("data-kit-nav-fit");` +
    `a=u.firstElementChild;z=u.lastElementChild;` +
    `if(u.clientWidth>0&&a&&z){c=getComputedStyle(i);m={w:i.clientWidth-parseFloat(c.paddingLeft)-parseFloat(c.paddingRight),need:z.getBoundingClientRect().right-a.getBoundingClientRect().left,have:u.clientWidth,` +
    `trig:t?t.offsetWidth:0,rem:parseFloat(getComputedStyle(d).fontSize)||16,compact:matchMedia("(max-width: 1180px)").matches,` +
    `loading:!!document.fonts&&document.fonts.status!=="loaded"};window.__kitNavFit=m}` +
    `for(k=0;k<S.length;k++){if(u.scrollWidth<=u.clientWidth)return;d.setAttribute("data-kit-nav-fit",S[k])}}catch(e){}})();`
  );
}

/** The tabs' natural width (scrollWidth is only the box's width while they fit). */
function tabsWidth(list: HTMLElement): number {
  const a = list.firstElementChild;
  const z = list.lastElementChild;
  return a && z ? z.getBoundingClientRect().right - a.getBoundingClientRect().left : 0;
}

/** The state for an inner-row content width `w` from a measurement (see FitMeasure). */
function fitState(m: FitMeasure, w: number, steps: string[], tabsRow: boolean): string | null {
  if (matchMedia('(max-width: 960px)').matches) return null; // the tabs live in the drawer: no fitting
  // what the full search trigger gives up when compact (2rem); its min-width (13rem) when it was never measured full
  const delta = tabsRow ? 0 : Math.max(0, (m.compact || !m.trig ? 13 * m.rem : m.trig) - 2 * m.rem);
  const haveFull = m.have - (m.compact ? delta : 0) + (w - m.w);
  const avail: Record<string, number> = {
    '': haveFull + (matchMedia('(max-width: 1180px)').matches ? delta : 0),
    search: haveFull + delta,
    // the tabs row spans the inner row plus the nav's -0.75rem side margins
    tabs: w + 1.5 * m.rem,
    drawer: Infinity,
  };
  if (tabsRow) avail.tabs = avail.search!;
  let state = '';
  for (const step of steps) {
    if (m.need <= avail[state]! + 0.5) break;
    state = step;
  }
  return state || null;
}

/**
 * Keeps the section tabs from being cut off. Resizes are computed from the cached natural widths (no DOM
 * reads, no attribute toggling); html[data-kit-nav-fit] is written only when the state changes. Re-measured
 * once fonts are ready (if they were loading) and on locale changes; the active tab only re-reads the tabs' width.
 */
function useNavFit(ref: RefObject<HTMLElement | null>, locale: string, active: number | undefined) {
  const measure = useRef<FitMeasure | undefined>(undefined);
  const lastW = useRef(-1);
  const apply = useRef<(w: number) => void>(() => undefined);
  const remeasure = useRef<() => void>(() => undefined);
  const seenLocale = useRef<string | null>(null);

  useIsoLayoutEffect(() => {
    const header = ref.current;
    const inner = header?.querySelector<HTMLElement>('.kit-site-header-inner');
    const list = header?.querySelector<HTMLElement>('.kit-site-nav > ul');
    const root = document.documentElement;
    if (!header || !inner || !list) return;
    const steps = fitSteps();
    const tabsRow = site.header?.tabsRow === true;
    let raf = 0;
    const set = (state: string | null) => {
      if (root.getAttribute('data-kit-nav-fit') === state) return;
      if (state) root.setAttribute('data-kit-nav-fit', state);
      else root.removeAttribute('data-kit-nav-fit');
      window.dispatchEvent(new Event('kit-nav-fit'));
      // safety net, once per state change: if the tabs still overflow (an unexpected layout), take the next step
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (list.clientWidth > 0 && list.scrollWidth > list.clientWidth + 1) {
          const next = steps[steps.indexOf(root.getAttribute('data-kit-nav-fit') ?? '') + 1];
          if (next) set(next);
        }
      });
    };
    /** Read the natural widths: the unfitted state is needed for that (one root write when a state is set). */
    const doMeasure = () => {
      if (matchMedia('(max-width: 960px)').matches) return (measure.current = undefined);
      const had = root.getAttribute('data-kit-nav-fit');
      if (had) root.removeAttribute('data-kit-nav-fit');
      const cs = getComputedStyle(inner);
      const trigger = header.querySelector<HTMLElement>('.kit-search-trigger');
      const m: FitMeasure = {
        w: inner.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
        need: tabsWidth(list),
        have: list.clientWidth,
        trig: trigger?.offsetWidth ?? 0,
        rem: parseFloat(getComputedStyle(root).fontSize) || 16,
        compact: matchMedia('(max-width: 1180px)').matches,
        loading: false,
      };
      if (had) root.setAttribute('data-kit-nav-fit', had);
      measure.current = m.have > 0 ? m : undefined;
      lastW.current = m.w;
      return measure.current;
    };
    apply.current = (w: number) => {
      lastW.current = w;
      if (matchMedia('(max-width: 960px)').matches) return set(null);
      const m = measure.current ?? doMeasure();
      if (m) set(fitState(m, w, steps, tabsRow));
    };
    remeasure.current = () => {
      const m = doMeasure();
      if (m) set(fitState(m, m.w, steps, tabsRow));
    };

    // first mount: reuse the pre-paint measurement (same locale, same tabs) — no layout read at all
    if (!measure.current && window.__kitNavFit && seenLocale.current === null) {
      measure.current = window.__kitNavFit;
      lastW.current = measure.current.w;
    } else if (seenLocale.current !== null && seenLocale.current !== locale) {
      measure.current = undefined; // other labels
    }
    seenLocale.current = locale;
    if (!measure.current) remeasure.current();

    const ro =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver((entries) => {
            const w = entries[entries.length - 1]!.contentRect.width;
            // the observer also fires for height changes (e.g. the tabs row): only width matters
            if (Math.abs(w - lastW.current) < 0.5) return;
            apply.current(w);
          });
    ro?.observe(inner);
    // web fonts change the tabs' width once: re-measure when they are ready (if they were not at measuring time)
    let live = true;
    if (document.fonts && (measure.current?.loading ?? document.fonts.status !== 'loaded')) {
      void document.fonts.ready.then(() => {
        if (live) remeasure.current();
      });
    }
    return () => {
      live = false;
      ro?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [ref, locale]);

  // another active tab (bolder label): only the tabs' own width changes
  const firstActive = useRef(true);
  useIsoLayoutEffect(() => {
    if (firstActive.current) {
      firstActive.current = false;
      return;
    }
    const list = ref.current?.querySelector<HTMLElement>('.kit-site-nav > ul');
    const m = measure.current;
    if (!list || !m || list.clientWidth === 0) return;
    const need = tabsWidth(list);
    if (Math.abs(need - m.need) < 0.5) return;
    m.need = need;
    apply.current(lastW.current);
  }, [active]);
}

function Resource({ r }: { r: ResourceLink }) {
  const target = r.external ? { target: '_blank', rel: 'noopener' } : {};
  const url = r.external ? r.link : href(r.link);
  if (r.kind === 'github')
    return (
      <a className="mc-icon-btn kit-site-social kit-site-repo" href={url} {...target} aria-label={r.text} title={r.text} data-kit-resource="github">
        <BrandIcon name="github" size={18} />
      </a>
    );
  const cls = r.kind === 'download' ? 'mc-btn mc-btn-primary kit-site-resource kit-site-download' : 'kit-site-nav-link kit-site-resource';
  const body = <span>{r.text}</span>;
  return r.external ? (
    <a className={cls} href={url} {...target} data-kit-resource={r.kind}>
      {body}
    </a>
  ) : (
    <KitLink className={cls} href={url} data-kit-resource={r.kind}>
      {body}
    </KitLink>
  );
}

export interface SiteHeaderProps {
  route?: RouteMeta;
  locale: string;
  t: UiStrings;
  onOpenSearch: () => void;
  /** Hover / focus of the search trigger: start loading the search index. */
  onWarmSearch?: () => void;
}

/**
 * The docs' own row under the LeviMC bar: the brand (logo + name, the only link to the docs home), the section
 * tabs, search and the resources slot (header.links, then the repository's GitHub icon) — one compact, light
 * row that reads as the lower half of a single header. Language and theme live only in the bar above (which
 * scrolls away; this row sticks). Below 960px (or when the tabs cannot fit) the bar's menu button opens the
 * drawer with the sections, the current section's tree, the resources and the LeviMC links.
 */
export function SiteHeader({ route, locale, t, onOpenSearch, onWarmSearch }: SiteHeaderProps) {
  const items = site.nav[locale] ?? [];
  const resources = site.resources?.[locale] ?? [];
  const home = href(site.homePaths[locale] ?? '');
  const headerRef = useRef<HTMLElement>(null);
  useNavFit(headerRef, locale, route?.nav);
  const tabsRow = site.header?.tabsRow === true;
  return (
    <>
      <header ref={headerRef} className={tabsRow ? 'kit-site-header has-tabs-row' : 'kit-site-header'} data-kit-subnav="">
        <div className="kit-site-header-inner">
          <KitLink className="kit-site-brand" href={home}>
            {site.logo ? (
              <img className="kit-site-logo" src={site.logo.src} alt="" width={24} height={24} />
            ) : (
              <PixelIcon name="grass" size={24} className="kit-site-logo" />
            )}
            <span className="kit-site-title">{site.title}</span>
          </KitLink>
          {items.length ? (
            <nav className="kit-site-nav" aria-label={t.mainNav}>
              <ul>
                {items.map((it, i) => {
                  const active = route?.nav === i;
                  return (
                    <li key={i}>
                      {it.items ? (
                        <NavDropdown item={it} active={active} path={route?.path} />
                      ) : it.external ? (
                        <a className="kit-site-nav-link" href={it.link} target="_blank" rel="noopener">
                          {it.text}
                          <PixelIcon name="external" className="kit-site-nav-ext" />
                        </a>
                      ) : it.link !== undefined ? (
                        <KitLink className={active ? 'kit-site-nav-link is-active' : 'kit-site-nav-link'} href={href(it.link)} aria-current={active ? 'true' : undefined}>
                          {it.text}
                        </KitLink>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : (
            <span className="kit-site-spacer" />
          )}
          <div className="kit-site-actions">
            {/* the visible "Search" text is the button's name (visually hidden, not removed, when compact) */}
            <button
              type="button"
              className="kit-search-trigger"
              data-kit-search-trigger=""
              onClick={onOpenSearch}
              onPointerEnter={onWarmSearch}
              onFocus={onWarmSearch}
              aria-keyshortcuts="Control+K Meta+K /"
            >
              <PixelIcon name="search" />
              <span className="kit-search-trigger-label">{t.search}</span>
              <span className="kit-search-trigger-keys" aria-hidden="true">
                <kbd className="mc-kbd">Ctrl</kbd>
                <kbd className="mc-kbd">K</kbd>
              </span>
            </button>
            {resources.length ? (
              <span className="kit-site-resources" data-kit-resources="">
                {resources.map((r) => (
                  <Resource key={r.kind + r.link} r={r} />
                ))}
              </span>
            ) : null}
            {site.social.map((s) => (
              <a key={s.link} className="mc-icon-btn kit-site-social" href={s.link} target="_blank" rel="noopener" aria-label={s.label ?? s.icon} title={s.label ?? s.icon}>
                <BrandIcon name={(s.icon as BrandIconName) ?? 'github'} size={18} />
              </a>
            ))}
          </div>
        </div>
      </header>
      {items.length ? <script dangerouslySetInnerHTML={{ __html: navFitScript() }} /> : null}
    </>
  );
}
