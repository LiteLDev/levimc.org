---
title: 跨维度幽灵刷物问题的分析与修复
date: 2026-10-22 11:30:00
author: zimuya4153
tags: [Bedrock Dedicated Server, LeviLamina]
category: Bedrock Dedicated Server
---
本文记录载有乘客的玩家跨维度传送时，因实体迁移未完成而进入幽灵状态、进一步造成物品复制的问题，以及通过 [LeviLamina](https://github.com/LiteLDev/LeviLamina) 调整传送时序的修复方案。玩家出现在目标维度，并不代表服务端已经完成了这次迁移。

## 起因

这次关注的是带着肩膀上的鹦鹉跨维度后出现的幽灵刷物，相关现象可以参考这个[演示视频](https://www.bilibili.com/video/BV1giJv6NEfh)。玩家看起来已经到达目标维度，却会在重进后回到传送前的位置和背包状态，而目标维度中的掉落物仍然存在。

以一个钻石块为例，玩家在目标维度将它丢出，世界中已经生成了对应的掉落物。如果玩家断线或重新进入后又恢复了传送前的背包，钻石块就会同时出现在背包和地面上。

笔者把分析重点放在两个问题上：玩家为什么会停留在这种未完成的迁移状态，以及物品操作为什么仍然能在这个阶段产生实际结果。

## 从掉落和读档日志开始排查

### 先确认物品确实丢出去了

最初的复现反馈已经包含了几个异常：鹦鹉站在玩家肩膀上时，跨维度后客户端可以移动，服务端坐标却一直不变；丢出物品并重进后，玩家回到传送前的位置，背包也恢复了。放下鹦鹉再正常传送过去，之前丢出的物品仍然存在。

复现时还尝试过刷新客户端背包，丢出的物品没有重新显示。这使“物品只是客户端看起来丢了，服务端实际上没扣除”的解释变得可疑，但仍需要服务端日志确认。

笔者先在 `Player::drop`、`Actor::_drop`、`InventoryTransaction::verifyFull` 和 `executeFull` 周围记录掉落结果与背包变化，再用传送、加载和 `readAdditionalSaveData` 的日志串起重进前后的状态。每条记录同时带上玩家维度、坐标和乘客所在维度，避免只看到物品数量，却不知道操作发生在哪个世界。

第一次复现就出现了明显的维度分离：

```text
玩家：dim=2 pos=(0.500,61.620,-8.500)
鹦鹉：dim=0 pos=(2.000,102.000,-6.000)
```

玩家已经进入末地，仍与玩家保持乘客关系的鹦鹉却留在主世界。与此同时，掉落链路里的校验和执行都成功了。将同一次操作的关键字段整理出来，可以看到：

```text
VERIFY = NoError
DROP = true
ACTOR_DROP = 在末地创建 ItemActor
EXECUTE = NoError
实时背包随后扣除物品
```

重进时，`READ_SAVE` 前后的非空槽位数又从 `0` 变成 `2`。

这一步确认了两件事：末地的掉落物确实生成了，实时背包也确实扣除了。接下来需要追查的是，为什么重新读档又能把它们恢复。

### 传送请求一直没有结束

笔者继续给 `requestPlayerChangeDimension`、`_playerChangeDimension` 和乘客维度迁移路径补上日志。一次从主世界到末地的请求记录为 `from=0 to=2`，并且 `portal=false`，说明玩家这次传送并不是通过传送门触发的。

玩家进入末地后，管理器却反复返回：

```text
result=false state=1
```

当次日志中，`WaitingForChunks` 阶段出现了 355 次。另一组掉落记录则显示，5 次事务的校验和执行都是 `NoError`，背包从 5 个非空槽位变成 0 个，重进读档后又恢复到 5 个。

至此，复制与“传送请求仍未结束”对应上了。玩家实体可以在目标维度产生掉落物，但维度切换还没有完成，重新加载时仍然取回传送前的背包。

复现中还出现了一个附带现象：传送到末地并重进后，原位置附近出现了地狱传送门。为此，笔者补上 `PortalForcer::force` 的日志，发现它处理的是仍在主世界的鹦鹉，记录中带有 `entranceDim=0` 和 `existing=false`。这条线索进一步说明乘客迁移出现了异常，不能把这个门理解成玩家正常传送的结果。

### 挡住直接丢弃后，背包界面仍然能丢

知道复制发生在传送尚未结束期间后，笔者先在 `InventoryTransaction::executeFull` 拒绝这段时间内的物品事务。测试中，直接丢弃确实被拦住了，但打开背包界面后仍能丢出物品并完成复制。

这次反馈说明，单个事务入口没有覆盖所有丢弃路径。继续检查调用来源，背包界面的丢弃进入了 `ItemStackRequestActionHandler::_handleDrop`，没有经过前面的 `executeFull`。

日志中的先后关系也很明确：第一次传送开始后，出现了多次 `EXECUTE_BLOCKED`，随后仍有背包丢弃生成 `ItemActor`，而当时还没有传送结束记录。客户端显示维度已经加载，并不能推翻服务端请求仍未完成这个事实。

补上 `_handleDrop` 的拒绝返回后，复现反馈确认刷物被阻止了。但玩家仍会进入异常传送状态，坐标不同步也还没有解释清楚。因此，物品入口的拦截只能先阻断复制，排查还要继续追进维度状态机。

### WaitingForChunks 不等于已经定位到区块加载

看到 `state=1` 和 `WaitingForChunks` 时，笔者最初把注意力放在服务端区块是否加载完成。反编译 `waitForSubChunks` 后，确实可以看到它会检查玩家附近的 SubChunk；客户端画面已加载，也确实不能直接代表服务端检查通过。

但这只能解释“两个完成条件不同”，还解释不了为什么不带鹦鹉正常，带上鹦鹉就卡住。仅凭外层状态名，把原因归结为区块加载太慢，证据并不充分。

笔者于是给内部步骤分别加上结果日志，观察 `playerWaitForDimensionTransitionSystem`、`playerWaitForServer`、`waitForSubChunks`，以及最终的 `playerSwitchDimension` 和 `_finalizeDimensionChange`。继续查看 ECS 系统后，真正的阻塞条件才明确下来：`_tickReadyToContinueServer` 会排除仍带有以下组件的玩家：

```text
PassengerComponent
VehicleComponent
DimensionTransitionComponent
```

只有通过这个筛选，`PlayerChangeDimensionRequestComponent` 的状态才会从 `AwaitingECSTick` 改为 `ECSTransferComplete`。外层请求的 `state=1` 和这个组件中的状态属于不同层次，不能混为同一个“加载进度”。

带着鹦鹉时，玩家持有 `VehicleComponent`，鹦鹉持有 `PassengerComponent`。玩家先进入目标维度后，自动下车路径才提交 `StopRidingRequest` 等请求，乘客关系没有及时解除。玩家因此仍被完成条件排除，后续完成维度切换的流程也就无法正常执行。

这也解释了坐标不同步：客户端收到维度切换包后已经显示新世界，并继续本地移动；服务端玩家仍处于未完成的传送状态，权威位置停在传送目标点。问题需要从服务端迁移流程解决，刷新客户端背包或等待画面加载都不能解除这个条件。

### 顺着完成维度切换的函数找到旧背包的来源

为了确认背包为什么恢复，笔者继续查看传送开始和结束时的存档处理。

`playerStartChangeDimensionSuspendRegion` 会保存旧玩家状态，并建立存档暂停，玩家身上对应的是 `PlayerDimensionTransferSaveSuspensionComponent`。正常结束时，`_finalizeDimensionChange` 才会移除暂停并调用 `LevelStorage::save(player)`。

这就把前面的掉落日志和读档日志连起来了：实时背包扣除物品时，旧存档仍被保留；目标维度生成的 `ItemActor` 却已经存在。断线重进恢复旧背包，两边便各有一份。

### 调用了停止骑乘状态函数，也不等于可以立即传送

确定乘客关系是阻塞条件后，笔者尝试在传送前调用停止骑乘状态函数 `removeAllPassengers`，随后立即提交维度请求。但测试仍然卡住，日志里出现了：

```text
DETACH_PASSENGERS after remaining=true
PLAYER_DIM_PROCESS after result=false state=1
WAIT_TRANSITION_SYSTEM result=false
WAIT_SERVER result=false
```

后续记录甚至出现过 `passenger=-`，状态机却仍未推进。于是检查从“还能不能取到第一名乘客”进一步细化为三个 ECS 组件是否存在。乘客列表为空，并不代表 `VehicleComponent` 已经删除。

笔者先对照原版 `RideCommand::execute`，确认 `evict_riders` 使用的是 `removeAllPassengers(false, false)`，再继续追进 `RemoveAllPassengersSystem::removeAllPassengers`。反编译结果显示，这一层并不直接删除 `VehicleComponent` 或 `PassengerComponent`，而是遍历载具组件里的乘客，提交停止骑乘请求：

```text
VehicleComponent 中的每个乘客
  -> 添加 StopRidingRequestComponent
  -> 根据参数添加 ExitFromPassengerFlagComponent 等标记
```

外层 `Actor::removeAllPassengers` 虽然会立即触发 `RemovePassenger` 和 `StopRiding` 两个 system category，但组件表、乘客位置和 ECS 视图的更新仍可能延续到后续阶段。函数返回，表示这条清理链已经被触发，并不保证骑乘组件已经消失。

这就解释了为什么日志中调用已经结束，`remaining` 却仍然为 `true`，以及为什么后来出现 `passenger=-`，仍不足以证明可以开始传送。笔者需要检查的是正常停止骑乘流程是否真正完成，而不只是这个函数有没有被调用。

### 请求入口已经提交了第一次维度状态

另一次尝试是在提交维度请求后清理空组件，复现反馈依旧会进入幽灵状态；把清理代码提前，也没有解决仍需等待 ECS 的情况。于是笔者继续反编译 `requestPlayerChangeDimension`，确认它到底只是保存请求，还是已经开始处理迁移。

实际顺序是：

```text
requestPlayerChangeDimension
  -> DimensionStateComponent.mDimensionState = Pending
  -> 重置 StateVectorComponent 的部分状态
  -> 创建 PlayerChangeDimensionRequestComponent
       mState = AwaitingECSTick
       保存来源和目标维度、坐标及请求状态
  -> 立即调用 handleChangeDimensionRequests
       -> _playerChangeDimension
            PrepareRegion
            WaitingForChunks
            WaitingForRespawn
```

最后三个名称是状态机依次处理的阶段，并不表示一次调用就能全部完成。关键发现是，请求入口本身就提交了初始维度状态，并立即驱动一次处理，没有先等 `StopRidingRequestComponent` 被消费、骑乘组件被清理完毕。

因此，调用 `origin` 时，玩家就会被标记为维度转换中，移动状态被部分重置，原始请求也被移动进 ECS 组件。`_playerChangeDimension` 随即开始处理准备阶段，玩家可能已经进入 gameplay suspension，后续还会涉及区块等待、玩家数据迁移和目标维度实体注册。

### 继续查看停止骑乘系统，找到等待环

请求入口已经开始迁移，解释了为什么事后删除组件不能回滚，但还没有解释清理为什么迟迟不能完成。笔者继续查看真正消费 `StopRidingRequestComponent` 的系统，发现停止骑乘相关视图除了要求实体具有这个请求组件，还会排除正在传送、切换载具等状态的实体。

这才把两条流程的依赖接了起来。`removeAllPassengers` 提交停止骑乘请求后，仍需要正常 ECS 系统消费它；如果此时立即调用 `origin`，维度请求就会设置 `DimensionState=Pending`，并继续进入迁移、暂停或传送处理。相关实体进入停止骑乘视图的排除状态后，清理请求便不能按原来的流程完成。

与此同时，维度迁移还在等待 ECS 更新完成。`_tickReadyToContinueServer` 要求玩家没有 `PassengerComponent`、`VehicleComponent` 和 `DimensionTransitionComponent`，才能把请求标记为 `ECSTransferComplete`。`PlayerChangeDimensionRequestComponent` 驱动的是这条维度状态机，并不知道还有一个停止骑乘请求没有被消费，也不会主动调用卸乘系统来补做清理。

于是，两套 ECS 状态机把同一套实体关系同时置于等待清理和等待迁移的状态，却没有显式依赖来保证清理先于迁移。等待环可以整理为：

```text
维度迁移等待 ECS 更新完成
  -> 要求乘客关系和相关组件已经清理
  -> 清理需要停止骑乘系统消费 StopRidingRequestComponent
  -> 实体已经进入传送或切换状态，被相关视图排除
  -> 停止骑乘清理无法完成，乘客组件继续存在
  -> 维度迁移继续等待 ECS 更新完成
```

因此，立即 `origin` 失败的关键并不只是玩家和鹦鹉后来分处两个维度，而是迁移状态改变了停止骑乘系统是否会处理实体的条件。需要先完成的清理被迁移状态挡住，迁移又反过来等待清理结果，后续 tick 重复检查也无法自行解除这个依赖环。

前面的日志由此有了对应解释：玩家已经进入末地、鹦鹉仍在主世界，属于迁移已部分执行的表现；`result=false state=1` 持续出现，则说明请求仍在等待完成条件。即使出现 `passenger=-`，残留的 `VehicleComponent` 也仍会让玩家被完成检查排除，乘客列表为空不能代替组件清理完成。

### 打断等待环，要在第一次 origin 之前完成清理

这里没有线程阻塞意义上的死锁。`origin` 推进一次请求后就会返回，后续 tick 仍可以通过 `handleChangeDimensionRequests` 继续处理。停住的是状态推进：维度请求等清理，清理又因维度转换状态被过滤。

如果 `removeAllPassengers` 返回时，正常停止骑乘处理已经真正完成，相关组件也全部清理，那么立即调用 `origin` 不会形成这个环。问题在于函数返回本身只能说明清理链已经被触发，不能保证所有 ECS 视图都已处理完毕，所以修复还必须检查实体的实际状态。

对于尚未完成清理的情况，正确顺序是：

```text
先执行正常停止骑乘流程
  -> 保持维度请求未提交
  -> 让正常 ECS tick 消费停止骑乘请求
  -> 确认没有乘客，三个前置组件均已清理
  -> 最后调用 origin，设置 Pending 并提交维度请求
```

这样，清理期间不会由这次请求提前引入阻止清理的迁移状态。修复打断的是两套状态机的条件依赖，不是给已经开始的传送多留一点时间。等待一个 tick 只是重新检查的间隔；条件没有满足，就继续在原版请求入口之外等待。

若等待环已经形成，外部强行删除骑乘组件可能改变检查结果，却不会补做停止骑乘、位置恢复、解除暂停或存档同步。删除 `PlayerChangeDimensionRequestComponent` 还会拿掉后续推进请求的记录。这些操作都不能自动回滚已经部分执行的迁移，也不能恢复已经分离的位置、实时背包和持久化状态。

因此，笔者把等待放在第一次 `origin` 之前，确保原版从一致的实体关系开始迁移。物品事务和丢弃入口的拦截，则继续处理传送尚未完成期间的操作。

## 人已经过去了，传送为什么还没结束

### 乘客关系也需要完成迁移

跨维度传送的入口是 `PlayerDimensionTransferManager::requestPlayerChangeDimension`。传入的 `ChangeDimensionRequest` 保存了来源维度和目标维度，但调用这个函数并不意味着所有相关状态会在一次调用中完成切换。

玩家载有乘客时，除了玩家自己的位置和维度，还涉及 ECS 中记录的乘坐关系。这里主要需要关注三个组件：

- `VehicleComponent`：记录载具及其乘客关系，玩家载有乘客时也可能持有它。
- `PassengerComponent`：记录实体作为乘客的关系。
- `DimensionTransitionComponent`：记录实体的维度过渡状态。

问题发生在玩家先进入目标维度，而乘客的自动下车没有在同一次 ECS 更新中完成的时候。残留的 `VehicleComponent` 让传送请求停在 `AwaitingECSTick`，等待实体状态满足后续条件。

从画面上看，玩家已经传送过去；从服务端的状态机看，这次请求仍然没有完成。两者之间的差异，就是幽灵状态的关键。

### 存档暂停没有随之解除

传送流程未结束，还会影响玩家数据的持久化。原有存档的 suspension 没有解除，此时玩家正在操作的实时背包，与之后重新加载时使用的玩家数据可能不再一致。

复制链路可以整理为：

```text
玩家载有乘客，发起跨维度请求
  -> 玩家进入目标维度
  -> 乘客关系尚未清理，传送停在 AwaitingECSTick
  -> 存档暂停未解除
  -> 玩家丢弃物品，目标维度生成掉落物
  -> 断线或重进后恢复旧背包
  -> 背包物品与已经生成的掉落物并存
```

这里的掉落物已经是目标维度中的实际实体。重新加载旧背包，并不会自动把它撤回。因此，只检查当次丢弃有没有从实时背包扣除物品，还不能解释或阻止这次复制。

## 修复方案

### 在请求进入状态机之前解除乘客关系

修复入口仍然是 `requestPlayerChangeDimension`，但处理必须放在调用原函数之前。先比较来源维度和目标维度，只有跨维度时才进入这段处理：

```cpp
auto crossesDimension = *request.mFromDimensionId != *request.mToDimensionId;

if (crossesDimension && player.hasPassenger()) {
    player.removeAllPassengers(false, false);
}
```

这里沿用 `RideCommand(evict_riders)` 使用的正常下车路径。先让乘客离开，再检查相关组件，避免直接带着尚未结束的乘坐关系进入维度迁移。

调用 `removeAllPassengers` 后，也不能马上假设 ECS 状态已经清理完毕。下车动作和组件更新有各自的执行时机，下一步仍需检查实体实际留下了什么。

### 清理残留组件，等待过渡结束

组件检查既要识别仍然有效的关系，也要处理已经失去对应关系的残留。核心逻辑如下：

```cpp
static bool componentsClear(Player& player) {
    auto& entityContext = player.getEntityContext();
    auto vehicleComponent = entityContext.tryGetComponent<VehicleComponent>();
    if (!player.hasPassenger() && vehicleComponent && vehicleComponent->mPassengers->empty()) {
        entityContext.removeComponent<VehicleComponent>();
    }

    auto passengerComponent = entityContext.tryGetComponent<PassengerComponent>();
    if (passengerComponent && player.getVehicle() == nullptr) {
        entityContext.removeComponent<PassengerComponent>();
    }

    return !player.hasPassenger() && !entityContext.hasComponent<PassengerComponent>()
        && !entityContext.hasComponent<VehicleComponent>()
        && !entityContext.hasComponent<DimensionTransitionComponent>();
}
```

这里不能直接对三个组件调用 `removeComponent<T>()`，把它们全部删掉。组件保存着实体关系和过渡上下文，删除数据并不等于执行了对应的清理流程。

`VehicleComponent` 保存玩家作为载具时的乘客实体列表。如果玩家还载着鹦鹉，直接删除它，只会让玩家这一侧丢失乘客列表；鹦鹉自己的 `PassengerComponent` 仍可能指向玩家，双向关系就变成了单向残留。

因此，有乘客时先调用 `removeAllPassengers(false, false)`，让正常停止骑乘路径处理实体位置、乘客关系、同步数据和 ECS 更新。这个调用会触发相应处理，但结构变化仍可能需要后续 ECS 阶段才能全部同步。只有确认玩家已无乘客，而且组件里的乘客列表也为空，才删除残留的 `VehicleComponent`：

```cpp
!player.hasPassenger() && vehicleComponent->mPassengers->empty()
```

`PassengerComponent` 保存玩家当前乘坐的载具。直接删除它，也可能只清掉玩家这一侧的数据，载具的 `VehicleComponent` 仍然保留玩家引用。因此，删除这个组件不能代替 `stopRiding()`。代码先确认 `player.getVehicle() == nullptr`，只清理已经没有实际载具关系的残留。

`DimensionTransitionComponent` 的情况不同。它保存传送门入口位置、入口维度、传送门轴和已计算的目标位置，属于尚在进行的维度过渡流程。直接删除它，会丢掉本次过渡的上下文，却不会撤销已经开始的 suspension、区块等待或实体迁移。客户端也可能仍停在传送界面，或者已经显示目标维度，此时再叠加新的传送请求，就可能进一步造成维度、坐标和背包状态错位。

所以代码不主动删除 `DimensionTransitionComponent`。只要它仍然存在，就继续等待原版流程正常结束；待处理的跨维度请求保持未提交，等前置状态一致后再开始。

此外，`removeComponent` 本身是 ECS 结构修改。在视图迭代、乘客更新或维度状态机处理过程中随意删除组件，可能影响正在使用的视图或组件引用。把组件强行清空以通过检查，并不能代替原版的关系清理。

这段逻辑的边界是：有实际乘客关系时走正常停止骑乘流程，关系已解除时才清理残留的骑乘组件，维度过渡尚未结束时继续等待。删除组件本身不会完成停止骑乘、位置恢复、解除暂停或存档同步，也无法回滚已经提交的维度迁移。

### 延迟整个传送请求

跨维度且组件尚未清理完成时，Hook 暂存原始 `ChangeDimensionRequest`，启动协程，然后直接返回，暂不调用原函数。

协程通过 `ServerThreadExecutor` 在服务端线程上执行，每次等待一个游戏 tick，再检查组件是否已经清理完成。它保存玩家的弱引用，每次恢复执行时重新取得玩家；如果玩家实体已经不存在，就停止等待，避免继续使用失效对象。

正常启用期间的处理顺序是：

```text
收到跨维度请求
  -> 移除玩家载有的乘客
  -> 检查乘坐关系与维度过渡组件
    -> 已清理：调用原函数，提交原始请求
    -> 未清理：暂存请求，在服务端线程等待一个 tick
      -> 重新取得玩家，检查组件
      -> 直到清理完成，再提交原始请求
```

等待不是固定延迟一个 tick。一个 tick 只是检查间隔，真正决定能否继续的是组件状态。实现同时保留任务运行标记，用于处理功能停用时的协程生命周期。

同维度请求不进入这段等待；跨维度但组件已经清理完成时，也会直接调用原函数。额外等待集中在实体关系尚未准备好的时候。

### 在进入状态机前完成等待

前面的排查确认，`origin` 返回时，请求已经开始，后续还会跨 tick 推进。因此，这里的协程等待放在第一次调用 `origin` 之前：先让正常停止骑乘流程完成，再确认玩家没有乘客，且三个前置组件均已清理，最后才提交原始请求。

清理期间不会通过删除请求组件来取消已经开始的迁移，也不会强行擦掉仍在使用的维度过渡上下文。原版接手时，实体关系已经一致，可以从头执行完整的维度状态机。

## 传送未完成时拦截物品操作

调整传送入口负责避免进入异常迁移状态，物品操作还需要检查玩家是否存在尚未完成的传送请求。这里直接读取 `PlayerChangeDimensionRequestComponent`：

```cpp
static bool isTransferPending(Player& player) {
    return player.mEntityContext->hasComponent<PlayerChangeDimensionRequestComponent>();
}
```

这个判断使用的是原版请求组件，并非协程自己的等待标记。前面的协程等待发生在提交原版请求之前，两者对应不同阶段。

### 拦截完整物品事务

在 `InventoryTransaction::executeFull` 入口，如果玩家仍持有传送请求组件，返回状态不匹配；否则继续执行原函数：

```cpp
return isTransferPending(player)
    ? InventoryTransactionError::StateMismatch
    : origin(player, isSenderAuthority);
```

检查放在事务执行之前，可以避免传送未完成时继续通过这条入口提交背包变化。

### 拦截物品请求中的丢弃动作

丢弃操作还有 `ItemStackRequestActionHandler::_handleDrop` 这条入口。它也需要在产生掉落物之前检查传送状态：

```cpp
return isTransferPending(mPlayer)
    ? ItemStackNetResult::CannotDropItem
    : origin(requestAction);
```

两处检查分别覆盖完整物品事务和物品请求中的丢弃动作。正常传送完成、请求组件被原版清除后，就会继续走原来的处理流程，不需要另外维护一份玩家限制名单。

这也把修复分成了两个明确的环节：传送前保证实体关系已经准备好；传送请求仍未结束时，阻止这些物品入口继续提交变化或生成掉落物。

## 总结

这次跨维度幽灵刷物的根因，是停止骑乘清理与维度迁移之间形成了等待环：迁移等待乘客组件清理，清理又因实体进入传送状态而被 ECS 视图排除。迁移已经部分执行，位置、实时背包和持久化数据却没能一起完成切换，最终留下了物品复制的条件。

修复方案因此落在时序上：先下车、等待组件清理，再提交跨维度请求，并在请求未完成期间拦截相关物品操作。确认修复效果时，也需要把重新进入后的背包和目标维度中的掉落物放在一起检查，才能判断物品总数是否保持一致。
