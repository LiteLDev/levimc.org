# LeviLamina 模组 API：Hook 与内存

## LeviLamina mod 的 disable/unload 里需要手动 unhook 吗？用 `AUTO` 宏注册的 hook 会自动卸载吗？

`AUTO` 系列宏（`LL_AUTO_TYPE_INSTANCE_HOOK` 等）会生成一个全局 `HookRegistrar` 对象，构造时 hook、析构时 unhook。因此 mod 被卸载（unload，DLL 被释放，静态对象析构）时这些 hook 会自动卸载，unload 中无需写 unhook；但仅仅禁用（disable）不会释放 DLL，hook 仍然生效。如果希望 disable 后 hook 不再起作用（支持热重载/运行时禁用再启用），需要在 disable 中调用 `DEF_TYPE::unhook()`，并在 enable 中调用 `DEF_TYPE::hook()`（或改用非 `AUTO` 的 hook 手动管理）。如果不打算支持热重载，可以不写这些代码。另外所有 hook 都会在游戏退出时自动卸载。

*适用版本：LeviLamina 0.13 及以上*

## 如何在 LeviLamina 中 hook 游戏（BDS）函数？有没有教程？

使用 LeviLamina 在 `ll/api/memory/Hook.h` 中提供的 hook 宏：`LL_TYPE_INSTANCE_HOOK` / `LL_AUTO_TYPE_INSTANCE_HOOK`（实例函数）、`LL_TYPE_STATIC_HOOK` / `LL_AUTO_STATIC_HOOK`（静态函数）等，以及带 `_EX` 后缀的变体。带 `AUTO` 的宏会自动注册；非 `AUTO` 的需要手动调用 `XXXHook::hook()` 注册（并在卸载时 `unhook()`）。官方教程：<https://levimc.org/zh-Hans/LeviLamina/developer_guides/how_to_guides/hook_guide/>（旧 `lamina.levimc.org` 链接会重定向），也可参考 LegacyScriptEngine 等官方 mod 源码中的 hook 写法。

*适用版本：LeviLamina 当前版本*

## 写 LeviLamina hook 需要哪些信息？要 hook 的 BDS 函数声明/符号去哪里找？

一个 hook 需要：hook 名称（`DEF_TYPE`）、优先级、所属类型（`TYPE`）、目标函数标识（`IDENTIFIER`，通常写成成员函数指针如 `&ScreenView::render`，或符号字符串）、返回类型和参数列表。

BDS 的类与函数声明可在 LeviLamina 仓库自带的反编译头文件中查找：服务端/通用部分在 `src/mc`，仅客户端的在 `src-client/mc`（<https://github.com/LiteLDev/LeviLamina/tree/main/src/mc>）。注意头文件中标记为 `MCNAPI` 的函数当前不可用（未导出），无法直接引用，需要时到 <https://github.com/LiteLDev/mcapi-requests> 申请。

官方另有“查找函数”指南：<https://levimc.org/zh-Hans/LeviLamina/developer_guides/how_to_guides/find_function_guide/>。

*适用版本：LeviLamina 当前版本*

## LeviLamina 头文件中很多类的构造函数只有声明没有实现（编译 mod 报缺少构造函数符号/提示不可用），mod 里要构造这个类该怎么做？能不能把虚表填 `nullptr`？

头文件中标注 `// prevent constructor by default` 的那些只声明不实现的构造函数，是统一用来防止意外构造的：原构造函数往往被内联，无法确定其中是否有特殊逻辑，所以默认禁用；若连构造函数符号都没有，也可能是被编译器优化掉了。

需要构造时只能人工判断后自己实现：在 mod 代码中自行实现该构造函数，或把类声明复制出来自己定义/实现构造逻辑。若自己定义该类，应自行实现虚函数，不要把虚表填 `nullptr`，否则其他 mod hook 或直接调用虚函数时会崩溃。

另外 LeviLamina 受 Mojang 要求采用 API 白名单，缺少的符号（含构造函数）需要到 <https://github.com/LiteLDev/mcapi-requests> 提 issue 申请，维护者会在后续版本中加入（LL 的 CHANGELOG 中经常有“Added constructor for ...”这类更新）。

*适用版本：LeviLamina 26.60.x*

## LeviLamina 没有提供某些上层 API（如拦截原版网络包、修改方块渲染），事件系统里也没有网络包事件，原生 mod 要怎么实现？

LeviLamina 的上层 API 较少，缺的功能需要自己 hook 游戏函数。LeviLamina 源码中的 mc 目录（`src/mc`、`src-server/mc`、`src-client/mc`）提供了 MC 的头文件，可在其中查找对应的类和函数，再用 LL 的 hook 宏（如 `LL_TYPE_INSTANCE_HOOK` / `LL_AUTO_TYPE_INSTANCE_HOOK`）进行 hook。

拦截服务端收到的原版数据包：hook `ServerNetworkHandler` 中对应包类型的 `handle(NetworkIdentifier const&, XxxPacket const&)`；客户端侧的包处理在 `ClientNetworkHandler` / `LegacyClientNetworkHandler`（`src-client`）。渲染相关修改（如连接纹理）可参考其他开源 mod 的渲染逻辑，在渲染时 hook 并替换材质。

*适用版本：LeviLamina 当前版本（hook 目标随 BDS 版本变化，需自行核对头文件）*

## C++ mod 中使用带 `AUTO` 的 hook 宏（如 `LL_AUTO_TYPE_INSTANCE_HOOK`）后，又手动调用了 `hook()`，导致回调被重复执行、出现异常，为什么？

带 `AUTO` 的 hook 宏会生成一个 inline 的 `HookRegistrar` 静态对象，在 DLL 加载时自动执行一次 `hook()`。如果再手动调用一次 `Hook::hook()`，就会重复挂钩，导致回调重复执行。用 `AUTO` 宏就不要再手动 `hook()`；若想自己控制时机，使用不带 `AUTO` 的宏（如 `LL_TYPE_INSTANCE_HOOK`）并手动调用 `hook()`/`unhook()`，或用 `ll::memory::HookRegistrar<Hook1, Hook2...>` 统一管理（它带引用计数，不会重复挂钩）。

*适用版本：LeviLamina 1.x 及以上*

## C++ mod 开发中，只有 `HopperBlockActor` 时如何获取漏斗指向的方块（需要 `BlockSource`）？例如实现漏斗物品计数器。

可以参考 trapdoor 的做法：hook `HopperBlockActor` 的 `tick(BlockSource& region)`，从参数中拿到 `BlockSource` 并临时保存。漏斗是在 tick 过程中触发 `setItem(int slot, ItemStack const& item)` 的，按调用顺序，tick hook 中保存的 `BlockSource` 对应当前正在 `setItem` 的漏斗；再用 `BlockActor::getPosition()` 加上漏斗方块的朝向（方块状态）算出它指向的方块位置。

*适用版本：LeviLamina（依赖 BDS 内部调用顺序）。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina C++ mod 中照抄 LL 源码写的 hook（如 `LL_TYPE_INSTANCE_HOOK`）编译通过却没有任何效果，原因是什么？`AUTO` 与非 `AUTO` 的 hook 有何区别，能否卸载？

hook 宏的第一个参数 `DEF_TYPE` 就是生成的结构体名，不能与 LeviLamina 内置 hook 或其它 hook 在同一命名空间下重名，改个名字即可。

带 `AUTO` 的宏（如 `LL_AUTO_TYPE_INSTANCE_HOOK`）会在加载时自动调用 `hook()` 注册；不带 `AUTO` 的（如 `LL_TYPE_INSTANCE_HOOK`）需要自己调用 `DEF_TYPE::hook()` 注册，否则不会生效。两者都可以调用 `DEF_TYPE::unhook()` 卸载（所有 hook 也会在 Minecraft 卸载时自动卸载）。在 hook 体内不调用 `origin(...)` 即相当于拦截原函数（返回值非 `void` 时要返回合适的值）。参考 `src/ll/api/memory/Hook.h` 与官方 hook 指南。

## LeviLamina 中 hook 一个成员函数用了 `STATIC_HOOK`，结果在日志/调用处报错崩溃，应该用哪种 hook 宏？

成员函数带有 `this` 指针，应使用 `INSTANCE_HOOK` 系列（如 `LL_TYPE_INSTANCE_HOOK` / `LL_AUTO_TYPE_INSTANCE_HOOK`）而不是 `STATIC_HOOK`；`STATIC_HOOK` 系列只用于静态/自由函数。详见 LeviLamina 官方文档站的 hook 指南（开发者指南 `how_to_guides/hook_guide`）。

*适用版本：所有版本*

## LeviLamina 写 hook 时，目标函数名带 `$` 前缀和不带有什么区别？

带 `$` 前缀的是虚函数的实现（如 `&Player::$attack`），hook 虚函数时必须使用带 `$` 的名字；非虚函数直接用普通名字（`&ClassName::method`）。例如 `LL_TYPE_INSTANCE_HOOK(..., ServerNetworkHandler, &ServerNetworkHandler::$handle, ...)`。

*适用版本：所有版本*

## LeviLamina 是否支持通过特征码（signature）查找函数并 hook？还有哪些开发中常被忽略的功能？

支持。`ll/api/memory/Signature.h` 提供 `SignatureView` 及 `"..."_sig` / `"..."_sigp` 字面量（`SignatureView::resolve()` 解析地址），Hook 宏（`LL_AUTO_TYPE_INSTANCE_HOOK` 等）的函数标识既可以是符号/成员函数指针，也可以直接传 `SignatureView` 特征码。

此外还有：

- `ll/api/memory/Memory.h` 里的 `virtualCall`（按虚表索引调用虚函数）
- `ll/api/reflection`（反射，可直接把结构体序列化为配置）
- `ll/api/Config.h`（`ll::config::loadConfig` / `saveConfig` 基于反射读写 JSON 配置，无需自己解析）

这些功能文档较少，可直接阅读源码。

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina 的 Hook 有优先级，如果高优先级的 Hook 直接 return 而不调用 `origin`，低优先级的 Hook 还会被触发吗？

不会。同一函数上的多个 Hook 按 `HookPriority` 形成调用链，优先级高的先执行（`Highest`=0 … `Lowest`=400），每个 Hook 内调用 `origin(...)` 才会进入下一个（更低优先级的）Hook，最终到达原函数。若高优先级 Hook 不调用 `origin` 直接返回，调用链就此中断，低优先级 Hook 和原函数都不会执行。

*适用版本：所有版本*

## LeviLamina 的 hook 宏（如 `LL_AUTO_TYPE_INSTANCE_HOOK`）写在函数里报错（括号后红色波浪线），为什么？

hook 宏本质上展开为一个结构体（类型）定义（含 `inline static` 成员、模板特化等），只能写在命名空间/全局作用域，不能放在函数体内。应把宏放到函数外定义；非 AUTO 版本（`LL_TYPE_INSTANCE_HOOK`）可在需要时通过 `Hook::hook()` / `unhook()` 或 `ll::memory::HookRegistrar` 手动注册。

*适用版本：所有版本*

## 在 LeviLamina mod 中实现树叶快速腐烂时，hook/调用 `Block` 的 `randomTick` 虚函数对树叶无效，为什么？

树叶的随机刻逻辑不是通过 `BlockType` 的虚函数 `randomTick` 实现的：`LeavesBlock` 有自己的非虚成员函数 `randomTick(BlockEvents::BlockRandomTickEvent&)`（新版中随机刻已改为事件形式，腐烂逻辑也已拆分）。需要把 `BlockType` `static_cast` 到 `LeavesBlock`，再调用或 hook 这个非虚的 `LeavesBlock::randomTick`。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina 中 hook 一个类的构造函数，返回值写成 `void` 后运行报错/崩服，构造函数的 hook 应该怎么写？

构造函数的 hook 应针对头文件中的 thunk 函数 `&Type::$ctor`，返回值必须写成指针（与 `$ctor` 声明一致，现为 `void*`），并返回原函数的结果，因为构造完的对象地址通过返回值传递。写成 `void` 会破坏返回值，导致崩溃。示例：

```cpp
LL_AUTO_TYPE_INSTANCE_HOOK(DedicatedServerCtorHook, ll::memory::HookPriority::Normal,
    DedicatedServer, &DedicatedServer::$ctor, void*) {
    return origin();
}
```

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina 的 hook 宏（如 `LL_TYPE_INSTANCE_HOOK` 等）里，`TYPE` 参数为什么有时要用全局命名空间限定（写成 `::ClassName`）？

`TYPE` 是被 hook 函数所属的类型，宏展开后会用于 `TYPE::*` 成员指针和继承等。用 `::ClassName` 形式（全局命名空间限定）可以避免与当前命名空间内的同名类型冲突（例如你的 mod 命名空间里也有同名类）。一般不加也没问题，出现名字冲突/解析错误时再加 `::`。想弄清楚可以直接展开 hook 宏查看生成代码（`src/ll/api/memory/Hook.h`）。示例：<https://github.com/engsr6982/CustomWorldGenerator/blob/main/src/Hooks/structure.cpp>

*适用版本：LeviLamina 当前版本*

## 开发 MCBE Windows 客户端 mod 时，hook 了 `WeatherManagerProxy::$getRainLevel`、`LevelRendererCamera::calcRainState` 等函数并写入 `WeatherRenderObject.mDensityRain`，却看不到天气变化。怎样实现只在客户端本地显示的天气？

可以 hook `Weather::$levelEvent`，先判断当前是否为本地世界，再决定是否走原逻辑，例如：

```cpp
if (auto client = ll::service::getClientInstance()) {
  if (auto info = client->getGameConnectionInfo(); info && info->mType == Social::ConnectionType::Local) {
    return origin(type, pos, data);
  }
}
```

注意：最新头文件中 `Weather::$levelEvent` 标记为 `MCNAPI`（无导出符号），需要用特征码定位后再 hook。

*适用版本：LeviLamina 客户端（src-client）mod。未能从源码或文档中直接证实，仅供参考。*

## 多个 LeviLamina 客户端 mod（如回放、小地图、BetterRenderDragon）hook 同一个函数产生冲突怎么办？

通过 LeviLamina 的 hook 宏（会在 hook 里调用 `origin` 原函数）挂钩同一函数时，一般可以共存；若某个 mod 用特征码扫描/直接改字节等方式，就可能因为函数开头已被其他 hook 修改而冲突。可以调整加载顺序，让某个 mod 先加载：在 mod 的 `manifest.json` 里使用 `dependencies` / `optionalDependencies` / `loadBefore` 等字段控制。同一函数上多个 hook 的执行先后也可以用 `HookPriority` 调整。

*适用版本：LeviLamina 当前版本*

## 如何在 LeviLamina 插件中检测玩家签名书本时的书名（例如书名为特定值时执行逻辑）？

书本编辑/签名在客户端完成后通过 `BookEditPacket` 发给服务端，可以 hook `ServerNetworkHandler::$handle(NetworkIdentifier const&, BookEditPacket const&)`。在最新版本中 `BookEditPacket` 继承自 `ll::PayloadPacket<BookEditPacketPayload>`，payload 的 `mOperation` 是一个 `std::variant`（`ReplacePage`/`AddPage`/`DeletePage`/`SwapPages`/`Finalize`）；签名对应 `BookEditAction::Finalize`，其中 `mTitle`、`mAuthor`、`mXuid` 分别是书名、作者名和 xuid。头文件：`src/mc/network/packet/BookEditPacketPayload.h`、`src/mc/network/packet/book_edit_action/Finalize.h`。

*适用版本：LeviLamina 26.60.x*

## 如何拦截玩家用南瓜头搭建铁傀儡？

hook `BlockPatternMatcher::match(::BlockPos const& pos) const`，判断 `this->mData`（`BlockPatternData const&`，含 `mPattern` 图案）是否为铁傀儡的建造图案；若是，把返回的 `BuildMatch` 的 `mMatched` 改为 `false`。注意该函数在最新头文件中标记为 `MCNAPI`，需要用特征码定位。

*适用版本：LeviLamina 当前版本*

## 开发 LeviLamina mod 时，需要的函数被内联了，或者是 `MCFOLD`（被合并的相同函数），该怎么调用或 hook？

被内联的函数只能找更底层的调用方式：`getXxx` 这类 getter 经常被内联，有的变成直接访问成员，有的需要通过别的方法拿到。`MCFOLD` 表示该函数与其他函数被编译器做了相同代码折叠（Identical COMDAT Folding），多个函数共用同一份实现，所以 hook 它时必须在 hook 里判断调用来源。推荐检查 `this` 的虚表指针，确认是目标类后再执行自己的逻辑。要弄清有哪些调用方，可以用 IDA 分析。

*适用版本：LeviLamina 当前版本*

## 想 hook 基岩版的日志输出函数来拦截游戏日志，hook 了某个函数却输出一堆乱七八糟的内容，该 hook 哪个函数？

hook 错函数了（hook 到的是类似 `Util::format`/`formatWide` 的格式化函数，调用者极多）。应该和 LeviLamina 一样 hook `BedrockLogOut`（声明在 `mc/common/Globals.h`：`void BedrockLogOut(uint const _priority, char const* pszFormat, ...)`），可参考 LeviLamina 源码 `src/ll/core/tweak/ModifyInfomation.cpp` 中的 `BedrockLogOutHook`（`LL_STATIC_HOOK(BedrockLogOutHook, HookPriority::Normal, BedrockLogOut, void, uint priority, char const* pszFormat, ...)`）。

## 想在 LeviLamina mod 里阻止活塞/移动方块推动旁观者模式玩家，应该 hook 哪个函数？为什么拦截了服务端后移动方块仍会推动玩家？

服务端活塞推动实体的逻辑最终都会走 `PistonBlockActor::moveEntityLastProgress`（`PistonBlockActor::_moveCollidedEntities` / `_moveCollidedEntitiesHelper` 也是这一路），可以在这里拦截。但移动方块（moving block）推动实体是客户端也会自行判断的行为：即使拦截多余的 `MoveDeltaActor` 包、服务端活塞不再推动，移动方块依旧能在客户端推动玩家。要彻底解决只能改发包（例如只对旁观者特判，改用直接 `setBlock` 等方式）。

*适用版本：当前 LeviLamina 版本*

## 想用 LeviLamina 监听/拦截玩家做表情（emote），hook 了 `Player` 的虚函数 `playEmote` 却从服务器启动起就一直被循环调用，应该 hook 哪里？

不要 hook `Player::playEmote`（服务端该虚函数槽只是占位，不对应真正的表情处理）。应 hook `ServerNetworkHandler::$handle(NetworkIdentifier const&, EmotePacket const&)`，在 hook 里用 `thisFor<NetEventCallback>()->_getServerPlayer(identifier, packet.mSenderSubId)` 拿到对应玩家（写法同 LeviLamina 的 `PlayerChatEvent` 实现）。要拦截时不调用 `origin` 直接 `return` 即可。服务端对该包的处理本质是转发给其他玩家，所以拦截后只有发送者本地能看到动作。

*适用版本：当前 LeviLamina 版本*

## 新版 BDS 里，原来在 `ScriptActorEventListener` 这类类里 hook 的函数找不到了，该去哪里找？

Mojang 每隔几个版本就会把 `Script****EventListener` 里的部分函数挪到对应的 `Script****GlobalEventListener` 里，比如 `ScriptActorEventListener` 的函数被挪到了 `ScriptActorGlobalEventListener`。找不到时直接去对应的 `Global` 版本里找（目录在 `mc/scripting/modules/minecraft/events/`）。

*适用版本：BDS 26.40 及以后（LeviLamina 26.x）*

## 新版 BDS（clang 编译）里，传送门生成猪灵的函数 `PortalBlock::trySpawnPigZombie` 被内联了，mod 想拦截或修改这段逻辑怎么办？

`SpawnChecks::canSpawnPigZombieFromPortal` 仍然可以 hook（`MCAPI`），但它拿不到坐标；坐标可以通过 hook `PortalShape::evaluate` 获取。按维护者的建议，在 hook 里先调用 `origin`，再接自己的实现（不要提前 `return`），因为这个函数后面紧接着就是原始实现。函数被内联后，一般要改成同时 hook 两个函数来实现。

*适用版本：BDS 26.20+（LeviLamina 26.x）*

## 新版 BDS 头文件里找不到 `LevelChunk::tick`，要 hook 区块 tick 该用什么？

这个函数改了，现在叫 `LevelChunk::tickImpl(BlockSource& tickRegion, Tick const& tick, std::function<void()> spawnerCallback)`，比原来多了一个和刷怪相关的回调参数。改成 hook `tickImpl`，并按新签名调整参数即可。如果函数被内联或改名，也可以改为 hook 它的上层函数。

*适用版本：BDS 1.21.6x 及以后（LeviLamina 26.x）*

## 给 LeviLamina 提 PR 还原被内联掉的函数（以 LLAPI 形式实现）时，如果该函数只在服务端存在、客户端没有（或两端符号不同），应该怎么处理？

客户端和服务端的函数集合并不相同。对仅服务端需要的还原实现，用平台宏包裹，例如 `#ifdef LL_PLAT_S ... #endif`（客户端为 `LL_PLAT_C`），仅在服务端平台编译。手写的声明放在自动生成区块之外，用 `LLAPI`/`LLNDAPI` 标注，定义放在同目录 `.cpp` 中。若还原后确认正确，应删除原来对应的 `MCAPI` 声明；PR 修改直接推送到原分支即可，无需关闭 PR 重开。

*适用版本：LeviLamina 当前版本（双端构建）*

## 能否只取消攻击中的暴击判定（其他逻辑不变），比如把原版暴击改成纯随机暴击率？

LSE 的攻击事件只能拦截整次攻击，无法单独拦截暴击（可拦截后自己处理减伤并用 `hurt` 造成伤害）。用 C++ 可以 hook `Player::attack(Actor&, ActorDamageCause const&, Player::AttackParameters const&)`，把 `parameters` 里的 `mCanCrit` 改为 `false` 即可不暴击，再自行实现暴击率（也可借助 `iListenAttentively` 导出给 LSE 的接口）。

*适用版本：LeviLamina 当前版本*
