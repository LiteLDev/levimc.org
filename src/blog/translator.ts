// Machine translation of the blog in the browser: the posts are written in Chinese, the site is also read in
// English and Traditional Chinese. Two translators, tried in this order for every batch:
//   1. the browser's own (the Translator API, Chrome / Edge 138+): on this device, works everywhere — when its
//      language pack is here. A pack still to download (the reader just clicked: downloading needs a gesture)
//      starts downloading in the background and serves the batches after this one.
//   2. Google Translate's public endpoint: no key, no server of ours, every other browser. It is not reachable
//      from mainland China; when it fails, a pack that is on its way is waited for after all.
// Everything asked for in the same tick goes out as one batch, translations are kept for the rest of the visit,
// and a post's HTML is translated text node by text node: its markup, links and images stay as rendered (so a
// sentence broken up by inline markup is translated in pieces — the price of never inserting foreign HTML). Code
// is left alone, except plain-text blocks and comment lines, which are prose.

const GOOGLE_ENDPOINT = 'https://translate.googleapis.com/translate_a/t?client=gtx';
/** One Google request carries at most this many segments / characters. */
const MAX_ITEMS = 64;
const MAX_CHARS = 3000;
const GOOGLE_TIMEOUT_MS = 10_000;
/** The browser's translator gets this long to say whether it is ready (its availability check can hang). */
const BROWSER_TIMEOUT_MS = 1_500;
/** Inside a post, nothing in these is text to translate. */
const NEVER = 'kbd, samp, var, svg, math, [translate="no"]';
/** Code blocks in these "languages" are prose; in the others only comment lines are. */
const PLAIN_CODE = new Set(['', 'text', 'txt', 'plain', 'plaintext']);
const COMMENT_LINE = /^\s*(?:\/\/|#|\/\*|\*|;|%|--|<!--)/;
/** Chinese punctuation between inline markup, e.g. the enumeration comma in `<code>a</code>、<code>b</code>`. */
const CJK_PUNCTUATION: Record<string, string> = { '、': ', ', '，': ', ', '。': '. ', '：': ': ', '；': '; ', '！': '! ', '？': '? ', '（': ' (', '）': ') ', '《': ' "', '》': '" ', '「': ' "', '」': '" ', '【': ' [', '】': '] ' };
const CJK_PUNCTUATION_RE = new RegExp(`[${Object.keys(CJK_PUNCTUATION).join('')}]`, 'g');

export type TranslatorName = 'browser' | 'google';

// ---- languages
/** Chinese is one language per script: zh-CN and zh-Hans are the same thing. */
const BY_SCRIPT: Record<string, string> = { 'zh-CN': 'zh-Hans', 'zh-SG': 'zh-Hans', 'zh-TW': 'zh-Hant', 'zh-HK': 'zh-Hant', 'zh-MO': 'zh-Hant' };
const canonical = (lang: string) => BY_SCRIPT[lang] ?? lang;
/** Google tells the scripts apart by region; the Translator API calls Simplified plain zh. */
const GOOGLE_CODES: Record<string, string> = { 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW' };
const BROWSER_CODES: Record<string, string> = { 'zh-Hans': 'zh' };
const googleCode = (lang: string) => GOOGLE_CODES[canonical(lang)] ?? lang;
const browserCode = (lang: string) => BROWSER_CODES[canonical(lang)] ?? canonical(lang);

export function sameLanguage(a: string, b: string): boolean {
  return canonical(a).toLowerCase() === canonical(b).toLowerCase();
}

/** The language a text written in `source` is translated into for a reader of `ui`, or null: they can read it as is. */
export function translationTarget(source: string, ui: string): string | null {
  return sameLanguage(source, ui) ? null : ui;
}

/** Whether a text has words in `lang` at all: numbers, punctuation and Latin names in a Chinese text stay as they are. */
export function hasWords(text: string, lang: string): boolean {
  return (/^zh\b/i.test(lang) ? /\p{Script=Han}/u : /\p{L}/u).test(text);
}

const isChinese = (lang: string) => /^zh\b/i.test(lang);

/** A text without words, in `to`: Chinese punctuation becomes its Latin counterpart for a reader of another language. */
function punctuation(text: string, to: string): string {
  return isChinese(to) ? text : text.replace(CJK_PUNCTUATION_RE, (c) => CJK_PUNCTUATION[c]!).replace(/ {2,}/g, ' ');
}

// ---- what is going on (for the switch's status line)
export interface TranslationActivity {
  /** A batch is being translated. */
  busy: boolean;
  /** Part of a batch could not be translated (until the reader asks again). */
  failed: boolean;
  /** Who translated the latest batch. */
  by: TranslatorName | null;
}
export const IDLE_ACTIVITY: TranslationActivity = { busy: false, failed: false, by: null };
let activity = IDLE_ACTIVITY;
let running = 0;
const listeners = new Set<() => void>();
function setActivity(next: Partial<TranslationActivity>) {
  activity = { ...activity, ...next };
  for (const l of listeners) l();
}
export const translationActivity = () => activity;
export function onTranslationActivity(listener: () => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}
/** The reader asks again: forget the failure (the hooks fetch what is still missing). */
export function clearTranslationFailure() {
  if (activity.failed) setActivity({ failed: false });
}

const withTimeout = <T>(p: Promise<T>, ms: number, fallback: T) => Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);

// ---- translator 1: the browser's
interface BrowserTranslator {
  translate(text: string): Promise<string>;
}
interface TranslatorApi {
  availability(o: { sourceLanguage: string; targetLanguage: string }): Promise<'unavailable' | 'downloadable' | 'downloading' | 'available'>;
  create(o: { sourceLanguage: string; targetLanguage: string }): Promise<BrowserTranslator>;
}
const pairKey = (from: string, to: string) => `${from}\u0000${to}`;
const ready = new Map<string, BrowserTranslator>();
/** Translators being created (a language pack downloading, mostly), per pair; null when that did not work out. */
const coming = new Map<string, Promise<BrowserTranslator | null>>();
const userActivation = () => (globalThis as { navigator?: { userActivation?: { isActive: boolean } } }).navigator?.userActivation?.isActive === true;

/** The browser's translator for the pair when it is ready now, else null (a pack it may download starts coming). */
async function browserTranslator(from: string, to: string): Promise<BrowserTranslator | null> {
  const api = (globalThis as { Translator?: TranslatorApi }).Translator;
  if (!api) return null;
  const key = pairKey(from, to);
  const have = ready.get(key);
  if (have) return have;
  if (coming.has(key)) return null;
  const options = { sourceLanguage: browserCode(from), targetLanguage: browserCode(to) };
  const state = await withTimeout(api.availability(options).catch(() => 'unavailable' as const), BROWSER_TIMEOUT_MS, 'unavailable' as const);
  if (state === 'unavailable' || (state !== 'available' && !userActivation())) return null;
  const made = api
    .create(options)
    .then(
      (t) => (ready.set(key, t), t),
      () => null,
    )
    .finally(() => coming.delete(key));
  coming.set(key, made);
  return state === 'available' ? withTimeout(made, BROWSER_TIMEOUT_MS, null) : null;
}

// ---- translator 2: Google
async function google(texts: string[], from: string, to: string): Promise<string[]> {
  const body = new URLSearchParams();
  for (const t of texts) body.append('q', t);
  const url = `${GOOGLE_ENDPOINT}&sl=${encodeURIComponent(googleCode(from))}&tl=${encodeURIComponent(googleCode(to))}`;
  const res = await fetch(url, { method: 'POST', body, signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`translate: HTTP ${res.status}`);
  const json: unknown = await res.json();
  // ["…", "…"] in the order sent (one text may come back as a bare string)
  const list = Array.isArray(json) ? json : [json];
  if (list.length !== texts.length || !list.every((x) => typeof x === 'string')) throw new Error('translate: unexpected answer');
  return list as string[];
}

async function translateChunk(texts: string[], from: string, to: string): Promise<{ texts: string[]; by: TranslatorName }> {
  const own = await browserTranslator(from, to);
  if (own) {
    try {
      return { texts: await Promise.all(texts.map((t) => own.translate(t))), by: 'browser' };
    } catch {
      ready.delete(pairKey(from, to));
    }
  }
  try {
    return { texts: await google(texts, from, to), by: 'google' };
  } catch (e) {
    // Google out of reach: the browser's translator, if its language pack is on its way
    const late = await coming.get(pairKey(from, to));
    if (!late) throw e;
    return { texts: await Promise.all(texts.map((t) => late.translate(t))), by: 'browser' };
  }
}

// ---- batching and the cache
const cache = new Map<string, string>();
const keyOf = (from: string, to: string, text: string) => `${from}\u0000${to}\u0000${text}`;

interface Waiting {
  resolve: (translated: string) => void;
  reject: (e: unknown) => void;
}
/** Texts asked for since the last batch went out, per language pair, with the promise waiting for each. */
const queues = new Map<string, Map<string, Waiting>>();
const inflight = new Map<string, Promise<string>>();

async function flush(from: string, to: string) {
  const pair = pairKey(from, to);
  const queue = queues.get(pair);
  queues.delete(pair);
  if (!queue) return;
  const chunks: [string, Waiting][][] = [];
  let chars = 0;
  for (const item of queue) {
    const last = chunks[chunks.length - 1];
    if (!last || last.length >= MAX_ITEMS || chars + item[0].length > MAX_CHARS) {
      chunks.push([item]);
      chars = item[0].length;
    } else {
      last.push(item);
      chars += item[0].length;
    }
  }
  running++;
  setActivity({ busy: true });
  let failed = false;
  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const { texts, by } = await translateChunk(
          chunk.map(([text]) => text),
          from,
          to,
        );
        chunk.forEach(([text, waiting], i) => {
          cache.set(keyOf(from, to, text), texts[i]!);
          inflight.delete(keyOf(from, to, text));
          waiting.resolve(texts[i]!);
        });
        setActivity({ by });
      } catch (e) {
        failed = true;
        for (const [text, waiting] of chunk) {
          inflight.delete(keyOf(from, to, text));
          waiting.reject(e);
        }
      }
    }),
  );
  if (--running === 0) setActivity({ busy: false, failed: activity.failed || failed });
  else if (failed) setActivity({ failed: true });
}

function translateOne(text: string, from: string, to: string): Promise<string> {
  const key = keyOf(from, to, text);
  const hit = cache.get(key);
  if (hit !== undefined) return Promise.resolve(hit);
  const pending = inflight.get(key);
  if (pending) return pending;
  const pair = pairKey(from, to);
  let queue = queues.get(pair);
  if (!queue) {
    queues.set(pair, (queue = new Map()));
    queueMicrotask(() => void flush(from, to));
  }
  const waiting = queue;
  const promise = new Promise<string>((resolve, reject) => waiting.set(text, { resolve, reject }));
  inflight.set(key, promise);
  return promise;
}

/** A text's surrounding whitespace stays; only the words between are translated. */
function splitSpace(text: string): [lead: string, core: string, trail: string] {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(text)!;
  return [m[1]!, m[2]!, m[3]!];
}

/** `texts`, written in `from`, in `to` — in order; a text without words in `from` comes back as it is. */
export function translateTexts(texts: readonly string[], from: string, to: string): Promise<string[]> {
  return Promise.all(
    texts.map(async (text) => {
      const [lead, core, trail] = splitSpace(text);
      return hasWords(core, from) ? lead + (await translateOne(core, from, to)) + trail : punctuation(text, to);
    }),
  );
}

/** The translations of `texts` when every one is already here (a render needs no round trip), else undefined. */
export function cachedTranslations(texts: readonly string[], from: string, to: string): string[] | undefined {
  const out: string[] = [];
  for (const text of texts) {
    const [lead, core, trail] = splitSpace(text);
    if (!hasWords(core, from)) {
      out.push(punctuation(text, to));
      continue;
    }
    const hit = cache.get(keyOf(from, to, core));
    if (hit === undefined) return undefined;
    out.push(lead + hit + trail);
  }
  return out;
}

/** Whether a text node of rendered markdown is prose to translate (code is not, except prose-like code blocks and comments). */
function isProse(node: Text, from: string): boolean {
  const el = node.parentElement;
  const text = node.data;
  if (!el || el.closest(NEVER)) return false;
  const pre = el.closest('pre');
  if (pre) {
    const lang = pre.closest('.kit-code')?.getAttribute('data-lang') ?? '';
    return hasWords(text, from) && (PLAIN_CODE.has(lang) || COMMENT_LINE.test(text));
  }
  if (el.closest('code')) return false;
  return hasWords(text, from) || (isChinese(from) && CJK_PUNCTUATION_RE.test(text));
}

/** The text of rendered markdown in `to`; its elements, attributes, code and anchors stay as they are. */
export async function translateHtml(html: string, from: string, to: string): Promise<string> {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (isProse(node as Text, from) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
  });
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
  const translated = await translateTexts(
    nodes.map((n) => n.data),
    from,
    to,
  );
  nodes.forEach((n, i) => (n.data = translated[i]!));
  // Chinese puts no space between words: a translation into a language that does needs one beside inline markup
  // (a link, code, emphasis), or it reads "throughLeviLamina"
  if (!isChinese(to))
    for (const n of nodes) {
      if (n.parentElement?.closest('pre')) continue;
      if (n.previousSibling?.nodeType === 1 && /^[\p{L}\p{N}]/u.test(n.data)) n.data = ' ' + n.data;
      if (n.nextSibling?.nodeType === 1 && /[\p{L}\p{N}]$/u.test(n.data)) n.data += ' ';
    }
  return doc.body.innerHTML;
}
