# LegacyScriptEngine: general questions

## What is the purpose of this project?

The purpose of this project is to run LLSE plugins on LeviLamina.

## Does this project support all LLSE plugins?

Almost all LLSE plugins are supported, but some plugins may not work properly due to the differences in event triggering timing and other reasons.

## How long will this project be maintained?

This project will be maintained as long as we maintainers have the ability and time to maintain it.

## Does the LSE Node.js plugin support hot reload? After `ll reload` it reports success, then prints `NodeJs plugin XXX exited`. Did the reload fail?

Yes. In early versions (2024) the Node.js engine did not support reload and errored, but plugin reload (including nodejs/qjs/lua) has been fixed since LSE 0.9.0, and unloading stops the plugin's Node.js environment. Usage: run `ll reload <plugin name>` in the console, or `ll unload <plugin name>` followed by `ll load <plugin name>`.

The `[legacy-script-engine-nodejs] NodeJs plugin XXX exited with code 0.` message that appears after the reload-success message is not a failure. The actual order is that the old instance exits first and the reload then succeeds, but the "reload succeeded" message is command output and shows immediately, while "exited" is printed asynchronously through the logger with a delay, so the order looks reversed. In the current version, this message is output at Debug level when the exit code is 0, so you usually do not see it at the default log level; if it appears at Error level with a non-zero exit code, the plugin exited abnormally and you should check the errors before it.

Note: the LSE architecture dates from early LL, and reload is not 100% reliable. After reloading a plugin that registered commands with `mc.newCommand`, the old commands remain in the game but their callbacks are removed (running them shows `is the plugin unloaded?`); if anything goes wrong after a reload, restart the server directly, and keep LeviLamina and LSE up to date.

*Applies to: LegacyScriptEngine 0.9.0 and later (Node.js engine); LeviLamina 1.x and later*

## Can LSE JS plugins (QuickJS / Node.js engine) use ES Module `import`/`export` syntax? Loading with `import { xxx } from "./xxx"` fails with `Failed to load plugin ...: Unexpected token '{'`. What is going on?

Both engines now support ESM:

1. QuickJS engine: supports ES Module (ES2020) natively. However, ScriptX uses the module loader of quickjs-libc, and when loading the entry module specified in `manifest.json` it sets the base path to the current working directory (the directory containing the BDS server program) instead of the plugin directory. So a relative `import` in the entry file (such as `import { initCommand } from "./command/command.js"`) fails to resolve and reports `Failed to load plugin xxx: Unexpected token '{'`. To fix it, use a path relative to the working directory in the entry file, for example `import { initCommand } from "./plugins/your_plugin/command/command.js"`; or have the entry file `import` only the real entry module, after which `import` between the other modules is resolved by standard ESM rules. You can also bundle everything into a single js file with esbuild or similar.
2. Node.js engine: ESM is supported since LSE 0.10.6 (PR #268); set `"type": "module"` in the plugin's `package.json` to load it as an ES module (the default is CommonJS). Note that files imported in ESM need their file extension, and static `import` statements may only appear at the top level of a module (not inside a `try` block, for example).
3. Loading TypeScript directly is not supported; compile it to JS first with `tsc` or similar (either ESM or CommonJS works as the target module format).

See the section "About the path resolution behavior of QuickJS ESModule" in the documentation at <https://lse.levimc.org/zh/apis/LanguageSupport/>.

*Applies to: QuickJS ESM: LSE all versions; Node.js ESM: LSE 0.10.6 and later*

## What is the relationship between LegacyScriptEngine (LSE) and LeviLamina (LL)? What do abbreviations such as LXL/LLSE/LSE stand for?

LeviLamina (LL) is the mod loader itself and directly loads only native mods (C++ `.dll` files); LegacyScriptEngine (LSE) is itself a native LeviLamina mod that provides the LLSE API runtime for script plugins, and script plugins depend on it to run. LSE has four engines by language: QuickJS (JS, supports ES Module), Lua, Node.js (supports npm) and Python (CPython, supports pip). On a server, install the matching variant with lip, such as `lip install LegacyScriptEngine#quickjs` (`#lua`/`#nodejs`/`#python`); on the client, use LeviLauncher. The `type` in a script plugin's `manifest.json` is `lse-quickjs`, `lse-lua`, `lse-nodejs` or `lse-python`, and for a native mod it is `native`.

History: the script engine of the LL1 era was called LXL (LiteXLoader) -> in the LL2 (LiteLoaderBDS, LLBDS) era it was called LLSE -> LSE on LL3 (LeviLamina), all maintained by LiteLDev/LeviMC. LSE can run most old LLSE plugins, but it is not 100% compatible. Other common abbreviations: LO = LeviOptimize (performance optimization), LAC = LeviAntiCheat (anti-cheat). Documentation: <https://levimc.org/LegacyScriptEngine/> (the old addresses lse.levimc.org and docs.levimc.org/LegacyScriptEngine/ have been replaced by this one).

*Applies to: LeviLamina current version; LegacyScriptEngine 0.23.x*

## When several LSE plugins listen to the same event (such as `onChat` or `onLeft`) and one plugin intercepts it with `return false`, do the other plugins still receive the event? What is the execution order? Does LSE have event priorities?

Yes, they still receive it. The current LSE calls all listeners of the event in turn, in registration order (generally the plugin load order). When a listener returns `false`, it only marks the event as intercepted so that BDS (the LeviLamina event) no longer processes it; for example, an intercepted chat message is not visible to anyone, but this does not stop the listeners of other LSE plugins from continuing to receive the event.

`mc.listen` in LSE has no priority parameter. To control the order, declare a dependency with `dependencies` in the plugin's `manifest.json`: the depended-on plugin loads first, so its listeners are registered and run first. If you need real event priorities (for example a mute plugin that must intercept `TextPacket` or the chat event before other plugins), use a C++ mod and register the listener on LeviLamina's EventBus with a higher `EventPriority`. This is the event dispatch behavior since after 0.4.12.

*Applies to: LSE current version*

## Can an LSE (LegacyScriptEngine) script plugin open a chest-like container screen (fake chest / virtual container / chest menu) for a player and handle the player's clicks?

LSE has no API to directly open a container screen or chest menu, and the old LLSE NativeAPI is completely gone (hooking is not possible).

1. Display only (read-only viewing): this can be done with plain LSE by sending packets. Write the data with `BinaryStream` and call `createPacket`, then send it only to the target player with `packet.sendTo(player)` or `pl.sendPacket(packet)`, in this order: `UpdateBlockPacket` (fake a chest block near the player, for example above their head; it does not actually exist on the server and other players cannot see it) -> `BlockActorDataPacket` (write the block entity NBT; every item in the `Items` list needs a `Slot`) -> `ContainerOpenPacket` to open the container. Opening a container must correspond to a container block; it cannot be opened out of thin air. After viewing, send packets to restore the original block. This is only a client-side display, and the player cannot really take items. From experience: a chest works, a hopper does not; the client does not show a container while the player has the chat screen open, so let the player trigger it by entering a command. For the protocol, see Mojang's official <https://github.com/Mojang/bedrock-protocol-docs> (the Bedrock protocol page on wiki.vg is outdated).
2. Interactive chest menu (click an item to perform an action): plain LSE cannot handle received packets/callbacks. You need a dependency library (such as the chest-menu/virtual-container interface wrapped by the third-party GMLIB), or write a native mod in C++ directly (in C++ you can handle clicks with receive-packet events such as `ReceivePacketEvent` from the iListenAttentively event library; iListenAttentively is a C++ event library, and LSE scripts cannot listen to its packet-receive events directly). For simple button interactions, use a form instead.

LSE v0.23.1 still has no container screen API.

*Applies to: LegacyScriptEngine all current versions*

## Are LSE `setTimeout` / `setInterval` timings affected by the server TPS / tick rate? How do I make scheduled tasks unaffected?

Yes. LSE `setTimeout`/`setInterval` run on the server main thread, and the delay is converted into game ticks for scheduling, so when the tick rate is changed or the TPS drops, the actual trigger time changes with it. Checking every tick in `onTick` (such as a home-made cron) occupies the main thread and hurts TPS. It is better to compute the time until the next trigger and schedule it with `setTimeout`, and to move time-consuming work (such as world compression) to another thread or an external process.

In a native C++ mod, if you do not need to be in sync with ticks, you can use `ll::coro` coroutines with a non-tick executor such as `ll::thread::ThreadPoolExecutor` to wait by system time, and switch back to `ll::thread::ServerThreadExecutor` when you need to operate on game objects.

*Applies to: LegacyScriptEngine all current versions; LeviLamina current version (C++ part)*

## Can a LeviLamina server run / can I write Python (and Node.js) plugins? Do the old LLSE Python plugins still work?

Yes. LegacyScriptEngine now provides a Python engine and a Node.js engine (early LSE did not support them for a while, which is no longer an issue). Install the matching variant with lip: `lip install LegacyScriptEngine#python` (or `#nodejs`, `#lua`, `#quickjs`; without a variant, the QuickJS and Lua engines are installed by default). Put LLSE-era Python plugins directly into `plugins/` (since 0.23.0 this directory is a link to `mods/` created at startup); they are migrated automatically when the server starts (a `manifest.json` is generated) and load after you restart the server, but the Python plugin ecosystem is small.

Another option is to write Endstone Python plugins: LeviStone (EndstoneRuntime) can run Endstone plugins on LeviLamina, and it is an optional solution.

*Applies to: LegacyScriptEngine 0.23.x*

## The new LSE reports `找不到事件 onConsoleOutput！In Plugin: xxx` (meaning "event onConsoleOutput not found"; for example some TMEssential features stop working after upgrading BDS/LSE). Was `onConsoleOutput` removed?

Yes. The `onConsoleOutput` event existed in the LLSE era, but the new LSE no longer provides it, and the maintainers say it will not be added back (hooking the output stream for the script layer is bad design). The error means the plugin is too old and uses an event that no longer exists; the plugin author needs to remove the listener for that event (`mc.listen("onConsoleOutput", ...)`), which generally does not affect the plugin's other features. For a plugin that is no longer updated, such as TMEssential, switch to a similar plugin that is still maintained (for example YEssential; the home/warp json data can be migrated following its tutorial).

*Applies to: LSE 0.10.0 and later*

## Can LSE run on the LeviLamina client? How do I install it? Can I use it to write client mods (key events, Screen, etc.)? Does it work in multiplayer?

It runs, but it is essentially server only:

- On the Windows client, LSE runs only when you open a local world (a single-player world, which acts as a local server). It works the same as on a server, and LSE plugins written for the server also run on the client.
- Scripts are not activated when you join someone else's server for multiplayer, and many of LL's server-side APIs are unavailable on the client.
- The maintainers say LSE will not move toward client mods and does not plan to add client APIs such as key events or Screen. Client scripting would only be considered as a separate new engine in the future; for now, C++ is still the best choice for client mods.

Installation: on the client, install LeviLamina and LSE with LeviLauncher (LeviLauncher picks the correct client version automatically). In LSE 0.23.1 and earlier, the client variants are named `#client_lua` / `#client_quickjs` / `#client_nodejs` / `#client_python`. From the next version on (CHANGELOG `[Unreleased]`, migrated to `lip.toml`) there are no `client*` variants: install `#lua` / `#quickjs` / `#nodejs` / `#python` on both client and server, and lip/LeviLauncher selects the right files by side.

Only the Windows client is supported; the Android client is not.

*Applies to: LeviLamina client (Windows) + LSE 0.17.0 or later; variant naming changes after LSE 0.23.1*

## Can I debug LSE script plugins with breakpoints? Do I have to add output and restart the server every time I want to inspect a data structure? How do I locate the error line when writing in TypeScript?

The official LSE release does not provide a breakpoint debugger (you would have to modify the LSE source and recompile it; and even then, the client disconnects by timeout while the server is paused at a breakpoint).

- The usual approach is to add log output and reload the plugin with `ll reload <plugin name>`, without restarting the whole server.
- LSE also provides interactive command lines for simple testing: in the BDS console, enter `jsdebug` (QuickJS), `nodejsdebug`, `luadebug` or `pydebug` to enter or leave the interactive environment of the matching engine.
- TypeScript must first be compiled to JS with `tsc`. Error locations refer to the compiled JS, so you need to map them back to the TS source manually using the sourcemap.
- C++ mods can attach the Visual Studio debugger directly.

*Applies to: LegacyScriptEngine current version (v0.23.1)*

## Will LegacyScriptEngine be maintained long term? Will a new script engine (LeviScript) replace it?

In early 2024 (February), the developers planned to stop maintaining LSE once a new script engine, LeviScript, was finished. That plan has been dropped: in October 2024 the developers said nobody is writing the new script engine and it will not be written, and that LSE will continue to exist and be maintained.

Note that LSE's NativeAPI has been removed completely, so scripts can no longer call or hook native functions. If you need more power, the developers recommend writing a C++ mod directly. If you need a stable ABI or want to write plugins in another scripting language, consider the third-party Endstone.

## How do I show server data (such as a leaderboard) on a web page in real time?

Use a plugin to read the data and expose it to the web page through a network interface.

- You can start an HTTP server with LSE's built-in HttpServer (also available in QuickJS/Lua) or with the `http` module of the Node.js engine, and have the page poll it with JS.
- Or push updates over WebSocket for real-time refreshing.
- A C++ mod can also do this by using an HTTP library.

*Applies to: LSE current version*

## Can a BDS server plugin play music to players? Are there ready-made solutions?

Yes. There are two common approaches:

1. Play note-block music in NBS (Minecraft Note Block Studio) format, with a ready-made plugin such as LLSE-NBSPlayer: <https://www.minebbs.com/resources/llse-nbsplayer-bds-nbs.4479/>
2. Pack the music files into a resource pack, then play the sounds with a plugin or the `/playsound` command. The downside is that the resource pack becomes large.

*Applies to: current version (check third-party plugin compatibility yourself). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Do LL3 (LeviLamina + LSE) script plugins have a built-in database? Do I need to deploy something like MongoDB myself?

Yes. LegacyScriptEngine provides database APIs: a LevelDB-based key-value database (`new KVDatabase(dir)`) and SQL database sessions with `new DBSession(type, params)`, where `type` supports `"sqlite3"` and `"mysql"`. You generally do not need to deploy MongoDB; pick whichever fits (MySQL requires your own MySQL service).

*Applies to: LegacyScriptEngine current version*

## Can `setInterval` in LLSE/LSE run once every 1 millisecond?

No. LSE timer tasks are scheduled on the server's main-thread executor, and delays are rounded up to game ticks (1 tick = 50ms), so precision is limited by the tick and millisecond-level timing is not possible.

Also, if you only need to run commands periodically, command blocks or functions perform much better than a script calling `mc.runcmd`.

*Applies to: LeviLamina + LegacyScriptEngine current version*

## How do I view a player's IP on an LSE server and ban players (xuid/IP)? Which plugins can I use?

LSE provides an interface for getting a player's IP: `player.getDevice().ip` (the `ip` property of the device info object).

Plugins:

- To view player IPs, use s-view.
- For banning, use LLBlackBeEx (<https://www.minebbs.com/resources/llblackbeex-_.4405/>). It can also submit malicious players to the BlackBe cloud blacklist, and every server with a cloud-blacklist plugin installed will block them.
- Other ban plugins such as gmblacklist also work.

Note that banning IPs has limited effect: players can bypass it by switching networks or hotspots.

*Applies to: LSE current version (check third-party plugin compatibility yourself). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Is the documentation updated when the LSE API changes? Will LSE still get new APIs?

The documentation is updated together with the API (<https://levimc.org/LegacyScriptEngine/>).

The maintainers will no longer add new features to LSE on their own, and the existing API is largely stable, but community PRs are welcome, and new APIs are mainly added through community PRs (for example, 0.19.1 added a batch of community-contributed APIs including `Packet`, `BinaryStream`, `mc.getMotd` and `mc.summonMob`).

*Applies to: LSE current version*

## How does the LSE Node.js engine handle a plugin's `package.json` dependencies (`npm install`) and load the plugin?

When loading a plugin, if the `package.json` in the plugin directory has a `dependencies` field and the plugin directory has no `node_modules` yet, LSE first runs `npm install --omit=dev --no-fund` automatically (using the npm bundled in the engine directory), then creates the engine and loads the plugin:

- CommonJS plugins go through a wrapper bootstrap that changes the `require` lookup paths (adding the plugin directory and its `node_modules`) and then calls `require` on the entry file.
- Plugins whose `package.json` has `"type": "module"` are loaded as ES modules through `import()`.

So the startup is not the standard `node entry-file` launch.

*Applies to: LSE Node.js engine (`#nodejs` variant); ESM support since 0.10.6*

## What is the difference between LSE's `getAllPlayerInfo` and the all-player info provided by GMLIB's LegacyRemoteCallApi (GMLRA)?

LSE's `data.getAllPlayerInfo()` reads LeviLamina's PlayerInfo service. LL maintains this data itself and stores it in the `playerinfo` database under the LeviLamina data directory (outside the world). GMLRA calls GMLIB, which writes its data into the world data. As a loader, LL should not modify world data, so it uses external storage.

*Applies to: LSE 0.8.13 or later*

## What is the difference between LSE's Python engine and BDSpyRunner (pyr)? Can pyr plugins be used directly on the LSE Python engine?

They are different plugin loaders, and both support developing plugins in Python. LSE's Python engine (`lip install LegacyScriptEngine#python`) shares the same API with the other LSE engines (Lua/QuickJS/Node.js). pyr plugins do not work directly and must be rewritten for the LSE API.

Also, the LSE Python engine requires the matching Python version installed on the machine (3.12.10 for LSE >=0.16.2).

*Applies to: all current LSE versions*

## Can an LSE script plugin modify event data in an event listener, for example change 5 points of damage from a player attack to 10?

Not directly. The `mc.listen` event callbacks in LSE can only read the arguments, or return `false` for cancellable events to cancel them. They cannot rewrite data in the event (for example the `damage` of `onMobHurt`). If you really need to modify event data, write a LeviLamina mod in C++.

A workaround in scripts is to intercept the original event and then apply the effect again yourself through the relevant API (for example, cancel the original damage and call `hurt` on the entity to deal new damage), but this is not equivalent to actually modifying the event.

*Applies to: LegacyScriptEngine all current versions (up to v0.23.1)*

## Can LSE (LLSE) plugins implement custom interfaces such as JSON UI / ORE UI, rather than only forms?

No. LSE's GuiAPI only provides server-side forms (SimpleForm / ModalForm / CustomForm, and FormBuilder), and it does not currently wrap newer UI APIs such as DDUI. Custom interfaces like JSON UI must be implemented by a client-side resource pack.

A workable approach is to write a vanilla addon (resource pack / behavior pack) that provides the interface, and link it with the LSE plugin through an agreed channel (for example, a specific form title or content marker, `scriptevent`, or scoreboards).

*Applies to: LegacyScriptEngine current version (v0.23.1)*

## Does LegacyScriptEngine support MySQL? Can the old NativeApi (dyncall) still be used? Is SQLite available?

LSE restored MySQL support in 0.9.0 (now built on mariadb-connector-c). You use it through `DBSession`: set `type` to `"mysql"`, or use a connection string of the form `mysql://root:password@localhost:3306/db`. When 0.9.0 was released, the Node.js engine did not support MySQL; the source no longer distinguishes by backend, but whether it works under the Node.js engine depends on the actual version.

SQLite (`"sqlite3"`) has always been available and was never removed.

NativeApi was removed completely in 0.8.19 and will not return; old plugins that depend on dyncall/NativeApi cannot be used.

*Applies to: LSE 0.9.0 or later (current v0.23.1)*

## Does LegacyScriptEngine have a command to run JS/Lua code directly in the server console? Can an OP use it to "create a plugin" on the server?

Yes. The QuickJS engine provides `jsdebug` and the Lua engine provides `luadebug`. Running it without arguments enters or leaves interactive debug mode, where you run code line by line in the console (enter `stop` or run the command again to leave). You can also run a piece of code directly with `jsdebug <code>`. The Python engine uses `pydebug`, handled in the console only; the Node.js engine has no debug command.

Note: the permission for this command is set by `debugCommandLevel` in the LSE config file (`mods/legacy-script-engine-xxx/config/config.json`). The default is `GameDirectors`, which means OPs can run it in game by default. Being able to run arbitrary code is equivalent to having backend access to the server and is very unsafe. Raise `debugCommandLevel` (for example to `Owner`/`Host`) so that only the console can use it. If in-game admins need specific functions, write your own plugin that registers dedicated commands.

*Applies to: LSE current version (v0.23.1); the `debugCommandLevel` option was added in a recent version*

## Are the QuickJS/NodeJS/Python/Lua engines of LegacyScriptEngine separate code bases? How does it support multiple languages?

LSE has a single code base (<https://github.com/LiteLDev/LegacyScriptEngine>). Through the xmake backend setting (`lua` / `quickjs` / `python` / `nodejs`), the same source is compiled into four engines: `legacy-script-engine-lua`, `-quickjs`, `-python` and `-nodejs`.

Multi-language support is based on ScriptX (a multi-engine scripting wrapper originally open-sourced by Tencent; LiteLDev maintains its own fork). The layers are LSE -> ScriptX -> QuickJS / Node.js (V8) / Python / Lua. LSE is a port of LLSE, and each plugin gets its own ScriptEngine instance.

*Applies to: LegacyScriptEngine all current versions*

## Does LegacyScriptEngine have a `nodejsdebug` command?

There is no usable `nodejsdebug`. The source defines the name `nodejsdebug` for the Node.js backend, but the Node.js engine does not support a debug engine and does not register the command. The available debug commands are `jsdebug` for QuickJS, `luadebug` for Lua and `pydebug` for Python (console only).

*Applies to: LSE current version (v0.23.1)*

## How do I set a land administrator in the iLand land plugin?

Run `land op <player name>` in the server console. The player must have joined the server at least once. iLand is an LLSE script plugin and needs LegacyScriptEngine to run.

*Applies to: servers using the iLand script plugin (third-party plugin). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Why can't I find a LeviLamina C++ event for some of the events LSE provides, and how can a C++ plugin listen for the same things?

LeviLamina keeps only a small set of core events; most of the events from the LL2 era were not carried over into LeviLamina. To stay compatible with LLSE plugins, LSE fills in these events itself: some are based on the event library iListenAttentively (a dependency of LSE), and others are implemented with hooks inside LSE. So LSE events do not map one-to-one to LeviLamina events.

A C++ mod that wants the same listeners can depend on iListenAttentively (`lip install github.com/LiteLDev/iListenAttentively`) and use its events, or write its own hooks.

*Applies to: LeviLamina 1.x or later / current LSE*

## In LegacyScriptEngine, can global variables or a Map defined in one JS plugin interfere with other script plugins on the server?

No. LSE creates a separate script engine instance for each script plugin. Each plugin has its own global scope, so their variables do not interfere with each other. To share data or call functions between plugins, use mechanisms such as remote calls with `ll.exports` / `ll.imports` (provided by LegacyRemoteCall).

## How do I check which version of LegacyScriptEngine (LSE) is installed?

In the console, run `ll show <mod name>` (for example `ll show legacy-script-engine-quickjs`; the engine package names by language are `legacy-script-engine-quickjs` / `-lua` / `-nodejs` / `-python`) to see the mod's information and version. You can also run `ll list` to list all loaded mods and their versions.

*Applies to: LeviLamina 0.13 or later*

## How do I add support for a new scripting language (such as PHP) to LSE?

LSE's scripting language support comes from the underlying ScriptX. To add a language, ScriptX first needs a backend for it, and then a matching engine variant has to be added to LSE; it cannot simply be added directly in LSE. LSE currently provides four engines: `lua`, `quickjs`, `nodejs` and `python`.

## I suspect a backdoor plugin ran commands on my server, but the console shows no command record. How do I investigate?

LSE's `mc.runcmdEx` (and `mc.runcmd`) run commands as the server, and the output is captured and returned to the script instead of being printed to the console, so it is normal that the console shows no record. Check the plugin list, and search the plugin sources for keywords such as `runcmdEx`, `runcmd` and `setInterval` to find suspicious scripts.

## I am a beginner and want to write a plugin loaded by LeviLamina. Where do I start? Do I need to download the LeviLamina source?

You do not need to modify the LeviLamina source. Beginners should start with a LegacyScriptEngine (LSE) script plugin:

- Project: <https://github.com/LiteLDev/LegacyScriptEngine>
- Documentation: <https://levimc.org/LegacyScriptEngine/>
- Getting-started tutorial, "Write your first script plugin": <https://levimc.org/tutorials/develop/first-script-plugin/>

Before writing code, set up the API type hints: run `npm install -D @levimc-lse/types` in the project and add `"@levimc-lse/types"` to `compilerOptions.types` in `tsconfig.json` (or write `/// <reference types="@levimc-lse/types" />` in the entry file). This also avoids absolute-path conflicts when several people collaborate.

To write a native mod, you need to learn C++ and set up a VS/xmake environment (see the LeviLamina documentation and levilamina-mod-template).

## The new LSE creates a `plugins` shortcut (directory link) every time the server starts, and recreates it after I delete it. What is it? What if it turns into an ordinary folder or a broken link after I copy the server to another machine?

This is expected behavior: most LSE plugins hard-code the `plugins` path, so since LSE 0.23.0 LSE creates a directory link (a junction on Windows) pointing to `mods/` at server start to stay compatible.

The directory link uses an absolute path, so copying the whole server folder to another machine breaks it. Delete it and let LSE regenerate it automatically. Note that if an ordinary file or folder with the same name already exists at the `plugins` location and does not point to `mods`, LSE reports an error and does not overwrite it.

*Applies to: LSE 0.23.0 or later (LeviLamina 26.60)*

## Is there a plugin that can run LSE (LegacyScriptEngine) plugins on Endstone?

No. LSE is a LeviLamina mod (native type) that depends on LeviLamina and prerequisites such as LegacyMoney, LegacyRemoteCall and iListenAttentively, so it can only run on LeviLamina (install it with lip on a server, or with LeviLauncher on the client). Claims found online or from AI, such as "Element Zero is compatible with LSE", are not reliable.

*Applies to: all current versions (LSE 0.23.x / LeviLamina 26.60.x)*

## Player death messages on my server read "被蓄意的游戏设计杀死" (Intentional Game Design) or similar. Is it a hack? What causes it?

It is usually not a hack. In vanilla, "Intentional Game Design" is the death message for dying from a bed or respawn anchor explosion. An unusual death message can also appear when a plugin deals damage through LSE interfaces such as `en.hurt(damage[,type[,source]])` without specifying a damage source. Check whether anyone is using beds or respawn anchors in the Nether/End, and which plugin is damaging players.

The text of death messages depends on vanilla BDS behavior.

*Applies to: LSE current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Do I have to install Node.js / the `nodejs` engine to write JS plugins with LSE?

No. Ordinary JS plugins run on the QuickJS engine (`lip install github.com/LiteLDev/LegacyScriptEngine#quickjs`; without a variant, both the QuickJS and Lua engines are installed by default). A single `.js` file placed directly is recognized as a quickjs plugin, and after migration the `type` in `manifest.json` is `lse-quickjs`.

You only need to install the `#nodejs` engine when you need the Node.js API or npm packages; in that case the manifest `type` is `lse-nodejs`.

*Applies to: LSE current version (0.23.x)*

## When writing an LSE (LLSE) JS plugin, the comment at the top of the file that references type definitions (`/// <reference ...>`) shows a red squiggle in the editor. Do I need to fix it? Does it affect the plugin?

It does not affect execution. That line is a triple-slash comment that only gives the editor type information and code completion; the red squiggle just means the matching type definition cannot be found.

To get completion, install `@levimc-lse/types` as described in legacy-script-engine-api, then write `/// <reference types="@levimc-lse/types" />` in the entry file or add it to `compilerOptions.types` in `tsconfig.json`. If you do not need it, you can ignore it.

If the plugin keeps reporting errors in the backend at runtime, that comment is not the cause. Check other causes (such as a malformed JSON config file, or a missing or damaged prerequisite plugin, which you can reinstall).

## Can I hook game functions from a script plugin with LSE (such as NativeCall/NativeAPI)?

No, and it is not recommended. LSE's NativeAPI was removed completely in 0.8.19, so script plugins cannot hook game functions. If you need hooks, write a LeviLamina mod directly in C++ (you can start from levilamina-mod-template).

*Applies to: LSE 0.8.19 or later (current 0.23.x)*

## Developing native LeviLamina mods in C++ has too high a barrier. Is there an easier way to develop?

Yes. You can use LegacyScriptEngine (LSE) to develop plugins in JavaScript (QuickJS/Node.js), Lua or Python, which is relatively easy, and they run on both servers and the Windows client.

- Documentation: <https://levimc.org/LegacyScriptEngine/>
- Getting-started tutorial: <https://levimc.org/tutorials/develop/first-script-plugin/>
- Type hints and scaffolding: <https://github.com/LiteLDev/legacy-script-engine-api>

## Why does the server crash on shutdown after hot-unloading a script plugin that registered commands in LSE?

The vanilla command system does not support unregistering commands. After the plugin is unloaded, its commands remain in the command registry, but the plugin that owns the callback no longer exists. The current LSE prints the warning `Command xxx failed to execute, is the plugin unloaded?` when such a command is executed and no longer runs the callback. Even so, you should not hot-unload or reload plugins that registered commands; restarting the server to update them is safer.

*Applies to: LeviLamina + LSE, all current versions (whether the shutdown crash still occurs is unconfirmed). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Where is the API documentation for writing plugins in JS/Lua and other scripting languages on LeviLamina (LegacyScriptEngine, formerly LLSE)? Why can't I find it in the main LeviLamina documentation? What if the old LiteLoaderBDS / lse.liteldev.com / lse.levimc.org docs do not open?

Script plugins are provided by LegacyScriptEngine (LSE), which is just a mod for LeviLamina, so the main LeviLamina documentation covers only C++ mod development; the script API documentation is in LSE's own documentation. The current address is <https://levimc.org/LegacyScriptEngine/>, and the API index is at <https://levimc.org/LegacyScriptEngine/apis/> (for example Logger: `/LegacyScriptEngine/apis/ScriptAPI/Logger/`, events: `/apis/EventAPI/Listen/`). To get started, see the official tutorial "Write your first script plugin": <https://levimc.org/tutorials/develop/first-script-plugin/>.

`docs.litebds.com`, `lse.liteldev.com`, `legacy-script-engine.levimc.org`, `lse.levimc.org` and `docs.levimc.org/LegacyScriptEngine`, which were used in the past, are all old addresses; use the ones on levimc.org. The old LiteLoaderBDS documentation is archived at <https://liteldev.github.io/liteloaderbds-documentation/> for reference only.

The new JS API is largely the same as the old LLSE, but in many online tutorials from the LL v2 era some steps are no longer needed: plugin information is now declared in `manifest.json` in the plugin directory (`ll.registerPlugin()` can still be called but is no longer required). A simple example:

```js
mc.listen("onJoin", (player) => {
    log(`${player.name}已经加入服务器。`);
    player.sendToast('欢迎！', '感谢您游玩本服！');
});
```

*Applies to: LSE all current versions*

## After `ll reload`, an LSE plugin's commands stop working or keep raising errors (such as command registration failures). What should I do?

Commands registered as fake commands (the old interfaces such as `mc.regPlayerCmd` / `mc.regConsoleCmd`) are registered only once, when the server finishes starting (`onServerStarted`); calling these interfaces again after a plugin reload does not register them again, so the commands stop working. The documentation no longer recommends fake commands; use real commands with `mc.newCommand` instead: on reload, if the command already exists, you only get the message `Runtime command ... already exists`, `setOverload` / `setCallback` are applied again, and the command keeps working. Hot loading/unloading exists for debugging and carries risks and performance issues; in production, restarting the server is more reliable when problems occur.

*Applies to: LeviLamina current version; LegacyScriptEngine current version*

## Does LSE have documentation in Markdown format (for example, to feed to an AI)?

Yes. The LSE documentation site is generated from Markdown sources, located in the `docs/LegacyScriptEngine/content` directory of the GitHub repository LiteLDev/liteldev.github.io (Chinese files are `*.zh.md`, English files are `*.md`, and the API documentation is in the `apis/` subdirectory). The LiteLDev/legacy-script-engine-api repository also provides API type hints for plugin development and can serve as a reference.

## The LSE Python engine plugins keep raising errors. Is there an alternative?

The developers recommend using LeviStone instead of the LSE Python engine (`LegacyScriptEngine#python`). It is a runtime for running Endstone plugins on LeviLamina and lets you use the Python ecosystem. To install it, run `pip install levistone --target mods/EndstoneRuntime` in the BDS directory where LeviLamina is installed (for versions before 0.11.15 the target directory is `plugins/EndstoneRuntime`).

*Applies to: LeviLamina current version; LeviStone 0.11.15 and later*

## After upgrading the server, the owner of a claim shows as "?" in the iLand land-claim plugin. What should I do?

This happens because the LeviLamina player information data (PlayerInfo, used to look up xuid and player name from each other) was not copied over when you upgraded (moved to a new server directory). Copy the `mods/LeviLamina/data/playerinfo` directory from the old server to the new server, or wait for the players to come online again and it updates automatically. This affects plugins that depend on interfaces such as `data.xuid2name`.

*Applies to: LeviLamina current version; LegacyScriptEngine current version*

## Is it a problem to set a very large value such as `99999999999` as the time for `setTimeout`/`setInterval` in an LSE JS plugin?

Yes. LSE converts the timer time as a 32-bit signed integer (`toInt32`); a value above `2147483647` overflows into a different value, and if it becomes ≤0 it is treated as 1 millisecond and runs immediately. Unless you know exactly what will happen, keep integer arguments passed to LSE APIs below `2147483648` (2^31).

*Applies to: LegacyScriptEngine current version*

## Is there a plugin to show the server's live map on a web page?

This kind of feature is provided by web-map plugins. Search MineBBS for keywords such as "satellite map" and pick a plugin that supports your current LeviLamina/BDS version. For third-party plugins, check yourself whether they support the current version.

*Applies to: current version (third-party plugin). Not confirmed against the source code or the documentation: treat it as a pointer.*
