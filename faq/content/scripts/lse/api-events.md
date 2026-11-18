# LegacyScriptEngine API: events

## Can LSE unregister (stop listening to) an event listener registered with `mc.listen`? How do I cancel a listener?

LSE's script API has no interface for unregistering a listener: `mc.listen(event, callback)` returns only a Boolean indicating whether registration succeeded, not a handle you can use to remove it. When a plugin is unloaded or reloaded, LSE automatically removes all event listeners that plugin registered.

If you need to cancel a listener at runtime, wrap it yourself in the script: call `mc.listen` only once per event, have the callback dispatch the event to a list of handler functions that you maintain, and remove the handler from the list when you want to cancel it.

(LeviLamina's C++ EventBus provides `removeListener`, so C++ mods can remove a listener directly.)

*Applies to: all current LSE versions*

## Does the `onAttackEntity` event callback in LSE still provide a `damage` parameter?

No. The prototype of the LSE `onAttackEntity` callback is `function(player, entity)`. The `damage` parameter from the LL2 era has been removed, so follow the LSE docs. Returning `false` from the callback cancels the attack.

*Applies to: all LSE versions (LeviLamina era)*

## I use `onUseItem` in LSE to open a menu or cast a skill when right-clicking with an item, but on PC (Win10) one right-click fires many times. Which event should I listen to?

For using an item on air, listen to `onUseItem` (using an item on a block is `onUseItemOn`). On PC, holding or clicking the right mouse button makes `onUseItem` fire several times in a row, so you need to debounce or add a cooldown yourself: record the last trigger time per player (for example `Map<xuid, timestamp>`) and ignore repeated triggers within a short time (such as 200 to 500 ms). Menu plugins such as CMenu can serve as a reference. On mobile, right-click corresponds to a long press. You can also combine it with events such as `onAttackEntity` (left-click attack on an entity) to build skills.

*Applies to: current LSE version*

## How do I stop pistons from pushing specific blocks (such as chests and hoppers) in LSE, so that pistons outside a claim cannot push blocks into or out of it?

Listen to the `onPistonTryPush` event; returning `false` from the callback `function(pistonPos, block)` cancels the push. For example:

```js
mc.listen('onPistonTryPush', (pistonPos, block) =>
  ["minecraft:chest", "minecraft:hopper"].includes(block.type) ? false : true);
```

A claim plugin can use `block.pos` to check whether the pushed block is inside a claim. Early LSE versions had a bug where the block coordinates in this event's callback were wrong (always the piston's own coordinates), which broke claim plugins (issue #137); it was fixed in LSE 0.7.12. Note that the event fires repeatedly when the piston is blocked and cannot move.

*Applies to: LSE 0.7.12 and later*

## How do I prevent farmland from being trampled in an LSE script plugin? Does the `onFarmLandDecay` event still work?

Yes. Listen to the `"onFarmLandDecay"` (farmland decay) event, whose callback prototype is `function(pos, entity)`: `pos` is the position of the decaying farmland (`IntPos`) and `entity` is the entity that caused the decay (`Entity`). Returning `false` from the callback cancels the decay, and the farmland does not turn back into dirt. Example:

```js
mc.listen("onFarmLandDecay", (pos, entity) => false);
```

Note that this event may fire many times, so do not do expensive work in the callback. To protect only specific areas or specific entities, decide based on `pos` and `entity`.

*Applies to: LegacyScriptEngine 0.23.x; also applies to LLSE on the old LiteLoaderBDS 2.x*

## In LSE, are the callback parameters of `mc.listen` passed by name or by position? For example, `mc.listen("onCmdBlockExecute",(pos,cmd)=>{log(cmd)})` prints the command instead of the coordinates.

They are passed by position. Listening to an event means LSE calls a function in your plugin, and LSE passes arguments only in the fixed order of the event's listener prototype in the docs, regardless of the variable names you choose. The prototype of `onCmdBlockExecute` is `function(cmd, pos, isMinecart)`, so the first parameter is the command string, the second is the position (FloatPos), and the third indicates whether it is a command block minecart. You can name the variables freely, but it is recommended to follow the prototype in the docs:

```js
mc.listen("onCmdBlockExecute", (cmd, pos, isMinecart) => { log(cmd, pos); })
```

## In LSE, does the `onBlockExploded` event include blocks destroyed by the Wither (`onWitherBossDestroy`)?

No. Blocks destroyed by the Wither itself are a separate event: listen to `onWitherBossDestroy` (prototype `function(witherBoss, AAbb, aaBB)`, interceptable). `onBlockExploded` (prototype `function(block, source)`) only covers blocks destroyed by explosions.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## In LSE, `onDestroyBlock` cannot detect mining bedrock and other unbreakable blocks. How do I detect a player mining or attacking such blocks?

`onDestroyBlock` (a player finishes destroying a block) only fires when the block is actually destroyed, so unbreakable blocks such as bedrock and end portal frames do not trigger it. To detect a player hitting such blocks, use `onAttackBlock` (prototype `function(player, block, item)`) or `onStartDestroyBlock` (prototype `function(player, block)`). In the current version both are based on the player-attacks-block event, and returning `false` intercepts them. Implement the "breakable" logic yourself in the callback (for example, set the block to air with `mc.setBlock` and drop the item).

If an event does not fire, attach reproducible code to a GitHub issue.

*Applies to: current version (0.23.x)*

## In LSE, how do I check in the `onPlayerDie` event whether the damage source is a player, and add score on the scoreboard for the killer?

The prototype of `onPlayerDie` is `function(player, source)`, where `source` is the damage source entity (Entity, possibly `null`). First check that `source` exists and is a player, then convert it to a Player object with `toPlayer()` before operating on the scoreboard. Entity objects have no scoreboard methods such as `addScore`. Example:

```js
mc.listen("onPlayerDie", (pl, src) => { if (src && src.isPlayer()) { src.toPlayer().addScore("kills", 1); } });
```

The objective must already exist.

## In LSE, can an event callback (such as `onPreJoin`) run asynchronously? What should I do about problems with asynchronous code in an event?

Event callbacks are called synchronously by LSE, and only a `false` returned synchronously by the callback intercepts the event. In a callback you can do asynchronous work with Promise/`then` or by writing the callback as an `async` function (the Node.js backend drives the event loop and microtasks every tick). However, an `async` function returns a Promise, not `false`, and a `return false` after an `await` cannot intercept the event either. The logic that decides whether to intercept must be completed in the synchronous part.

In `onPreJoin`, if you need to attach data to a player, you can also keep your own object indexed by player name/xuid instead of using `setExtraData`.

## In LSE, how do I intercept an event? Why does `mc.listen("onPlayerPullFishingHook", (player,entity,item) => { fishingHookEvent(player,entity,item) })` with `return false` inside `fishingHookEvent` not intercept?

An LSE event callback that returns `false` intercepts the event (not every event supports interception; follow the docs, which mark interceptable events with "Intercept event: function returns false". `onPlayerPullFishingHook` supports interception). In the code above, the outer arrow function uses braces but has no `return`, so the inner function's return value is never passed out. Write it as:

```js
mc.listen("onPlayerPullFishingHook", (player,entity,item) => { return fishingHookEvent(player,entity,item); });
```

or simply:

```js
mc.listen("onPlayerPullFishingHook", (player,entity,item) => false);
```

## In LSE, how do I intercept the big explosion when a Wither spawns? Returning `false` from `onBlockExploded` or an explosion event does not intercept it.

`onBlockExploded` (a block is destroyed by an explosion) is only a notification that a block was blown up. The docs mark it "cannot be intercepted", and `return false` has no effect. To intercept the explosion itself, listen to `onEntityExplode` (an explosion caused by an entity; the source of the Wither spawn explosion is the Wither entity) or `onBlockExplode` (an explosion caused by a block) and return `false`.

Since LSE 0.21.2 these two events are provided by iListenAttentively, which hooks `Explosion::explode` underneath, so every explosion passes through it and can be canceled. For finer control, a native (C++) plugin can also use iListenAttentively's `ila::mc::ExplosionBeforeEvent` directly.

*Applies to: LSE 0.21.2 and later (requires iListenAttentively)*

## Does calling `player.kick()` on a player trigger the `onLeft` event in LSE?

Yes. `player.kick()` / `disconnect()` internally calls `Player::disconnect` to disconnect the player, and `onLeft` is based on LeviLamina's `PlayerDisconnectEvent` (which hooks `ServerPlayer::disconnect`), so kicking a player also triggers `onLeft` once. Keep this in mind if you clean up a player's temporary data in `onLeft` (`onLeft` is not triggered while the server is shutting down).

*Applies to: LSE current version*

## How do I turn obsidian into lava when a player uses an item (such as a bucket) on it, from an LSE plugin?

Listen to the `onUseItemOn` event (callback `function(player, item, block, side, pos)`), check the block type, and replace the block with `mc.setBlock`:

```js
mc.listen('onUseItemOn', (player, item, block) => {
  if (block.type === 'minecraft:obsidian' && item.type === 'minecraft:bucket') {
    mc.setBlock(block.pos, 'minecraft:lava', 0);
  }
});
```

You can remove the check for the held item (the bucket) if you do not need it. Note: a right-click on the Win10 client may trigger this event several times in a row on the server.

*Applies to: all current LSE versions (including v0.23.1)*

## How do I block a player from using an item such as fireworks on a block, from an LSE plugin?

Listen to the `onUseItemOn` event (`mc.listen("onUseItemOn", (player, item, block, side, pos) => {...})`), check `item.type` in the callback (for example `"minecraft:firework_rocket"`), and return `false` to block it.

*Applies to: all current LSE versions (including v0.23.1)*

## In an LSE plugin I want to stop creeper explosions from destroying blocks, but `mc.listen("onEntityExplode", (entity)=>{ if(entity === creeper) return false; })` has no effect. How should I write it?

The callback prototype of `onEntityExplode` is `function(source, pos, radius, maxResistance, isDestroy, isFire)`. The first parameter is an entity object, which cannot be compared with a name directly; use `source.type` to get the namespaced ID: `if (source.type == "minecraft:creeper") return false;`. However, `return false` in `onEntityExplode` cancels the whole explosion (no damage and no block destruction).

If you only want the explosion not to destroy blocks:

- Override the creeper entity definition in the server's behavior pack (set `breaks_blocks` of the `minecraft:explode` component in `creeper.json` to `false`);
- or turn off the `mobGriefing` game rule (this affects all mob griefing);
- or use an existing anti-explosion plugin.

The `onBlockExploded` event cannot be cancelled, so you cannot use it to stop blocks from being destroyed.

*Applies to: all current LSE versions (including v0.23.1)*

## In an LSE plugin, `return false` in `onChat` blocks the chat, but the message is still printed twice / a vanilla-style message is still sent. Why?

Event interception in LSE only cancels the vanilla behavior; it does not stop other plugins from receiving the same event. LSE events have no priority and do not support modifying event parameters (the `onChat` callback receives only `player` and the `msg` string). Many chat plugins intercept the message and then resend it in their own format, so multiple chat plugins easily conflict; this situation is usually caused by another chat plugin that intercepts the message and then resends it in the vanilla style.

Solution: find and uninstall the conflicting chat plugin. If you need several plugins to modify chat content in turn, consider a third-party LSE extension based on iListenAttentively (such as ila-lse, where event parameters are passed as NBT and can be modified).

*Applies to: all current LSE versions (including v0.23.1)*

## In an LSE plugin, a fake container created by sending packets (a fake chest GUI) does not trigger the `onCloseContainer` event when the player closes it. How do I listen for the close?

`onCloseContainer` is triggered only when a player closes a container block that actually exists. A fake container created by packets has no corresponding container block on the server, so the event does not fire.

To get the close event you need to hook the server function that handles the client's ContainerClosePacket (`ServerNetworkHandler::handle(NetworkIdentifier const&, ContainerClosePacket const&)`). You can do this with a native (C++) mod, or with a third-party prerequisite that provides packet events (such as GMLib). LegacyRemoteCallApi itself provides no events.

## Can LSE's `onBlockChanged` (block changed) event be intercepted with `return false`? What about LeviLamina in C++?

No. LSE's `onBlockChanged` fires after the block has already changed and cannot be intercepted (the documentation states "Intercept event: cannot be intercepted"). LeviLamina's `ll::event::BlockChangedEvent` is likewise not a cancellable event, and C++ has no direct way to intercept it either. You can only set the block back to its previous state after the change, or hook the specific source of the block change yourself (for example, for player placing or breaking, use the corresponding interceptable events `onPlaceBlock` and `onDestroyBlock`).

*Applies to: current version (LSE / LeviLamina)*

## LSE's `onHopperPushOut` event does not catch item transfers between hoppers. Is there an event that does?

LSE provides only two hopper events: `onHopperSearchItem` (a hopper or hopper minecart picks up items) and `onHopperPushOut` (a hopper outputs items). iListenAttentively has no hopper-related events either, and there is no dedicated "item transfer between hoppers" event. If you need it, you can write a C++ mod and hook it yourself. LSE itself hooks `Hopper::_tryPullInItemsFromAboveContainer` (pulling in from the container above), `Hopper::_pushOutItems` (pushing out) and `Hopper::_tryMoveInItem` (actually moving the item), which you can use as a reference. Hopper minecarts also need special handling of their collision box.

*Applies to: LSE 0.23.x; iListenAttentively current version*

## In LSE's `onMobHurt` callback, `damage` is not the damage the entity actually takes (attacks during invulnerability frames are counted too). Is that right?

Yes. `onMobHurt` fires before `Mob::_hurt` runs its original logic and gives the raw incoming damage value, before armor, enchantments, potion resistance, invulnerability frames and so on are applied. So attacks during invulnerability frames also fire the event with a damage value. The `onAttackEntity` callback has only two parameters, `(player, entity)`, and provides no damage value. To get the actual damage, you need a C++ mod that hooks the point after damage is applied.

## In LSE's `onMobHurt` event, when the mob is hit by an arrow shot by a skeleton or a player, is the `source` parameter the shooter or the arrow? Can I get the shooter?

In `onMobHurt(mob, source, damage, cause)`, when the mob is hit by a projectile such as an arrow, `cause` is `ActorDamageCause.Projectile` and `source` is the projectile entity (the arrow), not the shooter. LSE currently has no API for getting a projectile's owner, so you cannot get the shooter from this event directly and need another approach (for example, an interface provided by another plugin, library or C++ mod).

*Applies to: LSE 0.23.x*

## In an LSE script plugin, which event does a mobile touchscreen player's "tap on the screen" trigger, and how do I listen to it?

The touch actions map to these events: a long press on the screen triggers `onUseItem`. Tapping the air counts as an attack (left click), and tapping a block counts as an interaction; tapping a block triggers `onUseItemOn` (like a right click on the block). Tapping the air alone has no corresponding use-item event. To open a menu with an item, use a long press instead and listen with `mc.listen("onUseItem", ...)`, which also avoids accidental touches.

*Applies to: current version (the exact trigger behavior depends on BDS and the client's touch controls). Not confirmed against the source code or the documentation: treat it as a pointer.*

## When an LSE script plugin is unloaded, the callback registered on the C++ side through `executeOnModUnload` is not triggered. Do LSE plugins have an `onUnload` callback?

Previously, LSE destroyed the engine directly when unloading a script plugin and did not call `onUnload` of `ll::mod::Mod`, so `executeOnModUnload` listeners were never notified. This was fixed by LSE PR #256 (`fix: fix plugin executeOnModUnload`, merged on 2025-03-17). On the script side, you can register a cleanup function to run when the plugin unloads with `ll.onUnload(func)`.

*Applies to: LSE versions containing PR #256 (released after 2025-03) and the current latest version*

## Is there an event listener for server shutdown in LSE JS plugins?

It is not in the `mc.listen` event list but in the "loading-related API" (the `ll` object): register a plugin unload callback with `ll.onUnload(func)`, which is called when the server shuts down (the plugin unloads). This function requires LSE 0.9.6 or later.

*Applies to: LSE 0.9.6 and later*

## How do I prevent players from using a certain item with LSE?

Listen to the `onUseItem` event (callback parameters `player, item`), check that `item.type` is the target item, and `return false` in the callback to intercept:

```js
mc.listen('onUseItem', (player, item) => { if (item.type === 'minecraft:xxx') return false; });
```

If the item is used on a block (right-clicking a block), you also need to intercept `onUseItemOn`.

## How do I stop players from interacting with certain blocks with an LSE script plugin (for example, forbidding opening jukeboxes and shulker boxes inside a claim)? Why does the notification message spam the chat?

Listen to the `onUseItemOn` event (callback parameters `player, item, block, side, pos`) and `return false` to intercept the interaction when `block.type` is the target block. Note that for Win10/PC client players, one right-click fires this event several times in a row on the server (this is described in the documentation), so calling `player.tell` every time spams the chat. You can debounce the message (ideally with a generic debounce function that is decoupled from the player), or show the notice above the hotbar (actionbar) instead.

## How do I make an LSE script plugin run some commands automatically after the server has finished starting?

Listen to the `onServerStarted` event and call `mc.runcmd` in the callback: `mc.listen("onServerStarted", () => { mc.runcmd("your command"); });`. To run several commands, write several `mc.runcmd()` calls. If you need the command output, use `mc.runcmdEx`.

## How do I stop liquids from flowing on the server with a plugin?

Listen to LSE's `onLiquidFlow` event (callback parameters `from: Block, to: IntPos`) and return `false` to intercept:

```js
mc.listen('onLiquidFlow', (from, to) => false);
```

You can also write a native mod that removes liquid ticks.

*Applies to: current version (the event depends on iListenAttentively, which is installed together with LSE)*

## I want to build a sign-locked chest feature. Which actions should I intercept with LSE?

Listen to the container-open event `mc.listen("onOpenContainer", (player, block) => ...)` (or the block interaction event `onUseItemOn`) and `return false` to intercept when the player is not the owner. You must also block hoppers and hopper minecarts from pulling items out of the chest: listen to `onHopperSearchItem` (callback parameters `pos, isMinecart, item`; `return false` prevents the pickup). Otherwise the lock can be bypassed with a hopper.

*Applies to: LegacyScriptEngine 0.23.x*

## Is the damage value given by the mob hurt event (LSE's `onMobHurt` / GMLIB-LRCA's `onMobHurted`) the damage before or after reduction (the final damage)?

LSE's built-in `onMobHurt` (callback `function(mob,source,damage,cause)`) is implemented by hooking `Mob::_hurt`. `damage` is the raw damage value passed to `_hurt`, that is, the value before reductions from armor, protection enchantments, resistance effects and so on.

According to its description, the third-party GMLIB-LRCA's `onMobHurted` gives the value after armor, enchantment and resistance reductions, but it is still not the final value: during the hurt cooldown (invulnerability frames) the actual damage drops to zero while the event does not account for it, and attacking a creative-mode player also fires the event although the target takes no damage. When you need the exact actual damage, compute it from the difference in the entity's health (or `Health` in its NBT) before and after the event (for example on the next tick).

*Applies to: current version (`onMobHurt`); the GMLIB part is third-party plugin behavior. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I stop players from editing signs with an LSE script?

LSE has no dedicated sign-edit event. Listen to `onUseItemOn` (or `onBlockInteracted`) and `return false` to block the interaction when the target block is a sign (`block.type` contains `sign`); this prevents the edit screen from opening. To intercept the sign-edit packet sent by the client, plain LSE has no packet-receive interception event, so you need an extension such as iListenAttentively or a C++ mod.

*Applies to: LSE current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I detect what a player renames/types in an anvil in an LSE plugin? `onOpenContainerScreen` fires but `onContainerChange` does not work for anvils.

This is not possible with the plain LSE API: an anvil is not an ordinary container, and LSE has no anvil rename event. You need iListenAttentively (ila) and its LSE export plugin iListenAttentively-LseExport (ila-lseexport, <https://github.com/MiracleForest/iListenAttentively-LseExport>), and listen to the low-level events it exports; alternatively, write a native mod in C++.

*Applies to: LSE current version*

## An LSE JS plugin calls `mc.explode` inside an `onBlockExplode` listener (or adds experience inside the experience-gain event) and the server crashes or freezes. Why?

This is an infinite loop caused by the plugin itself: an API called in the event callback triggers the same event again (`mc.explode` triggers `onBlockExplode` again, and adding experience through the API triggers the player experience-gain event), causing unbounded recursion. LSE does not distinguish whether an event was triggered by the plugin itself, and the documentation warns about this. To fix it, set a boolean flag in the plugin and skip handling while you are causing the explosion or adding experience yourself, or use an approach that does not retrigger the event.

*Applies to: LSE all current versions*
