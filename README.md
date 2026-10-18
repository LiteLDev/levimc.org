# LeviMC.org

The website at [levimc.org](https://levimc.org/): Vite + React 19 + react-router 7 + TypeScript + Tailwind CSS v4,
styled with the shared LeviMC design system in [`kit/`](kit/README.md) (levimc-kit, vendored — do not edit it here).
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

- `src/App.tsx` — routes (`/`, `/projects/`, `/features/`, `/community/`, `/about/`, `/support/`, `/blog/…`, and the 404 page)
- `src/pages/`, `src/components/` — page content; `src/i18n/locales/{en,zh}.ts` — all site text
- `src/routes.ts` — route list, titles and descriptions; `src/head.ts` — per-page `<head>` tags
- `src/components/SiteHeader.tsx` — the kit GlobalBar (the same bar as on every LeviMC site: Home · Projects ·
  Docs · Mods · Blog · Community · About, then language · theme · GitHub). Features and Support Us are linked from
  the footer's "Resources" row.
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

## License

MIT
