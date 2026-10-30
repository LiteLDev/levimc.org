import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';

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
 * on her opens the 3D space at once (its download starts then, nothing before).
 */
export default function LeviChanPeek() {
  const { t } = useI18n();
  const s = t.levichan;
  const [busy, setBusy] = useState(false);

  return (
    <div className="lc-peek" data-busy={busy || undefined}>
      <button
        type="button"
        className="lc-peek-head"
        aria-label={s.avatar}
        title={s.avatar}
        onClick={() => {
          setBusy(true);
          void openSpace(s, false).finally(() => setBusy(false));
        }}
      >
        <img src="/levichan/avatar.png" alt="" width={64} height={64} draggable={false} loading="lazy" decoding="async" />
      </button>
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
