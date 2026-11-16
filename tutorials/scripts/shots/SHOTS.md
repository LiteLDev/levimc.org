# Pictures of the apps

This page is for whoever writes the tutorials. It is not a page of the site (it is not under `content/`).

The pictures of the launchers and the other apps with a window are not screenshots of somebody's desktop. Each is an
SVG file drawn from a capture of the **real interface** of the app, made by a script that starts the app with **fake
data**, takes the screen at 2× pixel density, and reads where the things to point at are from the live interface.
The annotations are drawn above the capture as vectors, in the visual language of lip's pictures of its terminal
interface (lip: `docs/SCREENSHOTS.md`), so that every tutorial of the site points at things the same way.

```
tutorials/scripts/shots/
  annotate.mjs        the annotator: a spec and a capture → one SVG per language (CLI and module)
  annotate.test.mjs   its tests: npm run shots:test
  demo/               capture.mjs (an example capture script, on mock pages), shots.json, captures/, out/
  <app>/              the capture script of each app, with its specs (added with the tutorials of the app)
  levilauncher-windows/   LeviLauncher for Windows, for play/play-with-mods (its README.md says how to run it)
tutorials/content/<section>/images/<lang>/<name>.svg     the pictures: en, zh-Hans, zh-Hant
```

## Making the pictures

```sh
cd tutorials
npm run shots:annotate -- scripts/shots/<app>/shots.json --out content/<section>/images
```

`node scripts/shots/annotate.mjs <spec.json>... [--out <dir>]` writes `<dir>/<lang>/<name>.svg` for every spec and
every language of the files. A spec file holds one spec or an array of them; the paths in it are relative to the
file, and `"out"` in a spec names the directory when `--out` is not given. A file that would not change is not
touched, and the same spec and captures give the same bytes, so `git status` after a run shows only what really
changed. Open the changed pictures in a browser, on a light and on a dark page, before you commit them.

A capture script (`scripts/shots/<app>/`) imports the module instead:

```js
import { assertDesensitized, writeShots } from '../annotate.mjs';

assertDesensitized(await page.evaluate(() => document.body.innerText)); // before every capture
await writeShots(spec, 'content/play/images', { baseDir: here });      // or renderShot(spec, lang) → string
```

| Export | |
|---|---|
| `renderShot(spec, lang, { baseDir })` | the SVG of a spec in a language, as a string. |
| `writeShots(spec, outDir, { baseDir })` | draws every language first, then writes `<outDir>/<lang>/<name>.svg` where it changed; returns `[{ lang, file, changed }]`. |
| `assertDesensitized(text, extra?)` | throws when the text shows something of the machine or the person (see "Desensitizing"). |
| `readSpecFile(file)`, `imageInfo(bytes)`, `textWidth(text)`, `wrap(text, columns)`, `fmt(number)` | helpers the CLI and the tests use. |

The demo (`scripts/shots/demo/`) is the smallest complete example: `capture.mjs` draws two mock screens in Chromium
with Playwright (`npm i --no-save playwright && npx playwright install chromium` once), reads the rectangles of the
elements marked `data-shot`, and writes the captures and `shots.json`; the annotator then writes `out/`.

## The spec

```json
{
  "name": "play-03-launch",
  "title": {
    "en": "The Instances page of LeviLauncher, with the instance \"Survival\" selected.",
    "zh-Hans": "LeviLauncher 的“实例”页面，选中了实例“Survival”。",
    "zh-Hant": "LeviLauncher 的「實例」頁面，選取了實例「Survival」。"
  },
  "languages": ["en", "zh-Hans", "zh-Hant"],
  "image": { "en": "captures/en/instances.png", "zh-Hans": "captures/zh-Hans/instances.png", "zh-Hant": "captures/zh-Hant/instances.png" },
  "scale": 2,
  "crop": { "x": 0, "y": 0, "width": 960, "height": 540 },
  "frame": "windows",
  "notes": [
    { "kind": "box", "target": { "x": 132, "y": 96, "width": 380, "height": 44 } },
    {
      "kind": "arrow", "side": "right",
      "target": { "en": { "x": 430, "y": 104, "width": 70, "height": 28 }, "zh-Hans": { "x": 448, "y": 104, "width": 52, "height": 28 }, "zh-Hant": { "x": 448, "y": 104, "width": 52, "height": 28 } },
      "label": { "en": "Starts the game", "zh-Hans": "启动游戏", "zh-Hant": "啟動遊戲" }
    },
    { "kind": "callout", "n": 1, "target": { "x": 8, "y": 80, "width": 104, "height": 28 },
      "label": { "en": "Every instance is a game version with its own mods.", "zh-Hans": "每个实例是一个游戏版本，有自己的模组。", "zh-Hant": "每個實例是一個遊戲版本，有自己的模組。" } },
    { "kind": "keys", "caption": { "en": "Or press", "zh-Hans": "或按", "zh-Hant": "或按" }, "keys": ["Ctrl", "Enter"] }
  ]
}
```

| Field | |
|---|---|
| `name` | `<topic>-<nn>-<what>`, lower case with hyphens (see "Names"). The file is `<lang>/<name>.svg`. |
| `title` | the `<title>` of the SVG, for screen readers; usually the alternative text of the page. Default: the name. |
| `languages` | default `["en", "zh-Hans", "zh-Hant"]`. |
| `image` | the capture: a PNG, JPEG or WebP file (or, from a script, its bytes). Its size is read from its header; it is embedded as it is, never re-encoded. |
| `scale` | the device pixel ratio of the capture (default 1): the picture shows it at its pixels ÷ scale, so a 2× capture is sharp on a high-density screen. |
| `crop` | `{ x, y, width, height }` in CSS pixels of the capture: the part shown (a nested `viewBox`, the file keeps the whole image). |
| `frame` | `windows` (default): the capture as a window with rounded corners, a thin border and a soft shadow; the launcher draws its own title bar, so there is none. `android`: a phone held in landscape, a dark body around the screen with the camera in its left side. `none`: the capture alone. |
| `notes` | the annotations, below. |

Every value but `name` and `languages` may be given per language, as an object whose keys are the languages:
`"image": { "en": …, "zh-Hans": … }`. Each language has its own capture, since the interface is in that language,
and so its targets usually differ too: text is wider or narrower, and moves what follows it.

**Targets** are `{ x, y, width, height }` in CSS pixels of what the picture shows: of the capture, or, with `crop`,
from the top left of the crop. Take them from the live interface (`getBoundingClientRect()` relative to the
captured element, or the app's own layout), never by eye: they then follow the interface when it changes.

**Labels** (`label`, `caption`) are always given per language, with a text for every language of the spec. Write
the real Traditional Chinese terms, not a conversion of the Simplified text. Key names (`keys`) may be one list for
all languages.

The annotator fails, and writes nothing for the spec, when a target lies outside what the picture shows (by more
than half a pixel), when a label has no text for a language, when an image is not a PNG, JPEG or WebP, or when a
file would be larger than 600 KB (crop the capture, or capture a smaller window).

## Annotations

They are drawn in an orange (`#ffa94d`) with dark outlines, and their texts on orange or on a dark panel, so they
read on a light and on a dark interface, and on the light and the dark theme of the site.

| `kind` | Draws | Fields |
|---|---|---|
| `box` | a rounded box around the target. | `target` |
| `ellipse` | an ellipse around the target: for something small or round, an icon. | `target` |
| `focus` | dims the screen but for the target; several targets (an array, or several `focus` notes) stay bright. | `target` (or `[target, …]`) |
| `arrow` | a label in the margin at that side of the window, with an arrow to the target. The picture grows by the margin. | `target`, `label`, `side` (default `right`) |
| `callout` | a numbered circle at that side of the target. With a `label`, the panel below the window says what the number stands for. | `target`, `n`, `label` (optional), `side` (default `left`) |
| `keys` | the keys to press next, as badges in the panel below the window, after an optional caption. | `keys`, `caption` (optional) |

- **One picture, one point.** Keep the notes few: a box or a focus on what the step is about, maybe one arrow that
  says what to do with it. A picture that needs three callouts is usually two steps.
- An arrow from the left or the right crosses everything between the margin and its target, at the height of the
  target: choose the side with nothing in between, or `top` and `bottom`. Labels on one side are moved apart when
  they would overlap, in the order of their targets.
- An arrow's label is a few words (it stays on one line); a callout's legend may be a sentence.
- Use `focus` for a dialog or a panel on a busy screen; `box` for one control; `ellipse` for an icon.

## Names and where pictures go

- A picture is named `<topic>-<nn>-<what>`: `play-with-mods-05-install`, `android-launcher-04-import`. The
  topic is the tutorial, `nn` the order within it from `01`. A name is used once in the tutorials.
- The pictures of a page are in `tutorials/content/<section>/images/<lang>/<name>.svg`, next to the English page.
- A page refers to them relatively. From `content/play/play-with-mods.md`:

  ```markdown
  ![The "Launch" page of LeviLauncher: the "Current Instance" is "Survival", with LeviLamina, and "Launch" starts it.](./images/en/play-with-mods-06-launch.svg)
  ```

  and from `content/zh-Hans/play/play-with-mods.md`:

  ```markdown
  ![LeviLauncher 的“启动”页面：“当前实例”为“Survival”，装有 LeviLamina，“启动”按钮启动它。](../../play/images/zh-Hans/play-with-mods-06-launch.svg)
  ```

- Nobody writes the Traditional Chinese pages: they are converted from the Simplified ones, and a separate change
  makes a converted page use `images/zh-Hant/…` in place of `images/zh-Hans/…` wherever that file exists. Write the
  zh-Hant pictures, and the zh-Hans page refers to the zh-Hans ones.
- **Alternative text**: always, one sentence in the language of the page that names the screen and says what matters
  in it, for whoever cannot see the picture. Labels of the interface in quotes, as the interface writes them in
  that language.
- The site scales a picture down to the width of the text (about 700 pixels); capture a window of about 960 × 540
  CSS pixels or less, so that its text is still readable there.

## Desensitizing

A picture shows only fake data. The capture scripts make it so, and check it:

- Start the app with a profile, a settings file or a data directory made for the pictures, never your own: instance
  names like "Survival" and "Creative", paths under `D:\LeviLauncher` (on Android, the app's own storage), version
  numbers of current releases. No account is signed in; where the interface shows a player name, use "Steve".
- Call `assertDesensitized(text, extra)` on everything the screen shows (`document.body.innerText`, the values of
  inputs, the window title) before every capture. It fails when the text holds the user name of the OS (when it has
  3 characters or more), the home directory (with either slash), anything like an e-mail address, or any string of
  `extra` (case-insensitive): pass the names of real accounts, machines or servers that the app might know.
- The text check cannot see into images. Look at every capture: no avatar, no real world thumbnail, no notification
  of the machine, no clock or battery of your phone (hide the status bar, or capture the app's view only).
- Do not capture the desktop, the taskbar or a window of another app: capture the window of the app, or its view.

## Limits

- The capture is a raster image: its text cannot be selected or searched, and does not follow the reader's font
  size. Keep it the size of the app's window, at 2×.
- The labels of the annotations are text in the reader's font (a sans-serif with Chinese characters). Their width is
  fixed (7.8 pixels a column, Chinese two columns) whatever the font, so they never overflow their pills.
- JPEG orientation (EXIF) is ignored: give upright captures.
