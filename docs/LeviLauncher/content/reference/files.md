---
platforms: [windows]
---
# Folders & Files

Every file and folder that the Windows version of LeviLauncher reads and writes, as of LeviLauncher 1.1.0. The launcher writes nothing to the system temporary folder (`%TEMP%`).

## Overview

| Folder | Location | Holds |
| --- | --- | --- |
| Settings folder | `%APPDATA%\LeviLauncher\` | `config.json` only: small, and roams with your Windows profile |
| Local folder | `%LOCALAPPDATA%\LeviLauncher\` | Logs, the Microsoft account, the window's WebView2 data; also the default data root |
| Data root | the local folder, unless you choose another one (**Base Root** in **Settings → Basic Settings**, or `config set data-root`) | `Instances\`, `Backups\`, `Cache\` |

```text
%APPDATA%\LeviLauncher\
  config.json                      the launcher's settings
%LOCALAPPDATA%\LeviLauncher\        the default data root
  Logs\startup.log                 the launcher log, and startup.1.log … startup.4.log before it
  Accounts\                        the Microsoft account and device records, encrypted for your Windows user
  WebView2\                        the data of the launcher window
  storage-migration.json           the record of the move from the old layout (see below)
<data root>\
  Instances\<instance>\            one instance (see below)
  Backups\
    Worlds\<instance>\<folder>_<world>\<world>_<yyyyMMdd-HHmmss>.mcworld
    Instances\<instance>\<instance>_<yyyyMMdd-HHmmss>.zip
  Cache\
    Installers\                    game installers, and the Visual C++ and WebView2 installers
    Updates\                       launcher updates; deleted once installed
    Downloads\                     files downloaded for an import; cleaned at startup after 1 day
    Imports\                       files handed over for an import; cleaned at startup after 1 day
    gdk-pending-versions.json
    gamertags.json                 the gamertags of player profiles the launcher has seen
```

Everything in `Cache\` can be deleted without losing anything. `LeviLauncher.exe cache clean` deletes the package cache, the files downloaded for imports and unfinished downloads, and `LeviLauncher.exe installer remove` deletes downloaded game installers. Changing the data root only points the launcher at another folder: existing instances, downloads and backups are not moved.

## An instance's folder

```text
Instances\<instance>\
  Minecraft.Windows.exe …          the game files of the build
  LeviLauncher.dll                 LeviLauncher's native loader (x64 builds)
  .levilauncher\                   the launcher's state in the instance (hidden)
    instance.json                  name, game version, channel, isolation and launch options
    icon.ico                       the icon of the instance, made from the game's LargeLogo.png
    xbox-auth-key-v1               a marker of UWP instances for the Xbox sign-in
  .lip\                            the state of the packages installed in the instance (lip's format)
  mods\                            the mods (see How Mods Are Loaded)
  Minecraft Bedrock\               the game data, when isolation is on (Preview: Minecraft Bedrock Preview)
```

See [Instance Isolation](../concepts/isolation) for the game data folders of instances with and without isolation, and [How Mods Are Loaded](../concepts/mod-loading) for `mods\`.

## Outside LeviLauncher's folders

| Path | What it is |
| --- | --- |
| `Minecraft - <instance>.lnk` on your desktop | The desktop shortcut of an instance (**Create Desktop Shortcut**, or `instance shortcut`). It opens the launcher with `--launch=<instance>`. Only your own desktop is written, not the public one. |
| `%APPDATA%\lip\` | lip's settings: `config.toml`, for example its `github_proxy`, which the built-in package manager also reads. |
| `%LOCALAPPDATA%\lip\Cache\` | The package cache of the built-in package manager, the same as lip's. **Clean Cache** in **Settings → Package Management** empties it. |
| `%APPDATA%\Minecraft Bedrock\`, `%APPDATA%\Minecraft Bedrock Preview\` | The shared game data of GDK instances without isolation. |
| `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\` (Preview: `Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe`) | The shared game data of UWP instances without isolation. |

## How files are written

- A file is written next to its final place as `<name>.<random>.tmp` and then renamed into place, so a file is never seen half-written. An unfinished download that can be resumed is kept as `<name>.partial.tmp`.
- Names that you choose (instances, worlds) are cleaned with the Windows rules: the characters `<>:"/\|?*`, trailing dots and spaces are removed, and reserved names such as `CON` or `NUL` are avoided.
- Files the launcher makes are named `<name>_<yyyyMMdd-HHmmss>.<extension>`, for example `MyWorld_20261107-142301.mcworld`.

## The old layout

LeviLauncher before 1.1.0 kept everything in `%APPDATA%\<program name>\` (for example `%APPDATA%\levilauncher.exe\`), with the folders `versions\`, `backups\`, `installers\`, `updates\`, `logs\` and the files `config.json`, `user_gamertag_map.json` and `gdk_pending_versions.json`. Instances held `version.json` and `LargeLogo.ico`.

At its first start, LeviLauncher 1.1.0 or later moves this data to the layout above once, without deleting anything: data on the same drive is renamed into place, data on another drive is copied and the original kept, and the old `config.json` is renamed to `config.migrated.json`. A data root that you had chosen stays where it is. When something cannot be moved (for example because the game is running from an instance), every step is undone and the launcher runs on the old layout until the next start. `storage-migration.json` records what was moved where; desktop shortcuts are updated to the new places afterwards.
