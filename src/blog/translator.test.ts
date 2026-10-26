// node --test "src/**/*.test.ts"  (Node ≥ 22.18: native TypeScript) — the translator's batching, cache and
// language rules, with Google's endpoint stubbed and, where a test wants it, a fake browser translator.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cachedTranslations, clearTranslationFailure, hasWords, sameLanguage, translateTexts, translationActivity, translationTarget } from './translator.ts';

interface Call {
  url: string;
  q: string[];
}
let calls: Call[] = [];
let answer: (q: string[]) => string[] | Error = (q) => q.map((s) => `[${s}]`);
const realFetch = globalThis.fetch;
const g = globalThis as { Translator?: unknown };

beforeEach(() => {
  calls = [];
  answer = (q) => q.map((s) => `[${s}]`);
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const q = (init?.body as URLSearchParams).getAll('q');
    calls.push({ url: String(url), q });
    const a = answer(q);
    return a instanceof Error ? new Response('', { status: 429 }) : Response.json(a);
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
  delete g.Translator;
});

test('languages: Chinese is one language per script; readers of the text\u2019s language get no translation', () => {
  assert.equal(sameLanguage('zh-CN', 'zh-Hans'), true);
  assert.equal(sameLanguage('zh-CN', 'zh-Hant'), false);
  assert.equal(translationTarget('zh-CN', 'zh-CN'), null);
  assert.equal(translationTarget('zh-CN', 'en'), 'en');
  assert.equal(translationTarget('zh-CN', 'zh-Hant'), 'zh-Hant');
  assert.equal(hasWords('\u4f60\u597d', 'zh-CN'), true);
  assert.equal(hasWords('LeviLamina 1.0.0', 'zh-CN'), false);
  assert.equal(hasWords('42 / 7', 'en'), false);
});

test('everything asked for in one tick goes out as one request, in order, deduplicated; whitespace and non-words stay', async () => {
  const [a, b] = await Promise.all([translateTexts(['  \u6807\u9898 ', 'BDS', '\u6b63\u6587'], 'zh-CN', 'en'), translateTexts(['\u6807\u9898'], 'zh-CN', 'en')]);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0]!.q, ['\u6807\u9898', '\u6b63\u6587']);
  assert.match(calls[0]!.url, /sl=zh-CN&tl=en$/);
  assert.deepEqual(a, ['  [\u6807\u9898] ', 'BDS', '[\u6b63\u6587]']);
  assert.deepEqual(b, ['[\u6807\u9898]']);
  assert.equal(translationActivity().by, 'google');
  assert.equal(translationActivity().busy, false);
});

test('Chinese punctuation between inline markup becomes its Latin counterpart, with no round trip', async () => {
  assert.deepEqual(await translateTexts(['\u3001', '\uff0c', ' \uff08', '\uff09\u3002'], 'zh-CN', 'en'), [', ', ', ', ' (', ') . ']);
  assert.deepEqual(cachedTranslations(['\u3001'], 'zh-CN', 'en'), [', ']);
  assert.deepEqual(await translateTexts(['\u3001'], 'zh-CN', 'zh-Hant'), ['\u3001']);
  assert.equal(calls.length, 0);
});

test('translations are kept: the same text is never fetched twice, and a render can read them synchronously', async () => {
  assert.equal(cachedTranslations(['\u7f13\u5b58'], 'zh-CN', 'en'), undefined);
  await translateTexts(['\u7f13\u5b58'], 'zh-CN', 'en');
  await translateTexts(['\u7f13\u5b58', ' \u7f13\u5b58'], 'zh-CN', 'en');
  assert.equal(calls.length, 1);
  assert.deepEqual(cachedTranslations(['\u7f13\u5b58', 'v1', ' \u7f13\u5b58'], 'zh-CN', 'en'), ['[\u7f13\u5b58]', 'v1', ' [\u7f13\u5b58]']);
});

test('Traditional Chinese readers get zh-TW from Google; big batches are split', async () => {
  const texts = Array.from({ length: 65 }, (_, i) => `\u7b2c${i}\u6bb5`);
  await translateTexts(texts, 'zh-CN', 'zh-Hant');
  assert.equal(calls.length, 2);
  assert.match(calls[0]!.url, /tl=zh-TW$/);
  assert.deepEqual(
    calls.map((c) => c.q.length),
    [64, 1],
  );
});

test('a failed request rejects what waited for it and is reported until the reader asks again', async () => {
  answer = (q) => (q.includes('\u5931\u8d25') ? new Error('down') : q.map((s) => `[${s}]`));
  const texts = [...Array.from({ length: 64 }, (_, i) => `\u53e6${i}`), '\u5931\u8d25'];
  // two chunks: the one that fails does not hide behind the one that works
  const results = await Promise.allSettled(texts.map((x) => translateTexts([x], 'zh-CN', 'en')));
  assert.equal(results[0]!.status, 'fulfilled');
  assert.equal(results[64]!.status, 'rejected');
  assert.equal(translationActivity().failed, true);
  assert.equal(translationActivity().busy, false);
  clearTranslationFailure();
  assert.equal(translationActivity().failed, false);
  answer = (q) => q.map((s) => `[${s}]`);
  assert.deepEqual(await translateTexts(['\u5931\u8d25'], 'zh-CN', 'en'), ['[\u5931\u8d25]']);
  assert.equal(translationActivity().failed, false);
});

// the browser's translator is remembered per language pair, so each case below uses a pair of its own
test('the browser\u2019s own translator is used when it has the language pack; Google otherwise', async () => {
  const asked: unknown[] = [];
  g.Translator = {
    availability: async (o: unknown) => (asked.push(o), 'available'),
    create: async () => ({ translate: async (s: string) => `<${s}>` }),
  };
  assert.deepEqual(await translateTexts(['\u672c\u5730'], 'zh-CN', 'en'), ['<\u672c\u5730>']);
  assert.deepEqual(asked, [{ sourceLanguage: 'zh', targetLanguage: 'en' }]);
  assert.equal(calls.length, 0);
  assert.equal(translationActivity().by, 'browser');
  // a pack still to download (and no click to download it on) is not waited for
  g.Translator = { availability: async () => 'downloadable', create: async () => ({ translate: async (s: string) => `<${s}>` }) };
  assert.deepEqual(await translateTexts(['\u4e0b\u8f7d'], 'zh-CN', 'fr'), ['[\u4e0b\u8f7d]']);
  assert.equal(calls.length, 1);
  assert.equal(translationActivity().by, 'google');
});

test('a browser translator that never answers whether it is ready does not hold the batch up', async () => {
  g.Translator = { availability: () => new Promise(() => {}), create: async () => ({ translate: async (s: string) => `<${s}>` }) };
  const t0 = Date.now();
  assert.deepEqual(await translateTexts(['\u6302\u8d77'], 'zh-CN', 'de'), ['[\u6302\u8d77]']);
  assert.ok(Date.now() - t0 < 5000);
  assert.equal(translationActivity().by, 'google');
});
