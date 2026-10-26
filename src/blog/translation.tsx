// The blog in the reader's language: the posts' titles, excerpts and text are machine-translated into the
// interface language whenever that is not the language they were written in (see translator.ts for who
// translates), unless the reader asked for the original — a switch, remembered in this browser. For readers of
// the posts' own language nothing changes.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Badge, PixelIcon } from '../../kit/components';
import { useI18n } from '../i18n';
import type { BlogDoc, BlogPost } from './data';
import { IDLE_ACTIVITY, cachedTranslations, clearTranslationFailure, onTranslationActivity, translateHtml, translateTexts, translationActivity, translationTarget } from './translator';

const STORAGE_KEY = 'levimc-blog-translate';

interface TranslationState {
  /** BCP-47 tag of the interface language. */
  uiLang: string;
  enabled: boolean;
  setEnabled: (on: boolean) => void;
  /** Counts the reader's retries after a failure: the hooks ask again. */
  attempt: number;
  retry: () => void;
}
const Context = createContext<TranslationState>({ uiLang: 'en', enabled: false, setEnabled: () => {}, attempt: 0, retry: () => {} });

/** On unless the reader turned it off. */
function readChoice(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}
function writeChoice(on: boolean) {
  try {
    if (on) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, 'off');
  } catch {
    /* storage blocked: the choice lasts the visit */
  }
}

export function BlogTranslationProvider({ children }: { children: ReactNode }) {
  const { info } = useI18n();
  const [enabled, setOn] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // the prerendered page (and its hydration) shows the original; translation starts right after
  useEffect(() => setOn(readChoice()), []);
  const setEnabled = useCallback((on: boolean) => {
    setOn(on);
    writeChoice(on);
  }, []);
  const retry = useCallback(() => {
    clearTranslationFailure();
    setAttempt((n) => n + 1);
  }, []);
  const value = useMemo<TranslationState>(() => ({ uiLang: info.lang, enabled, setEnabled, attempt, retry }), [info.lang, enabled, setEnabled, attempt, retry]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** The language texts written in `lang` are being translated into (null: translation is off, or they read `lang`). */
function useTarget(lang: string): string | null {
  const { uiLang, enabled } = useContext(Context);
  return enabled ? translationTarget(lang, uiLang) : null;
}

/**
 * `texts`, written in `lang`, in the reader's language once translated — the originals until then, `pending`
 * while they are on their way (shown as ghost text: data-ghost).
 */
export function useTranslated(texts: readonly string[], lang: string): { texts: readonly string[]; lang: string; pending: boolean } {
  const to = useTarget(lang);
  const { attempt } = useContext(Context);
  const key = `${texts.join('\u0000')}\u0000${to}\u0000${attempt}`;
  const [, rerender] = useState(0);
  const [failedKey, setFailedKey] = useState('');
  useEffect(() => {
    if (!to || cachedTranslations(texts, lang, to)) return;
    let live = true;
    translateTexts(texts, lang, to).then(
      () => live && rerender((n) => n + 1),
      () => live && setFailedKey(key),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands for `texts`, `to` and `attempt`
  }, [key, lang]);
  const translated = to ? cachedTranslations(texts, lang, to) : undefined;
  if (translated) return { texts: translated, lang: to!, pending: false };
  return { texts, lang, pending: !!to && failedKey !== key };
}

export function useTranslatedPost(post: BlogPost): { title: string; excerpt: string; lang: string; pending: boolean } {
  const { texts, lang, pending } = useTranslated([post.title, post.excerpt], post.lang);
  return { title: texts[0] ?? post.title, excerpt: texts[1] ?? post.excerpt, lang, pending };
}

const translatedDocs = new Map<string, BlogDoc>();

/** A post's rendered markdown (and its headings' outline) in the reader's language — the original until then. */
export function useTranslatedDoc(id: string, doc: BlogDoc | null | undefined): { doc: BlogDoc | null | undefined; pending: boolean } {
  const target = useTarget(doc?.lang ?? '');
  const { attempt } = useContext(Context);
  const to = doc ? target : null;
  const key = `${id}\u0000${to}`;
  const [, rerender] = useState(0);
  const [failedKey, setFailedKey] = useState('');
  useEffect(() => {
    if (!doc || !to || translatedDocs.has(key)) return;
    let live = true;
    Promise.all([translateHtml(doc.html, doc.lang, to), translateTexts(doc.toc.map((e) => e.text), doc.lang, to)]).then(
      ([html, toc]) => {
        translatedDocs.set(key, { html, toc: doc.toc.map((e, i) => ({ ...e, text: toc[i] ?? e.text })), lang: to });
        if (live) rerender((n) => n + 1);
      },
      () => live && setFailedKey(`${key}\u0000${attempt}`),
    );
    return () => {
      live = false;
    };
  }, [doc, to, key, attempt]);
  const translated = to ? translatedDocs.get(key) : undefined;
  if (translated) return { doc: translated, pending: false };
  return { doc, pending: !!to && failedKey !== `${key}\u0000${attempt}` };
}

/**
 * The switch — "Translate to English" / "Show original" — with what is happening beside it (a live region, so it
 * is read out). Only for readers whose interface language is not `lang`. With `writtenIn`, the idle state names
 * the language the text is written in.
 */
export function TranslateToggle({ lang, writtenIn = false }: { lang: string; writtenIn?: boolean }) {
  const { t } = useI18n();
  const b = t.blog;
  const { uiLang, enabled, setEnabled, retry } = useContext(Context);
  const activity = useSyncExternalStore(onTranslationActivity, translationActivity, () => IDLE_ACTIVITY);
  if (!translationTarget(lang, uiLang)) return null;
  const busy = enabled && activity.busy;
  const failed = enabled && !activity.busy && activity.failed;
  const status = busy ? b.translating : failed ? b.translateFailed : enabled && activity.by ? b.translatedBy(activity.by) : '';
  return (
    <div className="lm-blog-translate">
      <button type="button" className="mc-btn mc-btn-sm lm-blog-translate-btn" data-on={enabled || undefined} data-busy={busy || undefined} onClick={() => setEnabled(!enabled)}>
        <PixelIcon name="globe" />
        <span>{enabled ? b.showOriginal : b.translate}</span>
      </button>
      <span className="lm-blog-translate-note" role="status">
        {status}
      </span>
      {failed ? (
        <button type="button" className="lm-blog-translate-retry" onClick={retry}>
          {b.retry}
        </button>
      ) : null}
      {writtenIn && !enabled ? (
        <Badge tone="pond" className="lm-blog-lang">
          {b.writtenIn}
        </Badge>
      ) : null}
    </div>
  );
}
