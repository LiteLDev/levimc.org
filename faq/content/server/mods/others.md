# Other LiteLDev projects

## Where can I still download old LiteLoaderBDS (LL2, such as 2.9.3, 2.15.0, 2.16.2)? Which BDS version does each version match?

Historical LL2 versions are in the Releases of the archived GitHub repository LiteLDev/LiteLoaderBDS: <https://github.com/LiteLDev/LiteLoaderBDS/releases> (for example the final version 2.16.2: <https://github.com/LiteLDev/LiteLoaderBDS/releases/download/2.16.2/LiteLoaderBDS.zip>). The old link <https://github.com/LiteLDev/LiteLoaderBDSv2> redirects to this repository automatically. Each release's notes state the matching BDS version (newer releases use a badge; older ones such as 2.9.3 state it in the text, for example `Support BDS 1.19.50 & 1.19.51`). Be sure to choose the LL2 that matches your BDS version exactly. LL2 is no longer maintained and supports BDS 1.20.31.01 at most; use LeviLamina for newer BDS.

*Applies to: LiteLoaderBDS 2.x (archived), BDS \<= 1.20.31.01*

## What is the last BDS version supported by LiteLoaderBDS v2 (LL2)? Is there an LL2 that supports BDS 1.20.40 or later? What if LL2 fails to start with LiteLoader not found or cannot be loaded?

The final LL2 version is 2.16.2, which matches BDS 1.20.31.01; there is no LL2 that supports BDS 1.20.40 or later. LL must match its BDS version exactly, and a version mismatch (for example BDS 1.19.30.04 with a newer LL2) causes loading failures. LL2 is no longer updated and has been archived; it was later rebuilt as LeviLamina (<https://github.com/LiteLDev/LeviLamina>). Use LeviLamina for newer BDS versions.

*Applies to: LiteLoaderBDS 2.x (archived); use LeviLamina for newer BDS*

## Is there a hot backup or automatic backup plugin for a LeviLamina server? Is there a BackupHelper version for the new LeviLamina, and what do I do if it reports incompatibility?

You can use BackupHelper (<https://github.com/ShrBox/BackupHelper>, a LeviLamina mod ported from the LL2 version), which keeps up with LeviLamina versions (v0.20.0 supports LeviLamina 26.60.*). Old versions are incompatible with new LeviLamina; download the latest version that matches your LeviLamina version from GitHub. Repost sites such as MineBBS may not sync in time, so treat GitHub as authoritative. Installing with lip is recommended: `lip install github.com/ShrBox/BackupHelper`. Commands: `/backup` backs up immediately, `/backup list` lists backups, `/backup recover [number]` restores a backup, and `/backup reload` reloads the configuration. In `config.ini`, `BackupInterval` (in hours) sets a periodic automatic backup and `MaxStorageTime` controls how many days backups are kept. You can also write your own `.bat`/`.sh`/`.py` script to archive the world directory on a schedule.

*Applies to: Current LeviLamina (BackupHelper v0.20.0 for LeviLamina 26.60.\*)*

## After installing BackupHelper, `backup` fails and says 7z is missing (even though I downloaded 7z). What should I do?

BackupHelper calls `7za.exe` (the standalone command-line version of 7-Zip), not `7z.exe`. When you install with lip, the dependency `github.com/LiteLDev/7-zip-tooth` automatically places `7za.exe` in the server root directory: `lip install github.com/ShrBox/BackupHelper`. If it is missing, reinstall:

```shell
lip uninstall github.com/ShrBox/BackupHelper
lip cache clean
lip install github.com/ShrBox/BackupHelper
```

Or put `7za.exe` in the server root directory manually. After that, enter `backup` in the console or in game (as an OP) to take a hot backup, and `help backup` shows the usage.

*Applies to: BackupHelper 0.1.6 and later + current lip*

## Does LeviLamina support .NET (C#/F#) plugins?

Not officially: LiteLoader.NET, the official .NET engine of the LL2 era, has long been unmaintained and archived. The community project Hosihikari (now the organization <https://github.com/HosihikariFramework>) provides a .NET plugin framework. HostingShim hosts the CLR inside the BDS process (providing carriers for LeviLamina, Endstone and others), PluginManager handles plugin loading and lifecycle, and there are also CSharpLoader, FSharpLoader (loads plugins compiled from source) and RpcLoader. You can install them with its package manager Seiko (for example `sk add hosihikari-hosting-levilamina`). Note that its public contract currently covers only host services such as logging, configuration, scheduling and the event bus; game APIs such as world, entities and commands are not part of the contract. You can also call the C++ interfaces yourself with C++/CLI or P/Invoke.

*Applies to: Current LeviLamina (community project, unofficial)*

## What is the difference between Endstone and LeviLamina?

The difference is similar to that between a "plugin" and a "mod". Endstone is a plugin server based on BDS (offering a Paper-like plugin API); its API is relatively limited, but it does not depend on data provided by Mojang, so it can follow the latest BDS quickly. LeviLamina is a mod loader that can do more, but supporting a new version requires waiting for the relevant data. To run Endstone plugins on LeviLamina, use the official LeviStone (in the BDS directory that has LeviLamina installed, run `pip install levistone --target mods/EndstoneRuntime`; versions 0.11.14 and earlier install to `plugins/EndstoneRuntime`). Note that LeviStone supports only Endstone plugins written in Python, not native (C++) Endstone plugins.

*Applies to: current version (LeviStone 0.11.15 and later installs to mods/EndstoneRuntime)*

## Which game versions does Arke, the LeviLamina client shader mod, support, and how do I use it? What if it has no effect after installation or I cannot see the shader settings screen?

Arke runs Java Edition shader packs written for Iris/OptiFine on the Bedrock Direct3D 12 renderer. It requires the client build of LeviLamina 26.60.* (that is, the 26.60 client) and does not support older versions such as 26.51. After installing LeviLamina and Arke (installed in `mods/arke/`) with LeviLauncher, enter the game and open the shader settings at the top left of the screen (or at the top left of the world pause page; the UI is currently imgui), import a shader pack and select it to apply it; switching shaders may take a few seconds. A known cause of the settings button not appearing: when frame generation (frame generator) software or similar is running, the top-left button does not appear and the game may even crash, so turn off such post-processing first and confirm the game is running on DX12. If there is no effect, confirm the mod is loaded in the mod management screen or console and check the log `mods\arke\logs\arke.log`; if a shader pack fails to load, check Messages in the settings window.

*Applies to: Arke 0.1.x, Minecraft client 26.60 + LeviLamina#client 26.60.\**

## With the Arke shader mod, the block selection wireframe does not show, and it is the same with several shader packs. What should I do?

This is a compatibility issue in Arke and was fixed in Arke v0.1.5 (`Fixed an issue where some wireframes would not render`). Update to v0.1.5 or later (for example `lip install github.com/LiteLDev/Arke#client`, since Arke has only a client variant, or download it from GitHub Releases).

*Applies to: Occurs in Arke v0.1.4 and earlier; fixed since v0.1.5*

## iLand is no longer maintained. What are the alternatives? How do I migrate iLand data to PLand? What if the command says "relationship.json file not found" (未找到 relationship.json 文件)?

You can switch to the third-party land-claim mod PLand (`IceBlcokMC/PLand`). The command that imports iLand data is (run in the console): `/pland import true "C:/path/relationship.json" "C:/path/data.json"`. The first argument says whether to clear the database. Backslashes `\` in the paths must be replaced with forward slashes `/`, otherwise it reports "relationship.json file not found" (未找到 relationship.json 文件). Note: this command was removed in PLand v0.18.0, so complete the import with PLand v0.17.x first, then upgrade to the latest version.

*Applies to: PLand v0.17.x and earlier can import directly; v0.18.0 and later need conversion with v0.17.x first, then upgrade*

## How does the land-claim plugin iLand perform? Should I switch to PLand? Will I be unable to export my data after switching?

iLand is a Lua script plugin from the LL1 era; on LeviLamina it requires the LSE Lua engine (`lip install LegacyScriptEngine#lua`). PLand is a native C++ mod and generally performs better, and after switching you can also drop the Lua engine. Switching is not mandatory; if iLand works well for you, you can keep using it. PLand stores its data in LevelDB, which you can read directly: for PLand 0.21.x and earlier you can view it with QLevelDBViewer, and for later versions use the DevTool bundled with PLand to view the raw data.

*Applies to: LeviLamina + LSE current version; PLand current version*

## On a server, the CoralMap minimap often turns black or shows see-through empty layers around the edge of already scanned chunks. What causes this?

Black areas: the terrain scan radius `terrain.scanRadius` defaults to 128 blocks (8 chunks). If the server's view distance is smaller than the scan radius, chunks beyond the view distance are only placeholders on the client, so the scan result is black. You need a server view distance of at least 8, or reduce `terrain.scanRadius` in `config.json`. See-through empty layers: the mod looks up the topmost block from the game's cached heightmap, and some blocks are not counted in the heightmap, so if there is air below them they are "seen through". This is the price of a performance optimization (otherwise it would have to traverse block by block from y320 downward, which is much slower). The author says a config switch will be added later; there is no such option in the config yet.

*Applies to: CoralMap (LeviLamina client mod), current version*

## The client minimap mod CoralMap causes severe frame drops when enabled. How can I tune it?

Terrain scanning and shadow rendering run on separate threads, which compete with the game's render thread when there are not enough CPU cores. In `config.json` in the mod's configuration directory you can:

- Reduce the number of chunks scanned per frame, `terrain.scanMaxChunksPerFrame` (default 32; you can set it to 16).
- Lower the shadow mode `terrain.shadow.renderStyle` (0 = no shadows, 1 = simple heightmap gradient shadows, 2 = shadow map + edge bevel; default 2).
- Reduce `terrain.scanRadius`.

*Applies to: CoralMap current version*

## Is LeviLamina's official organization name LiteLDev or LeviMC? Why was the GitHub organization ID not changed?

The official name is LeviMC (official site <https://levimc.org>). The GitHub organization ID is still LiteLDev; according to the maintainers, old links would break or not redirect completely after a rename, so it was not changed.

## Is the LiteLDev forum `https://bbs.liteldev.com/` down?

That forum was closed long ago. The community entry point is now <https://levimc.org/community/>.

## Can I publish assist-feature mods such as AutoTotem on the LeviMC platform or channels?

No. Such features are treated as cheats and must not be published on LeviMC/LL platforms or channels, and you must not use them in multiplayer where they affect others; playing alone is not regulated. If you develop client features, it is recommended to detect whether you are on a server and disable the feature when you are.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## I want to donate to LiteLDev (the LeviLamina development team). How can I do that?

You can donate through Afdian: <https://afdian.com/@liteldev>, or through Open Collective (LeviMC, <https://opencollective.com/levimc>; bank card or PayPal, settled in US dollars). The Sponsor button on the GitHub repository page points to these two channels.

## Is LiteLDev's LegacyParticleAPI no longer maintained? What is the replacement?

Yes. LegacyParticleAPI (ParticleAPI ported from LiteLoaderBDS) is no longer maintained, its repository is archived, and no project uses it any more. To draw particles or debug shapes on the server, use BedrockServerClientInterface (BSCI, <https://github.com/OEOTYAN/BedrockServerClientInterface>) instead.

*Applies to: LeviLamina, all current versions*

## Can a client mod prevent picking up items? If not, how can I do it on a server?

A client cannot do it: whether an item is picked up is decided by the server (at most the client can pick it up and then drop it). On the server you can use the LeviLamina mod CoralFans (`lip install github.com/CoralFans-Dev/CoralFans`). The server owner (an admin) first enables the feature globally with `/func nopickup true`, then each player turns on their own switch with `/self nopickup true` (if it is not enabled globally, `/self` reports an error that it is unavailable). You can check that the plugin installed successfully with `/coralfans`. Command names can be changed in the CoralFans configuration. See <https://coralfans-dev.github.io/CoralFans-doc/> for details.

*Applies to: LeviLamina server + CoralFans, current version*

## How do I conveniently download or upgrade the BDS server?

Use LiteLDev's command-line tool bdsdown (<https://github.com/LiteLDev/bdsdown>), which you can install with `lip install github.com/LiteLDev/bdsdown`. Usage:

```text
bdsdown.exe [--yes] [--source SOURCE] [--proc PROC] [--exclude EXCLUDE]
```

`--source` defaults to `version://windows/latest`, `--proc` is the number of concurrent downloads (default 4), and `--exclude` excludes files from installation (for example to keep configuration files). You can set the environment variable `BDSDOWN_MIRROR_URL` to use a mirror for faster downloads. You can also install only BDS with lip.

## How do I make the ping display in a GMLIB PAPI variable change color according to its value?

You can use the GMLIB PAPI `scope` (range) function to map value ranges to color codes, for example:

```text
§${papi:scope,input=${papi:player_avg_ping},0..99=a,100..199=e,200..=c}${papi:player_avg_ping}
```

0 to 99 is green `§a`, 100 to 199 is yellow `§e`, and 200 and above is red `§c`. An earlier circulated form, `0..=a,100..=e`, has overlapping ranges; it is better to write non-overlapping closed ranges. The range syntax is `min..max`: `10..` means >= 10 and `..10` means \<= 10, and you can also give a default return value with `default=`. To show the current ping instead of the average, use `player_last_ping`. Placeholder documentation: <https://github.com/GroupMountain/GMLIB-Release/blob/release/PlaceholderDocs.md>

*Applies to: Servers with GMLIB installed (current v26.60.1)*
