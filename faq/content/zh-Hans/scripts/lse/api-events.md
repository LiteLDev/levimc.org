# LegacyScriptEngine API：事件

## LSE 能注销（取消监听）通过 `mc.listen` 注册的事件监听器吗？怎么实现取消监听？

LSE 的脚本 API 没有注销监听的接口：`mc.listen(event, callback)` 只返回一个表示是否注册成功的 Boolean，不返回可以用来移除的句柄。插件被卸载或重载时，LSE 会自动清除该插件注册的全部事件监听器。

如果需要在运行时取消监听，可以在脚本里自己包装一层：对每个事件只调用一次 `mc.listen`，回调里把事件分发给自己维护的处理函数列表，需要取消时从列表中删掉对应的处理函数即可。

（LeviLamina 的 C++ EventBus 提供 `removeListener`，C++ mod 可以直接移除监听器。）

*适用版本：当前所有 LSE 版本*

## LSE 中 `onAttackEntity` 事件的回调还提供 `damage`（伤害值）参数吗？

不提供。LSE 的 `onAttackEntity` 回调原型为 `function(player, entity)`，LL2 时代的 `damage` 参数已删除，请以 LSE 文档为准；回调返回 `false` 可拦截攻击。

*适用版本：LSE 所有版本（LeviLamina 时代）*

## LSE 中用 `onUseItem` 实现“手持物品右键打开菜单/释放技能”，为什么 PC（Win10）端右键一次会触发很多次？该监听哪个事件？

对空气使用物品应监听 `onUseItem`（对方块使用才是 `onUseItemOn`）。PC 端按住/点击右键时 `onUseItem` 会连续触发多次，需要自己做防抖/冷却：按玩家记录上次触发时间（如 `Map<xuid, timestamp>`），短时间内（如 200~500ms）的重复触发直接忽略，可参考 CMenu 等菜单插件的实现。移动端右键对应长按。也可以配合 `onAttackEntity`（左键攻击实体）等事件组合实现技能。

*适用版本：LSE 当前版本*

## LSE 中如何禁止活塞推动指定方块（如箱子、漏斗），防止领地外活塞把方块推进/推出领地？

监听 `onPistonTryPush` 事件，回调 `function(pistonPos, block)` 返回 `false` 即可拦截。例如：

```js
mc.listen('onPistonTryPush', (pistonPos, block) =>
  ["minecraft:chest", "minecraft:hopper"].includes(block.type) ? false : true);
```

领地插件可用 `block.pos` 判断被推方块是否在领地内。早期 LSE 曾有该事件回调中方块坐标错误（都是活塞自身坐标）导致领地插件失效的 bug（issue #137），已在 LSE 0.7.12 修复。注意活塞被阻挡无法推动时该事件会循环触发。

*适用版本：LSE 0.7.12 及以上*

## LSE 脚本插件如何实现耕地防踩？`onFarmLandDecay` 事件还能用吗？

可以。监听 `"onFarmLandDecay"`（耕地退化）事件，回调原型 `function(pos, entity)`：`pos` 为退化耕地的坐标（`IntPos`），`entity` 为造成退化的实体（`Entity`）。回调返回 `false` 即可拦截，耕地不会变回泥土。例：

```js
mc.listen("onFarmLandDecay", (pos, entity) => false);
```

注意该事件可能会被多次触发，回调里不要做开销大的操作；如只想保护特定区域/特定实体，可根据 `pos`、`entity` 自行判断。

*适用版本：LegacyScriptEngine 0.23.x；旧 LiteLoaderBDS 2.x LLSE 同样适用*

## LSE 中 `mc.listen` 的回调参数是按名字还是按顺序传入的？例如 `mc.listen("onCmdBlockExecute",(pos,cmd)=>{log(cmd)})` 输出的却是指令而不是坐标。

按顺序传入。监听事件相当于 LSE 调用你插件里的函数，LSE 只按文档中该事件监听函数原型的固定参数顺序传参，不会理会你起的变量名。`onCmdBlockExecute` 的原型是 `function(cmd, pos, isMinecart)`，所以第一个参数是指令字符串、第二个是坐标（FloatPos）、第三个表示是否为命令方块矿车。变量名可以随意，但建议按文档原型命名：

```js
mc.listen("onCmdBlockExecute", (cmd, pos, isMinecart) => { log(cmd, pos); })
```

## LSE 中 `onBlockExploded` 事件是否包含凋灵破坏方块（`onWitherBossDestroy`）？

不包括。凋灵本体破坏方块是单独的事件，需要监听 `onWitherBossDestroy`（原型 `function(witherBoss, AAbb, aaBB)`，可拦截）；`onBlockExploded`（原型 `function(block, source)`）只针对爆炸破坏的方块。

*未能从源码或文档中直接证实，仅供参考。*

## LSE 中 `onDestroyBlock` 无法监听挖掘基岩等不可破坏方块，如何监听玩家对这类方块的挖掘/攻击？

`onDestroyBlock`（玩家破坏方块完成）只在方块真正被破坏时触发，基岩、末地门框架等不可破坏方块不会触发。要监听玩家对这类方块的敲击，可使用 `onAttackBlock`（原型 `function(player, block, item)`）或 `onStartDestroyBlock`（原型 `function(player, block)`），两者在当前版本都基于玩家攻击方块事件，返回 `false` 可拦截；在回调里自行实现“可破坏”逻辑（例如 `mc.setBlock` 设为空气并掉落物品）。

如果遇到事件不触发的问题，请在 GitHub issue 中附上可复现的文字代码。

*适用版本：当前版本（0.23.x）*

## LSE 中 `onPlayerDie` 事件如何判断伤害来源是否为玩家，并给击杀者在计分板上加分？

`onPlayerDie` 的原型是 `function(player, source)`，`source` 是伤害来源实体（Entity，可能为 `null`）。先判断 `source` 存在且是玩家，再用 `toPlayer()` 转为 Player 对象后操作计分板；Entity 对象没有 `addScore` 等计分板方法。示例：

```js
mc.listen("onPlayerDie", (pl, src) => { if (src && src.isPlayer()) { src.toPlayer().addScore("kills", 1); } });
```

计分项需事先存在。

## LSE 中事件回调（如 `onPreJoin`）能否异步执行？在事件里执行异步代码有问题怎么处理？

事件回调由 LSE 同步调用，只有回调同步返回的 `false` 才会拦截事件。回调里可以用 Promise/`then` 或把回调写成 `async` 函数来做异步工作（Node.js 后端每 tick 会驱动事件循环和微任务），但 `async` 函数返回的是 Promise 而不是 `false`，`await` 之后再 `return false` 也无法拦截——需要拦截的判断必须在同步部分完成。

`onPreJoin` 中需要给玩家附加数据时，也可以自己用一个按玩家名/xuid 索引的对象存储，不一定要用 `setExtraData`。

## LSE 中如何拦截事件？为什么用 `mc.listen("onPlayerPullFishingHook", (player,entity,item) => { fishingHookEvent(player,entity,item) })` 并在 `fishingHookEvent` 里 `return false` 拦截不生效？

LSE 事件回调返回 `false` 即拦截事件（并非所有事件都支持拦截，以文档中标注“拦截事件：函数返回false”为准；`onPlayerPullFishingHook` 支持拦截）。上面的写法外层箭头函数用了大括号却没有 `return`，内层函数的返回值没有传出去。应写成：

```js
mc.listen("onPlayerPullFishingHook", (player,entity,item) => { return fishingHookEvent(player,entity,item); });
```

或直接：

```js
mc.listen("onPlayerPullFishingHook", (player,entity,item) => false);
```

## LSE 中如何拦截凋灵生成时的大爆炸？`onBlockExploded` / 爆炸事件 `return false` 拦截不了。

`onBlockExploded`（方块被爆炸破坏）只是方块被炸毁时的通知，文档标注“不可以拦截”，`return false` 无效。要拦截爆炸本身应监听 `onEntityExplode`（由实体引起的爆炸，凋灵生成爆炸的来源是凋灵实体）或 `onBlockExplode`（由方块引起的爆炸）并返回 `false`。

LSE 0.21.2 起这两个事件改由 iListenAttentively 提供，底层 hook 的是 `Explosion::explode`，所有爆炸都会经过并可取消。如需更细粒度控制，也可在原生（C++）插件中直接使用 iListenAttentively 的 `ila::mc::ExplosionBeforeEvent`。

*适用版本：LSE 0.21.2 及以上（依赖 iListenAttentively）*

## LSE 中对玩家调用 `player.kick()` 会触发 `onLeft` 事件吗？

会。`player.kick()` / `disconnect()` 内部调用 `Player::disconnect` 断开连接，而 `onLeft` 基于 LeviLamina 的 `PlayerDisconnectEvent`（hook `ServerPlayer::disconnect`），因此 kick 玩家也会触发一次 `onLeft`。若在 `onLeft` 中清理玩家临时数据需注意这一点（服务器关闭过程中不会触发 `onLeft`）。

*适用版本：LSE 当前版本*

## LSE 插件中如何实现玩家对黑曜石使用物品（如桶）时把黑曜石变成岩浆？

监听 `onUseItemOn` 事件（回调 `function(player, item, block, side, pos)`），判断方块类型后用 `mc.setBlock` 替换：

```js
mc.listen('onUseItemOn', (player, item, block) => {
  if (block.type === 'minecraft:obsidian' && item.type === 'minecraft:bucket') {
    mc.setBlock(block.pos, 'minecraft:lava', 0);
  }
});
```

可按需去掉对手持物品（桶）的判断。注意：Win10 客户端右键可能在服务端连续多次触发该事件。

*适用版本：LSE 当前所有版本（含 v0.23.1）*

## LSE 插件中如何拦截玩家使用烟花等物品对方块使用的行为？

监听 `onUseItemOn` 事件（`mc.listen("onUseItemOn", (player, item, block, side, pos) => {...})`），在回调中按 `item.type`（如 `"minecraft:firework_rocket"`）判断后返回 `false` 即可拦截。

*适用版本：LSE 当前所有版本（含 v0.23.1）*

## LSE 插件中想阻止苦力怕爆炸破坏方块，写 `mc.listen("onEntityExplode", (entity)=>{ if(entity === creeper) return false; })` 不生效，应该怎么写？

`onEntityExplode` 回调原型是 `function(source, pos, radius, maxResistance, isDestroy, isFire)`，第一个参数是实体对象，不能直接和名字比较，要用 `source.type` 取命名空间 ID：`if (source.type == "minecraft:creeper") return false;`。但在 `onEntityExplode` 中 `return false` 会拦截整个爆炸（不造成伤害也不破坏方块）。

如果只想让爆炸不破坏方块：

- 在服务器行为包中覆盖苦力怕实体定义（`creeper.json` 里 `minecraft:explode` 组件的 `breaks_blocks` 设为 `false`）；
- 或关闭游戏规则 `mobGriefing`（会影响所有生物破坏行为）；
- 或使用现成的防爆插件。

`onBlockExploded` 事件不可拦截，不能用它来阻止方块被炸。

*适用版本：LSE 当前所有版本（含 v0.23.1）*

## LSE 插件在 `onChat` 中 `return false` 拦截了聊天，但聊天消息仍会输出两遍 / 仍能发出原版样式消息，是什么原因？

LSE 的事件拦截只是取消原版行为，不影响其他插件监听到同一事件；LSE 事件没有优先级，也不支持修改事件参数（`onChat` 回调只拿到 `player` 和 `msg` 字符串）。很多聊天插件会拦截后再按自己的格式重新发送一遍，因此多个聊天插件容易冲突，这种情况通常是另一个聊天插件拦截后又按原版样式重发导致的。

解决：排查并卸载冲突的聊天插件；若需要多个插件依次修改聊天内容，可考虑基于 iListenAttentively 的第三方 LSE 扩展（如 ila-lse，事件参数通过 NBT 传递、可修改）。

*适用版本：LSE 当前所有版本（含 v0.23.1）*

## LSE 插件里通过发包创建的假容器（假箱子 GUI），玩家关闭时不会触发 `onCloseContainer` 事件，怎么监听关闭？

`onCloseContainer` 只在玩家关闭真实存在的容器方块时触发；发包生成的假容器在服务端没有对应容器方块，因此不会触发。

需要 hook 服务端处理客户端 ContainerClosePacket 的函数（`ServerNetworkHandler::handle(NetworkIdentifier const&, ContainerClosePacket const&)`）来获取关闭事件，可用原生（C++）mod 实现，或使用提供数据包事件的第三方前置（如 GMLib）。LegacyRemoteCallApi 本身不提供事件。

## LSE 的 `onBlockChanged`（方块变化）事件能否通过 `return false` 拦截？LeviLamina C++ 中呢？

不能。LSE 的 `onBlockChanged` 是方块已经改变后触发的，不可拦截（文档标注“拦截事件：不可以拦截”）。LeviLamina 的 `ll::event::BlockChangedEvent` 同样不是可取消事件，C++ 中也没有直接拦截方式，只能在方块变化后再把方块设置回原状态，或自行 hook 具体的方块修改来源（如玩家放置/破坏用对应的可拦截事件 `onPlaceBlock`、`onDestroyBlock`）。

*适用版本：当前版本（LSE / LeviLamina）*

## LSE 的 `onHopperPushOut` 事件监听不到漏斗之间的物品传递，有没有能监听漏斗间传递的事件？

LSE 只提供 `onHopperSearchItem`（漏斗/漏斗矿车吸取物品）和 `onHopperPushOut`（漏斗输出物品）两个漏斗事件，iListenAttentively 也没有漏斗相关事件，没有专门的“漏斗间物品传递”事件。需要的话可以写 C++ mod 自行 hook：LSE 本身 hook 的是 `Hopper::_tryPullInItemsFromAboveContainer`（从上方容器吸入）、`Hopper::_pushOutItems`（向外推送）和 `Hopper::_tryMoveInItem`（实际移动物品），可以参考这些函数；涉及漏斗矿车时还需特殊处理其碰撞箱。

*适用版本：LSE 0.23.x；iListenAttentively 当前版本*

## LSE 的 `onMobHurt` 回调里的 `damage` 不是实体实际受到的伤害（无敌帧内的攻击也被计入）？

是的。`onMobHurt` 在 `Mob::_hurt` 执行原逻辑之前触发，给出的是传入的原始伤害值，没有经过护甲、附魔、药水抗性、无敌帧等计算，所以无敌帧内的攻击也会触发并带有伤害值。`onAttackEntity` 回调只有 `(player, entity)` 两个参数，不提供伤害值。如需实际伤害，需要用 C++ mod 自行 hook 伤害结算后的位置来获取。

## LSE 的 `onMobHurt` 事件中，被骷髅/玩家用弓射出的箭击中时，`source` 参数是射手还是箭？能拿到射手吗？

`onMobHurt(mob, source, damage, cause)` 中，被箭等投射物击中时 `cause` 为 `ActorDamageCause.Projectile`，`source` 为投射物实体（箭）而不是射手。LSE 目前没有获取投射物所有者（owner）的 API，所以无法直接通过该事件拿到射手，需要另想办法（例如借助其他插件/前置库或 C++ mod 提供的接口）。

*适用版本：LSE 0.23.x*

## LSE 脚本插件中，手机触屏玩家“点击屏幕”会触发什么事件？如何监听？

触屏操作对应的事件：长按屏幕触发 `onUseItem`；点击空气相当于攻击（左键），点击方块相当于交互，对方块点击会触发 `onUseItemOn`（相当于右键方块）。单纯点击空气没有对应的使用物品事件。如果要用物品打开菜单，可以改用长按，通过 `mc.listen("onUseItem", ...)` 监听，这样也能避免误触。

*适用版本：当前版本（具体触发行为取决于 BDS/客户端触屏操作方式）。未能从源码或文档中直接证实，仅供参考。*

## LSE 脚本插件卸载时，C++ 侧通过 `executeOnModUnload` 注册的回调不触发，LSE 插件有 `onUnload` 回调吗？

以前 LSE 卸载脚本插件时直接销毁引擎，不会调用 `ll::mod::Mod` 的 `onUnload`，所以 `executeOnModUnload` 监听不到。该问题已由 LSE PR #256（`fix: fix plugin executeOnModUnload`，2025-03-17 合并）修复。脚本侧可以用 `ll.onUnload(func)` 注册插件卸载时执行的清理函数。

*适用版本：包含 PR #256 的 LSE 版本（2025-03 之后发布的版本）及当前最新版*

## LSE JS 插件中有没有服务器关闭时的事件监听？

它不在 `mc.listen` 的事件列表里，而是在“加载相关 API”（`ll` 对象）中：用 `ll.onUnload(func)` 注册插件卸载回调，服务器关闭（插件卸载）时会被调用。该函数需要 LSE 0.9.6 及以上。

*适用版本：LSE 0.9.6 及以上*

## 如何用 LSE 禁止玩家使用某个物品？

监听 `onUseItem` 事件（回调参数 `player, item`），判断 `item.type` 是目标物品后在回调中 `return false` 拦截即可：

```js
mc.listen('onUseItem', (player, item) => { if (item.type === 'minecraft:xxx') return false; });
```

如果是对方块使用物品（右键方块），还需要同时拦截 `onUseItemOn`。

## 如何用 LSE 脚本插件禁止玩家与某些方块交互（例如领地内禁止打开唱片机、潜影盒）？为什么提示消息会刷屏？

监听 `onUseItemOn` 事件（回调参数 `player, item, block, side, pos`），判断 `block.type` 为目标方块时 `return false` 拦截交互。注意 Win10/PC 客户端玩家右键一次会在服务端连续多次触发该事件（文档中有说明），若每次都 `player.tell` 会导致聊天栏刷屏：可以给发消息加防抖（debounce，最好做成与 player 解耦的通用防抖函数），或改为在物品栏上方（actionbar）提示。

## 如何让 LSE 脚本插件在服务器启动完成后自动执行一些命令？

监听 `onServerStarted` 事件并在回调里调用 `mc.runcmd`：`mc.listen("onServerStarted", () => { mc.runcmd("你的命令"); });`，需要执行多条命令就写多个 `mc.runcmd()`。若需要获取命令输出可用 `mc.runcmdEx`。

## 怎么用插件阻止服务器里的液体流动？

监听 LSE 的 `onLiquidFlow` 事件（回调参数 `from: Block, to: IntPos`）并返回 `false` 拦截：

```js
mc.listen('onLiquidFlow', (from, to) => false);
```

也可以写 native mod 去掉液体 tick。

*适用版本：当前版本（该事件依赖 iListenAttentively，随 LSE 一起安装）*

## 想做告示牌锁箱子功能，用 LSE 应该拦截哪些行为？

监听玩家打开容器事件 `mc.listen("onOpenContainer", (player, block) => ...)`（或方块交互 `onUseItemOn`），非主人时 `return false` 拦截；同时还必须拦截漏斗和漏斗矿车从箱子中抽取物品：监听 `onHopperSearchItem`（回调参数 `pos, isMinecart, item`，`return false` 即无法吸取），否则可以用漏斗绕过锁。

*适用版本：LegacyScriptEngine 0.23.x*

## 生物受伤事件（LSE 的 `onMobHurt` / GMLIB-LRCA 的 `onMobHurted`）给出的伤害值是减免前还是减免后的最终伤害？

LSE 自带的 `onMobHurt`（回调 `function(mob,source,damage,cause)`）是 hook `Mob::_hurt` 实现的，`damage` 是传入 `_hurt` 的原始伤害值，即护甲、保护附魔、抗性效果等减免之前的值。

第三方 GMLIB-LRCA 的 `onMobHurted` 据其说明给出的是经过护甲、魔咒、抗性减免之后的值，但它仍不是最终值：处于受击间隔（无敌帧）时实际伤害会归零而事件未计入；攻击创造模式玩家也会触发事件但对方不受伤。需要精确的实际伤害时，可以在事件后（如下一 tick）读取实体血量（或 NBT 中的 `Health`）的前后差值来计算。

*适用版本：当前版本（`onMobHurt`）；GMLIB 部分为第三方插件行为。未能从源码或文档中直接证实，仅供参考。*

## 用 LSE 脚本如何禁止玩家修改告示牌？

LSE 没有专门的告示牌编辑事件。可以监听 `onUseItemOn`（或 `onBlockInteracted`），判断目标方块为告示牌（`block.type` 包含 `sign`）时 `return false` 拦截交互，从而阻止打开编辑界面。若要拦截客户端发来的告示牌编辑数据包，纯 LSE 没有收包拦截事件，需要借助 iListenAttentively 等扩展或用 C++ mod 实现。

*适用版本：LSE 当前版本。未能从源码或文档中直接证实，仅供参考。*

## 用 LSE 写插件时如何检测玩家在铁砧中重命名/输入的内容？`onOpenContainerScreen` 能触发但 `onContainerChange` 对铁砧无效。

纯 LSE API 无法实现，铁砧不属于普通容器，LSE 也没有铁砧重命名事件。需要依赖 iListenAttentively（ila）以及其 LSE 导出插件 iListenAttentively-LseExport（ila-lseexport，<https://github.com/MiracleForest/iListenAttentively-LseExport>），通过监听其导出的底层事件实现；或者直接用 C++ 写原生 mod。

*适用版本：LSE 当前版本*

## LSE JS 插件在 `onBlockExplode` 监听器里调用 `mc.explode`（或在获取经验事件里再加经验）导致服务器崩溃/卡死，原因是什么？

这是插件自身造成的死循环：事件回调里调用的 API 会再次触发同一事件（`mc.explode` 会再次触发 `onBlockExplode`，通过 API 加经验也会触发玩家获取经验事件），形成无限递归。LSE 不会区分事件是否由插件自己触发，文档中也有提醒。解决办法：在插件里设一个布尔标志，自己发起爆炸/加经验期间跳过处理，或改用不会重复触发的方式。

*适用版本：LSE 当前所有版本*
