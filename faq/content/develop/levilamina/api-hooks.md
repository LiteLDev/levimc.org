# LeviLamina mod API: hooks and memory

## Do I need to unhook manually in a LeviLamina mod's disable/unload? Are hooks registered with the `AUTO` macros unloaded automatically?

The `AUTO` macros (`LL_AUTO_TYPE_INSTANCE_HOOK` and so on) generate a global `HookRegistrar` object that hooks on construction and unhooks on destruction. So when the mod is unloaded (the DLL is released and static objects are destroyed), these hooks are removed automatically and you do not need to unhook in unload. Merely disabling the mod does not release the DLL, so the hooks stay active. If you want hooks to stop working after disable (to support hot reload or disabling and re-enabling at runtime), call `DEF_TYPE::unhook()` in disable and `DEF_TYPE::hook()` in enable (or use non-`AUTO` hooks and manage them manually). If you do not plan to support hot reload, you can omit this code. All hooks are also removed automatically when the game exits.

*Applies to: LeviLamina 0.13 and later*

## How do I hook game (BDS) functions in LeviLamina? Is there a tutorial?

Use the hook macros LeviLamina provides in `ll/api/memory/Hook.h`: `LL_TYPE_INSTANCE_HOOK` / `LL_AUTO_TYPE_INSTANCE_HOOK` (instance functions), `LL_TYPE_STATIC_HOOK` / `LL_AUTO_STATIC_HOOK` (static functions) and so on, plus the variants with the `_EX` suffix. Macros with `AUTO` register automatically; those without it must be registered by calling `XXXHook::hook()` manually (and `unhook()` on unload). Official tutorial: <https://levimc.org/LeviLamina/developer_guides/how_to_guides/hook_guide/> (old `lamina.levimc.org` links redirect). You can also look at how official mods such as LegacyScriptEngine write their hooks in their source code.

*Applies to: LeviLamina current version*

## What information do I need to write a LeviLamina hook? Where do I find the BDS function declarations/symbols to hook?

A hook needs: a hook name (`DEF_TYPE`), a priority, the owning type (`TYPE`), the target function identifier (`IDENTIFIER`, usually a member function pointer such as `&ScreenView::render`, or a symbol string), the return type and the parameter list.

BDS class and function declarations are in the decompiled headers shipped with the LeviLamina repository: the server/common part is in `src/mc`, and the client-only part is in `src-client/mc` (<https://github.com/LiteLDev/LeviLamina/tree/main/src/mc>). Note that functions marked `MCNAPI` in the headers are currently unavailable (not exported) and cannot be referenced directly; request them at <https://github.com/LiteLDev/mcapi-requests> if you need them.

There is also an official "Find Function" guide: <https://levimc.org/LeviLamina/developer_guides/how_to_guides/find_function_guide/>.

*Applies to: LeviLamina current version*

## Many class constructors in LeviLamina headers are declared but not implemented (compiling a mod reports a missing constructor symbol or says it is unavailable). How do I construct such a class in a mod? Can I fill the vtable with `nullptr`?

Constructors marked `// prevent constructor by default` in the headers, declared but not implemented, are there to prevent accidental construction: the original constructor is often inlined, so there is no way to tell whether it contains special logic, and it is disabled by default. If there is no constructor symbol at all, it may also have been optimized out by the compiler.

When you need to construct such a class, you have to judge it manually and implement it yourself: implement the constructor in your mod code, or copy the class declaration out and define and implement the construction logic yourself. If you define the class yourself, implement its virtual functions too; do not fill the vtable with `nullptr`, or the game will crash when other mods hook or directly call the virtual functions.

Also, at Mojang's request LeviLamina uses an API whitelist. Missing symbols (including constructors) must be requested by opening an issue at <https://github.com/LiteLDev/mcapi-requests>, and the maintainers will add them in a later version (the LL CHANGELOG often contains entries like "Added constructor for ...").

*Applies to: LeviLamina 26.60.x*

## LeviLamina does not provide some higher-level APIs (such as intercepting vanilla network packets or changing block rendering), and the event system has no network packet events. How can a native mod do this?

LeviLamina has few high-level APIs, so missing features require you to hook game functions yourself. The mc directories in the LeviLamina source (`src/mc`, `src-server/mc`, `src-client/mc`) provide MC's headers; find the relevant classes and functions there, then hook them with LL's hook macros (such as `LL_TYPE_INSTANCE_HOOK` / `LL_AUTO_TYPE_INSTANCE_HOOK`).

To intercept vanilla packets received by the server, hook the `handle(NetworkIdentifier const&, XxxPacket const&)` for the corresponding packet type in `ServerNetworkHandler`; on the client side, packet handling is in `ClientNetworkHandler` / `LegacyClientNetworkHandler` (`src-client`). For rendering changes (such as connected textures), you can refer to the rendering logic of other open-source mods, hooking at render time and replacing the material.

*Applies to: LeviLamina current version (hook targets change with the BDS version; check the headers yourself)*

## In a C++ mod I used a hook macro with `AUTO` (such as `LL_AUTO_TYPE_INSTANCE_HOOK`) and then also called `hook()` manually. The callback runs twice and errors occur. Why?

A hook macro with `AUTO` generates an inline static `HookRegistrar` object that runs `hook()` once automatically when the DLL loads. If you then call `Hook::hook()` manually as well, the function is hooked twice and the callback runs twice. With an `AUTO` macro, do not call `hook()` yourself. If you want to control the timing, use a macro without `AUTO` (such as `LL_TYPE_INSTANCE_HOOK`) and call `hook()`/`unhook()` manually, or manage hooks together with `ll::memory::HookRegistrar<Hook1, Hook2...>` (it is reference-counted and never hooks twice).

*Applies to: LeviLamina 1.x and later*

## In C++ mod development, how do I get the block a hopper points at when I only have the `HopperBlockActor` (I need a `BlockSource`)? For example, to build a hopper item counter.

You can follow the trapdoor approach: hook `tick(BlockSource& region)` of `HopperBlockActor`, take the `BlockSource` from the parameter and save it temporarily. A hopper triggers `setItem(int slot, ItemStack const& item)` during its tick, so by call order, the `BlockSource` saved in the tick hook belongs to the hopper currently running `setItem`. Then take `BlockActor::getPosition()` and add the hopper block's facing direction (block state) to compute the position of the block it points at.

*Applies to: LeviLamina (depends on BDS's internal call order). Not confirmed against the source code or the documentation: treat it as a pointer.*

## In a LeviLamina C++ mod, a hook copied from the LL source (such as `LL_TYPE_INSTANCE_HOOK`) compiles but has no effect. Why? What is the difference between `AUTO` and non-`AUTO` hooks, and can they be unloaded?

The first macro parameter, `DEF_TYPE`, is the name of the generated struct. It must not collide with a LeviLamina built-in hook or another hook in the same namespace; just rename it.

A macro with `AUTO` (such as `LL_AUTO_TYPE_INSTANCE_HOOK`) calls `hook()` automatically on load to register the hook; one without `AUTO` (such as `LL_TYPE_INSTANCE_HOOK`) needs you to call `DEF_TYPE::hook()` yourself, otherwise it takes no effect. Both can be unloaded by calling `DEF_TYPE::unhook()` (all hooks are also unloaded automatically when Minecraft unloads). Not calling `origin(...)` inside the hook body intercepts the original function (when the return type is not `void`, return a suitable value). See `src/ll/api/memory/Hook.h` and the official hook guide.

## I hooked a member function with `STATIC_HOOK` and got an error or crash in the log or at the call site. Which hook macro should I use?

A member function has a `this` pointer, so use the `INSTANCE_HOOK` family (such as `LL_TYPE_INSTANCE_HOOK` / `LL_AUTO_TYPE_INSTANCE_HOOK`) rather than `STATIC_HOOK`; the `STATIC_HOOK` family is only for static or free functions. See the hook guide on the official LeviLamina documentation site (developer guide `how_to_guides/hook_guide`).

*Applies to: all versions*

## When writing a LeviLamina hook, what is the difference between a target function name with and without the `$` prefix?

A `$` prefix marks the implementation of a virtual function (such as `&Player::$attack`); you must use the `$` name when hooking a virtual function. For a non-virtual function, use the plain name (`&ClassName::method`). For example, `LL_TYPE_INSTANCE_HOOK(..., ServerNetworkHandler, &ServerNetworkHandler::$handle, ...)`.

*Applies to: all versions*

## Does LeviLamina support finding and hooking functions by signature? What other features are often overlooked in development?

Yes. `ll/api/memory/Signature.h` provides `SignatureView` and the `"..."_sig` / `"..."_sigp` literals (`SignatureView::resolve()` resolves the address). The function identifier of a hook macro (`LL_AUTO_TYPE_INSTANCE_HOOK` and so on) can be a symbol or member function pointer, or you can pass a `SignatureView` signature directly.

There are also:

- `virtualCall` in `ll/api/memory/Memory.h` (calls a virtual function by vtable index)
- `ll/api/reflection` (reflection, which can serialize a struct directly into a config)
- `ll/api/Config.h` (`ll::config::loadConfig` / `saveConfig` read and write JSON configs through reflection, so you do not need to parse anything yourself)

These features have little documentation; read the source directly.

*Applies to: LeviLamina 1.x and later*

## LeviLamina hooks have priorities. If a high-priority hook returns directly without calling `origin`, are lower-priority hooks still triggered?

No. Multiple hooks on the same function form a call chain ordered by `HookPriority`; the higher priority runs first (`Highest`=0 ... `Lowest`=400), and a hook proceeds to the next (lower-priority) hook only by calling `origin(...)`, until the original function is reached. If a high-priority hook returns without calling `origin`, the chain stops there, and neither the lower-priority hooks nor the original function run.

*Applies to: all versions*

## Why does a LeviLamina hook macro (such as `LL_AUTO_TYPE_INSTANCE_HOOK`) written inside a function produce an error (a red squiggle after the parenthesis)?

A hook macro expands to a struct (type) definition (with `inline static` members, template specializations and so on), so it can only be written at namespace or global scope, not inside a function body. Define the macro outside the function. The non-AUTO version (`LL_TYPE_INSTANCE_HOOK`) can be registered manually when needed through `Hook::hook()` / `unhook()` or `ll::memory::HookRegistrar`.

*Applies to: all versions*

## When implementing fast leaf decay in a LeviLamina mod, hooking or calling the `randomTick` virtual function of `Block` has no effect on leaves. Why?

The random tick logic of leaves is not implemented through the virtual function `randomTick` of `BlockType`: `LeavesBlock` has its own non-virtual member function `randomTick(BlockEvents::BlockRandomTickEvent&)` (in newer versions random ticks have become event-based, and the decay logic has also been split out). `static_cast` the `BlockType` to `LeavesBlock`, then call or hook this non-virtual `LeavesBlock::randomTick`.

*Applies to: LeviLamina current version*

## In LeviLamina, I hook a class constructor and write the return type as `void`, then get errors or a crash at runtime. How should a constructor hook be written?

A constructor hook should target the thunk function `&Type::$ctor` in the header. The return type must be a pointer (matching the `$ctor` declaration, currently `void*`), and you must return the result of the original function, because the address of the constructed object is passed through the return value. Writing `void` breaks the return value and causes a crash. Example:

```cpp
LL_AUTO_TYPE_INSTANCE_HOOK(DedicatedServerCtorHook, ll::memory::HookPriority::Normal,
    DedicatedServer, &DedicatedServer::$ctor, void*) {
    return origin();
}
```

*Applies to: LeviLamina current version*

## In LeviLamina's hook macros (such as `LL_TYPE_INSTANCE_HOOK`), why does the `TYPE` parameter sometimes need a global-namespace qualifier (written as `::ClassName`)?

`TYPE` is the type that owns the hooked function. After macro expansion it is used for `TYPE::*` member pointers, inheritance and so on. Writing it as `::ClassName` (global-namespace qualification) avoids a clash with a type of the same name in the current namespace (for example, when your mod's namespace also contains a class with that name). Normally you can leave it out; add `::` when you hit a name conflict or a resolution error. To see exactly what happens, expand the hook macro and read the generated code (`src/ll/api/memory/Hook.h`). Example: <https://github.com/engsr6982/CustomWorldGenerator/blob/main/src/Hooks/structure.cpp>

*Applies to: LeviLamina current version*

## While developing an MCBE Windows client mod, I hooked `WeatherManagerProxy::$getRainLevel`, `LevelRendererCamera::calcRainState` and similar functions and wrote to `WeatherRenderObject.mDensityRain`, but I don't see any weather change. How do I show weather only locally on the client?

Hook `Weather::$levelEvent`, check whether the current world is a local world, and then decide whether to run the original logic. For example:

```cpp
if (auto client = ll::service::getClientInstance()) {
  if (auto info = client->getGameConnectionInfo(); info && info->mType == Social::ConnectionType::Local) {
    return origin(type, pos, data);
  }
}
```

Note: in the latest headers, `Weather::$levelEvent` is marked `MCNAPI` (no exported symbol), so you need to locate it with a signature before hooking it.

*Applies to: LeviLamina client (src-client) mod. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What can I do when several LeviLamina client mods (such as replay, minimap and BetterRenderDragon) hook the same function and conflict?

Hooks installed through LeviLamina's hook macros (which call the original function through `origin`) can generally coexist on the same function. If a mod uses signature scanning or patches bytes directly, it may conflict because the start of the function has already been modified by another hook. You can adjust the load order so that a particular mod loads first: control it with fields such as `dependencies` / `optionalDependencies` / `loadBefore` in the mod's `manifest.json`. The execution order of multiple hooks on the same function can also be adjusted with `HookPriority`.

*Applies to: LeviLamina current version*

## How do I detect the title when a player signs a book in a LeviLamina plugin (for example, to run logic when the title has a specific value)?

After the client finishes editing or signing the book, it sends a `BookEditPacket` to the server. You can hook `ServerNetworkHandler::$handle(NetworkIdentifier const&, BookEditPacket const&)`. In the latest version, `BookEditPacket` inherits from `ll::PayloadPacket<BookEditPacketPayload>`, and the payload's `mOperation` is a `std::variant` (`ReplacePage`/`AddPage`/`DeletePage`/`SwapPages`/`Finalize`). Signing corresponds to `BookEditAction::Finalize`, where `mTitle`, `mAuthor` and `mXuid` are the book title, the author name and the xuid. Headers: `src/mc/network/packet/BookEditPacketPayload.h`, `src/mc/network/packet/book_edit_action/Finalize.h`.

*Applies to: LeviLamina 26.60.x*

## How do I stop players from building an iron golem with a pumpkin head?

Hook `BlockPatternMatcher::match(::BlockPos const& pos) const` and check whether `this->mData` (`BlockPatternData const&`, which contains the `mPattern`) is the iron golem build pattern. If it is, set `mMatched` of the returned `BuildMatch` to `false`. Note that in the latest headers this function is marked `MCNAPI`, so you need to locate it with a signature.

*Applies to: LeviLamina current version*

## When developing a LeviLamina mod, the function I need has been inlined or is `MCFOLD` (merged identical functions). How do I call or hook it?

For an inlined function you have to find a lower-level way to get the same result: getters such as `getXxx` are often inlined, and some become direct member accesses while others must be obtained through other methods. `MCFOLD` means the compiler applied identical code folding (Identical COMDAT Folding) to the function, so several functions share one implementation. When you hook it, you must therefore check where the call comes from inside the hook. The recommended way is to check the vtable pointer of `this` and run your logic only after confirming it is the target class. To find out who the callers are, analyze the binary with IDA.

*Applies to: LeviLamina current version*

## I want to hook Bedrock's log output function to intercept game logs, but the function I hooked outputs a lot of garbage. Which function should I hook?

You hooked the wrong function (you hooked a formatting function like `Util::format`/`formatWide`, which has a huge number of callers). Hook `BedrockLogOut`, as LeviLamina does (declared in `mc/common/Globals.h`: `void BedrockLogOut(uint const _priority, char const* pszFormat, ...)`). See `BedrockLogOutHook` in the LeviLamina source `src/ll/core/tweak/ModifyInfomation.cpp` (`LL_STATIC_HOOK(BedrockLogOutHook, HookPriority::Normal, BedrockLogOut, void, uint priority, char const* pszFormat, ...)`).

## Which function should I hook in a LeviLamina mod to stop pistons or moving blocks from pushing spectator-mode players? Why does a moving block still push the player after I block it on the server?

All server-side piston logic for pushing entities ends up in `PistonBlockActor::moveEntityLastProgress` (`PistonBlockActor::_moveCollidedEntities` / `_moveCollidedEntitiesHelper` take the same path), so you can intercept it there. However, a moving block pushing an entity is also decided by the client itself: even if you intercept the extra `MoveDeltaActor` packets and the server-side piston no longer pushes, the moving block can still push the player on the client. A complete fix has to change what you send (for example, special-case spectators and use something like a direct `setBlock` instead).

*Applies to: current LeviLamina version*

## I want to listen for or intercept player emotes with LeviLamina. I hooked the virtual function `playEmote` of `Player`, but it is called in a loop from server startup. Where should I hook?

Don't hook `Player::playEmote` (on the server that virtual function slot is only a placeholder and doesn't correspond to real emote handling). Hook `ServerNetworkHandler::$handle(NetworkIdentifier const&, EmotePacket const&)`, and inside the hook get the player with `thisFor<NetEventCallback>()->_getServerPlayer(identifier, packet.mSenderSubId)` (the same approach as LeviLamina's `PlayerChatEvent` implementation). To block the emote, return directly without calling `origin`. The server's handling of this packet is essentially forwarding it to other players, so after you intercept it, only the sender sees the action locally.

*Applies to: current LeviLamina version*

## In the new BDS, the functions I used to hook in classes like `ScriptActorEventListener` can't be found. Where should I look?

Every few versions, Mojang moves some functions from `Script****EventListener` into the corresponding `Script****GlobalEventListener`. For example, the functions of `ScriptActorEventListener` were moved to `ScriptActorGlobalEventListener`. When you can't find a function, look in the corresponding `Global` version (the directory is `mc/scripting/modules/minecraft/events/`).

*Applies to: BDS 26.40 and later (LeviLamina 26.x)*

## In the new BDS (compiled with clang), `PortalBlock::trySpawnPigZombie`, the function that spawns piglins from portals, has been inlined. How can a mod intercept or modify this logic?

`SpawnChecks::canSpawnPigZombieFromPortal` can still be hooked (`MCAPI`), but it doesn't receive the position; you can get the position by hooking `PortalShape::evaluate`. As the maintainers suggest, call `origin` first in the hook and then run your own implementation (don't `return` early), because the original implementation follows right after this function. Once a function is inlined, you generally need to hook two functions together to achieve the effect.

*Applies to: BDS 26.20+ (LeviLamina 26.x)*

## I can't find `LevelChunk::tick` in the headers of the new BDS. What should I use to hook the chunk tick?

This function has changed and is now called `LevelChunk::tickImpl(BlockSource& tickRegion, Tick const& tick, std::function<void()> spawnerCallback)`, with one more spawning-related callback parameter than before. Hook `tickImpl` instead and adjust the parameters to the new signature. If the function is inlined or renamed, you can also hook a function above it in the call chain.

*Applies to: BDS 1.21.6x and later (current LeviLamina 26.x headers)*

## When I submit a PR to LeviLamina that restores an inlined function (implemented as LLAPI), what should I do if the function exists only on the server, not on the client (or the symbols differ between the two)?

The client and the server do not have the same set of functions. Wrap a restored implementation that is only needed on the server in a platform macro, for example `#ifdef LL_PLAT_S ... #endif` (`LL_PLAT_C` for the client), so that it compiles only for the server platform. Put hand-written declarations outside the auto-generated blocks and mark them with `LLAPI`/`LLNDAPI`; put the definitions in the `.cpp` in the same directory. Once the restored function is confirmed correct, delete the corresponding `MCAPI` declaration. Push changes to the PR straight to the original branch; there is no need to close the PR and reopen it.

*Applies to: LeviLamina current version (dual-platform builds)*

## Can I cancel only the critical-hit check of an attack (leaving the rest of the logic unchanged), for example to replace the vanilla critical hit with a purely random crit rate?

The LSE attack event can only intercept the whole attack, not the critical hit alone (you can intercept the attack, handle the damage reduction yourself and deal damage with `hurt`). In C++ you can hook `Player::attack(Actor&, ActorDamageCause const&, Player::AttackParameters const&)` and set `mCanCrit` in `parameters` to `false` so that no critical hit happens, then implement your own crit rate (you can also use the interface that `iListenAttentively` exports to LSE).

*Applies to: LeviLamina current version*
