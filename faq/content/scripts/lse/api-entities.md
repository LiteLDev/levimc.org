# LegacyScriptEngine API: entities

## In LSE, I want the damage source of `pl.hurt(damage[,type[,source]])` to be another player. Can I pass a Player object directly? What is the difference between Player and Entity objects, and how do I convert a Player to an Entity?

LSE's Player object (runtime class name `LLSE_Player`) contains most of the methods and properties of Entity, but it is a different type. For interfaces that need an Entity argument, use `pl.toEntity()` to convert the player to an entity object (it returns `null` if the conversion fails); `toEntity` has long been available.

In the current version, the `source` parameter of `pl.hurt` / `en.hurt` accepts both Entity and Player objects internally, so you can call `target.hurt(damage, ActorDamageCause.EntityAttack, attackerPlayer)` directly; passing `attackerPlayer.toEntity()` also works. If you need vanilla damage calculation (armor reduction and so on), you can also use a command:

```js
mc.runcmdEx(`execute as "<attacker>" run damage <target> <amount> entity_attack entity @s`)
```

*Applies to: LSE 0.23.x*

## `entity.hurt()` in LSE needs an integer damage type. How do I get the enum values? Can the `cause` from the `onMobHurt` event be passed straight to `hurt()`?

LSE registers a global damage cause enum object `DamageCause` (and keeps `ActorDamageCause` with the same content for compatibility). Keys are the enum names and values are ints, and you can use them directly, for example `pl.hurt(1.0, ActorDamageCause.Fire)` or `pl.hurt(1.0, DamageCause.Fire)`. The signature of `hurt` is `hurt(damage, type?, source?)`. The `cause` parameter of the `onMobHurt` callback is the integer value of this enum and can be passed straight to `hurt()`. The enum definition in the LeviLamina source `src/mc/deps/shared_types/legacy/actor/ActorDamageCause.h` is authoritative (the enum table in the docs may be incomplete).

*Applies to: current LSE version*

## In LSE, `entity.name`/`getName` returns the untranslated key for Addon mobs (even though the resource pack's `zh_CN.lang` has a translation). How do I translate the entity name into a given language?

The cause is that since 1.19.80 BDS has changed the loading order: the server I18n loads before resource packs, so the server only loads the vanilla language files, and the language files in Addon resource packs never enter the server I18n. Options:

1. For vanilla entities, take the entity `type` (such as `minecraft:zombie`), remove the `"minecraft:"` prefix to form the language key `entity.<name>.name` (such as `entity.zombie.name`), and translate that.
2. Install the third-party GMLIB. Its built-in I18nFix corrects the loading order (disabled by default; it must be enabled through the C++ interface or by a plugin that depends on it). Alternatively, use the interface provided by GMLIB-LRCA to load the resource pack's `zh_CN.lang` into the server I18n manually; after that, interfaces that use server-side translation, such as `entity.name`, return the Chinese name directly.
3. Parse the resource pack's `.lang` files yourself and build a mapping, or use LSE's built-in `i18n.load` to load your plugin's own translation files and translate with `i18n.tr`/`trl` (note that this is the plugin's own translation system, not BDS's I18n).

*Applies to: BDS 1.19.80 and later; GMLIB-related options are third-party plugins. Not confirmed against the source code or the documentation: treat it as a pointer.*

## In an LSE JS plugin, using an entity object as a Map key or comparing two entity objects with `==` fails to find or match them. What should I do?

Every entity/player object that LSE returns is a newly created JS wrapper object with no custom equality logic, so comparing them directly with `==`/`===` or using them as Map keys never matches. Use the entity's `uniqueId` as the key or comparison basis, for example `Boss.find(entity => entity.uniqueId == mob.uniqueId)`.

## Which parameters does `entity.distanceTo()` accept in LSE? Passing `pos.x`/`pos.y`/`pos.z` gives a parameter type error or `too few arguments`. What should I do?

With one parameter, `distanceTo` accepts an IntPos, FloatPos, Player or Entity (pass a position object such as `player.pos` directly, without splitting it into `.x` `.y` `.z`). Otherwise you must pass 4 numeric parameters: `x, y, z, dimid` (passing only 3 gives a parameter count error). For example:

```js
const pos = player.pos;
if (entity.distanceTo(pos) > R) { /* ... */ }
```

If the target is in a different dimension than the entity, the return value is a very large number (`INT_MAX`). Player also has a `distanceTo` with the same name, plus the alias `distanceToPos`.

## In LSE, why does checking whether an entity is a player with `entity.isPlayer` (without parentheses) always succeed?

`isPlayer` is a function, so write `entity.isPlayer()` (with parentheses, like `pl.isOP()`). Without parentheses you are testing the function object itself, which is always truthy because the function exists.

## In LSE, how do I convert an entity object (Entity) to a player object (Player)?

Use `en.toPlayer()`. It returns `null` if the entity is not a player or the conversion fails, so you can check with `en.isPlayer()` first. This API is on the "Entity" page of the docs, and you can also find it in the d.ts type definitions in the legacy-script-engine-api repository (`GameAPI/Entity/Entity.d.ts`). For the reverse direction, use `pl.toEntity()`.

## In LSE, how do I open a menu when a player right-clicks (interacts with) or left-clicks (attacks) an entity?

For right-click interaction, use the `onPlayerInteractEntity` event, added in LSE 0.9.5:

```js
mc.listen("onPlayerInteractEntity", (pl, en, pos) => {
  if (en.type == "minecraft:entity_id") {
    pl.runcmd("command that opens the menu");
  }
});
```

Interaction means a right mouse click, a long press on a touch screen, or pressing the interact button on the entity.

For left-click attacks, use `onAttackEntity(player, entity)`, or `onMobHurt`:

```js
mc.listen("onMobHurt", (m, s, d, c) => {
  if (s && s.isPlayer() && m.type == "minecraft:entity_id") {
    s.toPlayer().runcmd("command that opens the menu");
  }
});
```

Note that the `source` of `onMobHurt` may be `null`, so check it first.

*Applies to: LSE 0.9.5 and later*

## Does the LSE JS plugin API have an interface for spawning or handling experience orbs?

There is no dedicated experience orb interface, but you can use the generic entity spawning interface: `mc.summonMob("minecraft:xp_orb", pos)` (it takes the same path as `/summon` and is available since 0.19.1) spawns the orb and returns an `Entity` object, which you then handle with the entity API. You can also use `mc.runcmdEx("summon xp_orb x y z")`. See the entity API page for details: <https://levimc.org/LegacyScriptEngine/apis/GameAPI/Entity/>.

*Applies to: LSE 0.19.1 and later (`summonMob`)*

## How do I generate loot (drops) for a mob in an LSE script?

LSE has no direct loot table API. The options are:

1. Spawn an entity of the same type with `mc.spawnMob(type, pos)`, then kill it with `entity.hurt(damage[, type[, source]])` so it drops items.
2. Use the vanilla `/loot` command (`mc.runcmd`). The source can be an entity (`kill`) or a loot table (`loot`), and you can combine it with `mainhand` and similar options to simulate killing with a tool (such as Looting).
3. Read the loot table json yourself and compute the drops.
4. Implement it in a C++ mod and export it to scripts.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I apply an impulse or velocity to a player in LSE (like `applyImpulse` in ScriptAPI)?

Use `setPosDelta` on `Entity`: `player.toEntity().setPosDelta(x, y, z)`, or pass a `FloatPos` with `en.setPosDelta(delta)`. It sets the entity's per-tick position change (its motion), works on players as well, and returns whether it succeeded.

## In LSE, calling `mc.spawnMob` inside a mob spawn event callback causes an infinite loop / stack overflow and crashes the server. Why, and how do I avoid it?

`mc.spawnMob` calls the Level's Spawner (`BedrockSpawner`) `spawnMob` underneath, which is the same logic as natural spawning. The mob spawn event (`onMobTrySpawn`, formerly `onMobSpawn`) hooks exactly this function, so calling `spawnMob` again in the callback triggers the event again and recurses forever.

Solutions:

- Guard against re-entry with a flag variable: when the event fires, return immediately if the flag is `true`; otherwise set it to `true`, spawn the entity, then set it back to `false`.
- Or use `mc.summonMob`, added in LSE 0.19.1. It uses the spawn logic of the summon command and does not go through `Spawner::spawnMob`, but the spawned entities are made persistent and never despawn naturally, so be careful with heavy use.

Also, the entity does not exist yet when the spawn event fires, so adding a tag afterwards to identify it does not work. If you only want more mobs to spawn, it is better to change the herd size in `spawn_rules` with a behavior pack.

*Applies to: LeviLamina + LegacyScriptEngine current version (`mc.summonMob` requires LegacyScriptEngine 0.19.1 or later)*

## I want to disable almost all entity spawning with LSE (including spawn eggs, commands, etc.). Can LSE do that?

What LSE can intercept is mob spawning that goes through `Spawner::spawnMob`:

- `onMobTrySpawn`: `return false` to intercept. The documentation describes it as "an entity attempts to spawn naturally", but it actually hooks `BedrockSpawner::spawnMob`, so non-natural paths such as LSE's own `mc.spawnMob` also trigger it. Whether spawn eggs and other paths go through this function needs to be tested yourself.
- `onMobSpawned`: a notification after spawning completes; it cannot be intercepted.
- For projectiles, use `onSpawnProjectile`.

`/summon` does not go through `spawnMob` (its spawn logic lives in the anonymous-namespace function `CommandUtilsAnon::_spawnEntityAt`), so intercepting it requires a native C++ hook. Deleting the entity registrations directly is possible in theory, but it is too invasive and may cause plugin conflicts and other problems, so it is not recommended.

*Applies to: LegacyScriptEngine current version*

## How do I attach custom data to an entity (like custom NBT on an item), and how do I get a single entity by `uniqueId` in LSE?

You can take the entity's `uniqueId` and store the data in the plugin's own data file, or add a tag to the entity with `en.addTag(tag)` (`Actor::addTag` in C++). To get a single entity by `uniqueId`: since LSE 0.9.5 there is `mc.getEntity(id)`, whose parameter is the entity's `UniqueId` or `RuntimeId`; it returns `null` on failure. You can also iterate with `mc.getAllEntities()` / `mc.getEntities(...)` and search.

*Applies to: LegacyScriptEngine 0.9.5 and later*

## I want a mob to be visible only to a specific player and attack only that player. Can an LSE JS plugin do this?

"Visible only to a specific player" can be done by intercepting or customizing the packets sent to the client (using native packet-related capabilities or a plugin). But checking or controlling a mob's locked attack target cannot be done in JS, because LSE completely removed NativeAPI long ago; you need to implement it with a native C++ mod.

*Applies to: LegacyScriptEngine 0.8.19 and later*

## Can LSE get all entities to clean up entities in unloaded chunks? How do I get all entities in C++?

No. In LSE, use `mc.getAllEntities()` to get all entities (`mc.getEntities(pos...)` queries by coordinate range). Both return only loaded entities and cannot reach entities in unloaded chunks, so a script cannot clean up unloaded entities. In a C++ mod, you can get all entities (again, loaded ones only) with `Level::getRuntimeActorList()` or `Level::getEntities()`.

*Applies to: LSE / LeviLamina current version*
