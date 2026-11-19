# LegacyScriptEngine

A plugin engine for running LLSE plugins on LeviLamina: write plugins for a Minecraft Bedrock server in JavaScript,
Lua or Python instead of C++.

## What LegacyScriptEngine is

LegacyScriptEngine (LSE) is a [LeviLamina](https://levimc.org/LeviLamina/) mod that runs plugins written in a
script language instead of C++. It carries on the script engine of LiteLoaderBDS (LLSE): plugins written for LLSE run
on LeviLamina with little or no change, and new plugins use the same API, documented on this site.

LSE runs on Bedrock Dedicated Server and in the Minecraft client on Windows. Like every LeviLamina mod, it is
installed with [lip](https://levimc.org/lip/) on a server and with [LeviLauncher](https://levimc.org/LeviLauncher/)
on the client: see [Install mods on your server](https://levimc.org/tutorials/server/install-mods/).

With LSE you get:

- **Four script engines**: Lua, QuickJS, Node.js and Python, each installed with lip as its own package variant (see
  [Language support](apis/LanguageSupport.md)).
- **LLSE plugins that keep running**: put LLSE plugins in `plugins/` and start the server; they are migrated
  automatically and get a LeviLamina mod manifest (see [Plugins and engines](concepts/plugins.md)).
- **The LLSE API**: events, players, blocks, items, NBT, forms, files, network and more (see the
  [API reference](apis/README.md)).

## A plugin in a few lines

A plugin is a folder in `mods/` (or `plugins/`, the same folder) with a script and a `manifest.json` that names the
engine to run it. This one, in JavaScript, greets every player who joins and adds a console command:

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

```js
log("MyPlugin is running!");

mc.regConsoleCmd("greet", "Greets someone from the console", (args) => {
    log(`Hello, ${args[0] ?? "world"}!`);
});

mc.listen("onJoin", (player) => {
    player.tell(`Welcome, ${player.name}!`);
});
```

Start the server and the console shows `MyPlugin is running!`; type `greet Steve` and it answers `Hello, Steve!`.
[Your first script plugin](https://levimc.org/tutorials/develop/first-script-plugin/) builds this plugin step by
step, from installing the engine to seeing it in the game.

## Engines

Each language has its own engine, installed as a variant of the `LegacyScriptEngine` package. One API serves all of
them, so the reference applies to every language (see [Language support](apis/LanguageSupport.md) for what differs).

| Variant | Language | Engine |
|---|---|---|
| `#lua` | Lua | CLua |
| `#quickjs` | JavaScript | QuickJS, with ES modules |
| `#nodejs` | JavaScript | Node.js, with npm packages |
| `#python` | Python | CPython, with pip packages |

The Python engine needs Python on the machine it runs on:

| LSE version | Python version |
|---|---|
| >=0.16.2 | 3.12.10 |
| >=0.9.0 <0.16.2 | 3.12.8 |
| <0.9.0 | 3.10.11 |

On the client, releases up to 0.23.1 name the variants `#client_lua`, `#client_quickjs`, `#client_nodejs` and
`#client_python`; LeviLauncher picks the right build for you.

## Start here

- [Install mods on your server](https://levimc.org/tutorials/server/install-mods/): install LegacyScriptEngine (and
  other mods) on a LeviLamina server with lip.
- [Your first script plugin](https://levimc.org/tutorials/develop/first-script-plugin/): write a plugin, load it
  and see it run.

Already have LLSE plugins? Put them in `plugins/` and start the server: they are migrated automatically and get a
LeviLamina mod manifest (`manifest.json`). Restart the server to load them.

## On this site

- **Guides**: how to do one thing in a plugin, step by step: [listen to events](guides/events.md),
  [register commands](guides/commands.md), [show forms](guides/forms.md), [store data](guides/storing_data.md), and
  [log and schedule](guides/logging_and_timers.md).
- **Concepts**: [plugins and engines](concepts/plugins.md) (the manifest, loading, migration),
  [language support](apis/LanguageSupport.md) (what differs per engine) and [how the API works](concepts/script_api.md)
  (globals, objects, callbacks).
- **Reference**: [every API](apis/README.md) of LSE: events, players, blocks, items, NBT, forms, files, network
  and more. For editor hints and project scaffolding, see
  [legacy-script-engine-api](https://github.com/LiteLDev/legacy-script-engine-api).
- **Questions**: the [LegacyScriptEngine FAQ](https://levimc.org/faq/scripts/lse/basics/), with the questions of every
  LeviMC project.

LegacyScriptEngine is open source: see its [repository](https://github.com/LiteLDev/LegacyScriptEngine) and
[how to contribute](https://github.com/LiteLDev/LegacyScriptEngine/blob/develop/CONTRIBUTING.md) (issues,
translations, pull requests).

## License

GPL-3.0-or-later © LeviMC
