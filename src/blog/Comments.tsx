// Waline comments (https://waline.levimc.org/, the old blog's comment server). Comments are keyed by the
// post's path on the old blog (e.g. /2023/07/26/original-fix-BeeCrash/), so every existing comment still
// shows here and new ones join them. The client is loaded only when the comments scroll into view.
import { useEffect, useRef, useState } from 'react';
import type { WalineEmojiPresets, WalineInstance } from '@waline/client';
import { useI18n } from '../i18n';

export const WALINE_SERVER = 'https://waline.levimc.org/';

/** The old blog's Waline settings (hexo-theme-shokax `waline:` in _config.shokax.yml). */
const EMOJI = ['weibo', 'alus', 'bilibili', 'qq', 'tieba', 'tw-emoji'].map((s) => `https://unpkg.com/@waline/emojis@1.0.1/${s}` as WalineEmojiPresets);

export default function Comments({ path }: { path: string }) {
  const { t, info } = useI18n();
  const b = t.blog;
  const box = useRef<HTMLElement>(null);
  const el = useRef<HTMLDivElement>(null);
  const instance = useRef<WalineInstance | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  const lang = info.lang === 'en' ? 'en' : 'zh-CN';
  // the language at the moment the client finishes loading (it may change while it loads)
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    const target = box.current;
    if (!target) return;
    let cancelled = false;
    const start = () => {
      setState('loading');
      Promise.all([import('@waline/client'), import('@waline/client/waline.css')])
        .then(([{ init }]) => {
          if (cancelled || !el.current) return;
          instance.current = init({
            el: el.current,
            serverURL: WALINE_SERVER,
            path,
            lang: langRef.current,
            dark: 'html.dark',
            emoji: EMOJI,
            meta: ['nick', 'mail', 'link'],
            requiredMeta: ['nick', 'mail'],
            wordLimit: 0,
            pageSize: 10,
            pageview: false,
            comment: false,
          });
          setState('ready');
        })
        .catch(() => !cancelled && setState('failed'));
    };
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              if (entries.some((e) => e.isIntersecting)) {
                io?.disconnect();
                start();
              }
            },
            { rootMargin: '600px 0px' },
          )
        : null;
    if (io) io.observe(target);
    else start();
    return () => {
      cancelled = true;
      io?.disconnect();
      instance.current?.destroy();
      instance.current = null;
    };
    // a new page gets a fresh instance; the language is updated in place below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => {
    instance.current?.update({ lang });
  }, [lang]);

  return (
    <section ref={box} className="lm-blog-comments" aria-labelledby="lm-blog-comments-title">
      <h2 id="lm-blog-comments-title" className="lm-blog-section-title">
        {b.comments}
      </h2>
      {state === 'loading' ? <p className="lm-blog-comments-status">{b.commentsLoading}</p> : null}
      {state === 'failed' ? <p className="lm-blog-comments-status">{b.commentsFailed}</p> : null}
      <div ref={el} className="lm-waline" />
    </section>
  );
}
