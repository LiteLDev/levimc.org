# Plugins and engines

This page explains what a script plugin is to LeviLamina and LSE: where it lives, how its manifest picks the engine
that runs it, what happens when it is loaded and unloaded, and how plugins written for LLSE become LeviLamina plugins.

## A plugin is a mod

LeviLamina loads mods from the `mods` folder of the server. Each mod is a folder with a `manifest.json`. A C++ mod
has the type `native`; a script plugin has the type of the engine that runs it:

| `type` in `manifest.json` | Engine | Engine mod |
|---|---|---|
| `lse-quickjs` | JavaScript (QuickJS) | `legacy-script-engine-quickjs` |
| `lse-lua` | Lua | `legacy-script-engine-lua` |
| `lse-nodejs` | JavaScript (Node.js) | `legacy-script-engine-nodejs` |
| `lse-python` | Python | `legacy-script-engine-python` |

Each engine is a LeviLamina mod of its own, installed by one variant of the `LegacyScriptEngine` package (`#quickjs`,
`#lua`, `#nodejs`, `#python`; see [Language support](../apis/LanguageSupport.md)). When it loads, it registers itself
with LeviLamina as the manager of its plugin type, and LeviLamina hands it every mod of that type.

A minimal plugin for the QuickJS engine:

```
mods/
    MyPlugin/
        manifest.json
        main.js
```

```json
{
    "entry": "main.js",
    "name": "MyPlugin",
    "type": "lse-quickjs",
    "dependencies": [
        {
            "name": "legacy-script-engine-quickjs"
        }
    ]
}
```

- `entry` is the script the engine runs, relative to the plugin's folder.
- `name` is the plugin's name. Keep it the same as the folder.
- `type` says which engine runs it.
- `dependencies` lists the mods that must be loaded first. Name the engine here, so that it is loaded before the
  plugin. A plugin that needs another plugin names it too: the plugin it depends on is loaded first, so its event
  listeners are also registered, and called, first.

[Your first script plugin](https://levimc.org/tutorials/develop/first-script-plugin/) walks through this layout.
A Node.js plugin also has a `package.json`, and a Python plugin a `pyproject.toml`; see
[Language support](../apis/LanguageSupport.md).

### `plugins` and `mods`

Every engine, when it loads, makes `plugins` in the server folder a link to `mods` (a directory junction on Windows),
so `plugins/MyPlugin` and `mods/MyPlugin` are the same folder. If `plugins` already exists and is not the same folder
as `mods`, LSE logs an error and leaves it as it is.

## One engine instance per plugin

Each plugin runs in a script engine instance of its own, named after the plugin. When LSE loads a plugin, it:

1. for Node.js, runs `npm install --omit=dev` in the plugin's folder if its `package.json` has dependencies and there is
   no `node_modules` folder yet; for Python, runs `pip install` into the plugin's `site-packages` folder if that folder
   does not exist yet and the plugin lists dependencies;
2. creates a new engine instance and a logger named after the plugin;
3. binds the API (`mc`, `ll`, `log` and the rest: see [How the API works](script_api.md));
4. runs the engine's base library (QuickJS, Lua and Python);
5. runs the entry script.

Because every plugin has its own instance, plugins do not share global variables. To call a function of another
plugin, export it with `ll.exports` and import it with `ll.imports` (see the [ll API](../apis/ScriptAPI/Ll.md)).

If the entry script throws, the plugin is not loaded: the console shows the error and its stack trace, and the
event listeners, timers and exported functions the script registered before the error are removed.

### Loading while the server runs

A plugin can be loaded after the server has started, for example with LeviLamina's `ll reload <plugin name>`. Its
`onServerStarted` listener is then called right away, and its `onPreJoin` and `onJoin` listeners once for every
player online, so a plugin that sets things up in those events works the same as at startup.

### Unloading

When a plugin is unloaded while the server runs, its `onLeft` listener is called for every player online, then the
functions registered with `ll.onUnload`. Then LSE removes the plugin's timers, event listeners and exported functions
and releases its engine instance. Commands the plugin registered with `mc.newCommand` stay in the game, without their
callback, until the server restarts.

### On the client

In the Minecraft client on Windows, the scripts of the plugins run only while a local world runs (a single-player world
acts as a local server): they start when its server has started and stop when it stops. Scripts do not run when you
join someone else's server.

## Plugins written for LLSE

LLSE plugins were single files dropped into `plugins/`. When an engine loads, it looks for such files in `mods/` (and so
in `plugins/`):

| Engine | Files it migrates |
|---|---|
| QuickJS | `*.js` |
| Lua | `*.lua` |
| Python | `*.py` |
| Node.js | `*.llplugin` (a zip archive) |

For each file, it creates the folder `mods/<file name without extension>/`, moves the file into it (Node.js: extracts
the archive into it and deletes the archive) and writes a `manifest.json` there unless one exists: the file is the entry
(Node.js: the entry script found in the archive), the file name the plugin's name, the engine its type and its
dependency. Then it logs that the plugins were migrated and must be loaded by a restart:
restart the server once more to run them.

If the folder already holds a file of that name, migration fails with an error. To turn migration off, set
`migratePlugins` to `false` in the engine's configuration.

## The engine's configuration

Each engine reads `config/config.json` in its own mod folder (for example
`mods/legacy-script-engine-quickjs/config/config.json`) and writes it with the defaults when it is missing:

| Key | Default | Meaning |
|---|---|---|
| `version` | `3` | The version of the file's format. |
| `migratePlugins` | `true` | Migrate LLSE plugins at startup (above). |
| `debugCommandLevel` | game directors (operators) | Who may run the engine's debug command (`jsdebug`, `luadebug`). |
| `fixLegacyAddons` | not set | Node.js only: fix native addons built with node-gyp older than 11.1.0. |
