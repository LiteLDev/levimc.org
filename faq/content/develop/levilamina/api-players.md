# LeviLamina mod API: players and entities

## In a LeviLamina C++ mod, should I key per-player data and identify players by uuid, xuid or realName? Why does LegacyMoney use xuid?

Use the UUID (`Player::getUuid()` returns `mce::UUID`). With licensed-account verification on (`online-mode`), the UUID is fixed and consistent across worlds; with it off, the UUID is random, but then the xuid is not reliable either (it may be empty when offline). `mce::UUID` consists of two `uint64` values, so comparing and hashing it is faster than an xuid string, and it can be used directly as an `unordered_map` key. Do not use `realName` (it can be changed). LegacyMoney uses xuid for historical reasons (legacy compatibility); plugins that already store data by xuid can stay unchanged when `online-mode` is on. To look up between uuid and xuid (for example when reading the LegacyMoney database), use `fromUuid()`/`fromXuid()`/`fromName()` of `ll::service::PlayerInfo`.

## How can a native mod implement a virtual container/custom chest GUI (such as Invsee for viewing inventories, or quickly opening shulker boxes)? Does LeviLamina have a ready-made interface?

LeviLamina has no wrapper for virtual containers, so you have to implement it yourself. Common approaches:

1. Simplest: place a real container block near the player and open it, then remove it after it is closed.
2. Fully packet-based: send a fake chest block with `UpdateSubChunkBlocksPacket`, update its block entity NBT with `BlockActorDataPacket`, and have the player open the screen with `ContainerOpenPacket`; then handle container content updates and all item requests (`ItemStackRequest`) yourself. For offline players you must also read and write the NBT yourself.
3. Half packet-based: construct a container object on the server (`Container` is an abstract class, so use a suitable derived class) and make the server believe the player has opened it, while sending packets to the client to fake the block and open it. Item display and movement are left to vanilla logic, and you only handle opening and saving (this requires a deep understanding of MC's container mechanics).

The client will always see a "fake block"; this is a limitation of the vanilla client, unless the client also has mods installed. You can also use the virtual container API provided by a third-party dependency mod (such as GMLIB).

*Applies to: all current LeviLamina versions (server)*

## How do I get a `ServerPlayer` in a C++ mod? How do I convert `Player` to `ServerPlayer` (`dynamic_cast` is unavailable), and what if `ServerNetworkHandler::getServerPlayer` is gone?

If you only target the server, you can `static_cast<ServerPlayer&>(player)` directly. If the mod may also run on the client (`target_type=client`), check first (for example `player.isClientSide()`) and then convert.

To get a player by `NetworkIdentifier` inside `ServerNetworkHandler`, use `_getServerPlayer(source, subId)` (the `getServerPlayer` wrapper no longer exists since BDS 1.21.60).

When hooking virtual functions that `ServerNetworkHandler` inherits from `NetEventCallback` (such as the various `handle(NetworkIdentifier const&, XxxPacket const&)`), `this` inside the hook actually points to the `NetEventCallback` subobject, not the start address of `ServerNetworkHandler`. Do not compute the offset by hand; use the `thisFor<NetEventCallback>()` provided by the hook to get the correct `ServerNetworkHandler*`, then call `_getServerPlayer` (LeviLamina's own `PlayerJoinEvent` / `PlayerChatEvent` do exactly this: `thisFor<NetEventCallback>()->_getServerPlayer(identifier, packet.mSenderSubId)`).

*Applies to: BDS 1.21.60 and later / current LeviLamina*

## In a C++ mod I want to change a player's health/max health, but the vanilla functions the old code called (such as `AttributeHelper::setMaxValue`) are marked `MCNAPI` in new LeviLamina and cause compile warnings/errors. What do I do?

`MCNAPI` means that the vanilla function has no linkable symbol in the current BDS (usually because it has been inlined). LeviLamina's headers mark it as `[[deprecated("This API is not available. Open an issue if you need it.")]]`, and it cannot be called. What to do:

1. Use another available API. To change attribute values, use the `BaseAttributeMap` helper functions implemented by LeviLamina itself, for example `actor.getAttributes()->setMaxValue(SharedAttributes::HEALTH(), value);`, `setCurrentValue(...)` and `setDefaultValue(...)` (`SharedAttributes::HEALTH()` is a static function that returns the health `Attribute`); or get the attribute instance with `actor.getMutableAttribute(SharedAttributes::HEALTH())` and modify its members directly.
2. If you really need a vanilla function, open an issue in LeviLamina to request it (it is usually not added unless requested).
3. You can also handle it yourself with signatures/offsets.

*Applies to: LeviLamina 1.2.0 and later (still applies to the current v26.60.x)*

## Since 26.40 the `actorUniqueId` field in `AddPlayerPacket` is gone. How should a simulated-player or out-of-body (freecam) mod set the player's `ActorUniqueID`?

The original AUID in `AddPlayerPacket` was a redundant field; the client actually uses the one in the abilities data. Set `::ll::TypedStorage<8, 8, ::ActorUniqueID> mTargetPlayer` in `AddPlayerPacketPayload::mAbilitiesData` (`SerializedAbilitiesData`) (see LeviLamina `src/mc/world/actor/SerializedAbilitiesData.h`). Since LeviLamina 26.40.5, a constructor for `AddPlayerPacket` is also provided and can be used directly.

*Applies to: BDS 26.40 and later / LeviLamina 26.40 and later (still applies to the current 26.60)*

## Since BDS 1.21.132 `ConnectionRequest::mLegacyMultiplayerToken` is gone. How can a mod get a player's identity such as xuid and name?

Get it from `ServerNetworkHandler`: each `Client` in its `mClients` holds `mPrimaryPlayerInfo` (`PlayerAuthenticationInfo`) and `mSubClientPlayerInfo`; you can also use the functions in `ServerNetworkHandler` that take or return a `PlayerAuthenticationInfo`. BDS has already parsed the login chain, so you do not need to parse it from scratch. The validation logic of `ConnectionRequest` is also in `ServerNetworkHandler`.

*Applies to: LeviLamina for BDS 1.21.132 and later (still applies to the current v26.60.8)*

## In BDS, a player who puts items into a UI such as a crafting table and then force-quits can duplicate items. What causes it, and how can a LeviLamina mod fix it?

Cause: when player data is read (`Player::readAdditionalSaveData`), the game tries to add the items in the UI slots (`UIItems`) back to the inventory. If that fails it does not roll back, and tries to drop the items instead, but the chunk the player is in has not been loaded yet, so the drop fails. As a result the code that clears the UI items never runs, and the items are duplicated.

Fix approach:

1. Hook `Player::add` (for a virtual function, use `$add`), but do not rewrite it globally; change its behavior only within the call context of `readAdditionalSaveData`.
2. During `readAdditionalSaveData`, load the player's chunk first (for example with `ChunkSource::getOrLoadChunk`) so the drop can execute normally.

*Applies to: depends on vanilla BDS behavior; not confirmed whether the current BDS has fixed it. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What is the inheritance hierarchy of the player classes in BDS (`SimulatedPlayer`, `ServerPlayer`, `Player`, and so on)?

The chain is `SimulatedPlayer` → `ServerPlayer` → `Player` → `Mob` → `Actor`. There is a `Mob` layer between `Player` and `Actor`; `Mob` is a creature with AI logic (for example `aiStep`). On the client the counterpart is `LocalPlayer` (`LocalPlayer` → `Player`).

## Is `ContainerID` an enum in C++ mods? Why are the IDs of containers such as the inventory not fixed?

`ContainerID` is `enum class ContainerID : schar`, but only some containers have fixed values: `None=-1`, `Inventory=0`, `Offhand=119`, `Armor=120`, `SelectionSlots=122`, `PlayerOnlyUi=124`, `Registry=125`. Other opened container screens (chests, crafting tables, and so on) get IDs allocated incrementally in the range `First(1)` to `Last(100)`, so they are not fixed.

## `player.getOrCreateUniqueID()` in C++ returns an `ActorUniqueID`. Where is this API documented?

This is a native C++ API of Minecraft itself and has no official documentation. Look in the headers provided by LeviLamina: the function is declared in `mc/world/actor/Actor.h` (`ActorUniqueID const& getOrCreateUniqueID() const;`), and `Player` inherits from `Actor`. In daily work, search the headers directly or rely on IDE auto-completion.

## Is there a way in LeviLamina / LSE to make a player drop (throw out) an item?

A C++ mod can use `Player::drop(ItemStack const& item, bool randomly)` directly. LSE scripts have no native interface for dropping items, so you need a workaround: clear the item from the inventory, then spawn a dropped item at the player's position; or use the third-party GMLIB-LegacyRemoteCallApi (it exports the relevant interfaces through RemoteCall). In general, write the functionality you need as a C++ mod and expose it to JS plugins through LegacyRemoteCall.

## How do I get the string form of a player's UUID in a LeviLamina C++ plugin?

Use `player.getUuid().asString()`: `getUuid()` returns `mce::UUID const&`, and calling `asString()` converts it to a string (`mce::UUID` also supports the explicit conversion `std::string(uuid)`).

## How do I get a player object by xuid in LeviLamina? Calling `Level::getPlayerByXuid` directly gives an error or a memory fault.

`getPlayerByXuid` is a member (virtual) function of `Level`, not a static function, so you cannot declare or construct a `Level` yourself. Get the global `Level` through the LL service: `ll::service::getLevel()` returns an `optional_ref<Level>`, which you must check for emptiness, for example:

```cpp
if (auto level = ll::service::getLevel()) {
    Player* p = level->getPlayerByXuid(xuid);
    if (p) {
        // ...
    }
}
```

*Applies to: all versions*

## How do I implement flying in survival mode in a LeviLamina plugin (like a survival-fly plugin)?

Call LeviLamina's `Player::setAbility(AbilitiesIndex::MayFly, true)` (pass `false` to turn it off). In the current implementation, `setAbility` already syncs the `Canfly` flag internally and sends `UpdateAbilitiesPacket` and `UpdateAdventureSettingsPacket` to that player, so you do not need to send packets manually. If you modify `LayeredAbilities` directly, you must send `UpdateAbilitiesPacket` yourself for the change to take effect on the client. LSE also has a corresponding wrapper.

## Does LeviLamina have a `giveItem`-style API like LL2 for giving items to players? Does the inventory refresh automatically after `Player::add`?

LeviLamina does not provide the LL2-style `giveItem` wrapper; use Mojang's own API directly. `Player::add(ItemStack&)` works, but it does not refresh the client's inventory. After adding, call `refreshInventory()` (an LL extension method on `Mob`) to sync the client.

A simpler way is to use LeviLamina's extension `Player::addAndRefresh(ItemStack& item)`, which does `add` followed by `refreshInventory` internally. Its return value tells you whether the item was fully given (it does not reflect whether the refresh succeeded). Copying the LL2 implementation is not recommended.

*Applies to: LeviLamina 1.x and later (still applies to the current v26.60.8)*

## When writing a native vanish mod, why can players who have already seen the player still see them if I only intercept the `AddActor` packet?

Intercepting the `AddActor` packet (`AddPlayer` for players) only prevents later spawns. Clients that have already loaded the player do not remove the entity automatically, so you must actively send a `RemoveActorPacket` to those players to hide the player immediately. The events provided by iListenAttentively can reduce the amount of hand-written hooks.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I get an entity's main-hand and off-hand items in a LeviLamina mod? I only found the function for armor.

In the current LeviLamina headers, use `Actor::getCarriedItem()` (a virtual function) for the main-hand item and `Actor::getOffhandSlot()` for the off-hand item. Both are defined in the `Actor` class, like `getArmor`. The `Mob` class also has `getAllHandEquipment()` to get all hand-held equipment at once. When searching, look for `carried` / `offhand` case-insensitively in `Actor.h` / `Mob.h`.

*Applies to: LeviLamina current version*

## How do I play a sound to a player in LeviLamina? What if I cannot find a ready-to-use sound packet?

The simple way is to use the `playSound` family of functions on `Level` (`ILevel`), for example `playSound(LevelSoundEvent, Vec3 const&, float volume, float pitch)` or `playSound(PlaySoundOptions const&)`.

To send it to a single player only, construct the packet directly and send it, for example `PlaySoundPacket(...).sendTo(player);` (Packet has its own `sendTo(Player const&)`). The temporary Packet object is destroyed automatically by RAII, so you do not need to free it manually. You can also refer to the implementation of the vanilla `playsound` command.

*Applies to: LeviLamina current version*

## In a native LeviLamina mod, how do I control the player's currently selected hotbar slot from the server (for example switch to slot 1 after the player clicks slot 9)?

The BDS `Player` class has a `setSelectedSlot(int slot)` function (it returns the `ItemStack const&` of that slot) that sets the player's currently selected hotbar slot; the header is `mc/world/actor/player/Player.h`. The selected slot is synced to the client by packets sent from the server, so a mod can do this.

*Applies to: LeviLamina current version*

## When developing a LeviLamina mod, how can I run a check asynchronously when a player joins (such as querying a cloud blacklist) without blocking the server, and let the player in only after the check passes?

BDS itself has an asynchronous join callback mechanism. In the latest version it lives in `AsyncJoinTaskManager` (`ServerNetworkHandler::mAsyncJoinTaskManager`): `registerAsyncJoinCallback(callback)`, where the callback parameters are `(NetworkIdentifier const&, PlayerAuthenticationInfo const&, SubClientId, std::shared_ptr<AsyncVerdictPromise>)`. `handleAsyncJoinCallbacks` aggregates the results, and the verdict types are `AsyncJoinAllow` / `AsyncJoinDeny`. These functions are `MCNAPI`, so you need to locate or complete them yourself. The Script API counterpart is `AsyncPlayerJoinBeforeEvent`. Another approach is to intercept packets: hold back `StartGamePacket` for the player, send it once you have the check result, and send a kick packet if the check fails.

*Applies to: LeviLamina current version*

## How do I tell whether a player is using touch or keyboard and mouse, so I can decide between sending a form or a container UI?

Don't decide by operating system; decide by the player's current input mode. The payload of `PlayerAuthInputPacket` (`PlayerAuthInputPacketPayload`) has an `mInputMode` field (enum `InputMode`: `Mouse`=1, `Touch`=2, `GamePad`=3), which you can get by listening to or hooking that packet. The `ConnectionRequest` sent at login also carries `currentInputMode`. Send the container UI for keyboard and mouse (`Mouse`) and a form for touch (`Touch`). Note that players can switch input modes at any time, so use the most recently received value.

## Which packet controls dragging or clicking items in the inventory? How do I know which item was acted on?

It is controlled by `ItemStackRequestPacket` (which contains an `ItemStackRequestBatch`). The specific operations are in `ItemStackRequestAction` (with several `ItemStackRequestActionType` values such as take/place/swap/drop), and item stacks are told apart by a unique `networkId`. On PC, clicking an item sends a packet (the item moves from the inventory slot to the `CURSOR` slot); on mobile, a plain tap doesn't send one. If you don't want to parse packets yourself, you can use `PlayerRequestItemActionBeforeEvent` provided by iListenAttentively.

*Applies to: current BDS / LeviLamina version*

## How do I set a custom lore on a specific item in the inventory using C++ (a LeviLamina mod)?

Once you have the `ItemStack`, call `item.setCustomLore(std::vector<std::string>{...})` to set the lore, `item.clearCustomLore()` to clear it, and `getCustomLore()` to read it. You can follow the LSE implementation: `ItemClass::setLore` in <https://github.com/LiteLDev/LegacyScriptEngine/blob/develop/src/legacy/api/ItemAPI.cpp>. After the change, call `player.refreshInventory()` to refresh the player's inventory; only then does the client show it.

*Applies to: current LeviLamina version*
