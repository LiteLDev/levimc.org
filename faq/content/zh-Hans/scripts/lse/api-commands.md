# LegacyScriptEngine API：命令

## LSE JS 插件用 `mc.newCommand` 注册命令报错或不生效（旧 LLSE 插件迁移过来也一样），正确写法是什么？必须放在 `onServerStarted` 里吗？

现在不需要把命令注册放进 `onServerStarted`。LSE 0.6.0 起支持延迟注册命令：服务器还在启动时调用 `mc.newCommand` / `mc.regPlayerCmd`，LSE 会自动推迟到可以注册的时候再执行，所以直接写在插件顶层即可，放在 `onServerStarted` 回调里也同样能用。早期 LSE（0.6.0 之前）强制要求在 `onServerStarted` 之后注册，这个限制已经取消。

正确写法参考文档 <https://lse.levimc.org/zh/apis/GameAPI/Command/>：先创建命令对象，再添加重载、设置回调，最后调用 `setup()`。该写法适用于当前 LSE 0.23.x：

```js
const cmd = mc.newCommand("ping", "网络诊断", PermType.Any);
cmd.overload([]);
cmd.setCallback((_cmd, ori, out, res) => {
  const p = ori.player;
  if (!p) return;
  const d = p.getDevice();
  p.tell(`延迟: ${d.lastPing}ms 丢包: ${d.lastPacketLoss.toFixed(1)}%`);
});
cmd.setup();
```

注意事项：

- 每条命令至少要添加一条重载，无参数命令写 `cmd.overload([])`（当前实现中 `cmd.overload()` 不带参数效果相同）。
- 按文档在最后调用 `cmd.setup()`（当前实现里实际注册已在 `overload` 时完成，`setup()` 主要为兼容保留，但仍建议照文档书写）。
- 命令名含大写字母或非英文字符：除 String/RawText/Message 等可变参数外，命令中只能用英文小写字母。
- flag 参数可省略，默认值就是 `0x80`（文档要求按此填写即可）；不要照搬 AI 生成的其他写法。

*适用版本：LSE 0.6.0 及以上*

## 基岩版玩家名可以带空格，LSE 插件用 `mc.runcmd` 拼接命令时出错，怎么处理？如何阻止名字带空格的玩家进服？

根本做法是拼接命令时用双引号把玩家名包起来，例如 ``mc.runcmd("say \"" + player.name + "\" test")`` 或模板字符串 ``mc.runcmd(`say "${player.name}" test`)``（`mc.runcmdEx` 同理）；第三方插件出此问题应让作者修复。若临时要拒绝名字带空格的玩家，可写一个 JS 插件：

```js
mc.listen("onPreJoin", (pl) => {
  if (pl.realName.includes(" ")) pl.kick();
});
```

*适用版本：当前所有 LSE 版本*

## LSE 中用 `mc.newCommand` 注册命令后，在 `setCallback` 回调里如何拿到执行命令的玩家对象？直接用 `player.name` 会报错。

命令回调的签名是 `(cmd, origin, output, results)`，参数里没有 Player，执行者信息在 `origin`（CommandOrigin）里：用 `origin.player` 获取执行命令的玩家对象，例如 `origin.player.name`。注意 `origin.player` 可能为空（例如控制台或命令方块执行时），使用前应先判空。

*适用版本：LegacyScriptEngine 当前所有版本*

## LSE 中不同插件注册命令时使用了同名的枚举（`cmd.setEnum`），会冲突吗？例如插件更新后子命令枚举值被别的插件覆盖（`rank give` 变成 `rank add`）。

会。LSE 的 `cmd.setEnum` 注册的是 BDS 全局的运行时枚举，名称不按插件/命令区分命名空间。两个插件使用同名但取值不同的枚举时会互相覆盖，导致命令解析错乱。解决办法：插件开发者给枚举起全局唯一的名字（如在枚举名前加插件名前缀）。维护者表示在 LSE 层面修复需要重做命令注册 API、会不兼容旧插件，因此不会改；原生 C++ mod 的命令有命名空间，不存在此问题。

*适用版本：LegacyScriptEngine 当前所有版本*

## LSE 中 `mc.runcmd` 会每个 tick 自动执行一次吗？想每 tick 执行命令该怎么写？

不会，`mc.runcmd` 调用时只立即执行一次。若要每 tick 执行，可监听 `onTick` 事件：`mc.listen("onTick", () => { mc.runcmd("...") })`；若需要固定时间间隔则用 `setInterval(fn, 毫秒)`。

*适用版本：LegacyScriptEngine 当前所有版本（原为 LLSE）*

## LSE 插件中 `mc.runcmdEx` 执行的命令如果语法错误，会影响插件运行吗？

不会让插件出错或崩溃。命令编译失败时 `runcmdEx` 仍正常返回结果对象，其中 `success` 为 `false`，`output` 中是错误信息，可据此判断：

```js
const res = mc.runcmdEx(cmd);
if (!res.success) logger.warn(res.output);
```

*适用版本：LegacyScriptEngine 当前版本*

## LSE 脚本插件里执行命令时，如何隐藏控制台输出的命令执行反馈？

使用 `mc.runcmdEx` 代替 `mc.runcmd`。`runcmdEx` 有隐藏输出机制，执行结果不会打印到控制台，而是作为返回值 `{success, output}` 返回；如需要可自行用 `log`/`logger` 输出 `res.output`。

*适用版本：LegacyScriptEngine 当前版本*

## LSE 插件执行命令时，怎么用 OP/控制台权限执行？怎么拿到命令输出？

`mc.runcmd(cmd)` 以服务器控制台身份（ServerCommandOrigin，权限等级 Owner，高于 OP）执行命令，不受玩家权限限制，只返回是否成功（Boolean）。`mc.runcmdEx(cmd)` 同样以控制台身份执行，并返回 `{success, output}` 对象，可把 `output` 存进变量分析，且不会把输出打印到控制台。

## LSE 中 `mc.runcmd` 和 `mc.runcmdEx` 有什么区别？

`mc.runcmd(cmd)` 执行一条后台命令，只返回是否成功（Boolean），命令输出会正常打到控制台；`mc.runcmdEx(cmd)` 执行命令并返回结果对象 `{ success: Boolean, output: String }`，且输出被隐藏、不会显示在控制台，需要时自行 `log(result.output)`。

注意不要在 `onConsoleCmd` 监听里调用 `runcmd`/`runcmdEx`，否则可能死循环。

## LSE 中 `mc.runcmdEx` 执行命令的权限等级是多少？

与控制台相同：`mc.runcmd` / `mc.runcmdEx` 都以名为 `"Server"` 的 ServerCommandOrigin 执行，权限等级为 `CommandPermissionLevel::Owner`（最高级），所以能执行控制台可执行的所有命令。

## LSE 中写跨服传送，用 `mc.listen("onPlayerCmd")` 监听玩家输入（假命令）好，还是注册真命令？怎么注册？

建议注册真命令，客户端有命令提示，命令方块等处也能用。示例：

```js
mc.listen('onServerStarted', () => {
  const cmd = mc.newCommand('trans', '跨服命令', PermType.Any);
  cmd.mandatory('ip', ParamType.String);
  cmd.optional('port', ParamType.Int);
  cmd.optional('player', ParamType.Player);
  cmd.overload(['ip', 'port', 'player']);
  cmd.setCallback((_, origin, output, result) => {
    const players = result.player ?? (origin.player ? [origin.player] : []);
    players.forEach(p => p.transServer(result.ip, result.port ?? 19132));
  });
  if (!cmd.setup()) logger.error('命令安装失败！');
});
```

注意 `setup()` 成功返回 `true`，失败判断要取反；从控制台执行且未指定 `player` 时 `origin.player` 为空。

## LSE 中如何触发/调用数据包（行为包）里的 mcfunction 函数，而不用把它重写一遍？

通过执行原版 `function` 命令即可：`mc.runcmdEx("function 函数名")`（以控制台身份执行，返回 `{success, output}`），或 `pl.runcmd("function 函数名")`（以玩家身份执行）。

## 在 LSE 中用 `mc.newCommand` 注册命令，调用 `cmd.optional(...)` 加了可选参数后，游戏里有命令提示，执行时却提示 `未知的命令`，为什么？另外文档里 `pl.tell(msg[,type])` 的中括号是什么意思？

文档里的 `[ ]` 只是表示“可选参数”的写法，不是让你用数组把参数包起来，调用时按顺序直接传参即可，例如 `hub.optional("hub_num", ParamType.Int)`。

命令显示未知是因为没调用 `overload`：加完参数后必须用 `cmd.overload([...])` 声明重载（例如 `hub.overload(["hub_num"])`，无参重载可写 `hub.overload([])`），然后 `setCallback`，最后 `setup()`。

参考 <https://lse.levimc.org/zh/apis/> 和 <https://github.com/LiteLDev/legacy-script-engine-api>。

*适用版本：LSE 0.23.x*

## LSE 有没有获取服务器所有已注册命令列表的 API？

LSE 没有提供获取全部已注册命令列表的现成 API（命令相关接口只有 `mc.runcmd` / `mc.runcmdEx` / `mc.newCommand` / `mc.regPlayerCmd` / `mc.regConsoleCmd` / `mc.sendCmdOutput` 等）。

变通做法是用 `mc.runcmdEx("help")` 执行 `help` 命令，再解析返回的 `output` 文本。如确实需要完整列表，可用 C++ 模组通过 LeviLamina / BDS 的 `CommandRegistry` 获取。

*适用版本：LSE 当前所有版本（0.23.1 仍无此 API）*

## LSE 有没有让某个实体执行一条命令的 API？实体对象上没有类似 `execute` 的方法。

LSE 的实体（Entity）对象没有执行命令的方法（只有玩家对象有 `pl.runcmd`）。可以借助原版 `execute` 命令实现：用 `mc.runcmdEx` 执行 `execute as @e[c=1,type=<实体类型>] at @s run <命令>`（按需加上坐标 / 名称 / 标签等选择器条件来精确定位实体，例如先给目标实体加 tag 再用 `@e[tag=xxx]`）。

若用 C++，可参考 LSE 源码中命令执行相关实现。

*适用版本：LSE 当前所有版本*

## LSE 注册命令后，在回调里用 `out.success(...)` 输出信息，但玩家执行命令后客户端看不到任何结果，怎么办？

排查思路：

1. 先在回调里 `log(res.action)` 等确认参数是否正确传入、回调是否被执行；
2. `switch` 的每个 `case` 末尾要写 `break`，否则会继续往下执行导致输出被覆盖或出错；
3. 确认世界的 `sendcommandfeedback` 游戏规则没有被关闭；
4. 作为变通，可以用 `ori.player.tell(...)` 直接给执行者发消息（注意控制台执行时 `ori.player` 为空）。

另外，使用 KVDatabase 等数据库用完记得 `close`，否则其他地方再次打开会报错。

*适用版本：LSE 当前所有版本。未能从源码或文档中直接证实，仅供参考。*

## LSE 注册命令时使用玩家选择器参数，回调里直接取 `res.pl.name` 得到 `undefined`，为什么？

`ParamType.Player`（以及 `ParamType.Actor`）参数返回的是对象数组（`Array<Player>` / `Array<Actor>`），而不是单个对象，需要按下标取，例如 `res.pl[0].name`，或遍历数组处理（注意先判断数组长度，选择器可能没选中任何玩家）。

*适用版本：LSE 当前所有版本*

## LSE 注册命令时怎么给一个命令设置多个别名？

多次调用 `cmd.setAlias(alias)` 即可，每调用一次添加一个别名。C++ 侧对应 LeviLamina 的 `CommandHandle::alias()`，其内部调用 `CommandRegistry::registerAlias`。

*适用版本：LSE 当前所有版本*

## LSE 注册命令时，怎样实现像原版 `tag` 命令那样参数是字符串但能 Tab 补全已有值？把参数改成 `SoftEnum` 后游戏里没有提示怎么办？

使用可变枚举（软枚举）：先用 `cmd.setSoftEnum(name, values)` 定义可变枚举及其初始值，再用 `cmd.mandatory` / `cmd.optional`（参数名, `ParamType.SoftEnum`, name）声明参数并加入重载；之后可用 `cmd.addSoftEnumValues` / `removeSoftEnumValues` 动态增删可选值。只有可变枚举里有值时，游戏内才会出现补全提示。

## LSE 注册的命令（如 `/home`）执行时提示权限不足，怎么解决？

常见原因是命令没有设置重载。用 `mc.newCommand` 创建命令后，必须至少添加一条重载，例如无参命令调用 `cmd.overload([])`，再 `setCallback` 并 `setup`。另外要注意 `mc.newCommand` 的 permission 参数默认是 `PermType.Admin`，若希望普通玩家可用需显式传 `PermType.Any`，例如 `mc.newCommand("home", "回家", PermType.Any)`。

## LSE 的命令来源类型 `OriginType` 中为什么没有 `Server`，只有 `DedicatedServer` 等？

LSE 运行时的 `OriginType` 枚举是直接由 BDS 原版的 `CommandOriginType` 生成的，成员名与原版一致：`Player`、`CommandBlock`、`MinecartCommandBlock`、`DevConsole`、`Test`、`AutomationPlayer`、`ClientAutomation`、`DedicatedServer`(7)、`Entity`、`Virtual`、`GameArgument`、`EntityServer`、`Precompiled`、`GameDirectorEntityServer`、`Scripting`、`ExecuteContext`。控制台/服务端来源应使用 `OriginType.DedicatedServer`。`legacy-script-engine-api` 的 TS 声明沿用了 LL2 时代的名字（`Server`、`Block`、`Actor` 等，并把 `DedicatedServer` 作为 `Server` 的别名），所以编辑器补全会出现 `Server`，但运行时并不存在该成员；也可用 `ori.typeName` 获取类型名字符串。

## LSE 的命令注册 API 里有方块状态（block states）类型的命令参数吗？能取到值吗？

`ParamType` 枚举里保留了 `BlockState`（数值为 16），可以用于 `mandatory` / `optional` 注册参数，但 LSE 在把命令解析结果转换成脚本值时没有处理该类型，回调里拿到的该参数值为空（`undefined`），因此实际上无法使用。需要方块状态时可改用字符串/JSON 等参数自行解析。

*适用版本：LSE v0.23.1*

## LSE 脚本中如何让玩家身份执行命令？`player.runcmd` 能否执行管理员（OP）命令？

LSE 提供 `player.runcmd(cmd)` 以玩家身份执行命令。其底层用该玩家构造 `PlayerCommandOrigin` 执行，与玩家自己输入命令没有区别，所以能执行哪些命令取决于该玩家的权限，非 OP 玩家不能借此执行管理员命令。若需要以高权限执行，可用控制台身份 `mc.runcmd` / `mc.runcmdEx`（`ServerCommandOrigin`，Owner 权限）配合 `/execute as "<玩家名>" run <命令>` 实现。

## LSE 菜单类插件（如 cmenu）点按钮执行命令时提示“未知的命令”，是什么原因？

这类插件一般用 `pl.runcmd()` 以玩家身份、按玩家权限执行命令。玩家权限不够（命令要求 OP），或者提供该命令的插件（领地、商店、签到等）没装、命令没注册时，都会提示未知命令。解决方法：先装好提供这些命令的插件，例如领地用 iland，商店用 pshop 或 Tmessential；然后在菜单的 JSON 配置里删掉不需要的条目。改 JSON 时注意语法，最后一个元素后面不能有多余的逗号。

*适用版本：当前版本（具体取决于所用第三方菜单插件和命令插件）。未能从源码或文档中直接证实，仅供参考。*

## LSE/LLSE 中 `Command` 对象的 `setSoftEnum()` 和 `setEnum()` 有什么区别？

`setSoftEnum(name, values)` 注册的是可变枚举（soft enum），配合 `ParamType.SoftEnum` 参数使用，命令注册后候选值仍可以用 `addSoftEnumValues` / `removeSoftEnumValues` 等动态修改。`setEnum(name, values)` 注册的是普通枚举，注册后不能再改。需要在运行时变动候选项（如玩家名、动态列表）时用软枚举。

## 修改了 LSE 插件中命令的权限等级后重载插件仍不生效，为什么？

LSE 的命令在 `mc.newCommand` 首次注册时就确定了名称、描述、权限等信息。重载插件时命令已存在，LSE 会警告 `Runtime command xxx already exists, changes will not beapplied except for setOverload!`（源码原文如此），只有重载/回调会更新，权限等改动需要重启服务器才生效。另外注意权限枚举：`PermType.Any`(0) \< `PermType.GameMasters`(1，OP) \< `PermType.Admin`(2，`mc.newCommand` 默认值) \< `PermType.HostPlayer`(3) \< `PermType.Console`(4)；`Admin` 比 `GameMasters` 高一级。不想限制权限可用 `PermType.Any`，并在回调里自行判断（如 `origin.player?.isOP()`）。LSE 本身没有提供注册后修改命令权限的接口。

*适用版本：LSE 0.9 及以上；当前 0.23.x*

## 在 LSE 插件里想限制某些玩家使用其他插件的指令，拦截指令后其他插件的表单仍然弹出，能否拦截其他插件的表单？

正常情况下在 `onPlayerCmd` 中返回 `false` 拦截命令执行，就能阻止其他插件的命令（及其后续表单），除非对方插件的“指令”是通过监听聊天等事件而非注册命令实现的。LSE 技术上也能拦截表单，但不建议这样做；正确做法是拦截命令执行，或让插件之间直接联动禁止执行。

## 在 LSE 脚本插件中用 `mc.runcmdEx("list")` 获取在线玩家列表时，返回结果里带有 `§` 颜色代码，导致解析/显示异常，怎么处理？

`mc.runcmdEx` 返回的是对象 `{success, output}`，命令输出在 `.output` 字段中，需要自己去除颜色代码，例如：

```js
mc.runcmdEx("list").output.replace(/§./g, "")
```

如果只是想拿在线玩家，更推荐直接用 `mc.getOnlinePlayers()` 获取玩家对象数组再自行统计，避免解析本地化的命令输出文本。

## 如何用 LSE 写一个 `/back` 命令让玩家返回上次死亡点？需要自己记录死亡坐标吗？

不需要自己记录。LSE 的玩家对象提供 `pl.lastDeathPos` 属性（`IntPos`，包含维度 `dimid`）；玩家没有死亡记录时，该属性为空（`undefined`）。示例：

```js
const cmd = mc.newCommand('back', '返回死亡点', PermType.Any);
cmd.overload([]);
cmd.setCallback((cmd, origin, output, result) => {
  const player = origin.player;
  if (!player) return output.error('指令执行者必须为玩家');
  const pos = player.lastDeathPos;
  if (!pos) return output.error('没有死亡记录');
  player.teleport(pos);
  output.success('传送成功');
});
cmd.setup();
```

注意：ScriptX 取不到值时返回 `undefined` 而不是 `null`，判空应写 `!x`，不要写 `== null` 的严格比较。另一种做法是读取 `player.getNbt()` 中原版的死亡坐标字段，但字段名属于 BDS 原版结构，不如直接用 `lastDeathPos` 可靠。

## 用 LSE 注册命令时（例如 `/pay <玩家> <金额>`），如何让某个参数可选，不填也不会被客户端标红报错？

命令语法检查在客户端完成。注册参数时用 `cmd.optional(name, type, ...)` 代替 `cmd.mandatory(...)` 声明该参数，或者额外提供一个不包含该参数的重载（`cmd.overload([...])` 中不列该参数），然后在回调里判断 `results` 中该参数是否为空/`undefined`。

*适用版本：LSE 当前所有版本*

## 用 LSE 注册自定义命令（`mc.newCommand`）需要注意什么？

1. 命令名（及除 `String`/`RawText`/`Message` 等可变参数外的内容）只能用英文小写字母。
2. `RawText` 类型参数只能放在最后一个参数位置。
3. 推荐在 `onServerStarted` 事件中注册命令（官方示例即如此）。
4. `overload` 的参数是数组，无参数时写 `cmd.overload([])`；最后必须调用 `cmd.setup()`。

示例（Python）：

```python
cmd = mc.newCommand(name, description, permission)
cmd.overload([])
def callback(cmd_, origin_, output_, results_): pass
cmd.setCallback(callback)
cmd.setup()
```

具体见 LSE 文档 `GameAPI/Command`。

*适用版本：LSE 当前所有版本*
