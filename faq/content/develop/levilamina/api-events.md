# LeviLamina mod API: events

## How do I define and publish a custom event in a LeviLamina C++ mod so that other mods' listeners receive it? (Also: which header do I use to read and write config files?)

Define a class that inherits from `ll::event::Event` and must be declared `final` (`EventBus::publish` has a `static_assert` requiring a final class), for example `class MyCustomEvent final : public ll::event::Event { ... };`. To broadcast, construct the event object and publish it: `ll::event::EventBus::getInstance().publish(ev);` (or `publish(modName, ev)` to send it only to a specific mod). Other mods listen with `EventBus::getInstance().emplaceListener<MyCustomEvent>(callback)` or `addListener`; if you only want to install a hook when the event is first listened to, combine it with `Emitter` from `ll/api/event/Emitter.h` to implement a lazily activated emitter. To read and write config files, use `ll::config::loadConfig` / `saveConfig` from `ll/api/Config.h`.

*Applies to: LeviLamina 1.x and later (current v26.60.8)*

## Is there a LeviLamina event for a player "pre-join" (connecting to the server, before entering the world and before `PlayerJoinEvent`)?

Yes: use `PlayerConnectEvent` (`ll::event::PlayerConnectEvent`). It fires before `PlayerJoinEvent`, can be cancelled, and gives you `networkIdentifier()` and `connectionRequest()`. Add `#include "ll/api/event/player/PlayerConnectEvent.h"`, then subscribe with `ll::event::EventBus::getInstance().emplaceListener<ll::event::PlayerConnectEvent>(...)`.

*Applies to: LeviLamina 0.4 and later, up to the current version (server)*

## Which class's `tick` function is the BDS main game loop? I can't find `tick()` in `GameSession`.

The world tick lives on `Level`/`ServerLevel` (`Level::tick` is a virtual function, so a hook must use `$tick`). The simpler approach is to listen to LeviLamina's built-in `ll::event::ServerLevelTickEvent` (header `ll/api/event/world/ServerLevelTickEvent.h`); in the current version it is implemented by hooking `ServerLevel::$_subTick`. You can also use LeviLamina's scheduler/`GameChrono` for per-tick timed tasks.

*Applies to: LeviLamina 26.x*

## Listening to the server started event in a C++ mod gives errors (clangd reports them too), and the docs don't say what to include. What should I do?

You need to include the `EventBus` header and the header of the event:

```cpp
#include "ll/api/event/EventBus.h"
#include "ll/api/event/server/ServerStartedEvent.h"
```

Then subscribe in functions such as `load`/`enable` of the main mod class with `ll::event::EventBus::getInstance().emplaceListener<ll::event::ServerStartedEvent>(...)` (keep the returned listener so you can remove it in `disable`). Other event headers are in subdirectories of `ll/api/event/` grouped by category (`server`, `player`, `entity`, `world`, `command`, and so on).

*Applies to: LeviLamina 1.x and later*

## How do I intercept (cancel) an event in a LeviLamina C++ mod?

For cancellable events (events that inherit from `ll::event::Cancellable<...>`, such as `PlayerChatEvent` and `ExecutingCommandEvent`), call `event.cancel()` (equivalent to `setCancelled(true)`) in the listener callback to intercept them. Events that cannot be cancelled do not have this method.

## In a LeviLamina C++ mod I want to listen for players running commands. The listener written like in LLSE never fires. Which event should I listen to?

That means you are listening to the wrong event type. For commands, listen to `ll::event::ExecutingCommandEvent` (before execution; you can `cancel` it to intercept) or `ExecutedCommandEvent` (after execution), defined in `ll/api/event/command/ExecuteCommandEvent.h` and registered with `ll::event::EventBus::getInstance().emplaceListener<...>(...)`. See the event API and the event guide in the official documentation for details.

## How do I listen for the player fishing event in a LeviLamina C++ plugin?

LeviLamina itself has no fishing event (there is none under `ll/api/event`), the `more-events` project mentioned earlier was never released as a LiteLDev project, and `iListenAttentively` does not provide a fishing event either. You need to hook the relevant function yourself, following the approach of LegacyScriptEngine: use `LL_TYPE_INSTANCE_HOOK` to hook `FishingHook::_pullCloser(Actor& inEntity, float inSpeed)`, get the fishing player through `this->getPlayerOwner()`, and treat the pulled entity as the caught item if it is an `ItemActor` (this corresponds to the `onPlayerPullFishingHook` event in LSE).

## When listening to two different events in a LeviLamina mod, do I need to define/get the `EventBus` twice?

No. `EventBus` is a singleton: use the same `ll::event::EventBus::getInstance()` and call `emplaceListener<EventA>(...)` and `emplaceListener<EventB>(...)` on it, and keep the returned `ListenerPtr` values so you can `removeListener` in `disable`.

*Applies to: all versions*

## Is it a problem to destroy a `ListenerPtr` I hold without calling `removeListener` on the `EventBus` in LeviLamina?

No. `ListenerPtr` is a `std::shared_ptr<ListenerBase>` and the `EventBus` also holds a reference internally, so destroying your own `ListenerPtr` does not cause a crash or a dangling pointer. Note, however, that this does not unregister the listener: it keeps receiving events. To stop listening, call `EventBus::getInstance().removeListener(listener)`. When a mod is unloaded, the `EventBus` cleans up that mod's listeners through `removeModListeners` / `clearMod`.

*Applies to: LeviLamina 1.x and later*

## In the LeviLamina event system, if a high-priority listener cancels (`cancel`) an event, do lower-priority listeners still receive it?

No. In the early design, a cancelled event was still dispatched to later listeners, and each listener had to check `isCancelled()` itself. The maintainers later changed this: once an event is `cancel()`led, the `EventBus` stops dispatching immediately, and no later listener (including those after it at the same priority) receives the event. This ensures only one listener is responsible for intercepting, so that everyone does not fight for the highest priority.

*Applies to: LeviLamina 1.2 and later*

## I registered an event listener in a LeviLamina plugin but the event never fires. What could be the cause? Are event hooks installed automatically?

Check the following:

1. Mind the registration timing: on the server, the mod enable phase is called for all mods by `ModRegistrar::enableAllMods()` when the server thread starts (`ServerScriptManager::onServerThreadStarted`). Events that happened before that (such as events of earlier startup phases) are naturally not received.
2. Event hooks are not auto hooks: each event's Emitter is created on demand, and the corresponding hook is installed only when the event has a listener (`EventBus::getInstance().emplaceListener<T>(...)` / `addListener`).
3. Sub-namespaces such as `ll::event::player` and `ll::event::world` are inline namespaces, so you can write `ll::event::PlayerJoinEvent` directly without the `ll::event::player::` prefix.
4. To troubleshoot, log from the callback with a logger to confirm whether it fires.

*Applies to: LeviLamina 1.x and later*

## What action does LeviLamina's `PlayerSwingEvent` (the swing event) refer to? Is it elytra gliding?

No, it is not gliding. Swing means the player swinging their arm: it fires when the server receives an `AnimatePacket` from the client whose action is `Swing`. Interacting with containers, left-clicking, stripping bark with an axe, attacking and so on all cause a swing. The event `PlayerSwingEvent` inherits from `PlayerLeftClickEvent`.

*Applies to: all versions*

## Can LeviLamina event listeners specify a priority? For example, how can a chat translation plugin avoid conflicting with other chat plugins?

Yes. When creating a Listener you can pass an `ll::event::EventPriority` (`Highest`/`High`/`Normal`/`Low`/`Lowest`, default `Normal`), for example `EventBus::getInstance().emplaceListener<PlayerChatEvent>(callback, EventPriority::High)`. Higher-priority listeners handle the event first, so you can use this to process or modify a message before ordinary chat plugins. Avoid using `Highest` casually, to prevent compatibility problems with other plugins.

*Applies to: all versions*

## `PlayerUseItemEvent` fires as soon as the player right-clicks to use an item (for example starts eating bread), even if they do not finish. How do I fire only after the item has actually been used (eaten)?

LeviLamina's `PlayerUseItemEvent` hooks `PlayerTransactionSubject::$baseUseItem`, which fires when use begins. To handle the completion of use, switch to the events for `Player::completeUsingItem`: iListenAttentively (ila) provides `PlayerAteBeforeEvent` / `PlayerAteAfterEvent` (they hook `Player::completeUsingItem`, fire only for food, potions, milk buckets and medicine, and the Before event can be cancelled).

If you need to cover other items, hook `Player::completeUsingItem` yourself with `LL_TYPE_INSTANCE_HOOK`.

*Applies to: LeviLamina current version; iListenAttentively*

## In a LeviLamina mod, I want to change the chat message format (for example add a prefix before the player name). Can LL's chat event do it?

LL's `PlayerChatEvent` only provides `message()` to change the actual chat content; it cannot change the format. The `TextPacket` that is sent has type `Chat`, and the display format is hard-coded in the client. To add content before the player name, you must use another type (such as `TextPacketType::Raw`).

Approaches: intercept the handler of the vanilla `TextPacket` and send your own packet (what LSE does), or hook `TextPacket`'s `write`, or intercept and modify the `TextPacket` sent to clients. If each player needs a different display (for example multiple languages), intercept the packet and send a separate one to each player.

*Applies to: LeviLamina current version*

## When handling `PlayerDieEvent` / `ActorHurtEvent` / `MobDieEvent` in a LeviLamina mod to get the damage source entity, using `getDimension().fetchEntity()` or `Level::getDimension()` crashes the server (I get `nullptr`). How should I write it?

Entity IDs (`ActorUniqueID`) are global, so there is no need to get the dimension first. Use `Level::fetchEntity(id, false)` directly to get the damage source entity (it returns `Actor*`, which you still need to null-check).

`Level::getDimension(dimId)` returns a `WeakRef<Dimension>` that may be empty. You must `lock()` it and check it before use, or it crashes. You can also use `getOrCreateDimension(dimId)` instead, which returns the dimension as long as the dimensionId is valid. If you only need the ID of the dimension the entity is in, use `actor.getDimensionId()` directly.

Do not follow how LSE writes these events; refer to LeviLamina itself or projects such as LeviOptimize.

*Applies to: LeviLamina 0.12.x and later*

## In LeviLamina, I want to implement a "player edits sign" event that tells the front from the back. What data does the client send to the server after a sign is edited, and what approaches are there?

The server opens the sign editing screen by sending `OpenSignPacket` (`SignBlockActor::requestToSendOpenSignPacket(..., bool isFrontSide)`). When editing finishes, the client sends the block entity data packet `BlockActorDataPacket` (carrying the sign's NBT) to the server.

Recommended approach: hook `ServerNetworkHandler::$handle(NetworkIdentifier const&, std::shared_ptr<BlockActorDataPacket>)` (`MCAPI`, can be hooked directly), get the sending player from it, and parse the NBT to determine which side was changed and to what content.

Another approach is to hook `BlockActor::onUpdatePacket(CompoundTag const&, BlockSource&, Player const* fromPlayer)` or `SignBlockActor::_onUpdatePacket`. However, in the current headers they (`onUpdatePacket`, `$_onUpdatePacket`) are marked `MCNAPI` ("This API is not available"), so they cannot be hooked directly by symbol; you need to handle that yourself or open an issue on LeviLamina.

The front/back related members have been completed in the current headers: `SignBlockActor` has `mTextFront` / `mTextBack`, `getMessage(SignTextSide side)` and `getSideFacingPlayer(Player const&)`, and the `SignTextSide` enum is `Front=0` / `Back=1`.

*Applies to: LeviLamina current version (26.x)*

## When developing a LeviLamina plugin, how do I replace the drops of a mined block (for example, mining dirt or tuff so that it drops cobblestone)? What if the spawned drop doesn't pop upward?

Listen for and intercept the block destroy event (`ll::event::PlayerDestroyBlockEvent`, which is cancellable; `pos()` gives the block position). After cancelling the original drop, spawn the cobblestone item at that position yourself (for example with `Spawner::spawnItem`). See the "bedrock drop" feature of CoralFans for a reference. If the item doesn't pop out properly (it is stuck inside the block), spawn the item first and then remove the block. Make sure the block type you target is right (grass blocks and dirt are different blocks). Vanilla drops are handled by dedicated classes, so changing `resourceDrops` directly doesn't necessarily work for vanilla blocks.

*Applies to: LeviLamina current version*

## I want players to keep their potion effects after death, so I add the effect in the player respawn event. The code runs but the effect doesn't take hold. Can't effects be added at the moment of respawn?

The vanilla logic clears effects on respawn, so effects added directly in `PlayerRespawnEvent` get overwritten. To fix this, add the effect after a delay of 1 tick; or hook `Player::$respawn` yourself, call `origin` first and then run your logic to add the effect; or hook the function that clears effects and prevent the clearing on death/respawn.

*Applies to: current LeviLamina version*

## I followed the LeviLamina documentation to write a player join event listener, but the compiler can't find the event type. What should I do?

Each LeviLamina event lives in its own header, so you must `#include` the header of every event you use; including only `EventBus` is not enough. For example:

```cpp
#include "ll/api/event/player/PlayerJoinEvent.h"

ll::event::EventBus::getInstance().emplaceListener<ll::event::PlayerJoinEvent>([](ll::event::PlayerJoinEvent& ev){ /* ... */ });
```

(`player` is an inline namespace, so both `ll::event::PlayerJoinEvent` and `ll::event::player::PlayerJoinEvent` work.) Also, save your code changes before compiling.

*Applies to: all LeviLamina versions*

## Can I use LeviLamina's reflection (`ll::reflection`) to serialize or register all event classes automatically (for example, so that a logging plugin records every event)?

No. LL's reflection supports only aggregate types, not classes with constructors, and event classes have constructors, so they cannot be reflected directly. The `serialize(CompoundTag&)` that events provide is not designed for persistent logging either. You have to write your own template and specialize it manually for each event.

*Applies to: LeviLamina 1.x and later*
