# LegacyMoney

## LegacyMoney's `/money add` only takes a player name. Can I give players money with a target selector (such as `@s` or `@a`)? Is there something like `money_s` from LL2 LLMoney?

Yes. LegacyMoney rewrote the commands. The old LLMoney `money_s` is now written by adding `s` after the subcommand, and it uses target selectors: `/money adds <selector> <amount>`, `/money reduces <selector> <amount>`, `/money sets <selector> <amount>` and `/money querys <selector>`, for example `/money adds @s 10`. The forms without `s`, `/money add`/`reduce`/`set`/`query`, take a player name (and work on offline players). These operations require OP (GameDirectors and above) permission. See the repository README for usage.

*Applies to: LegacyMoney 0.x to current (v0.23.0)*

## Does LeviLamina still have a built-in economy system like LiteLoaderBDS? Which economy plugin do I use on LeviLamina, and how do I install and use it?

LeviLamina no longer has a built-in economy system. LLMoney from LiteLoaderBDS has been ported as the standalone mod LegacyMoney (<https://github.com/LiteLDev/LegacyMoney>), and the economy features (the `money` API) of most LSE script plugins call it.

When you install LegacyScriptEngine with lip (for example `lip install github.com/LiteLDev/LegacyScriptEngine`), it is installed automatically as a dependency. You can also install it separately: `lip install github.com/LiteLDev/LegacyMoney`.

In game, use the `/money` command (`query`/`pay`/`add`/`reduce`/`set`/`hist`/`top` and so on). The configuration file is `money.json` in the mod directory (`currency_symbol`, `def_money`, `enable_commands`, `pay_tax`).

*Applies to: all LeviLamina versions (currently LegacyMoney v0.23.0 / LSE v0.23.1)*

## The `/money` command of LegacyMoney "does not work": operating on a player says the player is not found or does nothing, or it says you lack permission. How do I fix it?

There are two common causes:

1. The message is `Player not found`, or operations on a player have no effect: `/money add/set/reduce/query/hist <player name>` look the player up by name through LeviLamina's PlayerInfo service (a player database that records uuid, xuid and name). This service is lazy-loaded by default and only starts recording joining players after it is first called, so players who joined before that and were never recorded cannot be found. In LeviLamina's `Config.json`, set `alwaysLaunch` under `playerInfo` to `true` so player info recording is enabled when the server starts (the resource cost is minimal); after that, a player is recorded the next time they join.
2. The message is `You don't have permission to do this`: the `/money` command itself is visible to everyone (its registered permission is Any), but add/reduce/set, querying another player's balance, `hist <player name>` and purge require OP (GameDirectors) or higher when executed, so ordinary players are rejected. The console has the highest permission and is not rejected for this reason, but pay and hist without a player name can only be run by a player, and the console gets `Console is not allowed to use this command`.

*Applies to: LeviLamina current version; LegacyMoney 0.23.0*

## How do I change a player's LegacyMoney balance while they are offline? Why do some offline players succeed and others fail?

Use the commands without `s` and operate by player name, which works for offline players, for example `/money add <player name> <amount>` and `/money set <player name> <amount>` (the selector versions with `s` can only select online players).

Operating by name relies on LeviLamina's PlayerInfo records to resolve the name to an xuid:

- If the player has never been recorded by PlayerInfo (for example, the PlayerInfo service was not enabled at startup and the player has not joined since), it reports `Player not found`.
- If the player's xuid is empty (for example, a player in offline mode or not signed in to Xbox), LegacyMoney returns a failure directly (`Failed to add money`).

You can set `playerInfo.alwaysLaunch` to `true` in LeviLamina's `Config.json` and have the player join the server once more to write the record. In script plugins you can also operate on offline players by xuid directly, for example with `money.add(xuid, value)`.

*Applies to: LegacyMoney v0.23.0; current LeviLamina version*

## I want my own plugin to register a command (such as `/checkin`) that gives players money (LegacyMoney currency). Can I operate on it directly?

Yes. LegacyMoney is a prerequisite mod, and LSE provides an economy interface: `money.get`/`set`/`add`/`reduce`/`trans`/`getHistory`/`clearHistory` (the parameter is the player's xuid), as well as `getMoney`/`setMoney`/`addMoney`/`reduceMoney` and others on the Player object. You can add to and subtract from a player's balance directly in a script plugin; see the "Economy System API" in the LSE documentation.

A native C++ mod can link against LegacyMoney and call the functions exported in `LLMoney.h`, such as `LLMoney_Add` and `LLMoney_Reduce`.

If you do not want to write a plugin, you can also use the command mapping feature of a third-party plugin (such as `command_map` in GMEssentials) to map a custom command to commands like `/money add`.

*Applies to: LSE v0.23.1; LegacyMoney v0.23.0*

## An LSE land claim plugin (or similar) requires spending "currency/coins" in its configuration. Where does this currency come from? What is LLMoney, and do I need to install it separately?

The economy of such LSE plugins is usually connected to the LLMoney economy system, which on LeviLamina is LegacyMoney (the port of LLMoney). The "currency/coins" the plugin refers to is its balance. When you install LegacyScriptEngine (the engine that runs JS/Lua and other script plugins), it is installed automatically as a dependency, so you do not need to install it separately. You then still need to give players a way to obtain currency through other plugins or commands, for example an admin running `/money add <player> <amount>`, or setting `def_money` in `money.json` as the starting amount for new players.

*Applies to: all current LSE / LegacyMoney versions*

## `/money` used to open a GUI form, but it disappeared after updating LSE. Was LegacyMoney's built-in GUI removed?

LegacyMoney has never had a GUI; it only has commands. The form you saw came from another LSE plugin (such as TMEssential/TMET) that registered a `/money` command with the same name and overrode the LegacyMoney command. Newer LSE versions tightened command registration: an existing command can no longer be overridden by a script (you only get a message that the command already exists), so the form is gone.

To fix it:

- Change the command name registered by that LSE plugin (for example to `/moneys`).
- Or use another plugin that provides an economy GUI.
- If you do not need LegacyMoney's own commands, set `enable_commands` to `false` in LegacyMoney's `money.json` to free up the `/money` command name.
- You can also file a feature request in the LegacyMoney repository.

LegacyMoney v0.23.0 still has no GUI.

*Applies to: LSE 0.17.x and later; LegacyMoney current version*

## Does LegacyMoney (LLMoney) support multiple currencies or decimal amounts?

No. LegacyMoney is a single-currency system: each player (xuid) has exactly one balance, and amounts are integers (internally `long long`; the LSE API parameter type is Integer). For multiple currencies, use a scoreboard or a similar approach. If you need decimals (for example two decimal places), store the smallest unit as an integer (such as cents) and convert when displaying.

*Applies to: LegacyMoney, all current versions*

## Does LegacyMoney (LLMoney) support using a UUID as the player identifier?

No. LegacyMoney identifies players by xuid, and all interfaces (`LLMoney_*` and LSE's `money.*` API) take an xuid. Players without an xuid (for example in offline mode without an Xbox login) cannot use it, and the related operations simply return failure. If you only have a UUID, first convert it to an xuid through LeviLamina's PlayerInfo (`ll::service::PlayerInfo::fromUuid`) or LSE's data API.

*Applies to: LegacyMoney, all current versions*

## How do I view the economy (money) transaction history with LegacyMoney?

Use `/money hist` to view your own history (players only; the optional `time` parameter is in seconds and defaults to the last 24 hours). Operators can use `/money hist <player name> [time]` to view another player's history (a query from the console must include the player name). To clear the history, use `/money purge`, then confirm with `/money purge confirm [time]`. In scripts, use LSE's `money.getHistory(xuid, time)`.

*Applies to: LegacyMoney, all current versions*

## Does LeviLamina itself include an economy system? How do I synchronize LegacyMoney data between servers and teleport across servers?

LeviLamina itself does not include an economy system. The economy is provided by a separate native mod, LegacyMoney (`lip install github.com/LiteLDev/LegacyMoney`). LegacyScriptEngine depends on it, so it is pulled in automatically when you install LSE. LegacyMoney stores its data only in a local SQLite database (`mods/LegacyMoney/economy.db`) and provides no cross-server synchronization or cross-server teleportation. For that you need a third-party cross-server coordination plugin (for example CoordinationWSS on MineBBS, which includes cross-server teleportation) or your own synchronization solution.

*Applies to: current version (LegacyMoney 0.23.x; LeviLamina 26.60.x). Not confirmed against the source code or the documentation: treat it as a pointer.*

## What features does the refactored LegacyMoney have? Can it back up scoreboard data?

LegacyMoney supports a ranking query (`/money top [number]`, top 10 by default), a custom currency symbol through the `currency_symbol` config option, and Chinese localization (`lang/zh_CN.json`). It does not back up scoreboard data. The economy data itself is stored in `mods/LegacyMoney/economy.db` (SQLite); to back up scoreboards, find a third-party tool or plugin.

*Applies to: LegacyMoney 0.2 and later*

## Where do I download LLMoney (the economy plugin)? I cannot find it on MineBBS.

The successor of LLMoney on LeviLamina is called LegacyMoney. It is published on GitHub by LiteLDev (<https://github.com/LiteLDev/LegacyMoney>) and is best installed with lip: `lip install github.com/LiteLDev/LegacyMoney`. The old LLMoney repository is archived and does not work with LeviLamina.

*Applies to: all LeviLamina versions*

## How do I install LegacyMoney manually from GitHub (without lip)?

Installing with lip is recommended (`lip install github.com/LiteLDev/LegacyMoney`); it handles the LeviLamina version dependency automatically.

To install manually:

1. Download the archive for your side from the Release (for a server: `LegacyMoney-server-windows-x64.zip`).
2. Extract it, take only the `LegacyMoney` folder, and put it in the server's `mods` directory (that is, `mods/LegacyMoney/`).

Note that the LegacyMoney version must match the LeviLamina version (for example, 0.23.x corresponds to LeviLamina 26.60.*).

*Applies to: LegacyMoney 0.8 and later*

## A player's balance in the economy plugin (LegacyMoney) is -1 and setting any value with commands has no effect. What is the cause?

Usually `online-mode` is turned off in `server.properties`. With online mode off, players have no xuid, and LegacyMoney uses the xuid as the key: when the xuid is empty, a balance query returns -1 and set/add/reduce fail immediately. Keep `online-mode=true`; data created while it was off may not match any player because the xuid is missing or wrong. A database read/write error also returns -1, so check the console for `Database error` log lines.

*Applies to: LegacyMoney 0.8.4 and later*

## Can I just include `LLMoney.h` to call the LegacyMoney (LLMoney) API from a C++ plugin?

No. First add the `legacymoney` package from levimc-repo in `xmake.lua`, for example `add_requires("legacymoney 0.23.*")`, and call `add_packages("legacymoney")` in your target. Then `#include "LLMoney.h"` and use functions such as `LLMoney_Get` and `LLMoney_Add` (you need to link its import library). LegacyMoney must also be installed on the server at runtime; declare it as a dependency of your mod.

*Applies to: LegacyMoney, all current versions*

## LLMoney downloaded manually from <https://github.com/LiteLDev/LLMoney/releases> breaks under LeviLamina (economy data is reset, the db/config files disappear). Does LLMoney not support LeviLamina?

LLMoney is a LiteLoaderBDS-era plugin; its repository is archived and it does not support LeviLamina. On LeviLamina, use its successor LegacyMoney (<https://github.com/LiteLDev/LegacyMoney>) and install it with `lip install github.com/LiteLDev/LegacyMoney`; do not download files and drop them in manually as in the LL2 days. The data is in `mods/LegacyMoney/economy.db` (the config is `mods/LegacyMoney/money.json`). To keep old data, copy your existing `economy.db` into that directory; put an old LL2-format `money.db` at `mods/LegacyMoney/LLMoney/money.db`, and it is converted automatically on startup.

*Applies to: all LeviLamina versions*

## Why does the LegacyMoney (llmoney) database file keep growing? How do I clean it up?

Besides the balance table `money`, the database `mods/LegacyMoney/economy.db` has a transaction table `mtrans`. Every transfer and every addition or deduction of money is written to it, and the rows add up. To clear the transaction history, an OP (GameDirectors or higher) runs `/money purge confirm [time]` (running just `/money purge` only warns that the operation is dangerous and asks you to add `confirm`; `time` is in seconds and only transactions older than that are deleted; the default 0 clears everything). You can also stop the server and delete useless data manually with an SQLite tool (for example records with a zero balance).

*Applies to: LegacyMoney 0.7 and later*

## In which file does LegacyMoney (formerly LLMoney) store the economy data on LeviLamina?

The economy data is an SQLite database in the mod directory: on a server it is `.\plugins\LegacyMoney\economy.db` (both the balance table `money` and the transaction table `mtrans` are in it). `money.json` in the same directory is the config file. If the mod directory contains data from the old LLMoney at `.\plugins\LegacyMoney\LLMoney\money.db`, LegacyMoney imports it into `economy.db` automatically on startup and renames the original file to `money_old.db`.

This also applies to the current LegacyMoney v0.23.0 (the server's mod root directory is `plugins/`).

*Applies to: LeviLamina 0.13.x and later*
