# Instances & Game Versions

LeviLauncher installs each copy of Minecraft as an **instance**: one game version with its own name, its own settings and, if you want, its own game data. You can keep several instances side by side, of the same game version or of different ones, and start the one you need. The app lists them on the **Instances** page.

## What an instance is

=== "Windows"

    An instance is a folder in the launcher's `Instances` folder (see [Folders & Files](../reference/files)). Its name is the name of the folder. The folder holds:

    - the game files of one Minecraft build, extracted from its installer;
    - `.levilauncher\instance.json`, what the launcher knows about the instance: the game version, the channel, whether it keeps its own game data, and the launch options (console, editor mode, launch arguments, environment variables);
    - `mods\`, the instance's mods, and `.lip\`, the state of the packages installed with the built-in package manager (see [How Mods Are Loaded](./mod-loading));
    - the instance's own game data (worlds, packs, settings) when it has [isolation](./isolation) turned on.

    Mods always belong to one instance. Game data belongs to one instance only when isolation is on; otherwise the instance uses the game data that Minecraft normally uses on this PC.

=== "Android"

    An instance is an official Minecraft APK that you import into LeviLauncher. It runs inside the launcher, without being installed on the system. The Minecraft app from Google Play (1.21.80 or later) must still be installed on the device; LeviLauncher lists it next to the versions you imported.

    Version isolation keeps the worlds, packs and settings of an imported version apart from the installed Google Play version. Imported versions often need isolation to launch.

## Release and Preview

Every Minecraft build belongs to a **channel**:

| Channel | What it is |
| --- | --- |
| Release | The stable game that most players use. |
| Preview | Builds of upcoming versions, for testing. They may break worlds, packs or mods more often. |
| Beta | Test builds published for UWP only. <Badge platform="windows" /> |

On Windows, Release and Preview each have their own game data folder (`Minecraft Bedrock` and `Minecraft Bedrock Preview`), so a Preview instance without isolation does not share worlds with a Release instance.

## GDK and UWP builds <Badge platform="windows" />

Minecraft for Windows has been published in two package formats, and LeviLauncher installs both. When a version exists as both, GDK is chosen.

| | GDK | UWP |
| --- | --- | --- |
| Installer | `.msixvc`, downloaded from a mirror that LeviLauncher measures and picks | `.appx` / `.msix` (or a bundle), downloaded from Windows Update |
| To install | A signed-in Microsoft account that owns Minecraft | — |
| To run | Microsoft Gaming Services and Microsoft GameInput | Windows Developer Mode, to register the package with Windows |
| Shared game data | `%APPDATA%\Minecraft Bedrock` (Preview: `Minecraft Bedrock Preview`), one folder per player profile under `Users\` | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` (Preview: `Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe`) |
| Isolation | Every version | x64 versions 1.19.70.2 and later |
| LeviLamina | Installed by LeviLauncher on the versions it supports | Not installed by LeviLauncher |
| Launch arguments and environment variables | Yes | No |

A local installer file that you import (`.msixvc`, `.appx`, `.msix`, `.appxbundle` or `.msixbundle`) is installed as GDK or UWP according to its extension.

### Player profiles {#player-profiles}

A GDK instance keeps worlds, screenshots and the server list per **player profile**: a folder under `Users\` named after the player's ID, shown with its gamertag where the launcher knows it. Resource and behavior packs are shared by all profiles (`Users\Shared\`); skin packs are shared from game 1.26 on and per profile before. UWP instances have no profiles.

## Registration with Windows <Badge platform="windows" /> {#registration-with-windows}

Windows knows one installed Minecraft per channel. **Registering** an instance makes Windows treat it as that Minecraft: the Start menu, `minecraft://` links and the Xbox features then use it. Registering replaces the current holder of the Release or Preview slot (the Microsoft Store game or another instance), whose data is kept. Game data is never touched by registering or unregistering.

UWP instances are registered automatically when you launch them. A registered instance must be unregistered before it can be renamed or removed.

## Related pages

- [Version Management](../guide/version-management)
- [Instance Isolation](./isolation)
- [Folders & Files](../reference/files)
