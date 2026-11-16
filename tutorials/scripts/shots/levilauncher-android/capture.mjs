// The pictures of LeviLauncher for Android (tutorials "Play with mods on Android" and "Your first Android native mod"),
// from the real app on an Android emulator: see README.md in this folder for the emulator and how to run it.
//
//   node scripts/shots/levilauncher-android/capture.mjs [--apk <LeviLauncher.apk>] [--serial <adb serial>]
//
// It installs the release of LeviLauncher and a stand-in for the game (placeholder/, built here with the SDK's
// build tools), resets the launcher, and goes through the tutorial once in English (en-US) and once in Simplified
// Chinese (zh-CN; the app has no Traditional Chinese, so the zh-Hant pictures show the same screens with Traditional
// labels). On each screen it reads the interface with `uiautomator dump`, checks its text with assertDesensitized,
// takes the screen with `screencap`, and takes the targets of the notes from the bounds of the views (by resource id,
// or by the text the app shows). It writes the captures and shots.json to captures/ (not committed), and the SVGs to
// content/play/images and content/develop/images.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertDesensitized, writeShots } from '../annotate.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const tutorials = path.resolve(here, '../../..');
const LAUNCHER_VERSION = '1.7.1';
const LAUNCHER_URL = `https://github.com/LiteLDev/LeviLauncher-Android/releases/download/v${LAUNCHER_VERSION}/LeviLauncher-v${LAUNCHER_VERSION}-release.apk`;
const PKG = 'org.levimc.launcher';
const ID = `${PKG}:id/`;
/** Device pixels per CSS pixel of the pictures: a 2400 × 1080 screen is shown at 960 × 432. */
const SCALE = 2.5;
const win = process.platform === 'win32';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

// ---------------------------------------------------------------------------------------------------------- SDK, adb

const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || (win ? path.join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk') : path.join(os.homedir(), 'Android', 'Sdk'));
const tool = (dir, name) => {
  const file = path.join(sdk, dir, name + (win ? '.exe' : ''));
  return existsSync(file) ? file : name;
};
const adbPath = tool('platform-tools', 'adb');
const serial = opt('--serial');
const run = (file, argv, options = {}) => execFileSync(file, argv, { maxBuffer: 1 << 28, ...options });
const adb = (...a) => run(adbPath, [...(serial ? ['-s', serial] : []), ...a]);
const sh = (...a) => adb('shell', ...a).toString();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const java = (name) => (process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', name) : name);

/** The newest stable build-tools (no "-rc"), compared by version numbers. */
function buildTools() {
  const dir = path.join(sdk, 'build-tools');
  const versions = existsSync(dir) ? readdirSync(dir).filter((v) => /^\d+(\.\d+)*$/.test(v)) : [];
  if (!versions.length) throw new Error(`no build-tools in ${sdk}: sdkmanager "build-tools;35.0.0" "platforms;android-35"`);
  const num = (v) => v.split('.').map(Number);
  versions.sort((a, b) => {
    const [x, y] = [num(a), num(b)];
    for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
    return 0;
  });
  return path.join(dir, versions.at(-1));
}

/** The stand-in for the game: placeholder/AndroidManifest.xml, linked, aligned and signed with a throwaway key. */
function buildPlaceholder(tmp) {
  const bt = buildTools();
  const platforms = path.join(sdk, 'platforms');
  const androidJar = ['android-36', 'android-35', 'android-34'].map((p) => path.join(platforms, p, 'android.jar')).find(existsSync);
  if (!androidJar) throw new Error(`no android.jar in ${platforms}: sdkmanager "platforms;android-35"`);
  const unsigned = path.join(tmp, 'unsigned.apk');
  const aligned = path.join(tmp, 'aligned.apk');
  const signed = path.join(tmp, 'minecraft-placeholder.apk');
  const ks = path.join(tmp, 'placeholder.jks');
  run(path.join(bt, win ? 'aapt2.exe' : 'aapt2'), ['link', '-o', unsigned, '--manifest', path.join(here, 'placeholder', 'AndroidManifest.xml'), '-I', androidJar]);
  run(path.join(bt, win ? 'zipalign.exe' : 'zipalign'), ['-f', '4', unsigned, aligned]);
  run(java('keytool'), ['-genkeypair', '-keystore', ks, '-storepass', 'android', '-keypass', 'android', '-alias', 'k', '-keyalg', 'RSA', '-dname', 'CN=placeholder', '-validity', '3650'], { stdio: 'ignore' });
  // apksigner's jar with java, not its .bat/.sh wrapper (no cmd quoting on Windows).
  run(java('java'), ['-jar', path.join(bt, 'lib', 'apksigner.jar'), 'sign', '--ks', ks, '--ks-pass', 'pass:android', '--out', signed, aligned]);
  return signed;
}

async function launcherApk(tmp) {
  const given = opt('--apk');
  if (given) return path.resolve(given);
  const file = path.join(tmp, `LeviLauncher-v${LAUNCHER_VERSION}-release.apk`);
  console.log(`downloading ${LAUNCHER_URL}`);
  const res = await fetch(LAUNCHER_URL);
  if (!res.ok) throw new Error(`${LAUNCHER_URL}: ${res.status}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

// ------------------------------------------------------------------------------------------------------ the interface

/** The views on the screen, from `uiautomator dump`: { id, text, desc, checked, rect: [x1, y1, x2, y2] }. */
function dump() {
  let last;
  for (let i = 0; i < 6; i++) {
    try {
      sh('uiautomator', 'dump', '/sdcard/levi-shots.xml');
      const xml = adb('exec-out', 'cat', '/sdcard/levi-shots.xml').toString();
      const nodes = [...xml.matchAll(/<node ([^>]*?)\/?>/g)].map((m) => {
        const a = {};
        for (const attr of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) a[attr[1]] = unescape(attr[2]);
        return {
          id: a['resource-id']?.startsWith(ID) ? a['resource-id'].slice(ID.length) : a['resource-id'],
          text: a.text ?? '',
          desc: a['content-desc'] ?? '',
          checked: a.checked === 'true',
          rect: (a.bounds?.match(/\d+/g) ?? [0, 0, 0, 0]).map(Number),
        };
      });
      if (nodes.length) return nodes;
    } catch (e) {
      last = e;
    }
    sleepSync(500); // "could not get idle state" while the screen still moves
  }
  throw last ?? new Error('uiautomator dump returned nothing');
}
function unescape(s) {
  return s.replace(/&#10;/g, '\n').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

/** A view by `#id` or by its text (exactly). */
function find(nodes, q, { required = true } = {}) {
  const n = q.startsWith('#') ? nodes.find((v) => v.id === q.slice(1)) : nodes.find((v) => v.text === q || v.desc === q);
  if (!n && required) throw new Error(`no view ${q} on the screen`);
  return n;
}

async function waitFor(q, { timeout = 30000, gone = false } = {}) {
  const until = Date.now() + timeout;
  for (;;) {
    const nodes = dump();
    const n = find(nodes, q, { required: false });
    if (gone ? !n : n) return { nodes, node: n };
    if (Date.now() > until) throw new Error(`timed out waiting for ${q}${gone ? ' to go' : ''}`);
    await sleep(700);
  }
}

async function tap(q) {
  const { node } = await waitFor(q);
  const [x1, y1, x2, y2] = node.rect;
  sh('input', 'tap', String((x1 + x2) >> 1), String((y1 + y2) >> 1));
  await sleep(900);
}

/** A view's rectangle in CSS pixels of the picture; `pad` adds device pixels around it. */
const rect = (node, pad = 0) => {
  const [x1, y1, x2, y2] = node.rect;
  const r = (v) => Math.round((v / SCALE) * 100) / 100;
  return { x: r(Math.max(0, x1 - pad)), y: r(Math.max(0, y1 - pad)), width: r(x2 - x1 + 2 * pad), height: r(y2 - y1 + 2 * pad) };
};
/** The rectangle around several views. */
const union = (...nodes) => {
  const xs = nodes.map((n) => n.rect);
  return { rect: [Math.min(...xs.map((r) => r[0])), Math.min(...xs.map((r) => r[1])), Math.max(...xs.map((r) => r[2])), Math.max(...xs.map((r) => r[3]))] };
};

// ------------------------------------------------------------------------------------------------------- the device

/** The keyboard and its first layout (`<ime>;<layout>`), as the system set it up before the tours. */
let keyboardLayout = '';
/** The keyboards and layouts before the run, put back at its end. */
let keyboardOriginal = '';

/**
 * Before typing: the keyboard keeps only its first layout (the system's, en-US on the emulator). In the zh-CN
 * launcher the keyboard adds Pinyin and switches to it, and would compose what `input text` types.
 */
function plainKeyboard() {
  const [ime, layout] = keyboardLayout.split(';');
  if (!layout) return;
  sh('settings', 'put', 'secure', 'enabled_input_methods', `'${ime};${layout}'`);
  sh('settings', 'put', 'secure', 'selected_input_method_subtype', layout);
}

function prepareDevice(apk, placeholder) {
  // The script replaces com.mojang.minecraftpe and clears LeviLauncher: never on a phone with a real game on it.
  const emulator = sh('getprop', 'ro.kernel.qemu').trim() === '1' || sh('getprop', 'ro.boot.qemu').trim() === '1';
  if (!emulator) throw new Error('not an emulator: the script uninstalls Minecraft and clears LeviLauncher, so it runs only on an Android emulator');
  const model = sh('getprop', 'ro.product.model').trim();
  const abis = sh('getprop', 'ro.product.cpu.abilist').trim();
  if (!abis.split(',').includes('arm64-v8a')) throw new Error(`the device cannot run arm64-v8a code (${abis})`);
  // No animations (stable dumps), landscape, no "Viewing full screen" hint, the status bar in demo mode.
  for (const k of ['window_animation_scale', 'transition_animation_scale', 'animator_duration_scale']) sh('settings', 'put', 'global', k, '0');
  sh('settings', 'put', 'system', 'accelerometer_rotation', '0');
  sh('settings', 'put', 'system', 'user_rotation', '1');
  sh('settings', 'put', 'secure', 'immersive_mode_confirmations', 'confirmed');
  keyboardOriginal = sh('settings', 'get', 'secure', 'enabled_input_methods').trim();
  keyboardLayout = keyboardOriginal.split(':')[0];
  sh('settings', 'put', 'global', 'sysui_demo_allowed', '1');
  const demo = (...extra) => sh('am', 'broadcast', '-a', 'com.android.systemui.demo', ...extra);
  demo('-e', 'command', 'enter');
  demo('-e', 'command', 'clock', '-e', 'hhmm', '1200');
  demo('-e', 'command', 'battery', '-e', 'level', '100', '-e', 'plugged', 'false');
  demo('-e', 'command', 'network', '-e', 'wifi', 'show', '-e', 'level', '4');
  demo('-e', 'command', 'notifications', '-e', 'visible', 'false');
  adb('install', '-r', apk);
  // The stand-in for the game, installed by the shell (so the launcher's check for the Play Store version fails,
  // which the picture of that dialog needs; the game is never launched).
  try {
    adb('uninstall', 'com.mojang.minecraftpe');
  } catch {}
  adb('install', placeholder);
  return [model, serial ?? '', sh('settings', 'get', 'global', 'device_name').trim()].filter((s) => s && s !== 'null');
}

// --------------------------------------------------------------------------------------------------------- the tour

/** What the app shows in each locale, where a view has no resource id (from app/src/main/res/values*). */
const L = {
  en: { okay: 'Okay, I understand', installed: 'Installed', launchOptions: 'Launch Options', loader: 'Loader', close: 'Close', noAndroid: 'LeviLamina has no Android build yet. It can be installed once LeviLamina publishes a build for android-arm64.' },
  zh: { okay: '好的，我已了解', installed: '已安装', launchOptions: '启动选项', loader: '加载器', close: '关闭', noAndroid: 'LeviLamina 暂无 Android 版本。待 LeviLamina 发布 android-arm64 版本后即可安装。' },
};

/**
 * Goes through the tutorial in a locale and returns, for each screen, its capture and the views to point at.
 * @returns {Promise<Record<string, { file: string, at: Record<string, object> }>>}
 */
async function tour(locale, key, sensitive) {
  const t = L[key];
  const out = {};
  const dir = path.join(here, 'captures', key);
  mkdirSync(dir, { recursive: true });
  const capture = (name, pick) => {
    const nodes = dump();
    assertDesensitized(nodes.map((n) => `${n.text}\n${n.desc}`).join('\n'), sensitive);
    const png = path.join(dir, `${name}.png`);
    writeFileSync(png, adb('exec-out', 'screencap', '-p'));
    // WebP keeps every picture well under the annotator's 600 KB and the text sharp.
    const webp = path.join(dir, `${name}.webp`);
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', png, '-c:v', 'libwebp', '-quality', '90', '-compression_level', '6', webp]);
    rmSync(png);
    out[name] = { file: path.relative(path.join(here, 'captures'), webp).replaceAll('\\', '/'), at: pick((q, pad) => rect(find(nodes, q), pad), nodes) };
    console.log(`  ${key}/${name}`);
  };

  sh('am', 'force-stop', PKG);
  sh('pm', 'clear', PKG);
  sh('cmd', 'locale', 'set-app-locales', PKG, '--locales', locale);
  sh('am', 'start', '-W', '-n', `${PKG}/.ui.activities.SplashActivity`);

  await waitFor('#btn_positive', { timeout: 60000 });
  capture('license', (r) => ({ accept: r('#btn_positive', 6), dialog: r('#dialog_shell') }));
  await tap('#btn_positive');

  // Then, sometimes, "What's new" of the release: "Continue".
  for (let i = 0; ; i++) {
    const nodes = dump();
    if (find(nodes, '#changelog_version', { required: false })) await tap('#btn_positive');
    else if (find(nodes, '#launch_button', { required: false }) && !find(nodes, '#dialog_shell', { required: false })) break;
    if (i > 60) throw new Error('the Launch page did not open');
    await sleep(700);
  }
  await sleep(1500);
  capture('home', (r) => ({
    instance: r('#select_version_button', 4),
    launch: r('#home_launch_group', 4),
    mods: r('#mod_card'),
    download: r('#misc_card'),
  }));

  await tap('#select_version_button');
  await waitFor('#instance_item_root');
  capture('instances', (r) => ({ item: r('#instance_item_root', 4) }));
  sh('input', 'keyevent', 'KEYCODE_BACK');
  await waitFor('#instance_item_root', { gone: true });

  await tap('#launch_button');
  await waitFor('#btn_negative');
  capture('play-store', (r) => ({ dialog: r('#dialog_shell'), get: r('#btn_positive', 6) }));
  await tap('#btn_negative');

  await tap('#nav_tab_download');
  const notice = await waitFor(t.okay, { timeout: 15000 }).catch(() => null);
  if (notice) await tap(t.okay);
  await waitFor('#game_download_import_apk');
  capture('download', (r) => ({ importApk: r('#game_download_import_apk', 4), signIn: r('#game_download_account', 4) }));

  await tap('#nav_tab_launch');
  await tap('#misc_external_mods_row');
  await waitFor('#external_mod_card', { timeout: 60000 });
  for (let i = 0; ; i++) {
    // Typing is lost when the search box is not focused yet: type again until it shows the text.
    if (find(dump(), '#external_mods_search').text !== 'AppleSkin') {
      await tap('#external_mods_search');
      plainKeyboard();
      sh('input', 'keyevent', 'KEYCODE_MOVE_END', ...Array(30).fill('KEYCODE_DEL'));
      sh('input', 'text', 'AppleSkin');
      sh('input', 'keyevent', 'KEYCODE_ESCAPE');
    }
    const cards = dump().filter((n) => n.id === 'external_mod_name');
    if (cards.length === 1 && cards[0].text === 'AppleSkin') break;
    if (i > 30) throw new Error('AppleSkin is not the only mod found in External Mods');
    await sleep(1000);
  }
  capture('external-mods', (r) => ({ card: r('#external_mod_card'), install: r('#external_mod_action', 4), compatible: r('#external_mods_compatible_filter', 4) }));
  await tap('#external_mod_action');
  for (let i = 0; find(dump(), '#external_mod_action').text !== t.installed; i++) {
    if (i > 90) throw new Error('AppleSkin did not install');
    await sleep(1000);
  }

  await tap('#nav_tab_launch');
  await waitFor('AppleSkin');
  capture('home-with-mod', (r) => ({ mod: r('AppleSkin', 8), launch: r('#home_launch_group', 4) }));

  await tap('#manage_mods_button');
  await waitFor('#mod_switch');
  capture('mods', (r, nodes) => ({
    addMod: r('#add_mod_fullscreen_button', 4),
    getMods: r('#mods_get_button', 4),
    row: rect(union(find(nodes, '#drag_handle'), find(nodes, '#mod_more')), 8),
    switch: r('#mod_switch', 2),
  }));

  await tap('#nav_tab_launch');
  await tap('#home_instance_settings_button');
  await tap(t.launchOptions);
  await waitFor('#switch_instance_mod_menu');
  capture('mod-menu', (r, nodes) => {
    const sw = find(nodes, '#switch_instance_mod_menu');
    // The row: from the left of the section to the switch, from the title to the description.
    const section = find(nodes, '#section_launch_options');
    return { tab: r(t.launchOptions), row: rect({ rect: [section.rect[0] + 12, sw.rect[1] - 6, section.rect[2] - 12, sw.rect[3] + 6] }), switch: r('#switch_instance_mod_menu', 2) };
  });

  await tap(t.loader);
  await waitFor('#android:id/text1', { timeout: 60000 }); // the versions of LeviLamina are listed
  await tap('#pkg_loader_action');
  await tap('#btn_positive');
  await waitFor('#pkg_task_btn_main');
  for (let i = 0; find(dump(), '#pkg_task_btn_main').text !== t.close; i++) {
    if (i > 120) throw new Error('the LeviLamina task did not end');
    await sleep(1000);
  }
  await tap('#pkg_task_btn_main');
  await waitFor(t.noAndroid);
  capture('loader', (r) => ({ tab: r(t.loader), notice: r(t.noAndroid, 6) }));

  sh('am', 'force-stop', PKG);
  return out;
}

// ------------------------------------------------------------------------------------------------------- the pictures

const LANGS = ['en', 'zh-Hans', 'zh-Hant'];
const CAPTURE_OF = { en: 'en', 'zh-Hans': 'zh', 'zh-Hant': 'zh' };

/** Builds the specs from what the tour saw: `per(lang => value)` gives a value per language. */
function specs(seen) {
  const per = (f) => Object.fromEntries(LANGS.map((lang) => [lang, f(lang)]));
  const image = (screen) => per((lang) => seen[CAPTURE_OF[lang]][screen].file);
  const at = (screen, key) => per((lang) => seen[CAPTURE_OF[lang]][screen].at[key]);
  const shot = (name, screen, title, notes, out = '../../../../content/play/images') => ({ name, title, image: image(screen), scale: SCALE, frame: 'android', out, notes });
  const label = (en, hans, hant) => ({ en, 'zh-Hans': hans, 'zh-Hant': hant });

  return [
    shot('play-with-mods-android-01-license', 'license',
      label('The "LeviLauncher License Agreement" of the first start, with the "Accept" button.', '首次启动时的“LeviLauncher 用户协议”对话框和“接受”按钮。', '首次啟動時的「LeviLauncher 用戶協議」對話框和「接受」按鈕。'),
      [
        { kind: 'focus', target: at('license', 'dialog') },
        { kind: 'arrow', side: 'right', target: at('license', 'accept'), label: label('Tap to agree', '点击同意', '點擊同意') },
      ]),
    shot('play-with-mods-android-02-home', 'home',
      label('The Launch page of LeviLauncher: the current instance "Minecraft", the "Launch" button, and the "Mods" and "Content download" cards.', 'LeviLauncher 的“启动”页面：当前实例“Minecraft”、“启动”按钮，以及“模组”和“内容下载”卡片。', 'LeviLauncher 的「啟動」頁面：當前實例「Minecraft」、「啟動」按鈕，以及「模組」和「內容下載」卡片。'),
      [
        { kind: 'box', target: at('home', 'instance') },
        { kind: 'arrow', side: 'top', target: at('home', 'launch'), label: label('Starts the game', '启动游戏', '啟動遊戲') },
        { kind: 'callout', n: 1, side: 'top', target: at('home', 'mods'), label: label('The mods of the current instance.', '当前实例的模组。', '當前實例的模組。') },
        { kind: 'callout', n: 2, side: 'top', target: at('home', 'download'), label: label('Where to get mods.', '在这里获取模组。', '在這裡取得模組。') },
      ]),
    shot('play-with-mods-android-03-instances', 'instances',
      label('The instance list under "Current Instance" on the Launch page, with the game from Google Play selected.', '“启动”页面上“当前实例”的实例列表，选中了 Google Play 安装的游戏。', '「啟動」頁面上「當前實例」的實例清單，選取了從 Google Play 安裝的遊戲。'),
      [
        { kind: 'box', target: at('instances', 'item') },
        { kind: 'arrow', side: 'left', target: at('instances', 'item'), label: label('Your game from Google Play', '你从 Google Play 安装的游戏', '你從 Google Play 安裝的遊戲') },
      ]),
    shot('play-with-mods-android-04-download', 'download',
      label('The Download page of LeviLauncher, with "Import APK" and "Sign in" to Google Play.', 'LeviLauncher 的“下载”页面，带有“导入APK”和登录 Google Play 的按钮。', 'LeviLauncher 的「下載」頁面，帶有「導入APK」和登入 Google Play 的按鈕。'),
      [
        { kind: 'box', target: at('download', 'importApk') },
        { kind: 'box', target: at('download', 'signIn') },
        { kind: 'callout', n: 1, side: 'bottom', target: at('download', 'importApk'), label: label('Add another version from an APK file.', '从 APK 文件添加其他版本。', '從 APK 檔案新增其他版本。') },
        { kind: 'callout', n: 2, side: 'bottom', target: at('download', 'signIn'), label: label('Or download versions with the Google account that bought Minecraft.', '或者用购买了 Minecraft 的 Google 账号下载版本。', '或者用購買了 Minecraft 的 Google 帳號下載版本。') },
      ]),
    shot('play-with-mods-android-05-play-store', 'play-store',
      label('The "Play Store Version Required" dialog, shown when Minecraft was not installed from Google Play.', '“需要 Play 商店版本”对话框：Minecraft 不是从 Google Play 安装时出现。', '「需要 Play 商店版本」對話框：Minecraft 不是從 Google Play 安裝時出現。'),
      [
        { kind: 'focus', target: at('play-store', 'dialog') },
        { kind: 'arrow', side: 'right', target: at('play-store', 'get'), label: label('Opens Google Play', '打开 Google Play', '開啟 Google Play') },
      ]),
    shot('play-with-mods-android-06-external-mods', 'external-mods',
      label('The External Mods page, searched for "AppleSkin", with its "Install" button and "Compatible only" turned on.', '“外部模组”页面：搜索“AppleSkin”，带有“安装”按钮，“仅显示兼容”已勾选。', '「外部模組」頁面：搜尋「AppleSkin」，帶有「安裝」按鈕，「僅顯示兼容」已勾選。'),
      [
        { kind: 'box', target: at('external-mods', 'compatible') },
        { kind: 'box', target: at('external-mods', 'card') },
        { kind: 'arrow', side: 'right', target: at('external-mods', 'install'), label: label('Install the mod', '安装模组', '安裝模組') },
      ]),
    shot('play-with-mods-android-07-mods', 'mods',
      label('The Mods page of the instance: AppleSkin is installed and its switch is on; "Add Mod" adds a mod file.', '实例的“模组”页面：AppleSkin 已安装，开关已打开；“添加模组”用来添加模组文件。', '實例的「模組」頁面：AppleSkin 已安裝，開關已開啟；「添加模組」用來加入模組檔案。'),
      [
        { kind: 'box', target: at('mods', 'row') },
        { kind: 'arrow', side: 'bottom', target: at('mods', 'switch'), label: label('On: loaded with the game', '打开：随游戏加载', '開啟：隨遊戲載入') },
        { kind: 'callout', n: 1, side: 'left', target: at('mods', 'getMods'), label: label('Get mods: LeviMC Mods or External Mods.', '获取模组：LeviMC 模组或外部模组。', '獲取模組：LeviMC 模組或外部模組。') },
        { kind: 'arrow', side: 'top', target: at('mods', 'addMod'), label: label('A mod file, such as a .levipack', '模组文件，例如 .levipack', '模組檔案，例如 .levipack') },
      ]),
    shot('play-with-mods-android-08-home-with-mod', 'home-with-mod',
      label('The Launch page with AppleSkin in the "Mods" card, ready to launch.', '“启动”页面，“模组”卡片中列出了 AppleSkin，可以启动了。', '「啟動」頁面，「模組」卡片中列出了 AppleSkin，可以啟動了。'),
      [
        { kind: 'box', target: at('home-with-mod', 'mod') },
        { kind: 'arrow', side: 'top', target: at('home-with-mod', 'launch'), label: label('Play with the mod', '带着模组开始游戏', '帶著模組開始遊戲') },
      ]),
    shot('play-with-mods-android-09-mod-menu', 'mod-menu',
      label('Instance Settings, Launch Options tab: the "In-game mod menu" switch.', '实例设置的“启动选项”标签页：“游戏内模组菜单”开关。', '實例設定的「啟動選項」分頁：「遊戲內模組菜單」開關。'),
      [
        { kind: 'box', target: at('mod-menu', 'tab') },
        { kind: 'box', target: at('mod-menu', 'row') },
        { kind: 'arrow', side: 'bottom', target: at('mod-menu', 'switch'), label: label('The mod menu inside the game', '游戏内的模组菜单', '遊戲內的模組選單') },
      ]),
    shot('play-with-mods-android-10-loader', 'loader',
      label('Instance Settings, Loader tab: LeviLamina has no Android build yet.', '实例设置的“加载器”标签页：LeviLamina 暂无 Android 版本。', '實例設定的「加載器」分頁：LeviLamina 暫無 Android 版本。'),
      [
        { kind: 'box', target: at('loader', 'tab') },
        { kind: 'box', target: at('loader', 'notice') },
        { kind: 'callout', n: 1, side: 'left', target: at('loader', 'notice'), label: label('LeviLamina mods for Windows do not run on Android.', '为 Windows 制作的 LeviLamina 模组不能在 Android 上运行。', '為 Windows 製作的 LeviLamina 模組不能在 Android 上執行。') },
      ]),
    shot('first-android-mod-01-add-mod', 'mods',
      label('The Mods page of LeviLauncher, with the "Add Mod" button that imports a .levipack file.', 'LeviLauncher 的“模组”页面，“添加模组”按钮用来导入 .levipack 文件。', 'LeviLauncher 的「模組」頁面，「添加模組」按鈕用來匯入 .levipack 檔案。'),
      [
        { kind: 'box', target: at('mods', 'addMod') },
        { kind: 'arrow', side: 'bottom', target: at('mods', 'addMod'), label: label('Pick your .levipack', '选择你的 .levipack', '選擇你的 .levipack') },
      ], '../../../../content/develop/images'),
  ];
}

// ---------------------------------------------------------------------------------------------------------------- run

const capturesDir = path.join(here, 'captures');
const seenFile = path.join(capturesDir, 'seen.json');
const tmp = mkdtempSync(path.join(os.tmpdir(), 'levi-shots-'));
try {
  let seen = {};
  if (args.includes('--from-captures')) {
    // Only the notes changed: the last captures and the views they saw, without a device.
    seen = JSON.parse(readFileSync(seenFile, 'utf8'));
  } else {
    const apk = await launcherApk(tmp);
    const placeholder = buildPlaceholder(tmp);
    adb('wait-for-device');
    const sensitive = prepareDevice(apk, placeholder);
    for (const [locale, key] of [['en-US', 'en'], ['zh-CN', 'zh']]) {
      console.log(`${locale}:`);
      seen[key] = await tour(locale, key, sensitive);
    }
    writeFileSync(seenFile, JSON.stringify(seen, null, 2) + '\n');
  }
  const all = specs(seen);
  writeFileSync(path.join(capturesDir, 'shots.json'), JSON.stringify(all, null, 2) + '\n');
  for (const spec of all) {
    const outDir = path.resolve(capturesDir, spec.out);
    for (const r of await writeShots(spec, outDir, { baseDir: capturesDir })) {
      console.log(`${r.changed ? 'wrote' : 'same '} ${path.relative(tutorials, r.file)}`);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
  if (keyboardOriginal && keyboardOriginal !== 'null') sh('settings', 'put', 'secure', 'enabled_input_methods', `'${keyboardOriginal}'`);
}
