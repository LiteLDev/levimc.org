# iListenAttentively

## iListenAttentively-LseExport（ila-lseexport）是什么？是 iListenAttentively 的扩展吗？提供哪些功能、支持哪些版本？

iListenAttentively-LseExport（<https://github.com/MiracleForest/iListenAttentively-LseExport>）是把 LeviLamina 的事件系统导出给 LSE（LegacyScriptEngine）脚本插件使用的模组。它不是只服务于 iListenAttentively：凡是注册到 LeviLamina 事件总线上的事件（LeviLamina 自带事件、iListenAttentively 事件、其他模组的自定义事件）都可以在 LSE 里监听，并能拦截/修改事件参数（前提是该事件实现了序列化/反序列化），例如数据包发送事件，这样 LSE 插件不用自己写 Hook。

除事件外还提供：

- NativeAPI 类功能（`getAddressFromSymbol` / `getAddressFromSignature` 取地址、`hook` / `unhook` 原生函数、内存读写等，用于替代 LSE 已移除的 NativeAPI）
- 带 Proxy 的 NBT 便捷封装
- `registerEvent` / `publish` 自定义事件
- `getAllEvent` 等查询接口

它的硬依赖只有 LeviLamina 和 LegacyRemoteCall，不强制依赖 iListenAttentively。当前最新 v0.5.0（2026-09-09）采用多版本内嵌二进制，内置 LeviLamina 1.0.0-rc.1、1.2.0-rc.1、1.9.7、26.10.5、26.20.0、26.32.0 的适配，运行时按当前 LeviLamina 版本选不高于它的最接近版本。基本没有文档，参考仓库 README 和 `lib/iListenAttentively.d.ts` 类型声明。

*适用版本：iListenAttentively-LseExport v0.5.0（LeviLamina 1.0.0-rc.1 起；官方声明适配到 26.20.x/26.30.x，更新的 LeviLamina 26.60.x 使用 26.32.0 适配，兼容性需自测）*

## LSE 脚本插件能否使用 iListenAttentively（ila）提供的事件（如玩家关闭容器、红石更新、方块被烧毁等 LSE 原生没有的事件）？需要依赖什么、事件名怎么写、能拿到参数吗、有文档吗？

可以。安装 iListenAttentively（`lip install github.com/LiteLDev/iListenAttentively`）和 iListenAttentively-LseExport（<https://github.com/MiracleForest/iListenAttentively-LseExport/releases>），在自己插件的 manifest 中声明依赖 `iListenAttentively-LseExport`，然后：

```js
/** @type {import("iListenAttentively")} */
const iListenAttentively = require("./iListenAttentively-LseExport/lib/iListenAttentively.js");
iListenAttentively.emplaceListener("事件名", event => { ... }, 优先级可选);
```

要点：

1. LseExport 本身只依赖 LeviLamina 和 LegacyRemoteCall（其 manifest 只声明了 LegacyRemoteCall，`tooth.json` 也不含 iListenAttentively），并不依赖 iListenAttentively，所以需要自行确保 iListenAttentively 本体已安装（当前版本 LSE 自身已依赖 iListenAttentively，用 lip 安装 LSE 时会一并装上）。
2. 能否拿到/修改事件参数取决于提供该事件的模组是否实现了 `serialize`/`deserialize`：LeviLamina 和 iListenAttentively 的事件实现了，可读取并修改参数（改完的字段会写回），`Cancellable` 事件可设置 `cancelled` 拦截；没实现的事件只能监听和拦截。可以设置监听优先级。
3. 事件名是 C++ 类型名（LeviLamina 的事件 ID 来自去掉 inline 命名空间后的类型名），例如 `ila::mc::ExplosionBeforeEvent`、`ll::event::PlayerJoinEvent`；不确定时用 `iListenAttentively.getAllEvent()` 列出当前所有事件名再确认。
4. 没有专门文档，参考 `lib/iListenAttentively.d.ts` 类型声明和 iListenAttentively 源码头文件（<https://github.com/LiteLDev/iListenAttentively>）。

另外 LseExport 还提供了取地址、hook 等函数，用于替代 LSE 已删除的 NativeAPI。

*适用版本：iListenAttentively 0.14.0 及以上；iListenAttentively-LseExport v0.5.0*

## LSE 中在 `onMobHurt` 里修改 `damage` 参数想削减 TNT 伤害但没效果，`source.id === "tnt"` 也判断不到，正确做法是什么？

1. LSE 的 `onMobHurt` 回调只能 `return false` 拦截，修改回调参数不会生效；想改伤害等参数需要借助 iListenAttentively（ila）的事件。
2. 判断实体类型应使用 `entity.type`（命名空间 id，如 `"minecraft:tnt"`），`entity.id` 是实体类型枚举数字。
3. 安装 iListenAttentively（<https://github.com/LiteLDev/iListenAttentively>）和 iListenAttentively-LseExport（<https://github.com/MiracleForest/iListenAttentively-LseExport>），在插件 manifest 中声明依赖 `iListenAttentively-LseExport`，然后：

```js
/** @type {import("iListenAttentively")} */
const iListenAttentively = require("./iListenAttentively-LseExport/lib/iListenAttentively.js");
iListenAttentively.emplaceListener("ila::mc::ExplosionBeforeEvent", event => {
  if (mc.getEntity(event.sourceId)?.type == "minecraft:tnt") {
    event.damageScaling = event.damageScaling * 0.25;
  }
});
```

`mc.getEntity` 需要数字类型 id。ila 没有文档，字段可看 ila 源码 `ExplosionEvent.cpp` 的 `serialize`，或在 VSCode 中打开 `lib` 下的 `.d.ts` 声明文件获得补全。

*适用版本：iListenAttentively 0.14.0 及以上（配合 iListenAttentively-LseExport）；LSE 当前版本*

## LSE 中怎么让模拟玩家被创建时不显示“XXX 加入了游戏”？

LSE 原生 API 做不到，思路是拦截服务器发出的加入消息 `TextPacket`。可以让插件依赖 iListenAttentively 和 iListenAttentively-LseExport，用 ila 的发包事件（`SendPacketBeforeEvent`，可拦截）在发送前判断并拦截对应的 `TextPacket`。

ila 除了通用的发包事件外，还按包类型分别发布事件，事件名形如 `ila::mc::SendPacketBeforeEvent<class TextPacket>`，可只监听 `TextPacket`；实际事件名请用 `iListenAttentively.getAllEvent()` 确认。

注意该事件在脚本侧只把 packet 作为原生对象指针暴露，判断包内容（是否为某玩家的加入消息）需要借助 LseExport 的内存/原生调用接口。

*适用版本：LeviLamina + iListenAttentively + iListenAttentively-LseExport；LiteLoaderBDS 旧版做法已不适用。未能从源码或文档中直接证实，仅供参考。*

## LSE 中玩家编辑告示牌对应哪个事件？`onBlockInteracted` 能用吗？

`onBlockInteracted` 是方块交互事件，不是告示牌编辑事件。LSE 目前没有专门的告示牌编辑事件；iListenAttentively 提供了 `PlayerEditSignBeforeEvent` / `PlayerEditSignAfterEvent`（C++ 中为 `ila::mc::PlayerEditSignBeforeEvent`，Before 可拦截，可读取/修改 `pos`、`text`，`side` 为正反面），源码见 <https://github.com/LiteLDev/iListenAttentively/blob/main/src/ila/event/world/actor/player/PlayerEditSignEvent.cpp>。LSE 脚本可通过 iListenAttentively-LseExport 使用。新游戏内容的事件也欢迎向 LSE 提交 PR。

*适用版本：iListenAttentively 0.14.0 及以上（LiteLDev 仓库）；LSE 当前版本*

## LSE 插件中如何拦截末影人搬运方块？C++ mod 如何使用 iListenAttentively（ila）事件库？

LSE：现在已有原生事件 `onEndermanTakeBlock`（回调 `function(entity, block, pos)`，返回 `false` 拦截；LSE 0.11.3 起提供，当前版本内部基于 ila 的 `MobTakeBlockBeforeEvent` 实现），直接用即可。

C++ mod：使用 iListenAttentively 的 `ila::mc::MobTakeBlockBeforeEvent`（可拦截）。在 `xmake.lua` 中：

```lua
add_repositories("levimc-repo https://github.com/LiteLDev/xmake-repo.git")
add_requires("ilistenattentively 0.18.*")
```

并在 target 中 `add_packages("ilistenattentively")`，然后用 `ll::event::EventBus::getInstance().emplaceListener<ila::mc::MobTakeBlockBeforeEvent>(...)` 监听。服务器上需安装 iListenAttentively（`lip install github.com/LiteLDev/iListenAttentively`），版本号按当前 LeviLamina 对应的 ila 版本选择。

*适用版本：LSE 0.11.3 及以上（`onEndermanTakeBlock`）；iListenAttentively 0.14.0 及以上，当前 0.18.0（LeviLamina 26.60.\*）*

## LSE 插件用 `onDestroyBlock` 拦截破坏箱子时，大箱子会被拆成两半，放置时也无法拦截大箱子合并，有没有对应事件？

iListenAttentively 提供了箱子合并事件 `ChestPairWithBeforeEvent` / `ChestPairWithAfterEvent`（C++ 中为 `ila::mc::ChestPairWithBeforeEvent`，中间的 `world`/`level`/`block`/`actor` 都是 inline 命名空间可省略），可在 Before 事件中拦截箱子合并。LSE 侧通过 iListenAttentively-LseExport 监听；事件名不确定时先调用 `iListenAttentively.getAllEvent()` 查看实际名称。

*适用版本：iListenAttentively 0.14.0 及以上（LiteLDev 仓库）*

## LSE 无法直接拦截实体死亡事件，怎么实现阻止实体死亡？

LSE 的 `onMobDie` 不可拦截。可以用 iListenAttentively 的血量变化事件 `MobHealthChangeBeforeEvent`（`ila::mc::MobHealthChangeBeforeEvent`，配合 iListenAttentively-LseExport 在脚本中使用）：当 `newValue` 小于等于 0 时设置 `cancelled` 拦截，或把 `newValue` 改成 0.1 之类的正数（该事件实现了反序列化，修改会写回）。

*适用版本：iListenAttentively 0.14.0 及以上（配合 iListenAttentively-LseExport）*

## LSE（LegacyScriptEngine）插件有没有办法监听玩家发送的数据包？

LSE 本身没有数据包监听接口。可以依赖 iListenAttentively（ila）和 iListenAttentively-LseExport：ila 提供收包/发包事件（`ila::mc::ReceivePacketBeforeEvent` / `ReceivePacketAfterEvent`、`SendPacketBeforeEvent` / `SendPacketAfterEvent` 等，ila 很多事件本身就是基于数据包实现的），通过 LseExport 导出给 LSE 使用。

此外 ila 还按包类型分别发布事件（事件名形如 `ila::mc::ReceivePacketBeforeEvent<class TextPacket>`），可只监听某种包，准确名称用 `iListenAttentively.getAllEvent()` 查看。注意脚本侧拿到的 packet 是原生对象指针。

ila 没有单独文档，“头文件即文档”。地址：<https://github.com/LiteLDev/iListenAttentively>（0.14.0 之前的旧版本在 <https://github.com/MiracleForest/iListenAttentively-Release/releases>）。

*适用版本：iListenAttentively 0.14.0 及以上（配合 iListenAttentively-LseExport）*

## LeviLamina C++ mod 如何监听玩家丢弃物品事件？LeviLamina 的 API 和源码里都找不到，需要自己 hook 吗？

LeviLamina 本体没有该事件，不需要自己 hook，使用 iListenAttentively（ila，LiteLDev 官方事件扩展库，<https://github.com/LiteLDev/iListenAttentively>）提供的 `ila::mc::PlayerDropItemBeforeEvent`（可拦截）/ `PlayerDropItemAfterEvent`。xmake 中添加 levimc-repo 后 `add_requires("ilistenattentively")`（版本与 LeviLamina 对应，当前 `0.18.*`）即可。

*适用版本：iListenAttentively 0.14.0 及以上；当前 0.18.0 对应 LeviLamina 26.60.\**

## iListenAttentively 的 JS 封装里，给 NBT 赋值能不能直接写 `nbt[key] = 值`，而不用 `nbt.setString` 之类的方法？数字会被转成哪种 NBT 类型？

可以。iListenAttentively-LseExport 的 JS 封装（`lib/iListenAttentively.js`）给 NBT 套了一层 Proxy，可以直接 `nbt[key] = "字符串"`，会自动转换；也能直接赋值 object（转 `NbtCompound`）或数组（转 `NbtList`），列表可以用 `nbt[数字下标]` 访问。

转换规则：整数 number 转 Int，带小数的 number 转 Float，boolean 转 Byte，bigint 转 Long，string 转 String；需要 Short/Double 等其他类型时要自己用对应的 NBT 类显式构造（JS 的 number 无法区分 byte/short/int）。

*适用版本：iListenAttentively-LseExport 当前版本（v0.5.0）*

## 在 LSE JS 里通过 iListenAttentively（ILA）监听事件时，直接打印 `event` 只显示 `NbtClass`，怎么查看一个事件里包含哪些字段（NBT 内容）？

回调拿到的 `event` 是 NBT（`NbtCompound`，经 iListenAttentively-LseExport 的 lib 包了一层 Proxy），调用它的 `toSNBT()` 把内容转成 SNBT 字符串再打印即可，例如 `logger.info(event.toSNBT())`。

*适用版本：当前所有版本（通过 iListenAttentively-LseExport 在 LSE 中监听 ILA/LL 事件）*

## 在 LSE 中用 iListenAttentively-LseExport 监听事件时，类型声明 `.d.ts` 里事件名只是 `string`，去哪里找可监听的事件名列表？

事件名用 `string` 是因为任何 native（C++）mod 注册到 LeviLamina EventBus 的事件都能按名字监听，无法全部写进类型。可以在脚本里调用 `iListenAttentively.getAllEvent()` 获取当前所有已注册事件（含 `modName` 与 `eventName`），用 `getAllEventAlias()` / `getEventAlias()` / `getEventName()` 查询别名。

别名现在由 LseExport 启动时自动生成：ILA 事件可用 `ila::mc::<事件类名>`（或带部分命名空间）的简写，LL 自带事件可用 `ll::event::<事件类名>`，例如 `"ll::event::PlayerJoinEvent"`。`lib/events` 目录下也附带了 LeviLamina、LeviAntiCheat 等事件的 `.d.ts`。

LseExport 本身只依赖 LeviLamina 和 LegacyRemoteCall，不强制依赖 ILA；要用 ILA 的事件需同时安装 ILA。

*适用版本：iListenAttentively-LseExport 0.5.0 及以上*

## 在 LSE 的 JS 插件里监听 iListenAttentively（ILA）的事件，想拦截事件时在回调里 `return false` 没有效果，应该怎么拦截？怎么知道哪些事件能拦截？

ILA 事件不是靠回调返回 `false` 来拦截的。回调拿到的 `event` 本质上是 NBT 对象，可取消事件带有 `cancelled` 字段，把它设为 `true` 即可拦截：`event["cancelled"] = true;`（不需要 `return`）。

只有 C++ 侧继承了 `Cancellable` 的事件（通常是 `xxxBeforeEvent`）才能拦截，After 事件或未实现取消的事件即使设置也无效；可以看 ILA 源码中对应事件头文件是否继承 `ll::event::Cancellable`，或打印 `event.toSNBT()` 看有没有 `cancelled` 字段。

*适用版本：当前版本（通过 iListenAttentively-LseExport 使用 ILA 事件）*

## 有没有监听方块被火焰烧毁的事件？iListenAttentively 是否支持？

iListenAttentively 提供 `FireTryBurnBlock` 事件：`FireTryBurnBlockBeforeEvent`（可取消，取消后火不会在该位置燃烧）和 `FireTryBurnBlockAfterEvent`，带 `pos` 字段。注意它挂在 `FireBlock::isValidFireLocation` 上，是在“尝试燃烧”时触发，监听时方块尚未实际被烧毁。可以用来替代监听 `onBlockChanged` 的做法。在 LSE 中经 LseExport 可用别名 `ila::mc::FireTryBurnBlockBeforeEvent` 监听。

*适用版本：iListenAttentively 当前版本（0.18.0）*

## 其他插件（如 LSE 插件、机器人转发）怎么读取玩家死亡消息，包括被别的插件修改过的死亡消息？

可以使用 iListenAttentively 提供的死亡消息事件：`DeathMessageBeforeEvent`（可取消，并可修改 `result`）和 `DeathMessageAfterEvent`。事件 NBT 中有 `sourceUniqueId`、`cause` 以及 `result{key, params}`（死亡消息的翻译键和参数）。如果某插件只是修改了死亡返回的消息而没有改原版死亡事件，读取最终消息应监听 After 事件。LSE 中经 iListenAttentively-LseExport 可用别名 `ila::mc::DeathMessageAfterEvent` 监听。

*适用版本：iListenAttentively 当前版本（0.18.0）*

## 依赖 iListenAttentively 事件的 LSE 脚本插件（如 ShoppingMall、iLand）装上后不生效，该怎么办？

LSE 脚本插件要使用 iListenAttentively 的事件，除了安装 iListenAttentively 本身外，还需要额外安装 ILA 的 LSE 导出模块 iListenAttentively-LseExport，从 <https://github.com/MiracleForest/iListenAttentively-LseExport/releases> 下载（无法访问 GitHub 可用镜像），解压到 `plugins/iListenAttentively-LseExport/`。它依赖 LeviLamina 与 LegacyRemoteCall。

注意 iListenAttentively 本体需与 LeviLamina 版本匹配（当前 ILA 0.18.0 对应 LeviLamina 26.60.*），可用 `lip install github.com/LiteLDev/iListenAttentively` 安装。LSE 自 0.21.2 起自身依赖 ILA，但脚本直接用 ILA 事件仍需 LseExport。

## 如何在 LeviLamina C++ mod（xmake 项目）中引入 iListenAttentively（ILA）事件库作为依赖？

ILA 包现在已收录在 LiteLDev 的 xmake-repo 里（模板默认已添加的 levimc-repo），在 `xmake.lua` 中：

```lua
add_repositories("levimc-repo https://github.com/LiteLDev/xmake-repo.git")
add_requires("ilistenattentively 0.18.*", {configs = {target_type = get_config("target_type")}})
```

并在 target 里 `add_packages("ilistenattentively")`。版本要与所用 LeviLamina 匹配（ILA `0.18.*` 对应 LeviLamina 26.60.*）。然后执行 `xmake project -y -k compile_commands` 生成补全信息。

另外记得在 mod 的 `manifest.json` 的 `dependencies` 里声明 `{"name": "iListenAttentively"}`，保证加载顺序。

*适用版本：iListenAttentively 0.14.0 及以上，当前 0.18.0 / LeviLamina 26.60.\**

## iListenAttentively 的 LSE 导出插件（iListenAttentively-LseExport）很久没更新，还能用吗？

可以继续使用。LseExport 不需要随 LeviLamina 版本频繁更新：它内置了针对多个 LeviLamina 版本编译的内部二进制，启动时按当前加载器版本自动选择最合适的一份加载，事件则通过 EventBus 按名字动态导出。最新版本为 v0.5.0（仓库仍在维护，2026-11 有提交）。

*适用版本：iListenAttentively-LseExport 0.5.0 及以上*

## iListenAttentively（ILA）为什么没有玩家权限变动事件（`PlayerChangePermissions`）？还能加回来吗？

ILA 在 0.3.0（适配 LeviLamina 1.1.0-rc.1 / BDS 1.21.60）时删除了 `PlayerChangePermissions`（玩家权限变动）事件。原因是 BDS 1.21.60 把相关函数内联了，原来的函数调用变成了直接赋值，没有可以 hook 的函数，所以这个事件加不回来，至今最新版 ILA 也没有该事件。一般来说，BDS 每次更新都可能因为内联丢掉一些函数，依赖这些函数的事件或 API 也会随之被移除。

另外，若只需监听玩家命令权限等级（`CommandPermissionLevel`）的变化，LeviLamina 自身提供 `ll::event::PlayerChangePermEvent`（hook `Player::setCommandPermissions`，可取消，`newPerm()` 返回新等级），可作为替代。

*适用版本：iListenAttentively 0.3.0 及以上（当前最新 0.18.0 仍无此事件）*
