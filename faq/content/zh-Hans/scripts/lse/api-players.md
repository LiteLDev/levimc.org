# LegacyScriptEngine API：玩家

## LSE 中 Player 对象的 `player.name` 和 `player.realName` 有什么区别？该用哪个？

`player.realName` 是玩家的真实名字（取自登录身份中的 Xbox Live 名称，不受插件改名影响）；`player.name` 是玩家对象当前的名字字段，可能被插件/接口（如改名相关 API）修改。做身份识别或显示真实玩家名时用 `realName`；但如果要作为存储玩家数据的键，更推荐使用 `player.uuid`（玩家在 Xbox 改名后 `realName` 也会变）。

*适用版本：当前所有 LSE 版本*

## LSE 中玩家下线后，之前保存的 Player 对象还能调用吗？插件抛出的异常会让服务器退出吗？

不能依赖旧对象。LSE 的 Player 对象内部只持有玩家实体的弱引用，玩家下线后实体被销毁，旧对象的属性/方法会取不到玩家而返回 null/undefined（玩家重进后是新实体，旧对象也不会恢复）。正确做法是保存 uuid/xuid，需要时再用 `mc.getPlayer(...)` 重新获取，并在定时任务等场景中先判断是否为 null 再操作。插件回调中未捕获的异常会被 LSE 捕获并打印错误日志，不会导致服务器退出。

*适用版本：当前 LSE 版本*

## LSE 脚本插件如何给玩家播放声音？

LSE 没有专门的播放声音 API。两种做法：

1. 执行原版 `playsound` 命令，例如 ``mc.runcmd(`playsound random.levelup "${pl.realName}"`)`` 或 `mc.runcmdEx(...)`；
2. 自己用 `BinaryStream` 构造 `PlaySoundPacket` 并 `createPacket` 后用 `pl.sendPacket(packet)` 发送，可参考 NBSPlayer 的实现：<https://github.com/lgc-LLDev/NBSPlayer/blob/master/src/player.ts#L52-L73>。

能用命令解决的话命令更简单，发包更灵活（不刷命令输出），两种方式都可行。

*适用版本：LeviLamina 上的 LegacyScriptEngine 当前所有版本*

## LSE 中传送/构造坐标时的维度参数填什么？文档写的 `[dimid]` 是要传数组吗？

文档中的方括号表示可选参数，不是数组，维度 ID 直接填数字：0 = 主世界，1 = 下界，2 = 末地。`IntPos`/`FloatPos` 由 x、y、z、`dimid` 组成，如 `new IntPos(0, 64, 0, 0)` / `new FloatPos(0.5, 64, 0.5, 0)`，然后用 `pl.teleport(pos)` 或 `pl.teleport(x, y, z, dimid)` 传送。

*适用版本：当前所有 LSE 版本*

## LSE 中如何让玩家在生存模式下飞行？用 `pl.getNbt()` 改 `abilities.mayfly` 再 `pl.setNbt()` 写回为什么不生效？

直接改玩家 NBT 的 `abilities` 不会生效。请使用 Player 的 `setAbility` 接口：`pl.setAbility(AbilityID, value)`，`AbilityID` 为 Integer，`value` 为 Boolean 表示是否开启；允许飞行（mayfly）对应的 ID 为 10（`AbilitiesIndex::MayFly`），例如 `pl.setAbility(10, true)`。调用后会同步能力数据给客户端，立即生效。

*适用版本：当前所有 LSE 版本*

## LSE JS 插件里调用 `player.sendToast` 报参数错误或没效果，且字符串里的 `${变量}` 没有被替换，怎么写？

`sendToast` 必须同时传两个字符串参数：标题和内容，即 `player.sendToast(title, message)`，少传会报参数错误。另外 JS 中只有反引号 `` ` `` 包起来的模板字符串才会解析 `${}`，用单/双引号时 `${}` 会被当作普通文本，应写成例如 ``player.sendToast("提示", `欢迎 ${player.realName}`)``。

*适用版本：LegacyScriptEngine 当前所有版本*

## LSE JS 插件中如何给所有在线玩家定时刷新侧边栏？

侧边栏是 Player 对象的方法（`player.setSidebar`），不是全局方法，要给所有人设置就需遍历在线玩家；内容需定时刷新。不必放在 `onTick` 里，用 `setInterval` 即可，例如：

```js
setInterval(() => {
  for (const player of mc.getOnlinePlayers()) {
    player.setSidebar(title, data);
  }
}, 毫秒);
```

也可用 `mc.getOnlinePlayers().forEach(...)`。另建议在玩家进服时初始化一次。

*适用版本：LegacyScriptEngine 当前所有版本（原为 LLSE）*

## LSE 插件中如何获取某玩家周围一定半径内的玩家？用 `execute` 命令 + 正则解析输出的方式经常报错。

尽量不要用命令实现，直接遍历在线玩家按距离过滤：

```js
let plnames = mc.getOnlinePlayers().filter(player => player.distanceTo(pl) < R).map(player => player.realName);
```

其中 `pl` 为中心玩家，`R` 为半径（方块）。`distanceTo` 可接受 Entity/Player/IntPos/FloatPos；不在同一维度时返回整数最大值，因此会被自然过滤掉。如不想包含中心玩家本人，可再加 `player.xuid !== pl.xuid` 之类的判断。

## LSE JS 中想维护一个在线玩家列表，玩家退出后用 `list.filter` 删除却删不掉，怎么写？

`Array.prototype.filter` 不会修改原数组，必须把结果重新赋值：

```js
let list = [];
mc.listen("onJoin", player => { list.push(player.realName); });
mc.listen("onLeft", player => { list = list.filter(name => name !== player.realName); });
```

也可以不自己维护，直接用 `mc.getOnlinePlayers()` 获取当前在线玩家，例如在 `onLeft` 时写入 JsonConfigFile：`config.set("players", mc.getOnlinePlayers().map(p => p.realName).filter(n => n !== player.realName))`（`onLeft` 触发时离开的玩家可能仍在在线列表中，需要手动过滤掉）。

*适用版本：当前版本（JS 引擎）*

## LSE JS 插件中如何获取当前所有在线玩家的名字列表（例如存进 json）？

用 `mc.getOnlinePlayers().map(player => player.realName)` 得到在线玩家真实名字数组，再写入 json（如 JsonConfigFile 的 `set`）。向数组添加元素用 `push`。

*适用版本：当前版本（JS 引擎）*

## LSE JS 插件里想把玩家坐标用 `pl.tell` 发给玩家，直接传 `pl.pos` 报错/获取不到坐标，该怎么写？

`pl.pos` 返回的是坐标对象（FloatPos），而 `pl.tell` 的第一个参数要求是字符串，直接传对象会因参数类型检查失败而报错。发送前用 `pl.pos.toString()` 转成字符串（或用模板字符串 `` `${pl.pos}` ``），也可以自己拼接 `pl.pos.x` / `pl.pos.y` / `pl.pos.z` / `pl.pos.dimid`。

## LSE 中 `pl.addEffect()` 如何给玩家添加无限时长的效果？

`pl.addEffect(id, tick, level, showParticles)` 的持续时间参数传 `-1`，可得到无限时长效果（与原版 `/effect ... infinite` 相同）。此行为取决于 BDS 原版对 `-1` 时长的处理。

*未能从源码或文档中直接证实，仅供参考。*

## LSE 中 `pl.getScore()` 在计分板项不存在时会报错，有什么处理办法？

这是设计行为，文档也写明“使用前必须保证对应的计分项已经存在”，官方无意修改。可以自己封装：先用 `mc.getScoreObjective(name)` 检查计分项是否存在，不存在时用 `mc.newScoreObjective(name, displayName)` 创建或直接返回 0；或用 `try/catch` 包住 `pl.getScore()`。也可以改用第三方前置（如 GMLIB）提供的计分板接口。

## LSE 中 `pl.isOp()` 报错不存在，判断玩家是否为 OP 的 API 是什么？

LSE 的 API 名是 `pl.isOP()`（OP 全大写），`isOp` 是错误写法，JS 区分大小写。

## LSE 中 `player.isSurvival` 对冒险模式的玩家也返回 true，如何准确判断玩家游戏模式？

`pl.isSurvival` 直接调用 BDS 的 `Actor::isSurvival()`，其语义由原版决定，不宜用来区分生存/冒险。要精确判断请用 `pl.gameMode`（数值，对应 GameType：0 生存、1 创造、2 冒险、6 旁观），例如 `if (pl.gameMode === 2) { /* 冒险 */ }`；也可以直接用 `pl.isAdventure` 判断是否为冒险模式。

## LSE 中 `setBossBar` 的颜色参数有哪些取值？

`pl.setBossBar(uid, title, percent, colour)` 的 `colour` 是整数，直接转换为 BDS 的 BossBarColor 枚举：0 粉色（Pink）、1 蓝色（Blue）、2 红色（Red）、3 绿色（Green）、4 黄色（Yellow）、5 紫色（Purple）、6 深紫色（RebeccaPurple）、7 白色（White）。例如 `pl.setBossBar(1145141919, "Hello", 80, 2)` 显示红色血条。

## LSE 中如何可靠地获取玩家召唤的假人或指定名字的玩家？`mc.getPlayer(name)` 有什么坑？

`mc.getPlayer(name)` 对名字是不区分大小写的前缀匹配：完全相等的名字优先，否则返回名字以该字符串开头且最短的玩家，所以可能拿到别的玩家。获取后应判断返回对象的 `name` 是否与目标名字完全相等。更可靠的做法是保存并使用 UUID 或 XUID 查找（`mc.getPlayer` 也接受 UUID/XUID/UniqueId/RuntimeId）。给假人名称加一个玩家无法使用的前缀/标记也可以防止冲突。

## LSE 中想让 Boss 血条（bossbar）持续刷新，写成 `setInterval(player.setBossBar(...), 500)` 却只执行一次或提示 player 未定义，正确写法是什么？

`setInterval` 的第一个参数必须是函数，写成 `setInterval(player.setBossBar(...))` 只会立即执行一次 `setBossBar` 并把返回值当参数。应传匿名函数，并保存 `setInterval` 返回的 id，在 Boss 死亡时 `clearInterval`。

不要长期持有 player / entity 等 mc 对象，应保存 xuid，在定时器里用 `mc.getPlayer(xuid)` 重新获取并判空。示例：

```js
let players = [];
mc.listen("onAttackEntity", (pl, en) => {
  if (!en.hasTag("boss")) return;
  if (!players.includes(pl.xuid)) players.push(pl.xuid);
});
const timer = setInterval(() => {
  for (const xuid of players) {
    const p = mc.getPlayer(xuid);
    if (!p) continue;
    p.setBossBar(bossId, "名称", Math.floor(boss.health / boss.maxHealth * 100), 2);
  }
}, 500);
```

Boss 死后 `clearInterval(timer)`，并对玩家调用 `removeBossBar(bossId)`。`setBossBar` 参数为 `(uid, title, percent 0~100, colour)`。若要给附近所有玩家显示，可遍历 `mc.getOnlinePlayers()` 按距离筛选。

*适用版本：LSE 当前所有版本*

## 在 LSE 脚本中注册玩家 PAPI（PlaceholderAPI）变量时，怎样接收额外参数？文档只有服务器 PAPI 的示例，回调参数里只有玩家对象。

在注册玩家变量的回调里，玩家对象后面再加一个参数就能收到额外参数，回调写成 `(pl, param) => {...}`。补全和类型声明可能还没跟上，以 PAPI 插件实际传入的内容为准。不确定时可以先把 `param` 用 `log` 打出来看结构。

此功能依赖安装了第三方 PlaceholderAPI 插件（提供 `registerPlayerPlaceholder` 的 LSE 绑定）。

*适用版本：安装了第三方 PlaceholderAPI 插件的环境。未能从源码或文档中直接证实，仅供参考。*

## 在 LSE 中，玩家切换维度时怎样判断玩家已经加载完毕？

可以读玩家对象的 `pl.isLoading` 属性（表示玩家是否正在加载）。在 `onChangeDim` 事件里用 `setInterval` / `setTimeout` 轮询，直到它变成 `false` 再做后续操作。切换维度期间读到的不少玩家属性可能是 `undefined`，要做空值判断。

注意从末地返回传送门回到主世界时不会触发 `onChangeDim`。

*适用版本：LSE 0.23.x。未能从源码或文档中直接证实，仅供参考。*

## 在 LSE 中用 `pl.rename(newName)` 改了玩家头顶名字后，`pl.name` 拿到的仍然是真名。有没有办法获取玩家头顶显示的名字（nametag）？

`pl.rename` 实际改的是玩家的 NameTag，而 `pl.name` / `pl.realName` 返回的是玩家原名，不会变。LSE 0.19.1 起新增了 `en.getCustomName()`，它返回实体的 NameTag，所以可以用 `pl.toEntity().getCustomName()` 拿到头顶显示的名字。

如果还要维护“真名到假名”的映射或做重名检查，仍建议在调用 `rename` 时自己记录 uid、真名、假名的对应关系（文件或数据库），需要时用 `data.getAllPlayerInfo()` 拿到所有玩家信息再比对。

0.19.1 之前的版本只能自行记录。

*适用版本：LSE 0.19.1 及以上*

## 在 LSE 中用 `pl.setBossBar` 给玩家设置 BossBar 时，要传的 uid 应该填什么？

BossBar 的原理是给该玩家发一个假实体（AddActor）再发 BossEvent 包，uid 就是这个假实体的 ID，随便填一个不冲突的数字即可（负数也可以），同一个 uid 对应一行 BossBar，`removeBossBar(uid)` 时用同一个值。

不要填已存在实体的 `uniqueId`：LSE 不做判断，会导致该实体在客户端被假实体替换而消失。

*适用版本：LSE 0.23.x*

## 在 LSE 插件中怎样向全服玩家发送广播或通报消息？

可以用 `mc.broadcast(msg[,type])`（`type` 默认为 `0` 普通消息，`1` 为聊天，`5` 为物品栏上方的 Tip，`9` 为 JSON）。也可以遍历在线玩家逐个发：`mc.getOnlinePlayers().forEach(pl => pl.tell(msg))`。还可以用 ``mc.runcmd(`say ...`)`` 或 `tellraw` 命令。

注意用 `say` 时消息会带上 `[服务器]` 之类的前缀（随 `server.properties` 的 `language` 变化）。

*适用版本：LSE 0.23.x*

## LSE 插件中给玩家显示标题、向全服广播消息时，用执行 `title` / `say` 命令的方式合适吗？

不建议用 `mc.runcmd` 执行 `title` / `say` 命令，LSE 有现成接口：给玩家显示标题用 `pl.setTitle(content[, type[, fadeInTime, stayTime, fadeOutTime]])`，全服消息用 `mc.broadcast(msg[, type])`。有接口就优先用接口。

*适用版本：LSE 当前所有版本（含 v0.23.1）*

## LSE 有没有判断玩家是否处于爬行 / 游泳状态的 API？

有。`player.isSwimming` 和 `player.isCrawling` 属性，LSE 0.19.1 起提供。

*适用版本：LSE 0.19.1 及以上*

## LSE 的 TypeScript 类型定义里，`mc.getPlayer` 拿到的玩家对象没有模拟玩家（`SimulatedPlayer`）的方法，怎么调用模拟玩家 API？

类型定义中 `mc.getPlayer` 返回 `Player`，而 `SimulatedPlayer` 继承自 `Player`（`declare class SimulatedPlayer extends Player`）。运行时模拟玩家的 `simulateXxx` 方法本来就挂在玩家对象上，只是类型不匹配。可先用 `player.isSimulatedPlayer()` 判断，确认后手动断言 `(player as SimulatedPlayer)` 再调用；也可以用 `// @ts-ignore` 绕过类型检查。通过 `mc.spawnSimulatedPlayer` 创建时返回的直接就是 `SimulatedPlayer` 类型。

*适用版本：当前版本（使用 `legacy-script-engine-api` 类型定义的 LSE TS 插件）*

## LSE 脚本中 `pl.xuid` 返回空值是什么原因？

检查 `server.properties` 中的 `online-mode`：离线模式下玩家没有经过 Xbox 验证，没有 XUID，`pl.xuid` 会为空字符串。另外若通过远程调用（`ll.exports` / `ll.imports`）在插件间传递玩家，需确认传入的确实是 `Player` 对象，而不是普通 `object`。

*未能从源码或文档中直接证实，仅供参考。*

## LSE 脚本插件中玩家死亡复活后无法移动（手机端摇杆消失），控制台也没有报错，可能是什么原因？

这类问题一般是插件自身逻辑错误，引擎不会报错。常见原因有两个：一是玩家死亡后插件仍在持续设置玩家血量（如 `setHealth`），导致玩家状态异常；二是在 `onMobHurt` 事件回调里又对玩家造成伤害（如 `hurt`），伤害会再次触发 `onMobHurt`，形成无限递归或死循环。排查并修正这些逻辑即可，例如在回调中判断玩家是否已死亡，避免在 `onMobHurt` 内直接再次造成伤害，或加重入标记。

*适用版本：当前版本（属于脚本逻辑问题）。未能从源码或文档中直接证实，仅供参考。*

## 卸载了修改最大血量的模组/插件后，玩家最大血量仍不是默认值，怎么在服务器后台直接把某玩家最大血量改回 20？

在服务端控制台用 LSE 的脚本调试命令执行：

```shell
jsdebug mc.getPlayer('玩家名').setMaxHealth(20)
```

即可把该玩家最大血量恢复为 20。注意调试命令随后端不同：QuickJS 后端为 `jsdebug`，Node.js 后端为 `nodejsdebug`，Lua 为 `luadebug`，Python 为 `pydebug`。

*适用版本：LeviLamina + LSE（对应脚本后端已安装）*

## 在 LSE 中读取玩家背包等物品数据，玩家 NBT 里有哪些相关的键？

这些键都在玩家 NBT 的根目录下：`Armor`（盔甲栏）、`Inventory`（背包栏）、`Offhand`（副手栏）、`PlayerUIItems`（光标处与合成栏等 UI 物品）。在线玩家更推荐直接用 `pl.getInventory()`/`pl.getArmor()` 等容器接口；离线玩家可用 `mc.getPlayerNbt(uuid)` 读取 NBT 后取这些键。

*适用版本：LeviLamina + LegacyScriptEngine（键名取决于 BDS 原版存档格式）。未能从源码或文档中直接证实，仅供参考。*

## 如何修改玩家的飞行速度（LSE 插件）？

LSE 没有直接设置飞行速度的 API（`player.setAbility` 只能设置布尔型能力）。可以通过 `player.getNbt()` 取得玩家 NBT，修改 `abilities` 下的 `flySpeed` 字段（默认 `0.05f`），再用 `player.setNbt(nbt)` 写回。有用户反馈，修改后可能需要玩家重新进入游戏才会生效。

*适用版本：LSE（LeviLamina）当前版本（`flySpeed` 字段属于 BDS 原版玩家 NBT 结构）。未能从源码或文档中直接证实，仅供参考。*

## 如何在服务器控制台快速查看某个在线玩家的 UUID（用于查找该玩家的数据文件）？

在控制台执行 LSE 的调试命令（QuickJS 引擎）：`jsdebug mc.getPlayer('玩家名字').uuid`。注意玩家必须在线才能通过 `mc.getPlayer` 获取。

*适用版本：当前版本（需 QuickJS 引擎）*

## 插件开发中有没有获取玩家在线时长/游玩时长的 API？

LSE/LeviLamina 没有直接提供游玩时长 API，基岩版 BDS 本身也不存储玩家的游玩时长（玩家 NBT 里的 `Age` 不是这个）。需要插件自己在玩家进服（`onJoin`）/退服（`onLeft`）时记录时间并累计保存；或者直接安装现成的在线时长插件。

*未能从源码或文档中直接证实，仅供参考。*

## 有没有办法让基岩版服务器的最大玩家数动态变化：没人时 `maxplayers` 为 1，每进一个人就加一？

用 LSE 的 JS 插件几行就能实现：

```js
setInterval(() => mc.setMaxPlayers(mc.getOnlinePlayers().length + 1), 1000);
```

也可以使用现成第三方插件 DynamicPlayerLim（<https://www.minebbs.com/resources/dynamicplayerlim-tps.5414/>），除了让上限=在线人数+1，还能在 TPS 过低时阻止玩家进入（原为 LL2 插件，兼容性需自行测试）。

*适用版本：LegacyScriptEngine 当前版本*

## 服务器里如何隐藏玩家头顶的游戏 ID（名字），命令方块能做到吗？

命令方块无法实现，只能用插件：最简单的方法是把玩家重命名为空字符串（LSE 的 `player.rename("")`）；或者拦截发给客户端的数据包，把显示玩家名称的属性改为 `false`。

*适用版本：LegacyScriptEngine 当前版本*

## 服务器里突然有玩家莫名其妙获得 OP，如何快速查看 `permissions.json` 里有哪些 OP 玩家、排查是否有插件后门？

可以在后台用 LSE 的 `jsdebug` 执行下面的命令，把 `permissions.json` 中的 xuid 转成玩家名输出：

```text
jsdebug JSON.parse(File.readFrom("permissions.json")).map(item => data.xuid2name(item.xuid)).join(", ")
```

若列表正常，需要检查插件是否有后门：LSE 插件执行设置权限等敏感操作（如 `setPermLevel`）时会被记录到 `logs/LegacyScriptEngine/Sensitive_Operation_Records-<后端>.log`（如 JS 后端为 `Sensitive_Operation_Records-Js.log`，另有 Lua/NodeJs/Python），格式为 `[操作]<插件名> 内容`，可在其中查找相关记录。

*适用版本：LegacyScriptEngine 当前版本*

## 能否在 LSE 中给玩家改名（不通过 Xbox 付费改名）？

可以使用玩家对象的 `rename` 方法：JS 中 `pl.rename("Steve")`，Lua 中 `pl:rename("Steve")`，返回是否成功（`Boolean`）。临时改名可在控制台用 QuickJS 引擎的调试命令 `/jsdebug` 执行 `mc.getPlayer("玩家原名").rename("新名字")`（Node.js 引擎对应命令为 `nodejsdebug`）。这只是服务器内显示名，不会修改玩家的 Xbox 账号名。

*适用版本：LSE 当前所有版本*

## 升级到新版后，玩家无法破坏方块、无法丢弃物品（但能打开箱子），是什么原因？

原因是插件调用 `pl.setAbility(AbilityID, value)` 时使用的数字索引与当前 BDS 的 `AbilitiesIndex` 枚举不一致（LSE 直接把数字转换为 `AbilitiesIndex`），旧插件按旧索引设置，结果关掉了挖掘等能力。需按当前枚举修改插件，当前映射为：`Build=0`、`Mine=1`、`DoorsAndSwitches=2`、`OpenContainers=3`、`AttackPlayers=4`、`AttackMobs=5`、`OperatorCommands=6`、`Teleport=7`、`Invulnerable=8`、`Flying=9`、`MayFly=10`、`Instabuild=11`、`Lightning=12`、`FlySpeed=13`、`WalkSpeed=14`、`Muted=15`、`WorldBuilder=16`、`NoClip=17`、`PrivilegedBuilder=18`、`VerticalFlySpeed=19`。BDS 更新可能再次改变枚举。若能力已被写入关不掉，可把玩家切到别的游戏模式再切回生存来重置能力。
