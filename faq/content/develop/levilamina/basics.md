# Developing LeviLamina mods: general questions

## Difference Between Server Commands and Client Commands

- Server commands are commands registered by the server. They can be executed by the server itself as well as by other players connected to the same server.
- Client commands are handled entirely by the client itself. They can only be executed by the client that registered them; other players and the server are unaware of the existence of client commands.

When LeviLamina runs on **Bedrock Dedicated Server** (hereinafter referred to as BDS), mods can only register server commands.  
When Minecraft is in a **local world**, it is essentially running a BDS instance internally. In this case, mods can register both server commands and client commands.  
When Minecraft is in **multiplayer mode**, mods can only register client commands.  

You can obtain the server-side and client-side `CommandRegistrar` instances for command registration through:

```cpp
ll::command::CommandRegistrar::getInstance(false); // Server
ll::command::CommandRegistrar::getInstance(true);  // Client
```

## Commands Registered in the Mod's `enable()` Method Work on the Server (BDS) but Fail on the Client

This happens because the timing of enabling all mods differs between the server (BDS) and the client.

* The server enables all mods after server initialization is complete (when the world has already been loaded).
* The client enables all mods after the game startup process is complete (when the main menu window appears).

Therefore, on the client side, registering commands in the `enable()` method will not succeed, regardless of whether they are client commands or server commands.

The solution is to listen for `ServerCommandRegisterEvent` and register server commands there, and listen for `ClientCommandRegisterEvent` and register client commands there.

## ACCESS VIOLATION Exception When a Mod Calls MCAPI (e.g. `Player::disconnect()`)

Please check whether the code calling MCAPI is running on the `MC_SERVER` thread. Most server-side MCAPIs can only be called from the `MC_SERVER` thread. This is a limitation imposed by Minecraft's game design.

## Does LeviLamina have C++ API documentation like the Bukkit Javadoc? Do Minecraft's own classes have documentation?

Yes. The Doxygen C++ reference generated automatically from the headers is at <https://levimc.org/LeviLamina/api/>; the LeviLamina API reference with explanations and examples is at <https://levimc.org/LeviLamina/api_reference/>. Vanilla Minecraft classes (the headers under `mc/`) have no official documentation, so you have to read the headers yourself. The LSE script API documentation is hand-written and has a different form.

## Can a LeviLamina native mod register custom items, blocks and entities/mobs? Does LL have a ready-made interface?

Yes, but LeviLamina provides no high-level wrappers for registering items, blocks or mobs. It mainly exposes Minecraft's own functions, so you have to go through the registration flow yourself as vanilla does. You can construct and register an item manually, for example:

```cpp
SharedPtr<Item> item = SharedPtr<Item>::make("my_mod:managed_item", ++registry->mMaxItemID);
registry->registerItem(item);
```

(`ItemRegistry::registerItem` and the `Item(std::string const&, short)` constructor are both `MCAPI`; a user confirmed this works on 1.9.2.) For blocks, refer to `BlockDefinitionGroup::registerDataDrivenBlock`, which LL already implements. As long as registration is correct, the client is generally fine, and not providing a resource pack causes no error (the item just has no texture); to show a texture, pair it with a resource pack.

To add mobs or entities, use a vanilla addon (behavior pack + resource pack), which works with a server alone; only functionality that an addon cannot do requires reverse engineering the vanilla implementation yourself and building it with hooks or calls to Minecraft functions.

*Applies to: LeviLamina current version (26.60.x), server*

## Does the PDB that BDS officially ships contain struct information and RTTI?

No. A PDB normally contains the symbol table, structs, RTTI and more, but the PDB published for BDS has the structs and RTTI stripped and keeps only the symbol table, so struct layouts have to be obtained through reverse engineering. This is why the LeviLamina headers contain many `mUnkxxxx` (`::ll::UntypedStorage<alignment, size>`) members: the layout comes from reverse engineering and the member names are unknown.

*Applies to: Current BDS release. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What is OEOTYAN/BedrockServerClientInterface on GitHub for?

It is the bsci library, which lets a server draw geometry (lines, boxes, circles, spheres and so on) on the client, as a replacement for the old ParticleAPI. Usage:

1. In `xmake.lua`, add `add_repositories("OTOTYAN https://github.com/OEOTYAN/xmake-repo.git")` and `add_requires("bsci")`.
2. `#include <bsci/GeometryGroup.h>`.
3. Create a group with `bsci::GeometryGroup::createDefault()`, draw with `line`/`box`/`circle`/`sphere`, and remove with `remove`.

*Applies to: Current version (project still maintained)*

## What is the difference between LeviLamina native mods, LSE plugins and addons? What should I learn to start developing?

A native mod is written in C++ on top of LeviLamina and hooks BDS directly, with power close to a Fabric mod for Java Edition, which is why it is called a "mod". What is written in JS/Lua/Python through LegacyScriptEngine (LSE) is called a "plugin": it is easy to get started with, but its features are limited to the API that LSE provides. An addon (behavior pack/resource pack and the Script API) is Minecraft's official built-in extension method, and vanilla BDS can only use addons/SAPI. Poorly written C++ easily crashes the server, so beginners can start with JS on LSE.

## If I install a LeviLamina mod only on my own client, can I still use it when joining someone else's server?

It depends on how the mod is developed and which functions it uses: LeviLamina's MC headers are divided into server-only, client-only and shared parts. A mod that does not depend on server-only functions when playing online (a purely client-side mod) can be used when joining a server. For example, some replay-style client mods also hook server functions, but that code is never reached when joining a server, so they still work on servers. Note that a mod "installed only on the client" is not necessarily a purely client-side mod.

*Applies to: LeviLamina client edition (loaded through LeviLauncher)*

## Can a dll compiled from any compiled language (such as Kotlin/Native or Easy Language) be used directly as a LeviLamina plugin?

No. LeviLamina's API is C++ (with many templates), so other languages must interoperate through a C FFI and need a compatibility layer similar to LegacyScriptEngine to provide the API and events; LL's template code is hard to wrap in C, and at most the MC part can be wrapped. There is currently no convenient native solution for languages other than C++. To develop in a language other than C++, use LSE (JS/Lua/Python/NodeJS).

## Can I add custom enchantments (new enchantment effects) on BDS (LeviLamina)? Can a behavior pack or changing the enchantment id in NBT do it?

Enchantments are hard-coded; behavior packs cannot add them, and changing an enchantment id in NBT to a non-vanilla number is not recognized. It can only be done with a native (C++) mod, and registering a new enchantment on the server alone is not accepted by the client; you also have to handle sending and receiving packets yourself and implement the anvil and enchanting table GUIs yourself. The interface with an "allow non-vanilla" option in the third-party library GMLib only adds vanilla enchantments to items and allows exceeding the maximum enchantment level; it is not a custom enchantment.

*Applies to: All current versions (depends on the vanilla BDS implementation). Not confirmed against the source code or the documentation: treat it as a pointer.*

## In which language can I develop client mods used through LeviLauncher? Does the LeviLamina client have headers for client classes such as the camera?

Client mods are developed in C++ on top of LeviLamina (client). LeviLamina now includes many client-related classes, for example `src/mc/client/camera/`, `src-client/mc/client/game/ClientInstance.h` and `src-client/mc/client/gui/controls/renderers/HudCameraRenderer.h`; the commonly used client classes are largely covered.

*Applies to: LeviLamina client edition (versions after March 2026)*

## A Minecraft function I want to use in a LeviLamina mod is marked `MCNAPI` (not public/not exported) in the header, and compiling or linking reports a missing symbol or deprecated. What should I do?

For security requirements from Mojang, LeviLamina uses a symbol whitelist and only exposes symbols that existing mods use (since 26.60 it is narrower still: entries must be exact per symbol, and whole classes are no longer whitelisted; member variables have not been removed). Functions marked `MCNAPI` in the headers show the message "`This API is not available. Open an issue if you need it.`". To resolve it, open an issue at <https://github.com/LiteLDev/mcapi-requests>, paste in the list of functions (symbols) missing at the compile/link stage, and attach your mod repository or a download link to show you are really writing an LL mod (this mainly screens out people writing cheats); legitimate uses are approved. Keep the request short and do not use AI to generate long text. Until a new version exports them, you can only locate them yourself with signature scanning, pointer offsets, hard-coded RVAs and the like; virtual functions can be obtained from the vtable. Also note that `BlockSource` must not be copied; use a reference, for example `auto& region = ...getDimensionBlockSource();`.

*Applies to: LeviLamina 1.4 and later, especially 26.60.x*

## Before a new LeviLamina version (adapted to a new BDS) is officially released, how can C++ mod developers adapt early?

In the mod project's `xmake.lua`, write the `levilamina` dependency version as the latest full 40-character commit hash of LeviLamina's main branch (`main`); a short hash is treated by xmake as a branch name and the fetch fails. For example `add_requires("levilamina <40-char-commit-hash>", {configs = {target_type = get_config("target_type")}})`. You can also write the branch name directly, `levilamina main`, and start adapting against the in-development headers. xmake then prints `Unknown version` and uses the dependency configuration of the `main` branch; this is normal, and dependencies such as `bdslibrary` may need to be handled yourself. Note that `levilamina develop` in the template comments no longer works (the LeviLamina repository now has no `develop` branch). If symbols are missing at compile/link time before the official release, you can report them to the maintainers.

## After upgrading BDS/LeviLamina, a C++ native mod that used to work reports memory access errors. What should I do?

C++ native mods are tightly bound to the BDS and LeviLamina versions, so using a different version without adapting the mod can cause memory access errors or crashes. The mod must be recompiled with the LeviLamina SDK for the matching version before it can be used; you can wait for the author to release an adapted version, or recompile the source against the new version yourself.

## Are LeviLamina client (LLC) mods compatible across game versions? What is the advantage over writing hooks myself?

Mojang changes code in every version, so unless none of the classes a mod uses were changed, the mod generally needs to be adapted/recompiled for the new version (a well-written mod is cheap to migrate). LL's advantage is that it provides the addresses for a large number of symbols, complete headers with class members (the MC headers under `src/mc`), and various wrapper tools (hooks, events, configuration and so on), saving you from reverse engineering all of that yourself.

## Can LeviLamina C++ (DLL) native plugins be used across BDS versions? Why do native plugins almost always need an update whenever BDS updates?

LeviLamina native mods call or hook BDS internal functions directly, and function addresses, signatures and struct layouts often change when the BDS version changes, so a mod usually has to be recompiled for the new version. A DLL can keep working across versions only if the BDS functions it calls did not change in the new version. Plugins that depend on no Minecraft content can stay usable for much longer, and plugins that depend on a library providing a stable interface (such as GMLib) are better across versions. For small features, writing a script (such as JS with LegacyScriptEngine) is recommended: it is more convenient across versions and generally keeps working even if the author stops updating.

## The UI of a PC Bedrock client mod does not show on some users' computers. What is the cause?

PC Bedrock does not always use DX12; some devices run on DX11. If a mod's UI overlay (such as ImGui) is implemented only for DX12, DX11 users see no mod UI. The mod needs to support both DX11 and DX12.

*Applies to: PC Bedrock client mods. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can a native mod compiled for a newer LeviLamina run on an older LeviLamina?

Native plugins are generally adapted without regard to older versions. As long as the mod uses no `MCAPI` that only the newer LL exposes and no API that exists only in the newer Minecraft, it may be compatible with the older version; otherwise it must be recompiled for the older version. Updating the server/client to the latest LeviLamina is recommended.

## Debug logs written with `getLogger().debug(...)` in a LeviLamina mod are not shown. How do I change the log level? What levels are there?

The Logger's default level comes from the PreLoader configuration: raise `logLevel` in `PreLoaderConfig.json`. LeviLamina's Logger default level = `logLevel` - 1 (clamped to 0~5), so setting `logLevel` to 5 corresponds to Debug and 6 to Trace. You can also call `setLevel` on an individual Logger in code, for example `getSelf().getLogger().setLevel(ll::io::LogLevel::Debug)`. The level enum (`ll/api/io/LogLevel.h`):

```cpp
enum class LogLevel : int { Off = -1, Fatal, Error, Warn, Info, Debug, Trace };
```

*Applies to: LeviLamina 1.x and later (currently v26.60.8)*

## How can a native C++ mod author integrate Sentry, as LeviLamina does, so that crashes of their own mod are reported to their own account?

Register your own Sentry account, create a project, and put the DSN into the `extraInfo` of the mod's `manifest.json`:

```json
"extraInfo": {
  "sentryDsn": "https://<key>@<host>/<projectId>",
  "sentryUploadType": "all"
}
```

When a crash occurs, LeviLamina's CrashLogger reports the information of the suspected mod to its `sentryDsn`; when `sentryUploadType` is `"all"`, the crash is reported even if the mod is not the suspect. To get readable stack traces, upload debug symbols with `sentry-cli` in your GitHub Actions release workflow (see the `upload-to-sentry` job in LeviLamina's `.github/workflows/release.yml`: `sentry-cli debug-files upload --include-sources`). Also remember to give your mod a version number (a git tag) so you can tell which version a user runs. JS plugins generally need no configuration.

*Applies to: LeviLamina 1.0.0 and later*

## After a mod that uses LeviLamina's `ll::config::loadConfig` is updated with new config options, the old config file fails to load or part of it is reset. What is the mechanism?

`ll::config::loadConfig` uses the `version` field of the config struct to decide whether an update is needed. If the file has no `version` or it differs from the one in the code, it calls the updater (by default `defaultConfigUpdater`, which takes the current defaults as the base and applies the existing file contents on top with `merge_patch`), deserializes the completed result, and returns `false`, signalling the caller to write it back with `saveConfig` (the template and LL itself both call `saveConfig` when `loadConfig` returns `false`). If a developer adds a new field without changing `version`, the config is treated as needing no update and is deserialized directly; missing fields or mismatched types make deserialization throw. The caller usually catches this and rewrites the config with defaults, so part of the config is lost or reset.

For users: change `version` in the config file to a different number to trigger the automatic merge update (your existing settings are kept), or delete the config file to have it regenerated.

For developers: always increment `version` when you add or change config options.

*Applies to: LeviLamina 1.x and later (still applies to the current version)*

## After getting a `PlayerInfoEntry` by uuid, the name field is empty. Does PlayerInfo need `alwaysLaunch` enabled to record player names and uuids?

Yes. The PlayerInfo service is initialized only when it is first used. Enable `targeted.playerInfo.alwaysLaunch` (default `false`) in the LeviLamina config so that PlayerInfo is initialized at server startup and keeps recording the mapping between player names and uuid/xuid.

*Applies to: LeviLamina server, current version*

## When using LeviLamina's config read/write API (based on struct reflection), how do I define multi-level nested JSON? What if a JSON key contains a colon (such as `minecraft:stone`)?

LL has built-in `ll::config::loadConfig` / `saveConfig` (header `ll/api/Config.h`) that map JSON automatically through struct reflection. The struct must have an integer member `version` (when versions differ, the updater is called and the file is rewritten). Do not hard-code the config path; use the mod's own config directory (for example `getSelf().getConfigDir()`). For nested objects, nest structs directly. When keys are not fixed or contain colons, use `std::unordered_map<std::string, T>` / `std::map`, for example:

```cpp
struct Item {
    std::string dropitem;
    int count;
};
struct Config {
    int version = 1;
    bool instant_destruction = false;
    std::unordered_map<std::string, std::unordered_map<std::string, Item>> destroy;
};
```

Reflection also supports enums. Write default values in the member initializers (the type must be an aggregate, so do not use constructors).

*Applies to: LeviLamina 0.13 and later, up to the current version*

## After adding Sentry crash reporting to my LeviLamina mod, why do I receive a large number of reports whenever any server with my mod installed crashes, even when the crash is unrelated to my mod? How do I configure this?

Once `sentryDsn` is set in the `extraInfo` of the mod's `manifest.json`, LL's crash logger reports crashes. The scope is controlled by `sentryUploadType` in `extraInfo`: when set to `"all"`, any crash on a server that has your mod installed is reported. If it is omitted or set to anything other than `"all"`, a crash is reported only when your mod is judged a suspect module (the crash stack involves the mod). Server owners can also turn reporting off with the LL config option `modules.crashLogger.uploadToSentry`.

*Applies to: LeviLamina, current version*

## What is the best-performing way to iterate over a large range of blocks in a C++ mod (for example to clear wrong or unknown blocks)?

Do not call `getBlock`/`setBlock` of `BlockSource` one block at a time. Get the chunk first and work per chunk with `LevelChunk::getBlock(ChunkBlockPos)` / `LevelChunk::setBlock`, which skips the chunk lookup on every call. The data hierarchy is `BlockSource -> LevelChunk -> SubChunk -> Block`; getting all SubChunks directly (`LevelChunk::mSubChunks`) and reading the actual storage is fastest. If you get serialized data, take the index from the block palette and then look up the block indices. Calling `setBlock` directly from multiple threads crashes, so do modifications on the server main thread.

*Applies to: LeviLamina server, current version*

## On LeviLamina 1.21.70, calling BDS functions at high frequency from a mod (such as `getBlock`/`setBlock` of `LevelChunk`) is more than ten times slower. What is the cause and how can I speed it up?

One user's analysis: the addresses of MC API (`MCAPI`) functions called directly from a mod are resolved by PreLoader, and PreLoader wraps the functions for protection, which makes high-frequency calls slow. Options: use the virtual functions `getBlock`/`setBlock` of `BlockSource` (called through the vtable, measured faster than going through the wrapped `LevelChunk` functions), or use a signature scan to get the real address of the function directly. Note that when going through `BlockSource`, every kind of lookup failure returns an air block by default.

*Applies to: At the time LeviLamina 1.2.0 / BDS 1.21.70; unknown whether newer versions are still affected. Not confirmed against the source code or the documentation: treat it as a pointer.*

## In LeviLamina mod development, which has lower overhead, listening to events or hooking directly? Why can a plugin with many hooks freeze or crash on hot unload?

Prefer events. A hook has overhead of its own: even if the hook function does nothing, there are a few extra jumps. Also, when a hook is installed or removed while the game is running, other threads are paused for safety (`GlobalThreadPauser`, which prevents the CPU from executing memory that is being modified) and resumed afterwards, so frequent hooking and unhooking has a cost, and a deadlock during the pause can freeze the server. Subscribing to and unsubscribing from an event only inserts into or erases from a hash-table container in the `EventBus`. A common cause of crashes on unload is registering callbacks (listeners, scheduled tasks and so on) without cancelling them on unload, so that the dll is already unloaded when a callback is invoked.

*Applies to: LeviLamina 1.x and later*

## When developing a land-claim plugin, how do I efficiently determine which claim a block coordinate belongs to (without iterating over all claims and comparing xyz ranges every time)?

Load all claim data into memory and build a spatial index. For example, build a map dimension -> chunk -> list of claim IDs, that is `Map<dimid, Map<chunk, Vector<Id>>>`; one chunk can map to several claims. For a large claim that spans many chunks, compute all the chunks it covers and insert it into the list of each of those chunks. When querying, first compute the chunk from the coordinate, then compare only against the claims under that chunk, and fetch the claim data from the cache by ID. You can also use an AABB tree (such as <https://github.com/lohedges/aabbcc>) to speed up containment checks.

*Applies to: General design approach, independent of version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Is there a tool for profiling the memory of a LeviLamina mod (to track down memory leaks)?

Use the Visual Studio diagnostic tools: attach to the `bedrock_server_mod.exe` process, take memory snapshots (Memory Snapshot) and compare them to locate the memory leak.

*Applies to: LeviLamina server (Windows). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Is there documentation or a getting-started tutorial for LeviLamina C++ mod development? How does a beginner write a first mod, and how do I find the APIs and headers I need?

Yes. The getting-started tutorial "Your first LeviLamina mod" is at <https://levimc.org/tutorials/develop/first-levilamina-mod/> (older addresses such as `levilamina.liteldev.com/.../create_your_first_plugin` and `lamina.levimc.org/zh/developer_guides/tutorials/create_your_first_mod/` have all moved). The LeviLamina documentation site is at <https://levimc.org/LeviLamina/>. It has how-to guides for commands, events, hooks, forms, items, i18n, coroutines and more (`developer_guides/how_to_guides`), and an API reference (`api_reference`, including config and so on). The Doxygen C++ reference generated from the headers is at <https://levimc.org/LeviLamina/api/>.

Vanilla Minecraft classes have no documentation. Read the headers (`mc/...`), the test code in the LeviLamina repository (`src-test/`, such as `src-test/server/testCommand.cpp` and `EventTest.cpp`), and other open-source mods (such as LeviOptimize and LegacyMoney). Listen to events through `ll::event::EventBus`; to cancel a cancellable event, call `event.cancel()` in the callback. The API documentation of script plugins (LSE) is a separate set; see the LSE documentation site.

A beginner can include all headers at once with an "all-in-one header", but this slows compilation significantly, makes clangd lag, and can even run out of memory in large projects, so it is not recommended.

*Applies to: All current versions (LeviLamina 1.x and later; the documentation address is whatever levimc.org says)*

## Where do I request that LeviLamina export a new MC API, symbol, class member or hook for my mod? Can I request an RVA?

Open an issue in LiteLDev's mcapi-requests repository (<https://github.com/LiteLDev/mcapi-requests/issues>); the main LeviLamina repository no longer accepts such issues. You can choose either server or client; the maintainers sort them out. Explain clearly what the mod is for.

There is no need to request an RVA: for a known symbol name you can get the address directly through LL's symbol resolution, for example `"symbol name"_sym.resolve()` (requires `using namespace ll::literals;`; there is also `"symbol name"_symp`, which returns the cached address directly). If resolution fails (returns `nullptr`), the symbol is currently unavailable and you still need to submit a request.

*Applies to: LeviLamina 1.5 and later (currently 26.60.x)*

## Do I have to click through the LeviLamina API documentation on the website one page at a time? Is there an easier way to search it?

On the C++ Reference of the website (generated from the headers by Doxygen), press `Ctrl+K` or `/` to search classes, functions and files by name. A more efficient way is to clone the LeviLamina repository and search the headers globally in a local editor such as VS Code (`src/ll/api` is LL's own API, `src/mc` holds the public BDS headers, and `src-server` / `src-client` hold the server-only and client-only headers).

## The LeviLamina API documentation lacks client-related content (such as `ClientInstance`), and finding headers is hard. What can I do?

Client-related headers are in the `src-client` directory of the LeviLamina repository; for example, `ClientInstance` is at `src-client/mc/client/game/ClientInstance.h`. Clone the repository and search in `src-client`. In addition, the Doxygen input of the current website C++ Reference already includes `src-client/ll/api` and `src-client/mc`, so you can also search for client classes in the documentation directly.

*Applies to: LeviLamina current version (including versions with client support)*

## Can I use a release version format such as `v[mod version]-mc[MC version]` (for example `v0.3.1-mc26.51`) to mark the MC version a mod supports?

This is not recommended. Under SemVer 2.0.0, a version with a "-" is read as a pre-release (testing) version, and tools such as lip also parse versions as SemVer (pre-release versions are treated differently in version selection and self-update). To attach MC version information, use build metadata (a "+" suffix, for example `1.0.0+mc26.51`).

*Applies to: All current versions (lip uses lip.toml, and versions must be SemVer 2.0.0)*

## A packet structure definition in the LeviLamina headers looks wrong. How do I report it?

Open an issue in the LeviLamina GitHub repository (LiteLDev/LeviLamina), preferably with how to fix it (the correct structure, offsets and so on). You can also submit a PR with the fix directly (hand-written content must go outside the auto-generated blocks).

## In IDA a BDS function accesses a member offset such as `a1+416`. How do I find which member in the LeviLamina headers it corresponds to (for example a member starting with `mUnk`)?

Open the header of the class in the LeviLamina repository under `src/mc` (or `mc/` under `src-server`/`src-client`) and look at the `// member variables` block. In the current headers, members are declared as `::ll::TypedStorage<alignment, size, type> mXxx;` or `::ll::UntypedStorage<alignment, size> mUnkxxxxxx;`. The headers contain no offset comments, so you have to calculate the offsets by starting from the size of the base class and adding up each member's size and alignment in order, then compare the result with the offset in IDA (for example 416 = 0x1A0) to find the matching member. You can also verify it in your own code with `offsetof` or `static_assert`.

*Applies to: LeviLamina current version (v26.x, members use the TypedStorage/UntypedStorage layout)*

## What does the new template for requesting MCAPI/symbol exports (mcapi request) require? Can template classes be requested? How many items can one issue request?

Requests now go to the separate repository LiteLDev/mcapi-requests, where you open an issue with the Request template (with a title such as `Request symbols for <your-mod-name>`). The fields are:

- Mod: the public GitHub repository URL of the mod. Use the current URL, and the mod name from the issue title must appear in its `README.md`.
- Platform: Server for Windows / Client for Windows / Client for Android.
- Justification: what the mod does and why it needs this, at most 200 tokens. Keep it short and do not use AI to write a long explanation.
- Classes: classes that need member variables, one per line.
- Symbols: unresolved symbols from the linker errors, one per line.

Members (Classes) and functions (Symbols) go in the same template. Each issue can hold at most 64 lines of Classes and Symbols combined; the number of issues is not limited, so open as many as you need. Template classes with `< >` cannot be generated automatically; open a separate request for them so that someone handles them manually.

*Applies to: The current (2026-11) LiteLDev/mcapi-requests process*

## Which WebSocket library works well for LeviLamina C++ mod development?

LeviLamina itself provides no WebSocket API, so you need a third-party library. Common choices are websocketpp (<https://github.com/zaphoyd/websocketpp>, based on C++11/asio) and uWebSockets (<https://github.com/uNetworking/uWebSockets>); you can also build one on top of a TCP library yourself. These libraries can usually be pulled in with xmake's `add_requires`.

*Applies to: All current versions (third-party library, independent of the LL version). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Where can I find the Bedrock network protocol documentation when I need to send or capture packets for a LeviLamina mod?

Mojang's official protocol documentation repository is at <https://github.com/Mojang/bedrock-protocol-docs> (still updated). The Bedrock protocol pages of the former wiki.vg have been merged into the Minecraft Wiki (the Bedrock Edition protocol pages on minecraft.wiki). LeviLamina provides the headers of the individual packets under `src/mc/network/packet/` (such as `CameraPacket.h` and `CameraInstructionPacket.h`), which you can construct and use directly.

*Applies to: LeviLamina current version*

## What conventions apply when I submit a PR to the LeviLamina headers (`src/mc`), for example to add a default constructor or a hand-written function to a class?

Most headers in `src/mc` are generated by a tool, and the generator merges with the existing content, so hand-written content is not lost on regeneration as long as it follows the conventions:

1. Do not put hand-written code inside the generated regions (`// auto generated inclusion list`, `// auto generated forward declare list`, between `// NOLINTBEGIN` and `// NOLINTEND`, `MCAPI`/`MCFOLD`/`MCTAPI`/`MCNAPI` declarations, the `::ll::TypedStorage<...>` member layout), and do not add to or reorder the generated lists; otherwise later merges break.
2. Put hand-written declarations in a separate `public:` block (above `// member variables`) and export them with `LLNDAPI`/`LLAPI`.
3. Write the implementation in a `.cpp` in the same directory; do not inline it in the header.
4. For a default constructor, you can change the declaration in the `// prevent constructor by default` block to `= default` or `= delete`; this is preserved on regeneration.

*Applies to: LeviLamina current version*

## Can I write a LeviLamina mod that detects a frozen BDS (hang), then kills the process and restarts it automatically?

Relying only on a mod inside BDS is not recommended: LL mods share the main thread with BDS, so when the main thread hangs, the mod logic that depends on the tick stops as well. The reliable approach is an external watchdog: send a heartbeat periodically from the game tick (for example through a pipe), and let an external process (or a separate guard thread) decide the server is hung when it receives no heartbeat for a long time. Restarting the server and generating a dmp are also easier from an external program. Some server panels have this feature built in.

*Applies to: All current versions (general design advice). Not confirmed against the source code or the documentation: treat it as a pointer.*

## When reverse engineering Bedrock and restoring functions that the compiler inlined, is there a publicly available binary with symbols for reference?

You can use the macOS build of Minecraft Education. Its binary contains a large number of symbols (dual architecture, x86_64 and arm64, with over 1.1 million symbols in total) and shares one codebase with Bedrock, so it is very valuable for reverse engineering. Download from <https://aka.ms/meeclientmacos> or <https://education.minecraft.net/zh-hans/get-started/download> (in 2026-09 the stable version was 1.26.32 and the beta was 1.26.30; versions keep being updated). You can match functions against the Windows build with tools such as bindiff; using the x86_64 part avoids the poor results of cross-architecture matching.

*Applies to: Minecraft Education macOS builds as of 2026-09; check yourself whether later versions still ship symbols. Not confirmed against the source code or the documentation: treat it as a pointer.*
