// The API reference documents every `bot.bedrock.*` extra that bedboo types: each member of `interface
// BedrockExtras` in packages/bedboo/types/bedrock.d.ts appears as `bot.bedrock.<name>` in the English and the Chinese
// API page. (Was packages/bedboo/test/unit/docs.test.js in LiteLDev/bedboo, before the docs moved here.)
//
// The types are read from bedboo's default branch on GitHub; BEDBOO_TYPES=<path to bedrock.d.ts> reads a local
// checkout instead (offline, or to check a branch). Behind an HTTPS_PROXY, NODE_USE_ENV_PROXY=1 makes fetch use it.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TYPES_URL = 'https://raw.githubusercontent.com/LiteLDev/bedboo/main/packages/bedboo/types/bedrock.d.ts';
const API_DOCS = ['content/reference/api.md', 'content/zh/reference/api.md'];

async function bedrockTypes() {
  const local = process.env.BEDBOO_TYPES;
  if (local) return readFileSync(local, 'utf8');
  let res;
  try {
    res = await fetch(TYPES_URL, { signal: AbortSignal.timeout(30_000) });
  } catch (e) {
    throw new Error(`cannot fetch ${TYPES_URL} (offline? behind a proxy, NODE_USE_ENV_PROXY=1; or BEDBOO_TYPES=<a local bedrock.d.ts>): ${e.cause?.message ?? e.message}`);
  }
  if (!res.ok) throw new Error(`${TYPES_URL}: HTTP ${res.status}`);
  return res.text();
}

/** members of `interface BedrockExtras` (one `name: type` / `name?: type` / `name(…)` per line) */
function bedrockExtras(text) {
  const body = /interface BedrockExtras\s*\{([\s\S]*?)\n\}/.exec(text)?.[1];
  assert.ok(body !== undefined, 'interface BedrockExtras in types/bedrock.d.ts');
  return [...body.matchAll(/^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\??\s*[:(]/gm)].map((m) => m[1]);
}

describe('API reference', () => {
  it('documents every bot.bedrock extra of types/bedrock.d.ts', async () => {
    const extras = bedrockExtras(await bedrockTypes());
    assert.ok(extras.length > 0, 'BedrockExtras has members');
    const missing = [];
    for (const doc of API_DOCS) {
      const api = readFileSync(fileURLToPath(new URL(`../${doc}`, import.meta.url)), 'utf8');
      for (const name of extras) if (!api.includes(`bot.bedrock.${name}`)) missing.push(`${doc} lacks bot.bedrock.${name}`);
    }
    assert.deepEqual(missing, []);
  });
});
