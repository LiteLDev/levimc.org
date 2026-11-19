# How Mods Are Loaded

Minecraft Bedrock has no mod support of its own: a mod is native code that a loader puts into the game process when the game starts. This page explains which loaders LeviLauncher uses, where mods live, and how the different ways of adding a mod fit together.

## Where mods live <Badge platform="windows" />

Every instance has a `mods\` folder (see [Folders & Files](../reference/files)). Each mod is one folder in it, with a `manifest.json` that describes the mod:

| Field | Meaning |
| --- | --- |
| `name` | The mod's name. |
| `entry` | The file the loader loads, relative to the mod's folder (a `.dll`). |
| `version` | The mod's version. |
| `type` | Which loader loads it: `preload-native` for LeviLauncher's native loader; mods for LeviLamina have their own types. |
| `author` | Who made it (optional). |

Mods belong to one instance. They are not affected by [isolation](./isolation), which only concerns game data.

**Turning a mod off** (in **Manage Mods**, or `LeviLauncher.exe mod disable`) renames its `manifest.json` to `manifest.json.close`; turning it on renames it back. The mod's files stay where they are, and a loader that looks for `manifest.json` no longer finds the mod.

## The two loaders <Badge platform="windows" />

### LeviLauncher's native loader

When LeviLauncher installs or prepares an instance, it puts its loader, `LeviLauncher.dll`, next to the game's executable and adds it to the executable's imports, so that Windows loads it with the game. This works for x64 builds, GDK and UWP alike; it is also what makes [isolation](./isolation) work.

When the game starts, the native loader goes through the folders in `mods\` in order of their names and loads the `entry` of each mod whose `type` is `preload-native`. Folders without `manifest.json`, and mods of other types, are skipped. If the instance has another preloader (a `preloader.dll` next to the game), the native loader leaves all mod loading to it. The native loader needs the Visual C++ runtime (x64), which LeviLauncher checks and offers to install.

### LeviLamina

[LeviLamina](https://levimc.org/LeviLamina/) is the mod loader of LeviMC. Most mods on [LeviMC Mods](https://levimc.org/mods/) are LeviLamina mods: they need LeviLamina in a version that supports the instance's game version. LeviLauncher installs LeviLamina on GDK instances of the versions it supports (the **Install LeviLamina** switch when you install a version, or the **Loader** tab of **Instance Settings**), as a package of its built-in package manager.

## Three ways to add a mod <Badge platform="windows" />

| You add | What LeviLauncher does |
| --- | --- |
| A mod from **LeviMC Mods** (or `mod install owner/repo`) | Installs it as a package with the built-in, [lip](https://github.com/LiteLDev/lip)-compatible package manager: it downloads the release for this platform, installs the packages it depends on, and records it in the instance's `.lip\state.json`. When the mod needs LeviLamina and the installed one does not fit (or none is installed), a compatible LeviLamina is installed first. Such mods can be updated and removed as packages. |
| A `.mcmod` package (or a `.zip`) | Extracts it into a new folder of `mods\`. The archive must contain a `manifest.json`. |
| A single `.dll` | Puts it into a new folder of `mods\` and writes a `manifest.json` for it: by default the file's name as name, `preload-native` as type and `0.0.0` as version. |

A package records where it runs with `side` (`client` or `server`) and `platform` (such as `win-x64`), in its `lip.toml` and in `.lip\state.json`. For the client, LeviLauncher installs a mod's `client` variant if it has one, else its default variant. See [Mods & Integrations](../guide/mods-integrations) for the details, including how older packages are migrated.

## Android <Badge platform="android" />

The Android version loads native mods: `.so` libraries that run in the game process. Keep modded setups in isolated versions, and install only mods from sources you trust. To make one, follow [Android native mods](https://levimc.org/LeviLamina/developer_guides/android/) in the LeviLamina documentation.

## Related pages

- [Mods & Integrations](../guide/mods-integrations)
- [Instances & Game Versions](./instances)
- [Command Line](../reference/command-line)
