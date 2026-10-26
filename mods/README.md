# LeviMC Mods

LeviMC Mods (LeviMC 模组) is the catalogue of mods and plugins for Minecraft
Bedrock — LeviLamina, LegacyScriptEngine and Endstone — served at
<https://levimc.org/mods/> (it was pkg.levimc.org). Every
mod in it can be installed with [lip](https://github.com/LiteLDev/lip).

It is a static site built from the [lipr](https://github.com/LiteLDev/lipr)
index with the LeviMC web stack — [Vite](https://vite.dev), React 19,
[React Router](https://reactrouter.com) 7, TypeScript and Tailwind CSS v4 — and
the shared LeviMC design system, levimc-kit, which `pnpm install` copies from
`../kit` into `kit/` (git-ignored; see [Design system](#design-system)). It is
built with Vite `base: '/mods/'`: every page and file is under `/mods/`.

- **The listing** (`/mods/`) has the whole catalogue baked in: search as you type,
  filters (platform, category, environment, license), sort (relevance — when
  nothing is searched, the default order below — stars, updated, newest), page size,
  list or grid view and pagination all run in the browser and read
  `?q=&cat=&platform=&env=&license=&author=&tags=&sort=&page=`. As on
  Modrinth, a mod must have every included category (AND) and any of the
  included platforms or environments (OR); excluded options are left out, and
  the groups combine with AND. Old links
  keep working: `?tags=` still filters by raw lipr tags, `?sort=downloads`
  sorts by stars.
- **Mod pages** (`/mods/<tooth>/`, e.g. `/mods/github.com/LiteLDev/LeviLamina/`) are prerendered with the README and
  manifest of the default variant's latest version; other variants and
  versions (`?variant=&version=`) are fetched in the browser from lipr and
  GitHub. Tabs: Description, Gallery (`?tab=gallery`, when the mod has one, see
  [Galleries](#galleries)), Versions (`?tab=versions`), Dependencies
  (`?tab=dependencies`).
- Pages hydrate into a single-page app: following a link fetches the target's
  prerendered HTML and reads its embedded data, so a page looks the same
  however it was reached.
- The interface is in English, 简体中文 and 繁體中文, following the visitor's
  language preference shared by every LeviMC site (the LeviMC bar's language
  menu); the theme (Auto, Light, Dark) is shared the same way. Mod data is
  shown as published.

## Data

At build time (`src/server/catalog.ts`) the lipr index is enriched with:

| Source | Used for | Without it |
| ------ | -------- | ---------- |
| lipr tags | categories (the tag map in `src/data/categories.ts`; a `category:<id>` tag wins), platforms and the LSE language | — |
| latest `tooth.json` of each mod | environment (files placed in `plugins/` → server, `mods/` → client), dependencies, OS | the variant labels |
| `lipr.levimc.org/levilauncher.json` | "Required by", Depends On, Game Version (every version's dependency ranges, followed to LeviLamina and its `bds` version), the LeviLamina range of each version | those are left out |
| GitHub GraphQL (`GITHUB_TOKEN`) | where renamed repositories live, release dates, creation date, license, organization owner | links keep the tooth path, dates come from the index, no "Newest" sort and no License filter |
| `docs/showcase/showcase.json` on each mod's default branch | the Gallery tab (`src/server/showcase.ts`) | no Gallery tab |

### Galleries

A mod gets a Gallery tab by committing `docs/showcase/showcase.json` and the files it lists to its
repository's default branch. The gallery is not tied to a version; the next build (hourly) picks it up.

```json
{
  "items": [
    {
      "kind": "video",
      "src": "teleport.mp4",
      "poster": "teleport.webp",
      "width": 1280,
      "height": 720,
      "title": { "en": "Teleport between waystones", "zh-CN": "在传送石之间传送" },
      "caption": { "en": "One sentence a player cares about." }
    }
  ]
}
```

- `kind`: `image` (WebP, PNG, JPEG), `video` (MP4, WebM; `poster` is an image) or `svg`; `src` is a file
  name in `docs/showcase/`. `title` is required, `caption` optional; each is a string or
  `{ "en", "zh-CN", "zh-Hant" }` (`zh-Hans` is read as `zh-CN`, `zh-HK` and `zh-TW` as `zh-Hant`; Traditional Chinese
  falls back to Simplified, then English). The first item is
  shown large. At most 24 items, 8 MB per file, 30 MB per mod.
- The build copies the files into the site (`/mods/showcase/<owner>/<repo>/`), so they are served with the right
  types. Files that are missing, too large or not what their extension says are left out, and so are SVGs that
  could run script or load anything when opened on their own (scripts, event handlers, links, external
  references; embedded `data:image/png|webp|jpeg` sprites and `#id` references are fine). The build log says
  what it left out (`showcase: …`).

**Default order** (relevance without a search, `src/lib/ranking.ts`), fitted
over the whole catalogue at every build, one row per repository:
negative-binomial GLMs give the stars and dependents a mod like it would get
(stars: covariates fixed before anyone could star it, chosen by BIC — age,
owner, icon, license, category, platforms, environments; dependents: age
only); a Poisson–Gamma model gives the posterior E[ln θ] of its quality from
its actual stars and dependents against those; and each game version it is
behind the newest costs ln q, q being how often the catalogue's mods keep
supporting the next version. The build log prints the fitted model.

Nothing is curated by hand: a mod's categories come from its lipr tags.
To put mods in a category, add their tags to that category's `tags` in
`src/data/categories.ts`, or tag the mod `category:<id>` in its
`tooth.json`.

lipr is lip's registry, so it also holds what is not a mod. The listing
(search, filters, counts, sitemap) has only mods; `src/lib/listing.ts` decides,
from each package's latest manifest and its repository, again on every build:

| Package | Shown as | Why |
| ------- | -------- | --- |
| places files, but none under `plugins/` or `mods/` nor where the game loads add-ons from (`behavior_packs/`, `resource_packs/`, `worlds/`, … at any depth, or `.mcpack`/`.mcaddon` files): images, scripts, programs | excluded: no page | not a mod |
| a GitHub template, or a repository named `…-template`, `-example`, `-demo`, `-sample`, `-test` | excluded: no page | not a mod |
| LeviLamina and everything it depends on | unlisted: its page stays for dependency cards | the platform |
| another tooth of a repository the index already has (renamed, transferred, differing in case) | unlisted: its page points to the listed one as canonical | listed once, under the name GitHub serves it as, else the latest version |

Where lipr has no manifest at the tooth's path, the rules read lipr's under the
repository's current name, else the repository's own `tooth.json` at the
version's tag (older formats too); a package with none, or whose manifest
places nothing (older manifests often list no files), is listed. The build log
prints every package left out and why (`listing: …`).

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
| `pnpm smoke`     | browser test of the built site against `pnpm preview` (needs Playwright), every mod page included |

## Layout

```
index.html          page template (the kit's pre-paint script and fonts, the listing's view/pending script)
prerender.mjs       renders /mods/, /mods/<tooth>/ and 404.html into dist/, plus the hero paintings and sitemap.xml
src/
  entry-client.tsx  hydrates a prerendered page
  entry-server.tsx  renders one page (prerender and dev server)
  App.tsx           shell: LeviMC bar, page, footer
  base-path.ts      BASE, the site's path on levimc.org (`/mods/`)
  i18n.ts           interface strings (en, zh-CN, zh-Hant); locales.ts lists the languages
  kit-ui.ts         the kit components the site uses
  data/             categories (with their tag map), platforms, environments
  pages/            home, mod and 404 pages
  components/       listing (search, toolbar, filters, rows), mod page (header, tabs, versions,
                    dependencies, sidebar, install dialog), README renderer
  lib/              catalogue query (parse/serialize/run), search, facets, lipr and GitHub URLs, markdown helpers
  server/           build-time data: catalogue, GitHub, icons, galleries, hero paintings
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
to LiteLDev/levimc.org, so the site picks up new mods and versions.
`.github/workflows/mods.yml` lints, tests and builds it on pull requests.
