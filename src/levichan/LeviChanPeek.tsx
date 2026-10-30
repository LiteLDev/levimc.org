import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';

/** Download of the 3D space (model, textures, the first motions, the runtime), for the menu. */
const DOWNLOAD = '≈ 9 MB';

let entering = false;
async function openSpace(strings: Parameters<typeof import('./space').enter>[0]['strings'], instant: boolean) {
  if (entering) return;
  entering = true;
  try {
    const space = await import('./space');
    await space.enter({ strings, instant, onExit: () => (entering = false) });
  } catch (e) {
    entering = false;
    console.error('LeviChan:', e);
  }
}

/**
 * LeviChan peeking from behind the hero's showcase card: only the top of her head shows, until hovered. A click
 * opens a small menu; entering the 3D space downloads everything it needs then (nothing before).
 */
export default function LeviChanPeek() {
  const { t } = useI18n();
  const s = t.levichan;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="lc-peek" ref={ref} data-open={open || undefined}>
      <button type="button" className="lc-peek-head" aria-label={s.avatar} title={s.avatar} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <img src="/levichan/avatar.png" alt="" width={64} height={64} draggable={false} loading="lazy" decoding="async" />
      </button>
      {open ? (
        <div className="lc-peek-menu" role="dialog" aria-label={s.peekTitle}>
          <strong>{s.peekTitle}</strong>
          <p>{s.peekText}</p>
          <div className="lc-peek-actions">
            <button
              type="button"
              className="mc-btn mc-btn-primary"
              onClick={() => {
                setOpen(false);
                void openSpace(s, false);
              }}
            >
              {s.enter(DOWNLOAD)}
            </button>
            <button type="button" className="mc-btn mc-btn-ghost" onClick={() => setOpen(false)}>
              {s.notNow}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** After a reload while the space was open, bring it back (without the fold-in). */
export function useLeviChanRestore() {
  const { t } = useI18n();
  useEffect(() => {
    let again = false;
    try {
      again = sessionStorage.getItem('levichan') === '1';
    } catch {
      /* ignore */
    }
    if (again) void openSpace(t.levichan, true);
    // only on the first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
