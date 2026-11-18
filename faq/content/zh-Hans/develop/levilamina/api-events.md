# LeviLamina 模组 API：事件

## LeviLamina C++ mod 中如何定义并发布自定义事件，让其他 mod 的监听器收到？（另：读写配置文件用哪个头文件？）

定义一个继承 `ll::event::Event` 的类，且必须声明为 `final`（`EventBus::publish` 有 `static_assert` 要求 final 类），例如 `class MyCustomEvent final : public ll::event::Event { ... };`。需要广播时构造事件对象并发布：`ll::event::EventBus::getInstance().publish(ev);`（也可用 `publish(modName, ev)` 只发给指定 mod）。其他 mod 通过 `EventBus::getInstance().emplaceListener<MyCustomEvent>(回调)` 或 `addListener` 监听；如需在首次被监听时才挂 hook，可配合 `ll/api/event/Emitter.h` 的 `Emitter` 实现懒加载发射器。配置文件读写可使用 `ll/api/Config.h` 中的 `ll::config::loadConfig` / `saveConfig`。

*适用版本：LeviLamina 1.x 及以上（当前 v26.60.8）*

## LeviLamina 有没有玩家“预加入”（连接服务器、早于进入世界/`PlayerJoinEvent`）的事件可以监听？

有，使用 `PlayerConnectEvent`（`ll::event::PlayerConnectEvent`），它在 `PlayerJoinEvent` 之前触发、可取消，能拿到 `networkIdentifier()` 和 `connectionRequest()`。需要 `#include "ll/api/event/player/PlayerConnectEvent.h"`，再通过 `ll::event::EventBus::getInstance().emplaceListener<ll::event::PlayerConnectEvent>(...)` 订阅。

*适用版本：LeviLamina 0.4 及以上至当前版本（服务端）*

## BDS 游戏主循环对应哪个类的 `tick` 函数？`GameSession` 里找不到 `tick()`。

世界的 tick 在 `Level`/`ServerLevel` 上（`Level::tick` 为虚函数，hook 需用 `$tick`）。更简单的做法是直接监听 LeviLamina 自带的 `ll::event::ServerLevelTickEvent`（头文件 `ll/api/event/world/ServerLevelTickEvent.h`），它在当前版本是 hook `ServerLevel::$_subTick` 实现的。也可以用 LeviLamina 的调度器/`GameChrono` 做按 tick 定时任务。

*适用版本：LeviLamina 26.x*

## C++ mod 中监听服务器启动事件时报错（clangd 也报错），文档里没写需要 include 什么，怎么办？

需要包含 `EventBus` 的头文件和对应事件的头文件：

```cpp
#include "ll/api/event/EventBus.h"
#include "ll/api/event/server/ServerStartedEvent.h"
```

然后在 mod 主类的 `load`/`enable` 等函数中通过 `ll::event::EventBus::getInstance().emplaceListener<ll::event::ServerStartedEvent>(...)` 订阅（保存返回的 listener 以便 `disable` 时移除）。其他事件头文件位于 `ll/api/event/` 下按类别划分的子目录（`server`、`player`、`entity`、`world`、`command` 等）。

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina C++ mod 中如何拦截（取消）一个事件？

对可取消事件（继承自 `ll::event::Cancellable<...>` 的事件，如 `PlayerChatEvent`、`ExecutingCommandEvent` 等），在监听回调中调用 `event.cancel()`（等价于 `setCancelled(true)`）即可拦截。不可取消的事件没有该方法。

## LeviLamina C++ mod 中想监听玩家执行命令，参照 LLSE 的写法监听器触发不了，应该监听哪个事件？

说明监听的事件类型不对。命令相关应监听 `ll::event::ExecutingCommandEvent`（执行前，可 `cancel` 拦截）或 `ExecutedCommandEvent`（执行后），定义在 `ll/api/event/command/ExecuteCommandEvent.h`，通过 `ll::event::EventBus::getInstance().emplaceListener<...>(...)` 注册。具体可参考官方文档的事件 API 与事件指南。

## LeviLamina C++ 插件如何监听玩家钓鱼事件？

LeviLamina 本体至今没有钓鱼事件（`ll/api/event` 下没有相关事件），此前提到的 `more-events` 也没有作为 LiteLDev 项目发布，`iListenAttentively` 目前同样未提供钓鱼事件。需要自己 hook 相关函数实现，可参考 LegacyScriptEngine 的做法：用 `LL_TYPE_INSTANCE_HOOK` hook `FishingHook::_pullCloser(Actor& inEntity, float inSpeed)`，通过 `this->getPlayerOwner()` 拿到钓鱼的玩家，被拉起的实体若为 `ItemActor` 即钓到的物品（LSE 中对应 `onPlayerPullFishingHook` 事件）。

## LeviLamina mod 中监听两个不同事件时，是否需要分别定义/获取两次 `EventBus`？

不需要。`EventBus` 是单例，使用同一个 `ll::event::EventBus::getInstance()` 分别对两个事件调用 `emplaceListener<EventA>(...)` 和 `emplaceListener<EventB>(...)` 即可，并保存返回的 `ListenerPtr` 以便在 `disable` 时 `removeListener`。

*适用版本：所有版本*

## LeviLamina 中直接销毁自己持有的 `ListenerPtr` 而不调用 `EventBus` 的 `removeListener`，会有问题吗？

不会有问题。`ListenerPtr` 是 `std::shared_ptr<ListenerBase>`，`EventBus` 内部也持有一份引用，所以销毁自己手里的 `ListenerPtr` 不会导致崩溃或悬垂指针。但要注意：这并不会注销监听器，监听器仍会继续收到事件；如需停止监听应调用 `EventBus::getInstance().removeListener(listener)`。模组卸载时 `EventBus` 会通过 `removeModListeners` / `clearMod` 清理该模组的监听器。

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina 事件系统中，高优先级监听器取消（`cancel`）了事件后，低优先级监听器还会收到事件吗？

不会。早期设计中被取消的事件仍会派发给后续监听器，需要监听器自己判断 `isCancelled()`；后来维护者修改了行为：事件一旦被 `cancel()`，`EventBus` 立即停止派发，后续监听器（包括同优先级中排在后面的监听器）都不会再收到该事件。这样保证只有一个监听器负责拦截，避免大家都抢最高优先级。

*适用版本：LeviLamina 1.2 之后*

## LeviLamina 插件里注册了事件监听但事件不触发，可能是什么原因？事件 hook 是自动安装的吗？

可以按以下几点排查：

1. 注意注册时机：服务端的 mod enable 阶段是在服务器线程启动（`ServerScriptManager::onServerThreadStarted`）时由 `ModRegistrar::enableAllMods()` 统一调用的，在此之前已经发生的事件（如更早的启动阶段事件）自然收不到。
2. 事件的 hook 不是 auto hook：每个事件的 Emitter 是按需创建的，只有当该事件存在监听者（`EventBus::getInstance().emplaceListener<T>(...)` / `addListener`）时才会安装对应 hook。
3. `ll::event::player`、`ll::event::world` 等子命名空间是 inline namespace，可以直接写 `ll::event::PlayerJoinEvent`，无需写 `ll::event::player::` 前缀。
4. 排查时可在回调里用 logger 打日志确认是否触发。

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina 的 `PlayerSwingEvent`（swing 事件）指的是什么动作？是鞘翅滑翔吗？

不是滑翔。swing 指玩家挥手（挥动手臂）的动作：服务端收到客户端 `AnimatePacket` 且 action 为 `Swing` 时触发，交互容器、左键点击、用斧头去树皮、攻击等都会引起挥手。该事件 `PlayerSwingEvent` 继承自 `PlayerLeftClickEvent`。

*适用版本：所有版本*

## LeviLamina 的事件监听能否指定优先级？例如聊天翻译类插件如何避免与其他聊天插件冲突？

可以。创建 Listener 时可传入 `ll::event::EventPriority`（`Highest`/`High`/`Normal`/`Low`/`Lowest`，默认 `Normal`），例如 `EventBus::getInstance().emplaceListener<PlayerChatEvent>(callback, EventPriority::High)`。优先级高的监听器先处理事件，可借此先于普通聊天插件处理/修改消息。一般不建议随意使用 `Highest`，以免与其他插件产生兼容性问题。

*适用版本：所有版本*

## `PlayerUseItemEvent` 在玩家刚右键使用物品（如开始吃面包）时就触发，即使没吃完；怎样只在物品真正使用完成（吃下去）后触发？

LeviLamina 的 `PlayerUseItemEvent` hook 的是 `PlayerTransactionSubject::$baseUseItem`，即开始使用时触发。要在使用完成时处理，应改用 `Player::completeUsingItem` 对应的事件：iListenAttentively（ila）提供 `PlayerAteBeforeEvent` / `PlayerAteAfterEvent`（hook `Player::completeUsingItem`，仅对食物、药水、牛奶桶、药品触发，Before 可取消）。

如果需要覆盖其它物品，可以自己用 `LL_TYPE_INSTANCE_HOOK` hook `Player::completeUsingItem`。

*适用版本：LeviLamina 当前版本；iListenAttentively*

## 在 LeviLamina mod 中想修改聊天消息格式（如在玩家名前加前缀），用 LL 的聊天事件能做到吗？

LL 的 `PlayerChatEvent` 只提供 `message()` 用于修改实际聊天内容，不能改格式：发出的 `TextPacket` 类型是 `Chat`，显示格式由客户端写死；要在玩家名前加内容，必须改用别的类型（如 `TextPacketType::Raw`）。

实现思路：拦截原版 `TextPacket` 的处理 handler 后自己发包（LSE 的做法），或 hook `TextPacket` 的 `write`，或拦截修改发给客户端的 `TextPacket`。若需每个玩家显示不同（如多语言），需拦截后为每个玩家单独发包。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina mod 中处理 `PlayerDieEvent` / `ActorHurtEvent` / `MobDieEvent` 获取伤害来源实体时，用 `getDimension().fetchEntity()` 或 `Level::getDimension()` 导致崩服（拿到 `nullptr`），应该怎么写？

实体 ID（`ActorUniqueID`）是全局的，没必要先取维度，直接用 `Level::fetchEntity(id, false)` 获取伤害来源实体即可（返回 `Actor*`，仍需判空）。

`Level::getDimension(dimId)` 返回 `WeakRef<Dimension>`，可能为空，使用前必须 `lock()` 并判断，否则会崩；也可改用 `getOrCreateDimension(dimId)`，只要 dimensionId 合法就能拿到维度。如果只需要实体所在维度 ID，直接用 `actor.getDimensionId()`。

不建议参考 LSE 中这几个事件的写法，建议参考 LeviLamina 本体或 LeviOptimize 等项目。

*适用版本：LeviLamina 0.12.x 及以上*

## 在 LeviLamina 中想实现“玩家编辑告示牌”事件并区分正反面，告示牌编辑后客户端发给服务端的是什么数据？有哪些实现思路？

打开告示牌编辑界面由服务端发送 `OpenSignPacket`（`SignBlockActor::requestToSendOpenSignPacket(..., bool isFrontSide)`）；编辑完成后客户端发给服务端的是方块实体数据包 `BlockActorDataPacket`（携带告示牌的 NBT）。

推荐实现思路：hook `ServerNetworkHandler::$handle(NetworkIdentifier const&, std::shared_ptr<BlockActorDataPacket>)`（`MCAPI`，可直接 hook），从中拿到发包玩家并解析 NBT，判断改了哪一面、改成什么内容。

另一思路是 hook `BlockActor::onUpdatePacket(CompoundTag const&, BlockSource&, Player const* fromPlayer)` 或 `SignBlockActor::_onUpdatePacket`，但当前头文件中它们（`onUpdatePacket`、`$_onUpdatePacket`）被标为 `MCNAPI`（"This API is not available"），无法直接按符号 hook，需要自行处理或向 LeviLamina 提 issue。

正反面相关成员在当前头文件中已补全：`SignBlockActor` 有 `mTextFront` / `mTextBack`，`getMessage(SignTextSide side)`、`getSideFacingPlayer(Player const&)`，`SignTextSide` 枚举为 `Front=0` / `Back=1`。

*适用版本：LeviLamina 当前版本（26.x）*

## 开发 LeviLamina 插件时，如何替换挖掘方块的掉落物（例如挖泥土/三废石改为掉落圆石）？生成的掉落物不会向上弹出怎么办？

监听并拦截方块破坏事件（`ll::event::PlayerDestroyBlockEvent`，可取消，`pos()` 拿到方块坐标），取消原掉落后，自己在该位置生成圆石掉落物即可（例如用 `Spawner::spawnItem`），可参考 CoralFans 的“基岩掉落”功能。如果掉落物没有正常弹出（被方块挤住），应先生成掉落物再移除方块。注意要挖的方块类型要对（草方块和泥土是不同方块）。原版掉落由专门的类处理，直接改 `resourceDrops` 对原版方块不一定生效。

*适用版本：LeviLamina 当前版本*

## 想实现玩家死亡后药水效果不掉，在玩家重生事件里给玩家添加效果，代码执行了但效果没生效，重生那一刻不能添加效果吗？

重生时原版逻辑会清理效果，直接在 `PlayerRespawnEvent` 里添加会被覆盖。解决办法：延迟 1 tick 再添加效果；或者自己 hook `Player::$respawn`，先调用 `origin` 再执行添加效果的逻辑；也可以 hook 清除效果的函数，阻止死亡/重生时清除。

*适用版本：当前 LeviLamina 版本*

## 照着 LeviLamina 文档写玩家加入事件监听，编译时提示找不到事件类型，怎么办？

LeviLamina 的每个事件都放在单独的头文件里，用到哪个事件就要 `#include` 哪个头文件，只引入 `EventBus` 是不够的。例如：

```cpp
#include "ll/api/event/player/PlayerJoinEvent.h"

ll::event::EventBus::getInstance().emplaceListener<ll::event::PlayerJoinEvent>([](ll::event::PlayerJoinEvent& ev){ /* ... */ });
```

（`player` 是 inline namespace，写 `ll::event::PlayerJoinEvent` 或 `ll::event::player::PlayerJoinEvent` 都可以。）另外改完代码要先保存再编译。

*适用版本：所有 LeviLamina 版本*

## 能否用 LeviLamina 的反射（`ll::reflection`）自动序列化/注册各种事件类（例如为日志插件自动记录所有事件）？

不行。LL 的反射只支持聚合类型，不支持带构造函数的类，事件类有构造函数，无法直接反射。事件自带的 `serialize(CompoundTag&)` 也不是为持久化记录设计的。只能自己写模板，针对每个事件手动特化。

*适用版本：LeviLamina 1.x 及以上*
