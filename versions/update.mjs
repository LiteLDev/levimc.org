#!/usr/bin/env node
// Minecraft's release versions behind /api/v4/mc/versions/ (versions/versions.json, published as
// /api/v4/mc/versions/index.json by deploy.yml). Mojang's download API names only the latest release of each download,
// so the history is this file: every run adds the version Mojang names now, if it is new.
//
//   node versions/update.mjs            # fetch, merge, write versions/versions.json when it changed
//   node versions/update.mjs --dry-run  # fetch and merge, print what would change
//
// Keys are lip's `<side>/<platform>` (platform: a .NET RID); each value lists the release versions, newest first,
// exactly as Mojang spells them (`1.16.1.02` keeps its zero: it is part of the download's file name). Previews and
// the Java server are not listed. Prints the added versions, one `<key> <version>` per line.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FILE = join(dirname(fileURLToPath(import.meta.url)), 'versions.json');

export const SOURCE = 'https://net-secondary.web.minecraft-services.net/api/v1.0/download/links';

/** Mojang's `downloadType` → our key. A new download is one line here. */
export const DOWNLOADS = {
  serverBedrockWindows: 'server/win-x64',
  serverBedrockLinux: 'server/linux-x64',
};

const VERSION = /^\d+(?:\.\d+){3}$/;

/** Newest first, by the numbers (`1.16.1.02` and `1.16.1.2` are the same version). */
export function compareDesc(a, b) {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (y[i] ?? 0) - (x[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

/** The latest release per key, from the download API's answer: `{ "server/win-x64": "1.26.63.1", … }`. */
export function latestOf(answer) {
  const out = {};
  for (const { downloadType, downloadUrl } of answer?.result?.links ?? []) {
    const key = DOWNLOADS[downloadType];
    if (!key) continue;
    const version = /bedrock-server-([\d.]+)\.zip$/.exec(downloadUrl ?? '')?.[1];
    if (!version || !VERSION.test(version)) throw new Error(`${downloadType}: no version in ${downloadUrl}`);
    out[key] = version;
  }
  for (const key of Object.values(DOWNLOADS)) {
    if (!out[key]) throw new Error(`the download API names no ${key}`);
  }
  return out;
}

/** `versions` with each latest version added (unless the same version is there already); returns what was added. */
export function merge(versions, latest) {
  const next = {};
  const added = [];
  for (const key of new Set([...Object.keys(versions), ...Object.keys(latest)])) {
    const list = [...(versions[key] ?? [])];
    const v = latest[key];
    if (v && !list.some((have) => compareDesc(have, v) === 0)) {
      list.push(v);
      added.push([key, v]);
    }
    next[key] = list.sort(compareDesc);
  }
  return { versions: next, added };
}

export const format = (versions) => JSON.stringify(versions, null, 2) + '\n';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const res = await fetch(SOURCE, {
    // The API answers browsers only.
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`${SOURCE}: HTTP ${res.status}`);
  const latest = latestOf(await res.json());
  const { versions, added } = merge(JSON.parse(readFileSync(FILE, 'utf8')), latest);
  for (const [key, v] of added) console.log(`${key} ${v}`);
  if (!added.length) console.error(`no new version (latest: ${JSON.stringify(latest)})`);
  else if (!dryRun) writeFileSync(FILE, format(versions));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
