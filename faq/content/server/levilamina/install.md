# Installing LeviLamina on a server

## LeviLamina

### Does LeviLamina support Linux (or macOS, ARM)? How do I run a LeviLamina server on Linux?

LeviLamina has no native Linux build. It can only be loaded into the x64 Windows build of BDS, and the official releases only provide `windows-x64` packages. The maintainers give these reasons: the Linux build of BDS currently has no symbols; threads, exceptions, hooks and similar mechanisms differ from Windows, so mods would have to be rewritten; and in testing, the Windows build of BDS under Wine actually performs better than the native Linux build of BDS. So there are no plans for a native Linux build in the short term.

On Linux, run the Windows build of BDS + LeviLamina with Wine:

1. Use lip directly (recommended): lip now has Linux x64 and macOS builds. It ships its own Wine (on Linux it comes from Kron4ek/Wine-Builds) and installs the VC++ runtime automatically, so you do not need to install Wine yourself. The commands are the same as on Windows: `lip setup --game <version>` (it installs the game and the latest LeviLamina that supports it, so you do not need to install LeviLamina separately; add `--accept-eula` in scripts/containers), then `lip run`.
2. Use the official Docker image: `docker run -d -it --name levilamina -e EULA=TRUE -p 19132:19132/udp -p 19132:19132/tcp -v levilamina-server-data:/data ghcr.io/liteldev/levilamina-server:latest-wine` (you must set `EULA=TRUE`, and the host must be x64). See the tutorial at <https://levimc.org/tutorials/server/docker/>. If you want LeviStone (which runs Endstone plugins written in Python on top of LeviLamina), there is the `ghcr.io/liteldev/levistone-server:latest-wine` image.
3. You can also set up the server directory on Windows first, then copy the whole thing to Linux and run it with Wine; the same server folder can be moved between operating systems. If you install Wine yourself, use a recent version.

Other platforms:

- x64 macOS: runs through lip's Wine.
- Apple silicon macOS: use lip's Wine plus Rosetta 2.
- arm64 Windows: the system emulates x64, so it works.
- arm64 Linux: not officially supported. Solutions such as box64, FEX and Hangover cannot run a LeviLamina server reliably; use an x64 machine instead.
- Android, iOS: not supported.
- 32-bit: BDS itself does not support it.

A hosting provider's Linux panel server generally cannot run it; you need a machine where you have Docker access or can run lip yourself. If you must run a server with plugins natively on Linux, you can consider other loaders such as Endstone, but it is not compatible with the LeviLamina ecosystem (conversely, LeviStone lets Endstone plugins run on LeviLamina, but it still needs Wine).

*Applies to: all current versions (LeviLamina 26.x, lip 0.41.x, docker-levilamina-server latest-wine)*

### How do I install addons (behavior packs/resource packs, `.mcpack`/`.mcaddon`) on a LeviLamina (LL3) server? Does LL2's (LiteLoaderBDS) AddonsHelper still exist?

LL2's AddonsHelper (the `addonshelper` folder) no longer exists in LeviLamina; putting files there does nothing. A LeviLamina server supports addons just like vanilla BDS. The options are:

1. The vanilla way: put the extracted pack in `./behavior_packs` or `./resource_packs` (or `worlds/<world>/behavior_packs`, `resource_packs`), then write the `uuid` (pack_id) and `version` from `header` in the pack's `manifest.json` into `worlds/<world>/world_behavior_packs.json` or `world_resource_packs.json`. To tell a resource pack from a behavior pack, look at the `type` of `modules` in `manifest.json` (`resources` is a resource pack, `data`/`script` is a behavior pack), not at the file name.
2. Since LeviLamina 1.9.6, the server loads extracted packs from the `resource_packs/` and `behavior_packs/` subdirectories of a mod directory (such as `plugins/<mod name>/behavior_packs`, and `plugins/LeviLamina/behavior_packs` for LeviLamina itself). Behavior packs there are added to the behavior pack stack automatically, so you do not need to edit the world's json (mainly for packs bundled with a mod).
3. To drop `.mcaddon`/`.mcpack`/`.zip` files in and have them loaded automatically: install the community mod GMEssentials (`lip install github.com/GroupMountain/GMEssentials-Release`, which depends on GMLIB and others), set `enable` of `addon_loader` to `true` in its config under `features`, then put the packs in `./addons` in the server root (the directory can be changed in `addon_loader.directory`). GMEssentials' `addon_loader` is off by default (some other features, such as `chat_formatter` and `dynamic_motd`, are on by default). After changing the config, run `ll reactivate GMEssentials` or restart. It also has a feature for cleaning up unknown blocks (`cleaner_unknown_block`).
4. The standalone CLI tool <https://github.com/harry-xi/addon-manager> can also manage BDS addons.

Note: `LiteLDev/LegacyAddonsManager` and `pingguo114514/AddonsManager` are both archived, and the 7-zip package they depend on can no longer be resolved, so the current lip cannot install them; do not use them.

*Applies to: LeviLamina current version (26.60.x); method 2 needs LeviLamina 1.9.6 or later*

### How do I install the LeviLamina client build on the Minecraft Bedrock (Windows) client? Can I install it manually?

Manual installation is not recommended (the steps are far more troublesome than you would expect). The current recommendation is to install with LeviLauncher: on the "Download" page, pick a GDK version for which the "Loader" column shows LeviLamina as supported, keep "Install LeviLamina" on when installing the instance, and choose the latest LeviLamina version. For an existing instance, install/update/remove LeviLamina on the "Loader" tab under "Instance settings". After that you can install client mods under "LeviMC Mods" (or import `.mcmod` files under "Manage mods"). LeviLauncher installs LeviLamina automatically only for supported GDK versions. Note that the current lip only manages servers (lip documentation FAQ: "Can lip install client mods? No. lip manages servers only."); the client's LeviLamina and mods are managed by launchers such as LeviLauncher. Since LeviLamina 26.60.8, packages no longer have a `#client` variant: the default variant contains both the server and client builds, and a `#client` dependency declared in an old package's `tooth.json` is resolved by LeviLauncher to the default variant. A server mod may need to be recompiled to work on the client.

*Applies to: LeviLamina 1.8.0 and later (client support); LeviLauncher for Windows*

### When migrating a LeviLamina server, is copying only the world (`worlds`) enough? Where are the player data of LeviLamina and of mods such as economy and land claims stored?

No. LeviLamina's own data (such as the player info database `playerinfo`, a LevelDB-based KeyValueDB that records the mapping between UUID/XUID/player name) is stored in the `mods/LeviLamina/data/` directory (`plugins/LeviLamina/data/` in older versions), and you need to copy it too when migrating. Each mod's data is in its own directory; for example, LegacyMoney's economy data is `mods/LegacyMoney/economy.db`, and for other mods such as land claims, pack the data files in the corresponding mod directory and migrate them together. The player info database starts on demand by default (it is loaded only when a mod uses it); to keep it always enabled, set `targeted.playerInfo.alwaysLaunch` to `true` in `mods/LeviLamina/config/Config.json`. The mod directory is `mods/`; early 0.x versions used `plugins/`.

*Applies to: LeviLamina current version*

### Can I only install LeviLamina with lip? Can I manually extract the GitHub Release zip into the BDS directory? What if a manual install from an online tutorial gives errors or missing DLLs?

Installing with lip is the officially recommended way and the only one the official documentation describes; manually extracting and assembling files is not recommended.

Recommended: download and install `lip-<version>-win-x64.msi` from <https://github.com/LiteLDev/lip/releases/latest>, create an empty folder and run `lip` in it (a graphical terminal interface; choose "Create server"), or use the command line: `lip setup --game 1.26.60` (or `lip install LeviLamina` / `lip install github.com/LiteLDev/LeviLamina@<version>`). lip downloads the matching BDS version and all dependencies automatically and generates `bedrock_server_mod.exe`. Start the server with `lip run` or `bedrock_server_mod.exe`, not with the vanilla `bedrock_server.exe`. If you cannot reach GitHub, configure a proxy/mirror in lip.

If you insist on installing manually (not officially supported and error-prone): you have to do everything lip does by hand. Read `lip.toml` in the package root (`tooth.json` in older versions), download the matching versions of the dependencies listed under `deps` (bds, CrashLogger, levilamina-loc, PeEditor, PreLoader, bedrock-runtime-data), place the files according to the `place` field (put `LeviLamina/` from LeviLamina's `levilamina-v<version>-server-release-windows-x64.zip` into `mods/LeviLamina/`), and finally run `PeEditor.exe -mb` in the server directory to generate `bedrock_server_mod.exe`. Regular users should download the release build; the debug build is only for development and debugging. For manual installation details, follow each package's `lip.toml`.

Note: online tutorials that mention `LiteLoader.dll`, `LLMoney.dll`, `.lib` files, or dropping a dll straight into `plugins` belong to the era of the archived LiteLoaderBDS (LL2). They are outdated and incompatible with LeviLamina (the economy plugin is now LegacyMoney). Follow the official tutorial <https://levimc.org/tutorials/server/first-server/>.

*Applies to: LeviLamina current version (26.60.x); lip v0.4x*

### Which directory should LeviLamina mods/plugins go in? I extracted one manually, and it does not load and there is no error. How do I troubleshoot?

Install mods with lip: `lip install <mod address>` (for example `lip install github.com/LiteLDev/LeviOptimize`; packages from LiteLDev can use a short name such as `lip install LeviOptimize`; for LSE use `lip install LegacyScriptEngine#lua` and so on). lip handles the directory structure and dependencies automatically.

When installing manually, note the following:

1. Directory: mods go under `mods/` in the server root, one folder per mod, that is, `mods/<mod name>/manifest.json`. After you install LegacyScriptEngine, LSE turns `plugins/` into a link to `mods/` on startup, so the `plugins` in old tutorials is actually `mods`.
2. From the archive, put in the whole folder that contains `manifest.json`, without an extra directory level (opening the mod folder should show `manifest.json` directly). A folder without `manifest.json` is silently skipped, with no error.
3. The folder name must match `name` in `manifest.json` (for example, do not keep or add a "[MineBBS]-" prefix), otherwise you get `Mod name ... do not match folder ...`.
4. Only mods developed for LeviLamina can be loaded. A standalone `.dll` is usually a LiteLoaderBDS (LL2) plugin, which LeviLamina cannot use; discontinued LL2-era plugins do not work either. When you drop a single old-style `.js`/`.lua`/`.py` script (the matching LSE engine must be installed) into `plugins/`, LSE generates a folder and manifest for it at the next startup, and it loads after one more restart.
5. Check that the prerequisite dependencies are installed and loaded successfully (look for dependency errors in the console/`logs`). You can use `ll list` to see the loaded mods.
6. If `"passive": true` is set in `manifest.json`, the mod is not loaded automatically at startup (it is loaded only when something depends on it); load it manually with `ll load <mod name>`.
7. A load error can also be caused by an outdated VC runtime; install the latest Visual C++ Redistributable x64: <https://aka.ms/vc14/vc_redist.x64.exe>.

Also, addons (behavior packs/resource packs) and server mods are different things; do not put mods in the behavior pack/resource pack directories.

*Applies to: LeviLamina 1.x and later (currently 26.60.x); the `plugins` link requires LegacyScriptEngine*

### What is LL3 (LeviLamina), and where do I download and install it? How does it relate to LiteLoaderBDS (LL1/LL2)? Can new BDS versions still use LL2? How do I choose a version?

LL1 and LL2 are both called LiteLoaderBDS. They have long been unmaintained and cannot be used with new BDS versions. LL3 is LeviLamina, the mod loader from the LiteLDev (LeviMC) team, and many mods (such as CoralFans) use it as a prerequisite. Repository/releases: <https://github.com/LiteLDev/LeviLamina>.

Installing with lip is recommended: install lip from <https://github.com/LiteLDev/lip/releases/latest>, then in an empty folder run `lip` (choose "Create server" in the interface) or the command `lip setup --game <game version>` (such as `lip setup --game 1.26.60`). lip installs the matching BDS and a compatible LeviLamina; `lip install LeviLamina` installs the latest LeviLamina and the latest game version it supports.

LeviLamina versions correspond one to one with game versions, so you cannot choose freely: for example, LeviLamina 26.60.x corresponds to 1.26.60, 26.10.x to 1.26.10, and 1.9.x to 1.21.132. See the "Supported versions" page of the official documentation for the table.

Documentation: tutorial <https://levimc.org/tutorials/server/first-server/>, LeviLamina documentation <https://levimc.org/LeviLamina/> (the install pages at the old addresses `levilamina.liteldev.com` and `lamina.levimc.org` have moved to the levimc.org tutorial).

*Applies to: all current versions (LeviLamina 26.60.8; lip 0.41.x)*

### How do I upgrade a server running LeviLamina (and LSE) to a new BDS/LeviLamina version? Do I have to reinstall everything?

Before upgrading, back up the whole server directory and make sure the mods you use have versions that support the new release.

Method 1 (lip workspace, recommended): stop the server, then run `lip setup --game <new game version>` in the server directory (add `--dry-run` first to see the plan), or choose "Change game or loader version…" in the workspace menu of the lip interface. lip uninstalls the old BDS, installs the new BDS and a compatible LeviLamina, and keeps `server.properties`, `allowlist.json`, `permissions.json`, `worlds/` and `mods/`. Mods with no compatible version are listed, and lip asks whether to uninstall them. Note that `lip update` only updates mods; it does not change the game or LeviLamina version. Packs you placed yourself in `behavior_packs/` and `resource_packs/` are deleted, so keep a copy outside the workspace first.

Method 2 (fresh install): create an empty folder and install the new server with lip (`lip setup --game <version>`, then `lip install` the mods you need, for example `lip install LegacyScriptEngine#quickjs`). Then copy the old server's `worlds/`, `server.properties`, `allowlist.json` and `permissions.json` over the new ones, and copy the configuration and data of each mod from the old `mods/` (do not overwrite the newly installed mod files). Also copy any server-level resource packs and behavior packs.

LSE script plugins can usually be reused as they are; native (C++) mods must be replaced with versions that support the new release. If errors or crashes occur after the upgrade, check the startup log to find the incompatible mod.

*Applies to: LeviLamina current version; lip 0.41 and later (`lip setup`); the fresh-install migration method applies to all versions*

### Can I add LeviLamina to an already running vanilla BDS server? Do I need to reinstall?

Yes, and you do not need to recreate the world. However, LeviLamina is strictly tied to the BDS version: each LeviLamina version supports only specific BDS versions (for example, LeviLamina 26.60.8 depends on BDS 1.26.60). If your vanilla BDS version does not match, switch to a version LeviLamina supports.

Recommended: create an empty folder, install lip, and run `lip install LeviLamina` in it. This automatically downloads a compatible BDS, LeviLamina and dependencies such as PreLoader, PeEditor and bedrock-runtime-data, and PeEditor generates `bedrock_server_mod.exe`. Alternatively, specify the game version with `lip setup --game <BDS version>` (lip picks the latest LeviLamina that supports that version). Then copy the old server's `worlds/`, `server.properties`, `allowlist.json`, `permissions.json` and so on into it, and start the server with `lip run` or by double-clicking `bedrock_server_mod.exe`.

Assembling the files manually (placing `bedrock_runtime_data`, PeEditor and LeviLamina yourself, then running PeEditor) is not recommended, because it is easy to miss a dependency.

*Applies to: all current LeviLamina versions (install/setup semantics of lip 0.41.x)*

### After installing lip, how do I install a LeviLamina server (and LegacyScriptEngine) from scratch?

1. Install lip, create an empty folder as the server directory, and open a terminal (cmd or PowerShell) in it.
2. Run `lip install LeviLamina` (equivalent to `lip install github.com/LiteLDev/LeviLamina`). lip automatically downloads the latest BDS that LeviLamina supports and sets everything up. You must type yes to accept the Minecraft EULA (in scripts, add `--accept-eula`). You can also specify the game version with `lip setup --game <version>`.
3. When you need script plugins, install LSE: `lip install github.com/LiteLDev/LegacyScriptEngine` (the default variant includes the QuickJS and Lua engines), or install a single engine as needed, such as `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs` or `#python`.
4. Start the server with `lip run` or by double-clicking `bedrock_server_mod.exe`.

If your network is slow, set a GitHub proxy: `lip config set github_proxy <URL>`. Manual assembly is not recommended (language packs, CrashLogger and other dependencies are easily missed); when reinstalling, use a new empty folder. Official tutorial: <https://levimc.org/tutorials/server/first-server/>.

*Applies to: LeviLamina 26.60.x; lip 0.41.x*

### When installing a LeviLamina server with lip on Windows, the command fails or errors midway (for example, a `PeEditor.exe` error). How do I troubleshoot it, and which program do I start afterwards?

1. Make sure lip is installed and the command is written correctly: in cmd you cannot use the `./` prefix (use `.\` or just write the command).
2. Run `lip install LeviLamina` in a new empty folder and wait until the progress finishes completely. Network errors midway are usually an interrupted download or a GitHub access problem; retry, or set `lip config set github_proxy <URL>`. When it fails, read the message and the full report under `.lip/logs/`.
3. VC++ runtime: during setup, recent lip versions automatically install a missing Microsoft Visual C++ Redistributable (an administrator permission prompt appears; choosing "No" makes the installation fail). If an outdated runtime causes a `PeEditor.exe` error or error code 1114, install the latest version manually from <https://aka.ms/vc14/vc_redist.x64.exe>.
4. LeviLamina is tied to specific BDS versions, so do not specify a game version that does not match.

After installation, start the server with `lip run` or by double-clicking `bedrock_server_mod.exe`.

*Applies to: all current LeviLamina versions (Windows); lip 0.41.x*

### Can a rented panel server (game panel or cloud provider) run LeviLamina? What if it runs on my machine but fails to start after I upload it to the panel?

1. System requirements: LeviLamina can only be loaded into the Windows build of BDS. A Windows panel can run it directly. An x64 Linux panel must be able to run lip (lip bundles Wine to run the Windows server) or use the official Docker image `ghcr.io/liteldev/levilamina-server:latest-wine`. A panel that can only start the vanilla Linux `bedrock_server` cannot use it directly. You can tell the system from whether the panel starts an `.exe`/`.cmd` or a `.sh`.
2. It runs locally but fails to start on the panel (for example, a missing runtime message or error code 1114): the server usually lacks the Microsoft Visual C++ runtime or has an outdated one. Install the latest version from <https://aka.ms/vc14/vc_redist.x64.exe>. If the provider does not allow installing it, you can place the VC++ runtime DLLs the server depends on (such as `msvcp140.dll`, `vcruntime140.dll` and `vcruntime140_1.dll`) in the server root directory (where `bedrock_server_mod.exe` is). You can check the exact dependencies with `ldd bedrock_server_mod.exe` in an MSYS2 MINGW64 terminal, or with tools such as dumpbin from Visual Studio.
3. You can also install the whole server locally with lip and then upload it, or ask the provider to install it for you. The community also has third-party panel install scripts (such as LeviBox on MineBBS), which are not officially maintained.

*Applies to: all current LeviLamina versions*

### Can LeviLamina run on old systems such as Windows 7 / Windows Server 2016 / 2012 R2? It crashes on startup there, or PreLoader reports `Can't load ./plugins/LeviLamina\LeviLamina.dll, Error code: 127` (the specified procedure could not be found). Which system should I choose to run a server?

No. LeviLamina uses newer Windows APIs and a recent VC++ runtime, and supports only Windows 10, Windows 11 or Windows Server 2019 and later. Windows 7/XP, Windows Server 2012 R2 and Windows Server 2016 cannot run it (vanilla BDS runs on old systems, but not once LeviLamina is installed). Error code 127, "the specified procedure could not be found", when loading `LeviLamina.dll` on an old system is usually caused by the system lacking a required API. Installing a runtime does not fix it; you must upgrade or reinstall the system. (If 127 appears on a supported system, it is most likely a dependency version mismatch between LeviLamina and a mod; check the `Dependency diagnostic` in the log.)

Also, in current versions LeviLamina lives under `mods/LeviLamina/`; the `plugins/LeviLamina` path in the error belongs to the old layout.

For running a server, Windows Server 2022 (or 2019 and later) is recommended, and the newer the better. You can also use lip on x64 Linux or macOS (lip bundles Wine to run the Windows server). When you install with lip, lip installs the components the server needs, including the VC++ runtime.

*Applies to: all current LeviLamina versions (including 26.60.x)*

### After BDS starts, only PreLoader is running (`LeviLamina not found, PreLoader is running as DLL Loader...`) and neither LeviLamina nor mods are loaded. What is the cause?

PreLoader did not find LeviLamina itself in the mods directory (the loading chain is `bedrock_server_mod.exe` -> `PreLoader.dll` -> LeviLamina -> other mods). Placing only `PreLoader.dll` is not enough; you must also install LeviLamina itself. Do not download the GitHub repository source code; use the compiled files from a Release. The best way is to install with lip (`lip install github.com/LiteLDev/LeviLamina`), which installs PreLoader, PeEditor, CrashLogger, bedrock-runtime-data and other dependencies together and generates `bedrock_server_mod.exe`.

In current versions LeviLamina itself must be in the server's `mods/LeviLamina/` directory (the folder name is case-sensitive), not in the old root directory or `plugins/`. For manual installs, note that if a `plugins/` directory exists, PreLoader uses it as the mods root first; you can set another path in `modsPath` in `PreLoaderConfig.json`. If the files are in a mess, the easiest fix is to delete the old files and reinstall with lip.

*Applies to: LeviLamina 1.x and later (currently 26.60.x), server*

### My LeviLamina server is in a directory with Chinese (non-ASCII) characters, and startup or mod loading fails, log paths are garbled, dependencies are reported missing, or it crashes. What should I do?

Move the whole server to a pure English (ASCII-only) path and start it again. Some mods and script engines (for example, GMLIB's zip extraction logic in the past, and the old LSE NodeJS engine) do not handle Chinese paths correctly, which causes these problems. It is also recommended to use only English for `level-name` in `server.properties`. If you want the world to show a Chinese name in the game, export the map, rename it in the client and import it again; editing `levelname.txt` directly has no effect.

*Applies to: all current versions (whether it breaks depends on the installed mods). Not confirmed against the source code or the documentation: treat it as a pointer.*

### What is the `.pdb` file that comes with a mod? Where should I put it, and can I delete it?

A `.pdb` is a debug symbol file. It is not the mod itself and is optional. If you want to use it, put it in the same directory as the mod's `.dll` (that is, under `mods/<mod name>/`, next to the dll), not in the server root directory. Then the crash stack traces generated by CrashLogger show readable function symbols, which helps developers analyze crashes. If you do not care about readable crash logs, you can leave it out or delete it; it does not affect operation.

To install the mod itself, lip is recommended (`lip install <package name>`); for a manual install, extract the mod folder from the archive into `mods/`.

*Applies to: all current LeviLamina versions (the mod directory is `mods/`)*

### What is `runtimedata` (`bedrock_runtime_data`) in the LeviLamina server directory? Do I need to install it, and where does it go?

It is the bedrock-runtime-data package (`github.com/LiteLDev/bedrock-runtime-data`), a required dependency of LeviLamina. You can think of it as a new form of PDB/symbol data (encrypted and obfuscated), and it must be installed together with LeviLamina. When you install LeviLamina with lip, it is installed automatically as a dependency and extracted to `bedrock_runtime_data` in the server root directory (the same level as `bedrock_server.exe`), not into the `plugins` or `mods` directory.

The runtime data for the server and the client is released separately (versions carry a `-server` or `-client` suffix, for example `26.60.6-server.16` and `26.60.5-client.16`). lip picks the right one for the side you install, and they cannot be mixed.

*Applies to: LeviLamina versions that use bedrock-runtime-data (including current 26.60.x)*

### There is no loader in my BDS server directory, and JS plugins for LegacyScriptEngine (LLSE) are not loaded when I drop them in. How do I install LeviLamina and LegacyScriptEngine?

Plugins need a loader installed before they can run. Using lip is recommended: after installing lip, run `lip` in the server folder (it has a built-in graphical terminal interface that can install BDS + LeviLamina directly), or follow the official tutorial to run a server from the command line. Then install LSE: `lip install LegacyScriptEngine#quickjs` (for JS plugins; the other variants are `#lua`, `#nodejs` and `#python`, and without a variant both the QuickJS and Lua engines are installed). lip automatically installs dependencies such as LegacyRemoteCall, LegacyMoney and iListenAttentively.

Put plugins in `mods/` (since LSE 0.23.0, `plugins/` is made a link to `mods/` at startup). A single old-style script placed directly gets a folder and manifest generated at the next startup, and is loaded only after you restart the server once more.

*Applies to: LeviLamina 26.x; LegacyScriptEngine 0.23.x; lip 0.41.x*

### On Windows, after importing a client mod (dll) such as a minimap with LeviLauncher, nothing happens in the game and the mod list does not show it. What is the cause?

Such client mods depend on the LeviLamina client build. First install LeviLamina for the instance: turn on "Install LeviLamina" when installing the instance in LeviLauncher, or for an existing instance, install it from the gear next to the instance selector on the "Launch" page → "Instance settings" → the "Loader" tab (this corresponds to `levilamina-v<version>-client-release-windows-x64.zip` in the release).

LeviLamina supports only specific GDK game versions (the "Loader" column on the download page shows the LeviLamina version); an unsupported version shows "This game version does not support LeviLamina". The mod must also be the client variant and match the instance's game version and LeviLamina version. Prefer installing from "LeviMC Mods" on the launch page, which lists only mods that fit the instance's LeviLamina. To import manually, go to "Manage mods" → "Import .mcmod" (choose "All files" for `.zip`/`.dll`).

*Applies to: LeviLauncher (Windows) current version; LeviLamina client*

### I deployed LeviLamina on a panel server (a hosted server where lip cannot run directly), and PreLoader reports errors or the server crashes frequently on startup. Is PreLoader broken?

Usually the files are incomplete. A common cause is a missing bedrock-runtime-data (`github.com/LiteLDev/bedrock-runtime-data`), which is a required dependency of LeviLamina and must match the LeviLamina version. Install locally on your own computer with lip (`lip setup --game <version>` or `lip install LeviLamina`). lip installs BDS, PreLoader, bedrock-runtime-data, CrashLogger, levilamina-loc and other dependencies, and runs PeEditor on the exe. After confirming locally that it starts normally, package the whole server directory and upload it to the panel server, instead of assembling files manually.

*Applies to: LeviLamina 1.x up to the current version*

### I want to install plugins (such as CoralFans) on a Bedrock BDS server. Do I need LeviLamina or Endstone?

It depends on which platform the plugin belongs to. To use LeviLamina mods, install LeviLamina. To use Endstone plugins, install Endstone, or install LeviStone on LeviLamina to run Endstone plugins (LeviStone supports only Endstone plugins written in Python; to install it, run `pip install levistone --target mods/EndstoneRuntime` in the directory of a server that already has LL installed).

CoralFans is a LeviLamina mod, so you need LeviLamina, with an LL version that matches the one it supports. Installation docs: <https://coralfans-dev.github.io/CoralFans-doc/#/InstallDoc>.

### When installing LeviLamina manually, what does `-server.1` mean in a bedrock-runtime-data dependency version such as `26.10.4-server.1`? Is it related to the `bedrock_server` version?

`-server` means this is runtime data for the server (BDS); the client uses `-client.N`. The number N is the release sequence number of that data package, incremented on every re-release, and is unrelated to the `bedrock_server` version number. The leading version corresponds to the game build: for example, `26.60.6-server.N` corresponds to BDS 1.26.60.6 and `26.60.5-client.N` to client 1.26.60.5 (see the LeviLamina supported versions table).

For a manual install, do not pick one arbitrarily; use the exact version specified under `deps` in LeviLamina's `lip.toml`. For example, the LeviLamina 26.60.8 server depends on `"github.com/LiteLDev/bedrock-runtime-data" = "26.60.6-server.16"`. This is usually the one with the highest sequence number released at the same time as that LL version. Installing with lip is recommended, as it installs the correct version automatically.

*Applies to: LeviLamina 26.x current version*

### When I manually extract several plugin/mod archives into the server directory, the `README.md`, `CHANGELOG.md` and `LICENSE` files conflict by name. What should I do?

`README.md` (description), `CHANGELOG.md` (changelog) and `LICENSE` (open-source license) are not needed to run, so you can skip them or delete them and keep only the plugin's own files. Each LeviLamina mod should go in its own `mods/<mod name>/` subdirectory (containing `manifest.json`), which usually avoids conflicts between mods. LLSE script plugins can go in `plugins/` (since LSE 0.23.0 it is a link to `mods/`, and at startup the plugins are migrated automatically and a manifest is generated). Installing with lip is recommended, so you avoid manual extraction.

*Applies to: all current versions (manual installation)*

### Which components do I need to install to run a plugin server with LeviLamina?

Installing with lip is recommended (docs: <https://levimc.org/lip/>). In the server directory:

1. `lip install LeviLamina` (or `lip setup --game <version>`) installs BDS + LeviLamina.
2. To run LLSE script plugins, install LegacyScriptEngine: `lip install LegacyScriptEngine` (without a variant, both the QuickJS and Lua engines are installed), which covers most uses.
3. Install `lip install LegacyScriptEngine#nodejs` only if you have NodeJS plugins; for Python plugins use the `#python` variant. Install them as needed.

Then start the server with `lip run`.

*Applies to: lip 0.40 and later; LegacyScriptEngine current version*

### When running LeviLamina on Linux with wine, the console terminal is misaligned, typed commands display incorrectly, or there are encoding problems. What should I do?

When running manually with wine, you can use a simple intermediate program (such as the community-written Go program pts) to forward stdin/stdout, for example: `pts env WINEDEBUG=-all wine cmd /c bedrock_server_mod.exe`. This fixes the misaligned terminal and some encoding errors; `WINEDEBUG=-all` suppresses wine's own debug output. Running LL needs only the 64-bit VC++ runtime (vcrun2022), not the 32-bit one.

Also, lip now officially supports running on x64 Linux and macOS (a Mac with Apple silicon needs Rosetta 2): run `lip setup --game <version>` and then `lip run`. lip bundles Wine, installs the VC++ runtime automatically, and sets `WINEDEBUG=-all` by default (note that lip needs glibc 2.27+ and does not support Alpine).

*Applies to: running a LeviLamina server through Wine on Linux. Not confirmed against the source code or the documentation: treat it as a pointer.*

### When running `bdsdown.exe`, it stops at the Minecraft EULA / privacy policy prompt, typing y has no effect, and LeviLamina reports a BDS protocol version mismatch. How do I download a specific BDS version?

Accept the agreement and specify the version directly with command-line arguments: `bdsdown.exe -y --source version://windows/x.x.x.x`, where `x.x.x.x` is replaced by the full BDS version that the current LeviLamina version supports (the full four-part build number, which you can look up at <https://levimc.org/LeviLamina/versions/>; for example, LeviLamina 26.60.x corresponds to 1.26.60.6; the `github.com/LiteLDev/bds` dependency in LeviLamina's `lip.toml` gives only the three parts 1.26.60).

However, using lip directly is now recommended: `lip setup --game <game version>` (add `--accept-eula` in scripts) automatically downloads the matching BDS and LeviLamina.

*Applies to: bdsdown v1.x (currently v1.2.1)*

### LeviLamina cannot load after installing with lip or manually (it works only once after a computer restart). What could be the cause?

The most common reason LeviLamina does not load is that the BDS version does not match LeviLamina; when you install with lip, a matching BDS version is installed automatically according to the dependencies. If the version is correct and it still fails to load, check whether antivirus software such as 360 deleted or blocked the related files (such as PreLoader, the `bedrock_server_mod.exe` generated by PeEditor, or the dll files in the `mods` directory). Turn off the antivirus or add the server directory to its allowlist, then reinstall.

*Applies to: all current versions (Windows server). Not confirmed against the source code or the documentation: treat it as a pointer.*

### Two seemingly identical LeviLamina servers: on one, a mod loads but its commands do not work, while the other works fine. What is the cause?

Non-ASCII characters such as Chinese in the server path can cause all kinds of odd problems (for example, a mod loads but its commands do not work). Try moving the server to a pure English path without spaces.

*Applies to: general troubleshooting advice. Not confirmed against the source code or the documentation: treat it as a pointer.*

### A tutorial says to edit `plugins\LeviLamina\config\Config.json` (`simpleServerLogger`, `playerInfo` and so on), but the LeviLamina I downloaded has no such config file. Why?

The config file is generated automatically only after you start the server once and LL loads normally (if it is not found or cannot be read, LL rewrites it with default values). Also, manual installation tutorials are mostly outdated; follow the official tutorial and install with lip instead, for example by running `lip install github.com/LiteLDev/LeviLamina` (or `lip setup --game <version>`) in an empty directory to install BDS and LeviLamina together. Note that in new versions these two options are under `targeted.simpleServerLogger` and `targeted.playerInfo`.

*Applies to: LeviLamina 1.x and later; lip syntax follows the current lip 0.41*

### To see server errors (for example an addon model that fails to load), is it useful to open the CrashLogger program? How should I start the server?

No. CrashLogger is only a tool that LeviLamina starts automatically after the server starts, to record crash information when a crash happens. You do not need to open it, and you should not open it manually. Start `bedrock_server_mod.exe` (or use `lip run`) to run the server. Addon errors generally do not crash the server; the errors are printed to the console and to the logs in the `logs` directory, so look there.

*Applies to: LeviLamina, all current versions*

## PreLoader and PeEditor

### `bedrock_server_mod.exe` was not generated after installing LeviLamina (or double-clicking `PeEditor.exe` closes immediately / only prints `No work to do, exiting...`). How do I generate it manually with PeEditor?

Normally you do not need to run PeEditor manually: installing LeviLamina with lip runs `.\PeEditor.exe -mb` automatically. If `bedrock_server_mod.exe` was not generated (or you installed manually or use a hosting panel), open cmd or PowerShell in the server root directory, where `bedrock_server.exe` is, and run:

```powershell
.\PeEditor.exe -mb
```

(Use `-m` to generate without making a backup.)

Notes: PeEditor does nothing when run without arguments and only prints `No work to do, exiting...`; double-clicking it also makes the window flash and close. So you must pass the `-m` argument on the command line.

- `-m` generates `bedrock_server_mod.exe`.
- `-b` renames the original to `bedrock_server.exe.bak`.
- `--exe` specifies the source exe (default `./bedrock_server.exe`).
- `-o` specifies the output directory.
- `--verbose` prints detailed logs.

Then start the server with `bedrock_server_mod.exe` (start it from the command line so you can see errors).

Errors when running PeEditor itself are mostly caused by an outdated VC++ runtime; install <https://aka.ms/vc14/vc_redist.x64.exe> and try again. For a manual installation, the PeEditor/PreLoader versions must match the LeviLamina version (use the dependency versions written in `lip.toml`/`tooth.json` of the LeviLamina package), which is why installing with lip is officially recommended.

*Applies to: LeviLamina 1.x and later (PeEditor 3.8+, currently 3.9.3)*

### An error occurs in the PeEditor step when installing LeviLamina, or `PeEditor.exe` won't open or run when started manually. How do I fix it?

This is usually caused by a missing or outdated Microsoft Visual C++ runtime (for example, right after reinstalling the system). Install the latest VC++ 2015-2022 x64 runtime from <https://aka.ms/vc14/vc_redist.x64.exe>, then reinstall LeviLamina, or run `.\PeEditor.exe -mb` manually from the command line in the BDS directory (the argument is required; double-clicking does not work).

Note: if LeviLamina was not actually installed successfully earlier, installing packages that depend on LeviLamina, such as LSE, also fails. Reinstall LeviLamina first (use `lip list` to check the installed packages).

*Applies to: all current LeviLamina versions*

### All the LeviLamina files are in place, but LL is not loaded when I start BDS (or it crashes right at startup). What is wrong?

For a manual installation, run `PeEditor.exe -m` once from the command line in the BDS directory (a lip installation runs `PeEditor.exe -mb`, which additionally renames the original file to `bedrock_server.exe.bak`). It generates `bedrock_server_mod.exe` from `bedrock_server.exe`. After that you must start `bedrock_server_mod.exe` instead of the original `bedrock_server.exe`; only then is LeviLamina loaded through PreLoader.

Installing LeviLamina directly with lip is recommended (`lip setup` / `lip install LeviLamina`): it installs dependencies such as PreLoader and PeEditor and applies the patch automatically. Then start the server with `lip run`.

*Applies to: all current LeviLamina server versions*

### The bundled `PeEditor.bat` fails to patch when I use a LeviLamina+LSE server pack from a third-party forum (such as MineBBS). What should I do?

Do not use the `PeEditor.bat` from a third-party server pack. Install LeviLamina with lip instead (`lip setup`, or `lip install LeviLamina` followed by `lip install LegacyScriptEngine`); it installs the dependencies automatically and runs `PeEditor.exe -mb` to generate `bedrock_server_mod.exe`. Alternatively, install manually following the official tutorial (run `PeEditor.exe -m` in the BDS directory, then start `bedrock_server_mod.exe`).

*Applies to: current LeviLamina server version. Not confirmed against the source code or the documentation: treat it as a pointer.*

### When running LeviLamina on a Linux server with wine, PeEditor fails to generate `bedrock_server_mod.exe`. What should I do?

The recommended way is now the Linux build of lip: on x64 Linux, `lip setup` downloads and configures Wine and the Visual C++ runtime itself, runs PeEditor automatically when installing LeviLamina, and you start the server with `lip run`. You do not need to install wine/winetricks yourself. You can also use the official Docker image `ghcr.io/liteldev/levilamina-server:latest-wine`.

If you still want to install manually with your own wine: generate the file with `wine PeEditor.exe -m`, make sure the wine prefix is 64-bit (`WINEARCH=win64`), and install the VC runtime with winetricks:

```shell
sudo wget -O /usr/local/bin/winetricks https://raw.githubusercontent.com/Winetricks/winetricks/master/src/winetricks
sudo chmod +x /usr/local/bin/winetricks
winetricks dlls vcrun2022
```

To hide wine's error output, use `export WINEDEBUG=-all`. Also make sure the BDS version matches the installed LeviLamina.

*Applies to: LeviLamina server, current version, x64 Linux (lip 0.41.x)*

### My manual LeviLamina installation did not finish (or I switched to manual after a lip installation failed). What do I do next? After starting, it reports that `CrashLogger.exe` is missing. What should I do?

For a manual installation, run the patcher `PeEditor.exe` (`PeEditor.exe -m`) once in the BDS directory and start the server with the generated `bedrock_server_mod.exe`; only then is LL installed.

If it reports after startup that `CrashLogger.exe` cannot be found, put `CrashLogger.exe` in the LeviLamina mod directory (by default `mods/LeviLamina/CrashLogger.exe`). The path is set by `modules.crashLogger.externalpath` in `mods/LeviLamina/config/Config.json`; it is relative to the LeviLamina mod directory and defaults to `CrashLogger.exe`. If you do not need external crash logs, you can also set `crashLogger.enabled` to `false`.

Installing with lip is recommended whenever possible: it sets up dependencies such as CrashLogger automatically; otherwise you also have to track down dependencies such as LSE NodeJS by hand.

*Applies to: LeviLamina server, current version (CrashLogger 1.4.x)*

### After upgrading LeviLamina I also upgraded/overwrote BDS separately, and now the server won't start and shows no error. How do I fix it?

`bedrock_server_mod.exe` is generated by PeEditor from `bedrock_server.exe`. After overwriting or upgrading the BDS files you must run `PeEditor.exe -m` again to regenerate `bedrock_server_mod.exe`; the old one is not updated automatically.

Also, each LeviLamina version supports only a specific BDS version (the `bds` dependency in its `lip.toml` is pinned to an exact version, for example LL 26.60.8 corresponds to 1.26.60), so do not upgrade BDS on its own. Upgrade everything together with `lip update LeviLamina`; lip installs the matching BDS and runs `PeEditor.exe -mb` automatically.

*Applies to: all current LeviLamina server versions*

### I installed PeEditor on its own with lip but there is no PreLoader. Aren't PeEditor and PreLoader together?

PeEditor is not PreLoader. PeEditor is the patching tool that injects PreLoader into the game executable (it generates `bedrock_server_mod.exe` or patches `Minecraft.Windows.exe` in place), while PreLoader is the library that loads LeviLamina at runtime (`PreLoader.dll`). They are separate lip packages (`github.com/LiteLDev/PeEditor` and `github.com/LiteLDev/PreLoader`).

Do not install these dependencies individually. Install LeviLamina itself with lip, which pulls in all dependencies such as PreLoader, PeEditor and CrashLogger automatically and applies the patch.

*Applies to: all current LeviLamina versions*
