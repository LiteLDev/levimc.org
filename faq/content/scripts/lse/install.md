# LegacyScriptEngine: installing, configuring, versions

## Installation

### The LSE Node.js engine (`legacy-script-engine-nodejs`) fails to load with `C++ Exception: std::system_error ... [0x0000007E:system] 找不到指定的模块` (the specified module could not be found), and the dependency diagnosis shows `missing module: libnode.dll` (or says the node runtime library is missing). How do I fix it?

Cause: the Node.js engine depends on a Node runtime library that LiteLDev precompiles itself (`libnode.dll` and accompanying files). It is not provided by a Node.js installed on the system, so installing system Node.js does not help. This runtime library is not included in the LSE GitHub release zip, so it is easy to miss when you unpack LSE manually (or use a panel server or an online server pack).

Recommended: install the Node.js engine with lip, which downloads libnode and all other dependencies automatically:

```shell
lip install github.com/LiteLDev/LegacyScriptEngine#nodejs
```

The README also writes it as `lip install LegacyScriptEngine#nodejs`. Without `#nodejs`, only the QuickJS and Lua engines are installed by default, not the Node.js engine. The download needs a good network connection; configure a proxy or mirror if necessary. Update lip to the latest version to get clearer error messages.

Manual installation (for example when a panel server cannot run lip): download <https://github.com/LiteLDev/node/releases/download/v22.12.0/node-prebuilt.zip> and extract its contents directly into `mods/legacy-script-engine-nodejs/` (put the files straight into that directory, without an extra folder level). The exact download address and placement of the dependency are defined by the LSE package's `lip.toml` (`tooth.json` in older versions). You can also install the whole server with lip on a local computer first and then pack and upload it to the panel. If you placed an older libnode before, delete any leftover old `libnode.dll` files across the server first, so the wrong version is not loaded.

Also note: all LSE engines (quickjs, nodejs, etc.) must be the same version; the new LSE no longer depends on the archived LegacyParticleAPI.

*Applies to: LegacyScriptEngine current version (v0.23.1, LeviLamina 26.60.x)*

### The LSE Python engine (`legacy-script-engine-python`) reports errors at startup: it cannot find `python312.dll` / `python3.dll`, a module is missing, or it fails to load, even with Python 3.13 installed. What should I do?

Since LSE 0.9.0, the Python engine no longer bundles a Python runtime. You need to install the matching Python version on the machine that runs the server:

- LSE >=0.16.2 (including current 0.23.x) needs Python 3.12.10;
- 0.9.0 to 0.16.1 use 3.12.8;
- \<0.9.0 uses 3.10.11.

The version must match; Python 3.13/3.14 does not work (the engine looks for `python312.dll`). After installing, make sure the directory of Python 3.12 is in the `PATH` environment variable (several Python versions can coexist; what matters is that `PATH` can find the 3.12 dll). You can also place `python312.dll` and related files in the directory of `bedrock_server.exe`. If double-clicking the exe works but starting from a panel fails, the panel has most likely changed `PATH`.

If the server has no Python plugins (Python plugins are rare), the simplest option is to not install, or to uninstall, the Python engine: `lip uninstall LegacyScriptEngine#python`, or delete the `mods/legacy-script-engine-python` directory manually. This does not affect the QuickJS/Lua/NodeJS engines. The LSE engines are independent lip package variants (`#quickjs`, `#lua`, `#nodejs`, `#python`); install only what your plugins actually need, because the more you install, the higher the load. Running `lip install LegacyScriptEngine` without a variant installs only QuickJS and Lua. Also, if other engines such as Lua report errors at the same time and you suspect a corrupted download, run `lip cache clean` and reinstall.

*Applies to: LSE 0.9.0 or later (current 0.23.1 needs Python 3.12.10); Windows server*

### How do I run old LLSE (LiteLoaderBDS era) JS/Lua script plugins on a LeviLamina server? Why is a single `.js` file I dropped into the `plugins` directory not loaded?

1. LeviLamina itself has no built-in script engine and only loads native mods. To run LLSE script plugins you must first install LegacyScriptEngine (LSE, which is itself a LeviLamina mod), and its version must match your LeviLamina (when a new LeviLamina version has just been released, wait for the matching LSE version). Installing with lip is recommended, as it handles dependencies automatically: `lip install LegacyScriptEngine#quickjs` (JS), or `#lua`, `#nodejs`, `#python`; without a variant (`lip install LegacyScriptEngine`), both the QuickJS and Lua engines are installed. You can also download a built release manually from <https://github.com/LiteLDev/LegacyScriptEngine/releases> (not the source code). Use `ll list` to see the loaded mods and confirm that LSE loaded successfully. The Python engine requires a matching Python on the machine (Python 3.12.10 for LSE >=0.16.2).
2. Installing: put a single-file plugin (`.js` / `.lua` / `.py`; for Node.js, an `.llplugin` package) directly in the server's `plugins/` root. On the first start, LSE migrates it into a `plugins/<plugin name>/` folder and generates `manifest.json` automatically, and warns `Legacy plugins have been migrated, please restart the server to load them!`. At this point the plugin is not loaded yet; restart the server once more (or run `ll load <plugin name>` in the console). After migration, edit the files in `plugins/<plugin name>/` to change the code. If you downloaded a plugin folder that already contains `manifest.json`, put the whole folder into `plugins/` and restart once.
3. If an individual plugin still does not work after the engine is installed, it is most likely incompatible with the new version or depends on other prerequisites (such as GMLIB); use a version that the author has adapted to the new release. Old paths hard-coded inside the plugin may also need to be changed. Native `.dll` plugins from the LL2 era are not compatible with LeviLamina and cannot be loaded.

*Applies to: LeviLamina + LegacyScriptEngine current version (LSE 0.23.x / LeviLamina 26.60.x)*

### How do I install LegacyScriptEngine (LSE) and the language engines on a LeviLamina server? What if the old commands (`gitea.litebds.com/LiteLDev/legacy-script-engine-xxx`, `lip install github.com/LiteLDev/LegacyScriptEngine` without a variant, etc.) fail? Can I install it manually?

Install with lip in the server root directory. LSE is a single package, and each language engine is one of its variants:

```shell
lip install LegacyScriptEngine#quickjs
lip install LegacyScriptEngine#lua
lip install LegacyScriptEngine#nodejs
lip install LegacyScriptEngine#python
```

`LegacyScriptEngine` is equivalent to `github.com/LiteLDev/LegacyScriptEngine`; without a variant, lip installs both the QuickJS and Lua engines. Install the engine for the language your plugins use; you do not need all of them.

The server must already have LeviLamina installed with lip (`lip setup` or `lip install LeviLamina`): `lip install` does not install or replace the game or LeviLamina, and if the LeviLamina version LSE requires does not match the installed one, it fails immediately and tells you to use `lip setup`. lip installs the remaining dependencies automatically (LegacyRemoteCall, LegacyMoney, iListenAttentively; the nodejs engine also installs the Node runtime `node-prebuilt` and `7-zip-tooth`). The old `gitea.litebds.com/LiteLDev/legacy-script-engine-xxx` package names are deprecated.

The LSE version must match the LeviLamina version. To get an older version, specify it with `@<version>` (the variant goes before the `@`, for example `LegacyScriptEngine#quickjs@0.23.1`).

Manual installation: download `LegacyScriptEngine-server-<engine>-windows-x64.zip` from <https://github.com/LiteLDev/LegacyScriptEngine/releases>, put the `legacy-script-engine-<engine>/` folder from it into the server's `mods/` directory, and install the dependencies (LegacyRemoteCall, LegacyMoney, iListenAttentively, etc.) by hand, with matching versions. The nodejs engine also needs `node-prebuilt.zip` extracted into the same directory, so lip is the better choice for nodejs and python. To see which files go where and which packages are required, check `lip.toml` in that version's repository (`tooth.json` for older versions). Do not use GitHub Actions build artifacts; they often lack components.

Put LLSE script plugins in `plugins/` (since 0.23.0 this is a link to `mods/` that is created automatically at startup). They are migrated automatically on startup, a `manifest.json` is generated, and they load after a restart; you do not need to create a folder yourself.

See the documentation at <https://levimc.org/LegacyScriptEngine/> and the tutorial "Installing mods on a server".

*Applies to: LSE 0.10.0 and later (variant-style package names); latest LSE 0.23.1 / LeviLamina 26.60.x / lip 0.41.x*

### Do I need to install all four LSE engines (quickjs, nodejs, lua, python)? How do I tell which engine a plugin needs?

No. Install only the engine for the plugins you use (`lip install LegacyScriptEngine#quickjs` / `#lua` / `#nodejs` / `#python`; without a variant, quickjs and lua are installed by default).

To tell which engine a plugin needs:

1. Look at the plugin's file extension (`.js` / `.lua` / `.py`).
2. JS plugins come in two kinds, QuickJS and Node.js. A plugin with a `package.json` (one that uses npm packages) is usually a Node.js plugin; otherwise it is most likely QuickJS.
3. The most reliable way is the `type` field in the plugin's `manifest.json` (`lse-quickjs`, `lse-nodejs`, `lse-lua`, `lse-python`) and the engine listed in `dependencies` (such as `legacy-script-engine-quickjs`).

If you install the wrong engine or miss one, the startup log also tells you which dependency is missing.

Note that the Python engine requires the matching version of Python to be installed on the machine (3.12.10 for LSE >=0.16.2).

*Applies to: all current versions (variant-style package names since LSE 0.10.0; latest 0.23.1)*

### When LSE loads a Node.js plugin, the automatic npm dependency install hangs or fails, and the plugin cannot load because `node_modules` is missing. What can I do? Also, why are `require`/`import` relative to the plugin directory while `fs` and `path.resolve` start from the BDS root directory?

When the Node.js engine loads a plugin whose `package.json` declares `dependencies` but whose directory has no `node_modules`, it automatically runs `npm install --omit=dev --no-fund` (using the `node_modules`/npm installed by lip in the `legacy-script-engine-nodejs` directory).

If `legacy-script-engine-nodejs` was not installed with lip (so npm is missing) or the install fails because of the network:

1. Go to the plugin directory that has the problem (`mods/<plugin name>/`, the directory containing `package.json`; newer LSE versions create a `plugins` link to `mods` in the BDS root directory), install Node.js yourself (<https://nodejs.org/> or `winget install OpenJS.NodeJS.LTS`), then run `npm i`. If the network is poor, switch to an npm mirror or use a proxy.
2. If a failed attempt left an incomplete `node_modules`, delete it and restart so that LSE installs the dependencies again automatically.
3. You can also reinstall the plugin.

About paths: under CommonJS, `__dirname` is set to the plugin directory, and module resolution also looks in the plugin directory and its `node_modules`. The process working directory, however, is the BDS root directory, so cwd-based operations such as `fs` reads and writes and `path.resolve` are relative to the BDS root directory. To access files inside the plugin, build an absolute path from `__dirname` (or `import.meta.url` in ESM).

*Applies to: LSE nodejs engine, current version (0.23.x)*

### Which directory does the plugin directory `/path/to/bedrock_dedicated_server/plugins` in the LSE documentation refer to?

It is the `plugins` folder in the BDS server root directory (the same directory as `bedrock_server_mod.exe`). The mod directory of current LeviLamina is `mods/` in the root directory. Since 0.23.0, LSE automatically creates a `plugins` link (junction) to `mods/` at startup, so you can put LLSE plugins in either `plugins/` or `mods/`. After startup they are migrated to `mods/<plugin name>/` and a `manifest.json` is generated, and they load after a restart.

Note: if the server root directory already contains a real `plugins` folder (for example left over from an old version), LSE does not create the link and reports the error `a file or directory with the same name already exists`. In that case, move the plugins in it to `mods/` and delete that `plugins` folder.

*Applies to: LSE 0.23.0 and later (current 0.23.x)*

### What files belong in the `plugins` directory of a LeviLamina + LegacyScriptEngine server? How do I handle downloaded .jar, .pdb, .dll, .js/.py/.lua files and archives?

Handle each file type as follows:

1. `.jar` files are Java Edition plugins and cannot be used.
2. `.pdb` files are debug symbol files; ordinary users do not need them.
3. A standalone `.dll` cannot be installed directly. A native LeviLamina mod needs the complete folder or archive with `manifest.json` provided by its author (or install it with lip).
4. Put a single `.js` / `.lua` / `.py` file directly into `plugins/` (since LSE 0.23.0 it is a link to `mods/`, so you can also put it in `mods/`). On first startup it is migrated to `mods/<plugin name>/` and a `manifest.json` is generated, and it only loads after a restart (the engine for that language must already be installed).
5. For an archive, check whether it contains a folder with a `manifest.json`; if so, put that whole folder into `mods/`. A Node.js plugin is a `.llplugin` package; just put it in and it is extracted automatically.
6. LegacyMoney (formerly LLMoney) is a dependency of LSE and is installed automatically when you install LSE with lip.
7. Remove prefixes such as `[minebbs]-` from the plugin file name, because the file name becomes the mod name.

*Applies to: LeviLamina current version; LSE 0.23.x*

### How do I install the LSE Python engine on LeviLamina?

Install the python variant of LSE with lip in the server root directory: `lip install github.com/LiteLDev/LegacyScriptEngine#python` (on the client, install it with LeviLauncher). The Python engine also requires the matching version of Python on the machine (Python 3.12.10 for LSE >=0.16.2). Few plugins use Python, so you can skip it unless you need it.

*Applies to: LSE 0.16.2 and later (current 0.23.x)*

### How do I package and publish a Node.js plugin written for LSE? What if it fails to load after packaging, installing, or `npm install`?

There are two ways:

1. The official `.llplugin` way: zip `package.json` and all source files, change the extension to `.llplugin` (do not include `node_modules`), and put it in the `plugins/` directory (`plugins` is a link to `mods`). At startup LSE extracts it to `mods/<plugin name>/` and automatically runs `npm install --omit=dev`. If the directory has no `manifest.json`, one is generated from the entry in `package.json`, and the plugin loads after a restart.
2. Publish it as a mod directory or lip package: put `manifest.json` (`entry` pointing to the entry js file, `name` matching the directory name, `type` set to `lse-nodejs`, and `legacy-script-engine-nodejs` in `dependencies`) and the source under `mods/<plugin name>/`. So that users who cannot reach npm are not blocked, you can ship `node_modules` too, and write a `lip.toml` so that it can be installed with lip.

If loading fails, first check that `entry` in `manifest.json` points to the correct entry file.

*Applies to: current LSE (0.23.x) nodejs engine*

### To use an LSE plugin such as SimpleTPS, must I install the Python version of LSE (with specific C++/Python versions)?

No. LSE is split into engine variants by language (`#quickjs`, `#nodejs`, `#lua`, `#python`), and you only need to install the one your plugin actually uses, for example `lip install github.com/LiteLDev/LegacyScriptEngine#quickjs` for a JS plugin. Running `lip install github.com/LiteLDev/LegacyScriptEngine` without a variant installs only the QuickJS and Lua engines, not the Python engine. Only the Python engine requires Python on the machine (3.12.10 for LSE >=0.16.2); you can remove an unused Python version of LSE with `lip uninstall`.

*Applies to: all current LSE versions (`lip.toml` variants)*

### Why does `legacy-script-engine-quickjs` fail to load?

A common cause is a wrong directory structure from manual extraction: a nested folder (`mods/legacy-script-engine-quickjs/legacy-script-engine-quickjs/...`), a missing `manifest.json`, or an empty folder. The release zip already contains a top-level `legacy-script-engine-quickjs/` directory, so make sure `manifest.json` sits directly in `mods/legacy-script-engine-quickjs/`. A manual installation also requires you to install its dependencies yourself (LegacyRemoteCall, LegacyMoney, iListenAttentively and a matching LeviLamina). Installing with `lip install github.com/LiteLDev/LegacyScriptEngine#quickjs` is recommended.

*Applies to: LeviLamina 1.x and later; current LSE*

### Do I need to install Node.js separately to use the LegacyScriptEngine nodejs engine?

Not to run it. `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs` automatically downloads `node-prebuilt.zip` (which contains libnode) into `mods/legacy-script-engine-nodejs/` and installs dependencies such as 7-zip. You only need to install Node.js yourself when you develop Node.js plugins on your machine (`npm init`, etc.).

*Applies to: current LSE nodejs engine*

### What are the steps to set up an environment from scratch for writing LeviLamina server plugins in JS? Do I need xmake/cmake/mingw?

You do not need xmake/cmake/mingw to run or write JS plugins (those are only for C++ mod development). The steps:

1. Download and install lip from <https://github.com/LiteLDev/lip/releases/latest> (`lip-<version>-win-x64.msi`).
2. On networks in mainland China, you can set a GitHub proxy: `lip config set github_proxy <proxy address>`.
3. Create a server directory, `cd` into it, and run `lip install LeviLamina --accept-eula` (this also installs the matching BDS).
4. Install the engine: `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs` (or `#quickjs`).
5. Start the server with `lip run` or by running `bedrock_server_mod.exe`.

Put the plugin in `mods/<plugin name>/` (`plugins/` is a link to `mods/`). It needs a `manifest.json` (`name` matching the directory name, `entry` set to the entry js file, `type` set to `lse-nodejs` or `lse-quickjs`, and `legacy-script-engine-nodejs` / `legacy-script-engine-quickjs` in `dependencies`) and the entry file. With Node.js, set `"type": "module"` in `package.json` to use ES modules. API documentation: <https://levimc.org/LegacyScriptEngine/>.

You can also download manually, but you must then supply the dependencies yourself (LegacyRemoteCall, LegacyMoney, iListenAttentively, 7-zip, node-prebuilt, etc.).

*Applies to: lip 0.41.x; LeviLamina 26.x; LSE 0.23.x*

### After skipping lip and installing the LSE NodeJS engine manually, loading a (`.llplugin`) plugin reports a decode/extract failure. What can I do?

`7za.exe` is missing. The LSE nodejs engine calls `7za.exe` to extract `.llplugin` files. When lip installs the `#nodejs` variant, it puts `7za.exe` into the server root directory automatically through the dependency `github.com/LiteLDev/7-zip-tooth`. With a manual installation, get `7za.exe` from that repository yourself and put it in the server root directory (you do not need to run it). Also, libnode should be in `mods/legacy-script-engine-nodejs/` (from `node-prebuilt.zip`), not in the server root directory. Installing with `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs` is recommended.

*Applies to: current LSE nodejs engine (manual installation)*

### After installing a Lua plugin such as iLand on LeviLamina, it does not load at all and the console shows no error. How do I fix it?

Usually the script engine for that language or a library the plugin depends on is not installed, or the plugin files are incomplete. Install the Lua engine with lip in the server root directory: `lip install LegacyScriptEngine#lua` (`lip install LegacyScriptEngine` without a variant installs both the QuickJS and Lua engines); lip handles the dependencies automatically. The startup log should show the Lua engine being loaded. If the plugin was installed incompletely, run `lip cache clean` to clear the cache and then reinstall the plugin.

*Applies to: LSE 0.23.x / lip 0.41.x (current version)*

### Installing the LSE nodejs engine with lip on a LeviLamina server for an older BDS (such as 1.21.70) reports a dependency conflict. How do I install the matching version?

Without a version number, lip installs the latest LSE by default, and the LeviLamina version it depends on conflicts with the older server. Specify the LSE version that matches your server with the syntax `<repo>#<variant>@<version>` (the variant goes before the `@`), for example `lip install github.com/LiteLDev/LegacyScriptEngine#quickjs@0.11.3` (the BDS 1.21.70 / LeviLamina 1.2.x era). Check the LSE CHANGELOG for the LeviLamina versions each release supports to choose one.

Since LSE 0.10.0, variants are written as `#nodejs`; the `legacy-script-engine-nodejs` package name in old documentation dates from before 0.10.0.

Note: in LSE 0.13.x and earlier, the nodejs variant in `tooth.json` downloads node through an `uncompressed` type resource. Current lip (since v0.38, reading `tooth.json` does not support `uncompressed`) concludes that the version has no nodejs variant and cannot install it. For the nodejs engine of such old versions, install with lip v0.37.0 or earlier, or manually download the `legacy-script-engine-nodejs` package from the matching GitHub Release and extract `node-prebuilt.zip` into its directory. Since LSE 0.14.0 the nodejs variant uses a zip resource and installs normally with current lip.

*Applies to: LSE 0.10.0 and later; current lip 0.41.x*

### What should I know when installing the LSE Python and NodeJS engines?

Every engine is now a variant of the LegacyScriptEngine package, so install with lip: `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs` / `#python` (and likewise `#quickjs`, `#lua`). lip handles the dependencies automatically (the NodeJS variant also downloads the prebuilt node runtime into the `legacy-script-engine-nodejs` directory).

The Python engine requires the matching version of Python on the machine that runs it: 3.12.10 for LSE >=0.16.2, 3.12.8 for >=0.9.0 \<0.16.2, and 3.10.11 for \<0.9.0. The engine looks for `Lib`/`DLLs`/`site-packages` in directories on `PATH` whose names contain Python, so add that Python to `PATH` when you install it.

*Applies to: LSE 0.23.x (the Python version table applies to all versions)*

## Configuration

### Where does the `manifest.json` of an LSE script plugin go under LeviLamina and how do I write it (what goes in `type`)? What if it reports an unknown type or the plugin isn't recognized? What if an old plugin's own custom `manifest.json` conflicts? How do I load manually with `ll load`?

Every mod/plugin must have a manifest that follows the LeviLamina specification at `plugins/<plugin folder>/manifest.json` (the server's mod root directory is `plugins/`). It must contain at least `name` (the same as the folder name), `entry` (the entry file) and `type`. You can use `dependencies` / `optionalDependencies` / `loadBefore` to control dependencies and load order.

Values for `type`:

- `native` for native C++ mods
- `lse-quickjs` for QuickJS plugins
- `lse-lua` for Lua
- `lse-nodejs` for Node.js
- `lse-python` for Python (`entry` is `__init__.py`)

You must also install the matching LSE engine (for example `lip install LegacyScriptEngine#quickjs`); otherwise nothing handles that `type` and the plugin is not recognized.

The manifest cannot use a custom format. If an old plugin also uses a file named `manifest.json` for its own purposes, rename it or change it to a compatible format. The lazy approach is to drop a single `.js` or similar file into the root of `plugins` and start the server once; LSE migrates it automatically and generates the manifest, and you restart as prompted.

To load manually, use the console command `ll load <plugin folder name>`.

Manifest format documentation: <https://levimc.org/LeviLamina/api_reference/mod/>

*Applies to: LeviLamina 1.x and later, with the matching LSE (including LeviLamina 26.60.x / LSE 0.23.x)*

### Player info query interfaces in LSE such as `data.name2xuid` return empty or nothing (especially for players who joined before). Is the interface broken?

The interfaces are not broken. These interfaces (`data.name2xuid`, `data.xuid2name`, `data.name2uuid`, `data.getAllPlayerInfo`, `data.fromName` and so on) depend on LeviLamina's PlayerInfo service. By default the service does not start with the server and is enabled only when a plugin calls it, so players who joined earlier are not recorded and queries return empty.

Fix: in the LeviLamina config file (`mods/LeviLamina/config/Config.json`), set `alwaysLaunch` to `true` under `targeted.playerInfo`, then restart the server. Players who join afterwards will be recorded.

*Applies to: LeviLamina server (still applies to current 26.60.x); LSE*

### In the `manifest.json` of an LSE Node.js plugin, `entry` was written as an absolute path (for example pointing to drive E), and the plugin fails to load on another server. What is the correct form?

`entry` should be a path relative to the plugin (mod) directory (usually just the entry script's file name), not an absolute path. When loading, LSE builds the entry path as `mod directory / entry`, an absolute path takes effect as is, and the file can't be found on another machine.

Example:

```json
{
  "entry": "LLSE-FakePlayer.js",
  "name": "LLSE-FakePlayer",
  "type": "lse-nodejs",
  "dependencies": [ { "name": "legacy-script-engine-nodejs" } ]
}
```

Note: when LSE automatically migrates a Node.js plugin package (`.llplugin`), the `entry` in the generated `manifest.json` is the normalized absolute path resolved from the `main` field of `package.json` (or empty if resolution fails). This is the common source of an `entry` that becomes a local absolute path. After migration, check it and change it to a relative path by hand.

*Applies to: LeviLamina 1.x and later; LSE 0.23.x (current version)*

### Is it a problem if the LSE engines (quickjs, nodejs, lua, python) are at different versions?

Yes. The LSE engines must all be at the same version. The engines are now variants of the same LegacyScriptEngine package (`#quickjs`, `#lua`, `#nodejs`, `#python`), so their versions stay in sync when you install or upgrade with lip, and they share the same version range of LeviLamina, LegacyRemoteCall, LegacyMoney and iListenAttentively.

### Under LeviLamina, an LSE plugin (such as one that depends on the nodejs engine or on LegacyRemoteCall/GMLIB) isn't recognized or doesn't load, with the error "无法识别的模组类型：lse-nodejs" (unrecognized mod type: lse-nodejs). What should I do?

This error means that the corresponding engine (`legacy-script-engine-nodejs`) was not yet loaded, or is not installed, when this plugin was loaded. LeviLamina orders loading by the dependencies in `manifest.json`, so the `manifest.json` in the plugin directory must declare `dependencies`; for example, a plugin that depends on `legacy-script-engine-nodejs` or LegacyRemoteCall must declare that dependency. Without declared dependencies you can only rely on the default order (sorted by name) and hope. `manifest.json` also supports fields such as `optionalDependencies`, `conflicts` and `loadBefore`.

Also confirm that you installed the matching engine variant with lip.

*Applies to: LeviLamina 1.x and later (current 26.60.x)*

### When using LSE plugins on LeviLamina, do I still need to install the LL2 PAPI (PlaceholderAPI) separately?

No. The LL2 PAPI cannot be used on LeviLamina. The third-party library GMLIB has built-in PAPI functionality, so for plugins that depend on PAPI, just install GMLIB.

*Applies to: LeviLamina; third-party GMLIB. Not confirmed against the source code or the documentation: treat it as a pointer.*

### I installed the OneTitle title plugin on a LeviLamina + LSE server and the plugin is loaded, but titles do not show in players' chat messages. What should I do?

OneTitle only exports an API/PAPI and does not change the chat format, so you need to pair it with a chat-format plugin. For example, with ChatFormatter (which requires GMLIB), add the PAPI placeholder provided by OneTitle (such as `%onetitle%`) to the chat format in its configuration.

*Applies to: Third-party plugins OneTitle / ChatFormatter / GMLIB. Not confirmed against the source code or the documentation: treat it as a pointer.*

### I don't use the Lua/Python engines or LegacyMoney (formerly LLMoney). Can I disable them to start faster and save resources?

You can remove script engines you don't need: each LSE engine is a separate mod directory (`mods/legacy-script-engine-quickjs`, `mods/legacy-script-engine-lua`, `mods/legacy-script-engine-python`, `mods/legacy-script-engine-nodejs`), so just delete the directory of the one you don't use.

With lip, a variant that was installed on its own can be removed with `lip uninstall` (for example `lip uninstall LegacyScriptEngine#python`). However, the default install (`lip install LegacyScriptEngine` without a variant) installs both QuickJS and Lua, which are dependencies of the default variant, and lip does not uninstall a dependency that is still needed. To keep only one engine, uninstall LegacyScriptEngine and install a single variant instead (for example `lip install LegacyScriptEngine#quickjs`).

LegacyMoney, however, cannot be removed: in the current version LegacyMoney is a required dependency of LSE (`dependencies` in `manifest.json` lists LegacyMoney, LegacyRemoteCall and iListenAttentively). If you delete it, LeviLamina refuses to load every LSE engine because of a missing dependency (`MissingDependency`).

*Applies to: LegacyScriptEngine 0.23.x (LeviLamina 26.60.x) and the current version*

### After installing the BehaviorLog (behavior log) LSE plugin, the console keeps printing command block execution logs. How do I turn that off?

Open BehaviorLog's configuration file `./plugins/BehaviorLog/config.json`, find the `onCmdBlockExecute` entry and change the `true` in it to `false` (for a numeric entry, change `1` to `0`). Save, then restart the server (or reload the plugin). For plugin documentation see <https://www.minebbs.com/threads/behaviorlog.7759/>

*Applies to: Third-party LSE plugin BehaviorLog; the exact config path and key names depend on the plugin version you use. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Versions and compatibility

### The latest LSE won't install on an older LeviLamina or reports missing dependencies (for example, it asks for a newer LeviLamina). How do LSE and LeviLamina versions correspond, and how do I install an older LSE?

LSE version numbers are not the same as LeviLamina's, but each LSE version is compatible only with a specific range of LeviLamina, and a new LSE cannot be used on an older LL (for example, the current LSE 0.23.x requires LeviLamina 26.60.*).

To look up the correspondence, check the `github.com/LiteLDev/LeviLamina` version range in the dependencies of `lip.toml` (`tooth.json` for 0.23.1 and earlier) in the commit of the LSE release tag, or look for "Adapted to LeviLamina xx" entries in the CHANGELOG.

For an older LL, use lip to install the matching older LSE version, with the variant before the `@`, for example `lip install LegacyScriptEngine#quickjs@0.13.2`. lip installs the matching LegacyRemoteCall, LegacyMoney and so on according to the dependencies declared by that version. You can also download the matching older version from each project's GitHub Releases and install it manually. Third-party native prerequisites such as GMLIB likewise must be the versions that match your current LeviLamina/BDS version.

Historical example: LeviLamina 0.13.x (BDS 1.21.2/1.21.3) corresponds to LSE 0.8.20 (the package names at that time were `gitea.litebds.com/LiteLDev/legacy-script-engine-*`).

*Applies to: current version (LSE 0.10.0 and later can be installed as `LegacyScriptEngine#<variant>@<version>`; earlier versions use the old gitea package names)*

### After installing the latest LSE on BDS 26.20 (LeviLamina 26.20.x), it doesn't work and LSE plugins don't load. Which LSE version should I install?

Each LSE version targets only one LeviLamina minor series and cannot be used across versions. The latest LSE 0.23.x targets LeviLamina 26.60.* (BDS 26.60) and cannot run on 26.20. LeviLamina 26.20.x corresponds to LSE 0.19.x; install the last version of that series, LSE 0.19.7.

Version correspondence:

- 0.19.x → LL 26.20.*
- 0.20.0 → LL 26.32.*
- 0.21.x → LL 26.40.*
- 0.22.x → LL 26.51.*
- 0.23.x → LL 26.60.*

Check the "Adapted to LeviLamina xx" entries in the LSE CHANGELOG to confirm which LL a version targets.

*Applies to: LeviLamina 26.20.x; LSE 0.19.x to 0.23.x (the version-matching principle applies to the current version)*

### After LeviLamina updates to a new BDS version, LSE reports many fatal errors or says the mod version is too old, and no JS plugins run. What should I do?

LSE has not yet been adapted to the new LeviLamina, and the old LSE cannot load. You can wait for LSE to release an official adapted version and upgrade together, or keep LeviLamina at the version that matches your current LSE.

If you are in a hurry, log in to GitHub and download the latest build artifact from <https://github.com/LiteLDev/LegacyScriptEngine/actions> for temporary use. Plugins that depend on third-party prerequisite libraries such as GMLIB also have to wait until those libraries are adapted.

*Applies to: current version (happens every time LeviLamina follows a new BDS version)*

### After updating GMLIB, an LSE plugin that calls GMLIB interfaces (such as `GMLIB_API::getServerAverageTps`) through GMLIB-LegacyRemoteCallApi reports that the interface doesn't exist or fails, though it worked before. What is the cause?

The new GMLIB-LegacyRemoteCallApi (LRCA) is marked passive in its manifest: it is not loaded unless some plugin depends on it in its manifest (you can confirm with `ll show GMLIB-LegacyRemoteCallApi`).

Fix: in the calling plugin's `manifest.json`, add `GMLIB-LegacyRemoteCallApi` to `dependencies` (a required dependency) or to `optionalDependencies` (an optional dependency; the plugin still loads if it isn't installed). If the code is a submodule referenced by a host plugin and has no manifest of its own, add the dependency to the host plugin.

At runtime, you can use `ll.getAllPluginInfo().some(p => p.name === "GMLIB-LegacyRemoteCallApi")` to check whether it is loaded, and when it isn't, tell the user to install GMLIB and LRCA. Some interfaces don't exist in older LRCA versions, so you may also need to check the version.

If the error comes from GMLIB itself (such as `bad optional_ref access`), it is a GMLIB bug, not an LSE problem. Update to a GMLIB version that has fixed it, or report it to its author.

*Applies to: LeviLamina 1.x and later; GMLIB / GMLIB-LegacyRemoteCallApi (third-party). Not confirmed against the source code or the documentation: treat it as a pointer.*

### An LSE plugin that sends packets itself with `BinaryStream` to refresh signs stopped working after a server version update. How do I change it?

In the new protocol, the way the y coordinate of a block position is written has changed: with protocol version >= 944 the y coordinate must use `writeVarInt` (signed), while older versions use `writeUnsignedVarInt`.

Example:

```js
bs[mc.getServerProtocolVersion() >= 944 ? "writeVarInt" : "writeUnsignedVarInt"](pos.y);
```

*Applies to: BDS protocol version 944 and later (observed from LSE 0.18.4). Not confirmed against the source code or the documentation: treat it as a pointer.*

### Which version of Node.js is built into the LegacyScriptEngine NodeJS engine (`legacy-script-engine-nodejs`)?

Node.js v22.12.0. When LSE installs the nodejs variant through lip, it also downloads the v22.12.0 prebuilt package of LiteLDev/node (`node-prebuilt.zip`), and the ScriptX V8 backend is also built on node v22.12.0.

*Applies to: LSE 0.9.0 and later (currently v0.23.1)*

### The LSE nodejs engine fails to load with the access violation `Raw Seh Exception: [0xC0000005:ntstatus]` (for example `legacy-script-engine-nodejs` fails to load). How do I fix it?

All LSE engines (quickjs, lua, nodejs, python) must be the same version, otherwise it will crash; for example, lua 0.18.0 with nodejs 0.18.2 fails. Update or reinstall all installed engines to the same version, for example `lip install LegacyScriptEngine#nodejs` (keeping it at the same version as the installed `#quickjs` and `#lua`). If you don't need nodejs plugins, you can also just uninstall the nodejs engine.

LeviLamina must also be updated to the version that this LSE version requires (for example, LSE 0.23.x requires LeviLamina 26.60.*).

*Applies to: current version (LSE 0.23.x corresponds to LeviLamina 26.60.\*)*

### The LSE API for getting player latency (`player.getDevice().avgPing` / `lastPing`) works on 26.20 but returns nothing on 26.51. What is the cause?

The server may be using the NetherNet protocol, which makes the relevant network statistics unavailable. Try switching the server to RakNet.

*Applies to: BDS 26.51 and later (speculative answer). Not confirmed against the source code or the documentation: treat it as a pointer.*

### Is the LSE Python engine still recommended? Will the LSE JS/Lua engines stop being maintained?

The JS (QuickJS, Node.js) and Lua engines will continue to be maintained.

The Python engine is still available as the `LegacyScriptEngine#python` variant (`lip install LegacyScriptEngine#python`), but you must install Python on the machine first (LSE >=0.16.2 requires Python 3.12.10), and it has known issues such as threading/asyncio being unavailable. The maintainers recommend that users who need the Python plugin ecosystem switch to LeviStone (which runs Endstone Python plugins on LeviLamina).

*Applies to: current version (LSE 0.23.x)*

### After upgrading to a new LeviLamina (such as 26.10), LSE fails to load because the LSE release hasn't been adapted to the new version yet. How can I use it early?

Before the LSE release comes out, you can download a build artifact from a successful (green) run of the `build.yml` workflow on GitHub Actions (<https://github.com/LiteLDev/LegacyScriptEngine/actions>); you must be logged in to GitHub. Artifacts are named `<repository>-<commit>-<server|client>-<engine>-windows-x64`. For a server, pick the `server` package for the engine you need (nodejs/quickjs/lua/python).

The NodeJS engine also needs the node runtime (<https://github.com/LiteLDev/node/releases/download/v22.12.0/node-prebuilt.zip>, extracted to `mods/legacy-script-engine-nodejs/`), and the release nodejs variant additionally depends on 7-zip-tooth.

The dependencies LegacyMoney, LegacyRemoteCall and iListenAttentively can be installed with lip (`lip install github.com/LiteLDev/LegacyMoney` and so on). However, their releases are likewise locked to a LeviLamina minor series (currently 26.60.*). If lip reports a conflict with the new LeviLamina, you also need to download builds adapted to the new version from each repository's Actions.

*Applies to: current version (transition period while the LSE release is not yet adapted to the latest LeviLamina)*

### After upgrading the server from BDS 1.21.93 to 1.21.124, LSE prints a lot of red text when loading and plugins such as BackupHelper don't work, with errors involving LegacyParticleAPI. How do I fix it?

First make sure your plugins are updated to versions that support the new version (for example BackupHelper 0.9.1 is not compatible and must be updated to 0.14.0). LegacyParticleAPI was a dependency of old LSE versions and has been removed since LSE 0.15.0, so simply uninstall or delete LegacyParticleAPI.

If the red text when loading the map is caused by upgrading a world from an older version, it generally does not affect use.

*Applies to: LSE 0.15.0 and later (when upgrading from older versions)*

### Returning old LXL (LiteXLoader/LLSE) plugin developer: is LXL still used? Are multiple dimensions supported? Does the old plugin style still work?

LXL/LiteLoaderBDS is no longer used. The current solution is LeviLamina + LegacyScriptEngine (LSE, the continuation of the LLSE script engine).

LSE keeps the same LLSE API, so old LLSE plugins run with almost no changes (some plugins may not work properly because of differences such as event timing). Put the old plugin in `plugins/` and start the server; LSE migrates it automatically and generates a `manifest.json`, and it loads after a restart.

For multiple dimensions, the LeviLamina ecosystem has the MoreDimensions library (`lip install github.com/LiteLDev/MoreDimensions`), which provides a custom dimension API. It does not add dimensions itself; you need mods that use its API.

*Applies to: LeviLamina 26.60.x; LSE 0.23.x (current version)*
