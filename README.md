# LeviMC.org

The website at [levimc.org](https://levimc.org/): Vite + React 19 + react-router 7 + TypeScript + Tailwind CSS v4,
styled with the shared LeviMC design system, levimc-kit, which lives here in [`kit/`](kit/README.md).

**levimc-kit is the one source of the LeviMC chrome** — the bar on top (Home · Projects ▾ · Mods · Blog · Community ·
About, language · theme · GitHub), the footer, the theme and the docs engine — for every LeviMC site: levimc.org
(and LeviMC Mods at levimc.org/mods/, see below), docs.levimc.org and the project docs (LeviLamina with its Doxygen API, LegacyScriptEngine, lip,
LeviLauncher for Windows and Android). Every deploy publishes it at <https://levimc.org/kit/v2/> (`kit/scripts/publish-kit.mjs`);
the other sites fetch it when they build (`scripts/fetch-kit.mjs`, run by their package install) and never edit it.
After a deploy that changed the kit, the `sync` job rebuilds every site (with the `KIT_SYNC_TOKEN` secret: a
fine-grained token with *Actions: read and write* on those repositories); each site also checks hourly and rebuilds
when its live pages run an older kit. `node kit/scripts/chrome-parity.mjs` checks that every live site shows the
same bar and footer.
Every route is prerendered to static HTML at build time and hydrated in the browser; GitHub Pages serves `dist/`.

## Development

**Prerequisites:** Node.js 22.12+ (CI uses Node 24)

```bash
# Install dependencies
npm ci

# Run development server
npm run dev

# Type-check the app and the kit components
npm run typecheck

# Unit tests: the blog's content build, and the kit's cross-site preference tests
npm test

# Build for production: client build, SSR build, prerender every route into dist/
npm run build

# Preview the build with GitHub Pages semantics (http://127.0.0.1:4173/)
npm run preview

# Check every internal link in dist/ (add --external to also check external URLs)
npm run linkcheck

# Browser smoke test against the preview server
# (needs Playwright: `npm i --no-save playwright`, or LEVIMC_PW_DIR=<dir containing node_modules/playwright>;
#  an HTTPS_PROXY / HTTP_PROXY in the environment is used for the external live-data requests)
npm run smoke

# The kit's check of the unified LeviMC chrome (same bar, Auto/Light/Dark theme, cross-site cookies)
npm run smoke:kit
```

## Layout

- `src/App.tsx` — routes (`/`, `/community/`, `/about/`, `/support/`, `/blog/…`, and the 404 page)
- `src/pages/`, `src/components/` — page content; `src/i18n/locales/{en,zh,zh-Hant}.ts` — all site text (English, Simplified and Traditional Chinese)
- `src/routes.ts` — route list, titles and descriptions; `src/head.ts` — per-page `<head>` tags
- `src/components/SiteHeader.tsx`, `src/components/Footer.tsx` — the kit GlobalBar and SiteFooter, the same on every
  LeviMC site (each project in the Projects menu leads to its home page: its LeviMC Mods page, docs or repository;
  the footer links Support us).
  The project list is `PROJECTS` in `kit/components/projects.ts`; the home page's project cards read it too.
- `src/prepaint.ts` — the pre-paint script: theme and language come from the cross-site LeviMC preferences
  (cookies `levimc_theme` = auto | light | dark, Auto by default, and `levimc_lang`, shared by levimc.org and
  every *.levimc.org site; see `kit/README.md`, "Cross-site preferences")
- `public/donors.csv` — the supporters listed on `/support/` (read at build time, also served at `/donors.csv`)
- `content/blog/`, `blog/`, `src/blog/` — the blog (see below)
- `prerender.mjs` — writes `dist/<route>/index.html`, `404.html`, `sitemap.xml`, `robots.txt`

## Blog

The LeviMC blog lives at [levimc.org/blog/](https://levimc.org/blog/) (it moved here from the Hexo site
blog.levimc.org, formerly the LiteLDev/blog repository). Posts are Markdown files with Hexo-style front matter,
rendered at build time with the kit's markdown pipeline (the same prose, code highlighting and admonitions as the
docs) and prerendered to static HTML.

### Adding a post

Create `content/blog/posts/<name>.md` — `<name>` becomes the last part of the URL:

```markdown
---
title: 通过Patch修复BDS的空包刷屏问题
date: 2024-08-11 09:51:07
author: ShrBox
tags: [Bedrock Dedicated Server, LeviLamina]
category: Bedrock Dedicated Server
---
First paragraph (it is also the excerpt on the index and in the feeds) …
```

- `date` is local time in Asia/Shanghai (as on the old blog); the post is published at
  `/blog/<year>/<month>/<day>/<name>/`. Set `published: false` to keep a draft out of the build.
- `tags` (a list) and `category` (or `categories`) get their own pages at `/blog/tags/<slug>/` and
  `/blog/categories/<slug>/` (Hexo's slugs: spaces and punctuation become `-`).
- `author`: add the author to `content/blog/authors.yml` (GitHub login and numeric user id) to show their avatar and
  link their profile.
- Markdown: GitHub-flavoured (tables, strikethrough, task lists, footnotes), raw HTML such as
  `<details><summary>…</summary>…</details>`, fenced code with a language, `> [!NOTE]` alerts and VitePress-style
  `::: tip` containers. As in Hexo, a single newline inside a paragraph is a line break.
- Images: put them under `public/blog/images/` and link them as `/blog/images/…`. (The old posts' images on
  `s2.loli.net` are served from the same path under `public/blog/images/`; the build fails if one is missing.)
- Comments: every post and page shows the Waline comments of https://waline.levimc.org/, keyed by the post's old
  path (`/<year>/<month>/<day>/<name>/`), so the comments from the old blog stay with their post.

`npm run build` writes the index (10 posts per page), the posts, tag / category / archive pages, `/blog/about/`,
`/blog/friends/` (from `content/blog/pages/`) and the feeds `/blog/rss.xml`, `/blog/atom.xml`, `/blog/feed.json`.

## LeviMC Mods

The catalogue of mods at [levimc.org/mods/](https://levimc.org/mods/) (formerly pkg.levimc.org, the
LiteLDev/pkg.levimc.org repository, merged here with its history) is its own app in [`mods/`](mods/README.md): pnpm,
built from the repositories in [`mods/repos.txt`](mods/repos.txt) (their version tags) with this checkout's kit
(`pnpm install` copies `../kit`) and Vite `base: '/mods/'`. The deploy builds it after the site and copies
`mods/dist/` into `dist/mods/`; it also runs every hour, so the catalogue picks up new versions.
`.github/workflows/mods-discover.yml` opens a pull request for each new mod repository it finds; merging one lists
it. The `mods` job of `.github/workflows/ci.yml` lints, tests and builds it when a change touches `mods/` or `kit/`.

```bash
cd mods
pnpm install
pnpm dev        # http://localhost:5173/mods/
```

The two apps share the origin: their bar and footer links into the other one are ordinary links (`isAppPath`).
`robots.txt` lists the mods sitemap.

## LeviChan

A small LeviChan head peeks over the top edge of the home hero's showcase card (`src/levichan/LeviChanPeek.tsx`).
Clicking it opens her 3D space at once; nothing of it is downloaded before that (the runtime is its own chunk,
`import('./levichan/space')`, and the model and motions are fetched from `public/levichan/` as they are needed:
the model ~9 MB, each motion a few KB, on first use).

- `src/levichan/space.ts` — the space: the page comes apart and the camera swoops down to her eye level, facing her,
  and follows her (it stays the live page: links, menus and text work; the wheel and Page Up / Down move the camera
  up and down, and it comes back to her after a while). Her WebGL canvas is drawn over it with a camera matched to
  the CSS perspective. Click a component and she makes her way onto it; double-click a small one and she carries it
  somewhere else; drag the sky to look around, drag a cube to throw it, drag her to pick her up. The menu (her
  avatar, bottom left, or a right click on her): whether she watches the cursor, fewer fidgets, face the page
  square on, leave (the blocks fly back and the camera returns to the flat page, exactly as it was).
- `src/levichan/diorama.ts` — the page's components (cards, buttons, the bar, pictures, headings, text) fly out of it,
  tumbling, in a wave from where she was peeking, and become blocks of their own (sides, top, back) hanging upright in
  the sky as a staircase: up the page each block sets back behind the ones below it, so every block's top is a ledge
  in front of the next. The sections' backgrounds dissolve; only inline styles are added, and put back on leaving.
  Loose Minecraft cubes fall in with simple physics (gravity, bounces, landing on blocks, pushing each other).
- `src/levichan/mover.ts` — where she is and how she gets around: the ledges (blocks' tops with room above them) as
  lanes, a shortest path over them by walking, stepping across cracks, hopping (up to 1 m, down, across gaps),
  climbing onto ledges half a metre up, scaling taller blocks' faces and dropping off high ones; carrying a small block
  over her head along her ledge and setting it down where it fits; being carried by the cursor and falling. Blocks in
  front of her hide her (depth-only boxes in her scene); ones that come too close to the camera are hidden.
- `src/levichan/levi.ts` — her runtime: the PMX on babylon-mmd (WASM, Bullet physics), cel shading as in the
  LeviChan repository's renders, clips crossfaded over a looping base (idle, or a walk / run cycle), gaze, blinks and
  expressions, a hit test.
- `src/levichan/brain.ts` — what she does: the visitor never picks a motion; each one answers something they do
  (click the page and she goes there, three quick clicks and she mines it; pat her head, poke her, press and hold,
  double-click her skirt, circle her with the cursor, pick her up and drop her, throw a cube at her, scroll hard,
  linger on a link, copy text, switch language or theme, come back to the tab, the Konami code or typing "levi"...).
  Every 5-11 s she does something on her own: a fidget or a happy clip, a stroll, a trip to another block in view,
  tidying a small block away somewhere else; she makes her way after the view when the visitor scrolls away (or
  reaches up and pouts if she cannot get there), waves when the cursor comes back to her and
  shows off her dress when it rests on it.
- `public/levichan/` — her assets, made by `node scripts/levichan-assets.mjs --pmx <LeviChan out/pmx> --motions
  <LeviChan web motions>` from a LeviChan build: the model from the round 11 branches merged together, the clips from
  `tools/web_clips.py` on `r11/web-motions` (`blender -b out/levi.blend -P tools/motion_vmd.py -- --extra-clips
  web_clips --clips <every web clip> --out out/web_vmd`, and `blender -b -P tools/web_clips.py -- out/web_vmd/clips.json`). `public/levichan/NOTICE` holds the third-party model data's terms.

## License

MIT
