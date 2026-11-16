// The demo of the annotator, and an example of a capture script: it draws two small mock screens (a launcher window
// on Windows, a launcher on an Android phone) in Chromium in each language, takes each at 2× from the live page with
// the rectangles of its marked elements, checks that the page shows nothing of the machine (assertDesensitized), and
// writes the captures and shots.json. A real capture script starts the real app with fake data instead of a mock page.
//
//   npm i --no-save playwright && npx playwright install chromium     (once, in tutorials/)
//   node scripts/shots/demo/capture.mjs                               writes captures/ and shots.json
//   node scripts/shots/annotate.mjs scripts/shots/demo/shots.json     writes out/<lang>/*.svg
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertDesensitized, DEFAULT_LANGUAGES } from '../annotate.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = await import('playwright');

const T = {
  en: {
    title: 'Demo Launcher',
    nav: ['Home', 'Instances', 'Mods', 'Settings'],
    heading: 'Instances',
    create: 'New instance',
    rows: [
      ['Survival', '1.21.120 · LeviLamina 1.7.2'],
      ['Creative', '1.21.120 · no mods'],
    ],
    path: 'D:\\LeviLauncher\\instances\\Survival',
    launch: 'Launch',
    phoneTitle: 'Survival',
    phoneVersion: 'Version 1.21.120',
    play: 'Play',
    mods: 'Mods',
    worlds: 'Worlds',
  },
  'zh-Hans': {
    title: '演示启动器',
    nav: ['主页', '实例', '模组', '设置'],
    heading: '实例',
    create: '新建实例',
    rows: [
      ['Survival', '1.21.120 · LeviLamina 1.7.2'],
      ['Creative', '1.21.120 · 无模组'],
    ],
    path: 'D:\\LeviLauncher\\instances\\Survival',
    launch: '启动',
    phoneTitle: 'Survival',
    phoneVersion: '版本 1.21.120',
    play: '开始游戏',
    mods: '模组',
    worlds: '世界',
  },
  'zh-Hant': {
    title: '示範啟動器',
    nav: ['首頁', '實例', '模組', '設定'],
    heading: '實例',
    create: '新增實例',
    rows: [
      ['Survival', '1.21.120 · LeviLamina 1.7.2'],
      ['Creative', '1.21.120 · 無模組'],
    ],
    path: 'D:\\LeviLauncher\\instances\\Survival',
    launch: '啟動',
    phoneTitle: 'Survival',
    phoneVersion: '版本 1.21.120',
    play: '開始遊戲',
    mods: '模組',
    worlds: '世界',
  },
};

const FONT = "'Segoe UI','Microsoft YaHei UI','Microsoft JhengHei UI',sans-serif";

const windowsPage = (t) => `<!doctype html><html><head><style>
* { box-sizing: border-box; margin: 0; }
body { font: 13px ${FONT}; background: #fff; }
#app { width: 520px; height: 300px; display: grid; grid-template-rows: 32px 1fr; background: #f6f7f9; color: #1f2329; }
.bar { display: flex; align-items: center; padding: 0 0 0 12px; background: #fff; border-bottom: 1px solid #e3e6eb; }
.bar b { font-weight: 600; flex: 1; } .bar span { width: 40px; text-align: center; color: #6b7280; }
.main { display: grid; grid-template-columns: 120px 1fr; }
nav { background: #fff; border-right: 1px solid #e3e6eb; padding: 8px; }
nav div { padding: 7px 10px; border-radius: 6px; color: #4b5563; } nav .on { background: #e8f0fe; color: #1a56db; font-weight: 600; }
section { padding: 14px 16px; }
h1 { font-size: 17px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
button { font: inherit; border: 0; border-radius: 6px; padding: 6px 12px; }
.ghost { background: #fff; border: 1px solid #d1d5db; color: #1f2329; }
.row { display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 10px 12px; background: #fff; border: 1px solid #e3e6eb; border-radius: 8px; }
.row.sel { border-color: #1a56db; }
.icon { width: 30px; height: 30px; border-radius: 6px; background: linear-gradient(#7cb342, #558b2f); }
.row div { flex: 1; } .row small { color: #6b7280; display: block; }
.path { margin-top: 14px; color: #6b7280; font-size: 12px; }
.launch { background: #1a56db; color: #fff; font-weight: 600; padding: 7px 18px; }
</style></head><body><div id="app">
<div class="bar"><b>${t.title}</b><span>—</span><span>☐</span><span>✕</span></div>
<div class="main"><nav>${t.nav.map((n, i) => `<div class="${i === 1 ? 'on' : ''}" ${i === 1 ? 'data-shot="nav"' : ''}>${n}</div>`).join('')}</nav>
<section><h1>${t.heading}<button class="ghost" data-shot="create">${t.create}</button></h1>
${t.rows.map(([name, info], i) => `<div class="row${i === 0 ? ' sel' : ''}" data-shot="row${i}"><span class="icon"></span><div>${name}<small>${info}</small></div>${i === 0 ? `<button class="launch" data-shot="launch">${t.launch}</button>` : ''}</div>`).join('')}
<div class="path" data-shot="path">${t.path}</div></section></div></div></body></html>`;

const androidPage = (t) => `<!doctype html><html><head><style>
* { box-sizing: border-box; margin: 0; }
body { font: 13px ${FONT}; background: #000; }
#app { width: 560px; height: 260px; background: #15171c; color: #e6e8ec; display: grid; grid-template-columns: 64px 1fr; }
.rail { background: #1d2027; display: flex; flex-direction: column; align-items: center; gap: 14px; padding-top: 18px; }
.rail span { width: 30px; height: 30px; border-radius: 9px; background: #2b2f38; } .rail .on { background: #3b82f6; }
.body { padding: 18px 22px; display: grid; grid-template-columns: 1fr 180px; gap: 18px; }
.card { background: #1f232b; border-radius: 14px; padding: 16px; }
.card h2 { font-size: 20px; font-weight: 600; } .card p { color: #9aa1ad; margin-top: 4px; }
.chips { display: flex; gap: 8px; margin-top: 18px; } .chips span { background: #2b2f38; border-radius: 99px; padding: 6px 14px; }
.side { display: flex; flex-direction: column; justify-content: flex-end; }
.play { font: inherit; font-size: 16px; font-weight: 700; background: #22c55e; color: #08140c; border: 0; border-radius: 12px; padding: 16px; }
</style></head><body><div id="app">
<div class="rail"><span class="on" data-shot="home"></span><span></span><span></span></div>
<div class="body"><div class="card" data-shot="card"><h2>${t.phoneTitle}</h2><p><span data-shot="version">${t.phoneVersion}</span></p>
<div class="chips"><span data-shot="mods">${t.mods}</span><span>${t.worlds}</span></div></div>
<div class="side"><button class="play" data-shot="play">${t.play}</button></div></div></div></body></html>`;

const round = (v) => Math.round(v * 100) / 100;

async function capture(browser, html, file) {
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 800, height: 500 } });
  await page.setContent(html);
  assertDesensitized(await page.evaluate(() => document.body.innerText));
  const app = page.locator('#app');
  mkdirSync(path.dirname(file), { recursive: true });
  await app.screenshot({ path: file });
  const rects = await page.evaluate(() => {
    const origin = document.querySelector('#app').getBoundingClientRect();
    const out = {};
    for (const el of document.querySelectorAll('[data-shot]')) {
      const r = el.getBoundingClientRect();
      out[el.dataset.shot] = { x: r.x - origin.x, y: r.y - origin.y, width: r.width, height: r.height };
    }
    return out;
  });
  await page.close();
  for (const r of Object.values(rects)) for (const k of Object.keys(r)) r[k] = round(r[k]);
  return rects;
}

const browser = await chromium.launch();
const at = { windows: {}, android: {} };
for (const lang of DEFAULT_LANGUAGES) {
  at.windows[lang] = await capture(browser, windowsPage(T[lang]), path.join(here, 'captures', lang, 'demo-01-windows.png'));
  at.android[lang] = await capture(browser, androidPage(T[lang]), path.join(here, 'captures', lang, 'demo-02-android.png'));
}
await browser.close();

/** A target per language: the rectangle of the element marked `key`. */
const target = (app, key) => Object.fromEntries(DEFAULT_LANGUAGES.map((lang) => [lang, at[app][lang][key]]));
const image = (name) => Object.fromEntries(DEFAULT_LANGUAGES.map((lang) => [lang, `captures/${lang}/${name}.png`]));

const shots = [
  {
    name: 'demo-01-windows',
    title: {
      en: 'The Instances page of the launcher, with the instance "Survival" selected.',
      'zh-Hans': '启动器的“实例”页面，选中了实例“Survival”。',
      'zh-Hant': '啟動器的「實例」頁面，選取了實例「Survival」。',
    },
    image: image('demo-01-windows'),
    scale: 2,
    frame: 'windows',
    out: 'out',
    notes: [
      { kind: 'box', target: target('windows', 'row0') },
      {
        kind: 'arrow',
        target: target('windows', 'launch'),
        side: 'right',
        label: { en: 'Starts the game', 'zh-Hans': '启动游戏', 'zh-Hant': '啟動遊戲' },
      },
      {
        kind: 'callout',
        n: 1,
        target: target('windows', 'nav'),
        label: {
          en: 'Every instance is a game version with its own mods and worlds.',
          'zh-Hans': '每个实例是一个游戏版本，有自己的模组和世界。',
          'zh-Hant': '每個實例是一個遊戲版本，有自己的模組和世界。',
        },
      },
      {
        kind: 'callout',
        n: 2,
        side: 'right',
        target: target('windows', 'path'),
        label: {
          en: 'Where the files of the instance are.',
          'zh-Hans': '实例的文件所在的位置。',
          'zh-Hant': '實例的檔案所在的位置。',
        },
      },
      { kind: 'keys', caption: { en: 'Or press', 'zh-Hans': '或按', 'zh-Hant': '或按' }, keys: ['Ctrl', 'Enter'] },
    ],
  },
  {
    name: 'demo-02-android',
    title: {
      en: 'The home screen of the launcher on a phone, with the green "Play" button.',
      'zh-Hans': '手机上启动器的主屏幕，带有绿色的“开始游戏”按钮。',
      'zh-Hant': '手機上啟動器的主畫面，帶有綠色的「開始遊戲」按鈕。',
    },
    image: image('demo-02-android'),
    scale: 2,
    frame: 'android',
    out: 'out',
    notes: [
      { kind: 'focus', target: target('android', 'card') },
      { kind: 'focus', target: target('android', 'play') },
      { kind: 'ellipse', target: target('android', 'version') },
      {
        kind: 'arrow',
        target: target('android', 'play'),
        side: 'bottom',
        label: { en: 'Tap to play', 'zh-Hans': '点这里开始', 'zh-Hant': '點這裡開始' },
      },
      {
        kind: 'arrow',
        target: target('android', 'mods'),
        side: 'left',
        label: { en: 'Mods of this instance', 'zh-Hans': '本实例的模组', 'zh-Hant': '本實例的模組' },
      },
      { kind: 'callout', n: 1, side: 'top', target: target('android', 'home') },
    ],
  },
];
writeFileSync(path.join(here, 'shots.json'), `${JSON.stringify(shots, null, 2)}\n`);
console.log('wrote captures/ and shots.json');
