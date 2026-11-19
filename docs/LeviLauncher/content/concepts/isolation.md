# Instance Isolation

Minecraft keeps its worlds, packs and settings in one game data folder per device. **Instance isolation** (in the app: **Enable Isolation** in **Instance Settings**, and **Instance isolation** when you install a version) gives an instance a game data folder of its own instead, inside the instance. The command line calls the two modes *own data* and *shared data*.

## Shared data and own data

=== "Windows"

    An instance **without isolation** uses the game data that Minecraft normally uses on this PC: the same worlds, packs and settings as the Microsoft Store game and as every other instance of the same kind without isolation.

    An instance **with isolation** keeps its game data in its own folder. Its worlds, resource packs, behavior packs, skin packs, screenshots, server list and game settings are separate from every other instance and from the Microsoft Store game.

    | Instance | Shared data (isolation off) | Own data (isolation on) |
    | --- | --- | --- |
    | GDK, Release | `%APPDATA%\Minecraft Bedrock` | `<instance>\Minecraft Bedrock` |
    | GDK, Preview | `%APPDATA%\Minecraft Bedrock Preview` | `<instance>\Minecraft Bedrock Preview` |
    | UWP, Release | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` | `<instance>\Minecraft Bedrock` |
    | UWP, Preview | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe\LocalState` | `<instance>\Minecraft Bedrock Preview` |
    | UWP, Beta | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` | `<instance>\Minecraft Bedrock Beta` |

    `<instance>` is the instance's folder in `Instances` (see [Folders & Files](../reference/files)). Inside a GDK data folder, the game keeps each player's data under `Users\` (see [player profiles](./instances#player-profiles)); inside a UWP one, under `games\com.mojang\`.

=== "Android"

    Version isolation keeps the game data of a version (worlds, packs and settings) apart from the other versions, and from the Minecraft installed from Google Play. Other instances are not affected when you change it for one instance. Imported versions often need isolation to launch.

## How it works <Badge platform="windows" />

The game itself does not know about instances. When LeviLauncher installs an instance, it puts its loader, `LeviLauncher.dll`, next to the game's executable (see [How Mods Are Loaded](./mod-loading)). When the game starts with isolation on, the loader redirects the folders where the game looks for its data (the application data folders, and the temporary folder) to the instance's data folder. Nothing is copied or linked: the game simply reads and writes there.

What isolation does not change:

- **Mods** are always per instance, in the instance's `mods\` folder, with or without isolation.
- **The Microsoft account** and the launcher's own settings are the same for all instances.
- **Registration** with Windows (see [Instances & Game Versions](./instances#registration-with-windows)) is separate from isolation.

## Limits <Badge platform="windows" />

- GDK instances support isolation on every version; UWP instances from version 1.19.70.2 on, x64 only.
- Turning isolation on does not copy anything: the instance starts with empty game data. To start from existing data, choose to copy data when you install the version (from the game installed on this PC, or from another isolated instance of the same type), or copy it later with `LeviLauncher.exe instance copy-data` (GDK).
- Turning isolation off makes the instance use the shared data again; its own data folder stays in the instance folder.
- Removing an instance deletes its folder, **including the worlds of its own data**. Back up important worlds first (see [World Tools](../guide/world-tools)).
- Content can be copied from one instance to another only into an instance with its own data, or into a UWP instance that does not use the same data folder.

## When to use it

Isolation is useful when you want:

- different content sets for different versions
- safer testing for mods or Minecraft Preview builds
- less risk of one setup affecting another

A setup that works well: one isolated Release instance for normal play, one isolated Preview instance only when needed, and one temporary test instance for mods or troubleshooting.

## Related pages

- [Version Management](../guide/version-management)
- [Content Management](../guide/content-management)
- [Instances & Game Versions](./instances)
