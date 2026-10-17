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

# Build for production: client build, SSR build, prerender every route into dist/
npm run build

# Preview the build with GitHub Pages semantics (http://127.0.0.1:4173/)
npm run preview

# Check every internal link in dist/ (add --external to also check external URLs)
npm run linkcheck

# Browser smoke test against the preview server
# (needs Playwright: `npm i --no-save playwright`, or LEVIMC_PW_DIR=<dir containing node_modules/playwright>)
npm run smoke
```

## Layout

- `src/App.tsx` — routes (`/`, `/projects/`, `/features/`, `/community/`, `/about/`, `/support/`, and the 404 page)
- `src/pages/`, `src/components/` — page content; `src/i18n/locales/{en,zh}.ts` — all site text
- `src/routes.ts` — route list, titles and descriptions; `src/head.ts` — per-page `<head>` tags
- `public/donors.csv` — the supporters listed on `/support/` (read at build time, also served at `/donors.csv`)
- `prerender.mjs` — writes `dist/<route>/index.html`, `404.html`, `sitemap.xml`, `robots.txt`

## License

MIT
