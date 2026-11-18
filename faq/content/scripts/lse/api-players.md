# LegacyScriptEngine API: players

## What is the difference between `player.name` and `player.realName` on an LSE Player object? Which should I use?

`player.realName` is the player's real name (taken from the Xbox Live name in the login identity, and not affected by plugin renames); `player.name` is the current name field of the player object and may be changed by plugins or interfaces (such as rename-related APIs). Use `realName` for identification or to show the real player name. As a key for storing player data, however, `player.uuid` is recommended (`realName` also changes when a player changes their Xbox name).

*Applies to: all current LSE versions*

## In LSE, can a Player object saved earlier still be used after the player goes offline? Does an exception thrown by a plugin make the server exit?

Do not rely on the old object. LSE's Player object internally holds only a weak reference to the player entity; after the player goes offline the entity is destroyed, and the old object's properties and methods cannot find the player and return null/undefined (when the player rejoins it is a new entity, and the old object does not recover). The correct approach is to save the uuid/xuid, get the player again with `mc.getPlayer(...)` when needed, and check for null before acting, for example in timers. An uncaught exception in a plugin callback is caught by LSE and logged as an error; it does not make the server exit.

*Applies to: current LSE version*

## How do I play a sound to a player in an LSE script plugin?

LSE has no dedicated API for playing sounds. There are two approaches:

1. Run the vanilla `playsound` command, for example ``mc.runcmd(`playsound random.levelup "${pl.realName}"`)`` or `mc.runcmdEx(...)`.
2. Build a `PlaySoundPacket` yourself with `BinaryStream`, create it with `createPacket`, and send it with `pl.sendPacket(packet)`. See the NBSPlayer implementation for reference: <https://github.com/lgc-LLDev/NBSPlayer/blob/master/src/player.ts#L52-L73>.

If a command is enough, it is simpler; sending a packet is more flexible (it does not spam command output). Both approaches work.

*Applies to: all current versions of LegacyScriptEngine on LeviLamina*

## What do I pass as the dimension parameter when teleporting or constructing coordinates in LSE? The docs write `[dimid]`; do I pass an array?

The square brackets in the docs mean an optional parameter, not an array. Pass the dimension ID as a plain number: 0 = Overworld, 1 = Nether, 2 = End. `IntPos`/`FloatPos` consist of x, y, z and `dimid`, such as `new IntPos(0, 64, 0, 0)` / `new FloatPos(0.5, 64, 0.5, 0)`. Then teleport with `pl.teleport(pos)` or `pl.teleport(x, y, z, dimid)`.

*Applies to: all current LSE versions*

## How do I let a player fly in survival mode in LSE? Why does editing `abilities.mayfly` via `pl.getNbt()` and writing it back with `pl.setNbt()` have no effect?

Editing the `abilities` in the player's NBT directly has no effect. Use the Player's `setAbility` interface: `pl.setAbility(AbilityID, value)`, where `AbilityID` is an Integer and `value` is a Boolean that says whether to enable it. The ID for allowing flight (mayfly) is 10 (`AbilitiesIndex::MayFly`), for example `pl.setAbility(10, true)`. After the call, the ability data is synced to the client and takes effect immediately.

*Applies to: all current LSE versions*

## Calling `player.sendToast` in an LSE JS plugin gives a parameter error or has no effect, and `${variable}` in the string is not replaced. How should I write it?

`sendToast` requires two string parameters, a title and a message, that is `player.sendToast(title, message)`; passing fewer causes a parameter error. Also, in JS only template strings wrapped in backticks `` ` `` interpolate `${}`; with single or double quotes, `${}` is treated as plain text. Write it like ``player.sendToast("提示", `欢迎 ${player.realName}`)``.

*Applies to: all current versions of LegacyScriptEngine*

## How do I refresh the sidebar for all online players on a timer in an LSE JS plugin?

The sidebar is a method of the Player object (`player.setSidebar`), not a global method, so to set it for everyone you need to iterate over the online players, and the content has to be refreshed periodically. You do not need to do this in `onTick`; `setInterval` is enough, for example:

```js
setInterval(() => {
  for (const player of mc.getOnlinePlayers()) {
    player.setSidebar(title, data);
  }
}, milliseconds);
```

You can also use `mc.getOnlinePlayers().forEach(...)`. It is also recommended to initialize the sidebar once when a player joins the server.

*Applies to: all current versions of LegacyScriptEngine (formerly LLSE)*

## How do I get the players within a given radius of a player in an LSE plugin? Using the `execute` command and parsing the output with a regex often fails.

Avoid doing this with commands. Iterate over the online players and filter by distance instead:

```js
let plnames = mc.getOnlinePlayers().filter(player => player.distanceTo(pl) < R).map(player => player.realName);
```

Here `pl` is the center player and `R` is the radius (in blocks). `distanceTo` accepts an Entity, Player, IntPos or FloatPos. For a player in a different dimension it returns the maximum integer value, so that player is filtered out automatically. To exclude the center player, add a check such as `player.xuid !== pl.xuid`.

## In LSE JS, I want to maintain a list of online players, but removing a player with `list.filter` after they leave does not work. How should I write it?

`Array.prototype.filter` does not modify the original array, so you must assign the result back:

```js
let list = [];
mc.listen("onJoin", player => { list.push(player.realName); });
mc.listen("onLeft", player => { list = list.filter(name => name !== player.realName); });
```

You can also skip maintaining the list yourself and use `mc.getOnlinePlayers()` to get the current online players. For example, write to a JsonConfigFile in `onLeft`: `config.set("players", mc.getOnlinePlayers().map(p => p.realName).filter(n => n !== player.realName))` (when `onLeft` fires, the leaving player may still be in the online list, so filter that player out manually).

*Applies to: current version (JS engine)*

## How do I get the list of names of all online players in an LSE JS plugin (for example, to save it to JSON)?

Use `mc.getOnlinePlayers().map(player => player.realName)` to get an array of the online players' real names, then write it to JSON (for example with the `set` method of JsonConfigFile). To add an element to an array, use `push`.

*Applies to: current version (JS engine)*

## In an LSE JS plugin, I want to send a player's coordinates with `pl.tell`, but passing `pl.pos` directly throws an error or the coordinates don't show. How should I write it?

`pl.pos` returns a position object (FloatPos), while the first parameter of `pl.tell` must be a string. Passing the object directly fails the parameter type check and throws an error. Convert it to a string with `pl.pos.toString()` before sending (or use the template string `` `${pl.pos}` ``). You can also build the string yourself from `pl.pos.x` / `pl.pos.y` / `pl.pos.z` / `pl.pos.dimid`.

## In LSE, how do I give a player an effect with unlimited duration using `pl.addEffect()`?

Pass `-1` as the duration parameter of `pl.addEffect(id, tick, level, showParticles)` to get an unlimited-duration effect (the same as vanilla `/effect ... infinite`). This behavior depends on how vanilla BDS handles a duration of `-1`.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## In LSE, `pl.getScore()` throws an error when the scoreboard objective does not exist. How can I handle this?

This is by design. The docs state that "the objective must exist before use", and there are no plans to change it. You can write your own wrapper: first check whether the objective exists with `mc.getScoreObjective(name)`, and if it does not, create it with `mc.newScoreObjective(name, displayName)` or return 0 directly. Or wrap `pl.getScore()` in `try/catch`. You can also use the scoreboard interface of a third-party dependency plugin (such as GMLIB).

## In LSE, `pl.isOp()` fails because it does not exist. What is the API to check whether a player is an OP?

The LSE API is named `pl.isOP()` (OP in all capitals). `isOp` is incorrect, because JS is case-sensitive.

## In LSE, `player.isSurvival` also returns true for players in Adventure mode. How do I determine a player's game mode accurately?

`pl.isSurvival` directly calls BDS's `Actor::isSurvival()`, whose semantics are defined by vanilla, so it should not be used to tell Survival from Adventure. For an exact check, use `pl.gameMode` (a number corresponding to GameType: 0 Survival, 1 Creative, 2 Adventure, 6 Spectator), for example `if (pl.gameMode === 2) { /* Adventure */ }`. You can also use `pl.isAdventure` to check for Adventure mode directly.

## In LSE, what values does the color parameter of `setBossBar` accept?

The `colour` parameter of `pl.setBossBar(uid, title, percent, colour)` is an integer that is converted directly to the BDS BossBarColor enum: 0 Pink, 1 Blue, 2 Red, 3 Green, 4 Yellow, 5 Purple, 6 RebeccaPurple, 7 White. For example, `pl.setBossBar(1145141919, "Hello", 80, 2)` shows a red boss bar.

## In LSE, how do I reliably get a simulated player summoned by a player, or a player with a given name? What are the pitfalls of `mc.getPlayer(name)`?

`mc.getPlayer(name)` does a case-insensitive prefix match on the name. An exactly equal name takes priority; otherwise it returns the shortest player name that starts with the string, so you may get a different player. After getting the result, check that the returned object's `name` is exactly equal to the target name. A more reliable approach is to save and look up by UUID or XUID (`mc.getPlayer` also accepts UUID/XUID/UniqueId/RuntimeId). Giving simulated players a prefix or marker in their names that real players cannot use also prevents conflicts.

## In LSE, I want a boss bar (bossbar) to refresh continuously, but `setInterval(player.setBossBar(...), 500)` runs only once or reports that player is undefined. What is the correct way to write it?

The first argument of `setInterval` must be a function. Writing `setInterval(player.setBossBar(...))` runs `setBossBar` once immediately and passes its return value as the argument. Pass an anonymous function instead, keep the id returned by `setInterval`, and call `clearInterval` when the boss dies.

Do not hold on to mc objects such as player or entity for a long time. Store the xuid, and in the timer get the player again with `mc.getPlayer(xuid)` and check for null. Example:

```js
let players = [];
mc.listen("onAttackEntity", (pl, en) => {
  if (!en.hasTag("boss")) return;
  if (!players.includes(pl.xuid)) players.push(pl.xuid);
});
const timer = setInterval(() => {
  for (const xuid of players) {
    const p = mc.getPlayer(xuid);
    if (!p) continue;
    p.setBossBar(bossId, "Name", Math.floor(boss.health / boss.maxHealth * 100), 2);
  }
}, 500);
```

After the boss dies, call `clearInterval(timer)` and call `removeBossBar(bossId)` on the players. The parameters of `setBossBar` are `(uid, title, percent 0~100, colour)`. To show the bar to all nearby players, iterate over `mc.getOnlinePlayers()` and filter by distance.

*Applies to: all current LSE versions*

## When registering a player PAPI (PlaceholderAPI) variable in an LSE script, how do I receive extra parameters? The documentation only has an example for server PAPI, and the callback receives only the player object.

In the callback that registers the player variable, add one more parameter after the player object to receive the extra parameter, so the callback looks like `(pl, param) => {...}`. Autocompletion and type declarations may not have caught up yet; rely on what the PAPI plugin actually passes in. If you are unsure, print `param` with `log` first to see its structure.

This relies on a third-party PlaceholderAPI plugin being installed (one that provides the LSE binding for `registerPlayerPlaceholder`).

*Applies to: environments with a third-party PlaceholderAPI plugin installed. Not confirmed against the source code or the documentation: treat it as a pointer.*

## In LSE, how do I tell when a player has finished loading after changing dimension?

Read the player object's `pl.isLoading` property (it indicates whether the player is still loading). In the `onChangeDim` event, poll with `setInterval` / `setTimeout` until it becomes `false`, then continue. Many player properties may be `undefined` while the dimension change is in progress, so check for null values.

Note that `onChangeDim` is not triggered when the player returns from the End to the Overworld through the portal.

*Applies to: LSE 0.23.x. Not confirmed against the source code or the documentation: treat it as a pointer.*

## In LSE, after changing a player's overhead name with `pl.rename(newName)`, `pl.name` still returns the real name. Is there a way to get the name displayed above the player's head (the nametag)?

`pl.rename` actually changes the player's NameTag, while `pl.name` / `pl.realName` return the player's original name and do not change. LSE 0.19.1 added `en.getCustomName()`, which returns the entity's NameTag, so you can get the displayed overhead name with `pl.toEntity().getCustomName()`.

If you also need to maintain a "real name to fake name" mapping or check for duplicate names, it is still recommended to record the uid, real name and fake name yourself (in a file or a database) when you call `rename`, and to compare against all player information from `data.getAllPlayerInfo()` when needed.

Versions before 0.19.1 can only keep their own records.

*Applies to: LSE 0.19.1 and later*

## In LSE, what should I pass as the uid when setting a BossBar for a player with `pl.setBossBar`?

A BossBar works by sending the player a fake entity (AddActor) and then a BossEvent packet. The uid is the ID of that fake entity: use any number that does not conflict (negative numbers also work). One uid corresponds to one BossBar row, and you use the same value in `removeBossBar(uid)`.

Do not use the `uniqueId` of an existing entity: LSE does not check, and that entity will be replaced by the fake entity on the client and disappear.

*Applies to: LSE 0.23.x*

## How do I broadcast or announce a message to all players on the server from an LSE plugin?

Use `mc.broadcast(msg[,type])` (`type` defaults to `0` for a normal message; `1` is chat, `5` is the Tip above the hotbar, and `9` is JSON). You can also iterate over the online players and send to each: `mc.getOnlinePlayers().forEach(pl => pl.tell(msg))`. You can also use ``mc.runcmd(`say ...`)`` or the `tellraw` command.

Note that with `say` the message gets a prefix such as `[服务器]` ("Server"), which varies with `language` in `server.properties`.

*Applies to: LSE 0.23.x*

## Is running the `title` / `say` commands a suitable way to show a title to a player or broadcast a message to the whole server from an LSE plugin?

Running `title` / `say` with `mc.runcmd` is not recommended; LSE has ready-made interfaces. To show a title to a player, use `pl.setTitle(content[, type[, fadeInTime, stayTime, fadeOutTime]])`; for a server-wide message, use `mc.broadcast(msg[, type])`. When an interface exists, prefer it.

*Applies to: all current LSE versions (including v0.23.1)*

## Does LSE have an API to check whether a player is crawling / swimming?

Yes. The `player.isSwimming` and `player.isCrawling` properties, available since LSE 0.19.1.

*Applies to: LSE 0.19.1 and later*

## In LSE's TypeScript type definitions, the player object returned by `mc.getPlayer` has no simulated player (`SimulatedPlayer`) methods. How do I call the simulated player API?

In the type definitions, `mc.getPlayer` returns `Player`, and `SimulatedPlayer` extends `Player` (`declare class SimulatedPlayer extends Player`). At runtime, the `simulateXxx` methods of a simulated player are already on the player object; only the types do not match. First check with `player.isSimulatedPlayer()`, then assert the type manually with `(player as SimulatedPlayer)` and call the method. You can also bypass type checking with `// @ts-ignore`. A player created with `mc.spawnSimulatedPlayer` is returned directly as type `SimulatedPlayer`.

*Applies to: current version (LSE TS plugins using the `legacy-script-engine-api` type definitions)*

## Why does `pl.xuid` return an empty value in an LSE script?

Check `online-mode` in `server.properties`. In offline mode, players are not verified by Xbox and have no XUID, so `pl.xuid` is an empty string. Also, if you pass players between plugins through remote calls (`ll.exports` / `ll.imports`), make sure what you pass is really a `Player` object and not a plain `object`.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## In an LSE script plugin, a player cannot move after dying and respawning (the joystick disappears on mobile) and the console shows no error. What could be the cause?

This is usually a logic error in the plugin itself, and the engine does not report an error. There are two common causes. First, the plugin keeps setting the player's health (such as `setHealth`) after the player dies, which leaves the player in an abnormal state. Second, the `onMobHurt` event callback damages the player again (such as `hurt`), and that damage triggers `onMobHurt` again, causing infinite recursion or a loop. Find and fix such logic: for example, check in the callback whether the player is already dead, avoid causing damage directly inside `onMobHurt`, or add a re-entry flag.

*Applies to: current version (a script logic problem). Not confirmed against the source code or the documentation: treat it as a pointer.*

## After uninstalling a mod/plugin that changed max health, a player's max health is still not the default. How do I set a player's max health back to 20 directly from the server console?

In the server console, run LSE's script debug command:

```shell
jsdebug mc.getPlayer('player name').setMaxHealth(20)
```

This restores the player's max health to 20. Note that the debug command depends on the backend: `jsdebug` for the QuickJS backend, `nodejsdebug` for the Node.js backend, `luadebug` for Lua and `pydebug` for Python.

*Applies to: LeviLamina + LSE (with the matching script backend installed)*

## In LSE, which keys in the player NBT hold the inventory and other item data?

These keys are all at the root of the player NBT: `Armor` (armor slots), `Inventory` (inventory slots), `Offhand` (offhand slot), `PlayerUIItems` (UI items such as the cursor and crafting grid). For online players, use container interfaces such as `pl.getInventory()` / `pl.getArmor()` instead. For offline players, read the NBT with `mc.getPlayerNbt(uuid)` and take these keys.

*Applies to: LeviLamina + LegacyScriptEngine (key names depend on the vanilla BDS world format). Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I change a player's flying speed (LSE plugin)?

LSE has no API that sets flying speed directly (`player.setAbility` can only set boolean abilities). You can get the player NBT with `player.getNbt()`, modify the `flySpeed` field under `abilities` (default `0.05f`), then write it back with `player.setNbt(nbt)`. Users report that the player may need to rejoin the game for the change to take effect.

*Applies to: LSE (LeviLamina) current version (the `flySpeed` field belongs to the vanilla BDS player NBT structure). Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I quickly check an online player's UUID in the server console (to find that player's data file)?

Run LSE's debug command in the console (QuickJS engine): `jsdebug mc.getPlayer('player name').uuid`. Note that the player must be online for `mc.getPlayer` to find them.

*Applies to: current version (requires the QuickJS engine)*

## Is there an API for a player's online time / play time in plugin development?

LSE/LeviLamina provide no play-time API directly, and Bedrock BDS itself does not store a player's play time (`Age` in the player NBT is not that). A plugin needs to record the time itself when the player joins (`onJoin`) and leaves (`onLeft`) and save the accumulated total; or you can simply install an existing online-time plugin.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## Is there a way to make a Bedrock server's maximum player count change dynamically: `maxplayers` is 1 when nobody is online and increases by one for each player who joins?

An LSE JS plugin can do it in a few lines:

```js
setInterval(() => mc.setMaxPlayers(mc.getOnlinePlayers().length + 1), 1000);
```

You can also use the existing third-party plugin DynamicPlayerLim (<https://www.minebbs.com/resources/dynamicplayerlim-tps.5414/>). Besides setting the limit to online players + 1, it can also stop players from joining when TPS is too low (it was originally an LL2 plugin, so test compatibility yourself).

*Applies to: LegacyScriptEngine current version*

## How do I hide the player ID (name) above players' heads on the server? Can command blocks do it?

Command blocks cannot do it; you need a plugin. The simplest way is to rename the player to an empty string (LSE's `player.rename("")`); or intercept the packets sent to the client and set the property that displays the player name to `false`.

*Applies to: LegacyScriptEngine current version*

## A player suddenly got OP on the server for no apparent reason. How do I quickly see which players are OP in `permissions.json` and check whether a plugin has a backdoor?

In the console, run the following with LSE's `jsdebug`. It converts the xuids in `permissions.json` to player names and prints them:

```text
jsdebug JSON.parse(File.readFrom("permissions.json")).map(item => data.xuid2name(item.xuid)).join(", ")
```

If the list looks normal, check whether a plugin has a backdoor. When an LSE plugin performs a sensitive operation such as setting permissions (for example `setPermLevel`), it is recorded in `logs/LegacyScriptEngine/Sensitive_Operation_Records-<backend>.log` (for the JS backend it is `Sensitive_Operation_Records-Js.log`; there are also Lua/NodeJs/Python). The format is `[operation]<plugin name> content`, so you can search it for relevant records.

*Applies to: LegacyScriptEngine current version*

## Can I rename a player in LSE (without paying for an Xbox name change)?

Yes, use the `rename` method of the player object: `pl.rename("Steve")` in JS, `pl:rename("Steve")` in Lua. It returns whether it succeeded (`Boolean`). For a temporary rename, run `mc.getPlayer("original name").rename("new name")` in the console with the QuickJS engine's debug command `/jsdebug` (the Node.js engine's equivalent is `nodejsdebug`). This only changes the name shown on the server; it does not change the player's Xbox account name.

*Applies to: LSE all current versions*

## After upgrading, players cannot break blocks or drop items (but can open chests). Why?

The cause is that plugins call `pl.setAbility(AbilityID, value)` with numeric indexes that do not match the current BDS `AbilitiesIndex` enum (LSE converts the number directly to `AbilitiesIndex`). Old plugins set abilities using the old indexes, which switched off abilities such as mining. Update the plugin to the current enum; the current mapping is: `Build=0`, `Mine=1`, `DoorsAndSwitches=2`, `OpenContainers=3`, `AttackPlayers=4`, `AttackMobs=5`, `OperatorCommands=6`, `Teleport=7`, `Invulnerable=8`, `Flying=9`, `MayFly=10`, `Instabuild=11`, `Lightning=12`, `FlySpeed=13`, `WalkSpeed=14`, `Muted=15`, `WorldBuilder=16`, `NoClip=17`, `PrivilegedBuilder=18`, `VerticalFlySpeed=19`. A BDS update may change the enum again. If an ability has already been written and cannot be turned back on, switch the player to another game mode and back to survival to reset the abilities.
