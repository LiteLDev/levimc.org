# LegacyScriptEngine 的性能与开发工具

## LSE 中的异步是真正的异步吗？做大量计算会不会卡主线程？

不是真正的多线程异步。LSE 的脚本引擎事件循环在 MC 服务器主线程上执行：QuickJS/Lua 等引擎的消息队列每 tick 轮询一次（`loopQueue` `kLoopOnce`），Promise/`setTimeout` 等只是推迟到主线程后续执行；QuickJS 的微任务（Promise 回调）由 ScriptX 投递到引擎消息队列中执行；Node.js 引擎的 libuv 事件循环和微任务也是由 LSE 在主线程上约每 2 tick 驱动一次（`uv_run` NOWAIT）。所有 MC API 都是同步调用。

因此大量计算无论是否写成 `async` 都会卡住主线程（造成 TPS 下降）。建议把计算拆成小块分 tick 执行；使用 Node.js 引擎时也可尝试把纯计算放到 `worker_threads` 的 worker 里（worker 中不能调用 MC API，此用法官方文档未说明）。Python 引擎文档明确要求暂时不要使用 `threading`、`asyncio` 等特性。

*适用版本：LSE 当前所有版本*

## LSE 的 quickjs 引擎和 nodejs 引擎有什么区别，用的是 V8 吗？性能如何比较？

QuickJS 引擎（`LegacyScriptEngine#quickjs`）使用 QuickJS 作为 JS 引擎，不是 V8；Node.js 引擎（`LegacyScriptEngine#nodejs`）才使用 V8，并支持 npm 包。QuickJS 与 Python 引擎性能高下不一定，V8 是知名的高性能（JIT）引擎；大型项目可以考虑用 Node.js 引擎。

*适用版本：LSE 当前所有版本*

## LSE（原 LLSE）脚本插件能用多线程来提升穷举（如搜索附近矿石）的性能吗？

基本不能。LSE 的脚本 API 都只能在服务器主线程上调用，脚本引擎本身（QuickJS、Lua）没有可用的多线程；即使 Node.js 的 `worker_threads` 或 Python 线程能跑纯计算，也无法在其中调用 LSE/BDS 接口，多进程同样无法与 BDS 交互。需要高性能计算（大范围穷举方块等）时应改用 LeviLamina 原生 C++ mod，或把计算降频、分批到多个 tick 执行。

*适用版本：LegacyScriptEngine 当前所有版本（含 0.23.1）。未能从源码或文档中直接证实，仅供参考。*

## LSE JS 插件在 `mc.listen("onTick")` 中每 tick 读写文件，导致玩家进服变慢、服务器卡顿，如何排查和优化？

用 VS 性能分析（火焰图）等工具可以看到大量文件读写。在插件里搜索 `File.readFrom` / `File.writeTo` 找到在 `onTick` 中读写文件的代码。每 tick 写一次文件等于每秒 20 次磁盘 IO，比 BDS 存档写入频率还高，性能影响很大。应改为几秒写一次（或数据变化时再写）；很多场景不需要监听 `onTick`，可以用 `setInterval` 作为低频版的 tick 定时器。

*适用版本：LegacyScriptEngine 当前所有版本*

## LSE 插件需要大量修改方块（例如清空区块）时，用 `mc.setBlock` 逐个设置还是用 `fill` 命令更好？

在 LSE 中大量逐个调用 `mc.setBlock` 的开销（每次都要跨脚本/C++ 调用并构造方块）比直接执行一次 `fill` 命令更大；大范围修改优先用 `fill`（注意 `fill` 需要目标区块已加载，且单次体积有上限），或考虑加载结构等方式。

*适用版本：LegacyScriptEngine 当前所有版本。未能从源码或文档中直接证实，仅供参考。*

## LSE 的 KVDB（`KVDatabase`）读取很快，但写入嵌套对象/字典时很卡，为什么？怎么优化？

`KVDatabase.set` 会把传入的值通过 `ValueToJson` 转成 JSON：如果传的是对象/数组，LSE 需要递归遍历每个键、逐个从脚本引擎取值并转换，嵌套越深越大就越慢；直接传字符串则只做一次取值，快得多。建议自己先把数据序列化成字符串（例如 `JSON.stringify`，或 NBT 直接序列化为 SNBT/二进制字符串）再存。LevelDB 本身内部已有读写缓存，瓶颈通常在序列化上，不必再自己做一层读写缓存。

*适用版本：LegacyScriptEngine 当前所有版本*

## LSE 自带的 BossBar 接口（`player.setBossBar`）有什么问题？为什么设置 bossbar 时指定的实体会消失？

带 `uid` 的 `player.setBossBar(uid, title, percent, color)` 实现是：先发 BossEvent Remove，再发一个 AddActor 数据包（ActorType 为 `"player"`，`uniqueId`/`runtimeId` 都用传入的 `uid`，位置放在维度最低高度以下），再发 BossEvent Add。也就是每次更新都是删除后重新添加，而不是发送更新包；如果传入的 `uid` 是一个真实存在的实体，客户端会被这个假实体覆盖，所以看起来指定实体消失了。频繁更新时开销也较大，另有反馈称其构造 AddActor 的方式会与其他插件（如 LeviOptimize）的多线程发包冲突。

需要频繁更新 bossbar 时，可改用 GMLIB 等库提供的发送/更新实现（建议调用其导出接口而非照抄），或使用一个不存在的 `uid`。

*适用版本：LegacyScriptEngine 当前所有版本（0.23.1 实现未变）*

## LSE 中大量使用时，执行原版命令（`mc.runcmd` / `mc.runcmdEx`）和调用等价的脚本 API，哪个性能更好？

一般用 API 更好：API 能省去命令字符串解析和命令执行流程的开销，而其背后调用的游戏逻辑和命令基本是同一套。

*适用版本：LegacyScriptEngine 当前所有版本。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 服务器装了七八十个插件（大量 LSE 脚本插件 + addon），高端 CPU 十几个玩家 TPS 只有个位数，怎么优化？

LSE 插件越多服务器越卡：C++ 与脚本层之间的通信本身就耗时，插件越多开销越大。建议：

1. 删掉不必要的 LSE 插件，能用 LeviLamina 原生 C++ mod 替代就替代（如领地用 C++ 的 PLand 代替 Lua 的 iLand）。
2. 只安装需要的脚本引擎变体：用 `lip install LegacyScriptEngine#quickjs`（或 `#lua`、`#nodejs`、`#python`）按需安装，不指定变体时会同时装 QuickJS 和 Lua，用不上的引擎可以卸掉。
3. 完全不装 LSE 时性能最好，再配合 LeviOptimize 更好。
4. 记录玩家行为的日志类插件（如 BehaviorLog）对性能很敏感，容易造成卡顿。
5. 大型生物 addon、大量村民/刷铁机也会显著拉低 TPS。

案例中删掉大量插件和高负载 addon 刷怪规则后，十多人 TPS 回到 17+。

*适用版本：LeviLamina + LegacyScriptEngine 当前版本*

## 为什么说 LL2 的脚本引擎会拖慢服务器？现在的 LSE 在这方面有何不同？

LL2（LiteLoaderBDS）中只要存在脚本插件就会启动全部脚本引擎（JS/Lua/Node/Python），并不按需启动，让性能本就一般的 BDS 更卡。LeviLamina 下的 LSE 将各引擎拆分为独立变体，需要哪个装哪个：`lip install LegacyScriptEngine#quickjs` / `#lua` / `#nodejs` / `#python`；不指定变体时默认同时安装 QuickJS 和 Lua。不需要的引擎不装即可减少开销。

*适用版本：LeviLamina + LegacyScriptEngine 当前版本（0.23.x）*

## 同样数量的循环调用下，LSE 脚本和原版 Script API（addon 脚本）哪个更快、更不容易掉刻？

两者都是在服务器主线程执行 JS，单纯的脚本运算性能差别不大，主要差异在于 C++ 与脚本之间互调的开销；无论哪种都应尽量避免在 tick 中做大量循环，可把工作分批到多个 tick 或降低频率。另外原版 Script API 的 before 事件中不允许修改世界状态时，可以用 `system.run` 等计划任务把操作放到下一 tick 执行。

*适用版本：LegacyScriptEngine 当前版本；原版 Script API 行为取决于 BDS。未能从源码或文档中直接证实，仅供参考。*

## 在 LSE 中调用 GMLIB 的悬浮字 API 会很消耗性能吗？

取决于实现方式：如果是生成真实实体的悬浮字会比较耗性能；GMLIB 的悬浮字是发包实现的（客户端假实体），服务端开销较小。

*适用版本：使用 GMLIB（第三方库）的 LSE 插件。未能从源码或文档中直接证实，仅供参考。*

## 服务器 20 人左右 TPS 只有 10 左右，性能分析显示大量时间在漏斗和 LSE（QuickJS）插件上，是什么原因？

原因是装了监听漏斗事件（`onHopperSearchItem` / `onHopperPushOut`）的 LSE 防刷物类插件，且服务器里漏斗很多：每个漏斗每秒会多次触发这些事件，插件在每次事件回调里都执行一堆逻辑，导致严重卡服。解决办法：卸载/替换该防刷物插件，或者减少漏斗数量。

*适用版本：LegacyScriptEngine 当前所有版本*

## 用 LSE 做矿区刷新时，除了用 `for` 循环逐个 `setBlock`，有没有性能更好的方法？

可以预先把矿区做成结构（NBT structure）保存好，刷新时用 `mc.setStructure(nbt, pos, mirror = 0, rotation = 0)` 一次性放置整个结构。相比在脚本里循环逐个 `mc.setBlock`，一次性放置结构的开销更小。

*适用版本：LegacyScriptEngine 当前版本（0.23.x）*

## 用 LSE 插件通过频繁 `rename` 玩家名，在名字下方显示延迟等信息后，玩家进服会卡几秒，原因是什么？

`pl.rename()` 不只是改名：它会调用 `setNameTag` 并把实体的 ActorData（SetActorDataPacket）重新同步给所有玩家，每调用一次就发一次。如果每 tick 给所有玩家 `rename`，会产生大量数据包，可能挤占/延后正在进服玩家的区块包，导致加载卡顿，同时 `rename` 还会影响命令输出等显示名。

更好的做法是：用 LSE 的发包接口（`BinaryStream` 构造数据包后 `pl.sendPacket(packet)`）只发给需要的玩家，或在 C++ 中 hook 相关数据包修改显示名，并降低更新频率，而不是频繁 `rename`。

*适用版本：LegacyScriptEngine 当前版本*

## 用性能分析工具（如 Visual Studio 诊断 `.diagsession`）分析 LeviLamina 服务器卡顿时，看不出是哪个插件占用高，怎么办？哪些 LSE 插件容易影响性能？

原生 DLL 插件需要配套的 `.pdb` 符号文件才能在分析中看到函数名：检查每个 dll 插件目录下是否有对应的 pdb，没有就去插件下载页获取并放进插件文件夹；pdb 必须与插件实际版本一致，否则仍无法解析。

对于 LSE 脚本插件，分析器（包括 windbg）只能看到 LSE 引擎本身，无法区分具体是哪个脚本插件。若调用栈热点在 tick 中，说明与 `onTick` 有关，可在插件目录的 `*.js` 文件中全局搜索 `onTick`（如用 VSCode/Notepad++），找出 `mc.listen("onTick", ...)` 的插件；监听 `onTick` 的 LSE 插件（如 TMEssential）都会带来持续开销，LSE 本身加载也有一定开销。

*适用版本：LeviLamina + LegacyScriptEngine 当前版本*

## LSE nodejs 引擎长时间运行（约 18 小时）后报 `JavaScript heap out of memory` 导致崩服，内存限制能调吗？

旧版 LSE nodejs 使用 Node 16，新版使用 Node 22。堆内存由 Node/V8 管理并有上限，理论上可通过 Node 启动参数 `--max-old-space-size` 调大（LSE 本身没有提供配置项传入该参数，可尝试在启动 BDS 前设置环境变量 `NODE_OPTIONS=--max-old-space-size=<MB>`，未经官方确认）。不过此类问题多半是插件随时间不断创建对象未释放（内存泄漏）造成，应优先排查插件；临时办法可以定时重载插件。

*适用版本：LSE nodejs 引擎（Node 22）当前版本*

## 写 LSE（原 LLSE）JS/TS 插件时，有没有官方的类型定义（`.d.ts`）/代码补全库？HelperLib、LiteLoaderSE-Aids 还能用吗？

有。官方类型定义由 LiteLDev/legacy-script-engine-api 仓库维护（原 HelperLib 仓库已改名为它，旧链接 `github.com/LiteLDev/HelperLib` 会跳转过去），JS/TS 平台以 npm 包 `@levimc-lse/types` 发布：

1. 在插件项目中执行 `npm install -D @levimc-lse/types`。
2. 在 `tsconfig.json`（或 JS 项目的 `jsconfig.json`）中加 `"compilerOptions": { "types": ["@levimc-lse/types"] }`，或在入口文件顶部写 `/// <reference types="@levimc-lse/types" />`。

注意：截至 2026-11-18，npm 官方源 `registry.npmjs.org` 上 `@levimc-lse/types` 返回 404（yarn 源、jsDelivr 也取不到），国内镜像 npmmirror 仍保留 2.18.7。若官方源安装失败，可用 `npm install -D @levimc-lse/types --registry=https://registry.npmmirror.com`，或直接从 legacy-script-engine-api 仓库 `platforms/javascript/src` 复制 `.d.ts`，并用 `/// <reference path="本地路径/index.d.ts" />` 引用。

旧写法 `/// <reference path="node_modules/helperlib/src/index.d.ts"/>` 已过时；`reference path` 只能指向本地文件，不能写 URL。该仓库也提供 Python 平台的提示库。

VSCode 扩展 LiteLoaderSE-Aids 本质只是一键引入补全并可选 BDS 目录开服，官方仓库已归档不再维护（社区有魔改版 LiteLoaderSE Aids Magic Revision，另有第三方扩展如 LLScriptHelper-MR、社区 npm 包 `levilamina` 等，均非官方）。

不用扩展也可以测试：在 VSCode 终端 `cd` 到服务端目录，PowerShell/cmd 下运行 `.\bedrock_server_mod.exe`（Git Bash 下 `./bedrock_server_mod.exe`）即可。

LSE 的公共 API 与旧 LLSE 基本一致，旧 LL v2 时代的声明大体可用，但建议以官方 `@levimc-lse/types` 为准。

*适用版本：当前版本；`@levimc-lse/types` 2.18.x*

## LSE 能直接加载 TypeScript 吗？用 TS 写 LSE 插件 `tsconfig` 怎么配，多文件项目怎么打包成一个插件 js？

LSE 不支持直接加载 `.ts`，也不做即时编译，需要先编译/打包成 JS 再加载（可用 `tsc --watch` 或打包器）。

类型用官方包 `@levimc-lse/types`（截至 2026-11-18 npm 官方源返回 404，可加 `--registry=https://registry.npmmirror.com` 安装，或从 legacy-script-engine-api 仓库 `platforms/javascript/src` 取 `.d.ts`），在 `tsconfig.json`（文件名必须是 `tsconfig.json`）中设置 `"types": ["@levimc-lse/types"]`。部分类型声明是全局声明、没有默认导出，不要去 `import` 它们，直接使用全局的 `mc`、`ll`、`log` 等即可。

多文件项目可用打包器合并为单个文件，例如社区模板 dmblock/lse-typescript-template（rolldown）：

- `tsconfig` 关键项：`"target": "es2024"`、`"module": "commonjs"`、`"moduleResolution": "node"`、`"esModuleInterop": true`、`"skipLibCheck": true`、`"types": ["@levimc-lse/types"]`、`"rootDir": "./src"`、`"outDir": "./dist"`。
- `rolldown.config.ts`：`defineConfig({ input: 'src/index.ts', output: { file: 'dist/bundle.js', format: 'cjs' }, external: ['ll', 'mc'], platform: 'node', tsconfig: './tsconfig.json' })`。
- 使用方法：`git clone https://github.com/dmblock/lse-typescript-template` 后删除 `.git`，执行 `pnpm install`，`pnpm dev` 监听开发、`pnpm build` 构建，把 `dist/bundle.js` 改名放进插件目录（配 `manifest.json`）。

只 `import` 不使用的模块会被 tree-shake 掉。

另外，QuickJS 引擎原生支持 ES Module 的 `import`/`export`（入口模块相对路径解析有特殊行为，见文档 LanguageSupport）；若用 Node.js 引擎，则按 npm 项目打包，`package.json` 入口指向编译后的 js，`node_modules` 不要打进压缩包。

## 如何在 Windows 上编译 LSE 所用的 `libnode.dll`（网上教程多是 `.so`）？

在 node 源码目录执行 `.\vcbuild.bat dll`。如果要像 LSE 一样用到 v8 内部的东西（如 `v8_libplatform`），还需修改 `tools/v8_gypfiles/v8.gyp`，参考 <https://github.com/LiteLDev/node/commit/80d31fc05ed413e3b29fbbdb0a4dc380eab2f5e3>。

LSE 实际使用的是 LiteLDev/node fork 的预编译包（当前为 v22.12.0），一般无需自行编译。

*适用版本：当前版本（LSE nodejs 后端，Node.js v22.12.0）*

## 用 TypeScript 写 LSE 插件时，LSE 提供的 `File` 类与 JS/DOM 内置的 `File` 冲突报错，怎么解决？

冲突来自 TypeScript 默认 lib 中 DOM 自带的 `File` 类型。在 `tsconfig.json` 中显式设置 `"lib"`，只写 ES 版本（如 `["ES2020"]`），不要加 `"dom"`，LSE 的 `File` 声明即可生效；可配合 `"skipLibCheck": true`。

类型声明可用 `npm install -D @levimc-lse/types` 并在 `compilerOptions.types` 中加入 `"@levimc-lse/types"`。如果用的是 Node.js 引擎，也可以直接用 Node 的 `fs` 模块。

*适用版本：当前版本（JS/TS 插件开发）*
