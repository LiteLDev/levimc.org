# Pictures of LeviLauncher for Windows

The pictures of [Play with mods on Windows](../../../content/play/play-with-mods.md)
(`content/play/images/<lang>/play-with-mods-*.svg`) are made here, from the real interface of LeviLauncher v1.1.0 with
fake data. Read [SHOTS.md](../SHOTS.md) first.

LeviLauncher's interface is React in a WebView, and LeviLauncher has a preview of it in the browser for its own tests:
`npm run dev:ui-review` in its `frontend/` serves the interface with every Go binding replaced by a fixture
(`frontend/e2e/support/ui-fixture.js`). `capture.mjs` uses that preview, with the data of this folder on top:

| File | |
|---|---|
| `capture.mjs` | checks out LeviLauncher, starts the preview, drives it in Chromium for each picture and each language, and writes `captures/`, `shots.json` and the SVGs. |
| `preview.config.mjs` | the Vite config: LeviLauncher's preview config, plus `fixture.js`, on port 5179. |
| `fixture.js` | the state of the launcher in each scene (first launch, nothing downloaded, downloaded, installed, with LeviOptimize, GameInput missing): an instance "Survival" of 1.26.60.05 with LeviLamina 26.60.7 under `D:\LeviLauncher`, no Microsoft account. |
| `data/` | the real catalogues the pictures show, as they were on the day of the capture: Minecraft's GDK releases and the LeviLamina versions (`catalogues.json`), and LeviOptimize in the LeviMC Mods catalogue (`mods/`). `refresh-data.mjs` fetches them again. |
| `shots.json` | the specs the last run wrote: the targets, read from the live interface, and the annotations. |
| `captures/` | the captures (2×, WebP), not committed: the SVGs embed them. |

## Making the pictures

You need Git, Go and [`wails3`](https://v3.wails.io/) (v3.0.0-beta.19, for the bindings of the interface), Node.js,
and Playwright with Chromium:

```sh
cd tutorials
npm i --no-save playwright && npx playwright install chromium     # once
node scripts/shots/levilauncher-windows/capture.mjs                # every picture
node scripts/shots/levilauncher-windows/capture.mjs --only play-with-mods-06-launch
```

The first run clones LeviLauncher at `v1.1.0` into `%TEMP%\levimc-shots\LeviLauncher-v1.1.0` (or uses the checkout in
`LEVILAUNCHER_DIR`), creates the two embedded files a fresh checkout lacks (`internal/leviloader/LeviLauncher.dll`,
`frontend/dist/index.html`) as empty files, generates the bindings (`wails3 generate bindings -clean=true`) and installs
the frontend (`npm ci`). `LEVIMC_PW_DIR` names a folder where Playwright is installed, if not in `tutorials/`;
`LEVIMC_SHOTS_PORT` another port than 5179.

Each picture is captured in a fresh browser, at 1024 × 640 (the window of LeviLauncher), in the light theme, with
reduced motion, in UTC, after the window has stopped changing. Every screen goes through `assertDesensitized`. Running
it again gives the same SVGs: `git status` shows only what changed.

Look at every picture before you commit it, on a light and on a dark page.

## When LeviLauncher changes

- A new version: change `TAG` in `capture.mjs`, delete the old checkout (or point `LEVILAUNCHER_DIR` at the new one),
  run it, and read the pictures and the tutorial again: texts, buttons and steps may have moved.
- A step fails to find something: the steps find things by the texts of LeviLauncher's own locale files
  (`t('<key>')`), by roles and by a few test ids. The error names what it waited for; compare with the source of
  the page in the checkout (`frontend/src/pages/`) and fix the step.
- New versions of the game or of LeviOptimize: `node scripts/shots/levilauncher-windows/refresh-data.mjs`, then change
  `INSTANCE` in `capture.mjs` (and the version numbers in the tutorial) if the newest version with LeviLamina changed.
