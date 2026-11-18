# LegacyScriptEngine API: engines, modules and timers

## Do LSE (LegacyScriptEngine) script plugins still need to call `ll.registerPlugin`? I cannot find it in the docs. Where do I set the plugin name, version and so on? Where is the complete API definition?

No. A LSE plugin's information (`name`, `version`, `author`, `description`, `entry`, `type` and so on) is written in the `manifest.json` in the plugin directory and is registered automatically on load. `ll.registerPlugin` is deprecated and has been removed from the LSE docs; it is kept only for compatibility with old LLSE plugins. It type-checks its arguments and, when the version passed differs from the one in the manifest, writes the arguments back to the plugin's `manifest.json`; it does nothing else. A wrong argument type throws an exception, which, if not caught, stops the rest of the plugin's code from running, and an exception thrown while the plugin loads may not show any error in the console (see the still-open <https://github.com/LiteLDev/LegacyScriptEngine/issues/240>). It is therefore recommended to delete the call.

The complete API type definitions (including classes such as `File`) are at <https://github.com/LiteLDev/legacy-script-engine-api>.

*Applies to: LSE, all current versions (on LeviLamina)*

## How do I get the server's current TPS in LSE? Why can a TPS calculated with `onTick` be greater than 20?

LSE has no API for getting TPS, but you can count it yourself with `mc.listen("onTick", ...)`: increment a counter on every tick and read and reset it every second; the value is the TPS (normally 20). Alternatively, measure the time taken to run 20 ticks and divide. Occasionally getting a value above 20, such as 21, is normal: if BDS does not finish 20 ticks within one second, it catches up in the next second, and timing errors also cause deviations. For reference, see the ShowTPS plugin on MineBBS: <https://minebbs.com/resources/showtps-tps.8950/>. MSPT is the time taken per tick, and TPS can be derived from it.

Alternatively, install the third-party dependency GMLIB and its LegacyRemoteCallApi (LRCA), import it in JS and call `Minecraft.getServerCurrentTps()`, so you do not have to run a command and parse its output. If you want to clear entities when TPS is too low, iterating over `mc.getAllEntities()` in a script performs poorly; running `mc.runcmd("kill @e[type=!player,...]")` directly is usually cheaper.

*Applies to: all current versions of LegacyScriptEngine on LeviLamina; the GMLIB/LRCA approach requires the corresponding third-party dependency*

## `console.log` / `console.error` throws an error in an LSE JS plugin (QuickJS engine). What should I use to output logs?

There is no `console` object in the QuickJS engine environment; only plugins on the Node.js engine can use `console.log`. In QuickJS plugins, use LSE's `log()` or the `logger` API (such as `logger.info` / `logger.warn` / `logger.error`). Docs: the ScriptAPI → Logger page at <https://levimc.org/LegacyScriptEngine/>.

*Applies to: all current versions of the LSE QuickJS engine*

## Can an LSE JS plugin keep "sub-plugins/extensions" in its own subfolder and load them from the main plugin?

Scripts in a subfolder cannot be registered as standalone LSE plugins (each plugin must live in its own directory under `plugins` and have its own manifest). To implement a "plugin of plugins", you have to write a loader in the main plugin yourself: import the extensions as modules with CommonJS (`require`) or ES Modules. Inside a module you can still use the LSE global API, and extensions share functionality through exported functions/objects. For reference, see how UMenu loads, unloads and reloads extensions (<https://github.com/engsr6982/lse-workspace/tree/main/projects/UMenu>).

Avoid circular dependencies (a loaded file must not `require` the main file in turn), and switch to ESM if necessary. Otherwise, put each plugin in the `plugins` directory as a standalone plugin.

*Applies to: LeviLamina + current LSE version*

## When writing LSE JS/TS/Node.js plugins, which module do I import `mc`, `logger`, `PermType`, `ParamType`, `Player` and so on from? How do I bring in the type definitions, and can the Player class be accessed or inherited at runtime?

You do not need to import anything. LSE injects `mc`, `logger`, `ll`, `PermType`, `ParamType` and other APIs as global objects (the same applies to Node.js plugins), so use them directly. To call functions exported by other plugins, use `ll.imports` (remote calls). Type hints should also be declared globally: the official type library is <https://github.com/LiteLDev/legacy-script-engine-api> (covering JS/TS and Python).

Class names such as `Player` in the docs do not exist at runtime. The classes the engine actually registers carry an `LLSE_` prefix (such as `LLSE_Player`), and accessing `Player` directly gives `undefined`. These classes also have no usable constructor, so they cannot be inherited. The API docs are at <https://levimc.org/LegacyScriptEngine/apis/>.

*Applies to: current LSE version*

## Why does using `time.sleep` or a `while True` loop in an LSE Python/JS plugin for a countdown or delayed repeated commands freeze the server, and how should I write it?

Script plugins run on the BDS main thread, so `time.sleep` or a loop that never exits in a callback blocks the entire server. Use LSE's cross-language timers `setTimeout` / `setInterval` for periodic tasks (they are available in Python too) and call `clearInterval` when done. To show a title, use `pl.setTitle` directly instead of running the `title` command. JS example:

```js
let delay = 5000;
let task = setInterval(() => {
  player.setTitle(`${delay / 1000}`, 4, 1, 2, 1);
  if (delay <= 0) {
    player.setTitle('新年快乐', 4, 0, 1, 0);
    clearInterval(task);
  }
  delay -= 1000;
}, 1000);
```

*Applies to: all current LSE versions*

## Can an LSE plugin use Script API (addon, `@minecraft/server`) idioms such as `serverApi`, `world.getDimension()`, `origin.teleport()` and `server.on`?

No. LSE plugins and the official Minecraft Script API (SAPI, `@minecraft/server`) are two completely different APIs that cannot be mixed, so do not copy AI-generated SAPI code as is. LSE has no objects such as `serverApi` / `playerApi` / `worldApi` / `world.getDimension`: to listen to events, use `mc.listen(eventName, callback)`; to output logs, use `logger.log`; to teleport a player, use `pl.teleport(...)` on the Player object or run the `tp` command with `mc.runcmd`. Write your code against the LSE docs at <https://levimc.org/LegacyScriptEngine/> (API reference); for editor type hints, use `legacy-script-engine-api`.

*Applies to: all current LSE versions*

## When adding type annotations to event callback parameters in an LSE Python plugin, `player: Player` does not work (reported as undefined). How should I write it?

The class names LSE registers with the script engine carry an `LLSE_` prefix. In the Python environment the player class is called `LLSE_Player`, and there is no class named `Player`, so write the annotation as `player: LLSE_Player` (the same applies to other classes, such as `LLSE_Item` and `LLSE_Block`). To get completion in an IDE, use the type hints provided in `platforms/python` of the `LiteLDev/legacy-script-engine-api` repository.

*Applies to: LegacyScriptEngine Python backend (legacy-script-engine-python), current version*

## In LSE's TypeScript type completion library, what is the difference between prefixed class names such as `LLSE_Player` and unprefixed ones such as `Player`, and which should I use?

In the completion library, every class with the `LLSE_` prefix inherits from the corresponding unprefixed class (for example `declare class LLSE_Player extends Player {}`); the unprefixed names are kept to avoid introducing breaking changes. TypeScript matches types structurally (by shape), so the two can be passed to each other, and you can use whichever you prefer. Note that this is only a difference at the type declaration level: the class name the engine actually registers at runtime is `LLSE_Player`. The completion library is now `LiteLDev/legacy-script-engine-api` (`platforms/javascript`).

*Applies to: legacy-script-engine-api (formerly HelperLib), current version*

## In LSE (script plugins), is the second parameter of `setTimeout` in ticks or milliseconds? How do I write it?

The second parameter is in milliseconds. Usage: `setTimeout(func, msec)`. `func` can be an anonymous function, an arrow function or a reference to an existing function. It returns a task ID (which you can cancel with `clearInterval`). `setTimeout(code, msec)` with a code string is also supported. For periodic execution, use `setInterval(func, msec)`.

Note that `setTimeout` only delays execution. The callback still runs on the server main thread, so time-consuming logic does not become asynchronous.

## In an LSE JS (QuickJS) plugin, `import` of a submodule from the entry file works, but when that submodule `import`s another file (a nested `import`) it fails. How should I write the path?

When the LSE QuickJS module loader loads the entry module specified in `manifest.json`, it sets the base path to the current working directory (the directory of the server executable), not the directory of the script. So in the entry file, write the path starting from the server root and with the `.js` suffix, like `./plugins/<your-plugin>/xxx.js`, for example `import { initCommand } from "./plugins/your_plugin/command/command.js"`.

This only affects the entry module. `import` between the other modules imported by the entry is resolved by the standard ES Module rules, that is, relative to the module's own location. So inside a submodule, write a path relative to the submodule itself and do not start from `./plugins` again.

*Applies to: LSE QuickJS engine 0.23.x*

## In LSE, `ll.getPluginInfo()` returns `undefined`, which breaks old plugins that rely on it for security checks (such as TMEssential). Why?

In LSE, plugin information comes from the `manifest.json` in the plugin directory, and `ll.getPluginInfo(name)` looks up the plugin (mod) by name. The plugin name is the `name` in `manifest.json`. For an old single-file plugin that has been migrated, the name is the file name without the `.js` suffix, so do not include `.js` in the name you pass.

`ll.registerPlugin` is kept only for compatibility with old plugins. It is no longer the source of plugin information, and it only writes the description, version and extra information back to `manifest.json` when the version differs from the manifest. Old plugins that rely on `registerPlugin`/`getPluginInfo` for security checks need their code changed accordingly.

## In LSE, the `setTimeout`/`setInterval` parameter is in milliseconds, but scheduling is done in game ticks. Does this cause precision problems? Why not use system time or a thread for timing?

LSE's `setTimeout`/`setInterval` are scheduled on the `ServerThreadExecutor` using LeviLamina coroutines (`ll::coro`). The milliseconds you pass are rounded up to game ticks (1 tick = 50ms), and due tasks run on each server Level tick. The actual precision is therefore one game tick, and when the server lags (TPS drops), tasks are delayed accordingly. This matches the behavior of LL2.

A separate thread that times by system clock is not used because MC interfaces can only be called on the main game thread, so callbacks must run on the server thread.

## In LSE, how do I exit JS debug mode after entering it with `jsdebug`? And how do I get a player's IP?

Enter `jsdebug` again to exit debug mode (`nodejsdebug` for Node.js, `luadebug` for Lua, `pydebug` for Python). Whether the command can be used in game is determined by `debugCommandLevel` in the LSE configuration file `config.json`, which defaults to GameDirectors (OP).

To get a player's IP, use `pl.getDevice().ip` (returns IP:port). The `pl.ip` property also exists and returns the address without the port.

## In LSE, after destructuring a player object (`const {name, xuid, getExtraData} = player`), calling `getExtraData` fails with `不可以将值转换为对象` ("cannot convert the value to an object"). Why?

For objects provided by the LSE engine, properties (such as `name` and `xuid`) can be destructured, but methods are native `instanceFunction`s bound to the instance. When you call a destructured method on its own, it loses `this` (it no longer points to the Player instance), hence the error. Call it as `player.getExtraData(...)`, or as `getExtraData.call(player, ...)`.

*Applies to: all current LSE versions*

## In LSE, should I use `ll.import` or `ll.imports` to import a function exported by another plugin? The documentation says `ll.imports`, but the call fails.

The official API is `ll.imports(namespace, name)` (it returns a callable function), used together with `ll.exports` on the exporting side. LSE defines `ll.import = ll.imports` in the JS and Lua baselib as a compatibility alias, so the two are completely equivalent (in Python `import` is a keyword, so only `ll.imports` works).

If the call fails, the cause is usually that the target plugin has not loaded yet or has not exported the function, or that `namespace` or `name` is wrong, not the spelling you use. You can check with `ll.hasExported(namespace, name)`.

*Applies to: all current LSE versions*

## In LSE, when running an external command with `system.cmd` (for example 7z compression), the callback does not fire or the return value is unavailable. How do I tell whether it succeeded?

The callback of `system.cmd(cmd, callback[, timeLimit])` runs only after the shell process exits. If the command starts another process with `start`, there is no way to tell when that process finishes.

Use `system.newProcess(process, callback[, timeLimit])` instead to run the external program directly, and in the callback `function(exitcode, output)` judge success from `exitcode` and the output. The callback must be a function (for example the anonymous function `(exitcode, output) => {...}`), not a function call.

*Applies to: LSE 0.23.x*

## Can an LSE plugin get / intercept all the output of the BDS console?

No. LSE's former console output event has been removed; `system.cmd` only returns the output of the system command it runs and cannot capture the BDS console log. To capture console output you need a native (C++) mod that hooks the output function.

## Can an LSE JS plugin use the CommonJS style `require` / `module.exports`, or must it use `import` / `export`?

It depends on the engine:

- Node.js engine (the `#nodejs` variant): plugins load as CommonJS by default, so you can use `require` / `module.exports` and `require` npm dependencies. If you set `"type": "module"` in the plugin's `package.json`, the plugin loads as an ES module and uses `import` / `export`.
- QuickJS engine: the entry file loads as an ES module (ESModule is natively supported), so use `import` / `export`. QuickJS provides no CommonJS `require` / `module.exports` and does not support npm package management. Note that relative `import` paths in the QuickJS entry module are resolved against the server working directory (the directory containing BDS), for example `import { x } from "./plugins/your_plugin/command/command.js"`. Imports between the other modules, after the entry, follow the standard behavior.

*Applies to: LSE 0.10.6 and later (Node.js ESM support since 0.10.6); current 0.23.x*

## How does an LSE Lua plugin write logs? Is it the same as in JS?

Yes. All LSE languages share the same API, so in Lua you can likewise use the global functions `log(...)` / `colorLog(...)` and the `logger` object (`logger.info` / `logger.warn` / `logger.error` / `logger.debug` / `logger.log`, and so on), used the same way as in JS. Documentation: <https://levimc.org/LegacyScriptEngine/> (the logging API is on its `apis/ScriptAPI/Logger` page).

## In an LSE script plugin, `setTimeout` cannot pass arguments to the callback. How do I run a delayed function with arguments?

LSE's `setTimeout(func|code, ms)` accepts only a callback (a function or a code string) and a delay, and does not forward extra arguments to the callback. Wrap the call in a closure: `setTimeout(() => fn(arg1, arg2), ms)`. Alternatively, write a wrapper function that returns a function without parameters and calls the function with arguments inside it.

*Applies to: current version (LSE's built-in `setTimeout` on engines such as QuickJS)*

## Can the classes exposed in LSE (including the Node.js engine), such as the form classes, be extended or overridden?

No. Object classes created by C++, such as forms (`LLSE_SimpleForm`, `LLSE_CustomForm`), players, entities, blocks and commands, do not expose constructors to scripts, so they cannot be extended and you can only write your own wrapper. Only a few classes have constructors, for example `IntPos`, `FloatPos`, `DirectionAngle`, the NBT classes, `JsonConfigFile`, `IniConfigFile` and `KVDatabase`. For forms, see community wrappers such as <https://github.com/lgc-LLDev/FormAPIEx>.

## How do I add third-party npm dependencies when writing a plugin for LegacyScriptEngine's Node.js engine (`legacy-script-engine-nodejs`)?

In the plugin directory (`mods/<plugin name>/`, under LeviLamina's mod root directory), generate `package.json` with `npm init` and list the dependencies in `dependencies`; in `manifest.json`, set `"type"` to `"lse-nodejs"`. When the plugin loads, if `package.json` has dependencies and the plugin directory has no `node_modules` yet, LSE automatically runs `npm install --omit=dev --no-fund` in the plugin directory, so you do not need to ship `node_modules`. The old method (zipping `package.json` and the source, renaming the extension to `.llplugin` and putting it in the `mods` directory) is still supported: the engine extracts it to `mods/<plugin name>/` and generates `manifest.json` automatically. You can also use the community scaffold <https://github.com/leoweyr/legacy-script-engine-scaffold>.

*Applies to: LSE Node.js engine (`lip install LegacyScriptEngine#nodejs`); current 0.23.x*

## How can a JS plugin that depends on `legacy-script-engine-quickjs` call `ffi-napi` or other DLL libraries?

The QuickJS engine does not support native npm modules. Run the plugin on the Node.js engine (`legacy-script-engine-nodejs`) instead, where you can use native Node modules such as `ffi-napi`. A QuickJS-based plugin can in theory be ported directly to the Node.js engine (change the manifest `type` to `lse-nodejs` and put the dependencies in `package.json`). The Node.js engine depends on `libnode.dll`; installing with `lip install LegacyScriptEngine#nodejs` now downloads the prebuilt package from LiteLDev/node automatically, so you no longer need to get it manually from the files of the official QQ group.

*Applies to: LSE Node.js engine; current 0.23.x*

## Can I use `instanceof` in an LSE JS plugin to check whether a parameter is an `IntPos`?

Yes, `obj instanceof IntPos` works. Objects that the LSE documentation calls "classes" can generally be checked this way, but the registered class name does not always match the name in the documentation exactly.

## In an LSE JS plugin, passing a callback function directly to `ll.imports("BEPlaceholderAPI", "registerPlayerPlaceholder")` to register a PAPI variable makes the plugin fail to load or throw an error. What is the correct way?

Cross-plugin remote calls (RemoteCall) do not support function-type parameters. First export the callback with `ll.exports` (alias `ll.export`), then pass the namespace and export name to `registerPlayerPlaceholder`:

```js
const registerPlayerPlaceholderAPI = (papiName, callback, pluginName = "your plugin name") => {
  ll.exports(callback, pluginName, `Placeholder_${papiName}`);
  ll.imports("BEPlaceholderAPI", "registerPlayerPlaceholder")(pluginName, `Placeholder_${papiName}`, papiName);
};
registerPlayerPlaceholderAPI("player_temp", (pl) => `${getTemp(pl)}°C`);
```

This PAPI interface belongs to a third party (GMLIB), whose author recommends the newer PAPI interface instead. See the documentation at <https://github.com/GroupMountain/GMLIB-Release/blob/release/PlaceholderDocs.md>.

*Applies to: LeviLamina; LegacyScriptEngine; LegacyRemoteCall (the PAPI part depends on the third-party GMLIB version)*

## Importing a function exported by another plugin with `ll.imports` in an LSE plugin fails with `Fail to import! Function [...] has not been exported!`. How do I fix it?

This is usually because the call happens too early: the other plugin has not yet run `ll.exports` to export the interface (or the namespace or function name is wrong). Import or call it after the server has finished starting (for example inside a `mc.listen("onServerStarted", ...)` callback), or first check whether it has been exported with `ll.hasExported(namespace, name)`.

## In an LSE Python plugin, writing a file with `open('a.txt','a')` raises no error, but the file is not in the plugin directory. Where did it go?

LSE does not change the script's working directory to the plugin directory. Relative paths are resolved against the BDS root directory (the process working directory), so `a.txt` appears in the BDS root. To write into the plugin directory, use a path such as `plugins/<plugin name>/a.txt`. You can build the path and make sure the directory exists with the `os` module (`os.path.join`, `os.makedirs(..., exist_ok=True)`). Also note that the mode argument of `open()` must be a string (`'a'`, not `a`).

*Applies to: LSE Python backend (legacy-script-engine-python), current version*

## When an LSE plugin writes to the server console with `logger`, how do I make the text colored? `§` color codes have no effect in the console.

`§` format codes only work for in-game text, and LSE's `logger` does not convert them to console colors. In the console, use ANSI escape sequences. Put the escape codes into the output string, for example foreground colors `\x1b[30m` ~ `\x1b[37m` (black/red/green/yellow/blue/magenta/cyan/white), background colors `\x1b[40m` ~ `\x1b[47m`, `\x1b[0m` to reset the style, `\x1b[1m` for bold, `\x1b[4m` for underline, and so on. Example:

```js
logger.info("\x1b[33m黄色文字\x1b[0m")
```

The octal escape `\033` is not available in JS strict mode, so write `\x1b` or `\u001b` instead.

## When an LSE JS plugin prints ASCII art with `log`, the backslashes `\` in the string are treated as escapes and break the layout. How can I avoid escaping?

Use the JS template-string tag `String.raw`, for example:

```js
log(String.raw`  /\_/\  ...`)
```

Backslashes in it are not escaped (see the MDN documentation for `String.raw`). You can also replace every `\` with `\\` (double backslash), but `String.raw` is more convenient for ASCII art.

*Applies to: LSE JS backend (QuickJS / Node.js), current version*

## In LegacyScriptEngine (ScriptX), what does an `undefined` passed from JS become on the C++ side? How do I tell `undefined` and `null` apart?

V8 itself distinguishes `undefined` from `null`, but the ScriptX abstraction layer treats both as Null: `Local<Value>::isNull()` returns `true` for both `undefined` and `null`, and a `Local<Value>()` returned from C++ reaches JS as `undefined`. To really pass `null` you must use `v8::Null(isolate)` directly; ScriptX itself provides no way to tell them apart. Therefore, API implementations should check `isNull` first for optional parameters (such as `fadeInTime`/`stayTime`/`fadeOutTime` of `setTitle`) so that a JS `undefined` does not cause an error.

*Applies to: current version (ScriptX V8 backend)*

## How do I quickly print the names and versions of all loaded LSE plugins in the server console (for troubleshooting)?

Run this in the console (requires the QuickJS engine legacy-script-engine-quickjs):

```text
jsdebug ll.getAllPluginInfo().forEach(info => logger.warn(`${info.name}: ${info.versionStr}`))
```

Note that `ll.getAllPluginInfo()` returns all mods loaded by LeviLamina (including native C++ mods); each item has fields such as `name`, `versionStr` and `type`.

*Applies to: current version (the QuickJS backend provides `jsdebug`; the Node.js backend does not support debug commands)*

## How do I start writing an LSE Node.js plugin? How does it differ from a QuickJS plugin?

Node.js plugins and QuickJS plugins use the same LSE API. The difference is that you can pull in third-party libraries through npm (set `"type": "module"` in `package.json` to use ES modules). You need to install LSE's nodejs engine (the lip variant `LegacyScriptEngine#nodejs`).

Development: install Node.js, create a directory, run `npm init` to generate `package.json`, and write your code in the entry file.

Deployment: pack `package.json` and the source (without `node_modules`) into a zip, rename the extension to `.llplugin`, and put it in the `mods` directory. When the server starts, LSE automatically unpacks it to `mods/<plugin name>`, generates `manifest.json`, and runs `npm install` to install the dependencies.

For type hints, use <https://github.com/LiteLDev/legacy-script-engine-api> (it contains type definitions for JS/TS and Python). The Node.js backend has no console debug commands such as `jsdebug`.

*Applies to: current version (LeviLamina, nodejs engine)*

## How do I split a JS plugin into multiple files (modules) when developing with LegacyScriptEngine?

Use the LSE Node.js engine (the variant installed with `lip install LegacyScriptEngine#nodejs`). You can organize multiple files the Node.js way and load them with `require` (CJS); set `"type": "module"` in `package.json` to load them as ES modules (ESM). The QuickJS engine also supports multi-file ES modules natively, but note that relative `import` paths in the entry module specified in `manifest.json` are resolved against the server working directory (the directory containing BDS), so write them as `"./plugins/your-plugin/xxx.js"`; `import` between modules other than the entry behaves as standard. See "Language Support" in the LSE documentation.

*Applies to: LSE current version*

## An LSE JS plugin uses a top-level `return` to stop execution; the editor shows no error but loading fails with `return not in a function`. How do I exit early?

When the LSE QuickJS engine loads a plugin entry file, it first tries to load it as an ES module (`loadFile`, `JS_EVAL_TYPE_MODULE`) and, if that fails, evaluates it as a global script. In both modes the top level is not a function body and `return` is not allowed, hence `return not in a function`. Wrap your logic in a function (or an IIFE) and `return` from inside the function to exit early.

*Applies to: LSE QuickJS engine, all current versions*

## An LSE Node.js plugin (such as BetterSidebar) fails to load, and the log shows a duplicated drive letter in the `mkdir` path (such as `E:\...E:\...`), or the sub-plugin load path becomes `xxx/src/plugins`. What is the cause?

The plugin code uses `path.join(process.cwd(), __dirname, 'plugins')`, but `__dirname` is already the absolute path of the directory containing the JS file, so joining it with `cwd` (the BDS root directory) duplicates the drive letter; removing `process.cwd()` instead points to `src/plugins`. Join the path correctly from `__dirname` according to the plugin's actual directory layout (for example `path.join(__dirname, '..', 'plugins')`); this requires changing the plugin code.

If dependencies are missing: when LSE loads a Node.js plugin whose `package.json` declares dependencies and whose directory has no `node_modules`, it automatically runs `npm install --omit=dev` in the plugin directory; otherwise, run `npm i` manually in the plugin directory. Note that the default working directory of `npm` commands in the LSE console is the engine directory, not the plugin directory.

*Applies to: LSE Node.js engine, all current versions*

## An LSE plugin calling GMLIB's floating-text API through `ll.imports` fails with `Fail to import! Function [GMLIB_API::...FloatingText...] has not been exported!` (the Chinese log reads “导入失败！函数[...]尚未被导出”, with the same meaning). How do I fix it?

The cause is that the dependency that exports these functions (GMLIB and its LSE export part, GMLIB_API) had not registered its exports at the time of the call: either the dependency is not loaded, or your plugin called the imported function before the dependency finished loading. LSE looks up exports only when the imported function is actually called (`MakeRemoteCall` -> `RemoteCall::importFunc`), and the error also appears at call time.

1. Check the mod list in the server startup log and confirm that GMLIB and its LSE export part loaded successfully.
2. Declare a dependency on GMLIB (and its export module) in `dependencies` of your plugin's `manifest.json`, so that your plugin loads after it.

Once the dependency is installed and declared, the floating-text API imports normally. GMLIB is a third-party dependency.

*Applies to: LeviLamina current version; LSE current version*
