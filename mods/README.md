# LeviMC Mods

LeviMC Mods (LeviMC 模组) is the catalogue of mods and plugins for Minecraft
Bedrock — LeviLamina, LegacyScriptEngine and Endstone — served at
<https://levimc.org/mods/> (it was pkg.levimc.org, which redirects there). Every
package in it can be installed with [lip](https://github.com/LiteLDev/lip).

It is a static site built from the [lipr](https://github.com/LiteLDev/lipr)
index with the LeviMC web stack — [Vite](https://vite.dev), React 19,
[React Router](https://reactrouter.com) 7, TypeScript and Tailwind CSS v4 — and
the shared LeviMC design system, levimc-kit, which `pnpm install` copies from
`../kit` into `kit/` (git-ignored; see [Design system](#design-system)). It is
built with Vite `base: '/mods/'`: every page and file is under `/mods/`.

- **The listing** (`/mods/`) has the whole catalogue baked in: search as you type,
  filters (platform, category, environment, license), sort (relevance — by
  GitHub stars when nothing is searched — stars, updated, newest), page size,
  list or grid view and pagination all run in the browser and read
  `?q=&cat=&platform=&env=&license=&author=&tags=&sort=&page=`. As on
  Modrinth, a package must have every included category (AND) and any of the
  included platforms or environments (OR); excluded options are left out, and
  the groups combine with AND. Old links
  keep working: `?tags=` still filters by raw lipr tags, `?sort=downloads`
  sorts by stars.
- **Package pages** (`/mods/<tooth>/`, e.g. `/mods/github.com/LiteLDev/LeviLamina/`) are prerendered with the README and
  manifest of the default variant's latest version; other variants and
  versions (`?variant=&version=`) are fetched in the browser from lipr and
  GitHub. Tabs: Description, Versions (`?tab=versions`), Dependencies
  (`?tab=dependencies`).
- Pages hydrate into a single-page app: following a link fetches the target's
  prerendered HTML and reads its embedded data, so a page looks the same
  however it was reached.
- The interface is in English, 简体中文 and 繁體中文, following the visitor's
  language preference shared by every LeviMC site (the LeviMC bar's language
  menu); the theme (Auto, Light, Dark) is shared the same way. Package data is
  shown as published.
- The 404 page sends case-mismatched package paths
  (`/mods/github.com/liteldev/levilamina/`) and pkg.levimc.org's old form
  (`/mods/packages/<tooth>/`) on to the real package. GitHub Pages serves only
  levimc.org's `404.html`, which hands every `/mods/…` path to this one.

## Data

At build time (`src/server/catalog.ts`) the lipr index is enriched with:

| Source | Used for | Without it |
| ------ | -------- | ---------- |
| lipr tags | categories (the tag map in `src/data/categories.ts`; a `category:<id>` tag wins), platforms and the LSE language | — |
| latest `tooth.json` of each package | environment (files placed in `plugins/` → server, `mods/` → client), dependencies, OS | the variant labels |
| `lipr.levimc.org/levilauncher.json` | "Required by", Depends On, Game Version (every version's dependency ranges, followed to LeviLamina and its `bds` version), the LeviLamina range of each version | those are left out |
| GitHub GraphQL (`GITHUB_TOKEN`) | where renamed repositories live, release dates, creation date, license | links keep the tooth path, dates come from the index, no "Newest" sort and no License filter |

Nothing is curated by hand: a package's categories come from its lipr tags.
To put packages in a category, add their tags to that category's `tags` in
`src/data/categories.ts`, or tag the package `category:<id>` in its
`tooth.json`.

## Development

Requires Node.js 22.18 or later (the unit tests run TypeScript directly) and
pnpm (`corepack enable`). Set `GITHUB_TOKEN` for `pnpm build` to get the GitHub
data, as CI does.

```bash
pnpm install
pnpm dev        # http://localhost:5173/mods/, every page rendered on request
```

| Command          | What it does                                                              |
| ---------------- | ------------------------------------------------------------------------- |
| `pnpm build`     | client build, SSR build, then `prerender.mjs` writes every page, the hero paintings and `sitemap.xml` to `dist/` |
| `pnpm preview`   | serves `dist/` at `/mods/` the way GitHub Pages does, on <http://127.0.0.1:4173/mods/> |
| `pnpm lint`      | ESLint (typescript-eslint, React hooks)                                    |
| `pnpm typecheck` | `tsc --noEmit`                                                             |
| `pnpm test`      | unit tests (`node:test`): query parsing and filters, search, facets, URLs, README rendering, prerendering |
| `pnpm budget`    | checks the size budgets of the built home page, JavaScript and CSS         |
| `pnpm linkcheck` | checks every internal link and anchor in `dist/` (add `--external` for the rest) |
| `pnpm smoke`     | browser test of the built site against `pnpm preview` (needs Playwright), every package page included |

## Layout

```
index.html          page template (the kit's pre-paint script and fonts, the listing's view/pending script)
prerender.mjs       renders /mods/, /mods/<tooth>/ and 404.html into dist/, plus the hero paintings and sitemap.xml
src/
  entry-client.tsx  hydrates a prerendered page
  entry-server.tsx  renders one page (prerender and dev server)
  App.tsx           shell: LeviMC bar, page, footer
  base-path.ts      BASE, the site's path on levimc.org (`/mods/`)
  i18n.ts           interface strings (en, zh-CN, zh-HK); locales.ts lists the languages
  kit-ui.ts         the kit components the site uses
  data/             categories (with their tag map), platforms, environments
  pages/            home, package and 404 pages
  components/       listing (search, toolbar, filters, rows), package page (header, tabs, versions,
                    dependencies, sidebar, install dialog), README renderer
  lib/              catalogue query (parse/serialize/run), search, facets, lipr and GitHub URLs, markdown helpers
  server/           build-time data: catalogue, GitHub, icons, hero paintings
kit/                levimc-kit, copied from ../kit by `pnpm install` (git-ignored; never edit it)
public/             icon.png
```

## Design system

Colours, fonts, components and the whole LeviMC chrome (the bar on top, the footer) come from levimc-kit,
which lives next to this app in [`../kit`](../kit/README.md). `pnpm install` runs `scripts/fetch-kit.mjs --source
../kit`, which copies it into `kit/`; `pnpm kit` refreshes the copy after a kit change. The bar and footer links
into the rest of levimc.org (Home, Blog, …) are ordinary links (`isAppPath`): only `/mods/` is this app.

## Deployment

levimc.org's `.github/workflows/deploy.yml` builds this app after the site and
deploys `dist/` as levimc.org's `/mods/` on every push to `main`. It also
rebuilds every hour, and on a `lipr-updated`
[repository dispatch](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event)
to LiteLDev/levimc.org, so the site picks up new packages and versions.
`.github/workflows/mods.yml` lints, tests and builds it on pull requests.
