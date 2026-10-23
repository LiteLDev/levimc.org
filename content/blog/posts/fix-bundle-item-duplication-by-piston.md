---
title: 活塞移动容器导致收纳袋整体复制的分析与修复
date: 2026-10-22 11:00:00
author: zimuya4153
tags: [Bedrock Dedicated Server, LeviLamina]
category: Bedrock Dedicated Server
---
本文记录一次活塞移动方块容器时，整个收纳袋连同内容一起被复制的问题，以及通过 [LeviLamina](https://github.com/LiteLDev/LeviLamina) 修复容器界面生命周期的实现。关键在于，方块已经被移走，玩家打开的界面却仍然按照原来的坐标继续工作。

## 起因

在收纳袋复制问题的排查过程中，笔者还遇到了另一种现象：玩家反复打开装有收纳袋的漏斗，配合活塞移动或交换漏斗，容器中就会出现额外的收纳袋。从一开始的复现条件就已知，整个过程只需反复打开漏斗，无需进行取物操作；方块移动时，客户端还会关闭界面。空收纳袋也能复制，装有物品时内容也会保留下来。相关操作可以参考这个[演示视频](https://www.bilibili.com/video/BV19ymeBTEbJ)。

[收纳袋无限提取物品问题](/blog/2026/10/22/fix-bundle-infinite-extraction/)涉及的是同一个收纳袋的新旧动态容器可以独立读写。而这里观察到的是整个收纳袋物品出现副本，排查还需要往上一层，看看玩家打开的方块容器界面在移动过程中发生了什么。

## 从搬运日志开始排查

### 空收纳袋也能复制

排查开始时，有一个很重要的现象：空收纳袋同样可以被复制。用于处理收纳袋内部内容的身份重定向，也不能阻止这次整袋数量增加。

这让笔者把观察重点放到了外层物品的流转上。即使收纳袋里什么都没有，漏斗仍然在搬运一个 `minecraft:bundle`，活塞也仍然在移动保存它的方块实体。需要查清楚的是，哪一步让同一份物品变成了两份。

### 先看漏斗，再看活塞搬走了什么

笔者先给漏斗的搬入、推出、拉取和添加路径加上日志，记录调用前后的槽位内容、收纳袋数量、`bundle_id`、内容哈希和返回值。随后补上活塞的 `_spawnBlocks` 与 `_spawnMovingBlock`，把被移动方块也放进同一条时间线。

当时主要观察这些入口：

```text
Hopper::_tryMoveInItem
Hopper::_pushOutItems
Hopper::_tryMoveItems
PistonBlockActor::_spawnBlocks
PistonBlockActor::_spawnMovingBlock
```

日志确认，被活塞移动的是 `minecraft:hopper`。调用前原坐标上存在漏斗和对应容器，调用后方块变成 `minecraft:air`。与此同时，漏斗搬运记录里还能看到收纳袋经过槽位转移。

于是笔者首先怀疑：漏斗被包装进 `MovingBlockActor` 时，会不会保留了一份容器内容，而源漏斗又在同一段搬运流程中转移了物品，最后两边各留下了一份？

这个怀疑还需要继续验证。仅仅看到“移动前有物品，移动中的方块也有物品”，不能证明出现了两个独立对象。

### 调试 Hook 自己先崩了

为了观察移动中的漏斗，笔者尝试在 `MovingBlockActor::$tick` 中读取 `mWrappedBlockActor`，结果新增的调试 Hook 先触发了访问异常。

崩溃栈落在 `BundleMovingBlockTickHook`。这个入口涉及虚函数 thunk 和多继承对象的 `this` 调整，直接读取成员并不可靠，几次调整 `thisFor` 的父类参数后也没有稳定下来。

继续猜对象偏移没有帮助，于是改用两个非虚函数观察 wrapped BlockActor：

```text
MovingBlockActor::_shouldPreserve
MovingBlockActor::moveCollidedEntities
```

这些 Hook 只负责记录调用前后的内容，不改变原逻辑。这样先把调试代码自身的问题排除，后续日志才有继续分析的意义。

### 用对象地址和 NetId 排除落地复制

新的日志显示，碰撞处理前后，wrapped Hopper 的槽位内容没有变化。于是笔者继续给 `HopperBlockActor::_tick` 加上容器摘要，并补充坐标与物品 NetId，避免把两个不同位置的漏斗混在一起。

同时，IDA 中的落地逻辑表明，移动块会通过带 `std::shared_ptr<BlockActor>` 参数的 `BlockSource::setBlock`，把 `mWrappedBlockActor` 放回目标位置。笔者在这个调用点也记录传入对象地址，与移动前的源漏斗对应。

对齐日志后，可以看到：

- 源漏斗被移除后，移动块携带的是同一个 Hopper 对象。
- `moveCollidedEntities` 前后内容不变。
- 落地 `setBlock` 传入的仍是同一个 Hopper 地址，源坐标没有残留另一个容器。
- 在所追踪的搬运过程中，`net=66` 的收纳袋先从源槽位消失，再进入目标槽位。

这些观察排除了当时怀疑的“活塞包装或落地时额外复制一个漏斗”的路径。物品是在正常地移动，数量增加还需要从其他调用入口寻找。

### 初始化调用栈指向界面同步

笔者给 `_initializeStorageItem` 补上完整调用栈，并记录初始化前后的物品地址与 NetId。与漏斗界面对应的栈中，出现了下面两帧：

```text
LevelContainerManagerModel::broadcastChanges + 0x191
ServerPlayer::normalTick + 0x606
```

这说明收纳袋的初始化由玩家 tick 中的容器界面同步驱动。反复打开漏斗，就能让这条路径继续运行，并不需要玩家主动拖动物品。

接着查看 `broadcastChanges` 的反编译结果，可以看到它先检查管理器是否有效，通过 `getItemCopies` 取得槽位副本，再交给 `DynamicContainerTracker::tryTrackContainer`。跟踪器返回初始化后的物品时，函数会调用 `ContainerModel::networkUpdateItem` 写回。

继续跟进 `networkUpdateItem` 和 `LevelContainerModel::_onItemChanged`，服务端分支最终会调用容器的 `setItem`。至此，日志中的数量变化就与一条实际写回槽位的路径对应上了：

```text
ServerPlayer::normalTick
  -> LevelContainerManagerModel::broadcastChanges
    -> getItemCopies
    -> DynamicContainerTracker::tryTrackContainer
      -> _initializeStorageItem
    -> ContainerModel::networkUpdateItem
      -> LevelContainerModel::_onItemChanged
        -> Container::setItem
```

接下来需要解释的，就是这个旧界面为什么还能被判定为有效，以及它读写的方块容器是否仍然是最初打开的那个。

## 方块移动了，界面还在操作那里

### 有效的方块实体不一定是原来的对象

漏斗、箱子等方块需要通过 BlockActor 保存槽位和其他状态。玩家打开方块容器后，服务端会保留对应的容器管理器，后续在玩家的 `normalTick` 期间继续执行 `broadcastChanges`、读取槽位，并在需要时初始化收纳袋的动态容器。

这里容易忽略的是，容器管理界面还关联着方块坐标。方块被活塞移走后，如果旧管理器没有关闭，它仍可能通过原坐标查找方块实体。

假设玩家打开的是坐标 P 上的漏斗 A。活塞把 A 移走，又让漏斗 B 占据 P，此时的关系就变成了：

```text
移动前：
玩家界面 -> 坐标 P -> 漏斗 A

移动后：
漏斗 A -> 其他位置
玩家旧界面 -> 坐标 P -> 漏斗 B
```

如果只检查 `_getBlockEntity()` 有没有返回有效对象，这个状态很容易被当成正常情况。坐标 P 上确实还有一个漏斗，函数也没有返回空指针，但它已经不是玩家最初打开的那个对象了。

于是，旧界面看起来仍然可用，后续 tick 也继续进行。问题正是从这里开始的。

### 收纳袋副本从哪里来

结合前面的调用栈和写回路径，旧界面跨越方块对象变化后的过程可以整理为：

```text
旧容器界面继续 tick
  -> 按原坐标读取替换进来的 BlockActor
  -> 复制槽位中的收纳袋用于初始化
  -> DynamicContainerTracker::_initializeStorageItem
  -> 创建新的 bundle_id、model 和 backing
  -> networkUpdateItem / _onItemChanged 写回容器
```

与此同时，随着方块移动离开的原物品仍然存在。旧界面的更新流程又产生并写回了一份重新初始化的物品，最终就出现原收纳袋和副本。这个异常状态持续存在时，后续界面更新还可能继续增加数量。

假设原收纳袋里装着一个钻石块，正常搬运后应当仍然只有一个收纳袋，里面还是那个钻石块。但在这个过程中，被移走的物品保留了一份内容，旧界面又在错误的对象关系下完成初始化和写回，收纳袋本身与其中的内容就一起被复制了。

单独检查某次初始化是否成功，或者槽位里是不是一个合法的收纳袋，都找不到完整的问题。真正需要检查的是：这次界面操作是否仍然属于玩家打开时的那个方块容器。

## 修复方案

### 在方块被移走之前关闭界面

既然问题来自旧界面继续操作原坐标，修复就需要让界面在方块移动时失效。修复方案选择的入口是：

```cpp
&PistonBlockActor::_spawnMovingBlock
```

这个函数处理即将进入移动过程的方块。Hook 在调用原函数之前，先找到打开了该位置容器的玩家，并关闭对应的容器管理器，然后再让活塞按原逻辑移动方块。

关闭时机很重要。如果先执行移动，再回头检查旧坐标，那里可能已经出现另一个有效的 BlockActor。此时再凭“坐标上有方块实体”判断界面能否继续工作，就会回到前面的错误。

把关闭放在 `origin(region, blockPos)` 之前，才能在原方块实体仍然位于该坐标时，结束与它关联的界面生命周期。

### 根据界面 owner 找到玩家

接下来需要确定哪些玩家正在打开这个方块容器。容器管理器的 `mScreenContext` 中保存了 `mOwner`，当界面属于方块位置时，可以从中取出 `BlockPos`：

```cpp
auto* owner = std::get_if<BlockPos>(&*manager->mScreenContext->mOwner);
if (owner && *owner == blockPos) {
    static_cast<ServerPlayer&>(player).doDeleteContainerManager(true);
}
```

这里的坐标比较必须限定在同一维度中。主世界和下界可以存在坐标完全相同的容器，不能因为坐标相同，就把另一个维度玩家的界面也关掉。因此，修复直接遍历 `region.mDimension` 中的玩家。

对于没有打开容器管理器的玩家，跳过即可；owner 不是 `BlockPos`，或者位置不相同，也不需要处理。

遍历玩家时还需要先判断 `mContainerManager` 是否为空。研究中确实遇到过未打开容器的玩家被直接解引用，最终崩在读取 `mScreenContext` 的位置。实际实现中的 `if (!manager) return true;` 就是在这里跳过没有容器界面的玩家。

## 通过 Hook 关闭对应容器

修复的核心 Hook 如下，省略功能开关和注册器的外围代码：

```cpp
LL_TYPE_INSTANCE_HOOK(
    CloseContainerBeforeMoveHook,
    HookPriority::Normal,
    PistonBlockActor,
    &PistonBlockActor::_spawnMovingBlock,
    void,
    BlockSource&    region,
    BlockPos const& blockPos
) {
    if (auto* blockEntity = region.getBlockEntity(blockPos); blockEntity) {
        region.mDimension.forEachPlayer([&](Player& player) {
            auto manager = player.mContainerManager;
            if (!manager) return true;

            auto* owner = std::get_if<BlockPos>(&*manager->mScreenContext->mOwner);
            if (owner && *owner == blockPos) {
                static_cast<ServerPlayer&>(player).doDeleteContainerManager(true);
            }

            return true;
        });
    }
    origin(region, blockPos);
}
```

首先检查即将移动的位置有没有 BlockActor。普通方块没有对应的方块容器，不需要进入后面的玩家遍历。

接着，在当前维度逐个检查玩家的容器管理器。回调中的 `return true` 用于继续遍历，这样同一个容器被多名玩家同时打开时，每个匹配的界面都会得到处理。

匹配成功后调用 `doDeleteContainerManager(true)`，其中 `true` 对应 `forceDisconnect`。这一步既关闭服务端容器管理器，也要求客户端退出当前容器界面。只让客户端把窗口藏起来，并不能结束服务端继续读取槽位的流程。

最后，`origin(region, blockPos)` 仍然执行。活塞继续移动方块，玩家需要在移动完成后重新打开容器，建立属于当前位置和对象的界面关系。

整个处理只在方块进入活塞移动流程时执行：有 BlockActor 才遍历当前维度玩家，随后按 owner 坐标筛选。无需在每次槽位读取、物品写回或收纳袋初始化时，再重复判断旧界面是否跨越了方块对象。

### 为什么必须立即关闭

`doDeleteContainerManager` 的参数叫 `forceDisconnect`，这里控制的是容器关闭流程，并不会直接断开玩家的网络连接。

从反编译结果看，传入 `false` 会进入 `ItemStackNetManagerServer::tryCloseContainerScreen`。请求队列为空时可以立即关闭；还有待处理请求时，则先保存关闭回调，等待请求处理完毕。

传入 `true` 时，会取消已经缓存的关闭 token，直接执行关闭回调。回调发送 `ContainerClosePacket`、清空玩家的容器管理器，并发送容器关闭事件。

```text
doDeleteContainerManager(false)
  -> tryCloseContainerScreen
  -> 请求队列非空时，延后执行关闭回调

doDeleteContainerManager(true)
  -> 取消已有关闭 token
  -> 立即执行关闭回调
```

活塞即将移走 BlockActor 时，关闭动作不能继续等待请求队列。如果管理器还在，后续同步就可能跨过方块对象的变化。因此，Hook 需要在原函数执行前调用 `doDeleteContainerManager(true)`，把服务端管理器的使用范围结束在移动之前。

这也解释了为什么复现时看到客户端窗口被关闭，并不能单凭画面判定服务端已经及时结束了旧管理器。

## 为什么不能只处理 bundle_id

动态容器身份修复解决的是收纳袋内部存储的关系，让同一个收纳袋的历史 ID 与当前 ID 指向同一份内容。而这里出问题的地方更早：玩家打开的方块容器管理器已经继续操作了原坐标上的另一个对象。

即使后续把收纳袋的新旧 ID 关联起来，也不能恢复这个旧界面原本所属的方块实体。它仍然可能读取错误的槽位，并在界面更新时触发不该发生的初始化和写回。

因此，这个问题的修复方案是在方块移动前关闭对应界面，提前截断整袋复制的入口。收纳袋内部的动态容器身份切换，则需要让历史 ID 与当前 ID 共享同一份内容。两种方案分别处理界面和内部存储的生命周期。

## 验证与总结

验证时需要同时检查界面关闭时机、方块是否正常移动，以及移动前后的物品总数。只看到玩家窗口关闭，还不足以说明复制链已经完整处理，移动完成后重新打开容器、继续操作和保存重载也应一并检查。

这次问题容易误判的地方，是旧坐标上始终还能找到一个“有效对象”。但对象有效，只能说明它现在可以被访问，不能说明旧界面有理由继续使用它。

笔者把修复放在方块移动之前，先结束旧界面，再让原版完成搬运。这样，界面的使用范围就和它所属的方块容器保持了一致。
