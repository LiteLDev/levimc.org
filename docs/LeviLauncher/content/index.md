# LeviLauncher

A Minecraft Bedrock launcher for Windows and Android: install, manage, isolate, mod, and launch Minecraft Bedrock Edition on your Windows PC or Android device.

**Download:** [LeviLauncher for Windows](https://github.com/LiteLDev/LeviLauncher/releases/latest) · [LeviLauncher for Android](https://github.com/LiteLDev/LeviLauncher-Android/releases/latest) · the [Download](./download) page lists what each version needs and the other download sources.

::: info Windows and Android
LeviLauncher comes in a **Windows version** for Minecraft Bedrock Edition (GDK / UWP) and an **Android version** for the official Google Play Minecraft. Both need a legitimate licensed copy of the game. There is no iOS version, and none is planned.
:::

::: tip Start here
New to LeviLauncher? The tutorial [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/) takes you from downloading LeviLauncher to your first game with mods.
:::

## What LeviLauncher does

- **Version-first workflow.** Install, rename, launch, and remove Minecraft Release or Preview builds while keeping each setup under control. Each installed copy is an *instance*: see [Version Management](./guide/version-management) and [Instances & Game Versions](./concepts/instances).
- **Clean isolation.** Keep worlds, packs, and game files separated from your default AppData installation when you want a safer workspace: see [Instance Isolation](./concepts/isolation).
- **Content toolkit.** Manage worlds, resource packs, behavior packs, skin packs, screenshots, and server lists from one place: see [Content Management](./guide/content-management).
- **Mod-ready.** Import `.mcmod` mod packages, browse CurseForge, and install LeviLamina and LIP packages with the built-in package manager for advanced setups: see [Mods & Integrations](./guide/mods-integrations) and [How Mods Are Loaded](./concepts/mod-loading).
- **World utilities.** Export backups, inspect world data, and edit selected `level.dat` fields without leaving the launcher: see [World Tools](./guide/world-tools).
- **User-focused settings.** Tune language, appearance, download behavior, privacy choices, update channels, and package management: see [Settings & Personalization](./guide/settings-personalization) and [All Settings](./reference/settings).
- **Android extras.** Xbox account switching and Quick Launch URI actions, in the same launcher: see [Accounts & Quick Launch](./guide/accounts-quick-launch).

## A short example

On Windows, everything the launcher window does can also be done from a terminal. These three commands install the newest Minecraft Release build as a new instance with LeviLamina and make it the default instance, add a mod from [LeviMC Mods](https://levimc.org/mods/) to it, and start the game:

```text
LeviLauncher.exe install latest --loader --use
LeviLauncher.exe mod install LiteLDev/LegacyMoney
LeviLauncher.exe play
```

Installing a GDK build needs a signed-in Microsoft account that owns Minecraft (`LeviLauncher.exe account login`). In the window, the same steps are the **Download** page, the **LeviMC Mods** page and the **Launch** button. The [Command Line](./reference/command-line) reference lists every command.

## On this site

This documentation is written for **players and end users**, not maintainers.

- **Guides**: one task per page. Get the app on the [Download](./download) page, then [manage versions](./guide/version-management), [downloads and mirrors](./guide/downloads-mirrors), [content](./guide/content-management), [accounts and Quick Launch](./guide/accounts-quick-launch) (Android), [mods](./guide/mods-integrations), [worlds](./guide/world-tools) and [settings](./guide/settings-personalization). The Help group covers [updates and troubleshooting](./guide/update-troubleshooting) and [community and feedback](./guide/faq-community-feedback).
- **Concepts**: how LeviLauncher works: [instances and game versions](./concepts/instances) (Release and Preview, GDK and UWP, Windows and Android), [instance isolation](./concepts/isolation) and [how mods are loaded](./concepts/mod-loading).
- **Reference**: the [command line](./reference/command-line), [all settings](./reference/settings), the [folders and files](./reference/files) LeviLauncher uses, the Android [Quick Launch URIs](./reference/quick-launch-uri) and the Android [privacy policy](./privacy-policy).

A good reading order for newcomers: the tutorial [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/), then [Version Management](./guide/version-management) and [Content Management](./guide/content-management).

## Download channels

- **GitHub Releases (LeviLauncher downloads):** [LiteLDev/LeviLauncher Releases](https://github.com/LiteLDev/LeviLauncher/releases)
- **Lanzou mirror:** [levimc.lanzoue.com/b016ke39hc](https://levimc.lanzoue.com/b016ke39hc) — password: `levi`
- **Android version:** [LiteLDev/LeviLauncher-Android Releases](https://github.com/LiteLDev/LeviLauncher-Android/releases)

## Community and feedback

- **Official Discord:** [discord.gg/v5R5P4vRZk](https://discord.gg/v5R5P4vRZk)
- **Personal Discord:** [discord.gg/VqQaC8vWz8](https://discord.gg/VqQaC8vWz8)
- **QQ Group:** [458083875](https://qm.qq.com/q/1z791rJgJG)
- **Issue tracker:** [GitHub Issues](https://github.com/LiteLDev/LeviLauncher/issues)
