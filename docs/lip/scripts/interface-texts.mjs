#!/usr/bin/env node
// Writes scripts/interface-texts.json: the texts of lip's interface, Simplified → Traditional Chinese, which
// scripts/zh-hant.mjs gives a text of the interface that a page marks (**新建服务器…** → **建立伺服器…**).
//
//   node scripts/interface-texts.mjs [<lip checkout>]     (npm run interface-texts)
//
// The texts are read from the L.T(en, zhHans, zhHant) calls of src/Lip.Cli/Tui/ in a checkout of LiteLDev/lip: the
// one given, else $LIP_DIR, else a `lip` checkout next to this repository's (as lip's screenshot generator writes
// into a liteldev.github.io checkout next to lip's). The docs are built here, without lip's sources, so the texts
// are committed: run this again when the interface changes its texts, as the screenshots are made again.
import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const docs = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const TEXTS_FILE = join(docs, 'scripts', 'interface-texts.json');

/** Every file below a directory with the extension, as absolute paths, sorted. */
function files(directory, extension) {
  const out = [];
  if (!existsSync(directory)) return out;
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) out.push(...files(path, extension));
    else if (path.endsWith(extension)) out.push(path);
  }
  return out.sort();
}

/**
 * The texts of the interface: Simplified → Traditional, for every L.T(en, zhHans, zhHant) whose arguments are
 * string literals without placeholders, and whose Traditional text is not the Simplified one.
 */
export function interfaceTexts(tui) {
  const literal = String.raw`\$?"(?:[^"\\\n]|\\.)*"`;
  const argument = String.raw`(${literal}(?:\s*\+\s*${literal})*)`;
  const call = new RegExp(String.raw`\bL\.T\(\s*${argument}\s*,\s*${argument}\s*,\s*${argument}\s*\)`, 'g');
  const value = (code) =>
    [...code.matchAll(new RegExp(literal, 'g'))]
      .map((m) => m[0].replace(/^\$?"/, '').replace(/"$/, '').replace(/\\(.)/g, (_, c) => (c === 'n' ? '\n' : c)))
      .join('');
  const texts = new Map();
  for (const file of files(tui, '.cs')) {
    for (const m of readFileSync(file, 'utf8').matchAll(call)) {
      const interpolated = [m[2], m[3]].some((code) => /\$"/.test(code) && /\{/.test(code));
      const [hans, hant] = [value(m[2]), value(m[3])];
      if (!interpolated && hans !== hant) texts.set(hans, hant);
    }
  }
  return texts;
}

function main() {
  const lip = resolve(process.argv[2] ?? process.env.LIP_DIR ?? join(docs, '..', '..', '..', 'lip'));
  const tui = join(lip, 'src', 'Lip.Cli', 'Tui');
  if (!existsSync(tui)) {
    console.error(`interface-texts: ${tui} does not exist; pass a checkout of LiteLDev/lip (or set LIP_DIR)`);
    process.exit(1);
  }
  const texts = interfaceTexts(tui);
  if (texts.size === 0) {
    console.error(`interface-texts: no text of the interface was found in ${tui}`);
    process.exit(1);
  }
  // sorted, so that a change of the interface is a small diff
  const sorted = Object.fromEntries([...texts].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  writeFileSync(TEXTS_FILE, JSON.stringify(sorted, null, 2) + '\n');
  console.log(`interface-texts: ${texts.size} texts from ${tui} in ${relative(docs, TEXTS_FILE)}`);
}

// Only when the script is run, not when it is imported (scripts/zh-hant.mjs); the paths are compared as the files
// they name, since one of them may lead through a link.
const same = (a, b) => existsSync(a) && existsSync(b) && realpathSync(a) === realpathSync(b);
if (process.argv[1] && same(process.argv[1], fileURLToPath(import.meta.url))) main();
