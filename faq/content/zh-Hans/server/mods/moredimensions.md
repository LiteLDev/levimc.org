# MoreDimensions

## MoreDimensions 创建的自定义维度能删除/卸载吗？想把某个维度当资源世界定期重置该怎么做？维度什么时候注册？

MoreDimensions 没有提供删除或卸载维度的接口（维护者明确表示不提供存档层删除维度数据的接口，交给存档编辑工具处理），LSE 脚本更做不到。维度的注册信息记录在存档目录下的 `dimension_config.json`，区块等数据存放在存档的 LevelDB（`db`）中；只从代码里去掉注册、或只删配置，都不会删除已生成的数据，运行时删 key 保存后也会被写回。

维度注册：`CustomDimensionManager::addDimension` / `addSimpleDimension` 要求 Level 已存在（否则抛 `std::runtime_error`），官方测试代码是在 `ll::event::ServerStartedEvent` 里注册的，不要放在 mod 的 load 阶段。

如果要重置某个维度，只能离线操作：停服并备份存档，然后用支持 Bedrock LevelDB 的工具删除该维度的区块数据。注意 MC 的 LevelDB 是 Mojang 修改版（支持 zlib 压缩），不能直接用原版 Google leveldb 读写，值为 NBT。区块 key 格式：4 字节 x（int32 LE）+ 4 字节 z +（非主世界时）4 字节维度 id + 1 字节记录类型 + 可选 1 字节子区块索引。可以借助 Amulet（`amulet.load_level`）等第三方存档工具，或自己写 native 插件处理。

另外，多维度的额外开销主要来自给玩家发送该维度的数据；维度越多服务器越卡。生成器可以是原版的主世界/下界/末地/超平坦/虚空，也可以自己写 C++ 生成器，但无法直接加载 addon 定义的自定义群系维度。

*适用版本：MoreDimensions 当前所有版本*

## MoreDimensions 有没有导出接口给 LSE（JS）脚本调用来注册/创建维度？文档在哪？

没有。MoreDimensions 只提供 C++ API（`more_dimensions::CustomDimensionManager`），没有 RemoteCall 导出，LSE 也没有内置注册维度的接口，所以需要写 C++ native mod 调用它。文档见 <https://github.com/LiteLDev/MoreDimensions/wiki>。即使导出，也只能方便地创建原版生成器类型的维度（虚空、超平坦、主世界、下界、末地）。不会写 C++ 的话可以用社区基于它做的 JSON 配置型辅助 mod（如 `more-dimension-helper-json`）。

*适用版本：MoreDimensions 当前所有版本*

## LeviLamina 的多维度（MoreDimensions）怎么用？装上后能直接用指令创建新维度吗？有没有参考实现/现成的维度 mod？进入新维度和传送门怎么做？

MoreDimensions（<https://github.com/LiteLDev/MoreDimensions>）是一个库/前置，本身不会添加维度，也没有创建维度的指令；需要其他 mod 调用它的 API。安装：`lip install github.com/LiteLDev/MoreDimensions`（当前版本需要 LeviLamina 26.60.7 及以上、低于 26.61.0，服务端和客户端均有构建）。

开发者用法：在自己的 native mod 里依赖 `more-dimensions`，Level 可用后（例如 `ServerStartedEvent`）调用：

```cpp
more_dimensions::CustomDimensionManager::getInstance()
    .addSimpleDimension("myns:my_flat", 345, GeneratorType::Flat);
```

维度名必须是 `namespace:name` 形式且不能用 `minecraft` 命名空间；原版生成器支持 Overworld/Flat/Nether/TheEnd/Void，自定义生成器需继承 `Dimension` 并用 `addDimension<D>(name, args...)`。文档见 [wiki](https://github.com/LiteLDev/MoreDimensions/wiki)，示例见仓库 `src/test/TestCustomDimension.cpp`；Actions 中以 `-tests` 结尾的构建会创建 7 个测试维度，仅供测试。社区参考实现：[more-dimension-helper](https://github.com/ye111566/more-dimension-helper)及其 JSON 版（MineBBS 上的 `more-dimension-helper-json`，通过 JSON 配置创建维度，不支持热创建）。

进入维度：用 LeviLamina 内置的 `tpdim` 命令，如 `tpdim ~ ~ ~ <维度名>`。原版那样的传送门无法直接实现，可用 addon 注册传送门样式的方块，玩家触发后执行传送命令。

*适用版本：MoreDimensions v0.14.0 及以上（addSimpleDimension）；当前 v0.16.0 / LeviLamina 26.60.x*

## LeviLamina 下能否在一个 BDS 里有多个世界（资源世界+生存世界、大厅+小游戏等）？有什么限制？

BDS 本身不支持多世界。LeviLamina 下可以用 MoreDimensions 在同一存档里增加自定义维度来近似实现（`lip install github.com/LiteLDev/MoreDimensions`，它只是 API，需要配合调用它的 mod，如社区的 `more-dimension-helper-json`），新维度可按主世界/下界/末地/超平坦/虚空生成。限制：

1. 不能删除已创建的维度；
2. 所有维度共用同一个存档、同一组行为包/资源包，无法给不同维度加载不同材质包；
3. 所有维度都在同一服务器进程/主线程中运行，维度越多压力越大。

需要隔离资源包或减轻负载时，更推荐开多个 BDS（端口需不同，包括 IPv6 端口），配合跨服传送与数据同步插件。

*适用版本：MoreDimensions 当前版本（v0.16.0）*

## 进入 MoreDimensions 自定义维度后怎么传送回主世界/在维度间传送？`tpdim` 还能用吗？

LeviLamina 内置了 `teleportdim` 命令（别名 `tpdim`），可在任意维度（包括自定义维度）间传送：

```text
tpdim <x y z> <维度> [convert]
tpdim <目标选择器> <x y z> <维度> [convert]
```

第一种形式传送自己，第二种传送目标。维度可填 `overworld`/`nether`/`the_end` 或自定义维度名，`convert`（默认 `true`）会按下界比例换算坐标。该命令可在 LeviLamina 配置 `modules.command.tpdimCommand` 中开关并设置权限（默认启用，权限 `GameDirectors`）。回主世界也可以用原版命令 `execute in overworld run tp @s ~ ~ ~`。

*适用版本：LeviLamina 当前版本（26.60.x）*

## 在事件或数据中序列化维度信息时，应该存维度 id 还是维度名字？要考虑 MoreDimensions 的自定义维度。

应存维度名字。自定义维度的 id 不由开发者指定，而是由 MoreDimensions/游戏在注册时分配（当前版本会优先复用存档中已持久化的名字-id 映射，但并不保证在不同存档、注册顺序变化或配置变更后保持一致），所以持久化时存名字，需要时再用 `VanillaDimensions::fromString(name)` 转成 DimensionType、`VanillaDimensions::toString(dimId)` 反查名字（MoreDimensions 的 `getDimensionIdFromName` 已弃用）。原版维度 id 固定：0 主世界、1 下界、2 末地。

*适用版本：MoreDimensions 当前版本（v0.16.0）*

## MoreDimensions 创建新维度时，地形生成器只能用 Mojang 内置的那几种吗？有没有预设模板？

MoreDimensions 只是前置库，没有预设的维度模板或玩法。简单用法 `addSimpleDimension` 只支持原版生成器类型（Overworld/Flat/Nether/TheEnd/Void）。想要自定义地形就要自己写 C++ 生成器（继承 `Dimension` 并用 `addDimension<D>()` 注册），可参考仓库 `src/test/generator` 下的示例（`flat-gen-village` 超平坦生成村庄、`generator-terrain` 自定义地形 `NxnBorderTerrain`），或第三方地皮插件 PlotCraft 的 `DefaultGenerator`。自定义群系、山体等复杂地形需要自行研究噪声生成。

*适用版本：MoreDimensions 当前版本（v0.16.0）*

## MoreDimensions（多维度）能创建超平坦维度吗？

可以，超平坦是最容易实现的类型：

```cpp
CustomDimensionManager::getInstance().addSimpleDimension("myns:flat", 345, GeneratorType::Flat);
```

测试构建中的 `custom_dim:new_flat_type` 就是超平坦维度。注意维度越多服务器负担越大。

*适用版本：MoreDimensions v0.14.0 及以上*

## 用 MoreDimensions 创建的自定义维度能否自定义天空盒、或者让不同维度有不同的时间？

无法通过服务端实现。客户端按维度类型渲染天空，服务端不发送天空材质，想改天空只能靠资源包。时间是全局的（`time` 命令没有维度选项）；理论上可以伪造发给客户端的时间包，但服务端刷怪等逻辑仍按真实时间，实际不可行。

*未能从源码或文档中直接证实，仅供参考。*

## 在 MoreDimensions 创建的自定义维度中使用 `/locate` 会导致服务器假死（卡住），怎么解决？

自定义维度里没有对应结构，BDS 的 `locate` 实现没有处理这种情况会陷入死循环。解决方案：禁止在非原版维度使用 `/locate`（例如拦截命令），或者自行实现结构查找。

*适用版本：LeviLamina 1.0.x（BDS 1.21.50 时报告，之后版本未确认）。未能从源码或文档中直接证实，仅供参考。*

## 按照 MoreDimensions wiki 的 SimpleExample 教程编写自定义维度 mod，xmake 构建失败，怎么办？

wiki 的 SimpleExample 示例代码用到了 `EventBus` 但没有包含其头文件，需要补充 `#include "ll/api/event/EventBus.h"`。另外从 MoreDimensions 0.14.0 起不再导出 `SimpleCustomDimension`，wiki 里的 `addDimension<more_dimensions::SimpleCustomDimension>("name", 345, GeneratorType::Flat)` 写法应改为 `more_dimensions::CustomDimensionManager::getInstance().addSimpleDimension("name", 345, GeneratorType::Flat);`（参考仓库 `src/test/TestCustomDimension.cpp`）。文档见 <https://github.com/LiteLDev/MoreDimensions/wiki>

*适用版本：MoreDimensions 当前版本（0.16.0）及 wiki SimpleExample 现状*

## MoreDimensions（更多维度）暂未适配新版本，先停用插件等更新，已建造在额外维度里的建筑会丢失吗？需要注意什么？

维度数据保存在存档里，停用插件后等更新再装即可；但务必保留存档目录中的 MoreDimensions 维度配置文件 `worlds/<存档名>/dimension_config.json`（客户端为对应世界目录下的 `dimension_config.json`），它记录了维度名与 ID 的对应关系，丢失后重新启用时维度无法对应。

*适用版本：当前所有版本（MoreDimensions 0.16.0）*
