# LeviLauncher on Windows: features and settings

## How do I switch the Microsoft/Xbox account in the PC version of LeviLauncher? It keeps going back to the original account after I click "Switch account".

The PC launcher has no separate account page. Click the user avatar in the top bar: when you are not signed in there is "Sign in to Microsoft account", and when you are signed in the card that pops up has a "Switch account" button at the bottom. With normal privileges it opens the Windows account picker, where you can choose another Microsoft account. The command-line equivalents are `LeviLauncher.exe account login` (sign in or switch) and `account logout`. If the launcher runs as administrator, sign-in goes straight through Windows authentication and the account picker does not appear, so it looks as if it keeps switching back to the original account. In that case, restart the launcher with normal privileges. You can also switch accounts in the Xbox App, or sign out and sign in again inside the game. The PC launcher uses only one account at a time and does not support several Xbox accounts online at once or one-click switching; the Android version can manage multiple Xbox accounts in the launcher.

*Applies to: LeviLauncher 1.0.3 and later (Windows)*

## Can the worlds, resource packs and behavior packs of the original Microsoft Store (GDK) Minecraft be migrated or inherited into a LeviLauncher instance?

Yes, in three ways:

1. When creating or installing an instance, turn on "Instance isolation" and choose "Inherit from shared game data" under "Inherit from". This copies the system's shared Minecraft data (worlds, resource packs, settings, etc.) into the new instance. You can also pick another isolated instance of the same type as the source. Copying can be slow when there is a lot of data; just wait.
2. An instance without isolation already shares data with the system's Minecraft, so you see your original worlds directly.
3. Manual migration: copy the original `worlds`, `resource_packs`, `behavior_packs` and other folders into the instance's game data directory (you can find it with "Open folder" in the launcher), or drag `.mcworld` / `.mcpack` / `.mcaddon` files onto the launcher's content page to import them.

"Importing" an installed game imports only the game itself, not the worlds.

*Applies to: LeviLauncher 1.x (Windows, GDK and UWP instances that support isolation)*

## Can I run multiple copies of the GDK version of Minecraft?

GDK instances can run multiple copies. On the command line, use `LeviLauncher.exe launch <instance> --force` (or `play <instance> --force`) to start another copy while the same instance is already running. UWP instances cannot do this, because Windows allows only one copy of a UWP game. Note that the game has no world lock: several copies can enter the same world, and the one that exits last overwrites the world saved by the earlier one, so running multiple copies is mainly suited to developer testing.

*Applies to: LeviLauncher 1.x (Windows), GDK instances only*

## A new LeviLauncher version has been released on GitHub. Why does "Check for updates" in the launcher not find it?

Versions marked Pre-release on GitHub, such as `1.1.0-beta.x`, are pushed only if you turn on "Receive beta updates" under "Settings → Software update" in the launcher. Stable releases (the latest is currently v1.1.0) are pushed directly. You can also download manually from <https://github.com/LiteLDev/LeviLauncher/releases>.

*Applies to: LeviLauncher 1.x (Windows)*

## How do I install LeviLamina client mods (such as minimap, replay, litematica) and other client mods?

Use LeviLauncher (Windows): first install LeviLamina on a GDK game instance (on the instance page, or with the command line `LeviLauncher.exe loader install`), then install LeviLamina client mods on that instance. You can install them directly from the launcher's "LeviMC Mods" page (it reads the levimc.org/mods catalog and installs through the built-in lip-compatible package manager, so you do not need to install lip separately); the command-line equivalents are `LeviLauncher.exe mod search` / `mod install`. You can also import mods downloaded elsewhere: `.mcmod` is supported, and if you choose "All files (*.*)" in the file picker you can also import `.zip` and standalone `.dll` files. DLL-type mods such as BetterRenderDragon and BetterRPM are imported the same way. UWP x64 instances can load preload-native DLL mods that are compatible with the current game version, but automatic LeviLamina installation supports only supported GDK versions. Hot-injection clients are not supported, and older DLLs may be incompatible with newer game versions. Test them one by one in a clean isolated instance.

*Applies to: LeviLauncher 1.x (Windows)*

## LeviLauncher shows no progress when downloading a game version and nothing happens for a long time. Is it stuck?

Download progress is in the cloud-shaped download icon in the top right of the "Download" page; clicking it opens the "Download manager" page, where you can view and manage current download tasks. While a download is running, the icon is highlighted and has a red dot. If there is no error, it is usually still downloading, just slowly. If it is too slow or fails repeatedly, you can run a speed test and switch the mirror source when downloading, or turn on "Use mirror source" in the settings. You can also retry later or import a local installation package instead.

*Applies to: LeviLauncher 1.x (Windows)*

## The old "Enable RenderDragon shader loading" switch (built-in BetterRenderDragon) is missing from the new LeviLauncher. How do I load RenderDragon shaders now?

This built-in feature was removed in LeviLauncher 1.0.0 (it had to be adapted again for every game version, was costly to maintain and had caused crashes). The Ctrl+R resource hot-reload setting was removed at the same time. What to do now:

- PC: download the BetterRenderDragon `.dll` matching your game version from <https://github.com/QYCottage/BetterRenderDragon/releases>, import it on the launcher's mods page (choose "All files (*.*)" in the file picker to select a standalone `.dll`) and enable it. The effect is the same as before; import the shader/texture pack itself on the resource packs page.
- Android: use a loader such as MaterialBinLoader2 (mbl2).

You can also replace the game's material files directly. Going back to the old 0.3.x launcher for this is not recommended.

*Applies to: LeviLauncher 1.0.0 and later (currently v1.1.0)*

## If I click "Delete instance / Delete version" in LeviLauncher on a version without version isolation, will it delete all game data such as worlds?

No. Deleting an instance removes only that instance's folder in the launcher's instance directory (by default `%LOCALAPPDATA%\LeviLauncher\Instances\<instance name>` in 1.1.0, or under the custom data directory if you set one; older versions use the `versions` directory). For a UWP instance the package is unregistered first, and deletion is refused while the game is running. It does not delete the default game data shared by non-isolated versions (worlds, resource packs, etc.). Note: for an instance with version isolation enabled, the data is stored in the instance's own workspace and is deleted along with the instance, so back up important worlds first.

*Applies to: all current versions (since LeviLauncher 1.1.0 the instance directory is `%LOCALAPPDATA%\LeviLauncher\Instances`)*

## How do I delete a downloaded version installation package in LeviLauncher? I cannot find the delete button.

On the "Download" page, a downloaded version shows an "Install" button group on its right. Click the drop-down arrow next to it, choose "Delete installation package" and confirm. You do not need to open the directory and delete it manually.

*Applies to: all current versions (verified on LeviLauncher 1.1.0)*

## Do I need a licensed Minecraft Bedrock Edition to use LeviLauncher? Can I use it offline or without buying the game?

You must own a licensed copy. LeviLauncher supports only licensed Minecraft Bedrock Edition, cannot bypass license verification, and has no Java-style "offline mode".

- Windows: when downloading or installing the game, the launcher needs to obtain the game license from Microsoft with a Microsoft account. Sign in in the launcher (click the avatar, or use the command line `LeviLauncher.exe account login`) and choose the account that bought the game. If that account has not bought it, you get `ERR_LICENSE_NOT_ENTITLED`; only a trial license gives `ERR_LICENSE_FULL_REQUIRED` (the full version cannot be installed). Without a genuine license the game runs in trial mode. The Xbox sign-in inside the game is still done in the game.
- Android: you need to buy and install the licensed Bedrock Edition from Google Play.

One reason is that LeviLamina updates depend on information provided by Mojang, so the project must insist on license verification. Launchers from unofficial channels and installation packages of unknown origin are not supported, and the official community does not handle piracy issues. Official downloads: <https://github.com/LiteLDev/LeviLauncher/releases> or the documentation site <https://levimc.org/LeviLauncher/>.

*Applies to: all current versions (Windows v1.1.0, Android v1.7.1)*

## Can LeviLauncher start BDS (Bedrock Dedicated Server)?

No. LeviLauncher is a client launcher. It is only used to install, manage and start the Minecraft Bedrock Edition client (the GDK / UWP versions on Windows, and the Android version) and to load client mods; it has nothing to do with running a server. To run a BDS server, use the LeviLamina server setup (for example, install LeviLamina with lip, or use the docker-levilamina-server image).

## How do I import `.mcpack` / `.mcaddon` / `.mcworld` resource packs, texture packs, skin packs or maps in LeviLauncher for Windows?

- Method 1: on the "Launch" page open "Content management" (or the matching resource pack / behavior pack / skin pack / world page) and drag the `.mcpack` / `.mcaddon` / `.mcworld` file into the window to import it (the interface prompts "Drag in .mcworld/.mcpack/.mcaddon to import"). You are asked to choose the target instance, and for worlds and per-player skin packs you also choose the player.
- Method 2: on the content page, click the "Import" button in the top right and choose the file.
- Method 3: on the command line, `LeviLauncher.exe pack import "D:\Downloads\xxx.mcpack"` (use `world import` for worlds); add `-i <instance>` to specify the instance.

The type of a pack (resource / behavior / skin) is determined by its `manifest.json`. Common formats such as `.mcpack` from a phone work as well, but the pack must be compatible with the game version. You can also use "Open directory" on the content page and place the files in the matching folder manually. Note: mods (`.mcmod` / `.dll`) must be imported under the instance's "Manage mods", not dragged into the resource area.

*Applies to: LeviLauncher (Windows), current version*

## Can a Minecraft instance installed by LeviLauncher be registered with the system so it appears in the Start menu and launches directly, or can I create a shortcut?

Yes.

1. Register with the system: on the launch page click "Register with system" (command line `LeviLauncher.exe instance register <instance>`). Windows then treats the instance as the installed Minecraft of that channel (release / preview), and the Start menu, `minecraft://` links and Xbox features will use it. It replaces the Store version or another instance currently occupying that channel (data is kept), and asks for confirmation. Registering a GDK or UWP instance requires Windows Developer Mode to be on; UWP instances are registered automatically at launch. Use `instance unregister` to release the registration.
2. Desktop shortcut: choose "Create desktop shortcut" in the menu next to the "Launch" button (or `instance shortcut <instance>`). It creates `Minecraft - <instance name>.lnk`; double-clicking it starts that instance through the launcher.

*Applies to: LeviLauncher (Windows), current version (v1.x)*

## Does LeviLauncher support Linux (or macOS)?

No. LeviLauncher is available only for Windows (GDK / UWP) and Android. There is no macOS or Linux version and no plan for one (the maintainers once tried a Wine-based GDK adaptation but gave it up). Linux users currently often use third-party solutions based on the Android version of the game (such as MCPelauncher, which requires buying the game on Google Play); these are not LiteLDev projects.

## How does LeviLauncher load mods? How does it coexist with the PreLoader / LeviLamina loading method?

LeviLauncher (Windows) ships its own native loader, `LeviLauncher.dll`. When it installs or launches a version, it places the DLL in the game directory and adds an import of it to the import table of the game exe (`Minecraft.Windows.exe`; for UWP, the exe in the manifest). The DLL then loads the native DLL mods in the instance's `mods` directory (x64 only). If `preloader.dll` exists in the version directory (for example when LeviLamina is installed), the external PreLoader takes over loading all mods and `LeviLauncher.dll` skips native mod loading. The LeviLamina client is installed through the launcher's built-in lip-compatible package manager (you do not need to install lip or .NET separately). Also, the PreLoader on PC and the preloader on Android only share a name; they are not the same thing.

*Applies to: LeviLauncher (Windows) 1.0.0 and later; built-in package manager 1.1.0 and later*

## Is there a client mod for LeviLauncher that zooms the view with a key (Zoom)?

You can use the third-party mod <https://github.com/OpenMCBE/Zoom> (for PC; press C to zoom): download `Zoom.dll` from its Releases, add it under "Manage mods" of a LeviLauncher (GDK version) instance, and start the game through the launcher. Note that its README states support only for `1.26.20.04`; other game versions may be incompatible.

*Applies to: LeviLauncher (Windows) GDK instances; the mod's README states support for game version 1.26.20.04. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What is LeviLauncher good for compared with the official launcher?

Mainly, you can install and manage multiple Bedrock versions at the same time (release / preview, GDK and UWP) and use version isolation to keep each version's data separate, whereas the official launcher can play only the latest version. It can also load native mods, install LeviLamina and client mods, and manage content such as worlds and resource packs.

*Applies to: all current versions (Windows); UWP isolation requires x64 and 1.19.70.2 or later*

## Can LeviLauncher show the reason for a failed game launch, as the Java Edition PCL launcher does?

Not when the game process itself crashes: Bedrock Edition writes no error log, and crashes are usually silent. However, when a step handled by the launcher itself (launching, registering, installing or uninstalling mods, etc.) fails, the error dialog since 1.1.0 lists the most likely causes in plain language together with technical details, and offers a copy button and a button that opens the launcher log directory. If the game does not start, follow these troubleshooting steps: start without mods, check the Windows components, and reproduce the problem with a clean isolated version.

*Applies to: LeviLauncher (Windows) current version; launcher-side error hints require 1.1.0 and later*

## Can LeviLauncher (Windows) bind a different account to each game instance for multiplayer testing?

Not at the moment. The Microsoft account signed in to the Windows launcher is used only for license verification and downloading versions. The account used in the game follows the system's Xbox sign-in: whichever account the system is signed in to on Xbox is the one the game uses. (Switching between multiple Xbox accounts in the launcher is a feature of the Android version.)

*Applies to: LeviLauncher (Windows) current version (1.1.0)*

## How do I show 4D skins in LeviLauncher? Importing a 4D skin pack does not work on newer versions (1.26.10+).

In newer versions Mojang does not allow ordinary resource packs to load skins that have models. Use the 4DSkin mod made separately by a community author: load it as a mod and then import the 4D skin mcpack directly, without depending on BetterResourcePackManager. Note that enabling it together with BetterRenderDragon may crash the game. Note also that GitHub `QYCottage/4DSkin-Release` currently publishes only `4DSkin.levipack` (v2.0.0/v2.0.1). `.levipack` is the mod pack format of LeviLauncher for Android, while "Manage mods" in LeviLauncher for Windows accepts only `.mcmod` / `.zip` / `.dll`, so Windows users need to get the matching PC build from the group files of the official QQ group or from Discord. If you do not want to use a mod, you can also unpack the `.mcpack` and copy its files, by type (`persona` / `custom` / `vanilla`), over the matching folders of the game's skin packs (a user succeeded on 26.10/26.20, but ordinary marketplace skins may then become invisible).

*Applies to: LeviLauncher (Windows / Android); the 4DSkin v2.x release on GitHub is an Android `.levipack`; supported game versions follow the latest 4DSkin mod release. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Why can some CurseForge content be found on the website but not in LeviLauncher's content download? Are there LeviLamina mods on CurseForge?

The launcher's CurseForge page searches content for Minecraft Bedrock (`gameId` 78022) and can filter by game version and category (class/category). If the website finds an item but the launcher does not, it is usually because the item does not support the game version you selected or is not in the selected category; clear the game version filter or switch the category and search again. CurseForge currently has only Addons and similar content and no LL mod category (the maintainers say they are applying to open one). Install LL mods from the launcher's LeviMC Mods page.

*Applies to: LeviLauncher (Windows) current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## After I close the Minecraft window started through LeviLauncher, the process/console takes a long time to disappear. Is this normal?

Yes. After you close the window of the GDK version of Minecraft, the game exe process keeps running in the background for a while before it exits. This is the behavior of the GDK game itself and has nothing to do with the launcher.

*Applies to: GDK Minecraft Bedrock Edition (Windows). Not confirmed against the source code or the documentation: treat it as a pointer.*

## When importing a map in LeviLauncher it asks me to choose a player, and the list shows old names. Where do these players come from?

The list shows the player profiles that have signed in to this instance (GDK version) on this device, that is, the player directories under the instance's `Users` folder. The names are the Gamertags cached by the launcher (so they may be old names), and they are not players who played online in the world. The world is imported under the profile of the selected player.

*Applies to: LeviLauncher (Windows) GDK instances; UWP instances have no player profiles*

## How do I update the new LeviLauncher (v1, desktop) to a beta version or use automatic updates?

Turn on "Receive beta updates" in the launcher settings. After that, the launcher checks for updates at startup, shows a prompt when it finds a new beta, and after you confirm it updates in place without uninstalling the old version.

*Applies to: LeviLauncher (Windows) v1.0.x and later*

## Is there a mod that raises the size limit of structure blocks (structure files)?

There is a third-party mod, StructureLimitRemover: <https://github.com/fangkuaichaoge/StructureLimitRemover>. It supported MC 26.4x when the question was asked; before using it, confirm that its released version supports your game version.

*Applies to: depends on the mod's version support (MC 26.4x at the time). Not confirmed against the source code or the documentation: treat it as a pointer.*

## A CoralFans command installed in LeviLauncher has no completion in the game, as if it were not installed. How do I troubleshoot?

Turn on the console in the LeviLauncher instance settings (the game debug console; since v1.1.0 you can also use the command line `LeviLauncher.exe instance set <instance name> --console`), start the game, and check the mod loading log. In this case the cause was the missing dependency bsci (switched off by mistake or not installed), so CoralFans was not loaded; installing or enabling bsci fixed it. A command conflict with another mod (such as Lamium) also makes commands stop working; all CoralFans commands can be renamed in its config.

*Applies to: LeviLauncher (Windows) + LeviLamina client mods. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Importing some `.mcpack` / `.mcaddon` resource or behavior packs into LeviLauncher fails (other packs work). What is the cause?

1. Wrong extension: a single resource / behavior / skin pack should use `.mcpack`. `.mcaddon` is a format that bundles several packs, and when importing a `.mcaddon` the launcher recognizes only the `.mcpack` files inside it or the `manifest.json` in subfolders. If a file that contains a single pack, with `manifest.json` at the archive root, uses the `.mcaddon` extension, the import fails; rename it to `.mcpack`.
2. If `manifest.json` itself is not valid JSON (a syntax error), the launcher cannot parse it and the import fails. JSON comments, which MC allows, are now supported by the launcher, and the problem of pure Script API behavior packs being ignored when importing `.mcaddon` has also been fixed (the script module is imported into the behavior pack directory).
3. A pack with a duplicate UUID requires you to choose overwrite; for skin packs you must choose the player first.

*Applies to: LeviLauncher (Windows), current version*

## Can I use BetterRTX with the GDK edition of Minecraft installed by LeviLauncher? What if the BetterRTX installer doesn't detect the launcher's instance directory?

Yes, but you have to install it manually. The installer bundled with BetterRTX does not detect instances installed by LeviLauncher. Follow the instructions at <https://bedrock.graphics/#setup>, or pick a preset at <https://bedrock.graphics/presets>. On recent GDK versions BetterRTX has become a resource pack: if you got a `.mcpack`, click "Import" on the launcher's "Content" page or drag the file in, then enable ray tracing in the game. The launcher's content import only accepts `.mcworld` / `.mcpack` / `.mcaddon`; for other formats (such as `.rtpack`), follow the official BetterRTX instructions. The old method was to replace the shader files manually in the instance directory's `renderer/materials`. Note that BetterRTX is a set of shader files, not a DLL mod; BetterRenderDragon (BRD) is the DLL that is injected into the game to load Render Dragon shaders from resource packs. The two are different things.

*Applies to: GDK edition of Minecraft + LeviLauncher; follow the official BetterRTX instructions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## LeviLauncher fails to start, and `startup.log` or the debug output shows `config.Load failed: ERR_CONFIG_CORRUPTED: invalid character ... looking for beginning of value` (corrupted config file). What do I do?

The launcher's settings file `config.json` is corrupted (it is not valid JSON). Close the launcher and delete `%APPDATA%\LeviLauncher\config.json` (in versions before v1.1.0 it is `%APPDATA%\levilauncher.exe\config.json`); the launcher generates a default configuration the next time it starts. To see the debug output, append ` /debug` to the "Target" of the shortcut (or run `LeviLauncher.exe --debug` on the command line); the startup log is at `%LOCALAPPDATA%\LeviLauncher\Logs\startup.log`. Note that deleting the file resets the launcher settings to their defaults; if you changed the data directory (`base_root`) before, set it again in the settings, otherwise the instances stored there are not shown.

*Applies to: LeviLauncher current version (Windows); paths are the new layout used since v1.1.0*

## Where is the game data (`com.mojang`, worlds, resources, etc.) of the Windows GDK edition of Bedrock Edition stored?

Without instance isolation, the GDK data root is `%APPDATA%\Minecraft Bedrock` (`%APPDATA%\Minecraft Bedrock Preview` for the Preview). Shared content (such as resource packs) is stored in `Users\Shared\games\com.mojang`, and each account's worlds are in `Users\<account ID>\games\com.mojang\minecraftWorlds`. For an instance with "Instance isolation" enabled in LeviLauncher, the data is stored in the `Minecraft Bedrock` folder inside the instance directory (`<instance directory>\Minecraft Bedrock\Users\...`).

*Applies to: Windows GDK edition of Bedrock Edition; LeviLauncher v1.1.0*

## I can't find the "Microsoft GDK" option from the tutorial video in the settings of the new LeviLauncher. Is something missing?

Nothing is missing. That option was used by older versions to register the game; newer versions no longer need it, as long as the game starts normally. In the current version, if you want an instance to appear in the system app list, you can optionally use "Register to system" in the menu next to the launch button on the launch page.

*Applies to: LeviLauncher 0.3.11 and later*

## Does installing a game version with LeviLauncher overwrite or affect my existing worlds?

No, it doesn't overwrite them. If you don't select "Instance isolation" when installing an instance, that instance shares its game data (worlds, settings, etc.) with the Minecraft already on your system; if you select it, the data is stored separately in the instance directory (you can choose to inherit a copy of the shared data). The launcher itself doesn't modify your worlds. If you want to uninstall the original game, back up the worlds under `%APPDATA%\Minecraft Bedrock\Users` first, then delete it.

*Applies to: LeviLauncher v1.1.0 (GDK edition of the game)*

## A console window pops up every time I start the game with LeviLauncher (PC). Can I get rid of it?

Yes. Open the "Instance settings" of that instance and turn off "Enable console" under the launch options; the console window no longer appears when you start that instance. The option is stored per instance, so you have to set it for each instance separately.

*Applies to: LeviLauncher v1.1.0*

## Task Manager shows very high resource usage while LeviLauncher is running (even running on the discrete GPU and causing frame drops in the game). What can I do?

The launcher UI is rendered with WebView2, and effects such as background images and frosted materials increase usage. After the game has started you can simply quit the launcher without affecting the game (note that if "Hide to tray on close" is on, closing only hides it; quit it fully from the tray or turn that setting off). You can also lower usage under "Personalization -> Material and readability" by switching to the "Solid color" material or not using a background image.

Since 0.3.11, WebView2 uses a safer software-rendering GPU setting.

*Applies to: LeviLauncher (Windows) 1.x. Not confirmed against the source code or the documentation: treat it as a pointer.*

## The LeviLauncher documentation site no longer opens. What is the new address?

All project documentation has moved to levimc.org, with the language at the start of the path. The Simplified Chinese LeviLauncher docs are at <https://levimc.org/zh-Hans/LeviLauncher/>, Traditional Chinese at <https://levimc.org/zh-Hant/LeviLauncher/>, and English at <https://levimc.org/LeviLauncher/>. The LeviLamina docs are at <https://levimc.org/LeviLamina/>. Old docs.levimc.org addresses (such as `/LeviLauncher/zh-HK/` and `/LeviLauncher/zh-CN/`) redirect to the new addresses automatically.

*Applies to: current version (since 2026-11)*

## Windows Defender, Kaspersky, 360 and other antivirus programs flag LeviLauncher. Is it a virus?

It is a false positive. The LeviLauncher backend is written in Go (Wails framework) and is not code-signed. Statically compiled Go programs are often misjudged by the heuristic scanning of antivirus software: the same code built by GitHub Actions may be flagged while a local build is not, and packing with UPX makes it flagged even more. The launcher's bundled vcruntime-related DLL (used to load mods) has existed since early versions, and the launcher is flagged even when it is deleted, so it is not the cause. The maintainers have submitted the false positive to Microsoft several times and adjusted the build parameters to reduce it. Download only from official channels (GitHub Releases or the official Lanzou mirror). If the launcher gets blocked, add the launcher directory to your antivirus exclusions.

*Applies to: all current versions (Windows)*

## Can I export a shader (RenderDragon resource pack) downloaded in LeviLauncher?

The launcher has no resource pack export feature, but you can export manually: on the "Content → Resource packs" page, click the "Open" button (folder icon) in the top right to open the instance's resource pack directory, or click the folder icon next to a resource pack to open the folder it is in. Compress the contents of the shader folder into a zip and change the extension to `.mcpack` (a user reported that this works). If you only want to bring a resource pack to another isolated instance in the launcher, you can use "Transfer content" on the content page, or the command line `LeviLauncher.exe pack copy <pack> --to <instance>`, without packing it manually.

*Applies to: current version (Windows). Not confirmed against the source code or the documentation: treat it as a pointer.*

## When I start the UWP Bedrock Edition through LeviLauncher, the mouse leaves the window when I turn the camera in game (both windowed and fullscreen). Is this a LeviLamina problem?

It is not a problem of LeviLamina or the launcher. It is a mouse-locking problem of the Windows / UWP version of Minecraft itself. Search for "MCBE lock mouse" to find solutions that adjust Windows settings. Solutions that require extra external tools are not recommended.

*Applies to: UWP Minecraft. Not confirmed against the source code or the documentation: treat it as a pointer.*
