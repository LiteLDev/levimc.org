# LeviLamina performance and other questions

## With only one or two players online, my LeviLamina server's TPS is still low (high MSPT, stuttering while flying). How do I find which plugin is responsible?

Use a control-variable / bisection approach: first move every mod except LeviLamina and its required components out of the `mods` directory and test MSPT in the game. If plain LeviLamina is smooth, a mod is the cause; add the mods back in batches (bisecting) to narrow it down one by one, or suspect the most recently installed mod first. High-overhead plugins that have been identified include playerlogger, which records signs by listening to block changes, and CustomMap (map art); removing them brought TPS back to normal. Redstone/piston machines and entity buildup are also common causes (you can limit redstone frequency and check entity counts), and insufficient performance from an oversold cloud server should be ruled out too.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## My LeviLamina server's memory keeps growing (from hours up to more than ten GB) until it crashes, or it crashes randomly and often. How do I troubleshoot it?

Continuously growing memory is almost certainly a memory leak in some mod or plugin (native C++ mods are the likelier suspects). Steps:

1. Back up the world first; run plain LeviLamina with no mods, or even vanilla BDS, to confirm whether it still leaks.
2. If the clean environment is fine, use elimination: first uninstall the LSE script plugins and observe, then add mods back one at a time (install a mod's prerequisites first), watching memory for a while after each one to find the leaking mod.
3. If it still leaks with all mods uninstalled, consider BDS itself or the world (for example, a world whose End was heavily damaged by many withers).

LeviLamina has no command to view the memory usage of an individual mod. The CrashLogger crash log prints `Memory Info` (process working set, commit size and so on), which you can use to judge memory at the time of the crash; update it to the latest with `lip update github.com/LiteLDev/CrashLogger`. In addition, an unstable Intel 13th/14th generation (Raptor Lake) CPU can also cause many random crashes that differ every time (AVX-related functions are common in the stack); check the CPU microcode and voltage stability.

*Applies to: all current LeviLamina versions*

## Startup takes noticeably longer when a LeviLamina server loads certain plugins (such as a land-claim plugin). Why does one plugin cost several hundred extra milliseconds?

This is mainly caused by event listening. LeviLamina's event emitters (that is, the corresponding hooks) are loaded lazily: a hook is created and installed only when an event is listened to for the first time, and that takes time. If a plugin listens to many events that no other plugin has listened to, the installation cost of all those hooks counts toward its load time; for events that have already been listened to, later plugins listening to them is very fast. So part of this load time is not entirely caused by the plugin itself.

*Applies to: all current LeviLamina versions (including 26.60.x)*

## My LeviLamina server starts very slowly. What can I do?

Antivirus software such as Windows Defender may be scanning the server files; try adding the server directory to the Defender exclusions. If that does not help, it may be related to the performance of the environment (for example, a PVE virtual machine or an old CPU). In addition, when plugins listen to many events for the first time, hooks must be installed, which also lengthens startup.

*Applies to: all current versions, Windows. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Does LeviLamina deliver better TPS than LiteLoaderBDS (LL2)?

About the same. TPS depends mainly on BDS itself, and a loader does not bring a noticeable improvement. LiteLDev also provides a performance optimization mod, LeviOptimize (it optimizes chunk sending, entity broadcasting, redstone updates, random ticks, async task scheduling and more, and each feature can be switched individually with `/lo`), which you can install as needed: `lip install github.com/LiteLDev/LeviOptimize`.

*Applies to: LeviLamina current version; LeviOptimize current version (requires LeviLamina 26.60.x)*

## After installing LeviLamina, BDS memory usage is abnormally high (10 GB right at startup). How do I troubleshoot it?

Start plain `bedrock_server.exe` first to compare. Then back up the world and keep only LeviLamina and its prerequisites in the mods directory (usually `plugins/` on the server, or `mods/` if that does not exist), and move the other mods back one by one to locate the problem (most likely a native mod with a memory leak). You can record memory usage with Windows Performance Recorder; tools such as Mem Reduct only relieve it temporarily.

In one case the cause was finally traced to the CustomSkin plugin (which changes player skins by sending packets) combined with a resource pack containing dozens of 4D skins; removing that skin resource pack returned things to normal.

*Applies to: LeviLamina 1.x and later (the server mod directory is `plugins/`)*

## After upgrading LeviLamina, the server starts noticeably slower and stalls at `[PreLoader] Loading records from data...`. Why?

According to the maintainers, since LeviLamina 1.2.0 / BDS 1.21.70 the symbol/record data used by PreLoader is encrypted and must be decrypted when loaded, so the `Loading records from data...` stage is slower than before. On most machines it takes only about two seconds. This is normal; just wait.

*Applies to: LeviLamina 1.2.0-rc.1 and later (PreLoader 1.13+). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Where can I see LeviLamina's network-wide usage statistics (number of servers, players, and so on)? Do I need to install bStats separately?

LeviLamina has built-in bStats reporting (added in 0.9.1), so you do not need to install bStats separately. Statistics page: <https://bstats.org/plugin/server-implementation/LeviLamina/21245> (you can also search for LeviLamina on bstats.org). To opt out, set `targeted.enableStatistics` to `false` in LeviLamina's `Config.json`.

*Applies to: LeviLamina 0.9.1 and later (server)*

## What options are there for linking a LeviLamina server with a QQ group (relaying messages between the group and the server)?

LiteLDev does not provide an official group-server relay plugin, so use a community solution, for example HuHoBot (a group-server relay bot), or CoordinationWSS (ws/wsserver), which is WebSocket based. Download: <https://www.minebbs.com/resources/coordinationwss-ws-wsserver.9637/>. Before using one, confirm that it supports your current LeviLamina/BDS version.

*Applies to: LeviLamina 1.x and later (depends on third-party plugin support). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Why can't I shut down a hung LeviLamina server with Ctrl+C?

LeviLamina intercepts the console's Ctrl+C/close events through `SetConsoleCtrlHandler` (and SIGINT/SIGTERM signal handlers) and calls `DedicatedServer`'s `stop()` to request a normal shutdown. In the current version, if the server has already entered the shutdown process (`GamingStatus::Stopping`, meaning it has reached `ServerInstance::leaveGameSync`), pressing Ctrl+C again calls `std::terminate` and ends the process forcibly. So if the server hangs during shutdown, press Ctrl+C once more to force an exit. However, if the server hangs before entering the shutdown process (for example a main-thread deadlock), the `stop()` request is never handled and the state never becomes `Stopping`. Pressing Ctrl+C repeatedly does nothing then, and you must end the process by other means such as Task Manager.

*Applies to: LeviLamina 26.60.x (server)*

## Can the LeviLamina documentation be downloaded for offline use?

Yes. The LeviLamina documentation sources now live in the `docs/LeviLamina/` directory of the `LiteLDev/liteldev.github.io` repository (Markdown, in both Chinese and English). Clone that repository to read it offline, or run `npm ci && npm run build` in that directory to build the site locally. The `docs/` directory of the main LeviLamina repository now contains only `contributing` (build and code-style guides). The online documentation is at <https://levimc.org/LeviLamina/>.

*Applies to: current version (docs moved to liteldev.github.io on 2026-11-16)*

## I want to open a PR to fix errors in the LeviLamina developer docs or tutorials. Where are the documentation sources?

The documentation sources are in the `docs/LeviLamina/` directory of the `LiteLDev/liteldev.github.io` repository; submit your PR to that repository. Tutorials are in the `tutorials/` directory of the same repository. The documentation site is <https://levimc.org/LeviLamina/>. The `docs/contributing/` directory of the main LeviLamina repository holds only the guides for developing LeviLamina itself (building, code style).

*Applies to: current version (since 2026-11-16)*

## What is the official website / documentation address of LeviLamina?

Documentation: <https://levimc.org/LeviLamina/>; source repository: <https://github.com/LiteLDev/LeviLamina>
