# iListenAttentively

## What is iListenAttentively-LseExport (ila-lseexport)? Is it an extension of iListenAttentively? What does it provide and which versions does it support?

iListenAttentively-LseExport (<https://github.com/MiracleForest/iListenAttentively-LseExport>) is a mod that exports LeviLamina's event system to LSE (LegacyScriptEngine) script plugins. It does not serve iListenAttentively only: any event registered on the LeviLamina event bus (LeviLamina's own events, iListenAttentively events, custom events of other mods) can be listened to in LSE, and you can intercept or modify the event parameters (provided the event implements serialization/deserialization), for example the packet send event, so LSE plugins do not need to write hooks themselves.

Besides events, it also provides:

- NativeAPI-style features (`getAddressFromSymbol` / `getAddressFromSignature` to get addresses, `hook` / `unhook` for native functions, memory read and write, and so on, replacing the NativeAPI that LSE has removed)
- A convenient NBT wrapper with a Proxy
- `registerEvent` / `publish` for custom events
- Query interfaces such as `getAllEvent`

Its only hard dependencies are LeviLamina and LegacyRemoteCall; it does not require iListenAttentively. The latest v0.5.0 (2026-09-09) embeds binaries for multiple versions, with built-in adaptations for LeviLamina 1.0.0-rc.1, 1.2.0-rc.1, 1.9.7, 26.10.5, 26.20.0 and 26.32.0, and at runtime it picks the closest version not higher than the current LeviLamina version. There is almost no documentation; refer to the repository README and the `lib/iListenAttentively.d.ts` type declarations.

*Applies to: iListenAttentively-LseExport v0.5.0 (LeviLamina 1.0.0-rc.1 onward; officially adapted up to 26.20.x/26.30.x, newer LeviLamina 26.60.x uses the 26.32.0 adaptation, compatibility must be tested yourself)*

## Can LSE script plugins use the events provided by iListenAttentively (ila), such as a player closing a container, redstone updates or blocks being burned, which LSE does not have natively? What do I need, how do I write the event name, can I get the parameters, and is there documentation?

Yes. Install iListenAttentively (`lip install github.com/LiteLDev/iListenAttentively`) and iListenAttentively-LseExport (<https://github.com/MiracleForest/iListenAttentively-LseExport/releases>), declare a dependency on `iListenAttentively-LseExport` in your plugin's manifest, and then:

```js
/** @type {import("iListenAttentively")} */
const iListenAttentively = require("./iListenAttentively-LseExport/lib/iListenAttentively.js");
iListenAttentively.emplaceListener("event name", event => { ... }, optionalPriority);
```

Key points:

1. LseExport itself depends only on LeviLamina and LegacyRemoteCall (its manifest declares only LegacyRemoteCall, and its `tooth.json` does not contain iListenAttentively either). It does not depend on iListenAttentively, so you must make sure iListenAttentively itself is installed (in the current version LSE itself depends on iListenAttentively, so installing LSE with lip installs it too).
2. Whether you can read or modify the event parameters depends on whether the mod that provides the event implements `serialize`/`deserialize`. Events from LeviLamina and iListenAttentively do, so you can read and modify the parameters (changed fields are written back), and `Cancellable` events can be intercepted by setting `cancelled`. Events that do not implement them can only be listened to and intercepted. You can set the listener priority.
3. The event name is the C++ type name (a LeviLamina event ID comes from the type name with inline namespaces removed), for example `ila::mc::ExplosionBeforeEvent` or `ll::event::PlayerJoinEvent`. If you are unsure, call `iListenAttentively.getAllEvent()` to list all current event names and check.
4. There is no dedicated documentation. Refer to the `lib/iListenAttentively.d.ts` type declarations and the iListenAttentively source headers (<https://github.com/LiteLDev/iListenAttentively>).

LseExport also provides functions for getting addresses, hooking and more, which replace the NativeAPI that LSE has removed.

*Applies to: iListenAttentively 0.14.0 and later; iListenAttentively-LseExport v0.5.0*

## In LSE, modifying the `damage` parameter in `onMobHurt` to reduce TNT damage has no effect, and `source.id === "tnt"` never matches. What is the correct approach?

1. The LSE `onMobHurt` callback can only intercept by `return false`; modifying the callback parameters has no effect. To change parameters such as damage, you need an iListenAttentively (ila) event.
2. To check the entity type, use `entity.type` (the namespaced id, such as `"minecraft:tnt"`). `entity.id` is the numeric entity type enum.
3. Install iListenAttentively (<https://github.com/LiteLDev/iListenAttentively>) and iListenAttentively-LseExport (<https://github.com/MiracleForest/iListenAttentively-LseExport>), declare a dependency on `iListenAttentively-LseExport` in the plugin manifest, and then:

```js
/** @type {import("iListenAttentively")} */
const iListenAttentively = require("./iListenAttentively-LseExport/lib/iListenAttentively.js");
iListenAttentively.emplaceListener("ila::mc::ExplosionBeforeEvent", event => {
  if (mc.getEntity(event.sourceId)?.type == "minecraft:tnt") {
    event.damageScaling = event.damageScaling * 0.25;
  }
});
```

`mc.getEntity` needs the numeric type id. ila has no documentation. For the fields, see `serialize` in the ila source `ExplosionEvent.cpp`, or open the `.d.ts` declaration files under `lib` in VSCode to get completion.

*Applies to: iListenAttentively 0.14.0 and later (with iListenAttentively-LseExport); current LSE version*

## How do I stop "XXX joined the game" from showing when a simulated player is created in LSE?

The native LSE API cannot do this. The approach is to intercept the join message `TextPacket` that the server sends. Make your plugin depend on iListenAttentively and iListenAttentively-LseExport, and use ila's packet-send event (`SendPacketBeforeEvent`, which can be intercepted) to check and intercept the matching `TextPacket` before it is sent.

Besides the generic packet-send event, ila also publishes events per packet type, with names of the form `ila::mc::SendPacketBeforeEvent<class TextPacket>`, so you can listen to `TextPacket` only. Confirm the actual event name with `iListenAttentively.getAllEvent()`.

Note that on the script side this event exposes the packet only as a native object pointer. To check the packet content (whether it is the join message of a given player), you need the memory/native call interfaces of LseExport.

*Applies to: LeviLamina + iListenAttentively + iListenAttentively-LseExport; the old LiteLoaderBDS approach no longer applies. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Which event corresponds to a player editing a sign in LSE? Can `onBlockInteracted` be used?

`onBlockInteracted` is a block interaction event, not a sign editing event. LSE currently has no dedicated sign editing event. iListenAttentively provides `PlayerEditSignBeforeEvent` / `PlayerEditSignAfterEvent` (`ila::mc::PlayerEditSignBeforeEvent` in C++; the Before event can be intercepted, `pos` and `text` can be read and modified, and `side` is the front or back face). The source is at <https://github.com/LiteLDev/iListenAttentively/blob/main/src/ila/event/world/actor/player/PlayerEditSignEvent.cpp>. LSE scripts can use it through iListenAttentively-LseExport. PRs to LSE for events of new game content are also welcome.

*Applies to: iListenAttentively 0.14.0 and later (LiteLDev repository); current LSE version*

## How do I intercept an Enderman picking up a block in an LSE plugin? How does a C++ mod use the iListenAttentively (ila) event library?

LSE: there is now a native event `onEndermanTakeBlock` (callback `function(entity, block, pos)`, return `false` to intercept; available since LSE 0.11.3, and in the current version it is implemented internally on ila's `MobTakeBlockBeforeEvent`). Just use it.

C++ mod: use iListenAttentively's `ila::mc::MobTakeBlockBeforeEvent` (can be intercepted). In `xmake.lua`:

```lua
add_repositories("levimc-repo https://github.com/LiteLDev/xmake-repo.git")
add_requires("ilistenattentively 0.18.*")
```

Then `add_packages("ilistenattentively")` in the target, and listen with `ll::event::EventBus::getInstance().emplaceListener<ila::mc::MobTakeBlockBeforeEvent>(...)`. The server needs iListenAttentively installed (`lip install github.com/LiteLDev/iListenAttentively`); choose the version according to the ila version that matches your LeviLamina.

*Applies to: LSE 0.11.3 and later (`onEndermanTakeBlock`); iListenAttentively 0.14.0 and later, currently 0.18.0 (LeviLamina 26.60.\*)*

## When an LSE plugin intercepts chest breaking with `onDestroyBlock`, a double chest is split in half, and chest merging cannot be intercepted on placement either. Is there a matching event?

iListenAttentively provides the chest merge events `ChestPairWithBeforeEvent` / `ChestPairWithAfterEvent` (`ila::mc::ChestPairWithBeforeEvent` in C++; the intermediate `world`/`level`/`block`/`actor` namespaces are inline namespaces and can be omitted). You can intercept chest merging in the Before event. In LSE, listen through iListenAttentively-LseExport; if you are unsure of the event name, call `iListenAttentively.getAllEvent()` first to see the actual name.

*Applies to: iListenAttentively 0.14.0 and later (LiteLDev repository)*

## LSE cannot directly intercept the entity death event. How do I prevent an entity from dying?

LSE's `onMobDie` cannot be intercepted. You can use iListenAttentively's health change event `MobHealthChangeBeforeEvent` (`ila::mc::MobHealthChangeBeforeEvent`, used in scripts together with iListenAttentively-LseExport): when `newValue` is less than or equal to 0, set `cancelled` to intercept it, or change `newValue` to a positive number such as 0.1 (the event implements deserialization, so the change is written back).

*Applies to: iListenAttentively 0.14.0 and later (with iListenAttentively-LseExport)*

## Can an LSE (LegacyScriptEngine) plugin listen to the packets a player sends?

LSE itself has no packet listening interface. You can depend on iListenAttentively (ila) and iListenAttentively-LseExport: ila provides receive and send packet events (`ila::mc::ReceivePacketBeforeEvent` / `ReceivePacketAfterEvent`, `SendPacketBeforeEvent` / `SendPacketAfterEvent` and so on; many ila events are themselves implemented on top of packets), and LseExport exports them to LSE.

In addition, ila publishes events per packet type (event names of the form `ila::mc::ReceivePacketBeforeEvent<class TextPacket>`), so you can listen to one kind of packet only. Check the exact name with `iListenAttentively.getAllEvent()`. Note that the packet you get on the script side is a native object pointer.

ila has no separate documentation; the header files are the documentation. Repository: <https://github.com/LiteLDev/iListenAttentively> (versions before 0.14.0 are at <https://github.com/MiracleForest/iListenAttentively-Release/releases>).

*Applies to: iListenAttentively 0.14.0 and later (with iListenAttentively-LseExport)*

## How does a LeviLamina C++ mod listen to the player item drop event? It is not in the LeviLamina API or source. Do I need to hook it myself?

LeviLamina itself has no such event, and you do not need to hook it yourself. Use `ila::mc::PlayerDropItemBeforeEvent` (can be intercepted) / `PlayerDropItemAfterEvent`, provided by iListenAttentively (ila, the official LiteLDev event extension library, <https://github.com/LiteLDev/iListenAttentively>). In xmake, after adding levimc-repo, `add_requires("ilistenattentively")` (the version matches LeviLamina, currently `0.18.*`) is enough.

*Applies to: iListenAttentively 0.14.0 and later; current 0.18.0 matches LeviLamina 26.60.\**

## In the iListenAttentively JS wrapper, can I assign NBT values directly with `nbt[key] = value` instead of methods like `nbt.setString`? Which NBT type does a number become?

Yes. The JS wrapper of iListenAttentively-LseExport (`lib/iListenAttentively.js`) wraps NBT in a Proxy, so you can write `nbt[key] = "string"` directly and it is converted automatically. You can also assign an object (converted to `NbtCompound`) or an array (converted to `NbtList`), and a list can be accessed with `nbt[numeric index]`.

Conversion rules: an integer number becomes Int, a number with a fractional part becomes Float, boolean becomes Byte, bigint becomes Long, and string becomes String. For other types such as Short or Double, construct the value explicitly with the corresponding NBT class (a JS number cannot distinguish byte/short/int).

*Applies to: iListenAttentively-LseExport current version (v0.5.0)*

## When listening to events through iListenAttentively (ILA) in LSE JS, printing `event` directly shows only `NbtClass`. How do I see which fields (NBT content) an event contains?

The `event` passed to the callback is NBT (`NbtCompound`, wrapped in a Proxy by the lib of iListenAttentively-LseExport). Call its `toSNBT()` to convert the content to an SNBT string and print it, for example `logger.info(event.toSNBT())`.

*Applies to: all current versions (listening to ILA/LL events in LSE through iListenAttentively-LseExport)*

## When listening to events in LSE with iListenAttentively-LseExport, the event name in the `.d.ts` type declarations is just `string`. Where do I find the list of event names I can listen to?

The event name is a `string` because an event registered on the LeviLamina EventBus by any native (C++) mod can be listened to by name, and they cannot all be written into the types. In a script, call `iListenAttentively.getAllEvent()` to get all currently registered events (including `modName` and `eventName`), and use `getAllEventAlias()` / `getEventAlias()` / `getEventName()` to query aliases.

Aliases are now generated automatically by LseExport at startup: ILA events can use the short form `ila::mc::<event class name>` (or with part of the namespace), and the built-in LL events can use `ll::event::<event class name>`, for example `"ll::event::PlayerJoinEvent"`. The `lib/events` directory also ships `.d.ts` files for events of LeviLamina, LeviAntiCheat and others.

LseExport itself depends only on LeviLamina and LegacyRemoteCall and does not require ILA. To use ILA events you must also install ILA.

*Applies to: iListenAttentively-LseExport 0.5.0 and later*

## When listening to iListenAttentively (ILA) events in an LSE JS plugin, `return false` in the callback has no effect. How do I intercept an event? How do I know which events can be intercepted?

ILA events are not intercepted by returning `false` from the callback. The `event` passed to the callback is essentially an NBT object. A cancellable event has a `cancelled` field, and setting it to `true` intercepts the event: `event["cancelled"] = true;` (no `return` is needed).

Only events that inherit `Cancellable` on the C++ side (usually `xxxBeforeEvent`) can be intercepted. Setting it on an After event or on an event that does not implement cancellation has no effect. You can check whether the event's header in the ILA source inherits `ll::event::Cancellable`, or print `event.toSNBT()` to see whether there is a `cancelled` field.

*Applies to: current version (using ILA events through iListenAttentively-LseExport)*

## Is there an event for blocks being burned by fire? Does iListenAttentively support it?

iListenAttentively provides the `FireTryBurnBlock` events: `FireTryBurnBlockBeforeEvent` (cancellable; when cancelled, the fire does not burn at that position) and `FireTryBurnBlockAfterEvent`, with a `pos` field. Note that it is hooked on `FireBlock::isValidFireLocation` and fires when the fire "tries to burn", so the block has not actually been burned yet when you receive it. It can replace the approach of listening to `onBlockChanged`. In LSE, listen through LseExport with the alias `ila::mc::FireTryBurnBlockBeforeEvent`.

*Applies to: iListenAttentively current version (0.18.0)*

## How can other plugins (such as LSE plugins or a bot relay) read player death messages, including death messages modified by other plugins?

Use the death message events provided by iListenAttentively: `DeathMessageBeforeEvent` (cancellable, and `result` can be modified) and `DeathMessageAfterEvent`. The event NBT contains `sourceUniqueId`, `cause` and `result{key, params}` (the translation key and parameters of the death message). If a plugin only modifies the returned death message without changing the vanilla death event, listen to the After event to read the final message. In LSE, listen through iListenAttentively-LseExport with the alias `ila::mc::DeathMessageAfterEvent`.

*Applies to: iListenAttentively current version (0.18.0)*

## An LSE script plugin that depends on iListenAttentively events (such as ShoppingMall or iLand) does not work after installation. What should I do?

For an LSE script plugin to use iListenAttentively events, besides installing iListenAttentively itself you must also install ILA's LSE export module, iListenAttentively-LseExport. Download it from <https://github.com/MiracleForest/iListenAttentively-LseExport/releases> (use a mirror if you cannot reach GitHub) and extract it to `plugins/iListenAttentively-LseExport/`. It depends on LeviLamina and LegacyRemoteCall.

Note that iListenAttentively itself must match the LeviLamina version (the current ILA 0.18.0 matches LeviLamina 26.60.*). You can install it with `lip install github.com/LiteLDev/iListenAttentively`. Since 0.21.2, LSE itself depends on ILA, but scripts that use ILA events directly still need LseExport.

## How do I add the iListenAttentively (ILA) event library as a dependency in a LeviLamina C++ mod (xmake project)?

The ILA package is now included in LiteLDev's xmake-repo (the levimc-repo that the template adds by default). In `xmake.lua`:

```lua
add_repositories("levimc-repo https://github.com/LiteLDev/xmake-repo.git")
add_requires("ilistenattentively 0.18.*", {configs = {target_type = get_config("target_type")}})
```

Then `add_packages("ilistenattentively")` in the target. The version must match the LeviLamina you use (ILA `0.18.*` matches LeviLamina 26.60.*). Then run `xmake project -y -k compile_commands` to generate the completion information.

Also remember to declare `{"name": "iListenAttentively"}` in `dependencies` of the mod's `manifest.json` to ensure the load order.

*Applies to: iListenAttentively 0.14.0 and later, current 0.18.0 / LeviLamina 26.60.\**

## The iListenAttentively LSE export plugin (iListenAttentively-LseExport) has not been updated for a long time. Can it still be used?

Yes, you can keep using it. LseExport does not need frequent updates with LeviLamina versions: it embeds internal binaries compiled for several LeviLamina versions, automatically picks and loads the most suitable one for the current loader version at startup, and exports events dynamically by name through the EventBus. The latest version is v0.5.0 (the repository is still maintained, with commits in 2026-11).

*Applies to: iListenAttentively-LseExport 0.5.0 and later*

## Why does iListenAttentively (ILA) have no player permission change event (`PlayerChangePermissions`)? Can it be added back?

ILA removed the `PlayerChangePermissions` (player permission change) event in 0.3.0 (adapted to LeviLamina 1.1.0-rc.1 / BDS 1.21.60). The reason is that BDS 1.21.60 inlined the related function, so the former function call became a direct assignment and there is no function left to hook. The event therefore cannot be added back, and the latest ILA still does not have it. In general, every BDS update may lose some functions to inlining, and the events or APIs that depend on those functions are removed along with them.

If you only need to listen to changes of a player's command permission level (`CommandPermissionLevel`), LeviLamina itself provides `ll::event::PlayerChangePermEvent` (hooks `Player::setCommandPermissions`, cancellable, `newPerm()` returns the new level) as an alternative.

*Applies to: iListenAttentively 0.3.0 and later (the latest 0.18.0 still has no such event)*
