# LegacyScriptEngine API：引擎、模块与定时器

## LSE（LegacyScriptEngine）脚本插件还需要调用 `ll.registerPlugin` 注册插件吗？文档里搜不到，插件名称、版本等信息在哪里设置？完整 API 定义在哪找？

不需要。LSE 插件的信息（`name`、`version`、`author`、`description`、`entry`、`type` 等）写在插件目录的 `manifest.json` 中，加载时自动注册。`ll.registerPlugin` 已弃用并从 LSE 文档中删除，仅为兼容旧 LLSE 插件保留：它会对参数做类型检查，并在传入版本与 manifest 中不同时把参数写回插件的 `manifest.json`，没有其他作用。参数类型不对时会抛异常，若未捕获会导致插件后续代码不执行，而且插件加载阶段抛出的异常可能不会在控制台显示任何报错（见仍未关闭的 <https://github.com/LiteLDev/LegacyScriptEngine/issues/240>），因此建议直接删除该调用。

完整的 API 类型定义（包括 `File` 等类）可参考 <https://github.com/LiteLDev/legacy-script-engine-api>。

*适用版本：LSE 当前所有版本（LeviLamina 下）*

## LSE 中如何获取服务器当前 TPS？用 `onTick` 计算为什么会大于 20？

LSE 本身没有获取 TPS 的 API，可用 `mc.listen("onTick", ...)` 自行统计：每次 tick 计数器加一，每秒读取并清零即为 TPS（正常为 20）；或计算执行 20 个 tick 所用时间再做除法。偶尔算出 21 之类大于 20 的值是正常的——BDS 一秒内没跑完 20 tick 会在下一秒补回来，计时误差也会造成偏差。可参考 MineBBS 上的 ShowTPS 插件：<https://minebbs.com/resources/showtps-tps.8950/>。MSPT 为每 tick 耗时，TPS 可由其推算。

另外也可安装第三方前置 GMLIB 及其 LegacyRemoteCallApi（LRCA），在 JS 中导入后调用 `Minecraft.getServerCurrentTps()`，不必执行命令再解析输出。若要在 TPS 过低时清理实体，脚本里遍历 `mc.getAllEntities()` 性能一般，直接 `mc.runcmd("kill @e[type=!player,...]")` 往往更省。

*适用版本：LeviLamina 上的 LegacyScriptEngine 当前所有版本；GMLIB/LRCA 方案需安装对应第三方前置*

## LSE 的 JS 插件（QuickJS 引擎）里使用 `console.log` / `console.error` 报错，应该用什么输出日志？

QuickJS 引擎环境里没有 `console` 对象，只有 Node.js 引擎的插件可以用 `console.log`。QuickJS 插件请使用 LSE 提供的 `log()` 或 `logger` API（如 `logger.info` / `logger.warn` / `logger.error`），文档：<https://levimc.org/zh-Hans/LegacyScriptEngine/> 中 ScriptAPI → Logger 页面。

*适用版本：LSE QuickJS 引擎当前所有版本*

## LSE 的 JS 插件能否把“子插件/扩展”放在自己的子文件夹里，由主插件去加载？

子文件夹里的脚本不能作为独立的 LSE 插件注册（每个插件需要放在 `plugins` 下自己的目录并有自己的 manifest）。如果要实现“插件的插件”，只能在主插件里自己实现加载器：用 CommonJS（`require`）或 ES Module 把扩展当模块引入，模块内仍可直接使用 LSE 全局 API，扩展通过导出函数/对象共享功能。可参考 UMenu（<https://github.com/engsr6982/lse-workspace/tree/main/projects/UMenu>）对扩展的加载、卸载、重载实现。

注意避免循环依赖（被加载文件不要反过来 `require` 主文件），必要时改用 ESM。否则就把各插件分别放到 `plugins` 目录下作为独立插件。

*适用版本：LeviLamina + LSE 当前版本*

## 编写 LSE 的 JS/TS/Node.js 插件时，`mc`、`logger`、`PermType`、`ParamType`、`Player` 等需要从什么模块 import？类型定义怎么引入，Player 类能在运行时访问或继承吗？

不需要 import。LSE 把 `mc`、`logger`、`ll`、`PermType`、`ParamType` 等 API 作为全局对象注入（Node.js 插件同样如此），直接使用即可；调用其他插件导出的函数则用 `ll.imports`（远程调用）。类型提示也应声明为全局：官方类型库为 <https://github.com/LiteLDev/legacy-script-engine-api>（含 JS/TS 与 Python）。

文档中的 `Player` 等类名在运行时并不存在，引擎实际注册的类名带 `LLSE_` 前缀（如 `LLSE_Player`），直接访问 `Player` 会得到 `undefined`；这些类也没有可用的构造函数，无法继承。API 文档见 <https://levimc.org/zh-Hans/LegacyScriptEngine/apis/>。

*适用版本：LSE 当前版本*

## LSE Python/JS 插件里用 `time.sleep` 或 `while True` 死循环做倒计时/循环延迟执行命令，为什么会卡服？该怎么写？

脚本插件在 BDS 主线程中执行，回调里 `time.sleep` 或不退出的死循环会阻塞整个服务器。周期性任务应使用 LSE 提供的跨语言定时器 `setTimeout` / `setInterval`（Python 中同样可用），结束时 `clearInterval`；显示标题可直接用 `pl.setTitle` 代替执行 `title` 命令。JS 示例：

```js
let delay = 5000;
let task = setInterval(() => {
  player.setTitle(`${delay / 1000}`, 4, 1, 2, 1);
  if (delay <= 0) {
    player.setTitle('新年快乐', 4, 0, 1, 0);
    clearInterval(task);
  }
  delay -= 1000;
}, 1000);
```

*适用版本：LSE 当前所有版本*

## LSE 插件里能用 Script API（addon，`@minecraft/server`）的 `serverApi`、`world.getDimension()`、`origin.teleport()`、`server.on` 之类的写法吗？

不能。LSE 插件和 Minecraft 官方 Script API（SAPI，`@minecraft/server`）是两套完全不同的 API，不能混用，也不要直接照搬 AI 生成的 SAPI 代码。LSE 中没有 `serverApi` / `playerApi` / `worldApi` / `world.getDimension` 这类对象：监听事件用 `mc.listen(事件名, 回调)`，输出日志用 `logger.log`，传送玩家用 Player 对象的 `pl.teleport(...)` 或 `mc.runcmd` 执行 `tp` 命令等。请按 LSE 文档 <https://levimc.org/zh-Hans/LegacyScriptEngine/>（API 参考）编写，编辑器类型提示可用 `legacy-script-engine-api`。

*适用版本：当前所有 LSE 版本*

## LSE 的 Python 插件中给事件回调参数写类型注解时，用 `player: Player` 不生效（报未定义），应该怎么写？

LSE 向脚本引擎注册的类名带 `LLSE_` 前缀，Python 环境中玩家类叫 `LLSE_Player`，并没有名为 `Player` 的类，所以类型注解应写成 `player: LLSE_Player`（其他类同理，如 `LLSE_Item`、`LLSE_Block` 等）。如需在 IDE 中获得补全，可使用 `LiteLDev/legacy-script-engine-api` 仓库中 `platforms/python` 提供的类型提示。

*适用版本：LegacyScriptEngine Python 后端（legacy-script-engine-python）当前版本*

## LSE 的 TypeScript 类型补全库里，`LLSE_Player` 这类带前缀的类名和 `Player` 这类无前缀的类名有什么区别，该用哪个？

在补全库中，带 `LLSE_` 前缀的类都继承自对应的无前缀类（如 `declare class LLSE_Player extends Player {}`），保留无前缀类名是为了不引入不兼容变更。TypeScript 按结构（形状）匹配类型，两者可以互相传递，按喜好选用即可。注意这只是类型声明层面的区别：运行时引擎实际注册的类名是 `LLSE_Player`。补全库现为 `LiteLDev/legacy-script-engine-api`（`platforms/javascript`）。

*适用版本：legacy-script-engine-api（原 HelperLib）当前版本*

## LSE（脚本插件）里的 `setTimeout` 第二个参数是 tick 还是毫秒？怎么写？

第二个参数是毫秒。用法 `setTimeout(func, msec)`，`func` 可以是匿名函数、箭头函数或已定义的函数引用，返回任务 ID（可用 `clearInterval` 取消）；也支持 `setTimeout(code, msec)` 传入代码字符串。需要周期执行时用 `setInterval(func, msec)`。

注意 `setTimeout` 只是延后执行，回调仍在服务器主线程运行，耗时逻辑并不会因此变成异步。

## LSE JS（QuickJS）插件中入口文件 `import` 子模块正常，但子模块再 `import` 其他文件（嵌套 `import`）就报错，路径该怎么写？

LSE 的 QuickJS 模块加载器在加载 `manifest.json` 指定的入口模块时，会把 base path 设为当前工作目录（即服务器程序所在目录），而不是脚本所在目录。所以入口文件里要写成 `./plugins/<你的插件>/xxx.js` 这种从服务器根目录起算、带 `.js` 后缀的路径，例如 `import { initCommand } from "./plugins/your_plugin/command/command.js"`。

这个问题只影响入口模块；被入口导入的其他模块之间的 `import` 按标准 ES Module 规则解析，即相对于模块自身所在位置，所以子模块里应写相对于子模块自身的相对路径，不要再从 `./plugins` 开始写。

*适用版本：LSE QuickJS 引擎 0.23.x*

## LSE 中 `ll.getPluginInfo()` 返回 `undefined`，导致依赖它做安全检查的旧插件（如 TMEssential）失败，为什么？

LSE 中插件信息以插件目录下的 `manifest.json` 为准，`ll.getPluginInfo(name)` 按插件（mod）名称查找；插件名就是 `manifest.json` 里的 `name`，旧单文件插件迁移后名称为去掉 `.js` 后缀的文件名，所以传入的名字不要带 `.js` 后缀。

`ll.registerPlugin` 仅为兼容旧插件保留，它不再是插件信息的来源，只会在版本号与 manifest 不一致时把描述/版本/附加信息回写到 `manifest.json`。旧插件依赖 `registerPlugin`/`getPluginInfo` 做安全检查的，需要按此修改代码。

## LSE 中 `setTimeout`/`setInterval` 的参数是毫秒，但底层按游戏刻调度，会不会有精度问题？为什么不用系统时间/线程计时？

LSE 的 `setTimeout`/`setInterval` 用 LeviLamina 协程（`ll::coro`）在 `ServerThreadExecutor` 上调度：传入的毫秒数会向上取整为游戏刻（1 tick = 50ms），在服务器每次 Level tick 时执行到期任务。因此实际精度是一个游戏刻，且服务器卡顿（TPS 下降）时会相应延后，这与 LL2 的行为一致。

之所以不用独立线程按系统时间计时，是因为 MC 接口只能在游戏主线程调用，回调必须回到服务器线程执行。

## LSE 中用 `jsdebug` 进入 JS 调试模式后如何退出？以及如何获取玩家的 IP？

再输入一次 `jsdebug` 即可退出调试模式（Node.js 为 `nodejsdebug`，Lua 为 `luadebug`，Python 为 `pydebug`）。游戏内能否使用该命令由 LSE 配置文件 `config.json` 中的 `debugCommandLevel` 决定，默认为 GameDirectors（OP）。

获取玩家 IP：`pl.getDevice().ip`（返回 IP:端口）；`pl.ip` 属性也存在，返回不带端口的地址。

## LSE 中对 player 对象做解构（`const {name, xuid, getExtraData} = player`）后调用 `getExtraData` 报错 `不可以将值转换为对象`，为什么？

LSE 引擎提供的对象，属性（如 `name`、`xuid`）可以解构取值，但方法是绑定在实例上的原生 `instanceFunction`，解构出来单独调用时丢失了 `this`（不再指向 Player 实例），因此报错。需用 `player.getExtraData(...)` 的形式调用，或 `getExtraData.call(player, ...)`。

*适用版本：LSE 当前所有版本*

## LSE 中导入其他插件导出函数应该用 `ll.import` 还是 `ll.imports`？文档写的是 `ll.imports`，但调用失败。

官方 API 是 `ll.imports(namespace, name)`（返回一个可调用函数），配合 `ll.exports` 导出使用。LSE 在 JS 和 Lua 的 baselib 中定义了 `ll.import = ll.imports` 作为兼容别名，两者完全等价（Python 中 `import` 是关键字，只能用 `ll.imports`）。

若调用失败，通常是目标插件尚未加载 / 未导出该函数，或 `namespace`、`name` 写错，而不是写法问题；可用 `ll.hasExported(namespace, name)` 检查。

*适用版本：LSE 当前所有版本*

## 在 LSE 中用 `system.cmd` 执行外部命令（例如 7z 压缩）时回调不触发或拿不到返回值，怎样判断是否成功？

`system.cmd(cmd, callback[, timeLimit])` 的回调要等 shell 进程结束后才执行；如果命令里用 `start` 另起了进程，就无法判断它何时结束。

可以改用 `system.newProcess(process, callback[, timeLimit])` 直接运行外部程序，在回调 `function(exitcode, output)` 里根据 `exitcode` 和输出判断是否成功。回调必须传一个函数（例如匿名函数 `(exitcode, output) => {...}`），不要写成函数调用。

*适用版本：LSE 0.23.x*

## LSE 插件能否获取 / 拦截 BDS 控制台输出的所有信息？

不能。LSE 以前的控制台输出事件已被移除；`system.cmd` 只能获取所执行系统命令的输出，不能捕获 BDS 控制台日志。要捕获控制台输出需写原生（C++）mod 去 hook 输出函数。

## LSE 的 JS 插件里可以用 `require` / `module.exports` 这种 CommonJS 写法吗？还是要用 `import` / `export`？

取决于引擎：

- Node.js 引擎（`#nodejs` 变体）：默认按 CommonJS 加载，可以用 `require` / `module.exports`，也可以 `require` npm 依赖；在插件的 `package.json` 中设置 `"type": "module"` 后则按 ES 模块加载，使用 `import` / `export`。
- QuickJS 引擎：入口文件以 ES 模块方式加载（原生支持 ESModule），应使用 `import` / `export`；QuickJS 不提供 CommonJS 的 `require` / `module.exports`，也不支持 npm 包管理。注意 QuickJS 入口模块中的相对 `import` 路径是以服务器工作目录（BDS 所在目录）为基准解析的，例如要写成 `import { x } from "./plugins/your_plugin/command/command.js"`；入口之后其它模块之间的 `import` 行为符合标准。

*适用版本：LSE 0.10.6 及以上（Node.js ESM 支持自 0.10.6 起）；当前 0.23.x*

## LSE 的 Lua 插件怎么输出日志？和 JS 一样吗？

一样。LSE 各语言共用同一套 API，Lua 中同样可以使用全局函数 `log(...)` / `colorLog(...)`，以及 `logger` 对象（`logger.info` / `logger.warn` / `logger.error` / `logger.debug` / `logger.log` 等），用法与 JS 相同。文档地址：<https://levimc.org/zh-Hans/LegacyScriptEngine/>（日志 API 见其 `apis/ScriptAPI/Logger` 页面）。

## LSE 脚本插件中 `setTimeout` 无法给回调传参，怎么让延时执行的函数带参数？

LSE 提供的 `setTimeout(func|code, ms)` 只接受回调（函数或代码字符串）和延时两个参数，不会把额外参数转发给回调。可以用闭包包一层：`setTimeout(() => fn(arg1, arg2), ms)`；或写一个返回无参函数的包装函数，在里面调用带参函数。

*适用版本：当前版本（QuickJS 等引擎的 LSE 内置 `setTimeout`）*

## LSE（包括 Node.js 引擎）中暴露的类（如表单类）能否被继承或重载？

不能。表单（`LLSE_SimpleForm`、`LLSE_CustomForm`）、玩家、实体、方块、命令等由 C++ 创建的对象类没有向脚本暴露构造函数，无法继承，只能自己写包装（wrapper）。只有少数类有构造函数，例如 `IntPos`、`FloatPos`、`DirectionAngle`、各 NBT 类、`JsonConfigFile`、`IniConfigFile`、`KVDatabase` 等。表单方面可参考社区封装，例如 <https://github.com/lgc-LLDev/FormAPIEx>。

## LegacyScriptEngine 的 Node.js 引擎（`legacy-script-engine-nodejs`）写插件时如何添加 npm 第三方依赖？

在插件目录（`mods/<插件名>/`，即 LeviLamina 的模组根目录下）里用 `npm init` 生成 `package.json`，把依赖写进 `dependencies`；`manifest.json` 中把 `"type"` 设为 `"lse-nodejs"`。加载插件时，如果 `package.json` 里有依赖且插件目录下还没有 `node_modules`，LSE 会自动在插件目录执行 `npm install --omit=dev --no-fund`，所以 `node_modules` 不需要打包分发。旧的做法（把 `package.json` 和源码打成 zip 并改后缀为 `.llplugin` 放进 `mods` 目录）仍兼容：引擎会把它解压到 `mods/<插件名>/` 并自动生成 `manifest.json`。也可使用社区脚手架 <https://github.com/leoweyr/legacy-script-engine-scaffold>。

*适用版本：LSE Node.js 引擎（`lip install LegacyScriptEngine#nodejs`）；当前 0.23.x*

## 依赖 `legacy-script-engine-quickjs` 的 JS 插件如何调用 `ffi-napi` 或其他 DLL 库？

QuickJS 引擎不支持 npm 原生模块，可改用 Node.js 引擎（`legacy-script-engine-nodejs`）运行插件，即可使用 `ffi-napi` 等 Node 原生模块。基于 QuickJS 的插件理论上可直接移植到 Node.js 引擎（manifest `type` 改为 `lse-nodejs`，依赖写入 `package.json`）。Node.js 引擎依赖 `libnode.dll`，现在用 `lip install LegacyScriptEngine#nodejs` 安装时会自动下载 LiteLDev/node 的预编译包，无需再从官方 QQ 群的群文件手动获取。

*适用版本：LSE Node.js 引擎；当前 0.23.x*

## 在 LSE JS 插件中能否用 `instanceof` 判断一个参数是否是 `IntPos`？

可以，`obj instanceof IntPos` 可用。LSE 文档中称为“类”的对象一般都可以这样判断，只是实际注册的类名不一定与文档里的名字完全一致。

## 在 LSE JS 插件里用 `ll.imports("BEPlaceholderAPI", "registerPlayerPlaceholder")` 直接把回调函数传进去注册 PAPI 变量，结果插件加载失败/报错，正确写法是什么？

跨插件远程调用（RemoteCall）不支持传递函数类型参数。应先用 `ll.exports`（别名 `ll.export`）把回调导出，再把命名空间和导出名传给 `registerPlayerPlaceholder`：

```js
const registerPlayerPlaceholderAPI = (papiName, callback, pluginName = "your plugin name") => {
  ll.exports(callback, pluginName, `Placeholder_${papiName}`);
  ll.imports("BEPlaceholderAPI", "registerPlayerPlaceholder")(pluginName, `Placeholder_${papiName}`, papiName);
};
registerPlayerPlaceholderAPI("player_temp", (pl) => `${getTemp(pl)}°C`);
```

该 PAPI 接口属于第三方（GMLIB），其作者更推荐使用新版 PAPI 接口，文档见 <https://github.com/GroupMountain/GMLIB-Release/blob/release/PlaceholderDocs.md>。

*适用版本：LeviLamina；LegacyScriptEngine；LegacyRemoteCall（PAPI 部分取决于第三方 GMLIB 版本）*

## 在 LSE 插件中用 `ll.imports` 导入其他插件导出的函数时报错 `Fail to import! Function [...] has not been exported!`，怎么解决？

通常是调用时机太早，对方插件还没执行 `ll.exports` 导出该接口（或命名空间/函数名写错）。应在服务器启动完成之后（例如 `mc.listen("onServerStarted", ...)` 回调中）再导入/调用，也可以先用 `ll.hasExported(namespace, name)` 检查是否已导出。

## 在 LSE 的 Python 插件里用 `open('a.txt','a')` 写文件，没有报错但在插件目录找不到生成的文件，文件写到哪里了？

LSE 不会把脚本的工作目录切换到插件目录，相对路径是相对于 BDS 根目录（进程工作目录）解析的，所以 `a.txt` 会出现在 BDS 根目录下。若要写到插件目录，需要写成 `plugins/<插件名>/a.txt` 这样的路径，可借助 `os` 模块（`os.path.join`、`os.makedirs(..., exist_ok=True)`）拼接路径并确保目录存在。另外注意 `open()` 的模式参数必须是字符串（`'a'` 而不是 `a`）。

*适用版本：LSE Python 后端（legacy-script-engine-python），当前版本*

## 在 LSE 插件里用 `logger` 输出到服务器后台（控制台）时，怎样让文字带颜色？用 `§` 颜色代码在后台没有效果。

`§` 格式代码只对游戏内文本有效，LSE 的 `logger` 不会把它转换成控制台颜色，后台要用 ANSI 转义序列。把转义码拼到输出字符串里即可，例如前景色 `\x1b[30m` ~ `\x1b[37m`（黑/红/绿/黄/蓝/洋红/青/白），背景色 `\x1b[40m` ~ `\x1b[47m`，`\x1b[0m` 重置样式，`\x1b[1m` 粗体，`\x1b[4m` 下划线等。示例：

```js
logger.info("\x1b[33m黄色文字\x1b[0m")
```

JS 严格模式下八进制转义 `\033` 不可用，建议写 `\x1b` 或 `\u001b`。

## 在 LSE 的 JS 插件里用 `log` 输出字符画（ASCII art），由于字符串中的反斜杠 `\` 被转义导致排版错乱，有什么办法避免转义？

使用 JS 的模板字符串标签 `String.raw`，例如：

```js
log(String.raw`  /\_/\  ...`)
```

其中的反斜杠不会被转义（参考 MDN 的 `String.raw` 文档）。也可以把所有 `\` 替换成 `\\`（双反斜杠），但画字符画时 `String.raw` 更方便。

*适用版本：LSE JS 后端（QuickJS / Node.js），当前版本*

## 在 LegacyScriptEngine（ScriptX）中，JS 传入的 `undefined` 在 C++ 侧会变成什么？如何区分 `undefined` 和 `null`？

V8 本身区分 `undefined` 和 `null`，但 ScriptX 抽象层把二者统一视为 Null：`Local<Value>::isNull()` 对 `undefined` 和 `null` 都返回 `true`，C++ 侧 `Local<Value>()` 返回给 JS 是 `undefined`。若要真正传 `null` 需要直接使用 `v8::Null(isolate)`，ScriptX 本身未提供区分。因此 API 实现中对可选参数（如 `setTitle` 的 `fadeInTime`/`stayTime`/`fadeOutTime`）应先检查 `isNull`，避免 JS 传 `undefined` 导致错误。

*适用版本：当前版本（ScriptX V8 后端）*

## 如何在服务器控制台快速打印所有已加载 LSE 插件的名称和版本（排查环境用）？

在控制台执行（需安装 QuickJS 引擎 legacy-script-engine-quickjs）：

```text
jsdebug ll.getAllPluginInfo().forEach(info => logger.warn(`${info.name}: ${info.versionStr}`))
```

注意 `ll.getAllPluginInfo()` 返回的是 LeviLamina 已加载的所有 mod（包括原生 C++ mod），每项含 `name`、`versionStr`、`type` 等字段。

*适用版本：当前版本（QuickJS 后端提供 `jsdebug`；Node.js 后端不支持调试命令）*

## 怎样开始写 LSE 的 Node.js 插件？和 QuickJS 插件有什么区别？

Node.js 插件和 QuickJS 插件使用的 LSE API 一样，区别是可以通过 npm 引入第三方库（`package.json` 中设置 `"type": "module"` 可使用 ES 模块）。需安装 LSE 的 nodejs 引擎（lip 变体 `LegacyScriptEngine#nodejs`）。

开发：安装 Node.js，新建目录执行 `npm init` 生成 `package.json` 并在入口文件中编写代码。

部署：把 `package.json` 和源码（不含 `node_modules`）打包成 zip 并把后缀改为 `.llplugin`，放进 `mods` 目录；开服时 LSE 会自动解压到 `mods/插件名`、生成 `manifest.json` 并执行 `npm install` 安装依赖。

类型提示可使用 <https://github.com/LiteLDev/legacy-script-engine-api>（包含 JS/TS 和 Python 的类型定义）。Node.js 后端没有 `jsdebug` 这类控制台调试命令。

*适用版本：当前版本（LeviLamina，nodejs 引擎）*

## 用 LegacyScriptEngine 开发 JS 插件时如何做多文件（模块化）开发？

使用 LSE 的 Node.js 引擎（`lip install LegacyScriptEngine#nodejs` 安装的变体），可按 Node.js 方式组织多文件，用 `require` 引入（CJS），在 `package.json` 中设置 `"type": "module"` 即可作为 ES 模块加载（ESM）。QuickJS 引擎也原生支持 ESModule 多文件，但注意：`manifest.json` 指定的入口模块中的相对 `import` 路径以服务器工作目录（BDS 所在目录）为基准，需写成 `"./plugins/你的插件/xxx.js"`；入口之外的模块之间 `import` 行为符合标准。详见 LSE 文档“语言支持”。

*适用版本：LSE 当前版本*

## LSE JS 插件在顶层直接写 `return` 想停止执行，编辑器不报错但加载时报错 `return not in a function`，如何提前结束？

LSE 的 QuickJS 引擎加载插件入口文件时，先尝试以 ES 模块方式加载（`loadFile`，`JS_EVAL_TYPE_MODULE`），失败再以全局脚本方式 eval；两种方式的顶层都不是函数体，都不允许 `return`，因此会报 `return not in a function`。应把业务代码封装到函数（或 IIFE）里，在函数内 `return` 提前结束。

*适用版本：LSE QuickJS 引擎，当前所有版本*

## LSE Node.js 插件（如 BetterSidebar）加载失败，日志中 `mkdir` 路径出现盘符重复（如 `E:\...E:\...`），或子插件加载路径变成 `xxx/src/plugins`，是什么原因？

插件代码用了 `path.join(process.cwd(), __dirname, 'plugins')`，而 `__dirname` 已是该 JS 文件所在目录的绝对路径，再与 `cwd`（BDS 根目录）拼接会导致盘符重复；去掉 `process.cwd()` 又会指向 `src/plugins`。应按插件实际目录结构基于 `__dirname` 正确拼接（例如 `path.join(__dirname, '..', 'plugins')`），需要修改插件代码。

若是缺少依赖：LSE 加载 Node.js 插件时，如果 `package.json` 声明了依赖且插件目录下没有 `node_modules`，会自动在插件目录执行 `npm install --omit=dev`；否则可在插件目录手动执行 `npm i` 安装。注意 LSE 控制台的 `npm` 命令默认工作目录是引擎目录，而不是插件目录。

*适用版本：LSE Node.js 引擎，当前所有版本*

## LSE 插件用 `ll.imports` 调用 GMLIB 的悬浮字 API 时报错 `Fail to import! Function [GMLIB_API::...FloatingText...] has not been exported!`（中文日志为“导入失败！函数[...]尚未被导出”），怎么解决？

原因是调用时导出这些函数的前置（GMLIB 及其 LSE 导出部分 GMLIB_API）还没有注册导出：前置没有加载，或者你的插件在前置加载完成之前就调用了导入的函数。LSE 是在实际调用导入函数时才去查找导出的（`MakeRemoteCall` -> `RemoteCall::importFunc`），报错也出现在调用的时候。

1. 查看服务器启动日志的 mod 列表，确认 GMLIB 及其 LSE 导出部分已成功加载。
2. 在插件的 `manifest.json` 的 `dependencies` 中声明对 GMLIB（及其导出模块）的依赖，确保你的插件在它之后加载。

装好前置并补上依赖后，悬浮字 API 就能正常导入。GMLIB 为第三方前置。

*适用版本：LeviLamina 当前版本；LSE 当前版本*
