---
title: 嵌套收纳袋容量重置问题的分析与修复
date: 2026-10-23 00:00:00
author: zimuya4153
tags: [Bedrock Dedicated Server, LeviLamina]
category: Bedrock Dedicated Server
---
本文记录嵌套收纳袋在丢出后容量被重置、可以继续超量存放物品的问题，以及通过 [LeviLamina](https://github.com/LiteLDev/LeviLamina) 修复展平顺序的方案。物品内容没有消失，丢失的是容量计算所依赖的内容重量。

## 起因

这次问题出现在收纳袋嵌套和丢弃的过程中：先向收纳袋 A 放入 60 个钻石块，再用收纳袋 B 收起 A，随后丢出并重新打开，原本已经占用的容量就会变小，而里面的物品仍然存在。继续存放、嵌套并重复操作，就能绕过容量限制。相关现象可以参考[演示视频的 11:18～11:40](https://www.bilibili.com/video/BV1rbe16SEsB?t=678)。

此前的[收纳袋无限提取物品问题](/blog/2026/10/22/fix-bundle-infinite-extraction/)涉及新旧动态容器各自保留可写内容。这里需要追查的是另一件事：槽位里明明还放着物品，容量计算为什么却不再把它们算进去。

## 从重量查询追到丢弃路径

### 内容保存在什么地方，重量又从哪里来

笔者先查看收纳袋的保存、展平和重新初始化路径，同时对照 `StorageItemComponent`、`StorageWeightLimitItemComponent` 与动态容器模型。很快发现，物品内容和容量计算并不总是从同一个地方读取。

处于运行时状态的收纳袋通过 `bundle_id` 关联动态容器。展平后，内容写入 `storage_item_component_content`，总重量则保存在 `bundle_weight`。服务端重量查询的主要分支可以概括为：

```text
存在 bundle_weight
  -> 内容重量 = bundle_weight - 自身重量
否则存在 bundle_id
  -> 从动态容器查询内容重量
两者都没有
  -> 内容重量 = 0
```

这意味着，即使序列化内容列表完整存在，重量查询也不会因此自动逐项重算。只要 `bundle_weight` 已经被写成一个偏小的值，容量计算就会直接使用这个值。

接着沿丢弃路径追踪，可以看到 `Spawner::spawnItem` 会触发收纳袋展平，随后进入内容保存：

```text
玩家丢弃收纳袋
  -> Spawner::spawnItem
  -> StorageItemUtility::_tryFlattenStorageItem
  -> StorageItemUtility::saveDataFixupBySaveContext
  -> 保存动态容器内容、处理 bundle_id，并写入重量
```

当时还不能仅凭这条调用链认定原因。需要区分的是：嵌套收纳袋的动态内容根本没有保存下来，还是内容保存成功、重量在转换时丢失。

### 展平前后，内容重量从 64 变成了 0

笔者在展平和初始化前后补上诊断，记录 `bundle_id`、`bundle_weight`、自身重量、内容重量、容量上限，以及 `storage_item_component_content`。把同一次展平的关键字段摘出来，变化非常明显：

```text
flatten-before:
bid=2 own=4 contents=64

flatten-after:
bid=- weightTag=4 own=4 contents=0
```

内容列表仍然存在，里面的物品也没有丢失，但 `bundle_weight` 只剩下了收纳袋自身重量 `4`。后续查询自然得到：

```text
内容重量 = bundle_weight - 自身重量
         = 4 - 4
         = 0
```

这让排查重点落到了展平中的计算顺序。原流程先序列化动态容器内容，之后才调用 `getStorageItemWeightDataServer` 计算重量。到了第二步，原来的动态容器重量视图已经不能再提供完整内容重量，而对应的重量缓存又还没有正确生成。

因此，序列化成功并不意味着这次转换完整成功。内容已经进入 NBT，容量计算却仍在转换后的状态上重新找重量来源，最终只拿到了自身重量。

### 只写回外层重量，重新打开仍然不对

笔者先尝试在 `_tryFlattenStorageItem` 调用原函数之前记录重量，等内容列表生成后再写回总重量。这能避开展平过程中重量来源失效的时机。

但复现反馈仍然无效。日志显示，外层重量已经成功写成 `68`，重新初始化后，内容重量却又降到了 `4`：

```text
flatten-before: own=4 contents=64
flatten-after:  weightTag=68 own=4 contents=64
init-before:    weightTag=68 own=4 contents=64
init-after:     own=4 contents=4
```

这次结果很重要：写回逻辑已经执行，问题却仍然存在。继续修改外层的同一个字段没有意义，需要看重新加载进来的内层物品本身带着什么重量。

笔者于是把外层内容列表中的收纳袋单独解析，增加嵌套项的重量日志，看到内层 A 的状态是：

```text
nested:
type=minecraft:bundle bid=- weightTag=4 own=4 contents=0
```

外层的 `68` 只修好了外层快照，内层 A 仍然被保存成了“内容重量为 0”的收纳袋。重新初始化外层动态容器时，A 只贡献自身重量 `4`，外层原先保存的正确总数便不能继续维持正确的容量计算。

这一步才确定了修复范围：外层展平之前，需要先让内层收纳袋完成内容和重量的一致转换。只在最外层函数返回后补写一个总数，覆盖不到内容列表里每个嵌套项的错误。

## 内容完整，容量缓存却来自错误状态

### 展平打断了重量查询的数据来源

收纳袋展平，本质上是在把动态容器状态转换成可以随物品保存的 NBT 状态。转换完成后，应当满足：

```text
bundle_weight
  = 收纳袋自身重量
  + storage_item_component_content 中全部内容的重量
```

原流程先把内容序列化，再查询并写入重量。在这两个步骤之间，`bundle_id` 已经不能作为原先完整动态内容的可靠入口，正确的 `bundle_weight` 又尚未建立。重量查询便可能返回零内容重量，或只计入嵌套收纳袋的自身重量。

错误的值一旦写入，后续查询还会优先使用 `bundle_weight`，而不是因为内容列表非空就重新计算。这就是容量重置的根本原因：内容完整保存了，容量缓存却没有与同一份内容同步更新。

### 嵌套让错误继续向外传播

以 A 装着 60 个钻石块、B 装着 A 为例，使用本次日志中的重量单位，正确关系应当是：

```text
A 自身重量 = 4
A 内容重量 = 60
A 总重量   = 64

B 自身重量 = 4
B 内容重量 = A 的总重量 = 64
B 总重量   = 68
```

B 的内容重量已经达到 `64` 的容量上限。如果 A 在序列化时只留下自身重量，重新计算 B 的内容就可能只得到 `4`，B 的总重量变成 `8`；如果 B 自己也丢失内容重量，保存的总重量还可能只剩 `4`。

这里要区分总重量和内容重量：`bundle_weight=8` 对应 B 的内容重量 `4`，`bundle_weight=4` 则对应内容重量 `0`。容量上限没有变成更大的数字，而是已经存入的内容被少算了，系统因此允许继续放入物品。

槽位里的 A 和钻石块都还在。每一层嵌套重复这种转换，就会把偏小的重量继续带到外层，形成超量存放和反复扩容的条件。

## 修复方案

### 先处理 backing 中的内层收纳袋

修复仍放在 `_tryFlattenStorageItem`，但在执行当前物品的原版展平前，先读取它的 `bundle_id`，找到对应动态容器的 `mBackingContainer`。

遍历 backing 中的直接槽位，对非空且仍带 `bundle_id` 的内层物品再次调用 `_tryFlattenStorageItem`。这个调用会进入同一套处理逻辑，因而自然先处理更深的一层：

```text
外层 B 开始展平
  -> 找到 B 的 backing
  -> 发现其中的 A 仍带 bundle_id
  -> 先展平 A
       -> 若 A 还有内层收纳袋，继续处理内层
       -> 记录 A 的正确重量
       -> 展平 A，写回 A 的 bundle_weight
  -> 记录 B 的正确重量
  -> 展平 B，写回 B 的 bundle_weight
```

这样，外层开始序列化时，内层物品已经同时带有完整内容和正确重量。重新初始化外层容器后，从内层物品计算出的重量也仍然成立。

### 在重量来源失效前记录，序列化后写回

下面是 Hook 中的核心处理，省略声明和辅助函数。`getBundleId` 只接受整数类型的 `bundle_id`，`hasSerializedContent` 检查内容字段是否为列表：

```cpp
auto oldBundle = getBundleId(item);
if (!oldBundle) return origin(item, context);

auto ownsGuard = mFlatteningBundles.insert(*oldBundle).second;
if (ownsGuard) {
    if (auto level = ll::service::getLevel(); level) {
        auto& containers = *level->mContainerRegistry.get()->mContainers;
        for (auto& [name, entry] : containers) {
            if (name.mName != ContainerEnumName::DynamicContainer
                || *name.mDynamicId != *oldBundle) {
                continue;
            }

            if (auto backing = entry.mBackingContainer; backing) {
                for (auto& nested : *backing->mItems) {
                    if (!nested.isNull() && getBundleId(nested)) {
                        StorageItemUtility::_tryFlattenStorageItem(nested, context);
                    }
                }
            }
            break;
        }
    }
}

auto oldWeight = StorageItemUtility::getStorageItemWeightDataServer(item);
origin(item, context);
if (ownsGuard) mFlatteningBundles.erase(*oldBundle);

if (oldWeight && hasSerializedContent(item) && item.mUserData) {
    (*item.mUserData)["bundle_weight"] = oldWeight->mOwnWeight + oldWeight->mContentsWeight;
}
```

`oldWeight` 的读取位置在内层处理之后、当前物品展平之前。前一个条件保证嵌套项已经有正确重量，后一个条件保证当前动态内容仍然可查询。两者缺一不可。

调用原函数后，还要确认此前取得了重量数据，并且物品已经具有序列化内容列表，才写回总重量。这避免在没有取得有效重量、也没有形成内容列表的情况下，直接给物品补上一个猜测值。

对于已经没有 `bundle_id` 的物品，代码继续执行原版逻辑，不会递归修复任意已有 NBT。因此，这个方案处理的是动态容器展平时的重量丢失，不是扫描存档并修复所有历史异常重量。

### 递归范围与重入处理

`mFlatteningBundles` 保存当前正在处理的收纳袋 ID。只有首次插入该 ID 的调用，才主动遍历它的 backing；同一 ID 在处理期间再次进入时，跳过这段主动嵌套遍历，仍然执行后面的重量读取和原版展平。

因此，这个集合限制的是修复逻辑自身的重复遍历，并不是遇到重复 ID 就取消整个保存过程。拥有该记录的调用在原函数返回后将它移除，后续独立的展平仍可正常处理。

查找当前 backing 时，代码会遍历容器注册表，匹配动态容器类型和 ID，找到后退出；真正递归处理的物品范围则限定在这个 backing 的槽位里。不需要在每个 tick 扫描全服物品，也不需要再维护一套独立的嵌套搜索流程。

## 总结

这次排查从“丢出后容量重置”开始，先确认展平后内容重量归零，再通过一次失败的外层写回定位到内层 NBT。问题落在内容和重量的转换顺序上：只保存内容，或者只修正最外层总数，都不能保证重新打开后的容量计算正确。

修复因此按由内到外的顺序完成转换，在每层动态重量仍可读取时记录总数，再随序列化内容一起保存。确认效果时，需要同时查看内外层重量、实际槽位内容，以及重新打开后的容量，不能只看到外层 `bundle_weight` 写对就认为处理结束。
