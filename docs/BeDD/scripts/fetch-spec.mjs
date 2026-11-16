#!/usr/bin/env node
// Publishes the AsyncAPI document of Be.D.D.'s WebSocket API with the site, at /BeDD/bedd.asyncapi.yaml: downloads
// spec/bedd.asyncapi.yaml from LiteLDev/BeDD (the one source, next to the code it describes) to public/, which the
// build copies to the base. The copy is git-ignored; `npm run build` and `npm run dev` run this first. Any failure
// fails the build: the WebSocket reference links the file.
//
//   node scripts/fetch-spec.mjs [--source <url or file>]     (default: $BEDD_SPEC_SOURCE, else BeDD's main branch)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_SOURCE = 'https://raw.githubusercontent.com/LiteLDev/BeDD/main/spec/bedd.asyncapi.yaml';
const args = process.argv.slice(2);
const i = args.indexOf('--source');
const source = (i >= 0 ? args[i + 1] : undefined) || process.env.BEDD_SPEC_SOURCE || DEFAULT_SOURCE;
const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const to = join(site, 'public', 'bedd.asyncapi.yaml');

try {
  let body;
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source, { headers: { 'cache-control': 'no-cache' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    body = await res.text();
  } else {
    body = readFileSync(resolve(source), 'utf8');
  }
  if (!/^asyncapi:/m.test(body)) throw new Error('not an AsyncAPI document');
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, body);
  console.log(`spec: ${source} → ${to}`);
} catch (e) {
  console.error(`fetch-spec: ${source}: ${e.message}${e.cause ? ` (${e.cause.message ?? e.cause})` : ''}`);
  process.exit(1);
}
