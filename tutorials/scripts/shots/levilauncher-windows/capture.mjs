// The pictures of the tutorial "Play with mods on Windows" (content/play/play-with-mods.md), from the real interface of
// LeviLauncher for Windows with fake data. See README.md in this folder.
//
// It checks out LeviLauncher at TAG, starts its own UI preview (the React interface in Vite, every Go binding mocked by
// LeviLauncher's e2e fixture) with the data of this folder (fixture.js, data/), drives it in Chromium with Playwright
// in each language, checks every screen with assertDesensitized, reads the rectangles to point at from the live page,
// and writes captures/<lang>/<name>.webp, shots.json and content/play/images/<lang>/<name>.svg.
//
//   node scripts/shots/levilauncher-windows/capture.mjs [--only <name>,...]
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertDesensitized, writeShots } from '../annotate.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const tutorials = path.resolve(here, '../../..');
const OUT = path.join(tutorials, 'content/play/images');
const REPO = 'https://github.com/LiteLDev/LeviLauncher.git';
const TAG = 'v1.1.0';
const PORT = Number(process.env.LEVIMC_SHOTS_PORT || 5179);
const BASE = `http://127.0.0.1:${PORT}/`;
/** The languages of the pictures, and the locale of LeviLauncher each is captured in (zh_HK: its Traditional UI). */
const LOCALES = { en: 'en_US', 'zh-Hans': 'zh_CN', 'zh-Hant': 'zh_HK' };
const BROWSER_LOCALES = { en: 'en-US', 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-HK' };
/** The window of LeviLauncher (frameless, 1024 × 640 CSS pixels), captured at 2×. */
const WINDOW = { width: 1024, height: 640 };
const SCALE = 2;
/** Lossy WebP at this quality is a third of the size of the PNG, without a difference one can see at 2×. */
const WEBP_QUALITY = 0.95;
/** The instance of the pictures: the newest GDK release that LeviLamina supports in data/catalogues.json. */
const INSTANCE = { name: 'Survival', gameVersion: '1.26.60.05', leviLamina: '26.60.7' };
const MOD_ID = 'github.com/LiteLDev/LeviOptimize';

const only = (() => {
  const i = process.argv.indexOf('--only');
  return i > 0 ? new Set(String(process.argv[i + 1] || '').split(',').filter(Boolean)) : null;
})();
const TYPES = { '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };

// ---------------------------------------------------------------------------------------------------------------------
// LeviLauncher and its preview

/** Runs a command; npm, npx and wails3 are scripts (.cmd) on Windows, which only a shell runs: their arguments are plain. */
function run(command, args, { shell = process.platform === 'win32', ...options } = {}) {
  const line = [command, ...args].join(' ');
  console.log(`> ${line}`);
  const result = shell
    ? spawnSync(line, { stdio: 'inherit', shell: true, ...options })
    : spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) throw new Error(`${line} failed (${result.status ?? result.error}).`);
}

/** A checkout of LeviLauncher at TAG, ready for its UI preview: LEVILAUNCHER_DIR, or one made under the temp folder. */
function prepareLauncher() {
  const dir = path.resolve(process.env.LEVILAUNCHER_DIR || path.join(os.tmpdir(), 'levimc-shots', `LeviLauncher-${TAG}`));
  if (!existsSync(path.join(dir, 'go.mod'))) {
    mkdirSync(path.dirname(dir), { recursive: true });
    run('git', ['clone', '--quiet', '--depth', '1', '--branch', TAG, REPO, dir], { shell: false });
  }
  const tags = spawnSync('git', ['-C', dir, 'tag', '--points-at', 'HEAD'], { encoding: 'utf8' }).stdout || '';
  if (!tags.split(/\s+/).includes(TAG)) console.warn(`warning: ${dir} is not at ${TAG}; the pictures are of ${TAG}.`);
  // The Go packages embed files that a fresh checkout lacks (built by LeviLauncher's own build); the bindings need
  // the packages to load, not the files.
  for (const file of ['internal/leviloader/LeviLauncher.dll', 'frontend/dist/index.html']) {
    const target = path.join(dir, file);
    if (!existsSync(target)) {
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, '');
    }
  }
  const frontend = path.join(dir, 'frontend');
  // frontend/bindings is generated, and not in the repository (LeviLauncher's build/Taskfile.yml: generate:bindings).
  if (!existsSync(path.join(frontend, 'bindings'))) run('wails3', ['generate', 'bindings', '-clean=true'], { cwd: dir });
  if (!existsSync(path.join(frontend, 'node_modules'))) run('npm', ['ci', '--no-audit', '--no-fund'], { cwd: frontend });
  const support = path.join(frontend, 'e2e/support');
  copyFileSync(path.join(here, 'preview.config.mjs'), path.join(support, 'levimc-shots.config.mjs'));
  copyFileSync(path.join(here, 'fixture.js'), path.join(support, 'levimc-shots-fixture.js'));
  return dir;
}

async function startPreview(dir) {
  // The config asks Vite for this port only (strictPort): a server already there (a run that was killed) would be
  // taken for this one, with its old fixture.
  const busy = await fetch(BASE).then(
    () => true,
    () => false,
  );
  if (busy) throw new Error(`Something already answers on ${BASE}: stop it, or set LEVIMC_SHOTS_PORT.`);
  const child = spawn('npx vite --config e2e/support/levimc-shots.config.mjs', {
    cwd: path.join(dir, 'frontend'),
    env: { ...process.env, LEVIMC_SHOTS_PORT: String(PORT) },
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // Vite's output is shown only when it fails.
  let log = '';
  for (const stream of [child.stdout, child.stderr]) stream.on('data', (chunk) => (log = (log + chunk).slice(-8000)));
  let stopping = false;
  child.on('exit', (code) => {
    if (code && !stopping) console.error(log);
  });
  const stop = () => {
    if (child.exitCode !== null) return;
    stopping = true;
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill();
  };
  process.once('SIGINT', () => {
    stop();
    process.exit(130);
  });
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error(`The preview stopped (exit ${child.exitCode}); is port ${PORT} free?`);
    try {
      if ((await fetch(BASE)).ok) return stop;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  stop();
  throw new Error(`The preview did not start on ${BASE}.`);
}

async function loadPlaywright() {
  if (process.env.LEVIMC_PW_DIR) return createRequire(path.join(process.env.LEVIMC_PW_DIR, 'noop.js'))('playwright');
  return import('playwright');
}

// ---------------------------------------------------------------------------------------------------------------------
// The data and the texts of the launcher

const json = (file) => JSON.parse(readFileSync(file, 'utf8'));

function flatten(object, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(object)) {
    const name = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') flatten(value, name, out);
    else out[name] = String(value);
  }
  return out;
}

/** t(lang, key): a text of LeviLauncher in a language, from its own locale files, to find things by what they say. */
function translator(dir) {
  const tables = Object.fromEntries(
    Object.entries(LOCALES).map(([lang, code]) => [lang, flatten(json(path.join(dir, `frontend/src/assets/locales/${code}.json`)))]),
  );
  return (lang, key) => {
    const text = tables[lang][key];
    if (text === undefined) throw new Error(`LeviLauncher has no text "${key}" in ${LOCALES[lang]}.`);
    return text;
  };
}

function pageData(dir) {
  const catalogues = json(path.join(here, 'data/catalogues.json'));
  const mod = json(path.join(here, `data/mods/${MOD_ID}/index.json`));
  return {
    releaseVersions: catalogues.releaseVersions,
    leviLaminaVersionDB: catalogues.leviLaminaVersionDB,
    languages: json(path.join(dir, 'internal/lang/language_names.json')),
    instance: INSTANCE,
    mod: { version: mod.latest.version, description: mod.description },
  };
}

/** Serves levimc.org/api/v4/mods/ and the icons of the mods from data/mods/; every other request off the machine fails. */
async function routeNetwork(context) {
  await context.route(/^https?:\/\/(?!127\.0\.0\.1[:/])/, async (route) => {
    const url = new URL(route.request().url());
    const match = url.hostname === 'levimc.org' && /^\/(?:api\/v4\/)?mods\/(.+)$/.exec(url.pathname);
    const file = match && path.join(here, 'data/mods', match[1].endsWith('/') ? `${match[1]}index.json` : match[1]);
    if (!file || !existsSync(file)) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({
      body: readFileSync(file),
      headers: { 'access-control-allow-origin': '*', 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' },
    });
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// Driving the launcher

/**
 * The rectangle of the element `locator` names, in CSS pixels of the window. With visible, the rectangle of the
 * smallest element around it of at least 20 × 12 pixels: a control whose own input is hidden (a switch) is drawn by
 * the element around the input.
 */
async function box(locator, { visible = false } = {}) {
  const b = visible
    ? await locator.first().evaluate((el) => {
        let r = el.getBoundingClientRect();
        while ((r.width < 20 || r.height < 12) && el.parentElement) {
          el = el.parentElement;
          r = el.getBoundingClientRect();
        }
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      })
    : await locator.first().boundingBox();
  if (!b) throw new Error(`Nothing to point at: ${locator}`);
  return { x: b.x, y: b.y, width: b.width, height: b.height };
}

/**
 * The rectangle of the smallest element around the text `text` (the innermost element whose whole text it is) that is
 * at least minWidth wide and, with bordered, has a border: a row or a card of the page found by what it says.
 */
async function around(page, text, { minWidth = 0, bordered = false } = {}) {
  const r = await page.evaluate(
    ([text, minWidth, bordered]) => {
      const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
      const matches = [...document.querySelectorAll('body *')].filter(
        (el) => visible(el) && el.innerText?.trim() === text && ![...el.children].some((c) => c.innerText?.trim() === text),
      );
      for (let el of matches) {
        while (el && el !== document.body) {
          const b = el.getBoundingClientRect();
          const border = parseFloat(getComputedStyle(el).borderTopWidth) > 0;
          if (b.width >= minWidth && (!bordered || border)) return { x: b.x, y: b.y, width: b.width, height: b.height };
          el = el.parentElement;
        }
      }
      return null;
    },
    [text, minWidth, bordered],
  );
  if (!r) throw new Error(`Nothing around "${text}" ${minWidth} wide${bordered ? ' with a border' : ''}.`);
  return r;
}

const union = (...rects) => {
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  return {
    x,
    y,
    width: Math.max(...rects.map((r) => r.x + r.width)) - x,
    height: Math.max(...rects.map((r) => r.y + r.height)) - y,
  };
};

/** Waits until the window stops changing: fonts loaded, nothing focused or hovered, two equal frames in a row. */
async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: '*, *::before, *::after { caret-color: transparent !important; }' });
  await page.evaluate(() => document.activeElement?.blur?.());
  // An empty spot of the sidebar, between its pages and the theme switch: no hover effect anywhere.
  await page.mouse.move(28, 480);
  let previous = null;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(250);
    const frame = await page.screenshot();
    if (previous && frame.equals(previous)) return;
    previous = frame;
  }
  throw new Error('The window does not stop changing.');
}

/** What the window shows as text, for assertDesensitized: the text, the values of the inputs, the title. */
const shownText = (page) =>
  page.evaluate(() =>
    [document.title, document.body.innerText, ...[...document.querySelectorAll('input, textarea')].map((el) => el.value)].join('\n'),
  );

/** Encodes a PNG as WebP in Chromium (the canvas of a blank page). */
async function toWebP(encoder, png) {
  const dataUrl = await encoder.evaluate(
    async ([base64, quality]) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      return canvas.toDataURL('image/webp', quality);
    },
    [png.toString('base64'), WEBP_QUALITY],
  );
  return Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
}

// ---------------------------------------------------------------------------------------------------------------------
// The pictures
//
// Each shot opens the launcher in a scene of fixture.js (scene, at hash), runs its steps, sizes the window (height,
// for a page longer than the window), and measures its targets; `notes` turns the targets into the annotations.
// L(en, zh-Hans, zh-Hant) is a text in the three languages.

const L = (en, zhHans, zhHant) => ({ en, 'zh-Hans': zhHans, 'zh-Hant': zhHant });

/** Opens the LeviMC Mods page from the Content Download card of the Launch page, and searches for LeviOptimize. */
async function searchMods(page, t) {
  await page.getByText(t('lip.title'), { exact: true }).first().click();
  await page.getByPlaceholder(t('lip.search_placeholder')).fill('LeviOptimize');
  await page.keyboard.press('Enter');
  await page.getByText('LeviOptimize', { exact: true }).first().waitFor();
}

/** ... opens LeviOptimize, presses its Install, and waits for the tab of its versions. */
async function modVersions(page, t, version) {
  await searchMods(page, t);
  await page.getByText('LeviOptimize', { exact: true }).first().click();
  await page.getByRole('button', { name: t('lip.files.install'), exact: true }).first().click();
  await page.locator(`button[aria-label*="LeviOptimize ${version}"]`).waitFor();
}

const SHOTS = [
  {
    name: 'play-with-mods-01-first-launch',
    title: L(
      'The "First Launch Setup" of LeviLauncher: the "Base Root" is D:\\LeviLauncher, and "Start using LeviLauncher" finishes the setup.',
      'LeviLauncher 的“首次启动引导”：“根目录”为 D:\\LeviLauncher，“开始使用 LeviLauncher”完成引导。',
      'LeviLauncher 的「首次啟動引導」：「根目錄」為 D:\\LeviLauncher，「開始使用 LeviLauncher」完成引導。',
    ),
    scene: 'onboarding',
    hash: '/onboarding',
    targets: async (page, t) => ({
      root: union(await around(page, t('settings.body.paths.base_root')), await box(page.getByRole('textbox'))),
      start: await box(page.getByRole('button', { name: t('audit.usability.start_using') })),
    }),
    notes: (r) => [
      { kind: 'box', target: r('root') },
      {
        kind: 'callout', n: 1, side: 'left', target: r('root'),
        label: L(
          'Where LeviLauncher keeps the instances: a drive with a few GB free. "Browse…" to change it, then "Apply".',
          'LeviLauncher 存放实例的位置：选一个还有几 GB 空间的磁盘。用“选择…”更改，再点“应用”。',
          'LeviLauncher 存放實例的位置：選一個還有幾 GB 空間的磁碟。用「選擇…」更改，再按「套用」。',
        ),
      },
      { kind: 'arrow', side: 'right', target: r('start'), label: L('Finish the setup', '完成引导', '完成引導') },
    ],
  },
  {
    name: 'play-with-mods-02-download',
    title: L(
      'The "Download" page of LeviLauncher with "GDK" and the "Release" type: version 1.26.60.05 shows "LeviLamina" in the "Loader" column.',
      'LeviLauncher 的“下载”页面，选了“GDK”和“正式版”类型：版本 1.26.60.05 的“加载器”一栏显示“LeviLamina”。',
      'LeviLauncher 的「下載」頁面，選了「GDK」和「正式版」類型：版本 1.26.60.05 的「載入器」一欄顯示「LeviLamina」。',
    ),
    scene: 'fresh',
    hash: '/download',
    steps: async (page) => page.locator('tr', { hasText: INSTANCE.gameVersion }).waitFor(),
    targets: async (page, t) => {
      const row = page.locator('tr', { hasText: INSTANCE.gameVersion });
      return {
        filters: union(
          await box(page.getByRole('button', { name: t('uwp.package_type'), exact: true })), // it shows "GDK"
          await box(page.getByRole('button', { name: t('downloadpage.topcontent.types'), exact: true })),
        ),
        row: await box(row),
        download: await box(row.getByRole('button')),
      };
    },
    notes: (r) => [
      { kind: 'box', target: r('filters') },
      {
        kind: 'callout', n: 1, side: 'bottom', target: r('filters'),
        label: L(
          'The package type "GDK", and "Release" under "Types": both are already chosen when you open the page.',
          '包类型“GDK”，以及“类型”中的“正式版”：打开页面时就已经选好了。',
          '套件類型「GDK」，以及「類型」中的「正式版」：開啟頁面時就已經選好了。',
        ),
      },
      { kind: 'box', target: r('row') },
      { kind: 'arrow', side: 'right', target: r('download'), label: L('Download this version', '下载这个版本', '下載這個版本') },
    ],
  },
  {
    name: 'play-with-mods-03-mirror',
    title: L(
      'The dialog "Select Download Mirror" for Release 1.26.60.05: the fastest mirror is selected, and "Download from Selected Mirror" starts the download.',
      '正式版 1.26.60.05 的“选择下载镜像”对话框：已选中最快的镜像，“用所选镜像下载”开始下载。',
      '正式版 1.26.60.05 的「選擇下載鏡像」對話框：已選取最快的鏡像，「以所選鏡像下載」開始下載。',
    ),
    scene: 'fresh',
    hash: '/download',
    steps: async (page) => {
      await page.locator('tr', { hasText: INSTANCE.gameVersion }).getByRole('button').click();
      await page.getByRole('dialog').waitFor();
    },
    targets: async (page, t) => {
      const dialog = page.getByRole('dialog');
      return {
        // The card of the recommended mirror: the first with the thick border of a selectable mirror.
        best: await box(dialog.locator('.border-2').first()),
        download: await box(dialog.getByRole('button', { name: t('downloadpage.mirror.download_selected') })),
      };
    },
    notes: (r) => [
      { kind: 'box', target: r('best') },
      {
        kind: 'callout', n: 1, side: 'left', target: r('best'),
        label: L(
          'LeviLauncher tests the mirrors and selects the fastest.',
          'LeviLauncher 会测试各个镜像，并选中最快的那个。',
          'LeviLauncher 會測試各個鏡像，並選取最快的那個。',
        ),
      },
      { kind: 'arrow', side: 'right', target: r('download'), label: L('Start the download', '开始下载', '開始下載') },
    ],
  },
  {
    name: 'play-with-mods-04-download-complete',
    title: L(
      'The dialog "Download complete" for "Release 1.26.60.05.msixvc", with the buttons "Later" and "Install now".',
      '“Release 1.26.60.05.msixvc”的“下载完成”对话框，按钮为“稍后再说”和“立即安装”。',
      '「Release 1.26.60.05.msixvc」的「下載完成」對話框，按鈕為「稍後再說」和「立即安裝」。',
    ),
    scene: 'downloaded',
    hash: '/download',
    steps: async (page) => page.getByRole('dialog').waitFor(),
    targets: async (page, t) => ({
      install: await box(page.getByRole('dialog').getByRole('button', { name: t('download_manager.install_prompt.confirm') })),
    }),
    notes: (r) => [
      { kind: 'arrow', side: 'right', target: r('install'), label: L('Go on to install it', '接着安装它', '接著安裝它') },
    ],
  },
  {
    name: 'play-with-mods-05-install',
    title: L(
      'The page "Install Instance" for Release 1.26.60.05: the name "Survival", "Install LeviLamina" on with the newest "LeviLamina Version", "Instance isolation" on, and the button "Install".',
      '正式版 1.26.60.05 的“安装实例”页面：名称为“Survival”，“安装 LeviLamina”已打开并选了最新的“LeviLamina 版本”，“实例隔离”已打开，还有“安装”按钮。',
      '正式版 1.26.60.05 的「安裝實例」頁面：名稱為「Survival」，「安裝 LeviLamina」已開啟並選了最新的「LeviLamina 版本」，「實例隔離」已開啟，還有「安裝」按鈕。',
    ),
    scene: 'downloaded',
    hash: '/download',
    steps: async (page, t) => {
      await page.getByRole('dialog').getByRole('button', { name: t('download_manager.install_prompt.confirm') }).click();
      await page.getByText(t('downloadpage.install_folder.confirm_title'), { exact: true }).waitFor();
      await page.getByRole('textbox').first().fill(INSTANCE.name); // the first field of the page: the name
      await page.getByText(t('downloadpage.install_folder.enable_isolation'), { exact: true }).waitFor();
    },
    // The whole page, which is longer than the window: the height of its scrolling content.
    height: (page) =>
      page.evaluate(() => {
        const scrollers = [...document.querySelectorAll('#main-content *')].filter(
          (el) => ['auto', 'scroll'].includes(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight,
        );
        if (scrollers.length === 0) throw new Error('The install page does not scroll: no height to grow to.');
        return Math.max(...scrollers.map((el) => el.scrollHeight - el.clientHeight)) + window.innerHeight;
      }),
    targets: async (page, t) => ({
      name: await box(page.getByRole('textbox').first()),
      leviLamina: union(
        await around(page, t('downloadpage.install.levilamina_label'), { minWidth: 800, bordered: true }),
        await around(page, t('downloadpage.install.ll_version_label'), { minWidth: 800, bordered: true }),
      ),
      isolation: await around(page, t('downloadpage.install_folder.enable_isolation'), { minWidth: 800, bordered: true }),
      install: await box(page.getByRole('button', { name: t('downloadpage.mirror.install_button'), exact: true })),
    }),
    notes: (r) => [
      {
        kind: 'callout', n: 1, side: 'left', target: r('name'),
        label: L('The name of the instance: Survival.', '实例的名称：Survival。', '實例的名稱：Survival。'),
      },
      { kind: 'box', target: r('leviLamina') },
      {
        kind: 'callout', n: 2, side: 'left', target: r('leviLamina'),
        label: L(
          'On, with the newest version: LeviLamina is installed with the game.',
          '保持打开，选最新版本：LeviLamina 会和游戏一起安装。',
          '保持開啟，選最新版本：LeviLamina 會和遊戲一起安裝。',
        ),
      },
      { kind: 'box', target: r('isolation') },
      {
        kind: 'callout', n: 3, side: 'left', target: r('isolation'),
        label: L(
          'On: the worlds and settings of the instance stay in its own folder.',
          '保持打开：实例的世界和设置保存在它自己的文件夹里。',
          '保持開啟：實例的世界和設定保存在它自己的資料夾裡。',
        ),
      },
      { kind: 'arrow', side: 'right', target: r('install'), label: L('Then install', '然后安装', '然後安裝') },
    ],
  },
  {
    name: 'play-with-mods-06-launch',
    title: L(
      'The "Launch" page of LeviLauncher: the "Current Instance" is "Survival", with LeviLamina, and "Launch" starts it.',
      'LeviLauncher 的“启动”页面：“当前实例”为“Survival”，装有 LeviLamina，“启动”按钮启动它。',
      'LeviLauncher 的「啟動」頁面：「目前實例」為「Survival」，裝有 LeviLamina，「啟動」按鈕啟動它。',
    ),
    scene: 'installed',
    hash: '/',
    steps: async (page, t) => page.getByTestId('primary-launch-button').waitFor(),
    targets: async (page, t) => ({
      // The button of the instance picker: it says "Current Instance" and the name.
      instance: await box(page.getByRole('button', { name: t('launcherpage.currentVersion') })),
      launch: await box(page.getByTestId('primary-launch-button')),
      gear: await box(page.getByRole('button', { name: t('launcherpage.tip.quick_actions_menu') })),
    }),
    notes: (r) => [
      { kind: 'box', target: r('instance') },
      { kind: 'arrow', side: 'right', target: r('launch'), label: L('Start the game', '启动游戏', '啟動遊戲') },
      { kind: 'ellipse', target: r('gear') },
      {
        kind: 'callout', n: 1, side: 'bottom', target: r('gear'),
        label: L(
          'The quick actions of the instance; the first is "Instance Settings".',
          '实例的快捷操作，第一项是“实例设置”。',
          '實例的快捷操作，第一項是「實例設定」。',
        ),
      },
    ],
  },
  {
    name: 'play-with-mods-07-gameinput',
    title: L(
      'The dialog "GameInput Component Missing" on the Launch page, with the buttons "Quit Launcher" and "Install Now".',
      '“启动”页面上的“缺少 GameInput 组件”对话框，按钮为“退出启动器”和“立即安装”。',
      '「啟動」頁面上的「缺少 GameInput 元件」對話框，按鈕為「退出啟動器」和「立即安裝」。',
    ),
    scene: 'prerequisite',
    hash: '/',
    steps: async (page) => page.getByRole('dialog').waitFor(),
    targets: async (page, t) => ({
      install: await box(page.getByRole('dialog').getByRole('button', { name: t('launcherpage.gameinput.missing.install_now') })),
    }),
    notes: (r) => [
      { kind: 'arrow', side: 'right', target: r('install'), label: L('Install what is missing', '安装缺少的组件', '安裝缺少的元件') },
    ],
  },
  {
    name: 'play-with-mods-08-levimc-mods',
    title: L(
      'The page "LeviMC Mods" in LeviLauncher, searched for LeviOptimize: one result, by LiteLDev.',
      'LeviLauncher 的“LeviMC 模组”页面，搜索了 LeviOptimize：一个结果，作者是 LiteLDev。',
      'LeviLauncher 的「LeviMC 模組」頁面，搜尋了 LeviOptimize：一個結果，作者是 LiteLDev。',
    ),
    scene: 'installed',
    hash: '/',
    steps: searchMods,
    targets: async (page, t) => ({
      search: await box(page.getByPlaceholder(t('lip.search_placeholder'))),
      mod: await around(page, 'LeviOptimize', { minWidth: 800 }),
    }),
    notes: (r) => [
      { kind: 'box', target: r('search') },
      { kind: 'arrow', side: 'bottom', target: r('mod'), label: L('Open the mod', '打开这个模组', '打開這個模組') },
    ],
  },
  {
    name: 'play-with-mods-09-mod-versions',
    title: L(
      'The "Versions" tab of LeviOptimize in LeviLauncher: the "client" variant, and version 0.18.0 for Minecraft 1.26.60.05 with its "Install" button.',
      'LeviLauncher 中 LeviOptimize 的“版本”标签页：“client”变体，以及适用于 Minecraft 1.26.60.05 的 0.18.0 版本和它的“安装”按钮。',
      'LeviLauncher 中 LeviOptimize 的「版本」分頁：「client」變體，以及適用於 Minecraft 1.26.60.05 的 0.18.0 版本和它的「安裝」按鈕。',
    ),
    scene: 'installed',
    hash: '/',
    steps: (page, t, data) => modVersions(page, t, data.mod.version),
    targets: async (page, t, data) => ({
      variant: await box(page.getByRole('button', { name: /#client/ })),
      version: await around(page, `LeviOptimize ${data.mod.version}`, { minWidth: 800 }),
      install: await box(page.locator(`button[aria-label*="LeviOptimize ${data.mod.version}"]`)),
    }),
    notes: (r) => [
      {
        kind: 'callout', n: 1, side: 'right', target: r('variant'),
        label: L(
          'The build for the game client: keep it.',
          '游戏客户端用的构建：保持不变。',
          '遊戲客戶端用的建置：保持不變。',
        ),
      },
      { kind: 'box', target: r('version') },
      { kind: 'arrow', side: 'right', target: r('install'), label: L('Install this version', '安装这个版本', '安裝這個版本') },
    ],
  },
  {
    name: 'play-with-mods-10-target-instance',
    title: L(
      'The dialog "Select Target Instance": the instance "Survival" (1.26.60.05), the variant "client", version 0.18.0, and the button "Install".',
      '“选择目标实例”对话框：实例“Survival”（1.26.60.05）、变体“client”、版本 0.18.0，以及“安装”按钮。',
      '「選擇目標實例」對話框：實例「Survival」（1.26.60.05）、變體「client」、版本 0.18.0，以及「安裝」按鈕。',
    ),
    scene: 'installed',
    hash: '/',
    steps: async (page, t, data) => {
      await modVersions(page, t, data.mod.version);
      await page.locator(`button[aria-label*="LeviOptimize ${data.mod.version}"]`).click();
      await page.getByRole('dialog').getByText(t('lip.files.select_instance_title')).waitFor();
    },
    targets: async (page, t) => {
      const dialog = page.getByRole('dialog');
      return {
        instance: await box(dialog.getByRole('button', { name: new RegExp(INSTANCE.name) })),
        install: await box(dialog.getByRole('button', { name: t('lip.files.install'), exact: true })),
      };
    },
    notes: (r) => [
      { kind: 'box', target: r('instance') },
      { kind: 'arrow', side: 'right', target: r('install'), label: L('Install into Survival', '安装到 Survival', '安裝到 Survival') },
    ],
  },
  {
    name: 'play-with-mods-11-manage-mods',
    title: L(
      'The "Mods" page of the instance "Survival": LeviOptimize 0.18.0 is installed and on; "Import .mcmod" adds a mod from a file.',
      '实例“Survival”的“模组”页面：LeviOptimize 0.18.0 已安装并启用；“导入 .mcmod”从文件添加模组。',
      '實例「Survival」的「模組」頁面：LeviOptimize 0.18.0 已安裝並啟用；「匯入 .mcmod」從檔案加入模組。',
    ),
    scene: 'mod',
    hash: '/',
    steps: async (page, t) => {
      await page.getByRole('button', { name: t('moddedcard.manage') }).click();
      await page.getByRole('switch').first().waitFor();
    },
    targets: async (page, t) => ({
      mod: await around(page, 'LeviOptimize', { minWidth: 800 }),
      toggle: await box(page.getByRole('switch'), { visible: true }),
      import: await box(page.getByRole('button', { name: t('mods.import_button') })),
    }),
    notes: (r) => [
      { kind: 'box', target: r('mod') },
      {
        kind: 'callout', n: 1, side: 'left', target: r('toggle'),
        label: L('Turns the mod on or off.', '启用或禁用这个模组。', '啟用或停用這個模組。'),
      },
      { kind: 'arrow', side: 'top', target: r('import'), label: L('Add a mod from a file', '从文件添加模组', '從檔案加入模組') },
    ],
  },
  {
    name: 'play-with-mods-12-loader',
    title: L(
      'The "Loader" tab of the "Instance Settings" of Survival: LeviLamina 26.60.7 is installed, with the buttons "Remove" and "Reinstall".',
      'Survival 的“实例设置”中的“加载器”标签页：已安装 LeviLamina 26.60.7，有“移除”和“重装”按钮。',
      'Survival 的「實例設定」中的「載入器」分頁：已安裝 LeviLamina 26.60.7，有「移除」和「重裝」按鈕。',
    ),
    scene: 'installed',
    hash: '/',
    steps: async (page, t) => {
      await page.getByRole('button', { name: t('launcherpage.tip.quick_actions_menu') }).click();
      await page.getByRole('menuitem', { name: t('launcherpage.go_version_settings') }).click();
      await page.getByRole('tab', { name: t('versions.edit.tabs.loader') }).click();
      await page.getByText(INSTANCE.leviLamina, { exact: true }).waitFor();
    },
    targets: async (page, t) => ({
      tab: await box(page.getByRole('tab', { name: t('versions.edit.tabs.loader') })),
      card: await around(page, 'LeviLamina', { minWidth: 800 }),
    }),
    notes: (r) => [
      { kind: 'box', target: r('tab') },
      { kind: 'box', target: r('card') },
      {
        kind: 'callout', n: 1, side: 'left', target: r('card'),
        label: L(
          'Install, reinstall or remove LeviLamina in this instance.',
          '在这个实例里安装、重装或移除 LeviLamina。',
          '在這個實例裡安裝、重裝或移除 LeviLamina。',
        ),
      },
    ],
  },
];

// ---------------------------------------------------------------------------------------------------------------------

const round = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, Math.round(v * 100) / 100]));

async function captureShot(browser, encoder, shot, lang, t, data) {
  const context = await browser.newContext({
    viewport: WINDOW,
    deviceScaleFactor: SCALE,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: BROWSER_LOCALES[lang],
    timezoneId: 'UTC',
  });
  try {
    await context.addInitScript((d) => {
      window.__levimcShotsData = d;
    }, data);
    await routeNetwork(context);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const query = new URLSearchParams({ scenario: 'normal', lang: LOCALES[lang], scene: shot.scene });
    await page.goto(`${BASE}?${query}#${shot.hash}`);
    await page.locator('#main-content').waitFor();
    await settle(page);
    const tl = (key) => t(lang, key);
    if (shot.steps) await shot.steps(page, tl, data);
    if (shot.height) await page.setViewportSize({ width: WINDOW.width, height: Math.ceil(await shot.height(page)) });
    await settle(page);
    assertDesensitized(await shownText(page));
    const targets = Object.fromEntries(Object.entries(await shot.targets(page, tl, data)).map(([k, r]) => [k, round(r)]));
    const png = await page.screenshot();
    if (errors.length) throw new Error(`${shot.name} (${lang}): ${errors.join('; ')}`);
    const file = path.join(here, 'captures', lang, `${shot.name}.webp`);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, await toWebP(encoder, png));
    return targets;
  } finally {
    await context.close();
  }
}

/** Writes shots.json, which keeps every picture (a run with --only replaces only its own), and the SVGs of `spec`. */
async function save(spec) {
  const file = path.join(here, 'shots.json');
  const order = SHOTS.map((s) => s.name);
  const specs = [...(existsSync(file) ? json(file) : []).filter((s) => s.name !== spec.name), spec]
    .filter((s) => order.includes(s.name))
    .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  writeFileSync(file, `${JSON.stringify(specs, null, 2)}
`);
  for (const result of await writeShots(spec, OUT, { baseDir: here })) {
    console.log(`${result.changed ? 'wrote    ' : 'unchanged'} ${path.relative(tutorials, result.file)}`);
  }
}

async function main() {
  const unknown = [...(only ?? [])].filter((name) => !SHOTS.some((shot) => shot.name === name));
  if (unknown.length) throw new Error(`No picture is called ${unknown.join(', ')}: ${SHOTS.map((s) => s.name).join(', ')}.`);
  const dir = prepareLauncher();
  const t = translator(dir);
  const data = pageData(dir);
  const stop = await startPreview(dir);
  try {
    const { chromium } = await loadPlaywright();
    const browser = await chromium.launch();
    try {
      const encoder = await browser.newPage();
      for (const shot of SHOTS) {
        if (only && !only.has(shot.name)) continue;
        const at = {};
        for (const lang of Object.keys(LOCALES)) {
          at[lang] = await captureShot(browser, encoder, shot, lang, t, data);
          console.log(`captured ${lang}/${shot.name}`);
        }
        const r = (key) => Object.fromEntries(Object.keys(LOCALES).map((lang) => [lang, at[lang][key]]));
        await save({
          name: shot.name,
          title: shot.title,
          image: Object.fromEntries(Object.keys(LOCALES).map((lang) => [lang, `captures/${lang}/${shot.name}.webp`])),
          scale: SCALE,
          frame: 'windows',
          out: '../../../content/play/images',
          notes: shot.notes(r),
        });
      }
    } finally {
      await browser.close();
    }
  } finally {
    stop();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
