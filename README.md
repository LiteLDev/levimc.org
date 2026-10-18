# bedrinth

The package index for LeviLamina, served at <https://pkg.levimc.org/>.

It is a static site built from the [lipr](https://github.com/LiteLDev/lipr)
index with the LeviMC web stack — [Vite](https://vite.dev), React 19,
[React Router](https://reactrouter.com) 7, TypeScript and Tailwind CSS v4 — and
the shared LeviMC design system, [levimc-kit](kit/README.md), vendored in
`kit/`:

- Every package page is prerendered at build time with the README and manifest
  of its default variant's latest version. Other variants and versions
  (`?variant=&version=`) are fetched in the browser from lipr and GitHub.
- The home page has the whole index baked in. Search (FlexSearch), tag filters,
  sorting and pagination run in the browser and read `?q=&tags=&sort=&page=`.
- Pages hydrate into a single-page app: following a link fetches the target's
  prerendered HTML and reads its embedded data, so a page looks the same
  however it was reached.
- The 404 page sends case-mismatched package paths
  (`/packages/github.com/liteldev/levilamina/`) on to the real package.

## Development

Requires Node.js 22.18 or later (the unit tests run TypeScript directly) and
pnpm (`corepack enable`). Set `GITHUB_TOKEN` for `pnpm build` to link renamed
package repositories directly, as CI does.

```bash
pnpm install
pnpm dev        # http://localhost:5173, every page rendered on request
```

| Command          | What it does                                                              |
| ---------------- | ------------------------------------------------------------------------- |
| `pnpm build`     | client build, SSR build, then `prerender.mjs` writes every page to `dist/` |
| `pnpm preview`   | serves `dist/` the way GitHub Pages does, on <http://127.0.0.1:4173/>      |
| `pnpm lint`      | ESLint (typescript-eslint, React hooks)                                    |
| `pnpm typecheck` | `tsc --noEmit`                                                             |
| `pnpm test`      | unit tests (`node:test`): search, URLs, README rendering, prerendering     |
| `pnpm linkcheck` | checks every internal link and anchor in `dist/` (add `--external` for the rest) |
| `pnpm smoke`     | browser test of the built site against `pnpm preview` (needs Playwright), every package page included |

Set `VITE_AUTO_SEARCH=1` at build time to search while typing instead of on
submit.

## Layout

```
index.html          page template (the kit adds the theme script and fonts)
prerender.mjs       renders /, /packages/<tooth>/ and 404.html into dist/
src/
  entry-client.tsx  hydrates a prerendered page
  entry-server.tsx  renders one page (prerender and dev server)
  App.tsx           shell: LeviMC bar, page, footer
  pages/            home, package and 404 pages
  components/       package list and cards, package details, README renderer
  lib/              index search/sort/filter, lipr and GitHub URLs, markdown helpers
  server/           build-time data: the lipr index, READMEs and manifests
kit/                vendored levimc-kit (do not edit; re-vendor from the kit);
                    carries one fix not yet in the kit: kit/ssg/prerender.mjs
                    inserts pages with replacement functions, so `$&` in a
                    README stays as written
public/             icon.png, robots.txt
```

Colours, fonts and components come from the kit's tokens and components; see
[`kit/README.md`](kit/README.md).

## Deployment

`.github/workflows/build.yml` builds the site and deploys `dist/` to GitHub
Pages on every push to `main`. It also rebuilds every hour, and on a
`lipr-updated` [repository dispatch](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event),
so the site picks up new packages and versions.
