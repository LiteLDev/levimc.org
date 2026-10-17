import type { ReactNode } from 'react';

/** Silkscreen is for short Latin labels only; CJK labels fall back to the UI face. */
export const isLatin = (s: string) => /^[\x20-\x7e]+$/.test(s);

export function Eyebrow({ children, className }: { children: string; className?: string }) {
  return (
    <p className={['lm-eyebrow', isLatin(children) ? 'kit-pixel-label' : 'lm-eyebrow-cjk', className].filter(Boolean).join(' ')}>
      <span className="px-dot" aria-hidden="true" />
      {children}
    </p>
  );
}

/** Page heading block for the inner pages: eyebrow, display title, lead paragraph. */
export function PageHeader({ eyebrow, title, lead, className }: { eyebrow?: string; title: ReactNode; lead?: ReactNode; className?: string }) {
  return (
    <header className={className ? `lm-page-head ${className}` : 'lm-page-head'}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1 className="lm-title">{title}</h1>
      {lead ? <p className="lm-lead">{lead}</p> : null}
    </header>
  );
}
