# LeviLauncher on Android: features and settings

## Does LeviLauncher on Android require a licensed copy of the game? Does a licensed copy bought on the Microsoft Store/PC (Java+Bedrock bundle) or iOS work? Do pirated copies or online "verification-free" launchers work?

Yes. The LeviLauncher launcher itself is free and open source, but the Android version verifies that the game is genuine: the device must have the official Minecraft installed from Google Play (package name `com.mojang.minecraftpe`, version 1.21.80 or later). At startup it checks whether the installation source is the Google Play store, and if not, it shows "非正版MC，请确保设备上MC来自于谷歌商店" (not genuine MC; make sure MC on the device comes from Google Play) and refuses to start. Bedrock is sold separately on each platform: purchases on the Microsoft Store/PC (including the Java+Bedrock PC bundle) and iOS do not include the Android version, so you need to buy it separately on Google Play (you can pay with a Google Play gift card, among other methods); after buying, install it from Google Play, and preferably launch it once. Cracked or repackaged MC downloaded from forums, cloud drives, mcapks and similar sources cannot pass verification. LiteLDev does not provide any way to skip the genuine check, and "verification-free/cracked" launchers circulating from third parties are not officially supported; issues with them are not handled. Download the official version only from <https://github.com/LiteLDev/LeviLauncher-Android/releases>. In addition, the launcher supports only ARM64 devices (32-bit phones cannot use it). The PC version of LeviLauncher likewise requires a licensed copy (Microsoft Store).

*Applies to: all current LeviLauncher-Android versions (latest v1.7.1)*

## Does LeviLauncher on Android depend on the Minecraft installed on the phone? What are the requirements for the game?

Yes. The device must have the official Minecraft Bedrock Edition (1.21.80 or later) installed from Google Play. The launcher checks whether its installation source is Google Play, and repackaged/cracked MC or MC installed from other sources cannot be launched through the launcher. On top of that, the launcher can import official Minecraft APKs and run other game versions inside the launcher without installing each one into the system (imported versions usually need version isolation turned on), but the Google Play version must still stay on the device. Project page: <https://github.com/LiteLDev/LeviLauncher-Android>.

*Applies to: all current LeviLauncher-Android versions (latest v1.7.1)*

## After opening LeviLauncher on Android, my worlds and mods from MC are gone. How do I import worlds, addons, resource packs and `.so` mods into the launcher?

LeviLauncher on Android uses its own data directory, which is isolated from the data of Minecraft itself (when launched directly from the Google Play version), so the launcher does not show your original worlds. To import: package the world or change its extension to `.mcworld`, use `.mcaddon` for an addon, and `.mcpack` for a resource pack/skin pack, then choose LeviLauncher in "Open with" to import it. You can also import, export and back up in the launcher's content management (worlds, resource packs). `.so` native mods (and `.levipack` mod packages) can likewise be opened with LeviLauncher through "Open with", or added on the "Mods" page. If version isolation is turned on, data is also independent between versions, so make sure you pick the right version when importing.

*Applies to: all current LeviLauncher-Android versions (latest v1.7.1)*

## What format are the "mods" imported into LeviLauncher on Android? How do they differ from LeviLamina mods? Is an apk on a cloud drive a mod?

Mods for LeviLauncher on Android are Android native mods: a single `.so` library, or a packaged `.levipack` (a ZIP containing `manifest.json`, `lib<name>.so` and `config`)/`.mcmod`/`.zip` mod package. Import them directly through the launcher to use them. They are loaded by the launcher's built-in Preloader (preloader-android) and use the separate `pl::` API; you do not need, and cannot use, LeviLamina (LeviLamina mods are Windows `.dll` files and cannot run on Android). They are not addons either. An apk circulating online is generally a repackaged game installer with mods built in, not a mod you can import on its own, and repackaged MC cannot pass the launcher's Google Play genuine check; the launcher's "Import APK" is only for importing an official Minecraft APK as an extra version. If a cloud drive mixes in mods for other Android launchers, you need to find a `.so`/`.levipack` made for LeviLauncher and matching your game version, then import it with the launcher.

*Applies to: all current LeviLauncher-Android versions (latest v1.7.1)*

## How different is the API of LeviLauncher on Android (formerly LeviLaunchroid) from LeviLamina? Can I develop with LeviLamina's headers?

Completely different; you cannot use LeviLamina's headers directly. LeviLauncher on Android does not provide game class headers and a game API (events, commands and so on) like LeviLamina. Android native mods are based on the Preloader SDK built into the launcher (LiteLDev/preloader-android) and use the separate `pl::` API (lifecycle, Hook, Signature lookup, Patch, Config, Input, Mod Menu and more); you must locate game functions yourself through signatures/symbols and then hook them. The mod structure (`load`/`enable`/`disable`/`getSelf`, where `getSelf` returns `ll::mod::NativeMod`) is similar to a LeviLamina mod. For the API documentation see <https://levimc.org/LeviLamina/developer_guides/android/api/mod/>, for the getting-started tutorial see <https://levimc.org/tutorials/develop/first-android-mod/>, and for the source code see <https://github.com/LiteLDev/LeviLauncher-Android>.

*Applies to: LeviLauncher-Android current version (latest v1.7.1)*

## How do I load RenderDragon shaders (such as Newb) in LeviLauncher on Android? Do I need to repackage the game? Does the launcher include MBL? After upgrading to 1.26.x, textures turn into "logs"/all white, shaders have no effect, or the game crashes. What should I do?

You do not need to modify the APK. LeviLauncher on Android has no built-in shader loader; you need to add a MaterialBin loader mod (`.so`) yourself:

1. mtbinloader2 (MBL2): download the latest `libmtbinloader2_aarch64-linux-android.so` from <https://github.com/mcbegamerxx954/mtbinloader2/releases> (currently v0.1.18, updated for 26.60) and import it under the launcher's "Mods";
2. or download MaterialBinLoader (`libmbl2.so`, for MC >=1.26.45.1) directly on the launcher's "External mods" page.

Then import the shaders as a resource pack (you can also search for shaders such as newb on the launcher's CurseForge page and download them), and enable them in the game.

Note: older loaders are not compatible with new MC versions and cause textures to turn into logs, all white, or crashes, so use the latest loader and update the launcher to the latest version. Since 26.10, mtbinloader2 has removed autofix, so the shader itself must be updated by its author for the matching MC version; if you enable a shader and see no effect, it is usually because the shader version does not match the game version or the loader is not enabled, and updating the shader fixes it. You cannot use BetterRenderDragon to load shaders on Android (it is for PC). The PC version of LeviLauncher has removed the "RenderDragon shaders" setting; on PC, use BetterRenderDragon.

*Applies to: LeviLauncher-Android v1.7.1; MC 1.26.x (including 26.60)*

## How do I load 4D skins in LeviLauncher on Android without modifying the APK? Where do I download the 4DSkin mod?

You do not need to modify the APK. Download 4DSkin directly from the "External Mods" page of the launcher (release page: <https://github.com/QYCottage/4DSkin-Release>, distributed as `4DSkin.levipack`), and choose a version compatible with your current MC version. Then make your 4D skin into a skin pack and import it.

*Applies to: LeviLauncher-Android current version*

## Minecraft on my Android phone auto-updated / I want to play an older MC version. How do I use an older version in LeviLauncher? How do I install apk/apks files?

You do not need to uninstall the MC installed from Google Play (the launcher requires the Play Store version of MC to be installed on the device). Just add the older version in LeviLauncher:

1. On the "Download" page, sign in with a Google account that owns Minecraft and download the version you need directly from Google Play (use "Download by version" to specify a version code, for example the version code of 1.21.80.3 is `972108003`; you can only get builds that the account can still get);
2. Or obtain the official apk/apks package yourself and tap "Import APK" on the "Download" page (APK and APKS are supported); no extra installer is needed.

An imported version must have "Version isolation" enabled in the instance settings before it can launch. If the import fails or crashes, update LeviLauncher to the latest version first. Note that the launcher does not support versions earlier than 1.21.80.

*Applies to: LeviLauncher-Android v1.7.0 and later (Google Play download); importing an APK works on the current version*

## How do I change the style, position and size of the levimap minimap? How do I open the big map?

Long-press the minimap to open the settings menu: you can make it round, drag it to a new position, adjust the display scale with `Zoom` and the minimap size with `Size`. In recent versions of levimap, double-tap the minimap to expand the big map, or tap `Big Map` in the menu. If double-tapping does nothing, your mod version is too old; download the latest version from Discord (the launcher must also be 1.5.4 or later).

*Applies to: Android LeviLauncher 1.5.4 and later; third-party mod levimap. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Where do I find and enable the built-in mods in the new Android LeviLauncher?

In game, tap the floating button to open the "Mod Menu", then filter by "Built-in" or look at the "Built-in features" group. These are the built-in mods (quick drop, quick perspective switch, hide UI, auto sprint, zoom, FPS/CPS display, gyroscope, Pojav controls and more); enable the ones you need. The mod menu can be turned on or off in the instance settings (on by default).

*Applies to: Recent Android LeviLauncher (versions with the mod menu, up to the latest v1.7.1)*

## Is there a mod for Android LeviLauncher that can force-switch resource packs in game?

Yes. The third-party mod BetterResourcePackManager does this. You can download it from the qycottage Discord channel (a 26.40 version already exists).

*Applies to: Android LeviLauncher; third-party mod BetterResourcePackManager (a version for MC 26.40 exists). Not confirmed against the source code or the documentation: treat it as a pointer.*

## What are the alternatives to libBetterResourcePackManager on Android?

BetterResourcePackManager has three main features: loading RenderDragon shaders, switching resource packs in game, and loading 4D skins. Alternatives: for 4D skins, use the 4Dskin mod (available on the qycottage Discord); for shaders, use mtbinloader2; there is no alternative for switching resource packs in game. On Windows, use BetterRenderDragon to load shaders. Note: as of 2026-08, BetterResourcePackManager already had a 26.40 version, so check the qycottage Discord for a new version that matches your game version.

*Applies to: Android LeviLauncher; third-party mod. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I export structures in LeviLauncher on Android? Why can't I find my old structures?

In the launcher's world list, open the world's action menu and tap "Extract structures". The launcher can only find structures that are already saved in the world: first enter that world through this launcher, place a structure block and set it to save mode, name the structure and tap save, leave the world, then come back and tap "Extract structures". You can then export structures one by one or as a ZIP. Structures that were not saved into the world with a structure block cannot be found.

*Applies to: Android LeviLauncher current version*

## How do I get redstone display / chunk display (shader-style overlays) with LeviLauncher? Why doesn't the shader pack take effect?

These effects come from material (`material.bin`) shader packs, which only work after you install a material loader mod: on Android, load mtbinloader2 (<https://github.com/mcbegamerxx954/mtbinloader2>); on PC, install BetterRenderDragon (BRD, <https://github.com/QYCottage/BetterRenderDragon>); then add the redstone/chunk display material pack. Adding only the material pack without a loader has no effect.

*Applies to: LeviLauncher (Android/PC); third-party material loader mod. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can I use features of other third-party clients (such as the Flarial Android client) in LeviLauncher on Android?

You can try: extract the arm64 `.so` file from the client's installation package (APK), then import it on the launcher's "Mods" page (the launcher supports importing `.so`, a `.zip` containing `manifest.json` and a `.so`, and `.levipack`/`.mcmod` mod packs); it then loads as a native mod. Whether it works depends on the third-party client itself: users report that the `.so` extracted from Flarial 1.139.3 works, while newer versions may crash after import (newer versions check the package name), and may also crash when playing online. Such third-party `.so` files are not officially supported by LeviLauncher; use only trusted sources and test in an isolated version first.

*Applies to: LeviLauncher-Android current version (v1.7.1); third-party client compatibility depends on its version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## After launching the game with LeviLauncher on Android the frame rate is locked at 60 FPS although my phone supports 120Hz. What should I do?

The frame rate cap is unrelated to the launcher; it is a setting of the game itself: raise the frame rate limit in the game under "Settings → Video" (on some models it is also limited by the system/vendor refresh-rate policy). The launcher's built-in FPS display mod only displays the frame rate and does not limit it.

*Applies to: All current versions (depends on Minecraft's own settings and the device). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can the new LeviLauncher on Android no longer access files outside its own app directories? Can mod config files placed under `/storage/emulated/0/games/` still be read?

Yes. Since v1.5.27 the Android version has reworked storage access and permissions: it no longer requests "All files access" (`MANAGE_EXTERNAL_STORAGE`) or storage permissions such as `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` (the maintainers say this is to allow listing on Google Play). Apart from the launcher's own directories (`/storage/emulated/0/Android/media/org.levimc.launcher/`, `Android/data/org.levimc.launcher/` and the app's private directories), other locations cannot be accessed directly; importing files is now authorized through the system file picker. Mods that used to keep their config in public directories such as `/storage/emulated/0/games/` need to switch to a directory the launcher can access (for example the game data directory of the relevant instance).

*Applies to: LeviLauncher-Android v1.5.27 and later*

## Does LeviLauncher on Android need the mod menu floating window? Built-in mods (perspective switch, CPS, etc.) disappear when I turn it off.

Yes. Built-in mods and mods that use the launcher's unified UI interface are now attached to the mod menu (previously each mod drew its own interface with imgui). So once you turn off "Mod menu" in the instance settings, the floating windows and HUD of the built-in mods are no longer shown. If you don't want it to cover the screen, turn on "Show only in pause menu" in the mod menu's general settings (it then appears only on the pause screen), or adjust the size and opacity of the floating button, or lock its position.

*Applies to: Android LeviLauncher versions with the mod menu (up to the latest v1.7.1)*

## I added a resource pack in LeviLauncher Android, but it does not show up in the game. What should I do?

The resource pack was usually placed in a different storage location. In the launcher's content management (resource pack page), use "Select storage" to switch the location and import again: if it was "External", switch to "Internal", and if it was "Internal", switch to "External". If the instance has version isolation enabled, choose "Version isolation (internal)" or "Version isolation (external)". If none of these work, try turning version isolation on or off.

*Applies to: Android LeviLauncher, current version*

## Is the "Keep running in background" option gone since LeviLauncher Android 1.6.1? What if the game has to reload when I switch back?

v1.6.1 removed the launcher's foreground service (the former "Keep running in background" option). This feature is now provided by the BedrockTools mod: update BedrockTools to v1.5.11 or later (the old 1.5.9 does not work on 26.60) and turn on No Disconnect in BedrockTools. Minecraft then keeps running in the background and does not need to reload when you switch back.

*Applies to: LeviLauncher-Android v1.6.1 and later (currently v1.7.1); BedrockTools v1.5.11+*

## Which mod loader does LeviLauncher Android use? Is there Android mod development documentation or a template, and where do I start?

LeviLauncher for Android has no loader like LeviLamina; instead it has the Preloader SDK built in (<https://github.com/LiteLDev/preloader-android>), which provides the `pl::` API: mod lifecycle (`<pl/Mod.hpp>`, `PL_REGISTER_MOD`), Hook, Signature, Patch, Config, Input, Mod Menu and more. The official API documentation is now part of the LeviLamina documentation, in the "Android Native Mods API" section: <https://levimc.org/LeviLamina/developer_guides/android/api/mod/> (pages for Mod/Hook/Signature/Patch/Config/Input/Mod Menu and more); getting-started tutorial: <https://levimc.org/tutorials/develop/first-android-mod/>. For a template, use <https://github.com/QYCottage/levilauncher-android-mod-template> (create a repository with Use this template, build a `.levipack` with CMake+Ninja, and GitHub Actions can also build it automatically); for a complete example, see `examples/full-cpp-mod` in the LiteLDev/LeviLauncher-Android repository.

*Applies to: LeviLauncher-Android current version (latest v1.7.1)*

## When I launch the game with LeviLauncher on Android, after playing for a while the frame rate is locked to around 10 FPS (launching the vanilla game does not do this). What causes this?

The launcher may not be on the phone vendor's game/performance whitelist, so the system throttles it and caps the frame rate (the launcher cannot fix this for now). On your side you can try: clearing background apps, manually adding LeviLauncher in the system game assistant/performance mode, updating the game and launcher to the latest versions, and using scheduling tools to mitigate it; a low-end SoC also has an effect. If it still reproduces, report it on GitHub Issues with the device model, Android version and launch log.

*Applies to: All current versions (depends on the device vendor's system policy). Not confirmed against the source code or the documentation: treat it as a pointer.*

## For an instance created with "Import APK" in LeviLauncher on Android, launching hangs at 51% for a long time (slower after clearing background apps), and importing a world also fails. What should I do?

Instances created by importing an APK can launch slowly on lower-end devices (the first launch has to extract native libraries and so on). First update the launcher to the latest version (v1.6.0/v1.6.1 contain many performance and content-management improvements). If the problem remains, try toggling "Version isolation" in the instance settings and retry, or use a version installed normally from Google Play instead. Note that the official documentation states that imported versions usually need version isolation enabled to launch; if the game cannot launch after you turn it off, turn it back on.

*Applies to: LeviLauncher-Android, instances created by importing an APK. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Importing resource packs/mods in LeviLauncher on Android is very slow. What can I do?

The larger the pack, the slower the import. First update to the latest version (v1.6.1 improved pack import speed). If it is still too slow, you can extract the pack manually into the launcher's data directory:

- Without version isolation: `/storage/emulated/0/Android/media/org.levimc.launcher/minecraft/_shared/external/games/com.mojang/resource_packs/`;
- For an instance with version isolation enabled: `/storage/emulated/0/Android/media/org.levimc.launcher/minecraft/<instance directory>/external/games/com.mojang/resource_packs/`.

Then launch the game directly. In most cases importing inside the launcher is enough (the folder name after import is random).

*Applies to: LeviLauncher-Android current version (when using the new shared storage layout)*

## Playing MC with LeviLauncher on Android stutters from time to time, or on 26.40 loading resources and generating the world when joining a server is abnormally slow. What causes this?

Common causes:

1. Many mods installed at once, Vibrant Visuals or chained effects enabled, so the load is too high. Reduce the number of mods and turn off Vibrant Visuals; the game caps at 60 FPS by default, and mods such as BedrockTool can unlock the frame rate.
2. When 26.40 launched, packages provided by some third-party version libraries were faulty (problems with the APKS and APK package contents), making loading/world generation very slow. The licensed Google Play version does not have this problem, so switch to a licensed package (since v1.7.0 you can download directly from Google Play on the launcher's "Download" page).

*Applies to: LeviLauncher-Android; point 2 applies to third-party packages from the MC 26.40 launch period. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What tools are generally used to analyze `libminecraftpe.so` when developing Android native mods?

Common reverse-engineering tools are IDA Pro, Ghidra, Binary Ninja, radare2/Cutter, Reko and others. `libminecraftpe.so` has a very large number of functions (millions), so opening it in IDA or similar tools is very slow, uses a lot of memory, and may even hang or crash. Once you have located the target function, Android native mods usually resolve the address at runtime with a signature, for example `pl::memory::resolveSignature("...", "libminecraftpe.so")` provided by PreLoader.

*Applies to: Android native mod development (independent of the launcher version). Not confirmed against the source code or the documentation: treat it as a pointer.*

## I installed a Minecraft package of over 300 MB in LeviLauncher on Android, but it takes over 700 MB. Why?

For an imported package, the launcher keeps a copy in that version's directory (`base.apk.levi`; split packages are also kept as `*.apk.levi`), and it also has to extract the native libraries from it before running, so the space used is about twice the package size. This is normal.

*Applies to: versions imported or downloaded in LeviLauncher on Android*
