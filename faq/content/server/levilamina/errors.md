# LeviLamina errors and crashes

## Error codes

### What does error code 126 mean?

LeviLamina or a mod is missing dependencies. Make sure LeviLamina or the mod is fully installed. The dependency diagnostic in the log lists the missing dependencies.

### What does error code 127 mean?

A dependency of LeviLamina or of a mod has the wrong version. The dependency diagnostic in the log names the dependencies whose versions do not match.

### What does error code 1114 mean?

The Visual C++ Redistributable is too old. Update [vcredist](https://aka.ms/vc14/vc_redist.x64.exe).

## Server errors

### LeviLamina reports `Failed to load Runtime Data` / `bedrock_runtime_data` is missing on startup. Where does this file come from? What if the server reaches GitHub slowly and lip cannot download?

`bedrock_runtime_data` is not generated at runtime. It comes from LeviLamina's dependency package bedrock-runtime-data, which lip downloads automatically when you install LeviLamina; the error usually means the installation is incomplete. To fix it, run `lip cache clean` to clear the cache, then reinstall in a new empty directory. If the server reaches GitHub slowly or the download stalls, set a GitHub proxy/mirror with `lip config set github_proxy <proxy address>` and retry. Panel server users should contact their provider.

*Applies to: LeviLamina 1.x up to current 26.60.x (installed with lip)*

### What should I do when installing or starting LeviLamina (BDS) reports a missing VC runtime / DLL (such as `MSVCP140.dll` or `VCRUNTIME140.dll`), error code 1114, an outdated vcredist, or when `PeEditor.exe` fails during a lip install and LeviLamina does not load?

The Microsoft Visual C++ runtime (vcredist) is missing or too old. Install or update to the latest Microsoft Visual C++ Redistributable, x64 version: <https://aka.ms/vc14/vc_redist.x64.exe> (the link the official documentation currently uses; the older link <https://aka.ms/vs/17/release/vc_redist.x64.exe> belongs to the same series). Notes:

1. You must install the x64 version, and it must be the latest one. Installing only the latest one is enough; you do not need all the older versions since 2005. Runtimes bundled with tools such as the DirectX repair tool are often not the latest and may still cause the error. If it is already installed, run the installer and choose "Repair", then restart the computer and try again.
2. You need the VC++ runtime, not Visual Studio (VS is only needed for developing mods), and installing the .NET runtime does not fix this problem.
3. After installing the runtime, run the lip install command again (or run `PeEditor.exe` in the BDS directory again to generate `bedrock_server_mod.exe`). If an earlier installation failed halfway and left files that conflict, reinstall in an empty folder or delete the conflicting files as prompted, and use `lip cache clean` to clear the lip cache if necessary.
4. If the runtime is already the latest and the error persists (for example error code 126/127), LeviLamina or the mod is most likely not fully installed, or the mod does not match the LeviLamina/BDS version. Follow the Dependency diagnostic output; installing with lip is recommended so that versions are matched automatically.
5. When installing a server on Windows, newer lip checks for the VC++ runtime itself (registry `HKLM\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64`, `Installed=1`). If it is missing, lip downloads `vc_redist.x64.exe` and installs it silently as administrator, which shows a User Account Control (UAC) prompt; choose "Yes". If you choose "No", lip reports `The Microsoft Visual C++ Redistributable was not installed: Windows did not allow its installer to run as an administrator.` Run the command again and allow it, or install the runtime yourself from the link above.

See "Troubleshooting" in the official documentation: <https://levilamina.liteldev.com/zh/user_guides/troubleshooting/>

*Applies to: All current LeviLamina versions (Windows server, including 26.60.x)*

### When I double-click `bedrock_server_mod.exe` to start a LeviLamina server, the window flashes and closes (no output, no CrashLogger crash log, same with plugins removed). How do I troubleshoot?

A LeviLamina server is started with `bedrock_server_mod.exe` (generated from `bedrock_server.exe` by PeEditor). When it closes immediately, do not double-click it. Open a terminal in the server directory and run it from there, so the window stays open and you can see the error printed before it exits: type `cmd` in the File Explorer address bar and press Enter, or use "File -> Open Windows PowerShell", then run `bedrock_server_mod.exe` (in PowerShell, `.\bedrock_server_mod.exe`; type `bed` and press Tab to complete). For a server managed by lip, you can also run `lip run` in the server directory, which prints the server log to the console. Common causes:

1. The VC++ runtime is missing or too old (for example a message about a missing `VCRUNTIME140_1.dll` or `CONCRT140.dll`, or error 1114): install the latest x64 runtime from <https://aka.ms/vc14/vc_redist.x64.exe>. A crash on a server that works on your own computer is mostly caused by this.
2. A mistake in a configuration file (for example `true` written as `ture` in `server.properties` or a JSON config): fix it according to the error.
3. An old LeviLamina configuration file causes the problem: back up and delete the `mods/LeviLamina/config` folder (for old installations that use the `plugins/` directory, `plugins/LeviLamina/config`), then start again so LL generates a new configuration.
4. The files were extracted incorrectly or the installation is incomplete: extract again or reinstall with lip, and keep the LeviLamina and BDS versions matched; do not use old versions.

*Applies to: All current LeviLamina versions (Windows server)*

### After BDS starts, the console only prints something like `NO LOG FILE` and I do not see the LeviLamina startup logo or loading log (for example after upgrading with lip). How do I troubleshoot?

The "NO LOG FILE" line is output of vanilla BDS itself and is not the cause. What matters is that the LeviLamina startup logo and loading log do not appear, which means LeviLamina was not loaded at all. Make sure you are running `bedrock_server_mod.exe`, that the `mods/LeviLamina` directory exists and is complete (containing `manifest.json` and `LeviLamina.dll`), and that `PreLoader.dll` is in the root directory. Newer LeviLamina versions changed the file locations, and files left over from old versions in the root directory or in `plugins/` can cause loading problems (see the changelog). The most reliable approach is a fresh LeviLamina installation with lip in a clean server directory, instead of copying files manually or upgrading in a messy old directory.

*Applies to: LeviLamina 1.x and later (currently 26.60.x), server*

### Loading a mod such as GMLIB-LegacyRemoteCallApi fails with `Failed to load mod ... Missing dependency ModAPI`, and installing GMLIB does not help. What should I install?

ModAPI is a base library that GroupMountain (the GMLIB family) split out separately. It is not included in GMLIB and must be installed separately. The easiest way is to install a mod that depends on it with lip (for example `lip install github.com/GroupMountain/GMLIB-LegacyRemoteCallApi`); lip pulls in prerequisites such as GMLIB-Release, ModAPI-Release and iListenAttentively according to the dependency declarations. To install manually, download the ModAPI that matches your LeviLamina/GMLIB version from GroupMountain's GitHub (the ModAPI-Release repository).

*Applies to: Versions after ModAPI was split out of GMLIB (GMLIB-LegacyRemoteCallApi 1.13.0 requires LeviLamina >=26.51.0)*

### Starting a LeviLamina server reports that the port is in use (or the crash log shows the port in use), but the configured port should not be used by any other program. How do I fix it?

Most likely a BDS process started earlier from the same path is still running in the background. On startup LeviLamina detects "another BDS process with the same path exists, which may cause the network ports and world to be occupied" and asks whether to terminate the process with that PID (y=Yes, n=No, e=Exit); enter `y`. You can also end `bedrock_server_mod.exe` / `bedrock_server.exe` in Task Manager. If you really want to run a second server on the same machine, change both `server-port` and `server-portv6` in `server.properties` and set `enable-lan-visibility` to `false`; otherwise they may still conflict.

*Applies to: All current LeviLamina versions*

### A LeviLamina server freezes (unresponsive but the process does not exit, no crash log) and unloading plugins does not reveal the cause. How do I find where it is stuck?

1. First make sure LeviLamina, LSE and all mods are up to date and match each other.
2. Unload mods/plugins by bisection (including addon and world factors) to narrow it down.
3. Capture the call stack with a debugger: install WinDbg or x64dbg, attach to the `bedrock_server_mod.exe` process while the server is stuck, break, and look at the Call Stack. Focus on which module/function the `MC_SERVER` main thread is stuck in; that tells you which mod (or LSE script with an infinite loop) is blocking. To see function names you need the matching pdb (LeviLamina releases provide a debug package).
4. Send the call stack screenshot/text to the mod developer or the LeviLamina developers for analysis.

*Applies to: All current LeviLamina versions*

### LeviLamina reports a missing symbol when loading a plugin/mod (`Could not find symbol`, missing API, missing `LeviLamina.dll` export), and updating the dll does not help. How do I fix it?

The symbols do not match: the mod or its prerequisite was compiled for a different LeviLamina/BDS version, and the symbol it needs does not exist in the current version (the dependency diagnostic in the startup log shows missing content, and the error code is usually 127, "dependency version incorrect"). To fix it, update the mod and prerequisites such as GMLIB to versions that support your LeviLamina version (download from their GitHub Releases or levimc.org/mods), or switch LL/BDS to a version the mod supports. If BDS/LL itself is incompletely installed or the versions are inconsistent, reinstall matching BDS and LeviLamina with lip (for example `lip install github.com/LiteLDev/bds@<version> LeviLamina`).

*Applies to: All current LeviLamina versions*

### LeviLamina reports `Failed to load manifest for XXX-1.1.0` / `Mod name XXX do not match folder XXX-1.1.0` when loading a mod, and after renaming it cannot find the entry file. How do I fix it?

1. LeviLamina requires the mod folder name to match the `name` in `manifest.json` exactly. For example, rename `mods/LLBlackBEEx-1.1.0` to `mods/LLBlackBEEx` (remove the version number).
2. An entry loading failure after renaming is usually caused by an extra directory level created during extraction (`mods/LLBlackBEEx/LLBlackBEEx/...`), so the file that `entry` in the manifest points to cannot be found. Move all files from the innermost folder into `mods/LLBlackBEEx/` (`manifest.json` must be directly inside `mods/<mod name>/`), delete the extra inner folder, and restart the server.

Installing mods with lip avoids this kind of directory problem.

*Applies to: All current LeviLamina versions (mod directory is `mods/`)*

### On a 26.40 server, using a Nether portal takes a very long time to teleport and entering an End portal gets stuck on the loading screen. What is the cause?

It is caused by the third-party plugin FuckMovementAuthority (which bypasses server-side movement validation). Uninstall it and teleporting works normally. The author has fixed this and re-released the plugin as FuckPlayerActionsAuthority; update to the new plugin.

*Applies to: BDS 26.40 + old versions of this third-party plugin. Not confirmed against the source code or the documentation: treat it as a pointer.*

### After setting `language=zh_CN` in `server.properties`, block and item names in the console and in plugins show as translation keys (translation fails), or the translation system misbehaves when Education Edition is enabled or mod items exist. What is the cause?

This is a problem with the third-party prerequisite library GMLIB: the interfaces of some GMLIB versions break the translation system. If no plugin depends on GMLIB, deleting GMLIB restores it; otherwise update GMLIB or report it to its author. Removing the `language` setting itself does not help.

*Applies to: GMLIB versions from the BDS 26.40.x + LeviLamina 26.40.x period. Not confirmed against the source code or the documentation: treat it as a pointer.*

### After installing LeviLamina on BDS, the response of the `list` command is abnormal, while vanilla BDS is fine. What is the cause?

It is caused by the third-party prerequisite library GMLIB. Deleting GMLIB restores it, and it is unrelated to LeviLamina itself. The GMLIB side says it has been fixed; update to a newer GMLIB version or open an issue with them.

*Applies to: GMLIB versions around October 2026. Not confirmed against the source code or the documentation: treat it as a pointer.*

### BDS (with LeviLamina/LSE) reports an error and crashes on startup, and the log shows a memory allocation failure (`bad_alloc`). What is the cause?

Both the error and the crash are caused by a memory allocation failure, that is, not enough physical memory (RAM, not disk space). In the reported case the machine had only about 1.5GB of free memory. Close other memory-hungry programs or add more memory to the server.

*Applies to: All current versions (depends on the environment). Not confirmed against the source code or the documentation: treat it as a pointer.*

### A LeviLamina server starts normally, but crashes when a player joins (stack overflow, the trace shows a crash inside BDS internal logic such as a random swim target fetching a chunk). How do I troubleshoot?

Such a trace only shows that the crash happened inside BDS internal logic. It is usually caused by interference from some mod/plugin, and the world is generally fine. Remove plugins one at a time to find it. In the reported case the cause was the third-party plugin FixCopyItem (a general item duplication fix); removing it solved the problem. Note that a plugin advertised as "works on all versions" can also break on a new version. Also, when you upgrade LeviLamina you must upgrade to the BDS version it corresponds to at the same time.

*Applies to: All current versions (troubleshooting approach). Not confirmed against the source code or the documentation: treat it as a pointer.*

### LeviLamina prints an error related to `bedrock-runtime-data` at startup (everything else works). What is the cause?

The `bedrock-runtime-data` version is too old and does not match the current LeviLamina. Each LeviLamina version depends on a specific version of `bedrock-runtime-data` (different for server and client), so update it too when installing manually. Installing/updating LeviLamina with lip installs the matching version automatically.

### A mod under LeviLamina (such as GMLIB) installed with lip fails to load and reports that the manifest may be wrong. What should I check?

A load failure is usually caused by missing mod files or a problem in `manifest.json`. `entry` in `manifest.json` must match the actual dll file name, and the name of the mod's folder under `mods` must match `name` in `manifest.json`; otherwise it cannot be loaded. To troubleshoot, keep only that prerequisite and a single mod that depends on it and load them one by one to rule out conflicts with other mods (in the reported case another plugin turned out to be the conflict).

### LeviLamina reports at startup that its own player information database (LevelDB) cannot be opened. How do I fix it?

Usually leftover data or an abnormal shutdown has left the `CURRENT` file in the LevelDB directory pointing to a MANIFEST that does not exist. In current versions the database is at `mods/LeviLamina/data/playerinfo` (in old versions `plugins/LeviLamina/data/playerdata`). To fix it, open `CURRENT` in that directory with Notepad and change its content to the name of a `MANIFEST-xxxxxx` file that actually exists in the directory; or delete the database directory (you lose the player UUID/XUID/name mappings LeviLamina recorded, which are recorded again while the server runs).

*Applies to: LeviLamina 1.x and later (path is `mods/LeviLamina/data/playerinfo`)*

### LeviLamina reports an error at startup because the `bedrock-runtime-data` version is too old. How do I fix it, and do I need to upgrade BDS?

The `bedrock_runtime_data` data in the server root directory does not match the current LeviLamina. This is not a problem with BDS itself (the BDS version only needs to be the one LeviLamina requires). `bedrock-runtime-data` is a lip dependency of LeviLamina (its version is pinned exactly); set up the game and loader again with lip to install the matching version automatically, for example `lip setup --game 1.26.60 --loader levilamina@26.60.8` (note: the current lip `lip update` refuses to operate on LeviLamina/bds and tells you to use `lip setup` instead). You can also download the version required by LeviLamina's `lip.toml` from the releases of <https://github.com/LiteLDev/bedrock-runtime-data> and replace the `bedrock_runtime_data` folder in the root directory.

*Applies to: All current versions (LeviLamina 26.60.8 depends on bedrock-runtime-data 26.60.6-server.16)*

### A mod cannot load when LeviLamina starts and reports a missing dependency (`... is missing` / `missing module`). What does it mean?

Literally: a dependency mod declared by the mod is not installed (`xxx will not be loaded because dependency yyy is missing`), or a DLL/symbol that the mod's dll depends on does not exist (`missing module` / `missing content`). Install the mod with lip to fill in dependencies automatically (`lip install <package>`), or manually install the missing dependency mod/runtime. For missing content (missing symbols), the mod usually does not match the current LeviLamina/BDS version.

### What does the LeviLamina log message `LOG FILE SINK: failed to archive ./logs/latest.log as ./logs\2026-10-28.log: The process cannot access the file because it is being used by another process., continuing in the new file` mean?

When archiving the log by date (renaming `latest.log` to a dated file), another process was using the file, so the rename failed. LeviLamina continues writing to a new log file instead, and the server is not affected. Check whether another program (a log viewer, a panel, another server instance, and so on) has `logs/latest.log` open.

*Applies to: Current LeviLamina 26.x versions*

### A LeviLamina server crashes as soon as a player joins (with a trace log and minidump). What is the cause?

In this case the crash log pointed to the third-party plugin GMSidebar; removing it restored normal operation, and a fix requires contacting the plugin author. The general approach: look at the faulting module in the trace log generated by CrashLogger, identify the specific plugin, then remove or update it.

*Applies to: Servers with GMSidebar installed (versions around July 2026). Not confirmed against the source code or the documentation: treat it as a pointer.*

### On a LeviLamina server, players cannot place blocks continuously, blocks are "swallowed" and walking rubber-bands, while vanilla BDS has no problem. What could be the cause?

Most likely some plugin is causing it; remove plugins one at a time to find it. In this case the problem was solved by deleting the third-party plugin bcbk. You can also check whether settings related to server-authoritative movement in `server.properties` (such as `server-authoritative-movement`) have been changed.

*Applies to: All current versions (troubleshooting approach). Not confirmed against the source code or the documentation: treat it as a pointer.*

### A LeviLamina server crashes after loading FAC (a native dll injected directly, not loaded through LL). What is the cause and how do I fix it?

LeviLamina replaces the global memory allocator (memory operator) of BDS with mimalloc. A native dll that is injected directly and not loaded through LeviLamina crashes the server when it allocates and frees memory shared with BDS/LL without using LL's memory operator. To fix it, use a version that is loaded as a LeviLamina mod, or ask the author to adapt it. The maintainers have mentioned that a special build that does not replace the memory allocator can be used, but it lowers overall performance.

*Applies to: LeviLamina 0.13.x to now (the allocator replacement still exists). Not confirmed against the source code or the documentation: treat it as a pointer.*

### A LeviLamina server has both TickGuard and GMLib installed, and the server "crashes" without any log (it freezes). What is the cause?

This is a freeze caused by a conflict between TickGuard and GMLib: when the server lags, TickGuard clears expired scheduled ticks (pt), GMLib still believes they exist, and an access violation follows. To fix it, uninstall TickGuard and wait for the author to make a compatibility fix.

*Applies to: Servers with both TickGuard and GMLib installed (versions around September 2026). Not confirmed against the source code or the documentation: treat it as a pointer.*

### A LeviLamina server fails to start with `Could not load server.properties file`, although `server.properties` clearly exists. What is going on?

Usually the server is started through a panel or third-party "launcher" whose working directory (start directory) is not the BDS root directory, so BDS cannot find `server.properties`. Check the start script (such as `start.cmd`) or the panel configuration and make sure `bedrock_server_mod.exe` is started with the server folder as its working directory. You can also start it with `lip run` inside the server folder.

*Applies to: All current versions (depends on how and where it is started). Not confirmed against the source code or the documentation: treat it as a pointer.*

### After a LeviLamina server is updated to the latest version, players cannot join (connection fails). What could be the cause?

Newer Bedrock Edition uses NetherNet transport, which uses `server-udp-ports` (default 19132, UDP) in addition to `server-port` (default 19132, TCP and UDP). When the server is behind NAT (port mapping, a port assigned by the provider, or tunneling), configure it as in the official tutorial: open TCP+UDP ports; if STUN fails to get the public IP (the client reports the error code `Door`), tell the server the public address manually (format `<public IP>:<external port>:<local port>`); if the port is decided by the provider or you use tunneling such as frp, turn off LeviLamina's NetherNet patch in the `targeted` section of `mods/LeviLamina/config/Config.json`. Tutorial: <https://levimc.org/tutorials/server/let-friends-join/>

*Applies to: LeviLamina 26.x (BDS 1.26.60 and other versions that use NetherNet)*

### On a LeviLamina server, after a player clicks "Download required resource packs and join" it stays stuck on locating the server and finally times out; the console also warns that addon data "exceeds the threshold". What should I do?

"Exceeds the threshold" is only a warning that the addon stores too much data; it does not cause crashes and can be ignored. For a stuck resource pack download, install GMEssentials (gme) and enable its resource pack download fix `resource_pack_download_fix` (set to `true`) in its configuration; or install the CoResourcePack plugin (<https://www.minebbs.com/resources/coresourcepack.16185/>).

*Applies to: LeviLamina 26.x, GMEssentials v26.60.0 and other versions that support the current version*

### A LeviLamina server crashes while running and the trace log shows the world (`world/db`) is in use. What is the cause?

The world files are in use. A common cause is that the same server (the same world directory) was started twice, or the previous process did not exit completely and still holds the world. Check for a leftover `bedrock_server_mod.exe` process, end it, and restart the server.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

### A LeviLamina server crashes frequently and the crash log shows the crash happens while handling `ItemStackRequestPacket`. Is an addon the cause?

This kind of crash happens in the network layer while handling `ItemStackRequestPacket` and is unrelated to addons. It started appearing in June 2026 and reports increased in August; it is suspected to be a crash technique in which a cheat client sends malicious packets.

*Applies to: LeviLamina/BDS versions from mid-2026 onward. Not confirmed against the source code or the documentation: treat it as a pointer.*

### The console of a LeviLamina server does not display Chinese and shows no LeviLamina or mod loading logs, yet the server can be joined and responds to motd queries. What is going on?

LeviLamina was not loaded properly, and what is actually running is vanilla BDS (which is why you can join and query the motd, but there are no LL logs or mod loading). First make sure you started the `bedrock_server_mod.exe` generated by PeEditor during installation (PreLoader loads LeviLamina into it), not the vanilla `bedrock_server.exe`. Then scroll to the top of the console log and look for errors during the PreLoader/LeviLamina loading stage (such as error codes 126/127/1114) and fix them accordingly.

*Applies to: All current LeviLamina server versions*

### A dimension of a LeviLamina server has a huge number of entities piled up (for example hundreds of thousands of wither skulls or sand duper drops), so the server freezes or runs out of memory as soon as the chunks load and you cannot get in to run `kill`. How do I clean them up?

Do not wait until the chunks load to `kill`; clean up the entities in the world offline. You can use a third-party plugin that provides offline entity cleanup (such as Cleaner); download a version that matches your LeviLamina/BDS version (go by the GitHub release, since MineBBS may host an old version). You can also write a one-off mod that walks the world at server startup and deletes the specified entities by dimension/coordinate range, and uninstall it after cleaning. If you can still enter the world, you can also run a command such as `execute in the_end run kill @e[...]` in a looping command block.

*Applies to: General approach; third-party plugins must match the current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

### When starting a LeviLamina server, the console says another BDS process with the same path was detected (showing a PID) and asks whether to terminate it. What does this mean and what should I choose?

LeviLamina detected that another process of BDS (`bedrock_server.exe` / `bedrock_server_mod.exe`) from the same path is already running, which makes the port and world occupied. The prompt is `Do you want to terminate the process with PID xxx? (y=Yes, n=No, e=Exit)`: enter `y` to end the old process and continue starting; `n` to leave it and continue starting; `e` to quit this startup. Usually choose `y`, or close the other BDS window manually first. This check can be turned off with `checkRunningBDS` in the LeviLamina configuration (on by default); it is skipped automatically when there is no console input (for example when running as a service).

*Applies to: Current LeviLamina server versions*

### After installing LeviLamina on the client (with no mods), an error pops up as soon as the game starts, and the game runs normally after removing LeviLamina. How do I fix it?

Most likely the VC++ runtime (vcredist) is too old: LeviLamina uses very new C++ features and needs a recent runtime (typical error code 1114). Download and install the latest version from Microsoft: <https://aka.ms/vc14/vc_redist.x64.exe> (do not use runtime bundles from third-party sources, which may be older). If the installer says it is already installed, choose Repair, or uninstall first and then install the new version. When you use LeviLauncher, the launcher checks the desktop VC++ runtime (x64) for the native mod loader and prompts you to install it.

*Applies to: All current LeviLamina versions (client and server)*

### A LeviLamina server prints a yellow warning `AuthHelper could not find cert` at startup. Do I need to do anything?

This message is output by Mojang/vanilla BDS itself. It does not affect the server and can be ignored.

*Applies to: Vanilla BDS behavior, independent of the LeviLamina version. Not confirmed against the source code or the documentation: treat it as a pointer.*

### The server crashes and the trace shows `LeviLamina.dll -> ll::event::player::PlayerInteractBlockEventHook::detour [PlayerInteractBlockEvent.cpp]`. Is it a LeviLamina problem?

This hook is placed on `GameMode::$useItemOn`: it publishes `PlayerInteractBlockEvent` first and calls the original function if the event is not canceled. A stack that stops here usually means the crash happened during event dispatch (a callback of a mod/plugin subscribed to `PlayerInteractBlockEvent` failed), or in the original function chain called afterwards (another mod's hook on the same function, or the game itself); it is generally not a problem in LL itself. Provide the full trace log and minidump, and check one by one the plugins that listen to the player-interact-block event or hook item use/interaction logic.

*Applies to: LeviLamina 1.x and later*

### After the server steps on a "wrong block" (an unknown block left by a removed mod/addon), it freezes within seconds and the log says BDS crashed. How do I remove these unknown blocks?

Unknown blocks can make the server freeze or crash. You can install CleanerUnknownBlock, a native LeviLamina mod from a community developer; put it in and restart, and it removes unknown blocks automatically. You can also use a world editing tool such as Chunker offline to replace the wrong blocks with air, or delete the affected chunks so they regenerate (back up the world first).

*Applies to: Depends on the third-party mod CleanerUnknownBlock supporting the current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

### The server shows no errors, but the client reports a corrupted packet/disconnects, and the server and client versions are the same. How do I troubleshoot?

Remove all plugins, then enable them one by one to find the faulty plugin (in the reported case the AntiXray fake-ore plugin was the cause). Common causes of corrupted packets: a plugin sending packets from a non-main thread/multiple threads; a protocol conversion plugin such as Glacie converting the packet format incorrectly; a plugin developer writing a `BinaryStream` in the wrong format.

*Applies to: All current versions (third-party plugin problem). Not confirmed against the source code or the documentation: treat it as a pointer.*

### A licensed client connecting to my LeviLamina server on my own computer (through frp) says "You must be authenticated with Microsoft services", and turning off `online-mode` does not help. How do I fix it?

Check the system time of the server machine: in the reported case the server clock was 6 minutes off from standard time, which made Xbox Live/Microsoft authentication fail. After synchronizing the server's system time, joining works (if it then gets stuck on "locating server", waiting a bit longer usually lets you in).

*Applies to: Vanilla BDS authentication behavior, independent of the LeviLamina version. Not confirmed against the source code or the documentation: treat it as a pointer.*

### A LeviLamina server fails to start with an error (after updating plugins or manually mixing components). What could be the cause?

This startup error occurs when any one of the PreLoader version, the `bedrock-runtime-data` version and the BDS version does not match the current LeviLamina; mixing components of different versions manually can also reproduce it. Make sure the three versions correspond, and use lip to install/update them together: `lip install LeviLamina` (that is, `lip install github.com/LiteLDev/LeviLamina`, which runs as a setup and installs the latest LeviLamina and the latest BDS it supports) or `lip setup --game <BDS version>` (automatically selects the latest LeviLamina that supports that BDS). lip installs matching versions of PreLoader, `bedrock-runtime-data` and other components according to the dependency declarations in LeviLamina's `lip.toml`.

*Applies to: All current LeviLamina versions (server)*

## Crash logs (CrashLogger)

### LeviLamina reports `ERROR [CrashLogger] Couldn't Create CrashLogger Daemon Process` at startup and throws `std::system_error` `[0x00000002:system] 系统找不到指定的文件` (The system cannot find the file specified) (or says CrashLogger / `crashlogger.exe` is missing). What does it mean, and how do I install CrashLogger?

LeviLamina cannot find the external CrashLogger daemon program (`CrashLogger.exe`). This is common with manual installs, with server packs or bundles that someone else built (the exe was deleted by antivirus software when extracting), or with incomplete files. The error does not stop the server: after failing to create the daemon, LeviLamina automatically falls back to the built-in CrashLogger. The built-in mode captures crashes inside the process, so its information and reliability are worse than the external version. To fix it:

1. Preferably install or reinstall LeviLamina with lip (in an existing server workspace run `lip install github.com/LiteLDev/LeviLamina`; for a new server use `lip setup --game <BDS version>`, which includes LeviLamina by default on Windows). CrashLogger is a dependency of LeviLamina and is installed automatically. The official documentation no longer provides manual installation instructions.
2. Add the file manually: download `CrashLogger-windows-x64.zip` from <https://github.com/LiteLDev/CrashLogger/releases> and put its `CrashLogger.exe` at `mods/LeviLamina/CrashLogger.exe` in the server directory (older versions used `plugins/LeviLamina`; it is now `mods`). You can also set its relative path in `modules.crashLogger.externalpath` in `mods/LeviLamina/config/Config.json`.
3. If you do not want to use the external version, set `modules.crashLogger.builtin` to `true` in the same config file to use the built-in CrashLogger directly. Setting `modules.crashLogger.enabled` to `false` turns CrashLogger off completely (no crash log is generated on a crash).

*Applies to: LeviLamina 26.60.x (mods directory layout); CrashLogger 1.4.x*

### After a LeviLamina server crashes (the console just closes or shows nothing), where are the crash log and the dmp file? What should I send when asking for help?

They are generated by CrashLogger and are in `./logs/crash/` under the server root directory (the directory containing `bedrock_server_mod.exe`). The file names include the crash time, for example `trace_2026-11-13_23-30-29.log` and `minidump_2026-11-13_23-30-29.dmp`. When asking for help, send both files; the trace log is the more useful one (it contains the call stack, module list, registers and memory information). Vanilla BDS does not have this feature. Note: no crash log is produced when the process is killed (for example from Task Manager, or by a power loss), and none is generated when the crash happens before CrashLogger is initialized or while CrashLogger is turned off. One common cause of crashes is a plugin whose version does not match the LeviLamina/BDS version; switch to a plugin version that matches your server version.

*Applies to: LeviLamina, all current versions (external and built-in CrashLogger both write to logs/crash)*

### How do I read the `trace_xxx.log` and `minidump_xxx.dmp` that a crash generates? How can I tell which plugin caused it?

Start with the Stacktrace call stack in the trace log and find the modules that are neither BDS itself (`bedrock_server_mod.exe`) nor system DLLs. For example, if the stack contains `vanish.dll -> PlayerInteractBlockHook::detour+0xA4 [Hook.cpp:846L]`, the crash happened inside a hook of the vanish plugin, so contact that plugin's author or remove the plugin. For deeper analysis, open `minidump_xxx.dmp` in WinDbg and run `!analyze -v` to see the exception and the crash stack (it works better when you configure the pdb symbol path for the relevant modules).

*Applies to: LeviLamina + CrashLogger, all current versions*

### The minidump `.dmp` file that CrashLogger generates after a BDS crash is 0 B and cannot be analyzed. What can I do?

A size of 0 B means the dump could not be written at crash time (common with severe crashes such as running out of memory). First check whether the `trace_*.log` in the same directory has a call stack and Memory Info. If you need a full dump, attach Sysinternals procdump to the `bedrock_server_mod.exe` process (for example `procdump -e -ma <pid>`), capture a full dmp, and analyze that. Note that when the external CrashLogger is already attached to the process as a debugger, procdump's exception monitoring may fail to attach. In that case, first turn CrashLogger off (`modules.crashLogger.enabled=false`) or end the CrashLogger process.

*Applies to: LeviLamina, current version (procdump is a third-party tool). Not confirmed against the source code or the documentation: treat it as a pointer.*

### My LeviLamina server crashed and there is no CrashLogger crash log. Is the built-in crash capture enough on its own?

Install the external CrashLogger (<https://github.com/LiteLDev/CrashLogger>). When you install LeviLamina with lip, it is installed automatically as a dependency at `mods/LeviLamina/CrashLogger.exe`. Manual installs and server packs often lack this component, which is one reason the official recommendation is lip (it is modular, so components are less likely to be missing). The built-in CrashLogger of LeviLamina now also generates `trace_*.log` and `minidump_*.dmp` under `logs/crash`, but it runs inside the crashing process, so after a severe crash (such as a stack overflow or heap corruption) it may fail to write the files or write incomplete information. The external version captures the crash from a separate process as a debugger, which is more reliable and gives more complete information.

*Applies to: LeviLamina, current version*

### My LeviLamina server crashes frequently. The CrashLogger log only shows `Code: 0xC0000409` and `Module: ucrtbase.dll`, and the stack is all hexadecimal addresses. How do I find the cause?

`0xC0000409` in `ucrtbase.dll` usually means that some mod triggered an abort/fast-fail (for example an uncaught exception or `std::terminate`); it is not a problem in ucrtbase itself. Put the `.pdb` symbol files of the relevant mods next to the mod dlls (any subdirectory of the server directory works). The external CrashLogger scans the server directory recursively and loads these pdb files, so the stack can be resolved to function names and source line numbers, which identifies the faulty mod. You can also remove mods one by one to reproduce the crash by elimination.

*Applies to: LeviLamina, all current versions (external CrashLogger 1.x)*

### When a LeviLamina server running under wine (a panel host) crashes, CrashLogger cannot output a valid stack (it cannot read the pdb / a module is missing). What should I do?

A wine bug may stop the external CrashLogger from reading the pdb, or the wine environment may be incomplete and lack the dlls that CrashLogger needs (`dbghelp.dll` / `symsrv.dll`). In the LeviLamina config file `mods/LeviLamina/config/Config.json` (`plugins/LeviLamina/config/Config.json` on older installs), set `modules.crashLogger.builtin` to `true` to switch to the built-in CrashLogger, then wait for the crash to happen again:

```json
"modules": {
  "crashLogger": {
    "enabled": true,
    "builtin": true
  }
}
```

Also, a crash about a minute after joining the server is usually caused by a mod that is incompatible with the current version. If a fresh install without mods does not crash, the mods are the problem; check for and remove the mods that do not match.

*Applies to: LeviLamina, current version (wine/Linux panel environments)*

## PreLoader and PeEditor

### When starting BDS, PreLoader reports `Can't load ./plugins/LeviLamina\LeviLamina.dll`, `Error code: 127` and "找不到指定的程序" (the specified procedure could not be found). How do I fix it?

Error code 127 means that a function or version required by LeviLamina or a mod does not match (the specified procedure entry point cannot be found). Check the following in order:

1. Make sure the LeviLamina version corresponds strictly to the BDS version (installing/switching with lip is recommended: `lip setup --game <BDS version>` automatically picks the matching LeviLamina, PreLoader and PeEditor), and look at the dependency diagnostic (`Dependency diagnostic`) printed by PreLoader to see which dependency has the wrong version.
2. Download and install the latest VC++ runtime from the Microsoft website (not from a third-party server pack) at <https://aka.ms/vc14/vc_redist.x64.exe>, then restart.
3. Check the operating system version: the maintainers explicitly state that LeviLamina does not support Windows Server 2016; at least Windows Server 2019 (or a recent Windows 10/11) is required, and a system that is too old lacks the system functions needed and reports 127. On a cloud server you can reinstall Server 2019/2022 from the control panel; if reinstalling is not convenient, use a virtual machine, or switch to Linux and let lip run the Windows build of BDS through Wine.

*Applies to: all current LeviLamina versions (BDS for Windows)*

### When starting `bedrock_server_mod.exe`, PreLoader reports `Can't load LeviLamina.dll, Error code: 126` and then crashes. What is the cause?

Error code 126 means a DLL required by LeviLamina or a mod is missing (the specified module cannot be found). After reporting the error, PreLoader goes on to print a dependency diagnostic (`Dependency diagnostic` / `Analyzing dependency`); wait for it and check which file is actually missing.

Common causes: LeviLamina or its dependencies are not completely installed (PreLoader, PeEditor, CrashLogger, bedrock-runtime-data and so on do not match the LeviLamina version or are missing), or the VC++ runtime is missing.

Solution: reinstall LeviLamina with lip on a clean BDS (lip brings in dependencies of matching versions), then add your other mods back and copy your worlds over; also install the latest VC++ runtime from <https://aka.ms/vc14/vc_redist.x64.exe>. If it happens only occasionally and a restart fixes it, the cause is most likely environmental, such as files being locked or antivirus interference.

*Applies to: all current LeviLamina versions (BDS for Windows)*

### My LeviLamina server suddenly won't start, and I found that `PreLoader.dll` was deleted by Windows Defender as a virus. What should I do?

This is an antivirus false positive (the project has reported it to Microsoft). Restore the file from quarantine or reinstall `PreLoader.dll` (for example, run `lip install github.com/LiteLDev/LeviLamina` or `lip install github.com/LiteLDev/PreLoader` again), and add the server directory to the Windows Defender exclusions.

On Windows Server, Windows Defender is a server feature, so you can also remove that feature in Server Manager (note that after you install another antivirus on Windows Server, Defender is not disabled automatically by default).

*Applies to: all current versions (Windows)*

### After updating vcredist, a game/server with LeviLamina installed still fails to start. How can I debug it further?

Download x64dbg, set the environment variable `PL_DEBUG=1`, and start the game/server. After loading the Runtime Data, PreLoader prints `PL_DEBUG is set to 1, waiting for debugger to attach...` and pauses. At that point open x64dbg, click "File -> Attach", and double-click the MC (or `bedrock_server_mod`) process to debug it.

Do not start the process directly under the debugger from the beginning; that can make loading the Runtime Data fail. If PreLoader cannot even start (you cannot see the process), the cause may be the system (for example a stripped-down or unofficial Windows); check your Windows version.

*Applies to: current PreLoader (1.16.x)*
