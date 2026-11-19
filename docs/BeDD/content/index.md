# Be.D.D.

Minecraft tests that run in the background: your script plays Minecraft Bedrock while your mouse, keyboard and
windows stay yours. [Download](https://github.com/LiteLDev/BeDD/releases/latest), or
[start here](https://levimc.org/tutorials/automate/bedd/).

![Three headless Minecraft games react to a test script in the manager window](/showcase/desktop.webp)

## What it is

Be.D.D. runs end-to-end tests of [LeviLamina](https://levimc.org/LeviLamina/) client mods in the background: the game
never takes the foreground, cursor or keystrokes, and several games run at once. A client mod serves a WebSocket in
each game; `BeDD.exe` clones, sets up and starts the games.

```powershell
BeDD.exe launch --slot 1 --json   # {"pid":…,"url":"ws://127.0.0.1:53021/v1","token":"…",…}
```

```js
import bedboo from 'bedboo';
const bot = bedboo.createBot({ transport: 'bedd', bedd: { url, token } });
bot.once('spawn', () => bot.setControlState('forward', true));
```

Keys, chat, key bindings, menus, tooltips, clicks and the camera work as for a player. Every request returns once
handled.

- **Keep using your PC.** The game never takes the foreground, the cursor or your keystrokes
  ([How it works](/reference/how-it-works)).
- **Three ways to drive it, cheapest first:** bedboo's game ops, then menus as text, then simulated input
  ([Operation modes](/guide/operation-modes)).
- **Several games at once.** One WebSocket per game; a clone of an instance takes seconds
  ([Several games at once](/guide/several-games)).
- **One window for all of them.** Every game on the PC shows live in one manager window; closing it closes them all
  ([The manager window](/guide/several-games#the-manager-window)).
- **Deterministic.** Every request returns once the game has handled it ([How it works](/reference/how-it-works)).
- **Any language.** JSON over a local WebSocket, with an AsyncAPI spec ([Integrating with your tests](/guide/integrating)).

![Your input goes to your apps; the script drives three background games over one WebSocket each](/showcase/how-it-feels.svg)

::: warning A testing tool
A game with Be.D.D. in `mods\` ignores your real mouse and keyboard and shows only in the manager window. Be.D.D.
installs itself only into its own clones, never into the instance you play.
:::

## See it run

Recorded from the manager window and the terminal ([how](https://github.com/LiteLDev/BeDD/blob/main/CONTRIBUTING.md#docs-and-showcase)).

### Three headless games, one manager window

<video controls muted playsinline preload="none" poster="/BeDD/showcase/desktop-poster.webp" src="/BeDD/showcase/desktop.mp4" width="1280" height="720" style="width:100%;height:auto"></video>

One script, three games, each with instance, pid and input activity.

### Every line, live in the game

<video controls muted playsinline preload="none" poster="/BeDD/showcase/script-and-game-poster.webp" src="/BeDD/showcase/script-and-game.mp4" width="1020" height="360" style="width:100%;height:auto"></video>

`key E` opens the inventory, `mouse` moves the sword, `key ESC` closes it.

### Chat commands, typed for you

![The text op types '/summon sheep' and '/summon cow' into chat](/showcase/chat-summon.webp)

### Hover and click where you aim

![A virtual cursor brings up a tooltip in the inventory](/showcase/inventory-hover.webp)

A `screenshot` of an off-screen window.

### One window for every game

![The manager window with three headless games next to the terminal running the script](/showcase/desktop-poster.webp)

## Who it is for

Authors of LeviLamina client mods and anyone who tests against the real Minecraft Bedrock client: CI jobs, regression
suites, bots that need the client rather than a protocol emulation. Only the test PC needs it. It is not a lip package
and not on LeviMC Mods: get it from the [releases](https://github.com/LiteLDev/BeDD/releases).

New to it? The tutorial [Drive the game client with Be.D.D.](https://levimc.org/tutorials/automate/bedd/) installs it,
sets up a PC and runs a first script.

## What is in it

| Release part | |
|---|---|
| `BeDD.exe` | double-click: the [manager window](/guide/several-games#the-manager-window); with arguments: the CLI that clones, sets up and starts games |
| `mod\BeDD\` | the client mod `BeDD.exe mod install` puts into an instance |
| `mod\BeDD-server\` | the server mod, for [client + server runs](/guide/modes) |
| `spec\bedd.asyncapi.yaml` | the [WebSocket protocol](/reference/websocket), for code generators |

## Requirements

- Windows 10 or 11, x64.
- [LeviLauncher](https://levimc.org/LeviLauncher/) **1.1+** with a Minecraft Bedrock **1.26.60** (GDK, release)
  instance that has LeviLamina **26.60.x** ([Installs and clones](/guide/installs#which-instance)).

No PowerShell, lip or .NET runtime needed.

## Where it fits

| Project | Role |
|---|---|
| [LeviLauncher](https://levimc.org/LeviLauncher/) | installs the game and its LeviLamina instance; Be.D.D. clones that instance and never writes into it |
| [LeviLamina](https://levimc.org/LeviLamina/) | loads the Be.D.D. mod in the game (and in a dedicated server); the mods you test run on it too |
| [bedboo](https://levimc.org/bedboo/) | the recommended client: a mineflayer-style bot API that drives a game over Be.D.D.'s WebSocket |

Without bedboo, any language with a WebSocket client works ([Operation modes](/guide/operation-modes),
[Integrating with your tests](/guide/integrating)).

## The rest of this site

- **Guides**: [driving the game](/guide/usage), [several games at once](/guide/several-games),
  [integrating with your tests](/guide/integrating), [installs and clones](/guide/installs) (upgrades, CI, folders),
  and [troubleshooting](/guide/troubleshooting).
- **Concepts**: the three [operation modes](/guide/operation-modes), [where the world runs](/guide/modes) and
  [how it works](/reference/how-it-works).
- **Reference**: the [command line](/reference/cli), the [configuration](/guide/configuration), the
  [WebSocket API](/reference/websocket), the [UI tree](/reference/ui) and the [tap protocol](/reference/tap).

## The name

Bedrock Deep Dive, after Zenless Zone Zero's H.D.D.: a Proxy guides agents through the Hollows from afar, your
script guides Minecraft from the background.
