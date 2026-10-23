---
title: 收纳袋无限提取物品问题的分析与修复
date: 2026-10-22 10:30:00
author: zimuya4153
tags: [Bedrock Dedicated Server, LeviLamina]
category: Bedrock Dedicated Server
---
本文记录一次 BDS 收纳袋无限提取物品问题的排查过程，以及通过 [LeviLamina](https://github.com/LiteLDev/LeviLamina) 修复动态容器身份的实现。物品明明已经从收纳袋里取出来了，再打开却还有一份，问题出在服务端对新旧容器的处理上。

> 文中的代码摘自修复实现，省略了部分 Hook 声明和辅助函数。为便于说明，下文将原始日志中的红石粉统一以钻石块举例，tick、容器 ID 和请求顺序沿用原始记录。

## 起因

最近社区里疯传收纳袋复制漏洞，玩家可以利用它反复从收纳袋中提取物品，相关操作已经有了[教程视频](https://www.bilibili.com/video/BV12maB6qEop)。这类问题会直接影响服务器的物品经济，于是笔者开始排查它的触发过程，尝试在服务端修复。

后续测试从投掷器搬运收纳袋的场景入手。投掷器中放着一个收纳袋，玩家打开相关界面后反复存取物品，结果前几次没有复制成功，反而一直吞物品。继续操作，才终于复制出了一个钻石块。

这就有些奇怪了。如果只是客户端显示没有更新，服务端背包里不应该真的多出物品；如果只是一次错误的扣除，又很难解释前面不断吞物品的现象。于是，笔者在收纳袋的序列化、初始化和物品请求处理路径上加上日志，同时记录 tick、容器 ID、物品 NetId 和调用栈，看看物品到底去了哪里。

## 收纳袋里的物品存在哪里

在继续看日志之前，需要先了解收纳袋在服务端的结构。收纳袋属于 Storage Item，物品 NBT 中的 `bundle_id` 会关联到一个动态容器，大致关系如下：

```text
ItemStack
  -> bundle_id
    -> DynamicTrackedContainer
      -> StorageItemContainerModel
      -> LockingFillingContainer
```

其中，`LockingFillingContainer` 是实际保存槽位物品的后端容器，后面简称 backing。玩家打开收纳袋后，提交的是针对动态容器的 `ItemStackRequest`，由服务端验证并执行存取操作。

而当收纳袋需要被保存或转换为可传递的物品数据时，服务端会调用 `StorageItemUtility::_tryFlattenStorageItem`，把动态容器的内容序列化到 NBT 的 `storage_item_component_content` 中。这个过程在下文称为展平。

之后，如果物品只带有序列化内容，跟踪器又会通过 `DynamicContainerTracker::_initializeStorageItem` 创建动态容器，为它分配新的 `bundle_id`。

单独看这两步都很正常。问题是，物品切换到了新容器，旧容器和已经打开的界面会怎么样？

## 顺着投掷器找到问题

### 不断变化的 bundle_id

通过运行时调用栈和 IDA 中的函数对应，可以确认反复触发展平的是下面这条调用链：

```text
DropperBlockActor::pushOutItems
  -> StorageItemUtility::_tryFlattenStorageItem(SaveContext::Clone)
    -> StorageItemUtility::saveDataFixupBySaveContext
```

`pushOutItems` 会先把投掷器槽位里的物品复制到局部 `ItemStack`，以 `Clone` 上下文展平这份副本，再尝试向目标容器转移一个物品，最后把剩余物品写回投掷器槽位。

问题就在这里。写回的收纳袋已经从动态容器状态变成了序列化内容状态，后续跟踪流程看到它，又会初始化一个新容器。投掷器持续工作时，整个过程就会反复发生：

```text
动态容器 N
  -> 展平到物品 NBT
  -> 初始化动态容器 N + 1
  -> 再次展平
  -> 初始化动态容器 N + 2
```

在 10 月 20 日的测试日志中，共记录到 182 次展平调用，全部使用 `Clone` 上下文，以及 85 组初始化和跟踪事件。收纳袋 ID 从 `0` 一直增长到了 `84`，投掷器工作期间大约每四个 tick 就发生一次替换。

但钻石块对应的序列化内容哈希始终相同。也就是说，笔者看到的是同一份内容不断被装进新创建的动态容器。

### 旧容器为什么还能取东西

继续查看请求验证路径，可以得到下面的调用关系：

```text
ItemStackRequestActionHandler::_validateRequestSlot
  -> _getOrInitSparseContainer
    -> ContainerScreenValidation::getOrCreateSparseContainer
```

服务端按请求携带的 `FullContainerName` 查找或缓存稀疏容器视图。这里不会重新读取投掷器中那个收纳袋当前的 `bundle_id`，再把请求自动切换过去。

假设玩家界面还记着 `dynamic_container:66`，而物品已经换成了 `67`，这次请求仍然会去找 `66`。只要旧容器还在，而且槽位和 NetId 校验通过，操作就可能成功。

旧容器也不会在物品换 ID 后立即消失。`ContainerRegistry::_tick` 达到 300 tick 的清理间隔后才会检查过期条目，而且还要看模型引用和过期状态。打开的界面和稀疏容器映射仍可能持有共享引用，所以不能把这个间隔理解成“旧 ID 最多只能用 300 tick”。

这也解释了为什么同一个操作有时失败，有时却能取出物品。日志中既出现过 `49`（`FailedToValidateSrcSlot`）和 `50`（`FailedToValidateDstSlot`），也出现过成功的 `0`。旧请求能否通过，取决于它指向的容器和槽位状态是否仍能匹配。

### 一个钻石块是怎么变成两个的

把日志中相关事件按 tick 排开，复制过程就比较清楚了：

| Tick | 事件 |
| --- | --- |
| 629588 | 请求 `-39` 向容器 `62` 放入一个钻石块 |
| 629589 | 初始化容器 `63`，其中有一个钻石块 |
| 629593～629605 | 陆续初始化容器 `64～67`，内容仍然相同 |
| 629606 | 请求 `-41` 从旧容器 `66` 取出钻石块，光标获得 NetId 为 `102` 的物品 |
| 629609 | 当前收纳袋继续初始化出容器 `68`，里面仍有一个钻石块 |
| 629618 | 请求 `-43` 把光标上的钻石块放入背包第 13 号槽位 |
| 629621 以后 | 容器 `69～84` 继续生成，仍保留同样的钻石块内容 |

取出钻石块时，物品已经对应容器 `67`，玩家操作的却是仍然存活的 `66`。旧容器少了一个钻石块，当前收纳袋的内容并没有跟着减少，于是后续初始化又把它带了回来。最终背包里一个，收纳袋里还有一个。

前面的吞物品也是同一个原因：玩家把物品放进了旧容器，但当前收纳袋已经指向另一个容器，从当前界面看，这件物品就像消失了一样。

这里也没有发生客户端代码插进服务端函数中间的情况。记录到的展平、初始化和请求处理都运行在 `MC_SERVER` 上。服务端先切换容器，之后处理仍然携带旧 ID 的请求，单线程照样可以出现这种生命周期错位。

## 修复方案

知道旧容器可以继续接受请求后，最容易想到的办法就是拒绝旧 ID。但收纳袋在投掷器里持续传输时，服务端不断替换它的容器 ID，玩家界面中的 ID 很快就会过期。如果每次都直接拒绝，玩家就可能一直取不出物品。

因此，笔者采用重定向来缓解这种操作受阻的情况。让旧 ID 的请求仍然能够操作当前内容，就不必等到传输停止、界面追上最新 ID 后才能存取。当然，请求本身仍然需要通过正常的槽位和 NetId 校验。

仅在 `_getOrInitSparseContainer` 中把旧 ID 改写成新 ID，还不足以让整个操作使用同一份存储。请求初始化、模型获取和最终提交都可能持有自己的容器身份，必须让这些读写指向一致。

修复方案将处理点放在展平和初始化两个边界上：关联同一个收纳袋在切换前后的容器，再直接修改注册项的 `mModel` 和 `mBackingContainer`，让仍可访问的历史 ID 共享当前容器的内容。

## 让新旧 ID 操作同一份内容

### 先确认是同一个收纳袋

展平和初始化不一定紧挨着发生，中间可能穿插其他收纳袋。两个收纳袋也完全可以装着相同物品，只看 `storage_item_component_content` 的哈希，无法区分它们属于哪个物品实例。

因此，暂存记录除了旧 `bundle_id`、内容哈希和 tick，还保存物品的 `ItemStackNetIdVariant`：

```cpp
struct PendingFlatten {
    ItemStackNetIdVariant mNetId;
    size_t                mContentHash;
    uint                  mOldBundleId;
    uint64                mRecordedAtTick;
};
```

这里需要区分两种 ID。`bundle_id` 用于找到收纳袋的动态容器；`ItemStackNetIdVariant` 则用于关联物品实例。在所分析的调用路径中，展平操作实际处理的是 `ItemStack`，其拷贝构造会保留 `mNetIdVariant`，因此局部副本也能带着这个标识经过展平和初始化。

展平 Hook 先记下旧 `bundle_id`，调用原函数，再把序列化内容的哈希和物品 NetId 一起记录下来。以下摘出核心逻辑，省略 Hook 声明：

```cpp
auto oldBundle = getBundleId(item);
origin(item, context);
auto hash = contentHash(item);
if (oldBundle && hash) {
    placePending(*oldBundle, *hash, getNetId(item));
}
```

`placePending` 同时记录当前 tick。初始化 Hook 则先查找暂存记录，等原函数创建新物品和新容器后，再建立容器别名：

```cpp
auto pending = contentHash(item).and_then([&](size_t hash) {
    return takePending(hash, getNetId(item));
});
auto output = origin(item, storageItemComponent, storageWeightLimitItemComponent);
auto newBundle = output.and_then(&getBundleId);
if (pending && newBundle) {
    aliasBundleContainer(*pending, *newBundle);
}
return output;
```

`takePending` 会先清理超过两个 tick 的记录，然后优先查找内容哈希和 NetId 都相等的条目，取出旧 ID 后立即删除该记录：

```cpp
for (auto it = pending.begin(); it != pending.end(); ++it) {
    if (it->mContentHash == hash && it->mNetId == netId) {
        auto result = it->mOldBundleId;
        pending.erase(it);
        return result;
    }
}
```

这样，两个内容相同、NetId 不同的收纳袋交错展平时，只要对应的精确匹配记录仍在，就能各自找到自己的旧容器。

实现还保留了兼容回退：精确匹配未命中时，再查找第一条内容哈希相同的记录。这个回退用于兼容 NetId 不稳定的调用路径，代码中的触发条件是“精确匹配未命中”，没有额外判断该路径是否确实缺少稳定 NetId。因此，哈希回退本身不能证明物品身份，相同内容的收纳袋交错处理、精确记录缺失或超时，都需要纳入回归验证。

### 连续切换时一起更新历史 ID

关联到新旧容器后，还要考虑连续切换的情况。假设一个收纳袋先后使用 A、B、C 三个 ID，第一次从 A 切换到 B 时，A 和 B 共享同一份存储。但第二次从 B 切换到 C 时，如果只修改 B，结果会变成：

```text
第一次 A -> B：
A、B -> backing B

第二次 B -> C，只修改 B：
A    -> backing B
B、C -> backing C
```

这时玩家再请求 A，仍然可能操作已经分离出去的 backing B。即使最近一个旧 ID 已经指向当前容器，更早的 ID，例如这组连续分配中的 `bundle_id - 2`，仍然可能成为复制入口。

因此，修复会先找到 `oldId` 和 `newId` 对应的注册项，保存两边的指针，再把所有共享旧 model 和 backing 的动态容器注册项一起更新：

```cpp
// 省略 oldEntry、newEntry 的查找及前置检查。
auto oldModel   = oldEntry->mModel;
auto oldBacking = oldEntry->mBackingContainer;
auto newModel   = newEntry->mModel;
auto newBacking = newEntry->mBackingContainer;
if (!oldModel || !oldBacking || !newModel || !newBacking) return;

for (auto& [name, entry] : containers) {
    if (name.mName != ContainerEnumName::DynamicContainer || !*name.mDynamicId) continue;
    if (entry.mModel == oldModel && entry.mBackingContainer == oldBacking) {
        entry.mModel            = newModel;
        entry.mBackingContainer = newBacking;
    }
}
```

这里比较的是指针所指对象的身份。只有 model 和 backing 都与旧注册项相同，才会一起更新；这段循环不会根据内容是否相同来决定哪些注册项属于同一组。

先保存 `oldModel` 和 `oldBacking` 也很重要。如果遍历时直接拿 `oldEntry` 的成员作为比较条件，那么更新到旧注册项自身后，后面的比较基准也会跟着变。保存一份旧指针，才能在整次遍历中始终找出共享原来那组对象的注册项。

从 B 切换到 C 时，A 和 B 都会匹配旧的 model/backing，并一起指向 C。后面再发生切换，也按同样的方式更新仍在注册表中的历史别名：

```text
A -> B：A、B 共享 backing B
B -> C：A、B、C 共享 backing C
C -> D：A、B、C、D 共享 backing D
```

### 为什么必须让旧 ID 指向新容器

既然历史 ID 已经共享旧 backing，能不能反过来，只把新 ID 指向旧 backing，省掉这次遍历？

问题在于，`_initializeStorageItem` 创建的不只有注册表中的 `DynamicTrackedContainer`。它还会在 `DynamicContainerTracker::mTrackedContainers` 中为新 ID 建立 `DynamicContainerManager`。这个管理器自己持有 model、backing 的弱引用和对应的 storage item。

如果仅把注册表中的新 ID 改为指向旧容器，tracker 中刚创建的管理器仍然引用新容器，结果就会变成：

```text
注册表中的新 ID -> 旧 backing
tracker 中的新 manager -> 新 backing
```

同一个新 ID 又对应了两套服务端状态。而且旧容器可能已经过期或不可达，不能假定它还能继续承担当前收纳袋的存储。

因此，修复保留完整初始化的新容器，让历史注册项一起指向它，使注册表与 tracker 中的管理器使用相同的 model/backing。

### 为什么直接修改注册项

选择直接修改 `mModel` 和 `mBackingContainer`，也是为了减少不必要的性能消耗和代码量。如果给一系列获取函数都加上 Hook，就需要维护旧 `bundle_id` 到新 ID 的映射，并在每次获取模型、backing、重量或序列化内容时额外查询重定向关系。注册项本身已经指向正确对象后，这些读取可以继续走原有流程，不必为每次访问再查一遍 ID 映射，代码也更简洁。

修复会在一次匹配成功的身份切换中遍历注册表：先定位新旧注册项，再更新共享旧 model/backing 的动态容器。这里仍有遍历开销，但它集中在身份切换时，日常容器访问不需要额外追踪重定向链。

前面记录 NetId、内容哈希、旧 ID 和 tick 的步骤，只用于在展平与初始化之间关联一次身份切换，匹配后即可消费记录；它不需要作为长期重定向表参与后续每次容器访问。

这样，玩家通过历史 ID 取出物品，也会从当前容器扣除；通过历史 ID 放入物品，当前收纳袋同样能读到。客户端可以继续使用原来的物品格式，服务端负责把这些请求落到正确的存储上，从而缓解收纳袋持续传输时旧请求反复被拒绝的问题。

## 验证与总结

验证修复时，需要同时检查物品总数、历史 ID 的读写结果，以及不同收纳袋是否仍然独立。

这次排查最有用的线索，其实是最初那些“物品被吞了”的失败操作。顺着物品写入的位置继续找，才发现玩家操作的容器与收纳袋当前指向的容器已经分开了。

修复也因此落到了容器身份上：只要旧请求仍然可能到达，就必须保证它与当前收纳袋读写同一份内容，或者明确拒绝它。这样才能让一次取出真正对应一次扣除。
