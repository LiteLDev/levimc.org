# LeviLamina 模组 API：玩家与实体

## LeviLamina C++ mod 中按玩家存储数据/唯一标识玩家，用 uuid、xuid 还是 realName 作为键？为什么 LegacyMoney 用 xuid？

推荐用 UUID（`Player::getUuid()` 返回 `mce::UUID`）。开启正版验证（`online-mode`）时 UUID 固定不变、跨存档一致；关闭正版验证时 UUID 会随机，但此时 xuid 本身也不可靠（离线时可能为空）。`mce::UUID` 由两个 `uint64` 组成，比较和哈希比 xuid 字符串更快，可直接作 `unordered_map` 的键。不要用 `realName`（可改名）。LegacyMoney 用 xuid 是历史遗留（legacy 兼容）；已用 xuid 存数据的插件在开启 `online-mode` 时可以不改。需要在 uuid 与 xuid 之间互查（如读取 LegacyMoney 数据库）时，可用 `ll::service::PlayerInfo` 的 `fromUuid()`/`fromXuid()`/`fromName()`。

## 原生 mod 如何实现虚拟容器/自定义箱子 GUI（如 Invsee 查看背包、快捷打开潜影盒）？LeviLamina 有现成接口吗？

LeviLamina 没有封装虚拟容器接口，需要自己实现，常见思路：

1. 最简单：在玩家附近真实放置容器方块并打开，关闭后移除。
2. 全发包：用 `UpdateSubChunkBlocksPacket` 发送假箱子方块、`BlockActorDataPacket` 更新其方块实体 NBT、`ContainerOpenPacket` 让玩家打开界面，然后自行处理容器内容更新与所有物品请求（`ItemStackRequest`），离线玩家还需自己读写 NBT。
3. 半发包：在服务端构造一个容器对象（`Container` 是抽象类，需用合适的派生类）并让服务端认为玩家打开了它，同时给客户端发包伪造方块并打开，物品显示/移动交给原版逻辑，只需负责打开和保存（需深入理解 MC 容器机制）。

客户端一定会看到一个“假方块”，这是原版客户端的限制，除非客户端也装模组。也可以使用第三方前置（如 GMLIB）提供的虚拟容器 API。

*适用版本：当前所有 LeviLamina 版本（服务端）*

## C++ mod 中如何获取 `ServerPlayer`？`Player` 怎么转 `ServerPlayer`（`dynamic_cast` 不可用），`ServerNetworkHandler::getServerPlayer` 没了怎么办？

如果只考虑服务端，`Player` 可直接 `static_cast<ServerPlayer&>(player)`。如果 mod 也会运行在客户端（`target_type=client`），需要先判断（如 `player.isClientSide()`）再转换。

在 `ServerNetworkHandler` 中按 `NetworkIdentifier` 获取玩家时，用 `_getServerPlayer(source, subId)`（BDS 1.21.60 起 `getServerPlayer` 封装已没有）。

在 hook `ServerNetworkHandler` 继承自 `NetEventCallback` 的虚函数（如各 `handle(NetworkIdentifier const&, XxxPacket const&)`）时，hook 里的 `this` 实际指向 `NetEventCallback` 子对象而不是 `ServerNetworkHandler` 起始地址，不要手动算偏移，用 hook 提供的 `thisFor<NetEventCallback>()` 得到正确的 `ServerNetworkHandler*`，再调用 `_getServerPlayer`（LeviLamina 自身的 `PlayerJoinEvent` / `PlayerChatEvent` 就是 `thisFor<NetEventCallback>()->_getServerPlayer(identifier, packet.mSenderSubId)`）。

*适用版本：BDS 1.21.60 及以上 / 当前 LeviLamina*

## C++ mod 中想修改玩家血量/最大生命值，但参考旧写法调用的原版函数（如 `AttributeHelper::setMaxValue` 等）在新版 LeviLamina 中被标成 `MCNAPI`，编译报警告/错误，怎么办？

`MCNAPI` 表示该原版函数在当前 BDS 中没有可链接的符号（通常已被内联），LeviLamina 头文件里把它标成 `[[deprecated("This API is not available. Open an issue if you need it.")]]`，不能调用。做法：

1. 改用其他可用的 API。修改属性值可以用 LeviLamina 自己实现的 `BaseAttributeMap` 辅助函数，例如 `actor.getAttributes()->setMaxValue(SharedAttributes::HEALTH(), value);`、`setCurrentValue(...)`、`setDefaultValue(...)`（`SharedAttributes::HEALTH()` 是静态函数，返回血量 `Attribute`）；也可以用 `actor.getMutableAttribute(SharedAttributes::HEALTH())` 拿到属性实例后直接改成员。
2. 确实需要的原版函数，到 LeviLamina 提 issue 请求实现（不提通常不会加）。
3. 也可以自己用特征码/偏移处理。

*适用版本：LeviLamina 1.2.0 及以上（当前 v26.60.x 仍适用）*

## 26.40 起 `AddPlayerPacket` 里的 `actorUniqueId` 字段没了，做假玩家/灵魂出窍（freecam）的 mod 该怎么设置玩家的 `ActorUniqueID`？

`AddPlayerPacket` 里原来的 AUID 本就是冗余字段，客户端实际使用的是能力数据里的那个：设置 `AddPlayerPacketPayload::mAbilitiesData`（`SerializedAbilitiesData`）中的 `::ll::TypedStorage<8, 8, ::ActorUniqueID> mTargetPlayer` 即可（见 LeviLamina `src/mc/world/actor/SerializedAbilitiesData.h`）。LeviLamina 26.40.5 起也为 `AddPlayerPacket` 提供了构造函数可直接使用。

*适用版本：BDS 26.40 及以上 / LeviLamina 26.40 及以上（当前 26.60 仍适用）*

## BDS 1.21.132 起 `ConnectionRequest` 的 `mLegacyMultiplayerToken` 没了，mod 如何获取玩家 xuid、名称等身份信息？

从 `ServerNetworkHandler` 获取：其 `mClients` 中每个 `Client` 保存了 `mPrimaryPlayerInfo`（`PlayerAuthenticationInfo`）及 `mSubClientPlayerInfo`；也可以使用 `ServerNetworkHandler` 中带 `PlayerAuthenticationInfo` 参数或返回值的函数。BDS 已经解析过 login chain，不需要自己从头解析。`ConnectionRequest` 的验证相关逻辑也在 `ServerNetworkHandler` 中。

*适用版本：BDS 1.21.132 及以后对应的 LeviLamina（当前 v26.60.8 仍适用）*

## BDS 中玩家在打开工作台等 UI 放入物品后强退会导致刷物品，原因是什么？用 LeviLamina mod 如何修复？

原因：玩家数据读取（`Player::readAdditionalSaveData`）时会尝试把 UI 槽位（`UIItems`）里的物品 add 回背包，失败后不回溯，转而尝试 drop 物品，但此时玩家所在区块尚未加载，drop 失败，导致清除 UI 物品的代码不触发，从而复制物品。

修复思路：

1. hook `Player::add`（虚函数需用 `$add`），但不要全局改写，只在 `readAdditionalSaveData` 的调用上下文中修改其行为。
2. 在 `readAdditionalSaveData` 时先加载玩家所在区块（例如 `ChunkSource::getOrLoadChunk`），使 drop 能正常执行。

*适用版本：依赖 BDS 原版行为，未确认当前 BDS 是否已修复。未能从源码或文档中直接证实，仅供参考。*

## BDS 中玩家相关类（`SimulatedPlayer`、`ServerPlayer`、`Player` 等）的继承关系是怎样的？

继承链是 `SimulatedPlayer` → `ServerPlayer` → `Player` → `Mob` → `Actor`（`Player` 和 `Actor` 之间还有 `Mob` 这一层，`Mob` 是带 AI 逻辑的生物，例如 `aiStep`）。客户端对应的是 `LocalPlayer`（`LocalPlayer` → `Player`）。

## C++ mod 中 `ContainerID` 是枚举吗？为什么背包等容器的 ID 不固定？

`ContainerID` 是 `enum class ContainerID : schar`，但只给部分容器定义了固定值：`None=-1`、`Inventory=0`、`Offhand=119`、`Armor=120`、`SelectionSlots=122`、`PlayerOnlyUi=124`、`Registry=125`。其余打开的容器界面（箱子、工作台等）使用 `First(1)` ~ `Last(100)` 范围内自增分配的 ID，所以不固定。

## C++ 代码 `player.getOrCreateUniqueID()` 返回 `ActorUniqueID`，这个 API 在哪里有文档？

这是 MC 本身的原生 C++ API，没有官方文档。要到 LeviLamina 提供的头文件里找：该函数声明在 `mc/world/actor/Actor.h`（`ActorUniqueID const& getOrCreateUniqueID() const;`），`Player` 继承自 `Actor`。平时直接在头文件中搜索，或者依靠 IDE 自动补全。

## LeviLamina / LSE 中有没有让玩家丢弃（丢出）物品的方法？

C++ mod 可以直接使用 `Player::drop(ItemStack const& item, bool randomly)`。LSE 脚本没有原生的丢出物品接口，只能变通：先清除背包中的物品，再在玩家位置生成掉落物；或者使用第三方的 GMLIB-LegacyRemoteCallApi（通过 RemoteCall 导出了相关接口）。一般建议把需要的功能写成 C++ mod，再通过 LegacyRemoteCall 暴露给 JS 插件。

## LeviLamina C++ 插件中如何获取玩家 UUID 的字符串形式？

使用 `player.getUuid().asString()`：`getUuid()` 返回 `mce::UUID const&`，再调用 `asString()` 转为字符串（`mce::UUID` 也支持显式转换 `std::string(uuid)`）。

## LeviLamina 中如何通过 xuid 获取玩家对象？直接调用 `Level::getPlayerByXuid` 报错/内存错误。

`getPlayerByXuid` 是 `Level` 的成员（虚）函数，不是静态函数，不能自己声明/构造 `Level`。应通过 LL 服务获取全局 `Level`：`ll::service::getLevel()` 返回 `optional_ref<Level>`，需判空，例如：

```cpp
if (auto level = ll::service::getLevel()) {
    Player* p = level->getPlayerByXuid(xuid);
    if (p) {
        // ...
    }
}
```

*适用版本：所有版本*

## LeviLamina 插件中如何实现生存模式下的飞行（类似生存飞行插件）？

调用 LeviLamina 提供的 `Player::setAbility(AbilitiesIndex::MayFly, true)`（关闭时传 `false`）。当前实现中 `setAbility` 内部已经会同步 `Canfly` 标志并向该玩家发送 `UpdateAbilitiesPacket` 和 `UpdateAdventureSettingsPacket`，无需再手动发包。如果是直接改 `LayeredAbilities`，则需要自己发送 `UpdateAbilitiesPacket` 才能在客户端生效。LSE 中也有对应封装。

## LeviLamina 里有没有类似 LL2 的 `giveItem` 给玩家物品的接口？用 `Player::add` 加物品后背包会不会自动刷新？

LeviLamina 不提供 LL2 那种 `giveItem` 封装，直接使用 Mojang 自带的 API。`Player::add(ItemStack&)` 可以用，但不会刷新客户端背包，加完后需要调用 `refreshInventory()`（`Mob` 上的 LL 扩展方法）让客户端同步。

更简单的做法是直接用 LeviLamina 扩展的 `Player::addAndRefresh(ItemStack& item)`，它内部就是 `add` 后再 `refreshInventory`，返回值表示物品是否全部给出（不反映刷新是否成功）。不建议照搬 LL2 的实现。

*适用版本：LeviLamina 1.x 及以上（当前 v26.60.8 仍适用）*

## 写 native 隐身（vanish）mod 时，只拦截 `AddActor` 包为什么已经看见该玩家的人仍然能看到他？

拦截 `AddActor`（玩家为 `AddPlayer`）包只能阻止之后的生成，已经加载了该玩家的客户端不会自动移除该实体，需要主动向这些玩家发送 `RemoveActorPacket` 才能立即隐藏。可借助 iListenAttentively 提供的事件减少手写 hook。

*未能从源码或文档中直接证实，仅供参考。*

## 在 LeviLamina mod 中如何获取实体的主手和副手物品？只找到了获取护甲的函数。

在当前 LeviLamina 头文件中，主手物品用 `Actor::getCarriedItem()`（虚函数），副手物品用 `Actor::getOffhandSlot()`，二者与 `getArmor` 一样定义在 `Actor` 类中；`Mob` 类另有 `getAllHandEquipment()` 可一次取得所有手持装备。查找时可在 `Actor.h` / `Mob.h` 中不区分大小写搜索 `carried` / `offhand`。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina 中如何给玩家播放声音？找不到能直接用的播放声音数据包怎么办？

简单做法是使用 `Level`（`ILevel`）上的 `playSound` 系列函数（例如 `playSound(LevelSoundEvent, Vec3 const&, float volume, float pitch)` 或 `playSound(PlaySoundOptions const&)`）。

若要只发给某个玩家，可直接构造数据包发送，例如 `PlaySoundPacket(...).sendTo(player);`（Packet 自带 `sendTo(Player const&)`）。Packet 临时对象按 RAII 自动析构，无需手动释放。也可参考原版 `playsound` 指令的实现。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina 原生 mod 中，如何从服务端控制玩家快捷栏当前选中的格子（例如点击第 9 格后切到第 1 格）？

BDS 的 `Player` 类有 `setSelectedSlot(int slot)` 函数（返回该格的 `ItemStack const&`），可设置玩家当前选中的快捷栏格子，头文件为 `mc/world/actor/player/Player.h`。选中格由服务端发包同步给客户端，因此 mod 可以实现。

*适用版本：LeviLamina 当前版本*

## 开发 LeviLamina mod 时，如何在玩家进服时异步执行检查（如查询云黑名单）且不阻塞服务器，检查通过后再放行？

BDS 本身有异步进服回调机制。在最新版本中，它位于 `AsyncJoinTaskManager`（`ServerNetworkHandler::mAsyncJoinTaskManager`）：`registerAsyncJoinCallback(callback)`，回调参数为 `(NetworkIdentifier const&, PlayerAuthenticationInfo const&, SubClientId, std::shared_ptr<AsyncVerdictPromise>)`，由 `handleAsyncJoinCallbacks` 汇总结果，判定结果类型为 `AsyncJoinAllow` / `AsyncJoinDeny`。这些函数是 `MCNAPI`，需要自行定位/补全。Script API 中对应的是 `AsyncPlayerJoinBeforeEvent`。另一种做法是拦截数据包：先不向玩家发送 `StartGamePacket`，拿到检查结果后再发送，未通过就发送踢出包。

*适用版本：LeviLamina 当前版本*

## 开发 mod 时如何判断玩家是触屏还是键鼠，以决定发表单还是容器 UI？

不要按操作系统判断，应按玩家当前的输入方式判断：`PlayerAuthInputPacket` 的负载（`PlayerAuthInputPacketPayload`）里有 `mInputMode` 字段（枚举 `InputMode`：`Mouse`=1、`Touch`=2、`GamePad`=3），可以监听/hook 该包取得；登录时的 `ConnectionRequest` 中也带有 `currentInputMode`。键鼠（`Mouse`）发容器界面，触屏（`Touch`）发表单。注意玩家可以中途切换输入方式，应以最近一次收到的值为准。

## 玩家在背包里拖动或点击物品是由哪个数据包控制的？怎么知道操作的是哪个物品？

由 `ItemStackRequestPacket`（里面是 `ItemStackRequestBatch`）控制，具体操作放在 `ItemStackRequestAction` 里（有 take/place/swap/drop 等多种 `ItemStackRequestActionType`），物品堆栈通过唯一的 `networkId` 区分。PC 端点击物品就会发包（物品从背包槽移到 `CURSOR` 光标槽），手机端只点击不会发包。如果不想自己解析包，可以用 iListenAttentively 提供的 `PlayerRequestItemActionBeforeEvent`。

*适用版本：当前 BDS / LeviLamina 版本*

## 用 C++（LeviLamina mod）怎么给背包里指定物品设置自定义 lore？

拿到 `ItemStack` 后，调用 `item.setCustomLore(std::vector<std::string>{...})` 设置 lore，调用 `item.clearCustomLore()` 清除，读取用 `getCustomLore()`。可以参考 LSE 的实现：<https://github.com/LiteLDev/LegacyScriptEngine/blob/develop/src/legacy/api/ItemAPI.cpp> 中的 `ItemClass::setLore`。改完后调用 `player.refreshInventory()` 刷新玩家背包，客户端才会显示出来。

*适用版本：当前 LeviLamina 版本*
