import { useEffect, useRef, useState } from 'react';
import type { TocEntry } from '../../shared/types';
import { revealIn, whenScrollIdle } from './reveal';

/**
 * Scroll-spy: the last heading above 30% of the viewport is active (the last one once the page footer is in
 * full view). One IntersectionObserver whose root reaches from far above the page down to that line, so a
 * heading "intersects" exactly while it is above the line — no per-frame layout reads, and jumps (anchors,
 * Home/End) are seen too. Mount it once per page (DocLayout) and pass the result to every TOC.
 */
export function useActiveHeading(ids: string[], page?: string): string | null {
  const [active, setActive] = useState<string | null>(null);
  // re-observe on every page: DocLayout stays mounted across navigations and pages often share heading ids
  const key = (page ?? '') + '#' + ids.join('|');
  useEffect(() => {
    if (!ids.length || typeof IntersectionObserver === 'undefined') return;
    const els = ids.map((id) => document.getElementById(id));
    const above = new Map<Element, boolean>();
    let atEnd = false;
    const publish = () => {
      let cur: string | null = null;
      for (let i = 0; i < els.length; i++) if (els[i] && above.get(els[i]!)) cur = ids[i]!;
      if (atEnd) cur = ids[ids.length - 1] ?? cur;
      setActive((prev) => (prev === cur ? prev : cur));
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) above.set(e.target, e.isIntersecting);
        publish();
      },
      { rootMargin: '1000000px 0px -70% 0px' },
    );
    for (const el of els) if (el) io.observe(el);
    const footer = document.querySelector('.kit-doc-footer');
    const end = footer
      ? new IntersectionObserver(
          (entries) => {
            const e = entries[entries.length - 1]!;
            atEnd = e.isIntersecting && e.intersectionRatio > 0.99;
            publish();
          },
          { threshold: [0, 1] },
        )
      : undefined;
    if (footer) end?.observe(footer);
    return () => {
      io.disconnect();
      end?.disconnect();
    };
  }, [key]);
  return active;
}

export function TocList({ toc, active, onNavigate }: { toc: TocEntry[]; active: string | null; onNavigate?: () => void }) {
  const min = Math.min(...toc.map((t) => t.level));
  return (
    <ul className="kit-toc-list">
      {toc.map((t) => (
        <li key={t.id} data-level={t.level - min}>
          <a href={`#${t.id}`} className={t.id === active ? 'is-active' : undefined} aria-current={t.id === active ? 'location' : undefined} onClick={onNavigate}>
            {t.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Toc({ toc, title, active }: { toc: TocEntry[]; title: string; active: string | null }) {
  const ref = useRef<HTMLElement>(null);
  // long outlines: keep the highlighted entry visible in the sticky column — once the page has stopped scrolling
  useEffect(() => {
    if (!active) return;
    return whenScrollIdle(() => {
      const nav = ref.current;
      revealIn(nav?.closest<HTMLElement>('.kit-doc-toc') ?? null, nav?.querySelector<HTMLElement>('a.is-active') ?? null);
    });
  }, [active]);
  if (!toc.length) return null;
  return (
    <nav ref={ref} className="kit-toc" aria-label={title}>
      <p className="kit-toc-title">{title}</p>
      <TocList toc={toc} active={active} />
    </nav>
  );
}
