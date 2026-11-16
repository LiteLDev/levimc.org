# Pictures of LeviLauncher for Android

`capture.mjs` makes the pictures `play-with-mods-android-*` (`content/play/images/`) and `first-android-mod-*`
(`content/develop/images/`) from the real app, the release named in `LAUNCHER_VERSION`, on an Android emulator. See
`../SHOTS.md` for the annotator and the rules of the pictures.

## What it does

1. Downloads the release APK of LeviLauncher (or takes `--apk <file>`), and builds `placeholder/`: an app without code
   that installs as `com.mojang.minecraftpe`, labelled "Minecraft" with the version name of a current release, so
   that the launcher shows the game as an instance. Nothing of the game is in it, and the script never launches it.
2. Prepares the device: no animations, landscape, only the first layout of the keyboard (in the zh-CN launcher
   it would switch to Pinyin and compose what `adb shell input text` types), the status bar in demo mode (the
   launcher hides it anyway), the launcher and the placeholder installed. No Google or Microsoft account is signed in, ever.
3. Goes through the tutorial twice from a cleared launcher: in `en-US`, and in `zh-CN` (the app has no Traditional
   Chinese strings, so the zh-Hant pictures show the Simplified interface with Traditional labels). It accepts the
   licence, opens the instance list, presses **Launch** (the placeholder is not from Google Play, so the launcher
   shows "Play Store Version Required"; that is the picture of it), opens **Download**, installs AppleSkin from
   **External Mods** (network needed), opens the **Mods** page, and the **Launch Options** and **Loader** tabs of
   **Instance Settings** (it presses **Install** there, which ends with "LeviLamina has no Android build yet").
4. On every screen: `uiautomator dump`, `assertDesensitized` on all its texts (plus the model and name of the device),
   `screencap`, WebP. The targets of the notes are the bounds of the views, by resource id or by the app's text.
5. Writes `captures/` (the WebP files, `seen.json` with the views it found, and `shots.json`; not committed) and the
   SVGs. After changing only the notes in `specs()`, `node scripts/shots/levilauncher-android/capture.mjs
   --from-captures` redraws the SVGs from the last captures, without a device.

## Running it

Needs the Android SDK (`ANDROID_HOME`, or `%LOCALAPPDATA%\Android\Sdk`) with `platform-tools`, `emulator`,
`build-tools;35.0.0`, `platforms;android-35` and `system-images;android-35;google_apis;x86_64`, a JDK (`JAVA_HOME`
for `keytool`), Node and `ffmpeg` with libwebp on `PATH`.

```sh
# once: an AVD with a 2400 × 1080 screen (the launcher is landscape only)
avdmanager create avd -n levi-shots -k "system-images;android-35;google_apis;x86_64" -d pixel_7
# every time
emulator -avd levi-shots -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect -wipe-data -no-snapshot &
adb wait-for-device && adb shell 'while [ "$(getprop sys.boot_completed)" != 1 ]; do sleep 2; done'
cd tutorials
node scripts/shots/levilauncher-android/capture.mjs        # about 5 minutes
adb emu kill
```

The launcher ships only arm64-v8a: the x86_64 image runs it through its ARM translation (the script stops if the
device lists no `arm64-v8a`). It runs only on an emulator (`ro.kernel.qemu`), since it uninstalls
`com.mojang.minecraftpe` and clears LeviLauncher; `--serial` picks one of several emulators. It leaves the emulator
landscape, without animations and in demo mode, and puts the keyboard layouts back. The pictures are 960 × 432 CSS pixels (`SCALE` 2.5 of a 2400 × 1080 screen).

Look at every changed picture before committing it (SHOTS.md, "Desensitizing"). Things that change between runs:
the tip line on the Launch page is random, and the External Mods catalog changes its entries.
