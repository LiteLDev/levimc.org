# LeviMC Mods

LeviMC Mods (LeviMC 模组) is the catalogue of LeviLamina mods and plugins for
Minecraft Bedrock, served at <https://levimc.org/mods/> (it was pkg.levimc.org). Every
mod in it can be installed with [lip](https://github.com/LiteLDev/lip), and LeviLauncher
browses the same catalogue.

It is a static site built from the mods' own repositories — the ones
[`repos.txt`](repos.txt) names, see [Registry](#registry) — with the LeviMC web stack — [Vite](https://vite.dev), React 19,
[React Router](https://reactrouter.com) 7, TypeScript and Tailwind CSS v4 — and
the shared LeviMC design system, levimc-kit, which `pnpm install` copies from
`../kit` into `kit/` (git-ignored; see [Design system](#design-system)). It is
built with Vite `base: '/mods/'`: every page and file is under `/mods/`.

- **The listing** (`/mods/`) has the whole catalogue baked in: search as you type,
  filters, sort (relevance — when nothing is searched, the default order below — stars,
  updated, newest), list or grid view and pagination all run in the browser and read the
  query string (see [Filters](#filters)). Results come 20 to a page.
- **Mod pages** (`/mods/<id>/`, e.g. `/mods/github.com/LiteLDev/LegacyScriptEngine/`) are prerendered with the README and
  package file of the default variant's latest version; other variants and
  versions (`?variant=&version=`) are fetched in the browser: the package file's data from the mod's
  `index.json`, the README from GitHub. Tabs: Description, Gallery (`?tab=gallery`, when the mod has one, see
  [Galleries](#galleries)), Versions (`?tab=versions`), Dependencies
  (`?tab=dependencies`). The sidebar shows the sides and platforms of the selection, the author (the repository
  owner, with "More by …" setting `?author=`), the license's family and SPDX id, and the tags.
- **JSON**: every page has its data next to it as `index.json` (linked from the page as
  `rel="alternate"`), see [JSON](#json).
- **lipr**: `/mods/lipr/index.json` and `/mods/lipr/levilauncher.json` are lipr's two indexes, in lipr's format, with
  every package of the registry that has `tooth.json` files (a package with only `lip.toml` files is not in them; a
  version's `lip.toml` does not change what lipr gets); `/mods/lipr/sources.json` says where each version's `tooth.json`
  is (repository, tag, commit). [LiteLDev/lipr](https://github.com/LiteLDev/lipr) builds lipr.levimc.org from them, for lip and
  older LeviLaunchers, and stores nothing itself.
- Pages hydrate into a single-page app: following a link fetches the target's
  prerendered HTML and reads its embedded data, so a page looks the same
  however it was reached.
- The interface is in English, 简体中文 and 繁體中文, following the visitor's
  language preference shared by every LeviMC site (the LeviMC bar's language
  menu); the theme (Auto, Light, Dark) is shared the same way. Mod data is
  shown as published.

### Filters

The listing's state is its query string, written in this order:

| Key | Filter | Matches |
| --- | ------ | ------- |
| `q` | search | every word, anywhere: the name (weighs most), the id and owner, the featured tags' names in every language and the tags, the description |
| `gv` | Game version | any of them (OR), on the versions a mod runs on |
| `side` | Side: `server`, `client` | any of them (OR) |
| `platform` | Platform: .NET RIDs such as `win-x64`, `linux-arm64`, `android-arm64` | any of them (OR); only RIDs some mod has |
| `tags` | Tags | every one (AND); `-tag` excludes. A featured tag stands for its whole group (see [Tags](#tags)) |
| `license` | License: a family (`permissive`, `weak-copyleft`, `copyleft`, `other`, `none`) or an SPDX id | any of them (OR), e.g. `license=permissive,GPL-3.0` |
| `dep` | Dependencies | every one (AND), on the ids the latest version depends on, in any case |
| `author` | author (set by "More by …" on a mod page) | any owner (OR), in any case |
| `sort` | `relevance` (default), `stars`, `updated`, `newest` | |
| `page` | page | |

Lists are comma-separated (`tags=economy,-library`); the groups combine with AND. Unknown keys and values are
ignored, and a filter's count says how many mods it would leave. Older links keep working where they still mean
something: `env=` is read as `side=`, `sort=downloads` sorts by stars, and `tags=` matches the normalised tags;
`cat=`, `license=oss`, loader platforms (`platform=lse`) and `per=` are ignored. `src/lib/catalog-query.ts` is the
reference LeviLauncher follows (it forces `side=client` and its own platform).
## JSON

Every page has its data next to it as `index.json`. Both are written by `src/server/api.ts`; the shapes are
`CatalogJson` and `ModJson` in `src/types.ts`. Keys whose value is unknown are left out (marked `?`). Ids are
`github.com/<owner>/<repo>`; a variant's name is `""` for the default one.

[`/mods/index.json`](https://levimc.org/mods/index.json) is the listing as `/mods/` shows it, unfiltered and in the
default order (a query string does not reach the host, so filtering is left to the reader, by the rules of
[Filters](#filters)):

```
{ url, stats: { projects, authors, versions }, sort: "relevance",
  mods: [ { id, name, description, owner, logo, tags, side, platform, gameVersions, deps, stars, license?,
            updated, created?, url, json, requiredBy } ] }
```

- `tags`: the latest version's `info.tags`, as published (normalising and grouping them is left to the reader).
- `side` (`"server"`, `"client"`, server first) and `platform` (RIDs): what any entry of the latest version runs on.
- `deps`: what the latest version depends on, by bare id (without `#variant`) → range; ranges of one id that
  differ are joined with ` || `.
- `logo`: the mod's logo, else its owner's GitHub avatar. `owner` is the author.
- `license`: the SPDX id GitHub reports (`NOASSERTION` when it cannot tell); absent without one.
- `requiredBy`: how many listed mods' latest versions depend on it.

`/mods/<id>/index.json` is the mod page, every version included:

```
{ url, id, canonical?, name, description, owner, logo, repository, issues?, releases, stars, updated, published?,
  created?, license?, side, platform, gameVersions, tags,
  latest: { variant, version, install },
  readmes: [ { file, lang, text } ], gallery: [ … ],
  versions: [ { version, prerelease, released?, releaseUrl, manifestUrl, info: { name, description, tags, logo? },
                variants: { "<name>": [ { side, platform, deps } ] } } ],
  dependencies: { "<lower-case id>": { id, name, owner, url? } }, requiredBy: [ { id, name, owner, url? } ] }
```

- `canonical`: the page of the repository's current id, when this is an old one.
- `latest`: what the page shows by default: the default variant (see [Data](#data)), its latest version and the `lip install` command for it.
- `versions`: newest first. `manifestUrl` is the version's `lip.toml`, or its `tooth.json` when it has none; a
  variant's entries are lip v0.40's: one per side and platform it installs on, with the entry's `deps`
  (`<id>[#variant]` → range).
- `dependencies` names the ids the versions' `deps` use; `requiredBy` lists the listed mods whose latest version
  depends on this one.

## Registry

[`repos.txt`](repos.txt) lists the GitHub repositories the catalogue is built from, one `owner/repo` per line. It
replaces [lipr](https://github.com/LiteLDev/lipr) (lip's registry, which the site used to read): it started as the
repositories of every package lipr had.

- **Versions.** `src/server/registry.ts` lists each repository's tags (`git ls-remote`); every `v<semver>` tag is a
  version, read the way lip v0.40 reads a package: the `lip.toml` at that tag (`src/lib/lipfile.ts`: format 4, its
  Scriban templates rendered, checked like lip checks it — one that lip cannot read makes the tag no version), else,
  only when the tag has none, its `tooth.json`, read as lip reads one (`src/lib/manifest.ts` `toothToV4`: each
  variant's entries for the sides its LeviLamina dependency implies, followed through the mods it depends on, and
  for every platform a launcher can force when it names none). It also makes the repairs lipr's maintainers made by
  hand: the tag is the version (a manifest saying `v1.2.0`, or not bumped), and a `tooth.json` is filed under the
  tooth it names only when GitHub serves that address from where it serves the repository, a former name or owner (an
  old release keeps its old address, whether `repos.txt` has the old name or the new one); any other tooth (`CFSP`, a
  template's `my-mod`, another repository's) is the repository's address as `repos.txt` spells it. A `lip.toml` whose
  `id` is another package's is not read. The files are otherwise taken as the repositories have them, so a
  dependency on a host that no longer exists stays.
- **Cache.** What was read is kept in `.cache/registry.json` (git-ignored; the deploy keeps it in the Actions
  cache, saved when it changed): a tag whose commit is unchanged is not read again, so an hourly build reads only
  new tags. Where GitHub serves each address a manifest names is looked up on every build (a repository can move
  again); the cached answer is used only when the lookup fails. It is only a cache: without it every tag is read
  anew (about a minute). `MODS_REGISTRY_CACHE` moves it.
- **Discovery.** `scripts/discover.mjs` (`.github/workflows/mods-discover.yml`, every two hours) searches GitHub's
  code for a top-level `lip.toml` or `tooth.json` (lipr searched for the latter) and opens a pull request adding each
  repository that is not in `repos.txt` (under its name or a former one), not a fork and has a version tag whose
  package file lip can read (its `lip.toml`, else its `tooth.json`). Whether it is a LeviLamina mod is left to the
  build (see the listing rules below). Merging lists it at the next deploy; closing it keeps it out, since a repository that ever had a pull request
  (branch `mods/add/<owner>/<repo>`) is not proposed again. To take a mod off, close its pull request or delete its line.
  `node scripts/discover.mjs --dry-run` shows what it would propose (needs `GH_TOKEN`). The workflow token's code
  search limit is shared and often exhausted (HTTP 429): the script waits as GitHub asks for up to ten minutes, then
  skips the run with a warning. A `MODS_SEARCH_TOKEN` secret (a personal token, no scopes) gives it a limit of its own.

## Data

At build time (`src/server/catalog.ts`) the registry is enriched with:

| Source | Used for | Without it |
| ------ | -------- | ---------- |
| the latest version's package file | tags (shown as published; see [Tags](#tags)), sides and platforms (any entry's), dependencies, the default variant (among those with a `server` entry, else a `client` one: `client`, then the default `""`, then the others by name — the rule LeviLauncher uses for the client) | — |
| every version's package file | "Required by", Game Version (every version's dependency ranges, followed to LeviLamina and its `bds` version), each version's sides, platforms and LeviLamina range | — |
| GitHub GraphQL (`GITHUB_TOKEN`) | where renamed repositories live, stars, release dates, creation date, license (SPDX id; `src/data/licenses.ts` overrides the few GitHub cannot tell), organization owner | links keep the id's path, no stars, dates are when the build first saw a version, no "Newest" sort and no License filter |
| `docs/showcase/showcase.json` on each mod's default branch | the Gallery tab (`src/server/showcase.ts`) | no Gallery tab |
| each mod's logo (`info.logo`, a `tooth.json`'s `avatar_url`; `https://` only) | the icon in rows and on pages, downloaded once and scaled with [sharp](https://sharp.pixelplumbing.com) (a devDependency) to 96/144/288 px WebP under `/mods/icons/` (`src/server/icons.ts`), served with `srcset` | an icon that does not load: the owner's GitHub avatar; one sharp cannot read: the original file |

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
owner, logo, license, a featured tag, sides; dependents: age
only); a Poisson–Gamma model gives the posterior E[ln θ] of its quality from
its actual stars and dependents against those; and each game version it is
behind the newest costs ln q, q being how often the catalogue's mods keep
supporting the next version. The build log prints the fitted model.

### Tags

Nothing is curated by hand beyond `repos.txt`: a mod's tags are its package file's `info.tags`, and the JSON carries
them untouched. Only the pages (and LeviLauncher) read them, through `src/data/featured-tags.ts`:

- a tag is compared in lower case, without a `category:` prefix (`category:Utility` is `utility`);
- tags that say what the side and platform already say, or that nearly every mod has, are never shown: `platform:*`,
  `type:*`, `levilamina`, `ll`, `mod`, `plugin`, `native`, `client`, `server`, `minecraft-bedrock`;
- the featured tags below come first, with an icon and a translated name, and each stands for its group: a few
  common tags that mean the same are shown and filtered as it, with the mod's own tag in grey beside the name.

To be found under a featured tag, give the mod that tag — lip's [recommended tags](https://docs.levimc.org/lip/guides/creating_packages.html#recommended-tags)
are the same list. The other names are only how the site groups what mods already use; they are no reason to use
them instead.

| Tag | Name | Also groups |
| --- | ---- | ----------- |
| `library` | Library / API | `api`, `modapi`, `nativeapi`, `event`, `export`, `form`, `pland:library` |
| `utility` | Utility | `tools`, `essential`, `inventory`, `waila`, `info-display`, `tooltip`, `recipe-viewer`, `item-list` |
| `management` | Server management | `backup`, `ban`, `whitelist`, `login`, `command`, `land`, `checkbag` |
| `game-mechanics` | Game mechanics | `gameplay`, `vanilla-plus`, `achievement` |
| `adventure` | Content & adventure | `worldgen`, `terrain`, `biome` |
| `visual` | Visual & HUD | `hud`, `sidebar`, `shader`, `replay`, `recording` |
| `economy` | Economy | `money` |
| `teleport` | Teleport | `tp`, `waystones` |
| `anticheat` | Anti-cheat | `antixray` |
| `optimization` | Optimization | `performance`, `cleaner` |
| `bugfix` | Bug fixes | `fix` |
| `technology` | Technical & redstone | `redstone`, `piston`, `automation` |
| `protocol` | Protocol & multi-version | `multiversion` |

Every other tag follows, most used first. `lse`, `quickjs` and `nodejs` are ordinary tags: LegacyScriptEngine plugins
rarely declare their dependency on it, so these are how they are found.

The registry has every package lip installs, so it also holds what is not a mod. The listing
(search, filters, counts, sitemap) has only mods; `src/lib/listing.ts` decides,
from each package's latest manifest and its repository, again on every build:

| Package | Shown as | Why |
| ------- | -------- | --- |
| places files, but none under `plugins/` or `mods/` nor where the game loads add-ons from (`behavior_packs/`, `resource_packs/`, `worlds/`, … at any depth, or `.mcpack`/`.mcaddon` files): images, scripts, programs | excluded: no page | not a mod |
| a GitHub template, or a repository named `…-template`, `-example`, `-demo`, `-sample`, `-test` | excluded: no page | not a mod |
| LeviLamina and everything it depends on | unlisted: its page stays for dependency cards | the platform |
| a package whose latest version does not depend on LeviLamina, directly or through other packages of the registry | unlisted: its page and JSON stay | not a LeviLamina mod |
| another id of a repository the index already has (renamed, transferred, differing in case) | unlisted: its page points to the listed one as canonical | listed once, under the name GitHub serves it as, else the latest version |

A package whose manifest places nothing (older manifests often list no files) is
listed. The build log prints every package left out and why (`listing: …`).

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
| `pnpm build`     | client build, SSR build, then `prerender.mjs` writes every page and its `index.json`, the hero paintings and `sitemap.xml` to `dist/` |
| `pnpm preview`   | serves `dist/` at `/mods/` the way GitHub Pages does, on <http://127.0.0.1:4173/mods/> |
| `pnpm lint`      | ESLint (typescript-eslint, React hooks)                                    |
| `pnpm typecheck` | `tsc --noEmit`                                                             |
| `pnpm test`      | unit tests (`node:test`): package files (against lip's golden data), query parsing and filters, tags, licenses, search, URLs, README rendering, prerendering |
| `pnpm budget`    | checks the size budgets of the built home page, JavaScript and CSS         |
| `pnpm linkcheck` | checks every internal link and anchor in `dist/` (add `--external` for the rest) |
| `pnpm smoke`     | browser test of the built site against `pnpm preview` (needs Playwright), every mod page included |

## Layout

```
index.html          page template (the kit's pre-paint script and fonts, the listing's view/pending script)
prerender.mjs       renders /mods/, /mods/<id>/ and 404.html into dist/, plus their index.json, the hero paintings and sitemap.xml
repos.txt           the repositories the catalogue is built from (see Registry)
scripts/discover.mjs  proposes new repositories in pull requests
src/
  entry-client.tsx  hydrates a prerendered page
  entry-server.tsx  renders one page (prerender and dev server)
  App.tsx           shell: LeviMC bar, page, footer
  base-path.ts      BASE, the site's path on levimc.org (`/mods/`)
  i18n.ts           interface strings (en, zh-CN, zh-Hant); locales.ts lists the languages
  kit-ui.ts         the kit components the site uses
  data/             featured tags (with their groups), license families, sides, sprite names
  pages/            home, mod and 404 pages
  components/       listing (search, toolbar, filters, rows), mod page (header, tabs, versions,
                    dependencies, sidebar, install dialog), README renderer
  lib/              catalogue query (parse/serialize/run), search, package files (lip.toml, tooth.json), URLs, markdown helpers
  server/           build-time data: registry, catalogue, GitHub, JSON, icons, galleries, hero paintings
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
deploys `dist/` as levimc.org's `/mods/` on every push to `main` (a merged
discovery pull request among them). It also rebuilds every hour, so the site
picks up new versions.
The `mods` job of `.github/workflows/ci.yml` lints, tests and builds it when a change touches `mods/` or `kit/`.
