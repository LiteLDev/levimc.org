# docs/: every project's documentation

Since 2026-11-16 the documentation of every LeviMC project is built here, by levimc.org's deploy, instead of in
each project's repository (see [MIGRATION.md](../MIGRATION.md)). Each project is one **docs root**:
`docs/<Project>/`, a levimc-kit docs site with its own `package.json` — the same shape as `tutorials/`. The folder
name is the project's id in the kit (`PROJECTS` in `kit/components/projects.ts`: `LeviLamina`, `LegacyScriptEngine`,
`lip`, `LeviLauncher`, `BeDD`, `bedboo`) and its base: `docs/lip/` is published at `levimc.org/lip/`.

The language is the first segment of every levimc.org URL: English at `/<Project>/…`, Simplified Chinese at
`/zh-Hans/<Project>/…`, Traditional Chinese at `/zh-Hant/<Project>/…` (LeviLauncher also `/es/`, `/ru/`, `/de/`,
`/ja/`, `/ko/`, `/fr/`). A docs root says so with `i18n.localeFirst: true`; its `dist/` then mirrors the host root
(`dist/<Project>/…`, `dist/zh-Hans/<Project>/…`, `dist/404.html`) and is merged into levimc.org's `dist/` as it is.
The URLs the project published before (`/<Project>/zh-Hans/…`, `/<Project>/zh/…`, `/lip/zh/x.html`,
`/LeviLauncher/ja-JP/…`) keep working: list them in each locale's `formerPrefixes` and the build writes a redirect
page at each old URL (query and #hash kept).

## How a docs root is built

`scripts/docs-sites.mjs` (used by `.github/workflows/deploy.yml` and `ci.yml`) finds every `docs/*/package.json`
— no list to edit — and, for the tutorials, the FAQ (`faq/`) and each of them:

1. `npm ci` (its `postinstall` vendors this checkout's `kit/` into the root's `kit/`),
2. `npm run typecheck`,
3. `npm run build` — npm runs the root's `prebuild` and `postbuild` scripts around it when they exist (generated
   content, screenshots …),
4. `npm run linkcheck`;

then `merge` copies each root's `dist/` into levimc.org's `dist/`, without its `404.html` and `.nojekyll` (the site's
root `404.html` serves every missing path and forwards old URLs, `legacy/build.mjs`); a file two builds publish
fails the deploy. Locally:

```sh
npm ci && npm run build                     # levimc.org (dist/)
node scripts/docs-sites.mjs build           # every docs root (or: … build docs/lip)
node scripts/docs-sites.mjs merge dist
npm run linkcheck && npm run preview        # http://127.0.0.1:4173/
```

While a project's docs are not here yet, its own repository publishes them: levimc.org's link check treats that
project's paths (under every language) as another site's (`node scripts/docs-sites.mjs other-sites`), and the 404
page forwards its language-first URLs (`/zh-Hans/lip/x.html`) to where the repository publishes them
(`/lip/zh-Hans/x.html`; `LANGUAGE_SEGMENTS` in `legacy/redirects.mjs` for LeviLauncher's `ja-JP` …). Adding
`docs/<Project>/package.json` turns both off for it: nothing else to edit. Once its docs are built here, an old URL
without a redirect page (`/<Project>/zh/missing`) is forwarded language first.

## Importing a project

1. Copy the docs sources (markdown, `public/`, layouts) into `docs/<Project>/`; keep the git history if you can.
2. Add the files below, adapted from the template; `npm ci && npm run typecheck && npm run build && npm run
   linkcheck` in `docs/<Project>/`, and the whole-site check above.
3. `formerPrefixes`: every prefix the project published a locale under, relative to the base — its current one too
   (`['zh-Hans/', 'zh/']`, LeviLauncher `['es-ES/']` …). Keep `folder` / `suffix` as they were: the sources need not
   move. The project's `redirects` stay as they are (relative to the base).
4. Links into the other sites use language-first URLs (`https://levimc.org/zh-Hans/tutorials/…`).
5. Cutover, in this order: merge the import here (the deploy publishes it); then, in the project's repository,
   turn GitHub Pages off and delete its docs workflow (the build, the hourly kit check). Until Pages is off there,
   GitHub serves `/<Project>/` from the project's repository and the copy here only answers the language-first URLs.

## Template

From `tutorials/` (the reference docs root). `docs/<Project>/package.json` — the dependencies are the kit's
(`kit/package.template.json`, the versions `tutorials/package-lock.json` pins):

```json
{
  "name": "levimc-docs-<project>",
  "private": true,
  "version": "0.0.0",
  "description": "levimc.org/<Project>/: the <Project> documentation",
  "type": "module",
  "engines": { "node": ">=22.12" },
  "scripts": {
    "postinstall": "node ../../kit/scripts/vendor.mjs .",
    "kit": "node ../../kit/scripts/vendor.mjs .",
    "dev": "vite",
    "build": "node kit/docs/build.mjs",
    "preview": "node kit/scripts/serve-pages.mjs dist --base / --port 4178",
    "typecheck": "tsc --noEmit",
    "linkcheck": "node kit/scripts/linkcheck.mjs dist --base /<Project>/ --locale-first zh-Hans,zh-Hant --site-origin https://levimc.org",
    "smoke": "node kit/scripts/smoke.mjs --url http://127.0.0.1:4178/<Project>/"
  },
  "dependencies": { "…": "as tutorials/package.json" },
  "devDependencies": { "…": "as tutorials/package.json" }
}
```

`--locale-first` lists the locale prefixes (LeviLauncher: `zh-Hans,zh-Hant,es,ru,de,ja,ko,fr`): the root's pages are
under `/<Project>/` and `/<prefix>/<Project>/`, every other levimc.org path is another site's. LeviLamina adds
`--ignore-paths /LeviLamina/api/` (the API reference is made after the docs build, below). Commit
`package-lock.json` (`npm install` once).

`docs/<Project>/docs.config.ts`:

```ts
import { defineDocsConfig } from './kit/docs/node/config.ts';

const repo = 'https://github.com/LiteLDev/<Project>';

export default defineDocsConfig({
  base: '/<Project>/',
  title: '<Project>',
  description: '…',
  logo: { src: 'https://levimc.org/logos/<Project>.webp', alt: '<Project>' },
  contentDir: 'content',
  repo,
  // the sources live here now
  editLink: 'https://github.com/LiteLDev/liteldev.github.io/edit/main/docs/<Project>/content/:path',
  hostname: 'https://levimc.org',
  sitemap: { hostname: 'https://levimc.org' },
  i18n: {
    mode: 'folder', // or 'suffix' (MkDocs x.zh.md), as the project had it
    defaultLocale: 'en',
    localeFirst: true,
    locales: [
      { code: 'en', label: 'English', lang: 'en', prefix: '' },
      { code: 'zh', label: '简体中文', lang: 'zh-Hans', prefix: 'zh-Hans/', folder: 'zh', formerPrefixes: ['zh-Hans/', 'zh/'] },
      { code: 'zh-Hant', label: '繁體中文', lang: 'zh-Hant', prefix: 'zh-Hant/', convertFrom: 'zh', formerPrefixes: ['zh-Hant/'] },
    ],
  },
  sidebar: 'tabs',
  nav: [/* as the project had it */],
});
```

LeviLauncher's other languages: `{ code: 'ja-JP', label: '日本語', lang: 'ja', prefix: 'ja/', folder: 'ja-JP',
formerPrefixes: ['ja-JP/'] }` and so on (the prefixes are the kit's `docsLocales`: `es`, `ru`, `de`, `ja`, `ko`, `fr`).

`docs/<Project>/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import { kitDocs } from './kit/docs/node/vite.ts';
import docs from './docs.config.ts';

export default defineConfig({
  plugins: [kitDocs(docs)],
});
```

`docs/<Project>/tsconfig.json`: as `tutorials/tsconfig.json` (`"include": ["kit/**/*.ts", "kit/**/*.tsx", "*.ts"]`).

`docs/<Project>/.gitignore`:

```gitignore
node_modules/
dist/
.kit/
# levimc-kit, copied from ../../kit by the package install (npm run kit)
/kit/
vite.config.ts.timestamp-*
```

## LeviLamina API reference

`/LeviLamina/api/` is Doxygen output over LeviLamina's headers, without languages (`docsUnlocalized` in the kit). The
deploy makes it when `docs/LeviLamina/api/Doxyfile` exists, after the docs build and before the merge
(`.github/workflows/deploy.yml`, as LeviLamina's own `build-docs.yml` did):

* `LiteLDev/LeviLamina` (its default branch) is checked out at `docs/LeviLamina/.levilamina/` (git-ignore it);
* `docs/LeviLamina/api/header.html` is generated from the docs build's `dist/LeviLamina/_kit/nav.json` by
  `kit/static/doxygen/gen-header.mjs` (the docs' sections, resources and languages, language-first);
* doxygen-awesome-css v2.4.1 is cloned to `docs/LeviLamina/api/doxygen-awesome-css/`;
* Doxygen 1.16.1 runs `doxygen api/Doxyfile` with the working directory `docs/LeviLamina/`;
* `kit/static/doxygen/patch-navtree.mjs dist/LeviLamina/api` runs on the output.

So the Doxyfile is LeviLamina's `docs/api/Doxyfile` with its paths relative to `docs/LeviLamina/`:

```
PROJECT_LOGO           = api/logo.svg
OUTPUT_DIRECTORY       = dist/LeviLamina/api
HTML_OUTPUT            = .
LAYOUT_FILE            = api/DoxygenLayout.xml
INPUT                  = .levilamina/src/ll/api …
STRIP_FROM_PATH        = .levilamina .
USE_MDFILE_AS_MAINPAGE = api/mainpage.md
HTML_HEADER            = api/header.html
HTML_FOOTER            = kit/static/doxygen/footer.html
HTML_EXTRA_STYLESHEET  = api/doxygen-awesome-css/doxygen-awesome.css …
HTML_EXTRA_FILES       = kit/static/kit.js
```

(`DoxygenLayout.xml`, `logo.svg` and `mainpage.md` move to `docs/LeviLamina/api/` with it; git-ignore
`api/header.html` and `api/doxygen-awesome-css/`.) Locally, the same commands from `docs/LeviLamina/` after its
build, with Doxygen installed.
