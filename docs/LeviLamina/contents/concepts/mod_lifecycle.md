# Mod Lifecycle

This page explains how LeviLamina finds the mods of a server or client, in which order it loads them, and when it
calls a mod's `load`, `enable`, `disable` and `unload`. The classes and fields named here are listed on the
[Mod](../api_reference/mod.md) page.

## The Four Steps

A mod goes through four steps. Each one calls a callback of the mod; a callback that returns `false` stops the step,
and LeviLamina logs why.

| Step | When it happens | Callback | After it |
|------|-----------------|----------|----------|
| **Load** | At startup, for every mod that should run; at runtime with `/ll load` | `load()` | The mod is loaded and disabled |
| **Enable** | When the game has started; right after loading if the game is already running | `enable()` | The mod is enabled |
| **Disable** | When the game stops; at runtime with `/ll disable` | `disable()` | The mod is disabled, still loaded |
| **Unload** | Only at runtime, with `/ll unload` or `/ll reload` | `unload()` | The mod is gone; its DLL is freed |

A mod is either `Enabled` or `Disabled` (`Mod::State`): a mod that has just been loaded is disabled until it is
enabled. When the game stops, mods are disabled, not unloaded.

With `LL_REGISTER_MOD(Class, instance)` (see [Registering the Mod Entry](../api_reference/mod.md#registering-the-mod-entry)),
`load()` is required and `enable()`, `disable()` and `unload()` are used when the class defines them. A native mod
without an `unload()` cannot be unloaded at runtime: LeviLamina refuses with "The mod does not register an unload function".

## Finding the Mods

At startup LeviLamina looks at every folder in the mods root: `plugins/` on the server and `mods/` on the client (see
[Directory Structure](../api_reference/mod.md#directory-structure)).

- A folder without a `manifest.json`, or with an empty one, is skipped.
- The manifest's `name` must be the name of its folder; otherwise the mod is not loaded ("Mod name … do not match
  folder …").
- Manifests of the type `preload-native` are skipped: PreLoader loads those before the game starts, and they are not
  LeviLamina mods (see [Mod Types](../api_reference/mod.md#mod-types)).

## Choosing and Ordering

From the manifests, LeviLamina makes a plan before it loads anything:

1. **Which mods.** It starts from every mod that is not `passive`, and adds what they need: their `dependencies`, and
   the `optionalDependencies` that are installed in a matching version. A `passive` mod is loaded only when another
   mod that is loaded depends on it.
2. **Which of them cannot run.** A mod is left out when a dependency is missing or has a version outside the range
   it asks for; when its `platform` is not this one (`server` or `client`; `universal` or no `platform` runs on
   both); when it lists in `conflicts` another mod of the plan, in a matching version; when one of its dependencies
   is left out; or when it is in a dependency cycle. The log says why, for example "… will not be loaded because it
   conflicts with …".
3. **In which order.** Dependencies and optional dependencies come before the mods that use them; a mod with
   `loadBefore` comes before the mods it names. Mods that have no order between them are loaded by name.

Then the mods are loaded one after the other in that order. A mod whose dependency failed to load is skipped too.

## Load

On the server, LeviLamina loads the mods while the game's `main` starts, before the game itself runs; on the client,
when PreLoader loads LeviLamina into the game. The game, its world and its players do not exist yet.

A mod's `type` decides who loads it. LeviLamina loads `native` mods itself; another type is loaded by the mod manager
that was registered for it (for example by a script engine). For a native mod, LeviLamina:

1. adds the mod's folder to the `PATH`, so that the DLLs it ships next to its own are found;
2. loads the DLL named by the manifest's `entry`. When Windows cannot load it because a DLL or a function it imports
   is missing, LeviLamina logs which ones;
3. checks that the DLL uses LeviLamina's memory allocation operators (`ll/api/memory/MemoryOperators.h`); a DLL that
   does not is not loaded;
4. calls the mod's `load()`.

Static objects of the DLL are created while the DLL loads, before `load()`: this is when the hooks declared with an
`LL_AUTO_` macro are installed (see [Events and Hooks](events_and_hooks.md)).

## Enable

On the server, the mods are enabled once the server thread has started; on the client, when the game has finished
initializing. They are enabled in the order they were loaded, and LeviLamina logs "Enabling … v…" for each one.
A mod is enabled only when all its `dependencies` are enabled.

`enable()` is where a mod starts to take part in the game: it registers its listeners, commands and so on. A mod
loaded while the game is already running (with `/ll load`) is enabled right after its `load()`.

## Disable and Unload

When the server stops, or the client's window closes, LeviLamina disables the mods in the reverse of the order they
were loaded, so a mod is disabled before the mods it depends on.

A mod can also be disabled or unloaded while the game runs. Then LeviLamina cleans up after it:

- **Disabled** while the game runs: the event listeners of the mod are removed and its commands are disabled.
- **Unloaded**: the mod is disabled first; then its `unload()` runs, its listeners and the events it provided are
  removed from the event bus, and its DLL is freed.

A mod cannot be disabled or unloaded while a mod that depends on it is still enabled or loaded: LeviLamina answers
"… still depends on …". `loadBefore` does not create such a link (see
[Dependency Semantics](../api_reference/mod.md#dependency-semantics)).

## Managing Mods at Runtime

LeviLamina's command `/ll` runs these steps on a mod while the game runs:

| Command | What it does |
|---------|--------------|
| `/ll load <mod> [cascade]` | Loads a mod that is in the mods root but not loaded, and enables it |
| `/ll unload <mod> [cascade]` | Disables and unloads a mod |
| `/ll reload <mod> [cascade]` | Unloads a mod and loads it again |
| `/ll reactivate <mod> [cascade]` | Disables a mod and enables it again |
| `/ll enable <mod> [cascade]` | Enables a disabled mod |
| `/ll disable <mod> [cascade]` | Disables a mod |
| `/ll show <mod> [cascade]` | Shows the manifest of a mod: name, author, description, type, version, entry, extra info |
| `/ll list` | Lists the loaded mods |

`/ll load` needs the mod's dependencies to be loaded already. With `cascade`, the mods linked to it follow: `load`
also loads the mods of the mods root that depend on it; `unload`, `reload` and `disable` take the mods that depend on
it along; `enable` enables its dependencies first; and `show` prints its dependencies and dependents as trees.

On the server the command is `/levilamina`, `/ll` for short, and needs the permission level `Admin` by default; in the
client it is `/clilevilamina`, `/clill` for short, and anyone may use it. It is set in LeviLamina's own configuration,
`LeviLamina/config/Config.json` in the mods root, under `modules.command.modManageCommand` (`enabled`, and `permission`, used on the server).

## Related

- [Mod](../api_reference/mod.md) — `Mod`, `Manifest`, `LL_REGISTER_MOD` and the mod's folders
- [Events and Hooks](events_and_hooks.md) — what happens to listeners and hooks when a mod is enabled, disabled or unloaded
- [Your first LeviLamina mod](https://levimc.org/tutorials/develop/first-levilamina-mod/) — a mod from the template, step by step
