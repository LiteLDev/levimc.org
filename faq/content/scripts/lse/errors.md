# LegacyScriptEngine: errors and crashes

## Running a Lua plugin such as iLand (`iland-core.lua`) on LegacyScriptEngine (Lua engine) fails to load with `module 'dkjson' not found` / missing `dkjson.lua`. How do I fix it?

`dkjson` is a third-party dependency library bundled with Lua plugins such as iLand. It has nothing to do with LeviLamina or PreLoader. To fix it:

1. Download the complete plugin package from the plugin's original release page and put the dependencies from its `lib` directory (such as `dkjson.lua`) into the `lib` folder under the mod root directory, that is, `mods/lib/dkjson.lua`. Since LSE 0.23.0, a directory link from `plugins` to `mods` is created at startup, so putting it in `plugins/lib/` has the same effect. LSE's `BaseLib.lua` adds `<mod root directory>/lib/?.lua` to Lua's `package.path`, so the plugin can simply `require "dkjson"`. You can also put the file in any of the other search paths listed in the error message.
2. Put the main script (such as `iland-core.lua`) directly into `plugins/` (that is, `mods/`). After the server starts, LSE automatically migrates it into a folder of the same name and generates `manifest.json`, so you do not need to write a manifest by hand. After the migration you must restart the server before the plugin loads.
3. Make sure the Lua engine is installed and loaded: run `ll list` in the console to check for `legacy-script-engine-lua`, and `ll show <mod name>` for details. If it is not installed, install it with `lip install LegacyScriptEngine#lua`.
4. Check for duplicate plugin files (for example two copies of `iland_core.lua`) and whether errors from other plugins in the same directory interfere. Use a fixed version of iLand, and avoid Chinese characters in the server path.

*Applies to: LeviLamina + LegacyScriptEngine Lua engine, all current versions; the `plugins` link to `mods` since LSE 0.23.0*

## An old LLSE plugin fails at `ll.registerPlugin` when loaded on LSE 0.9 or later (it worked on older versions). What should I do?

Before LSE 0.9, `registerPlugin` was not actually implemented (it just returned), so any arguments were accepted without errors. Since 0.9.0 it processes and type-checks its arguments: the 1st argument (name) and the 2nd argument (description) must be strings; the 3rd argument (version) must be an array `[major, minor, patch, status?]` or an object `{major, minor, revision, status}`; the 4th argument `otherInformation` must be an object containing only "string: string" key-value pairs. A common mistake is passing `null` as the 4th argument; change it to `{}`. A simpler approach is to delete or comment out the `ll.registerPlugin` call and put the plugin information in `manifest.json` (the call is deprecated in LSE and not required). Also: a defect in the `registerPlugin` implementation in LSE 0.9.0 caused errors or even crashes in some plugins; it was fixed in 0.9.1, so you will not run into it on current versions.

*Applies to: LSE 0.9.1 and later (current 0.23.1)*

## After manually installing LSE or a script plugin, startup reports missing dependencies (such as `legacy-script-engine-quickjs`, `LegacyMoney`, `LegacyRemoteCall`) and the plugin does not load. Which components do I need to install?

1. Missing `legacy-script-engine-quickjs` (or `-lua`/`-nodejs`/`-python`): the plugin depends on that LSE engine but it is not installed. Install it with `lip install LegacyScriptEngine#quickjs` (substitute the variant you need), or download the matching zip from <https://github.com/LiteLDev/LegacyScriptEngine/releases> and install it manually.
2. Missing `LegacyMoney` / `LegacyRemoteCall` / `iListenAttentively`: these are standalone mods that the LSE engine itself depends on. They are not included in the LSE package, so with a manual installation you must download the version matching your LSE from the corresponding repository's Releases under the LiteLDev organization (for example, LSE 0.23.x matches LegacyRemoteCall 0.23.x, LegacyMoney 0.23.x and iListenAttentively 0.18.x). Installing LSE with lip installs these dependencies automatically, which is the easiest way. LegacyParticleAPI is no longer needed since LSE 0.15.0. If the plugin also depends on other prerequisites (such as third-party libraries like GMLIB), install those too.
3. Wrong directory structure: put the mod folder from the archive (such as `legacy-script-engine-quickjs/`) directly into `mods/`. Do not add an extra outer folder, or it will not be recognized.

*Applies to: LSE 0.21.2 and later (including the iListenAttentively dependency); current latest LSE 0.23.1*

## After upgrading LSE to 0.17.11 or later (such as 0.17.13), or after reloading plugins, the commands of many or even all LSE plugins become "unknown command" and forms do not open, while other plugin features work normally. Downgrading to 0.17.10 fixes it. What is the cause and how do I fix it?

Cause: LSE 0.17.11 replaced the event-based "fake commands" (CommandCompatibleAPI) with commands that are actually registered in the command system (LegacyCommandAPI), in order to be compatible with LeviStone. From then on, plugins can no longer override existing commands. If a command registered by an LSE plugin has the same name as another plugin's command or an existing command (for example the same name as LegacyMoney's `/money`), or if a command enum name (`cmd.setEnum`) duplicates another plugin's, a registration conflict occurs and the commands of many plugins stop working. On duplicate registration, the console also prints `Runtime command xxx already exists`.

Troubleshooting: remove plugins one by one to find the one that conflicts.

Fix: change the command name or enum name registered in the conflicting plugin's source (look for `mc.regPlayerCmd` / `mc.newCommand` / `cmd.setEnum`, for example change `/money` to `/moneys`). If the conflict is with LegacyMoney, you can also set `enable_commands` to `false` in LegacyMoney's config to turn off its built-in commands.

*Applies to: LSE 0.17.11 and later (including current 0.23.x)*

## After installing certain LSE plugins, plugin commands report `no permission` or do not work, and even all commands stop working; running `stop` in the console also says "unknown command" and the server cannot be shut down. What is the cause?

To be compatible with LeviStone, LSE has turned the former "fake commands" into actually registered commands since 0.17.11. If a plugin registers a command that does not follow vanilla command rules, it can break the whole command system, so even vanilla commands (including `stop`) stop working. Common non-compliant patterns: trying to override a vanilla command (for example registering a command named `stop`); command names containing uppercase letters or non-English characters; invalid command names or parameters.

Fix: remove plugins one by one to find the plugin that registers the non-compliant command, then rename its command to a lowercase, valid name that does not conflict with vanilla or other plugins, or ask the plugin author to fix it.

*Applies to: LSE 0.17.11 and later (including current 0.23.x)*

## A LeviLamina server crashes whenever a creeper explodes (a trace log is generated). What could be the cause?

This is usually caused by a JS-based anti-explosion LSE plugin (such as anticreeper). Many of these plugins intercept the explosion in the explosion event callback (`onExplode`/`onEntityExplode`) and then create a new explosion with `mc.explode`, which easily crashes the server on newer LSE versions. Fix: uninstall or replace the anti-explosion plugin, or ask the author not to create an explosion inside the explosion callback. Creeper explosion protection can also be done by modifying a behavior pack, with no LSE plugin needed.

*Applies to: LeviLamina + LSE (third-party anti-explosion plugins). Not confirmed against the source code or the documentation: treat it as a pointer.*

## An old LLSE JS plugin from around 2022 (such as `lljs-ban`) errors out and cannot run on a new LSE version. What is the cause, and can it be fixed?

The new script engine (QuickJS backend) loads JS plugin entry files as ES Modules first, and module code is always in strict mode (it falls back to evaluating as a plain script only if the top level of the entry throws an exception). Many old plugins do not account for strict mode and assign to and use variables without declaring them, which causes errors such as `xxx is not defined` in runtime code like event and command callbacks. If you know JS, add `let`/`const`/`var` declarations for the undeclared variables and the plugin keeps working. Otherwise, switch to a similar plugin that is still maintained.

*Applies to: LegacyScriptEngine (QuickJS backend), current version*

## The BDS server crashes, the trace log shows a suspected infinite loop/stack overflow related to an inventory plugin. What is the cause?

Usually an LSE plugin modifies inventory items inside an `onInventoryChange` event callback. Modifying items triggers `onInventoryChange` again, which creates recursion/an infinite loop and crashes with a stack overflow. Find and change the plugin that modifies inventory items in the `onInventoryChange` callback (for example, add a re-entrancy guard flag, or defer the modification with `setTimeout` and avoid triggering it repeatedly).

*Applies to: LegacyScriptEngine, current version*

## An old LL1-era JS plugin (such as an online-time tracker with `/onlinetime rank`) fails on LSE with `i is not defined`, and the leaderboard does not open. How do I fix it?

The new script engine loads JS as an ES Module (strict mode), so using a variable that has not been declared causes an error. Open the plugin file at the line number from the error, change `for (i = 0; ...)` to `for (let i = 0; ...)`, and check that all other loop variables and variables in the whole file are declared with `let`/`const`/`var`.

*Applies to: LegacyScriptEngine (QuickJS backend), current version*

## In an LSE JS plugin, the code after `const db = new KVDatabase('plugins/mydb/db');` never runs, and `try/catch` gives `ReferenceError: can't create class KVDatabase`. Is this a bug?

`can't create class KVDatabase` means the underlying LevelDB database failed to open when `KVDatabase` was constructed (the constructor returned empty). Common causes: the server is in a directory that needs administrator permission to write (such as Program Files), so the database directory cannot be created or written (see LegacyScriptEngine#228); or the database at the same path is already in use by another plugin/instance. Move the server to a directory writable by a normal user, and check the path and whether it is in use. An uncaught exception thrown at the top level of a script prevents the following code from running; you can catch it with `try/catch` to see the error. Since LSE 0.10.2, errors during plugin loading are shown in the console (#240).

*Applies to: All current LSE versions (load errors are shown since 0.10.2)*

## In LSE NodeJS, errors thrown with `throw` inside an `async` function are not shown in the console, unlike normal Node.js. What should I do?

In the LSE NodeJS embedded environment, the output for unhandled Promise rejections may differ from standalone Node.js. Handle errors yourself where you call the `async` function with `try/catch` (`await`) or `.catch()`, and print them with `logger.error`.

*Applies to: LSE NodeJS engine. Not confirmed against the source code or the documentation: treat it as a pointer.*

## After updating npm to the latest version under the LSE NodeJS engine, npm-related features stop working. What should I do?

LSE's `npm`/`npx` console commands run `node_modules/npm/bin/npm-cli.js` (`npx-cli.js`) in the engine directory directly inside the embedded Node environment. If you upgrade npm to a version that is not compatible with the embedded Node version, they stop working. Use the npm that ships with LSE (or a compatible older version). An alternative is to run npm with an external `node.exe`.

*Applies to: LSE NodeJS engine. Not confirmed against the source code or the documentation: treat it as a pointer.*

## After writing infinite recursion or heavy memory use in an LSE nodejs plugin, a crash error appears. Is this a Script API problem or an LSE problem?

This is a Node.js (V8) error indicating a V8 stack overflow or out-of-memory condition. It comes from LSE's nodejs engine, not from BDS's Script API. Also, infinite recursion in the quickjs engine may crash BDS directly. Check the plugin for infinite recursion or logic that uses too much memory.

*Applies to: LSE nodejs / quickjs engine. Not confirmed against the source code or the documentation: treat it as a pointer.*

## An LSE quickjs plugin reports `C++ Exception: script::Exception ... not a function ... In callback for sendForm`. What is the cause?

It means something called inside the form callback is not a function (the function does not exist or the object is null). This is a problem in the plugin code, so check the plugin code. It is common when a command registered by a menu plugin is run through `runcmd` or the console: for example, `en.toPlayer()` in the callback returns something that is not a player object (it returns null for non-player entities), and later calls to player methods then fail. Change it to get the player object with `mc.getPlayer(en.name)` and check for null first.

## LSE reports `ERROR [legacy-script-engine-quickjs] failed to load: Failed to migrate legacy plugin at plugins/XXX.js: plugins/XXX already exists` at startup. How do I fix it?

At startup, LSE migrates single-file legacy plugins (such as `XXX.js`) in the root of `plugins/` (a link to `mods/` since 0.23.0) to `mods/XXX/XXX.js` and generates `manifest.json`. If the target `mods/XXX/XXX.js` already exists (the plugin was migrated before and you added another single file with the same name), the migration fails with this error. To fix it: delete the duplicate `XXX.js` in the root directory; if you want to replace the plugin with the new file, first delete or empty the old `mods/XXX` directory, then restart the server. After the migration you must restart once more before the plugin loads.

*Applies to: LSE 0.x up to current (0.23.x); since 0.23.0, `plugins/` is a link to `mods/`*

## LSE reports an error when loading an old plugin, saying the event `onEnderDragonDestroy` does not exist (`Event "onEnderDragonDestroy" No Found!` in older versions, `Event onEnderDragonDestroy not found!` in newer ones). What should I do?

LSE has removed the `onEnderDragonDestroy` event, and the plugin author has not updated the plugin. The error only means that listener has no effect; it does not affect other features and can be ignored. If the error bothers you, comment out the `mc.listen("onEnderDragonDestroy", ...)` block in the plugin code that listens to this event.

*Applies to: LSE 0.6.x up to current (0.23.x)*

## The LSE console shows `WARN [legacy-script-engine-quickjs] Could not find menu in registered commands.` What is the cause?

This warning comes from LSE's command execution callback. When a command is executed, LSE enters the engine of the plugin that last called `setCallback` for that command, then looks up the command's parameter registration information in that plugin's own `registeredCommands` (recorded through calls such as `mandatory`/`optional`/`setEnum`/`overload`). If it is not found, it prints `Could not find menu in registered commands.` and the command does not run. The usual thing to check is a command conflict, for example two plugins both registering `menu` (the console usually shows a `Runtime command menu already exists...` warning at registration), or a plugin that only calls `setCallback` on the command without registering parameters/overloads. Check for and remove plugins that register the same command twice, or make sure the plugin calls registration functions such as `overload` before `setCallback`.

*Applies to: All current LSE versions (up to 0.23.x). Not confirmed against the source code or the documentation: treat it as a pointer.*

## In a sidebar set by an LSE plugin with `pl.setSidebar`, player IDs/names appear instead of the configured content. How do I fix it?

One possible cause is a scoreboard ID conflict: when LSE's `setSidebar` sends a `SetScorePacket`, it uses each line's score value directly as `mScoreboardId`, which may collide with real scoreboard entries already on the client (for example a player's score ID), so a player name is displayed. You can try deleting all scoreboards in the world, or changing the score values of the lines, to verify. If this is confirmed to be the problem, you can file an issue with LSE.

*Applies to: Current LSE versions (up to 0.23.x). Not confirmed against the source code or the documentation: treat it as a pointer.*

## After hot-reloading an LSE plugin (such as with `ll reload`), database queries and inserts work, but updates and deletes do not. What should I do?

Reloading LSE plugins with hot reload is not recommended; after a hot reload, the state of resources the plugin holds, such as the database connection (`DBSession`), may be abnormal. Simply restart the server.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## An LSE server crashes during NBT-related operations such as a player respawning (the crash involves CompoundTag/NBT). What is the cause?

LSE's `NbtCompound` either holds a `CompoundTag` with a `unique_ptr` (owning it) or holds only a raw pointer (borrowing it). If a tag is exported to another plugin through RemoteCall and that plugin destroys it or transfers its ownership, LSE crashes when it accesses the tag again, so external plugins should not destroy any object exported by LSE. In a real case, the old plugin `StillHungry.lls` (which keeps the hunger value after a player dies by modifying NBT directly) triggered the crash on respawn; uninstalling that plugin fixed it. If you rewrite it yourself, note that hunger and saturation are two different attributes.

*Applies to: LeviLamina + LSE, current version*

## An LSE QuickJS plugin reports an error when using `import` syntax (a syntax error such as `Failed to load plugin xxx: expecting '('`), while the plugin path and code look fine. What could be the cause?

It is known that Chinese characters in the BDS (server) path break `import` in the QuickJS engine (`legacy-script-engine-quickjs`). Put BDS and the plugins in a pure English path. Whatever the cause, it is recommended to keep Chinese characters out of the server and plugin paths.

*Applies to: LegacyScriptEngine QuickJS engine, all current versions (the related issue is still open)*

## Using `node-fetch` in an LSE Node.js plugin reports `fetch` is undefined / import failed, although the same code runs fine directly with node. What should I do?

`node-fetch` 3.x provides only ES Modules, so using `require` in a CommonJS plugin fails. Options:

1. Change the dependency to `node-fetch ^2.6.7` (the CommonJS version).
2. Add `"type": "module"` to the plugin's `package.json` so the plugin loads as ESM, then import `node-fetch` 3.x with `import` (Node.js ESM plugins are supported since LSE 0.10.6).
3. LSE now bundles Node.js v22.12.0, so you can use the global `fetch` directly, or the built-in `http`/`https` modules.
4. Use LSE's own network API such as `network.httpGet`.

Also, if `dependencies` are declared in the plugin directory's `package.json` and the plugin directory has no `node_modules`, LSE automatically runs `npm install --omit=dev` to install the dependencies when loading the plugin.

*Applies to: LegacyScriptEngine Node.js engine; the ESM option needs LSE 0.10.6 or later*

## An LSE Node.js plugin fails to load (failed to read JSON / missing `libnode.dll` / npm execution failed, etc.). How do I troubleshoot?

If the error is a failure to read a JSON file, a JSON file such as `package.json` in some Node.js plugin directory is usually malformed, so check the JSON files of the nodejs plugins one by one. If it reports a missing `libnode.dll`, the Node.js runtime is not fully installed: `libnode.dll` and related files should be in the `mods/legacy-script-engine-nodejs/` directory. It is best to install the Node.js engine with lip (`lip install github.com/LiteLDev/LegacyScriptEngine#nodejs`); lip downloads both the engine itself and the `node-prebuilt` runtime, so the files are complete. If there are still problems, the server files themselves may be corrupted; set up a clean new server and reinstall.

*Applies to: LegacyScriptEngine Node.js engine, LeviLamina 1.x (`mods` directory) and later*

## After LSE was updated for LeviLamina 26.60, a script plugin that calls `logger.setConsole` crashes the server, and the `latest` log has no time to be written. What should I do?

This is a bug in the `logger.setConsole` implementation in LSE 0.23.0 (passing 0 to a parameter that needs a `string_view` causes a null-pointer crash). It was fixed in LSE 0.23.1; upgrade to 0.23.1 or later. If you cannot upgrade for now, search the plugin directory and comment out all `setConsole` calls. The `latest` log is empty at the time of the crash because the crash happens too early for the log to be written. Also note: `logger.setTitle` fetches/creates a new logger, so call `setTitle` first, and then `setConsole`/`setFile`/`setPlayer`/`setLogLevel`; otherwise the earlier settings are lost.

*Applies to: LegacyScriptEngine 0.23.0 (crash); the `setTitle` call-order note applies to the current version*

## An LSE JS plugin crashes the server (a minidump/trace log is generated), and it was eventually traced to command registration. What is the cause?

The plugin used uppercase letters in a command name when registering a command (`mc.newCommand` and so on). When LSE registers commands, the command name (and the command content, other than variable parameters such as `String`, `RawText` and `Message`) may use only lowercase English letters. Change it to all lowercase.

*Applies to: LegacyScriptEngine, all current versions*

## An LSE (QuickJS) plugin causes a crash but the logs have no useful information. How do I debug and locate it?

LSE's release archive already includes the pdb debug symbols of each engine (such as `legacy-script-engine-quickjs.pdb`); after installation they sit together with the dll in the `mods/legacy-script-engine-quickjs/` directory. Make sure the pdb matches the dll version in use (if not, download the archive of the matching version from <https://github.com/LiteLDev/LegacyScriptEngine/releases> and extract the pdb). Then attach the Visual Studio debugger to the `bedrock_server.exe` process and reproduce the crash to see a call stack with symbols. In the example case, the cause was finally traced to a `CompoundTag` (NBT) object being destroyed prematurely, related to an NBT object passed in through LegacyRemoteCall.

*Applies to: LegacyScriptEngine, current version (pdb files are distributed in the release archive)*

## A LeviLamina + LSE server starts fine, but crashes as soon as a player joins. Where is the crash log? Could a multi-dimension plugin installed earlier have an effect?

The crash logs are in `logs/crash` in the server directory: `minidump_<time>.dmp` and `trace_<time>.log`. Send both when asking for help. The analysis in this case: a multi-dimension (custom dimension) plugin had been installed before and the world still contained custom-dimension data. After the plugin was uninstalled, the dimension the player was in when they logged off no longer existed, so the server crashed when the player joined. Reinstalling the multi-dimension plugin fixes it (or have players leave the custom dimension before you uninstall the plugin).

*Applies to: LeviLamina, current version; the multi-dimension part applies to worlds that used custom-dimension plugins such as MoreDimensions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## A LeviLamina + LSE server crashes as soon as it starts (removing other mods does not help). What could be the cause?

A common cause is LSE's Python engine (`legacy-script-engine-python`): when another Python is installed on the system (and is in `PATH`), the Python engine may fail to load, print a long list of errors, or even crash the server directly. If you do not use Python plugins, uninstall the Python engine (delete the `mods/legacy-script-engine-python` directory, or uninstall the `LegacyScriptEngine#python` variant with lip). If you need Python plugins, make sure the system Python version matches the engine's bundled version (currently 3.12.10) or remove it from `PATH`. When troubleshooting, check the trace log in `logs/crash` to confirm the crash point.

*Applies to: LeviLamina servers with the LSE Python engine installed (all current versions; whether it conflicts depends on the user's environment). Not confirmed against the source code or the documentation: treat it as a pointer.*

## A LeviLamina server crashes randomly every hour or two, and the crash log is different every time. Some stacks point to LeviLamina's level tick event hook (`ll::event::world::LevelTickEventHook::detour` in older versions), and the crashes continue after removing plugins and switching to a new world. How do I troubleshoot?

In the real case, an old JS auto-backup plugin was the cause: while the server was running, it read the world directory directly and called 7z to compress it, causing a null-pointer crash (so the stack looked like the problem was in the tick event, and the error differed every time). Switching to a backup plugin such as BackupHelper that uses BDS's normal backup flow (`save hold`/`query`/`resume`) fixed it. Rule of thumb: do not copy or compress the world directly while the server is running; for scheduled tasks, use a plugin rather than command blocks.

*Applies to: LeviLamina 1.x and later, servers using third-party backup plugins that copy the world directly while running. Not confirmed against the source code or the documentation: treat it as a pointer.*

## A LeviLamina server crashes, and CrashLogger's trace log shows the crash in LSE's `data.toJson` (heap corruption). How do I troubleshoot?

A crash at an LSE `data.toJson` call together with heap corruption means some script plugin passed abnormal data to `data.toJson`. Search the plugin directory globally for `data.toJson` to find the plugins that call it, disable or fix them, and see whether the crash still happens. When asking for help, attach `trace_*.log` and the minidump from `logs/crash`.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## A LeviLamina server crashes while running. Where are the crash files? If the trace log shows an infinite loop/stack overflow related to a JS plugin listening to `onExperienceAdd`, how do I troubleshoot?

The crash files are in `./logs/crash` in the server directory: `minidump_*.dmp` and `trace_*.log`. Send both when asking for help. In this case the trace showed an infinite loop: a JS plugin listened to the `onExperienceAdd` event and, in the callback, gave the player experience again (such as `player.addExperience`), which triggered the event again, causing infinite recursion and a stack overflow crash. To troubleshoot, use an editor such as VSCode to search the contents of files (not file names) in the plugin directory (`plugins/`, that is, `mods/`) for "onExperienceAdd", and find the plugin that listens to this event (in this case a VIP double-experience script). Uninstall it or fix its logic (avoid triggering the same event again inside the callback, for example with a re-entrancy guard, or modify/intercept the original event instead).

*Applies to: All current versions (LeviLamina + CrashLogger + LSE)*

## A LeviLamina server (such as on Windows Server, or when started from a bot program) crashes immediately or frequently at startup although the VC++ runtime is installed. Which log should I check and how do I troubleshoot?

When asking for help, provide `trace_xxx.log` (and `minidump_xxx.dmp`) from `logs\crash\`, not `LeviLamina-latest.log`. A fairly common cause of this kind of startup crash is a conflict between LSE's Python engine (`legacy-script-engine-python`) and the Python environment installed on the system. If you have no Python plugins, delete the `legacy-script-engine-python` folder in the `mods` directory (or uninstall the `LegacyScriptEngine#python` variant with lip). If you need Python plugins, make the system Python match the engine version (3.12.10) or take it out of `PATH`; do one or the other.

*Applies to: LeviLamina + CrashLogger, servers with the LSE Python engine installed (all current versions). Not confirmed against the source code or the documentation: treat it as a pointer.*

## With the same version of LegacyScriptEngine (LSE), why do some plugins load successfully and others fail?

LSE is split into multiple engines by language, and each must be checked separately:

1. The Node.js engine must be installed with lip (`lip install github.com/LiteLDev/LegacyScriptEngine#nodejs`); lip also downloads the Node prebuilt runtime. If lip cannot be used, download the matching `node-prebuilt.zip` (currently v22.12.0) manually from <https://github.com/LiteLDev/node/releases>, extract it, and put the contents into the `mods/legacy-script-engine-nodejs/` directory.
2. The Python engine needs the matching version of Python installed on the system (Python 3.12.10 for LSE >=0.16.2).
3. If it reports a missing symbol (`missing symbol`), the LeviLamina version does not match LSE; install the LeviLamina version that LSE requires (LSE 0.23.x requires LeviLamina 26.60.*).

*Applies to: LSE 0.16.2 and later (current 0.23.x)*

## After installing LeviLamina and LSE, the console shows a pile of errors on startup and then the window disappears. What should I do?

A user found that LSE's Python engine (`legacy-script-engine-python`) was the cause; after deleting it, the server started normally. The Python engine depends on the matching version of Python installed on the system (current LSE requires Python 3.12.10), and a wrong environment can make startup fail. If you do not need Python plugins, you can simply uninstall the engine (delete `mods/legacy-script-engine-python` or uninstall it with lip).

*Applies to: Servers with the LSE Python engine installed. Not confirmed against the source code or the documentation: treat it as a pointer.*

## The crash log shows an error inside BDS while reading an `ItemStack` (the `ItemStack` seems to have been freed early). Could an LSE JS plugin cause it?

Generally no. The `ItemStack` behind an item object (`Item`) in an LSE script is managed by LSE itself or BDS, and a script cannot free it directly. For this kind of `ItemStack` lifetime problem, check native (C++) mods first.

*Applies to: LeviLamina + LSE, current version (based on experience). Not confirmed against the source code or the documentation: treat it as a pointer.*

## LSE reports `Fail to import! Function [LLSEGlobal::LoginAPI] has not been exported!` when the server starts. What causes this?

A script plugin imports a function exported by another plugin through remote calls (`ll.imports("LLSEGlobal", "LoginAPI")`), but the prerequisite plugin that exports it (here, a login plugin) is not installed or failed to load. The load order can also cause this: the import runs before the function is exported.

Search the `plugins` directory for the string `LoginAPI` to find which plugin imports or exports it, then install or fix the prerequisite plugin it depends on.

## A JSON parse error related to `config.reload()` appears at server startup, but it doesn't say which LSE plugin is responsible. How do I find it?

Usually a plugin's JSON config file is empty or corrupted, so `reload()` of `JsonConfigFile` (which reads the file with a JSON parser internally) fails to parse it and throws an exception.

Write a script that scans all `.json` files under the `plugins` directory and finds the ones that fail to parse (pay special attention to empty files of size 0). Fix or delete the corresponding configs (back up data files first), then restart.

## When the LeviLamina server runs from a drive root, writing files with a `./` relative path from an LSE plugin fails. Why?

Ordinary users have no write permission in a drive root (especially the system drive `C:\`), so the write fails. Run the server from a normal folder instead.

*Applies to: Windows, current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## As soon as a player joins, the server floods the console with "该指令引用了0x%P的内存,该内存不能为%s" (The instruction referenced memory at 0x%P; the memory could not be %s) and crashes after a while. How do I fix it?

This is an out-of-bounds memory access (access violation). There are many possible causes: a mod that does not match the current version, incompatible mods, a missing prerequisite, a bug in a mod itself, a Mojang bug, and so on. In one case, LegacyScriptEngine was too old, and updating to the LSE version matching the current BDS/LeviLamina fixed it.

To troubleshoot:

1. Confirm that the BDS version matches the LeviLamina/LSE/mod versions.
2. Use bisection: remove the mods/script plugins under the `plugins` directory one at a time to find the source of the problem. You can tell script plugins apart by checking whether the `type` in their `manifest.json` is `lse-*`.

*Applies to: current version (general troubleshooting). Not confirmed against the source code or the documentation: treat it as a pointer.*

## The server console shows errors when loading old plugins (involving LegacyAddonsManager, CustomMap and BehaviorLog.lxl.js). What should I do?

- LegacyAddonsManager is no longer updated and has been archived. Do not use it any more (you can fork and adapt it yourself, or manage addons manually or with other tools).
- The CustomMap version is wrong. Replace it with a version that matches the current version.
- The BehaviorLog plugin is no longer compatible. Delete `plugins/BehaviorLog.lxl.js`.

*Applies to: LeviLamina current version*

## The server hangs while loading the Lua engine (LSE lua) at startup, and sometimes gets through after a few retries. How do I fix it?

Usually a mod is missing a dependency and causes the hang. Check that every mod's dependencies are installed.

If you don't use Lua plugins, you can simply delete the LSE Lua engine (`plugins/legacy-script-engine-lua`).

*Applies to: LeviLamina and LSE current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## At startup, several LSE script plugins report `[json.exception.parse_error.101] parse error at line 1, column 1: syntax error while parsing value - unexpected end of input`, together with LevelDB `IO error: fwrite failed` / `database or disk is full`, and I haven't changed any config. What should I do?

A plugin's JSON config/data file is corrupted (for example it became empty or lost its top-level `{}` or `[]`). This is usually caused by an unexpected server shutdown, a power failure, a full disk or a hosting provider migration, which leaves the data half-written.

Free up disk space first, then delete the broken JSON config file so the plugin regenerates its default config, and start the server again. If you edit it by hand, make sure it is saved as UTF-8 with valid JSON syntax.

Note that some JSON files hold data, and deleting them loses that data, so restore them from a backup if possible. A corrupted world (LevelDB) can also only be restored from a backup. The problem was first seen on LiteLoaderBDS and still applies to LSE.

## After installing the LSE Python engine, some players see "破损的数据包" (`server sent broken packet`) or crash when joining. What is the cause?

This is a known issue (LegacyScriptEngine issue #103, still open at the time of writing). When the server enables client-side chunk generation (`client-side-chunk-generation-enabled` in the BDS `server.properties`), it conflicts with the LSE Python engine (`legacy-script-engine-python`), and players joining see `server sent broken packet` (broken packet). Players can join normally when the option is turned off or the Python engine is not installed.

Workaround: set `client-side-chunk-generation-enabled=false` in `server.properties`, or stop using the Python engine for now.

*Applies to: servers using the LSE Python engine (the issue was first reported on LSE 0.6.2 / BDS 1.20.72; no fix recorded in the latest version)*

## After installing script plugins such as GMLIB and iLand, the server crashes, and the trace log shows the crash happens while loading a JSON config file. How do I troubleshoot it?

The crash is an error in some plugin while loading its JSON data/config file, usually because that plugin's JSON data file is corrupted (invalid format). Check each plugin's JSON config/data files, and fix or delete the corrupted one.

If you can't locate it yourself, open an issue on GitHub and attach the crash log and the dmp file so developers can debug it.

*Applies to: current version (involves third-party plugins). Not confirmed against the source code or the documentation: treat it as a pointer.*

## After installing the LSE engine and the land-claim plugin iLand, the console reports errors whenever a player mines a block or hits an animal. How do I fix it?

The errors come from iLandHelper, the companion plugin of iLand, which was not compatible with the LSE of that time. Delete iLandHelper.

As a general rule, find the faulty plugin from the plugin name in the error stack trace, then remove or replace it.

*Applies to: servers using the third-party iLand / iLandHelper plugins. Not confirmed against the source code or the documentation: treat it as a pointer.*
