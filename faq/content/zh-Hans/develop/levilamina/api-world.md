# LeviLamina 模组 API：世界、方块与物品

## LeviLamina C++ mod 中如何获取 `BlockSource`（替代 LL2 的 `block.getBlockSource()`），并按维度 ID + `BlockPos` 获取方块/方块实体？

每个维度对应一个 `BlockSource`。已有玩家/实体时直接从 `Actor` 取：`actor.getDimensionBlockSource()`（或 `actor.getDimension().getBlockSourceFromMainChunkSource()`，`getDimension()` 返回引用，用 `.` 调用）。只有维度 ID 时从 `Level` 取维度：`Level::getDimension(dimId)` 返回 `WeakRef<Dimension>`，需要先 `lock()` 并判空（维度未加载时为空）：

```cpp
if (auto dim = ll::service::getLevel()->getDimension(dimId).lock()) {
    auto& bs = dim->getBlockSourceFromMainChunkSource();
    Block const& block = bs.getBlock(pos);
    BlockActor* be = bs.getBlockEntity(pos);
}
```

不想判空可改用 `Level::getOrCreateDimension(dimId)`（同样返回 `WeakRef`，需要 `lock()`）。获取 `BlockActor` 后先判空，用 `getType()` 判断类型，向下转型用 `static_cast` 而不是 `reinterpret_cast`。尽量走原版途径获取对象，少依赖 `ll::service` 的全局接口；也不建议照抄 LSE 中的历史遗留写法。

*适用版本：LeviLamina 1.x 及以上（当前 v26.60.8）*

## 基岩版磁石指针（lodestone compass）物品中只存了追踪 ID（`trackingId`），没有坐标，C++ mod 中如何获取它指向的磁石坐标？

基岩版不像 Java 版把坐标写进指针 NBT，而是存一个 `PositionTrackingId`，坐标由位置追踪数据库 `PositionTrackingDB` 管理。服务端可通过 `level.getPositionTrackerDBServer()` 拿到 `PositionTrackingDB::PositionTrackingDBServer`，再调用 `findTracker(id, &record)` 查询，得到的 `PositionTrackingDB::TrackingRecord` 中 `mPosition`（`BlockPos`）和 `mDimensionType` 即为磁石坐标与维度。相关头文件在 LeviLamina 的 `src/mc/world/level/position_trackingdb/` 下。注意 `LodestoneCompassItem::getPositionTrackingId` 当前为 `MCNAPI`（不可用），需要自行从物品 NBT 读取追踪 ID，或到 mcapi-requests 申请导出。

*适用版本：LeviLamina 当前版本（服务端）*

## 新版 BDS 中 `Block::isSolid` 没了（被内联），C++ mod 里该怎么判断方块是否为实心（solid）？

可以直接读取方块缓存的组件数据：`block.mCachedComponentData->mIsSolid`（LegacyScriptEngine 也是这样实现的）；也可以读取方块类型上的 `block.getBlockType().mSolid`。当前 LeviLamina 中 `Block::_isSolid()` 已重新导出为 `MCAPI`，也可直接调用。

由于 Mojang 每个版本改编译选项，总会有函数被内联或恢复；遇到被内联的函数，可以先去 LSE 源码里搜一下是否已有实现可参考。

*适用版本：LeviLamina 26.60.x*

## BDS 1.21.100 / LeviLamina 1.5 起 `BlockLegacy` 类找不到了，改成什么了？

Mojang 将 `BlockLegacy` 改名为 `BlockType`，代码中改用 `BlockType`（头文件 `mc/world/level/block/BlockType.h`）即可。注意不要与枚举 `SharedTypes::v1_21_20::JigsawStructure::ProcessorRule::BlockType`（`mc/deps/shared_types/v1_21_20/structure/BlockType.h`）混淆。

*适用版本：LeviLamina 1.5（BDS 1.21.100）及以上*

## `BlockSource::setBlock` 的 `updateFlags` 参数现在只是 `int`，以前的 `enum BlockUpdateFlags` 完整定义在哪？

当前 LeviLamina 的 BDS 头文件中没有 `BlockUpdateFlag(s)` 枚举，`setBlock` 等函数的 `updateFlags` 只是 `int`，没有官方完整定义。社区代码中常用 `3`（相当于旧的 `BlockUpdateFlag::All`，即通知邻居 + 同步网络）。

*适用版本：LeviLamina 26.x*

## C++ mod 中判断一个实体是否为怪物（希望对 addon 自定义生物也生效），应该用 `hasCategory` 还是 `hasFamily`？

推荐用 `Actor::hasFamily(HashedString const&)` 判断 family：怪物为 `"monster"`，动物为 `"animal"`，非生物为 `"inanimate"`。family 来自实体定义中的 `minecraft:type_family`，因此 addon 生物只要作者在 `type_family` 中加了 `monster` 等就能被识别；若没加则无法通过此方式拦截。LSE 插件可借助 LRCA 等方式判断。

## C++ mod 中如何判断某个区块是否已加载？

使用 `ChunkSource` 上的 `std::shared_ptr<LevelChunk> getAvailableChunk(ChunkPos const& cp)`（LeviLamina 以 LLAPI 实现），返回 `nullptr` 即表示该区块未加载或尚未加载完成（状态未到 `ChunkState::Loaded`）。`ChunkSource` 没有 `getAvailableChunkAt`，按方块坐标查询时先转换：`region.getChunkSource().getAvailableChunk(ChunkPos{blockPos})`。也可以用 `BlockSource::hasChunk(ChunkPos const&, bool serverSideOnly)` 或 `BlockSource::getChunkAt(BlockPos const&)`（返回 `LevelChunk*`）判断。

*适用版本：LeviLamina 26.60.x*

## C++ mod 开发中如何判断一个箱子能否被打开？在哪个类里找对应函数？

在 `ChestBlockActor` 类（`mc/world/level/block/actor/ChestBlockActor.h`）中。当前头文件里对应的函数是 `virtual bool _canOpenThis(BlockSource& region) const;`（例如顶部有遮挡时返回 `false`）。查找时在头文件中搜索英文函数名，注意不要找错类。

*适用版本：LeviLamina 26.60.x*

## C++ mod 里怎么从 `Explosion` 类拿到爆炸源实体？`mSourceID` 每次爆炸都不一样。

`Explosion::mSourceID` 就是爆炸源实体的 `ActorUniqueID`，不同爆炸源对应不同的值是正常的。它是 `ll::TypedStorage<8, 8, ActorUniqueID>`，取值用 `*explosion.mSourceID` 或 `.get()`，再交给 `Level::fetchEntity` 取实体：`Actor* src = level.fetchEntity(*explosion.mSourceID, false);`（第二个参数 `getRemoved` 表示是否也返回已移除的实体）。返回 `nullptr` 说明没有源实体或该实体已不存在。

*适用版本：LeviLamina 26.60.x*

## C++ 中 `Vec3` 坐标是单精度还是双精度？

单精度。LeviLamina 中的 `Vec3` 继承自 `ll::math::floatN3<Vec3>`，分量是 `float`。基岩版坐标用 `float`，所以坐标很远（如百万格外）时会丢失精度；Java 版用的是 `double`。

## LeviLamina C++ 中如何获取世界重生点（world spawn）？获取到的 Y 值为 `32767` 或 X/Z 为 `-2147483648` 是怎么回事？

世界重生点只有一个且在主世界，不属于 `Dimension`；它保存在 `level.dat`（`LevelData`）中。当前版本的头文件里可以通过 `ll::service::getLevel()->getSharedSpawnPos()` 获取（返回 `BlockPos const&`，LSE 创建模拟玩家时也是用它取出生点）。

如果没用过 `/setworldspawn`，Y 通常是 `32767`；存档尚未完成加载时 X、Z 可能是 `-2147483648`（`INT_MIN`）。BDS 自己使用时会自动寻找安全地面，所以 Y 不影响原版出生；自己拿来传送等用途时需要自行寻找地面高度。`DimensionConversionData` 里的 spawnpoint 是给末地传送门用的，不是世界出生点。

*适用版本：当前版本（服务端）*

## LeviLamina C++ 插件能否获取未加载区块中某坐标的方块类型？

区块未加载时拿不到，需要先把区块加载。可以用 `ChunkSource` 的 `getOrLoadChunk(ChunkPos const&, ChunkSource::LoadMode, bool readOnly)` 手动加载，但有用户实测，手动加载的区块若尚未生成地形，取到的方块全是 `air`；需要地形已生成的数据时，可用常加载区（`tickingarea`）或让玩家/假人过去加载区块后再读取。

*适用版本：当前版本（服务端）。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina C++ 模组中如何获取所有已加载实体？MC API 里实体类叫什么，继承关系是怎样的？

可以参考 LSE 的实现：`ll::service::getLevel()->getEntities()` 返回 `std::vector<OwnerPtr<EntityContext>> const&`，遍历时先判断 `i.has_value() && i.tryUnwrap().has_value()`，再用 `i.tryUnwrap().get()` 拿到 `Actor&`。

BDS 中实体基类叫 `Actor`（没有 `Entity` 类），`Mob` 继承 `Actor`（生物），`Player` 继承 `Mob`，`ServerPlayer` 继承 `Player`。

## LeviLamina mod 实现连锁采集时，用 `Block::playerDestroy` + `setBlock` + `neighborChanged` 手动破坏方块，导致木头上的火把、藤蔓等附着方块不正常掉落，应如何实现？

直接调用玩家的 `GameMode::destroyBlock(BlockPos const& pos, uchar face)` 破坏方块（如 `player.mGameMode->destroyBlock(pos, face)`），玩家挖方块走的就是这个函数，附着方块掉落、方块更新、工具耐久等由游戏自行处理，无需手动 `playerDestroy` / `setBlock` / `neighborChanged`。

## LeviLamina 头文件中 `Block` 没有可调用的 `getRuntimeId`，怎么获取方块的 RuntimeId？

直接读取 `Block` 的成员变量 `mNetworkId`（`ll::TypedStorage<4,4,uint>`，即方块的网络运行时 ID），例如 `block.mNetworkId`。

## 在 LeviLamina C++ mod 中如何主动加载指定位置的区块（例如做随机传送前预加载目标区块）？JS 插件有什么办法？

C++ 可以创建或使用 `ChunkViewSource` 并调用 `ChunkViewSource::move`，让区块源移动到目标范围进行加载：以要加载的区块为中心向外扩 3 个区块（实际要加载 7x7 区块，中心区块才会完整加载/生成），然后等待加载完成，过程与玩家加载区块类似。

注意当前头文件中只有 `move(BlockPos const& blockMin, BlockPos const& blockMax, bool isCircle, ChunkSourceViewGenerateMode, std::function<void(gsl::span<std::shared_ptr<LevelChunk>>)> add, float const* serverBuildRatio)` 这个重载是可用的 `MCAPI`，其余重载标记为 `MCNAPI`，不可直接调用。

JS（LSE）侧没有直接 API，可借助 `tickingarea` 命令临时添加常加载区域，或使用 iListenAttentively 的 LSE 导出插件（ila-lseexport）提供的能力。

*适用版本：LeviLamina 1.x 及以上（当前 v26.60.x）*

## 在 LeviLamina C++ mod 中按区块坐标获取区块，用 `getChunk` / `getChunkAt` 拿不到（可能区块未加载），应该用什么 API？

`BlockSource::getChunk` 只返回已加载的区块，未加载时返回空。可以用 `ChunkSource` 的 `getOrLoadChunk(ChunkPos const& cp, ChunkSource::LoadMode lm, bool readOnly)`（`LoadMode` 有 `None`、`Deferred`），它会在需要时加载区块；只想查已存在的区块可用 `getExistingChunk`。`ChunkPos` 可以直接用坐标构造。头文件见 LeviLamina 仓库 `src/mc/world/level/chunk/ChunkSource.h`。

注意区块加载可能是异步的，需要完整加载时可参考 `ChunkViewSource` 方式。

*适用版本：LeviLamina 1.x 及以上*

## 在 LeviLamina C++ 插件中如何移除/自定义实体受伤后的无敌帧？

`Actor` 类下有成员 `mInvulnerableTime`（`TypedStorage<int>`），在受伤后把它设为 0 即可去掉无敌帧（也可设为自定义值），例如 `actor.mInvulnerableTime = 0;`（`TypedStorage` 需通过 `get()` / 赋值访问）。如果追求极致性能，可以直接 patch 掉游戏中设置该值的代码。

*适用版本：LeviLamina 1.x 及以上（字段随 BDS 版本可能变化）*

## 在 LeviLamina mod 中如何判断某个方块/物品属于某个类（如门、潜影盒、告示牌）？能用虚函数表（vftable）比较吗？

不要用虚表判断：BDS 没有 RTTI，LeviLamina 也不保证保留 vtable 符号；自己 `new` 出来的派生类虚表也不是 BDS 的，虚表不能用来判断任何东西。

应使用方块自身的类型/ID 判断：参考 `VanillaBlockTypeIds`（`src/mc/world/level/block/VanillaBlockTypeIds.h`）比较方块类型名，或看基类；带方块实体的（潜影盒、告示牌）可用 `BlockType::getBlockEntityType()` 判断 `BlockActorType`；若想兼容自定义方块，可用 `block.getTypeName()` 判断名称（如是否以 `_door` 结尾）或判断组件。

*适用版本：当前所有 LeviLamina 版本*

## 在 LeviLamina mod 中如何获取 BDS 的刷怪器（spawner），以统计哪些生物计入全局刷怪上限或读取刷怪计数？

通过 `ll::service::getLevel()->mMobSpawner`（或 `Level::getSpawner()`）拿到 `Spawner`，再 `static_cast` 成 `BedrockSpawner` 即可访问其成员；刷怪计数相关逻辑可从 `ActorSpawnRuleGroup` 入手研究。注意逆向得到的生物池枚举顺序可能有误，`pool_name` 需自行校正。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina mod 中能否在世界生成阶段（区块地形生成/装饰时）调用 `getOrLoadChunk` 加载区块？

不能。在世界生成过程中（如 `IFeature::place`、`BiomeDecorationSystem::decorateLargeFeature` 等函数内部）调用 `ChunkSource::getOrLoadChunk` 会导致死循环，应避免在这些 hook 里加载区块。

*适用版本：LeviLamina 当前版本（BDS 原版行为）。未能从源码或文档中直接证实，仅供参考。*

## 在 LeviLamina mod 里实现双开门联动时，把获取到的门方块当 `Block` 调用（如 `getStates`）导致崩溃，怎么正确判断双开门另一半的位置？

`DoorBlock` 继承自 `BlockType`（旧称 `BlockLegacy`），是方块类型而不是方块实例 `Block`，不能把它当 `Block` 使用，否则会崩溃。

应通过方块实例（`Block`）读取方块状态：用下半门的朝向状态和上半门的 `door_hinge_bit` 确定双开门另一半的位置；也可直接使用 `DoorBlock::getDir(region, pos)` 和 `DoorBlock::hasRightHinge(region, pos)`。这比遍历四个方向更好。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina 头文件里找不到与区块（chunk）相关的 API，应该用哪些类？LSE（LegacyScriptEngine）有区块相关 API 吗？

C++ 侧区块相关的类主要是 `ChunkSource` 和 `LevelChunk`（`mc/world/level/chunk/ChunkSource.h`、`LevelChunk.h`）。LSE 没有专门的区块 API（只有 `player.refreshChunks()` 之类的零散接口），像给假人补区块加载这类需求需要用 C++ 原生 mod 实现。

*适用版本：LeviLamina 当前版本；LegacyScriptEngine 当前版本*

## 在 mod 中对动力铁轨上的矿车调用 `getPosDelta()`，向量长度为 2.06 格/gt，而不是预期的约 0.4，为什么？

`getPosDelta()` 不是当前 tick 与上一 tick 的位置差，而是实体当前的运动向量（`StateVectorComponent::mPosDelta`，给它加值实体会随之移动），矿车速度上限等可能硬编码在原版代码里。可参考 <https://github.com/killcerr/MinecartSpeedPlus/blob/main/src/MinecartSpeedPlus.cpp> 的实现。

*适用版本：LeviLamina 26.x。未能从源码或文档中直接证实，仅供参考。*

## 在原生 mod 里调用底层 API 把图片生成为地图（地图画）时，怎样才能不受 `parentMapId` 判断的影响？

据地图画插件的开发经验：调用底层 API 生成地图时，把地图数据（`MapItemSavedData`）的 scale（`mScale`）设为最大值，就不会再去判断 `parentMapId`（`mParentMapId`）。

*适用版本：LeviLamina 原生 mod，依赖 BDS 内部地图逻辑。未能从源码或文档中直接证实，仅供参考。*

## 想修改生物血量，通过 `setNbt` 修改 `Attributes` 里的血量会导致进程直接退出，有更直接的办法吗？

不必改 NBT，直接操作属性即可。当前写法：通过实体的 `AttributesComponent` 或 `Actor::getAttributes()` 拿到 `BaseAttributeMap`，再调用 `setMaxValue`/`setCurrentValue`，例如：

```cpp
actor.getAttributes()->setMaxValue(SharedAttributes::HEALTH(), value);
```

或参考 LSE：

```cpp
if (auto c = actor.getEntityContext().tryGetComponent<AttributesComponent>())
  c->mAttributes->setMaxValue(SharedAttributes::HEALTH(), value);
```

改当前血量用 `setCurrentValue`。

## 用 LeviLamina 能否把世界生成为虚空（类似空岛）？

可以用 MoreDimensions 的多维度 API 创建虚空维度：`CustomDimensionManager::addSimpleDimension(name, seed, GeneratorType::Void)`（MoreDimensions 测试中有 `custom_dim:new_void_type` 示例）。若想主世界虚空但保留结构，可在虚空维度基础上自行实现结构生成，或 hook 地形生成相关函数（原版有 `VoidGenerator`）。也可参考现成插件：<https://github.com/ZGDD-BE/VoidWorldGenerator>

*适用版本：LeviLamina + MoreDimensions 当前版本*
