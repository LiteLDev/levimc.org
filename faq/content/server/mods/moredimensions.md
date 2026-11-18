# MoreDimensions

## Can a custom dimension created by MoreDimensions be deleted or unloaded? How do I reset a dimension periodically to use it as a resource world? When is a dimension registered?

MoreDimensions provides no interface to delete or unload a dimension (the maintainers have stated explicitly that they will not provide an interface that deletes dimension data at the world level and leave that to world-editing tools), and LSE scripts cannot do it either. A dimension's registration is recorded in `dimension_config.json` in the world directory, and chunk and other data live in the world's LevelDB (`db`). Removing the registration from code or deleting only the config does not delete the data already generated, and keys deleted at runtime are written back when the world saves.

Dimension registration: `CustomDimensionManager::addDimension` / `addSimpleDimension` require the Level to exist (otherwise they throw `std::runtime_error`). The official test code registers in `ll::event::ServerStartedEvent`; do not register in the mod's load phase.

To reset a dimension you can only work offline: stop the server, back up the world, then delete that dimension's chunk data with a tool that supports Bedrock LevelDB. Note that Minecraft's LevelDB is a Mojang-modified version (with zlib compression support), so you cannot read or write it with the original Google leveldb; values are NBT. Chunk key format: 4-byte x (int32 LE) + 4-byte z + (for non-overworld dimensions) 4-byte dimension ID + 1-byte record type + optional 1-byte subchunk index. You can use third-party world tools such as Amulet (`amulet.load_level`) or write a native plugin yourself.

Also, the extra cost of multiple dimensions comes mainly from sending that dimension's data to players; the more dimensions, the more the server lags. A generator can be the vanilla overworld, nether, end, flat or void, or you can write your own C++ generator, but you cannot directly load custom biome dimensions defined by an addon.

*Applies to: MoreDimensions, all current versions*

## Does MoreDimensions export an interface that LSE (JS) scripts can call to register or create dimensions? Where is the documentation?

No. MoreDimensions only provides a C++ API (`more_dimensions::CustomDimensionManager`). It has no RemoteCall export, and LSE has no built-in interface for registering dimensions, so you need to write a C++ native mod that calls it. The documentation is at <https://github.com/LiteLDev/MoreDimensions/wiki>. Even if it were exported, you could only conveniently create dimensions with vanilla generator types (void, flat, overworld, nether, the end). If you cannot write C++, you can use a community helper mod built on it that is configured with JSON (such as `more-dimension-helper-json`).

*Applies to: MoreDimensions, all current versions*

## How do I use LeviLamina's multi-dimension support (MoreDimensions)? Can I create a new dimension with a command right after installing it? Is there a reference implementation or a ready-made dimension mod? How do I enter a new dimension, and how do portals work?

MoreDimensions (<https://github.com/LiteLDev/MoreDimensions>) is a library/dependency. It does not add any dimension by itself and has no command for creating one; other mods must call its API. Install it with `lip install github.com/LiteLDev/MoreDimensions` (the current version requires LeviLamina 26.60.7 or later and below 26.61.0, and has both server and client builds).

For developers: depend on `more-dimensions` in your native mod and, once the Level is available (for example in `ServerStartedEvent`), call:

```cpp
more_dimensions::CustomDimensionManager::getInstance()
    .addSimpleDimension("myns:my_flat", 345, GeneratorType::Flat);
```

The dimension name must be in `namespace:name` form and must not use the `minecraft` namespace. The vanilla generators supported are Overworld/Flat/Nether/TheEnd/Void; a custom generator must derive from `Dimension` and be registered with `addDimension<D>(name, args...)`. See the [wiki](https://github.com/LiteLDev/MoreDimensions/wiki) for documentation and `src/test/TestCustomDimension.cpp` in the repository for an example. Builds whose name ends in `-tests` in Actions create 7 test dimensions and are for testing only. Community reference implementations: [more-dimension-helper](https://github.com/ye111566/more-dimension-helper) and its JSON version (`more-dimension-helper-json` on MineBBS, which creates dimensions from a JSON configuration and does not support creating them at runtime).

To enter a dimension, use LeviLamina's built-in `tpdim` command, for example `tpdim ~ ~ ~ <dimension name>`. Vanilla-style portals cannot be implemented directly; you can register a portal-styled block with an addon and run a teleport command when the player triggers it.

*Applies to: MoreDimensions v0.14.0 and later (addSimpleDimension); current v0.16.0 / LeviLamina 26.60.x*

## Can LeviLamina host multiple worlds in one BDS (resource world plus survival world, lobby plus minigames, and so on)? What are the limitations?

BDS itself does not support multiple worlds. On LeviLamina you can approximate it by adding custom dimensions to the same world with MoreDimensions (`lip install github.com/LiteLDev/MoreDimensions`; it is only an API, so you need a mod that calls it, such as the community's `more-dimension-helper-json`). New dimensions can be generated as overworld, nether, end, flat or void. Limitations:

1. A dimension that has been created cannot be deleted.
2. All dimensions share the same world and the same set of behavior packs and resource packs, so you cannot load different texture packs for different dimensions.
3. All dimensions run in the same server process and main thread, so the more dimensions, the greater the load.

If you need to isolate resource packs or reduce load, running multiple BDS instances is the better choice (use different ports, including the IPv6 port), combined with cross-server teleport and data synchronization plugins.

*Applies to: MoreDimensions current version (v0.16.0)*

## After entering a MoreDimensions custom dimension, how do I teleport back to the overworld or between dimensions? Does `tpdim` still work?

LeviLamina has a built-in `teleportdim` command (alias `tpdim`) that teleports between any dimensions, including custom dimensions:

```text
tpdim <x y z> <dimension> [convert]
tpdim <target selector> <x y z> <dimension> [convert]
```

The first form teleports yourself; the second teleports the targets. The dimension can be `overworld`, `nether`, `the_end` or a custom dimension name; `convert` (default `true`) converts coordinates using the nether ratio. You can enable or disable the command and set its permission in the LeviLamina configuration `modules.command.tpdimCommand` (enabled by default, permission `GameDirectors`). To return to the overworld you can also use the vanilla command `execute in overworld run tp @s ~ ~ ~`.

*Applies to: LeviLamina current version (26.60.x)*

## When serializing dimension information in events or data, should I store the dimension ID or the dimension name? I need to account for MoreDimensions custom dimensions.

Store the dimension name. The ID of a custom dimension is not chosen by the developer; MoreDimensions or the game assigns it at registration (the current version prefers to reuse the name-to-ID mapping already persisted in the world, but it does not guarantee that the IDs stay the same across different worlds, after the registration order changes, or after configuration changes). So persist the name, and convert it when needed: `VanillaDimensions::fromString(name)` gives a DimensionType, and `VanillaDimensions::toString(dimId)` looks the name up from an ID (MoreDimensions' `getDimensionIdFromName` is deprecated). Vanilla dimension IDs are fixed: 0 is the overworld, 1 is the nether, 2 is the end.

*Applies to: MoreDimensions current version (v0.16.0)*

## When MoreDimensions creates a new dimension, can I only use the terrain generators built into Mojang's game? Are there preset templates?

MoreDimensions is only a library; it has no preset dimension templates or gameplay. The simple method `addSimpleDimension` supports only vanilla generator types (Overworld/Flat/Nether/TheEnd/Void). For custom terrain you must write your own C++ generator (derive from `Dimension` and register it with `addDimension<D>()`). See the examples under `src/test/generator` in the repository (`flat-gen-village`, a flat world that generates villages, and `generator-terrain`, custom terrain with `NxnBorderTerrain`), or the `DefaultGenerator` of the third-party land-claim plugin PlotCraft. Complex terrain such as custom biomes and mountains requires your own work on noise generation.

*Applies to: MoreDimensions current version (v0.16.0)*

## Can MoreDimensions (multi-dimension) create a flat dimension?

Yes. Flat is the easiest type to implement:

```cpp
CustomDimensionManager::getInstance().addSimpleDimension("myns:flat", 345, GeneratorType::Flat);
```

`custom_dim:new_flat_type` in the test build is a flat dimension. Note that the more dimensions you have, the greater the load on the server.

*Applies to: MoreDimensions v0.14.0 and later*

## Can a custom dimension created with MoreDimensions have a custom skybox, or can different dimensions have different times?

Not from the server side. The client renders the sky by dimension type and the server does not send sky textures, so changing the sky is only possible with a resource pack. Time is global (the `time` command has no dimension option). In theory you could forge the time packets sent to clients, but server logic such as mob spawning still follows the real time, so this is not practical.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## Using `/locate` in a custom dimension created by MoreDimensions freezes the server. How do I fix it?

A custom dimension has no matching structures, and BDS's `locate` implementation does not handle this case and falls into an infinite loop. Solutions: forbid `/locate` in non-vanilla dimensions (for example by intercepting the command), or implement structure lookup yourself.

*Applies to: LeviLamina 1.0.x (reported with BDS 1.21.50; later versions unconfirmed). Not confirmed against the source code or the documentation: treat it as a pointer.*

## I followed the SimpleExample tutorial in the MoreDimensions wiki to write a custom dimension mod, and the xmake build fails. What should I do?

The wiki's SimpleExample code uses `EventBus` but does not include its header, so add `#include "ll/api/event/EventBus.h"`. Also, since MoreDimensions 0.14.0 `SimpleCustomDimension` is no longer exported, so the wiki's `addDimension<more_dimensions::SimpleCustomDimension>("name", 345, GeneratorType::Flat)` should be changed to `more_dimensions::CustomDimensionManager::getInstance().addSimpleDimension("name", 345, GeneratorType::Flat);` (see `src/test/TestCustomDimension.cpp` in the repository). Documentation: <https://github.com/LiteLDev/MoreDimensions/wiki>

*Applies to: MoreDimensions current version (0.16.0) and the current state of the wiki SimpleExample*

## MoreDimensions has not been updated for the new version yet, so I am disabling the plugin until it is. Will buildings in the extra dimensions be lost? What should I watch out for?

Dimension data is saved in the world, so you can disable the plugin and install it again once it is updated. However, you must keep MoreDimensions' dimension configuration file in the world directory, `worlds/<world name>/dimension_config.json` (on the client, `dimension_config.json` in the corresponding world directory). It records the mapping between dimension names and IDs; if it is lost, the dimensions cannot be matched up when the plugin is enabled again.

*Applies to: All current versions (MoreDimensions 0.16.0)*
