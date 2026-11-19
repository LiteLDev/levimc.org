---
platforms: [windows]
---
# Command Line

`LeviLauncher.exe` without arguments opens the launcher window. With a command, it runs in the terminal and exits, using a `<noun> <verb>` grammar:

```text
LeviLauncher.exe <command> [arguments] [flags]
```

This page lists every command of LeviLauncher 1.1.0. `LeviLauncher.exe help <command>` prints the flags and examples of each command, and `LeviLauncher.exe help` the overview.

```text
LeviLauncher.exe install latest --loader --use
LeviLauncher.exe play
LeviLauncher.exe mod install LiteLDev/LegacyMoney
LeviLauncher.exe world export "My World" -o D:\Backups
LeviLauncher.exe instance list --json
```

## Running it from a shell

`LeviLauncher.exe` is a window program, so shells don't wait for it by default. When you need its output before the prompt returns, or its exit code:

- in cmd, use `start /wait LeviLauncher.exe ...`, then read `%ERRORLEVEL%`;
- in PowerShell, pipe the output (`LeviLauncher.exe instance list | Out-String`) or use `Start-Process -Wait -NoNewWindow`.

The command line does not open the window and can run while the window is open.

## Commands

### Everyday

| Command | What it does |
| --- | --- |
| `play [<instance>]` | Start the game and wait until its window is up (alias of `launch`) |
| `install <version\|file>` | Download and install Minecraft as a new instance (= `instance create`) |
| `use [<instance>]` | Set or show the default instance |
| `stop [<instance>\|<pid>...]` | Close a running Minecraft (= `process stop`) |

### Manage an instance

| Command | What it does |
| --- | --- |
| `instance list [<filter>]` | List installed instances |
| `instance show [<instance>]` | Show settings, registration, loader, players and content counts of an instance (also `instance <instance>`) |
| `instance create <version\|file>` | Download and install Minecraft as a new instance |
| `instance copy-data [<instance>] --from system\|<instance>` | Copy game data (worlds, settings) into an instance with its own data |
| `instance rename <instance> <new-name>` | Rename an instance |
| `instance set [<instance>]` | Change instance settings (console, editor mode, own data, arguments, environment, logo) |
| `instance remove <instance>...` | Permanently delete instances and everything in their folders |
| `instance register [<instance>]` | Make Windows treat this instance as the installed Minecraft of its channel |
| `instance unregister [<instance>]` | Release the instance's Windows registration (game data is kept) |
| `instance shortcut [<instance>]` | Create a desktop shortcut that starts the instance, or remove it |
| `instance path [<instance>] [<kind>]` | Print a folder of an instance (and optionally open it) |
| `mod list [<filter>]` | List the mods of an instance |
| `mod show <package>` | Show a mod of the catalogue |
| `mod search [<words>]` | Search the LeviLamina mod catalogue |
| `mod install <package[@version]>...` | Install, upgrade or downgrade mods from the catalogue |
| `mod update [<mod>...]` | Update catalogue mods to their newest version |
| `mod import <file>...` | Add mods from `.mcmod`, `.zip` or `.dll` files |
| `mod set <mod>` | Change a mod's manifest |
| `mod remove <mod>...` | Remove mods from an instance |
| `mod enable <mod>... \| --all` | Turn mods on |
| `mod disable <mod>... \| --all` | Turn mods off without removing them |
| `mod path [<mod>]` | Print the folder of a mod or of the instance's mods |
| `loader versions` | List the LeviLamina versions available for a game version |
| `loader install [<version>]` | Install LeviLamina on an instance, or change its version |
| `loader remove` | Remove LeviLamina from an instance |
| `world list [<filter>]` | List the worlds of an instance and player |
| `world import <file.mcworld>...` | Import worlds from `.mcworld` files |
| `world export <world>...` | Export (back up) worlds as `.mcworld` files |
| `world copy <world>...` | Copy worlds to another instance |
| `world rename <world> <new-name>` | Change a world's display name |
| `world get <world> [<key>[/<sub>...]]` | Read world settings from `level.dat` |
| `world set <world> <key>[/<sub>...]=<value>...` | Change world settings in `level.dat` |
| `world remove <world>...` | Permanently delete worlds |
| `pack list [<filter>]` | List resource, behavior and skin packs |
| `pack import <file.mcpack\|file.mcaddon>...` | Install packs and add-ons from `.mcpack` and `.mcaddon` files |
| `pack copy <pack>... \| --all` | Copy packs to another instance |
| `pack remove <pack>...` | Delete installed packs |
| `screenshot list` | List the screenshots of an instance and player, newest first |
| `screenshot remove <name\|path>... \| --all` | Delete screenshots |
| `server list [<filter>]` | List the saved servers and check whether they are online |
| `player list` | List the player profiles of a GDK instance |
| `backup list [<instance>]` | List instance and world backups (preview) |
| `backup create [<instance>]` | Back up an instance's game data and mods (preview) |
| `backup restore [<instance>] <archive.zip>` | Restore an instance backup (preview) |

### Find things to install

| Command | What it does |
| --- | --- |
| `installer search [<version>]` | List the Minecraft builds that can be installed |
| `installer download <version>` | Download a build's installer without installing it |
| `installer list` | List downloaded installers, including unfinished downloads |
| `installer remove <version\|file>...` | Delete downloaded installers to free disk space |
| `installer mirrors <version>` | Measure the download mirrors of a GDK build |
| `curseforge search [<words>]` | Search CurseForge for worlds, add-ons, packs and skins (alias of the noun: `cf`) |
| `curseforge show <id>` | Show a CurseForge project |
| `curseforge categories` | List the CurseForge classes and categories to filter by |
| `curseforge install <id>` | Download a CurseForge file and import it into an instance |

### This PC and the launcher

| Command | What it does |
| --- | --- |
| `process list` | List running Minecraft processes, also those not started by the launcher (alias: `ps`) |
| `process stop [<instance>\|<pid>...]` | Force-close running Minecraft (progress since the last autosave is lost) |
| `account status` | Show the signed-in Microsoft account and which editions it owns |
| `account login` | Sign in to a Microsoft account, or switch accounts |
| `account logout` | Forget the launcher's Microsoft account |
| `config list` | List launcher settings and folders |
| `config get <key>` | Print the value of a setting |
| `config set <key> <value>` | Change a setting |
| `config unset <key>` | Return a setting to its default |
| `cache clean [packages\|downloads\|partial]...` | Free disk space used by caches |
| `doctor [--fix [<fix>...]]` | Check what Minecraft and mods need on this PC; `--fix` repairs it (`vcruntime`, `gameinput`, `loader-migration`, `developer-mode`) |
| `self-update` | Update LeviLauncher itself to the newest release |
| `version` | Print version information |
| `help [<command>...]` | Help for any command, with examples |

Every `list` verb also answers to `ls`, and every `remove` verb to `rm`. The settings that `config` reads and changes are listed in [All Settings](./settings#command-line-keys).

### Versions and packages

- `<version>` of `install` and `installer` is a build from `installer search`: exact (`1.21.50.07`), a dotted prefix (`1.21.50` is the newest `1.21.50.x`; `1.21.5` does not match it) or `latest`. `<file>` is a local `.msixvc`, `.appx`, `.msix`, `.appxbundle` or `.msixbundle`.
- `<package>` of `mod install` is `owner/repo`, `github.com/owner/repo` or a URL, optionally with `#variant` and `@version`.

## Global flags

These flags work with every command:

| Flag | Meaning |
| --- | --- |
| `-i`, `--instance <name>` | The instance to act on |
| `-p`, `--player <id\|gamertag>` | The player profile, on GDK instances |
| `--json` | Machine-readable output on stdout |
| `-q`, `--quiet` | Only print identifiers; no progress or notices |
| `-v`, `--verbose` | More detail, and the launcher log on stderr |
| `-y`, `--yes` | Answer yes to confirmations |
| `--no-input` | Never prompt |
| `-h`, `--help` | Help for a command |
| `--version` | Print the version |

**Which instance:** `-i`, else the environment variable `LEVILAUNCHER_INSTANCE`, else the default instance (`use`), else the only instance. **Which player:** `-p`, else `LEVILAUNCHER_PLAYER`, else the only profile, else the profile of the signed-in account.

## Output

- Results go to stdout. Progress, notices and errors go to stderr; an error is printed as `error:`, with a `hint:` and an error code such as `[ERR_GAME_RUNNING]`.
- `--json` prints one JSON document: an array for lists, an object otherwise, with camelCase keys, RFC 3339 times and sizes in bytes.
- `-q` prints identifiers only, one per line.

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | OK |
| 1 | Failed |
| 2 | Usage error |
| 3 | Not found |
| 4 | Conflict (for example, the game is running) |
| 5 | Sign-in or licence |
| 6 | Network |
| 7 | Partly done |
| 8 | Needs a system change or administrator rights |
| 9 | Timeout |
| 10 | Cancelled |
| 130 | Interrupted (Ctrl-C) |

`launch --wait-exit` returns the game's own exit code instead.

## Window switches

These arguments open the window instead of running a command:

| Argument | Effect |
| --- | --- |
| `--launch=<instance>` | Open the launcher and start the instance; desktop shortcuts use it. If the launcher is already running, it starts the instance there. |
| `--debug` | Also show the launcher log in a console window (`debug`, `-debug` and `/debug` work too). |
