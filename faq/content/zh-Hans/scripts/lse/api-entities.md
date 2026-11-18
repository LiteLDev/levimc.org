# LegacyScriptEngine API：实体

## LSE 中 `pl.hurt(damage[,type[,source]])` 想让伤害来源是另一个玩家，Player 对象能直接传吗？Player 和 Entity 对象有什么区别，怎么把 Player 转成 Entity？

LSE 的 Player 对象（运行时类名 `LLSE_Player`）包含了 Entity 的大部分方法和属性，但它与 Entity 是不同的类型。需要 Entity 参数的接口可以用 `pl.toEntity()` 把玩家转换为实体对象（转换失败返回 `null`），`toEntity` 是早已存在的 API。

当前版本中 `pl.hurt` / `en.hurt` 的 `source` 参数内部同时接受 Entity 和 Player 对象，因此可以直接 `target.hurt(damage, ActorDamageCause.EntityAttack, attackerPlayer)`；也可以传 `attackerPlayer.toEntity()`。若需要走原版伤害计算（盔甲减免等），也可以用命令实现：

```js
mc.runcmdEx(`execute as "<攻击者>" run damage <目标> <数值> entity_attack entity @s`)
```

*适用版本：LSE 0.23.x*

## LSE 中 `entity.hurt()` 需要传整数伤害类型，如何得到枚举值？`onMobHurt` 事件的 `cause` 能直接传给 `hurt()` 吗？

LSE 注册了全局伤害原因枚举对象 `DamageCause`（为兼容同时保留同内容的 `ActorDamageCause`），键为枚举名、值为 int，可直接使用，例如 `pl.hurt(1.0, ActorDamageCause.Fire)` 或 `pl.hurt(1.0, DamageCause.Fire)`；`hurt` 的签名为 `hurt(damage, type?, source?)`。`onMobHurt` 回调的 `cause` 参数就是该枚举的整数值，可直接传给 `hurt()`。枚举定义以 LeviLamina 源码 `src/mc/deps/shared_types/legacy/actor/ActorDamageCause.h` 为准（文档中的枚举表可能不完整）。

*适用版本：当前 LSE 版本*

## LSE 中 `entity.name`/`getName` 获取 Addon 生物名称时拿到的是未翻译的键名（资源包 `zh_CN.lang` 里明明有翻译），如何把实体名翻译成指定语言？

原因是 BDS 自 1.19.80 起改了加载顺序，服务端 I18n 先于资源包加载，因此服务端只加载了原版（vanilla）语言文件，Addon 资源包里的语言文件不会进入服务端 I18n。可选做法：

1. 对原版实体，取实体 `type`（如 `minecraft:zombie`），去掉 `"minecraft:"` 前缀拼成语言键 `entity.<名字>.name`（如 `entity.zombie.name`）再翻译；
2. 安装第三方 GMLIB，其内置的 I18nFix 修正加载顺序（默认不启用，需由 C++ 接口或依赖它的插件开启），或用 GMLIB-LRCA 提供的接口把资源包的 `zh_CN.lang` 手动加载进服务端 I18n，之后 `entity.name` 这类走服务端翻译的接口即可直接返回中文；
3. 自己解析资源包 `.lang` 文件做映射，或用 LSE 自带的 `i18n.load` 加载插件自己的翻译文件再用 `i18n.tr`/`trl` 翻译（注意这是插件自身的翻译系统，不是 BDS 的 I18n）。

*适用版本：BDS 1.19.80 及以后；GMLIB 相关为第三方插件。未能从源码或文档中直接证实，仅供参考。*

## LSE JS 插件中把实体对象作为 Map 键或用 `==` 比较两个实体对象，找不到/不相等怎么办？

LSE 每次返回的实体/玩家对象都是新创建的 JS 包装对象，没有自定义相等比较逻辑，直接用 `==`/`===` 或作为 Map 键比较不会相等。应使用实体的 `uniqueId` 作为键或比较依据，例如 `Boss.find(entity => entity.uniqueId == mob.uniqueId)`。

## LSE 中 `entity.distanceTo()` 接受哪些参数？传入 `pos.x`/`pos.y`/`pos.z` 报参数类型错误/`too few arguments` 怎么办？

`distanceTo` 传 1 个参数时接受 IntPos、FloatPos、Player、Entity（直接传 `player.pos` 这类坐标对象即可，不需要拆成 `.x` `.y` `.z`）；否则必须传 4 个数字参数：`x, y, z, dimid`（只传 3 个会报参数数量错误）。例如：

```js
const pos = player.pos;
if (entity.distanceTo(pos) > R) { /* ... */ }
```

若目标与实体不在同一维度，返回值为一个极大数（`INT_MAX`）。Player 也有同名的 `distanceTo`，另有别名 `distanceToPos`。

## LSE 中判断实体是否玩家，写 `entity.isPlayer` 不加括号为什么总是成立？

`isPlayer` 是函数，要写 `entity.isPlayer()`（和 `pl.isOP()` 一样加括号）。不加括号判断的是函数对象本身，函数存在就恒为真。

## LSE 中如何把实体对象（Entity）转换为玩家对象（Player）？

使用 `en.toPlayer()`；若该实体不是玩家或转换失败则返回 `null`，可先用 `en.isPlayer()` 判断。该 API 在文档“实体对象（Entity）”页面中，也可在 legacy-script-engine-api 仓库的 d.ts 类型定义（`GameAPI/Entity/Entity.d.ts`）里查到。反方向可用 `pl.toEntity()`。

## 在 LSE 中怎样做到玩家右键（交互）或左键（攻击）某个实体时打开菜单？

右键交互用 LSE 0.9.5 起新增的 `onPlayerInteractEntity` 事件：

```js
mc.listen("onPlayerInteractEntity", (pl, en, pos) => {
  if (en.type == "minecraft:实体id") {
    pl.runcmd("打开菜单的指令");
  }
});
```

交互指鼠标右键、触屏长按实体或点击交互按钮。

左键攻击可以用 `onAttackEntity(player, entity)`，也可以用 `onMobHurt`：

```js
mc.listen("onMobHurt", (m, s, d, c) => {
  if (s && s.isPlayer() && m.type == "minecraft:实体id") {
    s.toPlayer().runcmd("打开菜单的指令");
  }
});
```

注意 `onMobHurt` 的 `source` 可能为 `null`，要先判空。

*适用版本：LSE 0.9.5 及以上*

## LSE 的 JS 插件 API 有生成或操作经验球的接口吗？

没有经验球专用接口，但可用通用的实体生成接口：`mc.summonMob("minecraft:xp_orb", pos)`（与 `/summon` 走同一路径，0.19.1 起可用）生成并返回 `Entity` 对象，之后用实体 API 操作；也可以用 `mc.runcmdEx("summon xp_orb x y z")`。相关文档见实体 API 页面：<https://levimc.org/zh-Hans/LegacyScriptEngine/apis/GameAPI/Entity/>。

*适用版本：LSE 0.19.1 及以上（`summonMob`）*

## LSE 脚本中如何为某个生物生成一份战利品（掉落物）？

LSE 没有直接的战利品表 API，可选方式：

1. 用 `mc.spawnMob(type, pos)` 生成同类实体，再用 `entity.hurt(damage[, type[, source]])` 杀死使其掉落；
2. 使用原版 `/loot` 命令（`mc.runcmd`），来源可指定实体（`kill`）或战利品表（`loot`），可配合 `mainhand` 等模拟用工具（如抢夺）击杀；
3. 自行读取战利品表 json 计算；
4. 用 C++ 模组实现并导出给脚本。

*未能从源码或文档中直接证实，仅供参考。*

## LSE 里如何给玩家施加一个冲量/速度（类似 ScriptAPI 的 `applyImpulse`）？

使用 `Entity` 的 `setPosDelta`：`player.toEntity().setPosDelta(x, y, z)`，也可以传入 `FloatPos`，即 `en.setPosDelta(delta)`。它设置实体每刻的坐标变化量（运动量），对玩家同样有效，返回是否设置成功。

## 在 LSE 中监听生物生成事件并在回调里调用 `mc.spawnMob` 生成实体，结果陷入死循环/堆栈溢出导致崩服，为什么？如何避免？

`mc.spawnMob` 底层调用的是 Level 的 Spawner（`BedrockSpawner`）的 `spawnMob`，与自然生成同一条逻辑，而生物生成事件（`onMobTrySpawn`，旧名 `onMobSpawn`）正是 hook 这个函数，所以在回调里再 `spawnMob` 会再次触发事件，无限递归。

解决办法：

- 用一个标志变量防重入：事件触发时若标志为 `true` 就直接返回，否则置为 `true`、生成实体、再置回 `false`。
- 或改用 LSE 0.19.1 新增的 `mc.summonMob`（走 summon 命令的生成逻辑，不经过 `Spawner::spawnMob`，但生成的实体会被设为持久化、不会自然消失，大量使用要注意）。

另外生成事件触发时实体尚未生成，靠事后加 tag 判断无效。若只是想增加生成数量，更推荐用行为包修改 `spawn_rules` 的 herd 大小。

*适用版本：LeviLamina + LegacyScriptEngine 当前版本（`mc.summonMob` 需 LegacyScriptEngine 0.19.1 及以上）*

## 想用 LSE 禁用绝大部分实体生成（包括刷怪蛋、命令等），LSE 能做到吗？

LSE 能拦截的是走 `Spawner::spawnMob` 的生物生成：

- `onMobTrySpawn`：`return false` 拦截。文档描述为“实体尝试自然生成”，但其底层 hook 的是 `BedrockSpawner::spawnMob`，非自然途径如 LSE 自身的 `mc.spawnMob` 也会触发；刷怪蛋等其他途径是否经过此函数需自行测试。
- `onMobSpawned`：生成完成通知，不可拦截。
- 投射物可用 `onSpawnProjectile`。

`/summon` 不走 `spawnMob`（其生成逻辑位于匿名命名空间函数 `CommandUtilsAnon::_spawnEntityAt`），需要原生 C++ hook 才能拦截。直接删除实体注册理论可行，但侵入性太强，可能引起插件冲突等问题，不推荐。

*适用版本：LegacyScriptEngine 当前版本*

## 想给实体绑定自定义数据（像物品那样存自定义 NBT），以及在 LSE 中根据 `uniqueId` 获取单个实体，怎么做？

可以获取实体的 `uniqueId`，把数据存到插件自己的数据文件里；也可以用 `en.addTag(tag)` 给实体加标签（C++ 中为 `Actor::addTag`）。按 `uniqueId` 获取单个实体：LSE 0.9.5 起提供 `mc.getEntity(id)`，参数为实体的 `UniqueId` 或 `RuntimeId`，获取失败返回 `null`；也可以用 `mc.getAllEntities()` / `mc.getEntities(...)` 遍历查找。

*适用版本：LegacyScriptEngine 0.9.5 及以上*

## 想让某个生物只对特定玩家可见、并且只攻击该玩家，用 LSE JS 插件能实现吗？

“只对特定玩家可见”可以通过拦截/定制发给客户端的数据包实现（需借助数据包相关的原生能力或插件）；但判断或控制生物锁定的攻击目标 JS 做不到，LSE 早已彻底移除 NativeAPI，需要用 C++ 原生 mod 实现。

*适用版本：LegacyScriptEngine 0.8.19 及以上*

## 能否用 LSE 获取全部实体来清理未加载区块里的实体？C++ 中怎么获取全部实体？

不行。LSE 中获取全部实体应使用 `mc.getAllEntities()`（`mc.getEntities(pos...)` 是按坐标范围查询），两者都只能拿到已加载的实体，拿不到未加载区块中的实体，所以脚本写不了未加载实体清理。C++ mod 中可以用 `Level::getRuntimeActorList()` 或 `Level::getEntities()` 获取（同样仅限已加载的）全部实体。

*适用版本：LSE / LeviLamina 当前版本*
