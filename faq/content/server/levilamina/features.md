# What LeviLamina does on a server

## How do I load, unload or reload a single plugin/mod (including LSE script plugins) on a LeviLamina server without shutting it down? Does `/reload` work?

`/reload` is a vanilla command that only reloads behavior packs/addon scripts; it does not manage LeviLamina mods. To manage mods, use LeviLamina's built-in `ll` command in the server console:

- `ll list`: lists the loaded mods so you can confirm names
- `ll load <mod name>`: hot-loads a mod newly placed in the `mods` directory
- `ll unload <mod name>`: unloads it
- `ll reload <mod name>`: reloads it
- There are also `ll enable|disable|reactivate <mod name>`; all of these commands accept an optional trailing `cascade` argument to process the mods that depend on it as well.

`<mod name>` is the `name` in `manifest.json` and must match the mod's folder name under the `mods` directory. Do not use a `.js`/`.dll` file name or a file path, and do not use an engine name such as `legacy-script-engine-quickjs`.

The `ll` command is enabled by default with Admin permission, controlled by the LeviLamina config option `modules.command.modManageCommand`.

Notes:

1. There is no command to reload all mods at once; the command requires a mod name.
2. Whether a mod can be unloaded or reloaded depends on the mod itself. A C++ mod must export/register an unload function (`ll_mod_unload`; with `LL_REGISTER_MOD`, implement `unload()` in the class) to be unloadable; otherwise you get `"The mod does not register an unload function"`. If the unload function returns `false`, you get `"The mod cannot be unloaded"`. Some mods must be loaded before the server starts, so hot-loading them fails; with some mods, commands registered after a reload stop working, or the server even crashes.
3. A LeviLamina server starts quickly, so restarting the server is still the safest approach. If you only need to re-read configuration, many plugins have their own `reload` subcommand.

*Applies to: LeviLamina 0.8.4 and later (still applies to the current v26.60.8)*

## How do I see which plugins/mods are actually loaded on a LeviLamina server console, and details such as a mod's version?

Run `ll list` in the server console. The output looks like `"There are N mods: a, b, c"`, which lets you confirm that plugins installed with lip are really loaded. To see the details of a single mod, use `ll show <mod name>`, which displays the name, author, description, type, version, entry and extra info; adding `cascade` at the end also lists its dependency tree and the tree of mods that depend on it. `ll show` requires a mod name and cannot show everything at once. In an LSE script, you can get the list of loaded plugins with `ll.listPlugins()`.

The `ll` command has Admin permission by default; you can disable or adjust it with `modules.command.modManageCommand` in the LeviLamina config.

*Applies to: LeviLamina 0.8.4 and later (still applies to the current v26.60.8)*

## What is the difference between Endstone and LeviLamina? Can Endstone run LeviLamina dll plugins? Why can Endstone quickly adapt to new BDS versions without full PDBs?

Both inject into BDS and hook it, but they are positioned differently. Endstone is a plugin loader, similar to Bukkit: it wraps BDS in a stable API and does not expose BDS internals directly, and plugins can be written in C++ or Python. LeviLamina is a mod loader, similar to Forge/Fabric, and aims to expose all of BDS's internal interfaces. In implementation, Endstone needs only a very small number of symbols (on the order of a dozen or so); it handles symbols and writes headers by hand, and a few symbols can be obtained by manual reverse engineering. LeviLamina needs more than 200,000 symbols, and its symbol table and headers are generated automatically from the debug information provided by Mojang. Its API/header coverage is therefore much broader, but adapting to a new version requires waiting for Mojang to provide debug information and running the automatic generation process. The two have completely different APIs/ABIs, so Endstone cannot run LeviLamina dll plugins (just as Fabric cannot run Forge jars).

*Applies to: all current versions (Endstone is a third-party project; refer to Endstone itself for its details). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can I shut down a LeviLamina server directly with Ctrl+C? What happens if I click the window's X button?

Yes, you can press Ctrl+C. LeviLamina captures Ctrl+C and runs the normal shutdown process, which has the same effect as typing `stop` and loses no data. (Pressing Ctrl+C again during shutdown ends the process forcibly, so press it once and wait.) If the server was started through a `.bat` file, the command line asks whether to terminate the batch job after shutdown completes; close the window then. Clicking the window's X button is not recommended: although LeviLamina also tries to run `stop` on the window-close event, Windows gives the close event very little time, so the process may be killed before the world has finished saving, which rolls the world back to the last save.

*Applies to: all current versions (Windows server; SIGINT/SIGTERM on Linux/Wine)*

## What is the relationship between LeviLamina and the former LiteLoaderBDS? What does LL3 mean? Should I still use LiteLoaderBDS to run a server?

LiteLoaderBDS (abbreviated LL, with two major versions, LL1 and LL2) is no longer maintained and has been archived because its code was hard to maintain. LeviLamina is its successor: a completely rewritten new project (its planned name was LiteLoader3, which is why it is also called LL3). It contains no LiteLoaderBDS code and is not compatible with old native plugins, so it is not simply a rename. To run a server now, use LeviLamina (<https://github.com/LiteLDev/LeviLamina>, installation with lip is recommended); old LLSE script plugins now run on LeviLamina through LegacyScriptEngine.

## What is the relationship between the LeviLauncher launcher and the LeviLamina client edition (LL client)? How does it differ from the server-side LL?

They are not the same thing. LeviLauncher is a Minecraft Bedrock Edition launcher used to download, install, isolate and launch game versions and to manage mods, similar to PCL2 for Java Edition. The LeviLamina client edition is a mod loader, similar to Fabric for Java Edition: it was ported from the server edition, does not depend on BDS, and provides client interfaces such as input handling and custom rendering, so you can develop mods for it too. When you install an instance with LeviLauncher, turning on "Install LeviLamina" installs LL; leaving it off gives you the vanilla client (like ticking or not ticking Fabric when downloading in PCL). For a server mod to take effect on the client (for example in LAN play), it must be adapted for the client and listen to the corresponding client events.

*Applies to: LeviLamina 1.8.0 (client support) up to the current version; LeviLauncher for Windows*

## Which languages can be used to develop LeviLamina plugins/mods? Is there a difference between a "plugin" and a "mod"? Will the official team support other languages such as Ruby, TypeScript or Go?

"Plugin" and "mod" are just different names. The Chinese documentation says "模组" (mod). Both are now installed in the server's `mods` directory (older versions used the `plugins` directory). Development options:

- C++: native LeviLamina mods.
- LegacyScriptEngine (LSE): write script plugins in JavaScript (QuickJS or Node.js), Lua or Python. The JS documentation is the most complete and is recommended. Install the matching engine with `lip install LegacyScriptEngine#quickjs` (or `#lua`, `#nodejs`, `#python`).
- For Python you can also use LeviStone, which runs Endstone Python plugins on LeviLamina.
- The community also has a .NET-based loader that lets you develop in C# and other dotnet languages (unofficial).

The official team will not support more languages itself as it did with LL2; it only provides the low-level support, and other languages are implemented by the community.

## Why can cheat commands still be used after installing LeviLamina, even though cheats are not enabled on the server (or Xbox achievements are forced on by a plugin)?

LeviLamina enables "force-enable cheat commands" by default. When registering commands, it adds the `NotCheat` flag to every command, removes the "requires cheats" restriction on enum values, and allows selector expansion, so these commands work even when cheats are off in the world, while achievements are preserved. The drawback is that, when cheats are off, the client may be unable to Tab-complete the command name (the first level); arguments can still be completed. You can turn this feature off with `targeted.forceEnableCheatCommands` in `mods/LeviLamina/config/Config.json` (default `true`).

*Applies to: LeviLamina from around 0.8 up to the current 26.60.x, enabled by default on server and client*

## How does LeviLamina's mod (formerly plugin) loading mechanism work? Can it support mods written in other languages?

LeviLamina can load mods and lets a mod register its own mod manager (`ModManager`) with `ModManagerRegistry`, so a runner can be implemented for other languages (LegacyScriptEngine, for example, loads script mods this way). LL assigns each mod to a manager according to the `type` field in its `manifest.json`: when `type` is `native`, the built-in native DLL mod manager (`NativeModManager`) loads it; any other `type` is loaded by the manager registered for that type, and if none is registered, you get `"Unrecognized mod type"`. In the source, `ll/api/mod` is the public interface (`Mod`, `ModManager`, `ModManagerRegistry`, `Manifest`, `NativeMod`), and `ll/core/mod` implements the native mod manager `NativeModManager` and the loading process (`ModRegistrar`, `ModLoadPlanner`).

*Applies to: LeviLamina 1.x and later (including the current 26.60.x)*

## In dimensions such as the Nether, I can't use the `tp` command to teleport across dimensions to specific coordinates. What can I do?

LeviLamina has a built-in cross-dimension teleport command, `teleportdim` (alias `tpdim`), which teleports to exact coordinates across dimensions and supports an optional coordinate-conversion argument (Overworld/Nether scaling). You can enable or disable the command and set its permission with `modules.command.tpdimCommand` in the LeviLamina config (enabled by default, permission GameDirectors). In vanilla you can also do it with `execute in <dimension> run tp ...`.

*Applies to: all current LeviLamina versions (including 26.60.x)*

## Can BDS's vanilla server-authoritative movement/block validation (being pulled back for moving too fast, or blocks rubber-banding or vanishing when placed/broken too fast) be turned off? Is there a LeviLamina mod that disables it?

Since 1.21.70, this vanilla mechanism cannot be turned off with `server.properties` or similar settings (older versions could). You can use the third-party LeviLamina mod FuckMovementAuthority (<https://github.com/kuangby/FuckMovementAuthority/releases>); the placement-related restrictions are handled as well. The author warns that it may cause some odd bugs. Before installing, make sure its release matches your LeviLamina version. You can find LeviLamina mods at <https://levimc.org/mods/> (formerly pkg.levimc.org).

*Applies to: BDS 1.21.70+; FuckMovementAuthority latest release v26.51.5 (for LeviLamina 26.51). Not confirmed against the source code or the documentation: treat it as a pointer.*

## The GroupMountain server-side FreeCamera mod hasn't been updated for a long time. Does it still work? What are the alternatives?

The old FreeCamera no longer supports the current version (its latest release is from 2025). Its functionality has been ported (with GroupMountain's permission) into CoralFans (<https://github.com/CoralFans-Dev/CoralFans>). Install the CoralFans build that matches your server version to use the `freecamera` command.

*Applies to: LeviLamina 26.x; CoralFans v26.60.0 supports LeviLamina 26.60*

## Can LeviLamina mods create custom UIs like the NetEase edition, for example placing controls on the in-game HUD?

You cannot get the NetEase-style effect of permanent custom controls directly on the HUD. However, besides traditional forms (`SimpleForm`/`ModalForm`/`CustomForm` in `ll/api/form`), LeviLamina now also provides the `ll::ui` interface based on Bedrock's Data-Driven UI (DDUI): `CustomForm` and `MessageBox` in `ll/api/ui/form` support updating text, visibility, values and input values in real time while the form is open, and the underlying `ScreenSession`, `Property` and `Binding<T>` can open custom DDUI screens provided in a resource pack and bind data to them. In other words, a custom interface needs a resource pack and is limited to DDUI screens; arbitrary HUD controls are not possible.

*Applies to: LeviLamina 26.x (`ll::ui` corresponds to the stable features of `@minecraft/server-ui` 2.1.0)*

## Is there a good LeviLamina mod for running commands on a schedule?

You can use GroupMountain's GMEssentials (release repository <https://github.com/GroupMountain/GMEssentials-Release>; you can also search for GMEssentials at <https://levimc.org/mods/>). It has many features, among them `schedule_task`, which runs commands on a schedule using Cron expressions (configure `enable` and a `tasks` list, where each entry has a `cron` expression, a `commands` list and `output`; `enable` defaults to `false` and must be turned on manually).

*Applies to: GMEssentials v26.60.0 for LeviLamina 26.60*

## When a LeviLamina mod needs a companion resource pack, can the pack be bundled inside the mod and loaded automatically?

Yes. Put the resource pack in the `resource_packs` folder of the mod directory (`mods/<mod name>/resource_packs/<resource pack>`). LeviLamina automatically registers it as a resource pack source and loads it (likewise, put behavior packs in `mods/<mod name>/behavior_packs`). When publishing, you can copy the resource pack into the mod archive in the `xmake.lua` packaging step, or have lip's `tooth.json` extract/place the resource pack into `mods/<mod name>/resource_packs`. If the resource pack modifies the main menu, you may still need to enable it in the global resources.

*Applies to: LeviLamina server and client, current version (26.60.x)*

## Is the ImGui that LeviLamina used to bundle still there?

No. LeviLamina used to bundle ImGui, but because it crashed on 1.21.132, it was removed in 2026-01 (commit `refactor: remove imgui`); the current `xmake.lua` no longer depends on imgui either.

*Applies to: all versions after LeviLamina adapted to 1.21.132 (including the current 26.60.x)*

## Which shaders and game versions does the mod that loads Java Edition shaders (JE shaders) on the LeviLamina client support? How is the performance?

This mod is LiteLDev's official Arke (`github.com/LiteLDev/Arke`). It is built on the LeviLamina client and can run Java Edition shader packs written for Iris / OptiFine on Bedrock's Direct3D 12 renderer; the official README claims "zero performance loss". It currently supports only the Windows x64 client and requires LeviLamina client 26.60.* (that is, MC 1.26.60); older versions such as 26.51 are not supported. Android support is planned. After installation, load shader packs through the settings button at the top left of the game screen. If software such as frame generation is running, this button may not appear or may even cause a crash.

*Applies to: Arke 0.1.x, LeviLamina client 26.60.\*, Windows x64*

## Does the LeviLamina client have a feature to remove or force-disable OreUI?

LeviLamina itself has no such feature. You can use the third-party project ForceCloseOreUI (<https://github.com/QYCottage/ForceCloseOreUI>). It is a standalone DLL (Windows) / so (Android) and does not depend on LeviLamina: you can put it into the `mods` directory of `QYCottage/mc-w10-version-launcher`, or load it with another launcher/injector. In LeviLauncher you can also add it to an instance as a `preload-native` mod through "Import .dll".

*Applies to: current LeviLamina client; ForceCloseOreUI is a third-party project, check its own releases for compatibility. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I start and stop recording with the LeviLamina client's replay mod (Playback/replay)?

Playback (a third-party mod, `github.com/wo55555/Playback`) is controlled with commands: `/record start` starts (or resumes) recording, `/record pause` pauses, and `/record stop` stops and exports the replay. In addition, `/record rate [20-120]` sets the sampling rate of the local player's view, and `/record indicator [on/off]` toggles the recording indicator. In newer versions, the icon row of the pause menu also has start, pause, finish and cancel buttons; finishing from the pause menu asks you to enter a replay name. Exported replays are stored in Playback's `data/replays` directory.

*Applies to: Playback, current version (LeviLamina client, Windows x64)*

## Is there documentation for the `manifest.json` of LeviLamina plugins? Can I zip a script plugin together with `manifest.json` and drop it into `plugins` to have it loaded?

Yes. The fields of `manifest.json` (`entry`, `name`, `type`, `platform`, `passive`, `version`, `author`, `description`, `extraInfo`, `dependencies`, `optionalDependencies`, `conflicts`, `loadBefore`) are now described on the mod page of the LeviLamina API reference in the official documentation; you can also read the source `src/ll/api/mod/Manifest.h` directly. The manifest of a script plugin is generated automatically by LSE: put a loose `.js`/`.lua`/`.py` file in the root of `mods` (`plugins` is a link to `mods`), and LSE moves it into `mods/<name>/` and generates `manifest.json`; it is loaded after a restart. An arbitrary archive (plugin plus manifest) dropped in is not loaded: LeviLamina reads `manifest.json` only from subdirectories of `mods`, so you must extract it into a directory. (The exception is the old `.llplugin` package of the Node.js backend, which LSE extracts and migrates automatically.) The purpose of the manifest is to standardize dependency declarations and custom engines (`type`), not to unify the packaging format.

*Applies to: LeviLamina 1.x and later up to the current 26.60.x, current LSE*

## Is LeviLamina only for servers (BDS)? Can it be used in client single-player worlds?

No. LeviLamina is an unofficial mod loader for Minecraft Bedrock Edition. It can be loaded into the Bedrock Dedicated Server (BDS) and also into the Minecraft client on Windows. On the client, use the LeviLauncher launcher to install a game version, LeviLamina and client mods, then use the client mods in single-player worlds (see the official tutorial "Playing with mods on Windows"). LeviLauncher is only a launcher; the loader is LeviLamina.

*Applies to: LeviLamina current version (26.60.x), LeviLauncher 1.x*

## Does LeviLamina include the iInvalidNAKFix fix, or do I still need to install it separately?

No, it is not included. LeviLamina's built-in vulnerability fixes (`vulnerabilityFixes`: `itemReadUserData`, `disconnectClient`, `subChunkRequest`, `limitIPFrequency` and so on) do not include a fix for invalid NAKs, so if you need it, you still have to install iInvalidNAKFix (`MiracleForest/iInvalidNAKFix`) separately.

*Applies to: LeviLamina server, current version (26.60.x)*

## How does LeviLamina let the Bedrock client load mods? Can a server make connecting players' clients enable certain mods automatically?

No, a server cannot push mods. Client mods require the player to install the client build of LeviLamina on their own machine (usually through LeviLauncher: it adds its own loader, `LeviLauncher.dll`, to the game executable, and at launch it loads LeviLamina and the mods). The player decides which mods to install, and the server cannot control it; in nature this is similar to client-side injection. The only things a server can send to clients are still the vanilla resource packs and behavior packs.

## Is there a plugin for LeviLamina servers that raises the height limit of the Nether?

Use the FuckNetherHeight mod from GroupMountain (it works with LeviLamina): <https://github.com/GroupMountain/FuckNetherHeight>. Before using it, make sure its release supports your LeviLamina/BDS version.

*Applies to: third-party mod; compatibility depends on its releases. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What data does LeviLamina's telemetry collect, and which platform does it use?

LeviLamina uses bStats (it submits to the `server-implementation` endpoint on bstats.org). The reported data includes the server UUID, the system type (Windows or Linux(wine)), the architecture, the number of CPU cores, and these custom charts: LeviLamina version, Minecraft version, online player count, whether online-mode authentication (`online-mode`) is enabled, and the distribution of player device platforms. The list of other loaded mods is not reported. The public data is at <https://bstats.org/plugin/server-implementation/LeviLamina/21245>. Region information is only inferred by bStats from the request IP. To opt out, set `targeted.enableStatistics` to `false` in the LeviLamina config.

*Applies to: current LeviLamina server*

## What roles do LeviLamina, PreLoader and Endstone play compared with the Java Edition ecosystem?

By analogy with Java Edition: PreLoader is like Fabric Loader (it handles injection/loading), LeviLamina is like Fabric API (it provides the mod development interfaces), and Endstone is like Spigot (plugin API style). PreLoader is now used by both the server and the client, and the LeviLamina client build also depends on it.

## Can a LeviLamina mod access files outside the BDS directory? Do I need relative paths such as `../../..`?

Yes. A LeviLamina mod is a native DLL loaded into the BDS process, and there is no file system sandbox. You can go up with a `../`-style relative path (relative to the process working directory, which is the BDS root), or use an absolute path directly, as long as the system account that runs BDS has the matching permissions.

*Applies to: all current LeviLamina versions*

## Is there a simulated-player plugin for LeviLamina? Is the incompatibility between simulated players and addons (the script API) fixed?

Yes. Use CFSP (CoralFans SimulatedPlayer), the simulated-player mod from the CoralFans team. Install it with `lip install github.com/CoralFans-Dev/CFSP`. Simulated players used to be incompatible with addons/the script API (SAPI/GameTest). LeviLamina has fixed this step by step starting with 26.20.x (26.20.3 keeps the GameTest source information, and 26.51.2 fixes the compatibility between SAPI and SimulatedPlayer), so use the latest LeviLamina.

*Applies to: LeviLamina 26.51.2 and later*

## Can LeviLauncher host a server to play with friends and use server plugins?

No. LeviLauncher is a launcher for the Minecraft Bedrock Edition client (the Windows version supports GDK/UWP, and there is also an Android version); it is not a server. For ordinary multiplayer, use the game's built-in friends/LAN features. To run a server that can load mods/plugins, deploy BDS and install LeviLamina (the mod loader for BDS; install it with `lip install github.com/LiteLDev/LeviLamina`; see the tutorial at <https://levimc.org/tutorials/server/first-server/>). The launcher can also install LeviLamina for the client (supported GDK versions only), but few mods are available for the client.

*Applies to: LeviLauncher current version (v1.1.0); LeviLamina current version*

## Can I install LeviLamina on Minecraft Realms?

No. LeviLamina has to run on a BDS (`bedrock_server`) that you deploy yourself or on your own Windows client. Realms is a server hosted by Microsoft, and no third-party loader can be installed on it.

## Why did LeviLamina rename "plugin" to "mod"?

LeviLamina provides low-level native APIs, and its model is closer to mod loaders such as Fabric/Forge, whereas Endstone and similar projects follow the Bukkit-like plugin model, so the term was changed to mod. For the detailed discussion, see <https://github.com/LiteLDev/LeviLamina/issues/1551> (`[Proposal]: Rename Plugin to Mod`, closed). LeviLamina now calls itself a mod loader, and mods go in the `mods/` directory.

*Applies to: LeviLamina 0.13.x and later*

## Why does a LeviLamina marker appear at the end of the MOTD (pong) when I query a LeviLamina server? Can I change it?

LeviLamina hooks RakNet's `RakPeer::SetOfflinePingResponse` and appends a `LeviLamina;` field to the end of the pong data that starts with `MCPE;`, to identify the server as LeviLamina (added in 1.0.0-rc.1, where it also carried the version number; since 1.0.0-rc.3 only the marker remains). LeviLamina itself provides no config option to turn it off. To customize or fake the MOTD/pong content (for example, to merge player counts), a mod can hook that function itself or modify the related data.

*Applies to: LeviLamina 1.0.0-rc.3 and later (server)*

## A fresh LeviLamina install shows 0 plugins (mods) loaded on startup, while LL2 used to come with a few plugins by default. Is this normal?

Yes. LiteLoaderBDS (LL2) installed all prerequisite plugins by default, while LeviLamina installs on demand and ships no mods with the core (dependencies such as CrashLogger live inside `mods/LeviLamina/` and do not count as mods), so it shows 0. Install the mods you need with lip, for example `lip install <mod repository address>`.

*Applies to: all current LeviLamina versions*

## Does Bedrock have a feature to display structure outlines (Structure Outline)? Does it work on Android?

CoralFans (a third-party technical survival mod based on LeviLamina) provides HSA display and structure display, with commands such as `/hsa show` and `/hsa structure show` (the command names can be changed in the config). Install it with `lip install github.com/CoralFans-Dev/CoralFans`, or install it in the PC version of LeviLauncher. CoralFans only has a Windows x64 build, so it cannot be used directly on Android; you can join a server that has CoralFans installed. Source: <https://github.com/CoralFans-Dev/CoralFans/>, documentation: <https://coralfans-dev.github.io/CoralFans-doc/>

*Applies to: LeviLamina server/Windows client; CoralFans current version (v26.60.0)*

## Is there a Bedrock mod that unlocks the world build height limit (for importing terrain maps thousands of blocks tall)?

Use iHigherWorld (<https://github.com/MiracleForest/iHigherWorld>), a LeviLamina mod from MiracleForest. It lets you adjust the minimum/maximum height of the Overworld, the Nether and the End separately. Install on the server with `lip install github.com/MiracleForest/iHigherWorld-Release` and on the client with `lip install github.com/MiracleForest/iHigherWorld-Release#client`. When the Overworld range goes beyond -512~512 (or the Nether/End beyond 0~256), the client must also install the client build (the config is sent down by the server). Users report that the maximum is roughly 4096 and that the game crashes beyond that (this limit is not documented). Addons cannot do this. Note that its README states LeviLamina 26.51.x as the runtime environment, so make sure it matches the LeviLamina version you use.

*Applies to: iHigherWorld v1.4.0; LeviLamina 26.51.x (Windows x64)*

## How do I check which LeviLamina version a server has installed?

Enter the `version` command in the server console. It prints something like `Game version <game version> with LeviLamina-<version>`. The corresponding command on the LeviLamina client is `cliversion`. The command can be enabled or disabled, and its permission level set, in `modules.command.versionCommand` in the LeviLamina config; if it is disabled, it is not registered.

*Applies to: all current LeviLamina versions*

## How can I make the client show a custom server logo/banner in the server list? Is there a mod that removes featured servers?

The LeviLamina repository has an experimental branch `feat/custom-server-readme` (<https://github.com/LiteLDev/LeviLamina/tree/feat/custom-server-readme>) that lets the server fully customize the server display information. This branch will not be merged into LeviLamina mainline; you can use its implementation as a reference to build your own mod. To remove featured servers, use the community mod NoAdServers: <https://github.com/MarmieQi/NoAdServers/releases/tag/v26.60.0>. Third-party mods must match the game version.

*Applies to: MC 26.60; LeviLamina 26.60.x*

## Which open-source mods are available for LeviLamina on the Windows client (technical survival, utilities, minimap, replay, schematic projection, and so on)?

Some can already be installed through LeviLauncher / lip: CoralFans, a technical-survival mod (similar to Java Edition carpet) <https://github.com/CoralFans-Dev/CoralFans>; Stipuleroo, client utilities (similar to tweakeroo) <https://github.com/FeixiangTMC/Stipuleroo>; ChiyanMap, a client minimap <https://github.com/qing85566/ChiyanMap>; Playback, replay <https://github.com/wo55555/Playback>; LHolo, client schematic projection <https://github.com/MarmieQi/LHolo>. Before using one, make sure the mod supports your game version.

*Applies to: LeviLamina client (Windows); specific versions depend on each mod's releases*

## After a server sends an encrypted resource pack, the client cannot use Vibrant Visuals (VV). Can LeviLamina fix this?

This is vanilla client behavior: an encrypted resource pack is treated as a Marketplace pack, and the Marketplace's current policy does not support VV, so the server cannot fix it. The only way is to bypass it by modifying the client, for example by forcing VV on with a LeviLamina client mod.

*Applies to: vanilla Minecraft Bedrock client behavior; depends on Mojang's current policy. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can LeviLamina send packets to players at high frequency with 1 ms precision (for example, PlaySound packets for a MIDI player)? I tried it and it crashed the server or the client.

No. This is a limitation of BDS/the game itself, not a LeviLamina problem: the client also has to synchronize packet handling to the main thread, network latency jitter alone exceeds 1 ms, and a flood of small packets can also clog the player's network. To play music on a server, deliver the audio as a resource pack, or look at tick-precision approaches such as NBS players.

*Applies to: all current versions (BDS/network-level limit). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can BDS (LeviLamina) restart BDS from inside its own process?

A process cannot restart itself from the inside, and LeviLamina provides no restart API, so you need an external program outside BDS (a daemon or startup script). You can write your own external program and call it from a mod, for example with `std::system`, to shut BDS down and start it again. If you run the server with lip, you can enable auto-restart: `lip config set restart on-failure --workspace` (or turn on "Auto restart" on the "Server" page of the lip interface), then start with `lip run`. When the server exits with a non-zero exit code, lip waits 5 seconds and restarts it (at most 5 times within 10 minutes).

*Applies to: all current versions; lip auto-restart needs a recent lip (documented for v0.41)*

## Can I still join other people's servers with LeviLamina client mods installed? Can two people with the same launcher and mods play together?

Yes. The LeviLamina client can join other people's servers normally (for example, joining Hive with Playback on to record), and two people with the same mods installed can also play together. Server-side LeviLamina mods do not need to be installed on the client. Whether a specific mod is allowed on a server is up to that server's rules, which you must follow.

*Applies to: LeviLamina client / LeviLauncher, current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Does LeviLamina itself support Data-Driven UI (DDUI)? Since which version? Can LSE script plugins use it?

Yes. LeviLamina has supported DDUI since 26.20.7 (namespace `ll::ui`, with headers such as `ll/api/ui/form/CustomForm.h` and `ll/api/ui/form/MessageBox.h`); it is a separate interface from the older `ll::form`. Usage guide: <https://levimc.org/LeviLamina/developer_guides/how_to_guides/data_driven_ui_guide/>; the API reference is under `api_reference/data_driven_ui`. Only the native (C++) API is available for now, so you need a C++ mod; LSE does not export these interfaces yet.

*Applies to: LeviLamina 26.20.7 and later*

## Why is adapting LeviLamina to new BDS versions (from 26.20) so difficult? Do old mods still work?

Mojang switched the BDS compiler from MSVC to clang-cl. LeviLamina and all native mods must be recompiled with clang-cl, otherwise they crash; old mods compiled with MSVC cannot be used directly. The `xmake.lua` of the mod template already uses `set_toolchains("clang-cl")`. In addition, the compiler itself crashed when clang-cl compiled LSE during the adaptation, which slowed progress.

*Applies to: LeviLamina 26.20 and later*

## My server crashes often. How can I see BDS memory usage at the time of the crash in the crash log?

Since 1.2.1, CrashLogger writes memory information to the trace log (total/available physical memory of the system, plus a `Memory Info` section with the peak/current workingset, pagefile and private values of the BDS process). The built-in CrashLogger also shows available memory. The current version (CrashLogger 1.4.x, installed automatically with LeviLamina) already includes this; you only need to keep it up to date. Run `lip update` (or `lip update github.com/LiteLDev/LeviLamina`) in the server directory, then look in `logs/crash/trace_*.log`.

*Applies to: CrashLogger 1.2.1 and later (currently 1.4.0)*

## LeviLamina announced that it will encrypt PreLoader (and the symbol data it loads). How does this affect ordinary server owners and mod developers?

Background: since BDS 1.21.20, the official BDS release no longer ships a PDB. LeviLamina's approach is to publish only headers (function signatures and structs) in the repository, while function addresses are kept as a hashed symbol table in runtime data (then called the magic blob, now distributed as the `bedrock-runtime-data` package), which PreLoader loads and resolves at runtime so that mods can call or hook BDS functions. Because someone abused PreLoader dump data to generate and publicly distribute PDBs, the maintainers announced in 2025-03 that PreLoader would be encrypted, in order to comply with Microsoft's requirements (only PreLoader is encrypted; LeviLamina itself and the rest are unchanged). Impact: ordinary server owners, LSE script plugin developers, and mods built only on LeviLamina's public headers and interfaces are not affected. The only affected work is native development that relied on generating a fake PDB from PreLoader to reverse engineer in IDA; from now on that can only be done with methods such as bindiff.

*Applies to: LeviLamina 1.1.x (BDS 1.21.60/1.21.70) and later. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I launch the LeviLamina client (client mod)? Is PreLoader still required?

Yes. The client uses the same mechanism: PeEditor patches the game executable, and PreLoader loads LeviLamina when the game starts. Installing the LeviLamina client runs `PeEditor.exe -mb --exe Minecraft.Windows.exe --inplace`, which patches `Minecraft.Windows.exe` in place (the original is kept as `Minecraft.Windows.exe.bak`), and also installs the PreLoader dependency.

The recommended way is LeviLauncher:

1. Download a supported GDK release version in it.
2. Create an instance and open "Install LeviLamina".
3. Launch from LeviLauncher. You do not need to run lip manually.

The Microsoft account must have purchased Bedrock Edition and installed it from the Microsoft Store at least once. The LeviLamina client supports only Windows x64 (Android uses a separate solution, LeviLauncher-Android).

*Applies to: LeviLamina client, current version (GDK edition of Minecraft for Windows)*

## Can a client native mod work without the LeviLamina API? How are PreLoader and LeviLamina related? Do I need to copy the whole game instance to run several clients at once?

LeviLamina is loaded by PreLoader. PreLoader loads LeviLamina before the game starts and provides low-level services such as symbol resolution (mapping vanilla symbols for LeviLamina and mods); the rest of the infrastructure, such as hooks, events and commands, comes from LeviLamina.

To avoid depending on LeviLamina, you have to replace every LL API and symbol you use with signatures and implement the corresponding functionality yourself (after removing the LL dependency, check the import table to see which symbols are still needed).

Running several clients does not require copying the roughly 1 GB game itself: you can have the mod's entry use relative paths, or redirect the mod directory before loading through `modsPath` in `PreLoaderConfig.json`. You only need to copy the mod files separately to avoid file locking, and you must not open the same world in two clients at once. You can also manage several game instances directly with LeviLauncher instances (with instance isolation enabled).

*Applies to: LeviLamina client, current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Virtual functions of multiple-inheritance classes such as Level have no vIndex in the LL headers. When I see a virtual call in decompiled code and have no full PDB, how do I tell which function is called?

You can dump it yourself at runtime: take the function address of the corresponding slot from the object's vtable, then use PreLoader's address-to-symbol lookup interface to get the function name. The interface is in `pl/SymbolProvider.h`: `pl::symbol_provider::pl_lookup_symbol_disp(addr, &length, &disp)` returns an array of symbol names for that address (`length` is the count, `disp` is the offset), and you must release the result with `pl::symbol_provider::pl_free_lookup_result` when done. LeviLamina's stack symbolization (`ll::utils::stacktrace_utils::getInfo`) works this way internally too.

*Applies to: LeviLamina current version (PreLoader 1.x)*
