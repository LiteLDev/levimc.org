import { useRef } from 'react';
import type { PageData, RouteMeta } from '../../shared/types';
import { langOf, site } from '../data';
import { SiteNav } from '../components/SiteNav';
import { Toc, TocList, useActiveHeading } from '../components/Toc';
import { DocFooter } from '../components/DocFooter';
import { useContentEnhancements } from '../enhance';
import { PixelIcon } from '../../../components/PixelIcon';
import type { UiStrings } from '../../../components/i18n';

function MobileToc({ page, t, active }: { page: PageData; t: UiStrings; active: string | null }) {
  const ref = useRef<HTMLDetailsElement>(null);
  if (!page.toc.length) return null;
  return (
    <details ref={ref} className="kit-toc-mobile">
      <summary>
        <span>{t.onThisPage}</span>
        <PixelIcon name="chevronDown" className="kit-menu-chevron" />
      </summary>
      <TocList toc={page.toc} active={active} onNavigate={() => ref.current && (ref.current.open = false)} />
    </details>
  );
}

export function DocLayout({ route, page, t }: { route: RouteMeta; page: PageData; t: UiStrings }) {
  const contentRef = useRef<HTMLDivElement>(null);
  useContentEnhancements(contentRef, route.page);
  // kit 2.22: every page has the site's column (brand, sections, the current section's tree, resources)
  const sidebar = true;
  const contentLang = route.fallback ? langOf(site.defaultLocale) : langOf(route.locale);
  const showToc = page.toc.length > 0 && page.frontmatter?.aside !== false;
  // With a sidebar the TOC column is always reserved, so the text column never jumps between pages.
  const tocColumn = showToc || sidebar;
  // one scroll-spy for both outlines (the column and the narrow-screen dropdown)
  const active = useActiveHeading(showToc ? page.toc.map((x) => x.id) : [], route.page);
  return (
    <div className="kit-doc-layout" data-sidebar="" data-toc={tocColumn ? '' : undefined}>
      {/* plain wrappers: the labelled <nav> inside is the landmark (two unlabelled <aside>s failed axe landmark-unique) */}
      <div className="kit-doc-sidebar">
        <div className="kit-doc-sidebar-inner">
          <SiteNav route={route} locale={route.locale} t={t} />
        </div>
      </div>
      <main id="kit-main" className="kit-doc-main" tabIndex={-1}>
        {showToc ? <MobileToc page={page} t={t} active={active} /> : null}
        <article className="kit-doc-article" lang={contentLang}>
          <div ref={contentRef} className="kit-prose" data-doc-content="" dangerouslySetInnerHTML={{ __html: page.html }} />
        </article>
        <DocFooter route={route} t={t} />
      </main>
      {tocColumn ? (
        <div className="kit-doc-toc" aria-hidden={showToc ? undefined : true}>
          <div className="kit-doc-toc-inner">{showToc ? <Toc toc={page.toc} title={t.onThisPage} active={active} /> : null}</div>
        </div>
      ) : null}
    </div>
  );
}
