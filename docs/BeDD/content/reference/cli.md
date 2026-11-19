# Command line

`BeDD.exe` without arguments (a double-click) is the [manager window](/guide/several-games#the-manager-window); with
arguments it is this command line: `BeDD.exe <noun> <verb> [arguments] [flags]`. `BeDD.exe help`, `help <noun>` and
`<command> --help` print the same, offline.

## Conventions

| | |
|---|---|
| Flags | anywhere after the command words: `--name value`, `--name=value`, `-n value`; switches `--name` / `--no-name`; `--` ends the flags |
| Names | exact, case ignored, never a prefix |
| Durations | `launch` `--timeout`, `--lock-timeout`: a number with `ms`, `s` (default), `m`/`min` or `h`, e.g. `90s`, `3m`, `2h`; 30 days at most |
| stdout | the result only |
| stderr | progress (silenced by `-q` and `--json`), warnings, `-v` detail |
| Errors | `error: <message>`, then `hint: <command>`; with `--json` also `{"error":{code,message,exit,hint}}` on stdout (`code` e.g. `ERR_USAGE`) |

Global flags, on every command:

| Flag | |
|---|---|
| `--json` | the result as one JSON document: an array for lists, an object otherwise; camelCase keys, RFC 3339 times, sizes in bytes |
| `-q`, `--quiet` | identifiers only, one per line; no progress |
| `-v`, `--verbose` | details of what happens, on stderr |
| `-h`, `--help` | help for the command |

Exit codes: `0` ok, `1` failure, `2` usage, `4` not found, `5` conflict (e.g. slot in use), `10` declined.

## Games

### launch

`BeDD.exe launch [<instance>]` (alias `play`): start a game of an instance in the background and print its endpoint.
Clones the instance when needed, installs or updates its mod ([Upgrading](/guide/installs#upgrading)), opens the
manager window and holds the signaling lock for the game's life ([rules](/guide/several-games#rules-for-parallel-runs)).
Guide: [Starting a game](/guide/usage#starting-a-game).

| Flag | Default | |
|---|---|---|
| `--slot <n>` | `1` | the clone of the base instance for this slot, when no instance is named |
| `--dir <folder>` | | start the instance in this folder instead (any folder with `Minecraft.Windows.exe`) |
| `--label <text>` | `BEDD_LABEL`, else the calling repository | the game's name in the manager window |
| `--exclusive-signaling` | | have the PC to itself: wait for every other game to close, keep new ones waiting |
| `--no-manager` | | do not start the manager window |
| `--keep-mod` | | keep the clone's BeDD mod, even when it differs from this `BeDD.exe`'s |
| `--detach` | | return once the process is created; `url` and `token` are `null` |
| `--timeout <duration>` | `3m` | how long to wait for the endpoint |
| `--lock-timeout <duration>` | `2h` | how long to wait for the signaling lock |

```powershell
BeDD.exe launch --slot 3 --json
BeDD.exe launch --dir D:\games\mc-test --label smoke --detach -q
```

### process list

`BeDD.exe process list` (aliases `ps`, `process ls`): the running games and servers whose mod announced its WebSocket
endpoint (`run\<pid>.json`). `--json` prints each endpoint with its token: that is how a test finds what to connect to
([Which game](/guide/usage#which-game)).

| Flag | |
|---|---|
| `--all` | also games under the instances folder without an endpoint (still loading, or an older mod) |

### process stop

`BeDD.exe process stop [<instance>]` (alias `stop`): kill the games of an instance (a folder name under the instances
folder, or its path). Minecraft processes outside the instances folder are never touched, unless `--pid` names one
that announced a BeDD endpoint.

| Flag | |
|---|---|
| `--pid <pid>` | stop this game |
| `--all` | stop every game of BeDD's instances |
| `-y`, `--yes` | do not ask before stopping every game |

```powershell
BeDD.exe stop --pid 12345
BeDD.exe stop --all --yes
```

## Instances

Clones and folders: [Installs and clones](/guide/installs#clones). A command that takes `[<name>]` also takes
`--slot <n>` (the clone of that slot).

| Command | |
|---|---|
| `instance list` (`ls`) | BeDD's game instances (clones under `%LOCALAPPDATA%\BeDD\instances`) and what each still lacks. `--bases`: the LeviLauncher instances a clone can be made from; `--bases --all`: also those that cannot be cloned, and why |
| `instance show [<name>]` | an instance and what it still lacks |
| `instance clone` | make `<gameVersion>-<slot>` from a LeviLauncher instance (game files hardlinked, assets through junctions, game data and LeviLamina copied; the LeviLauncher instance is only read), or refresh an existing clone. `--slot <n>` (`1`); `--base <name>` (else `BEDD_INSTANCE`, else LeviLauncher's default instance, else the first that fits); `-f`, `--force`: remove the clone and make it again, its game data too |
| `instance refresh [<name>]` | bring clones up to date with their LeviLauncher instance. `--all`: every instance (those with a game running are skipped) |
| `instance remove [<name>]` (`rm`) | delete an instance; the LeviLauncher instance stays as it is. `-y`, `--yes`: do not ask |
| `instance path <name> [dir\|mods\|logs\|data\|worlds]` | print a folder of an instance: `dir` (the instance), `mods`, `logs`, `data` (its game data, `Minecraft Bedrock`) or `worlds` (`minecraftWorlds` of its first player) |

## The mod

Keys and values: [Configuration](/guide/configuration#keys).

| Command | |
|---|---|
| `mod install <instance>` | copy `BeDD.dll` and `manifest.json` into `<instance>\mods\BeDD`, write its `config\config.json` with only the settings given, and switch LeviLamina to its built-in crash logger. Replaces an earlier install, its config included. `--from <dir>`: the build to install, pinned for later `launch`es until the next install without `--from` (else `BEDD_MOD_DIR`, else `mod\BeDD` next to `BeDD.exe`, else `bin\BeDD` of the checkout the current folder is in) |
| `mod uninstall <instance>` | take the mod out of an instance |
| `mod config <instance>` | print `mods\BeDD\config\config.json` after applying `--set`, `--unset` and `--world-mode`; the game reads it when it starts. `--unset <key>` (repeatable): back to the mod's default |

`mod install` and `mod config` both take:

| Flag | |
|---|---|
| `--set <key=value>` | a config setting, repeatable; the value is JSON when it parses, else text |
| `--world-mode <mode>` | `ClientOnly`, `ClientServer` or `Remote` (config `mode`; [Where the world runs](/guide/modes)) |
| `--server-host <host>` | with `--world-mode Remote`: the server the game joins; `*`: any server `join` names |

## Worlds

`BeDD.exe world singleplayer <instance> [<world folder>]`: clear the multiplayer and broadcast settings in `level.dat`
(and `level.dat_old`) of a world, so that games sharing one sign-in do not knock each other out ("Blaze"). Without a
world folder: every world of the instance. Run it while the world is not open.

| Flag | Default | |
|---|---|---|
| `--recent` | | only the worlds whose `level.dat` was written recently (a test world just restored) |
| `--minutes <n>` | `15` | what `--recent` means |

## Servers

Dedicated servers for the [client + server mode](/guide/modes#client-server), in the servers folder.

| Command | |
|---|---|
| `server init <name>` | set up a server: BDS and LeviLamina through lip, BeDD's server mod, `server.properties`. Fast when nothing is missing; run it again to update the mod or change settings. `--port <N>`: IPv4 port, IPv6 N+1 (default: the server's own, else the first free pair from 19140 up); `--from <dir>`: the server mod (else `BEDD_SERVER_MOD_DIR`, `mod\BeDD-server` next to `BeDD.exe`, the nearest `bin\BeDD-server`); `--set <key=value>`: a `server.properties` key, repeatable ([Setting up a server](/guide/modes#setting-up-a-server)) |
| `server start <name>` | start the server with no window (its console in `logs\console.log`), wait until it is up and BeDD announces its endpoint; print `name`, `pid`, `port`, `portV6`, `url`, `token`. A running server is printed as it is. `--detach`: do not wait for the endpoint (`url`, `token` may be `null`); `--timeout <seconds>` (`180`); `--allow-firewall-prompt`: start a server without BeDD's loopback binding |
| `server stop <name>` | stop a server (it saves its world). `--all`: every server; `--timeout <seconds>` (`30`): then kill it |
| `server list` (`ls`) | the servers, their ports and whether they run |
| `server remove <name>` (`rm`) | delete a stopped server's folder, its world too. `-y`, `--yes`: do not ask (needed without a console) |
| `server path <name>` | print the folder of a server |

## The manager window

| Command | |
|---|---|
| `manager status` | whether the manager window runs, and its process id; exit code `0` either way |
| `manager stop` | close the manager window and every game it shows (each gets `{op:"close"}` and is killed after 10 s), then wait until it exits. `-y`, `--yes`: do not ask; `--timeout <seconds>` (`60`) |

## Other commands

| Command | |
|---|---|
| `version` | version information |
| `dev` | the mod developer's loop: clone the base for `--slot` (`9`), install the mod built into `--from` (default `bin\BeDD` of the checkout), launch it (`--label`, default `dev`) and keep running, logging every change of the foreground window and of the cursor clip to `--watch-log` (default `tools\out\desktop-watch.log` of the checkout; a line ending in `MINECRAFT HAS THE FOREGROUND` means a game took the focus). Ctrl+C or creating `<log dir>\dev.stop` closes the game (unless `--keep`) and exits; creating `<log dir>\dev.restart` closes it, reinstalls the mod and launches it again. `--watch-only`: only watch the desktop |
