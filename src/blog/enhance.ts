// Progressive enhancement of a rendered post (the subset of the kit docs' enhance.ts a blog needs): copy
// buttons on code blocks, opening the <details> that holds the URL's #anchor, scrollable tables by keyboard.
import { useEffect, type RefObject } from 'react';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

export function useProseEnhancements(ref: RefObject<HTMLElement | null>, key: string) {
  useEffect(() => {
    const root = ref.current;
    if (!root || !key) return;
    const onClick = (e: MouseEvent) => {
      const copy = (e.target as Element | null)?.closest<HTMLElement>('[data-kit-copy]');
      if (!copy || !root.contains(copy)) return;
      const code = copy.closest('.kit-code')?.querySelector('pre code') as HTMLElement | null;
      const text = code?.innerText ?? code?.textContent ?? '';
      void copyText(text.replace(/\n$/, '')).then((ok) => {
        if (!ok) return;
        copy.setAttribute('data-copied', copy.getAttribute('data-copied-label') ?? 'Copied!');
        window.setTimeout(() => copy.removeAttribute('data-copied'), 1600);
      });
    };
    const revealHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      if (!el || !root.contains(el)) return;
      let opened = false;
      for (let p: HTMLElement | null = el; p && p !== root; p = p.parentElement)
        if (p instanceof HTMLDetailsElement && !p.open) {
          p.open = true;
          opened = true;
        }
      if (opened) el.scrollIntoView();
    };
    root.addEventListener('click', onClick);
    window.addEventListener('hashchange', revealHash);
    if (window.location.hash) revealHash();
    const wraps = [...root.querySelectorAll<HTMLElement>('.kit-table-wrap')];
    for (const w of wraps) if (w.scrollWidth > w.clientWidth + 1) w.tabIndex = 0;
    return () => {
      root.removeEventListener('click', onClick);
      window.removeEventListener('hashchange', revealHash);
    };
  }, [ref, key]);
}
