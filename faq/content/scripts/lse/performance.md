# LegacyScriptEngine: performance and tooling

## Is async in LSE truly asynchronous? Will heavy computation block the main thread?

It is not true multithreaded async. The LSE script engine event loop runs on the MC server main thread: the message queues of engines such as QuickJS and Lua are polled once per tick (`loopQueue` `kLoopOnce`), and Promise/`setTimeout` and the like are merely deferred to later execution on the main thread. QuickJS microtasks (Promise callbacks) are posted by ScriptX to the engine message queue and run there. The Node.js engine's libuv event loop and microtasks are also driven by LSE on the main thread roughly every 2 ticks (`uv_run` NOWAIT). All MC APIs are synchronous calls.

So heavy computation blocks the main thread (and lowers TPS) whether or not you write it as `async`. Split the computation into small chunks and run them across ticks. With the Node.js engine, you can also try putting pure computation in a `worker_threads` worker (a worker cannot call MC APIs, and the official documentation does not cover this usage). The Python engine documentation explicitly says not to use features such as `threading` and `asyncio` for now.

*Applies to: all current LSE versions*

## What is the difference between the LSE quickjs and nodejs engines? Do they use V8? How does their performance compare?

The QuickJS engine (`LegacyScriptEngine#quickjs`) uses QuickJS as its JS engine, not V8. Only the Node.js engine (`LegacyScriptEngine#nodejs`) uses V8, and it supports npm packages. Whether QuickJS or the Python engine is faster is not clear-cut, while V8 is a well-known high-performance (JIT) engine; for large projects, consider the Node.js engine.

*Applies to: all current LSE versions*

## Can LSE (formerly LLSE) script plugins use multithreading to speed up brute-force searches (such as finding nearby ore)?

Essentially no. LSE script APIs can only be called on the server main thread, and the script engines themselves (QuickJS, Lua) have no usable multithreading. Even if Node.js `worker_threads` or Python threads can run pure computation, they cannot call LSE/BDS interfaces from there, and multiple processes cannot interact with BDS either. For high-performance computation (such as brute-forcing blocks over a large area), use a native LeviLamina C++ mod instead, or lower the frequency and spread the computation over multiple ticks.

*Applies to: LegacyScriptEngine, all current versions (including 0.23.1). Not confirmed against the source code or the documentation: treat it as a pointer.*

## An LSE JS plugin reads and writes files every tick in `mc.listen("onTick")`, which makes joining slow and the server lag. How do I find and fix it?

Tools such as VS performance profiling (flame graphs) show a large amount of file reading and writing. Search the plugin for `File.readFrom` / `File.writeTo` to find the code that reads or writes files in `onTick`. Writing a file every tick means 20 disk I/O operations per second, more often than BDS writes the world, and it has a large performance impact. Write once every few seconds instead (or only when the data changes). Many cases do not need to listen to `onTick` at all; you can use `setInterval` as a lower-frequency tick timer.

*Applies to: LegacyScriptEngine, all current versions*

## When an LSE plugin needs to modify many blocks (for example clearing a chunk), is it better to use `mc.setBlock` one by one or the `fill` command?

In LSE, calling `mc.setBlock` many times one by one costs more than running a single `fill` command (each call crosses between script and C++ and constructs a block). For large-area changes, prefer `fill` (note that `fill` requires the target chunks to be loaded, and a single call has a volume limit), or consider approaches such as loading a structure.

*Applies to: LegacyScriptEngine, all current versions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## LSE's KVDB (`KVDatabase`) reads are fast, but writing nested objects/dictionaries is slow. Why, and how do I optimize it?

`KVDatabase.set` converts the value you pass to JSON through `ValueToJson`. If you pass an object or array, LSE must walk every key recursively, fetch each value from the script engine and convert it, so the deeper and larger the nesting, the slower it gets. Passing a string requires only a single value fetch and is much faster. Serialize the data to a string yourself before storing it (for example with `JSON.stringify`, or serialize NBT directly to an SNBT/binary string). LevelDB already has its own internal read/write cache and the bottleneck is usually serialization, so you do not need to add another read/write cache of your own.

*Applies to: LegacyScriptEngine, all current versions*

## What is wrong with LSE's built-in BossBar interface (`player.setBossBar`)? Why does the specified entity disappear when I set a bossbar?

The implementation of `player.setBossBar(uid, title, percent, color)` with a `uid` is: first send a BossEvent Remove, then send an AddActor packet (ActorType `"player"`, with the passed `uid` used for both `uniqueId` and `runtimeId`, and the position placed below the dimension's minimum height), then send a BossEvent Add. In other words, every update is a remove followed by a re-add rather than an update packet. If the `uid` you pass belongs to a real entity, the client overwrites it with this fake entity, so the specified entity appears to disappear. Frequent updates are also expensive, and there are reports that the way it constructs AddActor conflicts with multithreaded packet sending by other plugins (such as LeviOptimize).

If you need to update a bossbar frequently, use the send/update implementation provided by a library such as GMLIB (call its exported interface rather than copying it), or use a `uid` that does not exist.

*Applies to: LegacyScriptEngine, all current versions (implementation unchanged in 0.23.1)*

## In heavy LSE use, which performs better: running vanilla commands (`mc.runcmd` / `mc.runcmdEx`) or calling the equivalent script API?

The API is generally better: it skips the cost of parsing the command string and running the command pipeline, while the game logic behind it and the command are basically the same.

*Applies to: LegacyScriptEngine, all current versions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## A LeviLamina server has seventy or eighty plugins (many LSE script plugins plus addons), and with a high-end CPU and a dozen or so players the TPS is in single digits. How do I optimize it?

The more LSE plugins you have, the more the server lags: communication between C++ and the script layer is itself costly, and more plugins mean more overhead. Recommendations:

1. Remove unnecessary LSE plugins, and replace them with native LeviLamina C++ mods where possible (for example, use the C++ PLand instead of the Lua iLand for land claims).
2. Install only the script engine variants you need: use `lip install LegacyScriptEngine#quickjs` (or `#lua`, `#nodejs`, `#python`) as needed. Without a variant, QuickJS and Lua are both installed, and you can remove any engine you do not use.
3. Performance is best with no LSE installed at all, and better still together with LeviOptimize.
4. Logging plugins that record player behavior (such as BehaviorLog) are very sensitive for performance and easily cause lag.
5. Large mob addons and large numbers of villagers or iron farms also lower TPS significantly.

In the reported case, after removing many plugins and the spawn rules of a high-load addon, TPS with a dozen or so players returned to 17+.

*Applies to: LeviLamina + LegacyScriptEngine, current versions*

## Why is the LL2 script engine said to slow down the server? How is the current LSE different?

In LL2 (LiteLoaderBDS), as soon as any script plugin exists, all script engines (JS/Lua/Node/Python) are started rather than only those needed, which makes the already modest performance of BDS worse. LSE on LeviLamina splits the engines into separate variants, so you install only what you need: `lip install LegacyScriptEngine#quickjs` / `#lua` / `#nodejs` / `#python`; without a variant, QuickJS and Lua are installed together by default. Leaving out engines you do not need reduces overhead.

*Applies to: LeviLamina + LegacyScriptEngine, current versions (0.23.x)*

## With the same number of looped calls, which is faster and less likely to drop ticks: LSE scripts or the vanilla Script API (addon scripts)?

Both run JS on the server main thread, so raw script computation performance differs little; the main difference is the overhead of calls between C++ and the script. In either case, avoid heavy loops in a tick: spread the work over multiple ticks or reduce its frequency. Also, when the vanilla Script API does not allow modifying world state in a before event, you can use a scheduled task such as `system.run` to run the operation on the next tick.

*Applies to: LegacyScriptEngine, current versions; vanilla Script API behavior depends on BDS. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Is calling the GMLIB floating text API from LSE expensive?

It depends on the implementation: floating text made of real entities is expensive, while GMLIB's floating text is implemented with packets (fake entities on the client), so the server-side cost is small.

*Applies to: LSE plugins that use GMLIB (third-party library). Not confirmed against the source code or the documentation: treat it as a pointer.*

## A server with about 20 players has a TPS of only about 10, and profiling shows a lot of time in hoppers and an LSE (QuickJS) plugin. What is the cause?

The cause is an LSE anti-item-duplication plugin that listens to hopper events (`onHopperSearchItem` / `onHopperPushOut`) on a server with many hoppers: each hopper triggers these events several times per second, and the plugin runs a lot of logic in every event callback, which causes severe lag. To fix it, uninstall or replace that plugin, or reduce the number of hoppers.

*Applies to: LegacyScriptEngine, all current versions*

## When refreshing a mining area with LSE, is there a more efficient method than looping over `setBlock` with a `for` loop?

Save the mining area in advance as a structure (NBT structure), and when refreshing, place the whole structure at once with `mc.setStructure(nbt, pos, mirror = 0, rotation = 0)`. Placing a structure in one call costs less than looping over `mc.setBlock` in the script.

*Applies to: LegacyScriptEngine, current version (0.23.x)*

## After an LSE plugin frequently uses `rename` on player names to show information such as ping below the name, players lag for a few seconds when joining. Why?

`pl.rename()` does more than change a name: it calls `setNameTag` and resynchronizes the entity's ActorData (SetActorDataPacket) to all players, once per call. If you call `rename` for every player on every tick, it produces a large number of packets that can crowd out or delay the chunk packets of players who are joining, causing loading lag. `rename` also affects display names in places such as command output.

A better approach is to use LSE's packet-sending interface (build a packet with `BinaryStream` and call `pl.sendPacket(packet)`) to send only to the players who need it, or to hook the relevant packet in C++ to change the display name, and to lower the update frequency, instead of calling `rename` frequently.

*Applies to: LegacyScriptEngine, current version*

## When profiling a laggy LeviLamina server with a tool such as Visual Studio diagnostics (`.diagsession`), I cannot tell which plugin uses the most. What can I do? Which LSE plugins tend to hurt performance?

Native DLL plugins need a matching `.pdb` symbol file for function names to appear in the profile. Check that each dll plugin directory has its pdb; if not, get it from the plugin's download page and put it in the plugin folder. The pdb must match the actual plugin version, otherwise symbols still cannot be resolved.

For LSE script plugins, profilers (including windbg) only see the LSE engine itself and cannot tell which script plugin is responsible. If the call stack hotspot is in the tick, it relates to `onTick`: search all `*.js` files in the plugin directory for `onTick` (for example with VSCode/Notepad++) to find the plugins that use `mc.listen("onTick", ...)`. LSE plugins that listen to `onTick` (such as TMEssential) all add continuous overhead, and loading LSE itself has some overhead too.

*Applies to: LeviLamina + LegacyScriptEngine, current versions*

## After running for a long time (about 18 hours), the LSE nodejs engine reports `JavaScript heap out of memory` and crashes the server. Can the memory limit be raised?

Older LSE nodejs uses Node 16; newer versions use Node 22. Heap memory is managed by Node/V8 and has an upper limit. In theory you can raise it with the Node startup option `--max-old-space-size`. LSE itself has no config option to pass this option, but you can try setting the environment variable `NODE_OPTIONS=--max-old-space-size=<MB>` before starting BDS (not officially confirmed). However, this kind of problem is usually caused by a plugin that keeps creating objects without releasing them (a memory leak), so check the plugins first. As a temporary workaround, you can reload the plugins periodically.

*Applies to: LSE nodejs engine (Node 22), current version*

## Is there an official type definition (`.d.ts`) / code completion library for writing LSE (formerly LLSE) JS/TS plugins? Do HelperLib and LiteLoaderSE-Aids still work?

Yes. The official type definitions are maintained in the LiteLDev/legacy-script-engine-api repository (the former HelperLib repository was renamed to it, and the old link `github.com/LiteLDev/HelperLib` redirects there). The JS/TS platform is published as the npm package `@levimc-lse/types`:

1. Run `npm install -D @levimc-lse/types` in your plugin project.
2. In `tsconfig.json` (or `jsconfig.json` for a JS project), add `"compilerOptions": { "types": ["@levimc-lse/types"] }`, or write `/// <reference types="@levimc-lse/types" />` at the top of the entry file.

Note: as of 2026-11-18, `@levimc-lse/types` returns 404 on the official npm registry `registry.npmjs.org` (the yarn registry and jsDelivr cannot serve it either), while the npmmirror mirror in mainland China still has 2.18.7. If installing from the official registry fails, use `npm install -D @levimc-lse/types --registry=https://registry.npmmirror.com`, or copy the `.d.ts` files directly from `platforms/javascript/src` in the legacy-script-engine-api repository and reference them with `/// <reference path="local/path/index.d.ts" />`.

The old form `/// <reference path="node_modules/helperlib/src/index.d.ts"/>` is outdated. A `reference path` can only point to a local file, not a URL. The repository also provides a hint library for the Python platform.

The VSCode extension LiteLoaderSE-Aids is essentially just a one-click way to import completion and optionally run a server from a BDS directory. The official repository is archived and no longer maintained (the community has a modified version, LiteLoaderSE Aids Magic Revision, and there are other third-party extensions such as LLScriptHelper-MR and the community npm package `levilamina`, none of which are official).

You can also test without an extension: in the VSCode terminal, `cd` to the server directory and run `.\bedrock_server_mod.exe` in PowerShell/cmd (`./bedrock_server_mod.exe` in Git Bash).

The LSE public API is largely the same as the old LLSE, and declarations from the LL v2 era mostly work, but the official `@levimc-lse/types` is recommended.

*Applies to: current version; `@levimc-lse/types` 2.18.x*

## Can LSE load TypeScript directly? How do I configure `tsconfig` for an LSE plugin written in TS, and how do I bundle a multi-file project into a single plugin js?

LSE cannot load `.ts` directly and does not compile on the fly. Compile or bundle to JS first, then load it (you can use `tsc --watch` or a bundler).

For types, use the official package `@levimc-lse/types` (as of 2026-11-18 the official npm registry returns 404; install it with `--registry=https://registry.npmmirror.com`, or take the `.d.ts` files from `platforms/javascript/src` in the legacy-script-engine-api repository). Set `"types": ["@levimc-lse/types"]` in `tsconfig.json` (the file must be named `tsconfig.json`). Some type declarations are global with no default export, so do not `import` them; use the globals such as `mc`, `ll` and `log` directly.

A multi-file project can be merged into a single file with a bundler, for example the community template dmblock/lse-typescript-template (rolldown):

- Key `tsconfig` options: `"target": "es2024"`, `"module": "commonjs"`, `"moduleResolution": "node"`, `"esModuleInterop": true`, `"skipLibCheck": true`, `"types": ["@levimc-lse/types"]`, `"rootDir": "./src"`, `"outDir": "./dist"`.
- `rolldown.config.ts`: `defineConfig({ input: 'src/index.ts', output: { file: 'dist/bundle.js', format: 'cjs' }, external: ['ll', 'mc'], platform: 'node', tsconfig: './tsconfig.json' })`.
- Usage: run `git clone https://github.com/dmblock/lse-typescript-template`, delete `.git`, run `pnpm install`, use `pnpm dev` to develop in watch mode and `pnpm build` to build, then rename `dist/bundle.js` and put it in the plugin directory (with a `manifest.json`).

Modules that are only imported and never used are tree-shaken away.

In addition, the QuickJS engine natively supports ES Module `import`/`export` (resolving relative paths of the entry module has special behavior; see LanguageSupport in the docs). With the Node.js engine, bundle it as an npm project: point the `package.json` entry at the compiled js, and do not pack `node_modules` into the archive.

## How do I build the `libnode.dll` used by LSE on Windows (most tutorials online are for `.so`)?

Run `.\vcbuild.bat dll` in the node source directory. If you need V8 internals the way LSE does (such as `v8_libplatform`), you also need to modify `tools/v8_gypfiles/v8.gyp`; see <https://github.com/LiteLDev/node/commit/80d31fc05ed413e3b29fbbdb0a4dc380eab2f5e3>.

LSE actually uses the prebuilt package from the LiteLDev/node fork (currently v22.12.0), so you usually don't need to build it yourself.

*Applies to: current version (LSE nodejs backend, Node.js v22.12.0)*

## When writing an LSE plugin in TypeScript, the `File` class provided by LSE conflicts with the built-in JS/DOM `File` and causes an error. How do I fix it?

The conflict comes from the `File` type that the DOM ships in TypeScript's default lib. Set `"lib"` explicitly in `tsconfig.json` with only the ES version (for example `["ES2020"]`) and do not add `"dom"`, and the LSE `File` declaration takes effect. You can combine this with `"skipLibCheck": true`.

For type declarations, run `npm install -D @levimc-lse/types` and add `"@levimc-lse/types"` to `compilerOptions.types`. If you use the Node.js engine, you can also use Node's `fs` module directly.

*Applies to: current version (JS/TS plugin development)*
