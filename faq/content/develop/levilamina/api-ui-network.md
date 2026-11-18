# LeviLamina mod API: forms, packets and network

## How does a LeviLamina client mod draw its own UI? Is there a unified ImGui hook?

LeviLamina provides no unified ImGui hook and no wrapper around vanilla JsonUI/OreUI. The maintainers advise against hooking the system layer (DX/window) to attach ImGui yourself; instead, plug into MC's own rendering/UI: the LL client provides `ll::event::BeforeUIRenderEvent` / `AfterUIRenderEvent` (which give you the `ScreenView` and `MinecraftUIRenderContext`), and you can draw there with MC's UI render context. The relevant MC APIs are all in the `src-client/mc` headers and can be called directly (JsonUI/OreUI must be implemented yourself, and OreUI is hard to do because Mojang has not open-sourced some of its libraries). You can also look at examples from client mod frameworks such as Amethyst.

Note: LL's `ll::form` and the new `ll::ui` (data-driven UI/DDUI forms, see data_driven_ui_guide) are APIs for the server to send forms to players, not wrappers for client-side custom drawing.

*Applies to: LeviLamina client edition 26.60.x*

## Does LeviLamina have an API for drawing wireframes (such as showing hitboxes or claim boundaries)? Can it show borders on the client like a structure block does?

LeviLamina itself has no debug-shape/wireframe API. The structure block's border is hard-coded, and extracting it is not recommended.

On the server, use OEOTYAN's BedrockServerClientInterface (BSCI, <https://github.com/OEOTYAN/BedrockServerClientInterface>, also available at <https://levimc.org/mods/github.com/OEOTYAN/BedrockServerClientInterface/>) to draw debug shapes/wireframes; claim plugins such as PLand use it to display claim boundaries.

To draw inside a client mod yourself, you need to hook into the game's rendering: the LL client's `BeforeUIRenderEvent` / `AfterUIRenderEvent` are built on a hook of `ScreenView::render`, so you can listen to these events or hook a rendering function yourself.

*Applies to: LeviLamina 26.x (BSCI v26.60.0 is released for the current version)*

## How can a server mod send a player text that contains only a translation key (optionally with parameters), so the client translates it into its own language? What about custom keys?

Send a `TextPacket` of type `Translate`, for example:

```cpp
TextPacket pkt{};
pkt.mLocalize = true;
pkt.mBody = TextPacketPayload::MessageAndParams{TextPacketType::Translate, "my.key", {"param1", "param2"}};
pkt.sendTo(player);
```

The client translates it with its local language files. Vanilla keys can be used directly; custom keys must be delivered to the client in a resource pack as language files (`texts/*.lang`) (the server can force delivery with `resource_packs`), because the client can only load language files from resource packs. You do not need to write the packet by hand with `BinaryStream`; for the protocol format, see Mojang's official protocol documentation. Third-party dependency mods (such as GMLIB) also provide related APIs.

*Applies to: current LeviLamina version (26.x)*

## How can a LeviLamina native (C++) mod define custom packets so a client mod and a server mod can communicate with each other?

LeviLamina has built-in custom packet support (`ll/api/network`) since 1.9.0. The current approach:

- Inherit from `ll::network::PacketBase<T>` and implement `write` / `read` to define a packet (inheriting registers it).
- Inherit from `ll::network::PacketHandlerBase<Handler, Packet>` and implement `handlePacket(NetworkIdentifier const&, NetEventCallback&, ll::network::PacketSide side, Packet const&)` to handle the packet.
- To send, use `packet.sendToServer()` (client to server) and `packet.sendTo(player)` / `sendToClient(networkId, subClientId)` / `sendToClients()` (server to client).

When you need to register dynamically at runtime (for example in a script engine), use `ll::network::PacketRegistrar::getInstance()`. Since 26.60 you can also declare `CustomPacketId`, `PacketVersion`, the handling side `Side` and `Optional`; a side that lacks a required packet is disconnected at login.

*Applies to: LeviLamina 1.9.0 and later (the `handlePacket` signature and `Side`/`Optional` are 26.60.0 and later)*

## What does the `write` function of the BDS `Packet` class do, and when is it called? What is `read`?

`write(BinaryStream&)` serializes the packet into a `BinaryStream` and is called when a packet is sent. `read(ReadOnlyBinaryStream&)` reads data from a `ReadOnlyBinaryStream` and deserializes it into the `Packet` object; it is called when a packet is received (concrete packet classes implement the pure virtual function `_read`, which `read` calls internally).

## The `ll::form::ModalForm` constructor takes only the title, content and two button texts. Where does the callback go? Writing a lambda as in old tutorials gives `No viable conversion ... to 'Callback'`. What should I do?

The callback is passed in `sendTo(player, callback)`. The signature of `ModalForm::Callback` is `void(Player&, ll::form::ModalFormResult, ll::form::FormCancelReason)`, where `ModalFormResult = std::optional<ModalFormSelectedButton>` and `FormCancelReason = std::optional<ModalFormCancelReason>`. The last two parameters are both `optional`, so check whether they have a value first. The simplest form: `form.sendTo(player, [](Player& player, ll::form::ModalFormResult result, ll::form::FormCancelReason reason) { ... });` (you can also use `auto`). Getting a parameter type wrong (for example writing `ModalFormSelectedButton` directly instead of an `optional`) produces the conversion error above. See the official form guide `developer_guides/how_to_guides/form_guide`.

*Applies to: LeviLamina 0.11 and later*

## After changing the item in one inventory slot of a player in a LeviLamina C++ mod, why send an `InventorySlotPacket` instead of calling `refreshInventory` to sync it to the client?

`Mob::refreshInventory()` calls `sendInventory(true)` and `sendArmor` to send all armor slots, that is, it refreshes the entire inventory and armor bar. `InventorySlotPacket`, in contrast, updates only a single container slot (`mInventoryId`, `mSlot`, `mItem`), so it carries less network data. When only one item changes, sending an `InventorySlotPacket` is the better choice.

Also, functions such as `Actor::getPlayerOwner()` return a pointer (`Player*`) that can be `nullptr` (for example for a force-spawned fishing hook with no owner); calling player functions on it directly crashes the server with a null pointer, so check it first.

## How do I write a form in a LeviLamina C++ mod? Is there an official tutorial?

The official documentation has a form guide: <https://levimc.org/LeviLamina/developer_guides/how_to_guides/form_guide/> (it covers `SimpleForm`, `ModalForm` and `CustomForm`, sent with `sendTo` and a callback). For the API reference, see `api_reference/form`. You can also look at the implementation of the form API in LegacyScriptEngine.

## In LeviLamina C++, I send a `CustomForm` (with `appendDropdown`) to a player. Submitting works, but the server crashes when the player closes the form with the X in the top-right corner. Why?

The `CustomForm` callback signature is `void(Player&, CustomFormResult const&, FormCancelReason)`, where `CustomFormResult` is `std::optional<std::unordered_map<std::string, CustomFormElementResult>>`. When the player closes the form with X, the result is empty (`std::nullopt`, and `FormCancelReason` has a value). If the code directly accesses `result->at("playerName")` or `std::get<std::string>(...)`, it touches an empty `optional` or a non-existent key and throws or crashes.

The correct approach is to check `if (!result) return;` (or check `cancelReason`) first in the callback, then confirm the key exists with `find`/`contains`, and check the type with `std::get_if` before taking the value. Also, do not pass an empty options array to `appendDropdown`.

## What type does the callback result of `appendStepSlider` in a LeviLamina C++ `CustomForm` have?

Unlike LSE (which returns the index), `ll::form::CustomForm::appendStepSlider(name, text, std::vector<std::string> steps, defaultVal, tooltip)` in LeviLamina C++ yields, in the callback result `CustomFormResult` (`std::unordered_map<std::string, CustomFormElementResult>`), the string of the selected item itself (a `std::string`, stored in a `std::variant<std::monostate, uint64, double, std::string>`), not the index. This is still the case in the current v26.60.8.

Example of reading the value:

```cpp
std::get<std::string>(result->at("name"))
```

*Applies to: LeviLamina 0.11 and later*

## Are the packet structs in LeviLamina complete, and can I build and send packets myself?

Yes. LeviLamina has filled in a large number of packet structs (hundreds of headers under `mc/network/packet/`), which is enough to build and send packets yourself. Once a packet is built, you can send it with the methods LL provides for `Packet`, such as `packet.sendTo(player)`, `sendTo(actor)`, `sendTo(pos, dimId)` and `sendToClients()`.

## Can a LeviLamina `CustomForm` have only one submit button? Can I add other buttons?

The traditional form `ll::form::CustomForm` can only set a single submit button through `setSubmitButton(text)`; you cannot add several buttons. When you need multiple buttons or more complex interaction, use the new DDUI (data-driven UI) interface `ll::ui::CustomForm` (header `ll/api/ui/form/CustomForm.h`), which supports adding multiple buttons with `button(label, callback, options)`, plus controls such as `closeButton()`, `textField()`, `toggle()` and `dropdown()`, and is displayed with `show()` / `showAsync()`. The DDUI interface requires the client and BDS to support data-driven UI.

*Applies to: LeviLamina 26.60.x*

## Does the LeviLamina (LL3) C++ API still have an HTTP request feature (httplib) like LL2?

No. LeviLamina provides no public HTTP request wrapper (`ll/api/network` only contains packet-related code). Add a third-party library yourself in `xmake.lua`, for example cpp-httplib (LegacyScriptEngine uses cpp-httplib for its network requests, so you can read its source) or cpr, or build your own on top of asio.

*Applies to: all LeviLamina versions (LL3 onward)*

## How do I send a packet to a specific player in a LeviLamina C++ mod? What is the difference between `player->sendNetworkPacket` and `Packet::sendTo`?

After building the Packet, you can call `player.sendNetworkPacket(packet)` or use LeviLamina's `packet.sendTo(player)`. In the current implementation, `Packet::sendTo(Player const&)` sends through Minecraft's `PacketSender::sendToClient` using the player's `NetworkIdentifier` and `SubClientId`. For an ordinary online player the effect is the same as `sendNetworkPacket`; it is just a more convenient wrapper. There are also overloads such as `sendTo(BlockPos, DimensionType, except)`, `sendTo(Actor, except)` and `sendToClients()` for broadcasting by position or entity.

If the client does not react after you send a packet, the packet contents are usually wrong and the client dropped it.

*Applies to: all LeviLamina versions*

## In a LeviLamina C++ plugin, which packet should I send to force-close the container screen (chest and so on) a player has open?

Send a `ContainerClosePacket`, set `mContainerId` in its payload (the ID of the container the player currently has open) and set `mServerInitiatedClose` to `true`; the server then closes the player's container screen. `ContainerClosePacket` currently extends `ll::PayloadPacket<ContainerClosePacketPayload>`, and the fields `mContainerId` / `mContainerType` / `mServerInitiatedClose` are defined in `ContainerClosePacketPayload`.

Note: not every screen, such as the chat box or the command block editor, can be closed this way. If you only want to show a form, there is no need to close all screens.

*Applies to: LeviLamina 1.x and later (currently v26.60.x)*

## How do I build and send a packet in a LeviLamina mod? What if I cannot understand the write order of `BinaryStream`?

Construct the corresponding Packet class directly (such as `XxxPacket`), assign its members/payload, then send it with methods such as `sendTo(player)`, instead of writing a `BinaryStream` by hand.

If you must write a `BinaryStream` by hand, `write` the fields one by one in protocol order. For the order you can refer to the implementation of the corresponding `Packet::write` in IDA, the protocol classes of PowerNukkitX, or the commented Go protocol library gophertunnel (`github.com/Sandertv/gophertunnel/minecraft/protocol/packet`). Mojang's official protocol documentation is incomplete and contains errors. For an example of sending packets with `BinaryStream`, see `src/legacy/api/PacketAPI.cpp` in LegacyScriptEngine.

Note that using the generic packet classes that come with BDS for reading and writing is not recommended: for some packets, the source cannot be found during read/write, which crashes the server.

*Applies to: LeviLamina current version*

## How do I show a BossBar in a native (C++) LeviLamina mod? Is there an example or documentation?

You can build and send a `BossEventPacket` manually (its payload is `BossEventPacketPayload`, with fields such as `mEventType` (`BossEventUpdateType`) and `mName`). See the class documentation at <https://lamina.levimc.org/api/dc/df0/classBossEventPacket.html>. To show a boss health bar for a mob, don't send packets by hand; use the mob's boss component instead. You only need to send the packet yourself for a custom BossBar that isn't tied to a mob.

*Applies to: LeviLamina 26.x*

## How do I write a plugin that sends a fake world seed to players? LSE scripts seem unable to do it.

You need a native mod: hook the send/construct-related functions of `StartGamePacket` and change the seed before the packet goes to the client. In the latest version, the seed is `mSeed` (`LevelSeed64`) in `StartGamePacketPayload::mSettings` (`LevelSettings`). GMLIB has a similar implementation you can use as a reference.

*Applies to: LeviLamina current version*

## How do I get a 3D rendering of a block in a client mod (for an info-display mod)?

You can use the function in `ItemRenderer` (`class ItemRenderer : public ActorRenderer`) that renders block items, but some blocks may not show up on the HUD (this depends on the rendering context and the hook point). Some users also suggest using `BlockTessellator` directly.

*Applies to: LeviLamina client (src-client) mod. Not confirmed against the source code or the documentation: treat it as a pointer.*

## I want to write a LeviLamina mod that automatically translates the text in specific packets the server sends to clients into a target language. How do I implement it?

Hook the `write` function of that packet class (such as `TextPacket::$write(BinaryStream&) const`) and modify the packet's members inside the hook (`write` is `const`, so you need `const_cast`; many packets are now `ll::PayloadPacket<XxxPayload>`, and the text lives in a payload member, such as `mBody` of `TextPacket`). Then call `origin` so that normal serialization and sending continue. You can also intercept before sending instead (such as `SendPacketEvent` from iListenAttentively).

## I want to send a fake entity. How do I construct an `AddActorPacket`?

Don't call the constructor directly and fill in fields; missing internal pointers such as entity data easily cause crashes. Follow the LSE approach: create the packet with `MinecraftPackets::createPacket(MinecraftPacketIds::AddActor)` and `static_pointer_cast<AddActorPacket>`, fill in fields such as `mEntityId`, `mRuntimeId`, `mActorType` and `mPos`, then call `sendTo(player)` (see the `setBossBar` implementation in `LegacyScriptEngine/src/legacy/api/PlayerAPI.cpp`). Alternatively, create a temporary real entity, generate the packet with `Actor::tryCreateAddActorPacket()`, then change fields such as the position in the packet before sending it. The header is `mc/network/packet/AddActorPacket.h`.

*Applies to: current LeviLamina version; current LegacyScriptEngine version*

## Can the server make a client open a book and show its contents by sending a packet?

Basically no. Viewing a book is purely client-side: no packet is sent while a player reads it, and a `BookEditPacket` is sent only when the content is modified. The book's content is stored in the item's NBT. You can consider a workaround, such as having the player open a lectern that holds the book.

*Applies to: vanilla BDS protocol behavior, independent of the LeviLamina version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## After hiding other players' names from a specific player by sending packets, the server restores them after a while. How do I fix this?

The server itself periodically sends `SetActorDataPacket` to update player entity metadata. Instead of sending a separate corrective packet, modify the DataItem (`SetActorDataPacketPayload::mPackedItems`) directly when the server sends that packet. You can refer to the packet-modifying implementation in the open-source plugin FuckNetherHeight.

*Applies to: LeviLamina server, relies on the vanilla BDS sync behavior. Not confirmed against the source code or the documentation: treat it as a pointer.*
