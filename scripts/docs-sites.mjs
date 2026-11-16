#!/usr/bin/env node
// The docs builds of this repository (2026-11-16: every LeviMC docs site is built here, see docs/README.md): the
// tutorials (tutorials/) and one docs root per project (docs/<Project>/, each with its own package.json). Each is a
// levimc-kit docs site with `i18n.localeFirst`, so its dist/ mirrors the host root (dist/<Project>/…,
// dist/zh-Hans/<Project>/…) and merges into levimc.org's dist/ as it is.
//
//   node scripts/docs-sites.mjs list              the docs roots, one per line (tutorials first)
//   node scripts/docs-sites.mjs build [root …]    per root: npm ci, npm run typecheck, npm run build (npm runs the
//                                                 root's prebuild / postbuild scripts around it), npm run linkcheck
//   node scripts/docs-sites.mjs merge <dist>      copy each root's dist/ into <dist>, without the root's 404.html and
//                                                 .nojekyll (levimc.org's own win); any other file both have fails
//   node scripts/docs-sites.mjs other-sites       the --other-sites of levimc.org's linkcheck: the projects whose docs
//                                                 are not built here yet, under every language (see linkcheck below)
//   node scripts/docs-sites.mjs linkcheck <dist> [linkcheck options]
//                                                 levimc.org's link check (npm run linkcheck) with those other sites
//
// No docs root under docs/ is fine: the tutorials are the only one then.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DOCS_PROJECTS, NETWORK_LANGUAGE_SEGMENTS } from '../kit/components/projects.ts';

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The docs roots (repository-relative, '/'-separated): tutorials, then docs/<name>/ for each docs/<name>/package.json. */
export function docsRoots(repo = REPO) {
  const roots = existsSync(join(repo, 'tutorials', 'package.json')) ? ['tutorials'] : [];
  const docs = join(repo, 'docs');
  if (existsSync(docs)) {
    for (const name of readdirSync(docs).sort()) {
      if (existsSync(join(docs, name, 'package.json'))) roots.push(`docs/${name}`);
    }
  }
  return roots;
}

/** The project docs this repository does not build (yet): their own repositories still publish them. */
export function externalProjects(repo = REPO) {
  return DOCS_PROJECTS.map((p) => p.id).filter((id) => !existsSync(join(repo, 'docs', id, 'package.json')));
}

/** levimc.org paths another build serves: each external project under its base and under every language. */
export function otherSites(repo = REPO) {
  return externalProjects(repo).flatMap((id) => [`/${id}/`, ...NETWORK_LANGUAGE_SEGMENTS.map((l) => `/${l}/${id}/`)]);
}

/** Files of a folder, relative and '/'-separated. */
function files(dir, base = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) files(p, base, out);
    else out.push(relative(base, p).split(sep).join('/'));
  }
  return out;
}

/** The files a docs build leaves out of the merge: its own 404 page and .nojekyll (the site's are at the root). */
const SKIP = new Set(['404.html', '.nojekyll']);

/**
 * Copy `from` (a docs root's dist/) into `into` (levimc.org's dist/). Throws, before copying anything, when a file
 * would overwrite one that is there already.
 */
export function mergeDist(from, into) {
  const list = files(from).filter((f) => !SKIP.has(f));
  const clashes = list.filter((f) => existsSync(join(into, f)));
  if (clashes.length) {
    throw new Error(`${from}: ${clashes.length} file(s) exist in ${into} already: ${clashes.slice(0, 10).join(', ')}${clashes.length > 10 ? ', …' : ''}`);
  }
  for (const f of list) {
    mkdirSync(dirname(join(into, f)), { recursive: true });
    cpSync(join(from, f), join(into, f));
  }
  return list.length;
}

function run(cwd, cmd, args) {
  console.log(`\n[docs-sites] ${relative(REPO, cwd) || '.'}: ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed in ${cwd} (exit ${r.status})`);
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  switch (command) {
    case 'list':
      for (const r of docsRoots()) console.log(r);
      return;
    case 'build': {
      const roots = rest.length ? rest : docsRoots();
      for (const root of roots) {
        const cwd = join(REPO, root);
        const scripts = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')).scripts ?? {};
        run(cwd, 'npm', ['ci']);
        if (scripts.typecheck) run(cwd, 'npm', ['run', 'typecheck']);
        run(cwd, 'npm', ['run', 'build']);
        if (scripts.linkcheck) run(cwd, 'npm', ['run', 'linkcheck']);
      }
      return;
    }
    case 'merge': {
      const into = resolve(rest[0] ?? 'dist');
      if (!existsSync(join(into, 'index.html'))) throw new Error(`${into} holds no site: run the site build first`);
      for (const root of docsRoots()) {
        const from = join(REPO, root, 'dist');
        if (!existsSync(from)) throw new Error(`${relative(REPO, from)} is missing: build ${root} first`);
        console.log(`[docs-sites] ${root}: merged ${mergeDist(from, into)} files into ${relative(process.cwd(), into) || into}`);
      }
      return;
    }
    case 'other-sites':
      console.log(otherSites().join(','));
      return;
    case 'linkcheck': {
      const sites = otherSites();
      const args = [join(REPO, 'kit/scripts/linkcheck.mjs'), ...rest, ...(sites.length ? ['--other-sites', sites.join(',')] : [])];
      const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
      process.exitCode = r.status ?? 1;
      return;
    }
    default:
      console.error('Usage: node scripts/docs-sites.mjs list | build [root …] | merge <dist> | other-sites | linkcheck <dist> [options]');
      process.exitCode = 2;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    main();
  } catch (e) {
    console.error(`[docs-sites] ${e.message}`);
    process.exitCode = 1;
  }
}
