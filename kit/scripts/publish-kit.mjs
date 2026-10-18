#!/usr/bin/env node
// Publishes levimc-kit with levimc.org: every other LeviMC site fetches the kit from there when it builds
// (scripts/fetch-kit.mjs), so a change made here reaches every site with its next build.
//
//   node kit/scripts/publish-kit.mjs <outDir> [--stamp]
//
// Writes <outDir>/v<major>/kit.json (the kit's files, minus demo/, screens/, node_modules/ …, as one JSON
// document) and <outDir>/v<major>/manifest.json ({ version, build, sha256, files }) — levimc.org serves them at
// https://levimc.org/kit/v2/. `build` is a content hash, stamped into components/version.ts (KIT_BUILD) of the
// published copy; --stamp also stamps this working tree, so levimc.org's own pages carry the same build.
// Sites follow one major version: a breaking kit (3.x) is published next to v2/ and adopted site by site.
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outDir = args.find((a) => !a.startsWith('--'));
if (!outDir) {
  console.error('usage: node kit/scripts/publish-kit.mjs <outDir> [--stamp]');
  process.exit(2);
}
// the same files vendor.mjs copies
const SKIP = new Set(['demo', 'screens', 'node_modules', '.git', 'dist', '.kit']);
const VERSION_FILE = 'components/version.ts';
const BUILD_RE = /export const KIT_BUILD: string = '[^']*';/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir).sort()) {
    if (entry.startsWith('.') || (dir === kitRoot && SKIP.has(entry))) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(relative(kitRoot, p).split(sep).join('/'));
  }
  return out;
}

const files = {};
for (const f of walk(kitRoot)) files[f] = readFileSync(join(kitRoot, f), 'utf8');
if (!BUILD_RE.test(files[VERSION_FILE] ?? '')) throw new Error(`${VERSION_FILE}: KIT_BUILD declaration not found`);
const stamp = (src, build) => src.replace(BUILD_RE, `export const KIT_BUILD: string = '${build}';`);

// the build hash covers every file, with KIT_BUILD itself neutral
const h = createHash('sha256');
for (const [f, src] of Object.entries(files)) h.update(f).update('\0').update(f === VERSION_FILE ? stamp(src, 'dev') : src).update('\0');
const build = h.digest('hex').slice(0, 12);
files[VERSION_FILE] = stamp(files[VERSION_FILE], build);

const version = files.VERSION.trim();
const major = version.split('.')[0];
const body = JSON.stringify({ version, build, files });
const dest = resolve(outDir, `v${major}`);
mkdirSync(dest, { recursive: true });
writeFileSync(join(dest, 'kit.json'), body);
const manifest = { version, build, sha256: createHash('sha256').update(body).digest('hex'), files: Object.keys(files).length, bytes: Buffer.byteLength(body) };
writeFileSync(join(dest, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
if (args.includes('--stamp')) writeFileSync(join(kitRoot, VERSION_FILE), files[VERSION_FILE]);
console.log(`levimc-kit ${version}+${build}: ${manifest.files} files, ${(manifest.bytes / 1024).toFixed(0)} KiB → ${relative(process.cwd(), dest)}`);
