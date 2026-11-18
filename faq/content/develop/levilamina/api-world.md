# LeviLamina mod API: world, blocks and items

## How do I get a `BlockSource` in a LeviLamina C++ mod (replacing LL2's `block.getBlockSource()`), and get a block or block entity by dimension ID + `BlockPos`?

Each dimension has one `BlockSource`. When you already have a player or entity, take it from the `Actor`: `actor.getDimensionBlockSource()` (or `actor.getDimension().getBlockSourceFromMainChunkSource()`; `getDimension()` returns a reference, so call it with `.`). When you only have a dimension ID, get the dimension from `Level`: `Level::getDimension(dimId)` returns `WeakRef<Dimension>`, so you must `lock()` it first and check for null (it is empty when the dimension is not loaded):

```cpp
if (auto dim = ll::service::getLevel()->getDimension(dimId).lock()) {
    auto& bs = dim->getBlockSourceFromMainChunkSource();
    Block const& block = bs.getBlock(pos);
    BlockActor* be = bs.getBlockEntity(pos);
}
```

To avoid the null check, use `Level::getOrCreateDimension(dimId)` instead (it also returns a `WeakRef`, which needs `lock()`). After getting a `BlockActor`, check it for null, use `getType()` to determine its type, and downcast with `static_cast` rather than `reinterpret_cast`. Obtain objects through vanilla paths where possible and rely less on the global `ll::service` interfaces; copying legacy patterns from LSE is also not recommended.

*Applies to: LeviLamina 1.x and later (current v26.60.8)*

## A Bedrock lodestone compass item stores only a tracking ID (`trackingId`) and no coordinates. How do I get the lodestone position it points to in a C++ mod?

Unlike Java Edition, which writes the coordinates into the compass NBT, Bedrock stores a `PositionTrackingId`, and the coordinates are managed by the position tracking database `PositionTrackingDB`. On the server, get `PositionTrackingDB::PositionTrackingDBServer` through `level.getPositionTrackerDBServer()`, then query it with `findTracker(id, &record)`; in the resulting `PositionTrackingDB::TrackingRecord`, `mPosition` (`BlockPos`) and `mDimensionType` are the lodestone's position and dimension. The related headers are under `src/mc/world/level/position_trackingdb/` in LeviLamina. Note that `LodestoneCompassItem::getPositionTrackingId` is currently `MCNAPI` (unavailable), so you need to read the tracking ID from the item NBT yourself, or request an export in mcapi-requests.

*Applies to: LeviLamina current version (server side)*

## `Block::isSolid` is gone in new BDS versions (inlined). How do I check whether a block is solid in a C++ mod?

Read the block's cached component data directly: `block.mCachedComponentData->mIsSolid` (LegacyScriptEngine implements it the same way); or read `block.getBlockType().mSolid` on the block type. In current LeviLamina, `Block::_isSolid()` has been exported again as `MCAPI`, so you can also call it directly.

Because Mojang changes compiler options every version, some functions are always being inlined or restored. When you run into an inlined function, first search the LSE source for an existing implementation you can use as a reference.

*Applies to: LeviLamina 26.60.x*

## Since BDS 1.21.100 / LeviLamina 1.5 the `BlockLegacy` class can no longer be found. What was it renamed to?

Mojang renamed `BlockLegacy` to `BlockType`; use `BlockType` in your code (header `mc/world/level/block/BlockType.h`). Be careful not to confuse it with the enum `SharedTypes::v1_21_20::JigsawStructure::ProcessorRule::BlockType` (`mc/deps/shared_types/v1_21_20/structure/BlockType.h`).

*Applies to: LeviLamina 1.5 (BDS 1.21.100) and later*

## The `updateFlags` parameter of `BlockSource::setBlock` is now just an `int`. Where is the old `enum BlockUpdateFlags` fully defined?

The current LeviLamina BDS headers contain no `BlockUpdateFlag(s)` enum. The `updateFlags` of `setBlock` and similar functions is just an `int`, with no complete official definition. Community code commonly uses `3` (equivalent to the old `BlockUpdateFlag::All`: notify neighbors + sync to the network).

*Applies to: LeviLamina 26.x*

## In a C++ mod, to check whether an entity is a monster (including custom addon mobs), should I use `hasCategory` or `hasFamily`?

Use `Actor::hasFamily(HashedString const&)` to check the family: `"monster"` for monsters, `"animal"` for animals, `"inanimate"` for non-living entities. The family comes from `minecraft:type_family` in the entity definition, so an addon mob is recognized as long as its author put `monster` (or similar) in `type_family`; if not, this method cannot catch it. LSE plugins can use approaches such as LRCA.

## How do I check whether a chunk is loaded in a C++ mod?

Use `std::shared_ptr<LevelChunk> getAvailableChunk(ChunkPos const& cp)` on `ChunkSource` (implemented by LeviLamina as an LLAPI). A return value of `nullptr` means the chunk is not loaded or has not finished loading (its state has not reached `ChunkState::Loaded`). `ChunkSource` has no `getAvailableChunkAt`; to query by block position, convert first: `region.getChunkSource().getAvailableChunk(ChunkPos{blockPos})`. You can also check with `BlockSource::hasChunk(ChunkPos const&, bool serverSideOnly)` or `BlockSource::getChunkAt(BlockPos const&)` (returns `LevelChunk*`).

*Applies to: LeviLamina 26.60.x*

## How do I check whether a chest can be opened in C++ mod development? Which class has the function?

It is in the `ChestBlockActor` class (`mc/world/level/block/actor/ChestBlockActor.h`). The corresponding function in the current header is `virtual bool _canOpenThis(BlockSource& region) const;` (for example, it returns `false` when the top is blocked). When searching, look for the English function name in the headers, and be careful not to look in the wrong class.

*Applies to: LeviLamina 26.60.x*

## How do I get the source entity of an explosion from the `Explosion` class in a C++ mod? `mSourceID` is different for every explosion.

`Explosion::mSourceID` is the `ActorUniqueID` of the explosion's source entity, so different sources having different values is normal. It is a `ll::TypedStorage<8, 8, ActorUniqueID>`; read the value with `*explosion.mSourceID` or `.get()`, then pass it to `Level::fetchEntity` to get the entity: `Actor* src = level.fetchEntity(*explosion.mSourceID, false);` (the second parameter, `getRemoved`, says whether removed entities are returned too). A `nullptr` result means there is no source entity or it no longer exists.

*Applies to: LeviLamina 26.60.x*

## Are `Vec3` coordinates single or double precision in C++?

Single precision. In LeviLamina, `Vec3` inherits from `ll::math::floatN3<Vec3>` and its components are `float`. Bedrock Edition uses `float` for coordinates, so precision is lost at very large coordinates (such as millions of blocks away); Java Edition uses `double`.

## How do I get the world spawn in LeviLamina C++? Why is the Y value `32767`, or X/Z `-2147483648`?

There is only one world spawn, in the Overworld, and it does not belong to a `Dimension`; it is stored in `level.dat` (`LevelData`). In the current headers you can get it with `ll::service::getLevel()->getSharedSpawnPos()` (returns `BlockPos const&`; LSE also uses it to get the spawn point when creating a simulated player).

If `/setworldspawn` has never been used, Y is usually `32767`; while the world has not finished loading, X and Z may be `-2147483648` (`INT_MIN`). BDS itself finds safe ground automatically when it uses the spawn, so Y does not affect vanilla spawning; if you use the value yourself for teleporting or similar, you must find the ground height yourself. The spawnpoint in `DimensionConversionData` is for the End portal and is not the world spawn.

*Applies to: current version (server)*

## Can a LeviLamina C++ plugin get the block type at a coordinate in an unloaded chunk?

Not while the chunk is unloaded; you must load the chunk first. You can load it manually with `ChunkSource`'s `getOrLoadChunk(ChunkPos const&, ChunkSource::LoadMode, bool readOnly)`, but users report that if a manually loaded chunk has not generated its terrain yet, all the blocks you read are `air`. When you need data from generated terrain, use a ticking area (`tickingarea`), or have a player or simulated player go there to load the chunk and read it afterwards.

*Applies to: current version (server). Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I get all loaded entities in a LeviLamina C++ mod? What is the entity class called in the MC API, and what is its inheritance hierarchy?

You can follow LSE's implementation: `ll::service::getLevel()->getEntities()` returns `std::vector<OwnerPtr<EntityContext>> const&`; when iterating, first check `i.has_value() && i.tryUnwrap().has_value()`, then use `i.tryUnwrap().get()` to get an `Actor&`.

In BDS the base entity class is called `Actor` (there is no `Entity` class); `Mob` inherits `Actor` (living creatures), `Player` inherits `Mob`, and `ServerPlayer` inherits `Player`.

## When implementing chain mining in a LeviLamina mod, I break blocks manually with `Block::playerDestroy` + `setBlock` + `neighborChanged`, and attached blocks such as torches and vines on the logs do not drop properly. How should I implement it?

Call the player's `GameMode::destroyBlock(BlockPos const& pos, uchar face)` directly to break the block (for example `player.mGameMode->destroyBlock(pos, face)`). This is the function a player uses when mining a block, so the game itself handles attached-block drops, block updates, tool durability and so on; there is no need to call `playerDestroy` / `setBlock` / `neighborChanged` manually.

## `Block` has no callable `getRuntimeId` in the LeviLamina headers. How do I get a block's RuntimeId?

Read the `Block` member variable `mNetworkId` (`ll::TypedStorage<4,4,uint>`, the block's network runtime ID) directly, for example `block.mNetworkId`.

## How do I actively load chunks at a given position in a LeviLamina C++ mod (for example, to preload the target chunks before a random teleport)? What can JS plugins do?

In C++ you can create or use a `ChunkViewSource` and call `ChunkViewSource::move` to move the chunk source to the target range so it loads: expand 3 chunks outward from the chunk you want to load (that is, 7x7 chunks are actually loaded, so that the center chunk is fully loaded/generated), then wait for loading to finish. The process is similar to a player loading chunks.

Note that in the current headers only the overload `move(BlockPos const& blockMin, BlockPos const& blockMax, bool isCircle, ChunkSourceViewGenerateMode, std::function<void(gsl::span<std::shared_ptr<LevelChunk>>)> add, float const* serverBuildRatio)` is an available `MCAPI`; the other overloads are marked `MCNAPI` and cannot be called directly.

On the JS (LSE) side there is no direct API. You can temporarily add an always-loaded area with the `tickingarea` command, or use what the LSE export plugin of iListenAttentively (ila-lseexport) provides.

*Applies to: LeviLamina 1.x and later (currently v26.60.x)*

## In a LeviLamina C++ mod, I cannot get a chunk by chunk coordinates with `getChunk` / `getChunkAt` (the chunk may not be loaded). Which API should I use?

`BlockSource::getChunk` only returns loaded chunks and returns null if the chunk is not loaded. You can use `getOrLoadChunk(ChunkPos const& cp, ChunkSource::LoadMode lm, bool readOnly)` of `ChunkSource` (`LoadMode` has `None` and `Deferred`), which loads the chunk when needed; to only look up chunks that already exist, use `getExistingChunk`. `ChunkPos` can be constructed directly from coordinates. See `src/mc/world/level/chunk/ChunkSource.h` in the LeviLamina repository for the header.

Note that chunk loading may be asynchronous; when you need a fully loaded chunk, see the `ChunkViewSource` approach.

*Applies to: LeviLamina 1.x and later*

## How do I remove or customize an entity's invulnerability frames after being hurt in a LeviLamina C++ plugin?

The `Actor` class has a member `mInvulnerableTime` (`TypedStorage<int>`). Setting it to 0 after the entity is hurt removes the invulnerability frames (you can also set a custom value), for example `actor.mInvulnerableTime = 0;` (`TypedStorage` is accessed through `get()` or assignment). If you want maximum performance, you can patch out the game code that sets this value.

*Applies to: LeviLamina 1.x and later (the field may change with the BDS version)*

## How do I tell whether a block/item belongs to a class (such as door, shulker box, sign) in a LeviLamina mod? Can I compare vftables?

Do not use the vtable to decide: BDS has no RTTI, LeviLamina does not guarantee that vtable symbols are kept, and the vtable of a derived class you create with `new` is not BDS's. A vtable cannot be used to determine anything.

Use the block's own type/ID instead: see `VanillaBlockTypeIds` (`src/mc/world/level/block/VanillaBlockTypeIds.h`) and compare block type names, or look at the base class. For blocks with block entities (shulker box, sign), use `BlockType::getBlockEntityType()` to check the `BlockActorType`. To stay compatible with custom blocks, use `block.getTypeName()` to check the name (for example whether it ends with `_door`) or check components.

*Applies to: all LeviLamina versions*

## How do I get the BDS spawner in a LeviLamina mod, to count which mobs count toward the global spawn cap or to read spawn counts?

Get the `Spawner` through `ll::service::getLevel()->mMobSpawner` (or `Level::getSpawner()`), then `static_cast` it to `BedrockSpawner` to access its members. For the spawn-count logic, start by studying `ActorSpawnRuleGroup`. Note that the mob pool enum order obtained by reverse engineering may be wrong, so you need to correct `pool_name` yourself.

*Applies to: LeviLamina current version*

## In a LeviLamina mod, can I call `getOrLoadChunk` to load chunks during world generation (chunk terrain generation/decoration)?

No. Calling `ChunkSource::getOrLoadChunk` during world generation (for example inside functions such as `IFeature::place` and `BiomeDecorationSystem::decorateLargeFeature`) causes an infinite loop. Avoid loading chunks inside those hooks.

*Applies to: LeviLamina current version (vanilla BDS behavior). Not confirmed against the source code or the documentation: treat it as a pointer.*

## In a LeviLamina mod implementing linked double doors, using the door block I obtained as a `Block` (for example calling `getStates`) crashes. How do I correctly find the position of the other half of a double door?

`DoorBlock` extends `BlockType` (formerly `BlockLegacy`). It is a block type, not a block instance `Block`, so you cannot use it as a `Block`; doing so crashes.

Read block states through the block instance (`Block`): use the facing state of the lower half and the `door_hinge_bit` of the upper half to determine the position of the other half of the double door. You can also use `DoorBlock::getDir(region, pos)` and `DoorBlock::hasRightHinge(region, pos)` directly. This is better than iterating over the four directions.

*Applies to: LeviLamina current version*

## I can't find chunk-related APIs in the LeviLamina headers. Which classes should I use? Does LSE (LegacyScriptEngine) have chunk APIs?

On the C++ side, the chunk-related classes are mainly `ChunkSource` and `LevelChunk` (`mc/world/level/chunk/ChunkSource.h`, `LevelChunk.h`). LSE has no dedicated chunk API (only scattered interfaces such as `player.refreshChunks()`), so needs like making chunks load for a simulated player must be implemented with a native C++ mod.

*Applies to: LeviLamina current version; LegacyScriptEngine current version*

## In a mod, calling `getPosDelta()` on a minecart on a powered rail returns a vector of length 2.06 blocks/gt instead of the expected 0.4 or so. Why?

`getPosDelta()` is not the position difference between the current tick and the previous tick. It is the entity's current motion vector (`StateVectorComponent::mPosDelta`; adding to it makes the entity move), and limits such as the minecart's maximum speed may be hard-coded in the vanilla code. See <https://github.com/killcerr/MinecartSpeedPlus/blob/main/src/MinecartSpeedPlus.cpp> for an implementation.

*Applies to: LeviLamina 26.x. Not confirmed against the source code or the documentation: treat it as a pointer.*

## When a native mod calls the low-level API to turn an image into a map (map art), how can I avoid the `parentMapId` check?

Based on the experience of a map-art plugin developer: when generating a map through the low-level API, set the scale (`mScale`) of the map data (`MapItemSavedData`) to the maximum value, and the `parentMapId` (`mParentMapId`) is no longer checked.

*Applies to: LeviLamina native mod, depends on BDS internal map logic. Not confirmed against the source code or the documentation: treat it as a pointer.*

## I want to change a mob's health, but modifying the health in `Attributes` through `setNbt` makes the process exit immediately. Is there a more direct way?

You don't need to modify NBT; work with the attributes directly. The current approach: get the `BaseAttributeMap` through the entity's `AttributesComponent` or `Actor::getAttributes()`, then call `setMaxValue`/`setCurrentValue`. For example:

```cpp
actor.getAttributes()->setMaxValue(SharedAttributes::HEALTH(), value);
```

Or, following LSE:

```cpp
if (auto c = actor.getEntityContext().tryGetComponent<AttributesComponent>())
  c->mAttributes->setMaxValue(SharedAttributes::HEALTH(), value);
```

Use `setCurrentValue` to change the current health.

## Can I generate a void world (like a skyblock) with LeviLamina?

Use the multi-dimension API of MoreDimensions to create a void dimension: `CustomDimensionManager::addSimpleDimension(name, seed, GeneratorType::Void)` (the MoreDimensions tests include a `custom_dim:new_void_type` example). If you want a void overworld that keeps structures, implement structure generation yourself on top of a void dimension, or hook the terrain generation functions (vanilla has `VoidGenerator`). You can also look at an existing plugin: <https://github.com/ZGDD-BE/VoidWorldGenerator>

*Applies to: LeviLamina + MoreDimensions current version*
