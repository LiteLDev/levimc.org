# How the API works

The API of LSE is the same in every language: the [reference](../apis/README.md) describes it once, and each engine
maps it to its language. This page explains its shape: what a script finds in its global scope, what the objects it
gets are, and when the engine calls the functions it gives.

## What a script starts with

LSE binds the API into the global scope of every plugin before it runs the entry script. You do not import or
`require` it.

Global functions:

- `log`, `colorLog` and `fastLog` write to the server console; `setTimeout`, `setInterval` and `clearInterval` run
  code later (see [Script helper API](../apis/ScriptAPI/ScriptHelp.md)). The Node.js engine uses Node.js's own
  `setTimeout` and `setInterval` instead.

Namespaces, objects with static functions:

| Name | What it is about | Reference |
|---|---|---|
| `mc` | The game: events (`mc.listen`), commands, players, entities, blocks, items, forms, the scoreboard | [GameAPI](../apis/GameAPI/Basic.md), [EventAPI](../apis/EventAPI/Listen.md), [GuiAPI](../apis/GuiAPI/FormBuilder.md) |
| `ll` | The loader and the plugins: versions, plugin information, `ll.exports` / `ll.imports`, `ll.onUnload` | [ll](../apis/ScriptAPI/Ll.md) |
| `logger` | A configurable log of the plugin | [Logger](../apis/ScriptAPI/Logger.md) |
| `data` | Data helpers: player data, JSON, MD5, SHA-1, Base64 | [Other data](../apis/DataAPI/OtherData.md) |
| `money` | The economy | [Economy](../apis/DataAPI/Economy.md) |
| `File` | Files and folders | [File](../apis/SystemAPI/File.md), [File system](../apis/SystemAPI/FileSystem.md) |
| `network` | HTTP requests (WebSocket clients and HTTP servers are the objects `WSClient` and `HttpServer`) | [Network](../apis/SystemAPI/Network.md) |
| `system` | System commands, processes and system information | [System call](../apis/SystemAPI/SystemCall.md), [System info](../apis/SystemAPI/SystemInfo.md) |
| `NBT` | Parsing NBT, and the NBT tag types | [NBT](../apis/NbtAPI/NBT.md) |
| `i18n` | Translations of the plugin's texts | [i18n](../apis/ScriptAPI/i18n.md) |
| `Format` | The formatting codes of Minecraft text | [Game utilities](../apis/GameAPI/GameUtils.md) |

Enumerations, such as `PermType` and `ParamType` for [commands](../apis/GameAPI/Command.md), are globals too.

## Objects

Most of the API works through objects. You get them in two ways:

- **From the game**, as values the API returns or passes to your functions: a `Player` from `mc.getPlayer` or from an
  `onJoin` listener, an `Entity`, a `Block`, an `Item`, a `Container`, a `CommandOrigin` in a command callback.
- **By creating them** with a constructor: `new JsonConfigFile(path)`, `new KVDatabase(dir)`, `new DBSession(type,
  params)`, `new WSClient()`, `new IntPos(x, y, z, dimid)`, `new NbtCompound(...)`. In Lua, call the class without
  `new`: `JsonConfigFile(path)`.

The reference names these types `Player`, `Entity`, `Block` and so on; the classes registered in the engine are named
`LLSE_Player`, `LLSE_Entity`, `LLSE_Block`, …, as the Data Types section of the [overview of the reference](../apis/README.md)
lists.

### Players and entities are references, not copies

A `Player` or `Entity` object refers to the player or entity in the game: its properties are read when you access
them, and its functions act on the game. It holds a weak reference: once the player has left, or the entity is gone,
its properties return `Null`. So do not keep `Player` objects for a long time. Keep what identifies the player
(`pl.xuid`, `pl.name`) and get the object again with `mc.getPlayer` when you need it.

### Values and types

The reference uses general type names (`Integer`, `Float`, `String`, `Boolean`, `Array`, `Object`, `Null`, …), which
each engine maps to its own types: an `Object` is a JavaScript object and a Lua table, `Null` is `null` or `undefined`
in JavaScript and `nil` in Lua. The [overview of the reference](../apis/README.md) has the full table and
the conventions of the pages: `name : Type` for a parameter, `[ ]` around optional parameters.

Many functions return `Null` when they fail (a player that is not online, a form that could not be sent): check the
value before you use it. Some, such as those of the SQL database, throw an error instead.

## When your code runs

The engine runs your entry script once, when the plugin is loaded. Everything else your plugin does happens in the
functions it gives to the API:

- **event listeners** (`mc.listen`), called each time the event happens;
- **command callbacks** (`mc.newCommand`, `mc.regPlayerCmd`, `mc.regConsoleCmd`), called when someone runs the
  command;
- **form callbacks** (`pl.sendForm`, `pl.sendModalForm`), called when the player answers the form or closes it;
- **timers** (`setTimeout`, `setInterval`), called when their time has come;
- **unload functions** (`ll.onUnload`), called when the plugin is unloaded.

These functions run on the server's thread, between the game's own work. A function that takes long
holds up the server: keep listeners short, and avoid heavy work in frequent events such as `onTick`.

If your function throws, LSE catches the error and logs it in the console with the event or callback and the name of
your plugin; the plugin keeps running. A call to the API with too few arguments or an argument of the wrong type
throws an error that names the API and your plugin.

### Events go to every listener

When an event happens, LSE calls the listeners of every plugin for it, in the order they were registered (in general
the order the plugins were loaded). A listener that returns `false` intercepts the event: the game does not process
it, as if it had not happened, but the other plugins' listeners are still called. See
[Event listening](../apis/EventAPI/Listen.md).

## Next

- [Plugins and engines](plugins.md): how a plugin is loaded and unloaded.
- [Language support](../apis/LanguageSupport.md): what differs between the engines.
- The guides: [listening to events](../guides/events.md), [registering commands](../guides/commands.md),
  [showing forms](../guides/forms.md), [storing data](../guides/storing_data.md) and
  [logging and timers](../guides/logging_and_timers.md).
