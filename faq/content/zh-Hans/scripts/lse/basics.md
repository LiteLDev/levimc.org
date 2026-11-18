# LegacyScriptEngine：综合问题

## 这个项目的目的是什么？

该项目的目的是在 LeviLamina 上运行 LLSE 插件。

## 这个项目支持所有 LLSE 插件吗？

几乎支持所有 LLSE 插件，但由于事件触发时机的差异等原因，部分插件可能无法正常工作。

## 这个项目会维持多久？

只要我们维护者有能力、有时间维护这个项目就会一直维护下去。

## LSE 的 Node.js 插件支持热重载吗？用 `ll reload` 后提示成功，随后又输出 `NodeJs plugin XXX exited`，是重载失败了吗？

支持。早期版本（2024 年）Node.js 引擎不支持重载、执行会出错，但 LSE 0.9.0 起已修复插件重载（含 nodejs/qjs/lua），卸载时会停止该插件的 Node.js 环境。用法：控制台执行 `ll reload <插件名>`，也可以 `ll unload <插件名>` 后再 `ll load <插件名>`。

重载成功提示之后又出现 `[legacy-script-engine-nodejs] NodeJs plugin XXX exited with code 0.` 并不是失败：实际顺序是先退出旧实例再重载成功，但“重载成功”是命令输出、立即显示，而 exited 是通过 logger 异步打印、有延迟，所以看起来顺序颠倒。当前版本中退出码为 0 时该消息以 Debug 级别输出，默认日志级别下通常看不到；若以 Error 级别出现且退出码非 0，则说明插件是异常退出，需要查看前面的报错。

注意：LSE 架构源自 LL 早期，重载并非百分之百可靠。用 `mc.newCommand` 注册了命令的插件重载后，旧命令仍留在游戏中，回调会被移除（执行时会提示 `is the plugin unloaded?`）；若重载后出现异常，直接重启服务器，并保持 LeviLamina 与 LSE 为最新版本。

*适用版本：LegacyScriptEngine 0.9.0 及以上（Node.js 引擎）；LeviLamina 1.x 及以上*

## LSE 的 JS 插件（QuickJS / Node.js 引擎）能用 ES Module 的 `import`/`export` 语法吗？用 `import { xxx } from "./xxx"` 加载时报 `Failed to load plugin ...: Unexpected token '{'` 是怎么回事？

两种引擎现在都支持 ESM：

1. QuickJS 引擎：原生支持 ES Module（ES2020）。但 ScriptX 使用 quickjs-libc 的 module loader，加载 `manifest.json` 指定的入口模块时，会把 base path 设为当前工作目录（即 BDS 服务端程序所在目录），而不是插件目录，所以入口文件里的相对路径 `import`（如 `import { initCommand } from "./command/command.js"`）会解析失败，报 `Failed to load plugin xxx: Unexpected token '{'`。解决办法：入口文件中改用相对工作目录的路径，例如 `import { initCommand } from "./plugins/your_plugin/command/command.js"`；或让入口文件只 `import` 真正的入口模块，之后其它模块之间的 `import` 都按标准 ESM 规则解析。也可以用 esbuild 等打包成单个 js 文件。
2. Node.js 引擎：自 LSE 0.10.6 起（PR #268）支持 ESM，在插件的 `package.json` 中设置 `"type": "module"` 即按 ES 模块加载（不设置默认为 CommonJS）。注意 ESM 中 `import` 的文件需带后缀名，静态 `import` 语句只能写在模块顶层（不能放在 `try` 块等里面）。
3. 不支持直接加载 TypeScript，需先用 `tsc` 等编译成 JS（目标模块格式选 ESM 或 CommonJS 均可）。

详见文档 <https://lse.levimc.org/zh/apis/LanguageSupport/> 的“关于 QuickJS ESModule 的路径解析行为”一节。

*适用版本：QuickJS ESM：LSE 各版本；Node.js ESM：LSE 0.10.6 及以上*

## LegacyScriptEngine（LSE）和 LeviLamina（LL）是什么关系？LXL/LLSE/LSE 等缩写分别是什么？

LeviLamina（LL）是 mod 加载器本体，只直接加载原生（native，C++ 编写的 `.dll`）mod；LegacyScriptEngine（LSE）本身是一个 LeviLamina 原生 mod，为脚本插件提供 LLSE API 运行环境，脚本插件依赖它运行。LSE 按语言分为四个引擎：QuickJS（JS，支持 ES Module）、Lua、Node.js（支持 npm）、Python（CPython，支持 pip），服务器上用 lip 安装对应变体，如 `lip install LegacyScriptEngine#quickjs`（`#lua`/`#nodejs`/`#python`），客户端用 LeviLauncher。脚本插件 `manifest.json` 中的 `type` 为 `lse-quickjs`、`lse-lua`、`lse-nodejs`、`lse-python`，原生 mod 为 `native`。

演进关系：LL1 时代的脚本引擎叫 LXL（LiteXLoader）→ LL2（LiteLoaderBDS，LLBDS）时代叫 LLSE → LL3（LeviLamina）上的 LSE，均由 LiteLDev/LeviMC 维护；LSE 能运行绝大多数旧 LLSE 插件，但不是 100% 兼容。其他常见缩写：LO = LeviOptimize（性能优化），LAC = LeviAntiCheat（反作弊）。文档：<https://levimc.org/LegacyScriptEngine/>（旧地址 lse.levimc.org、docs.levimc.org/LegacyScriptEngine/ 已被该地址取代）。

*适用版本：LeviLamina 当前版本；LegacyScriptEngine 0.23.x*

## LSE 中多个插件监听同一个事件（如 `onChat`、`onLeft`），其中一个插件 `return false` 拦截后，其他插件还能收到事件吗？执行顺序是怎样的？LSE 有事件优先级吗？

能收到。当前 LSE 会依次调用该事件的所有监听器，顺序就是注册顺序（一般等于插件的加载顺序）。某个监听器返回 `false` 只会把这个事件标记为拦截，让 BDS（LeviLamina 事件）不再处理它，例如被拦截的聊天消息所有人都看不到，但不会阻止其他 LSE 插件的监听器继续收到这个事件。

LSE 的 `mc.listen` 没有优先级参数。如果需要控制先后，可以在插件 `manifest.json` 里用 `dependencies` 声明依赖：被依赖的插件先加载，它的监听器也就先注册、先执行。如果需要真正的事件优先级（例如做禁言插件，要在其他插件之前拦截 `TextPacket` 或聊天事件），请改用 C++ mod，在 LeviLamina 的 EventBus 上以更高的 `EventPriority` 注册监听。该行为为 0.4.12 之后的事件分发行为。

*适用版本：LSE 当前版本*

## LSE（LegacyScriptEngine）脚本插件能否给玩家打开一个类似箱子的容器界面（假箱/虚拟容器/箱子菜单），并处理玩家点击？

LSE 没有直接打开容器界面或箱子菜单的 API，也已彻底没有旧 LLSE 的 NativeAPI（无法 hook）。

1. 仅展示（只读查看）：可以纯 LSE 发包实现。用 `BinaryStream` 写入数据后 `createPacket`，再用 `packet.sendTo(player)` 或 `pl.sendPacket(packet)` 只发给目标玩家，依次发送：`UpdateBlockPacket`（在玩家附近如头顶伪造一个箱子方块，服务器里实际不存在，其他玩家看不到）→ `BlockActorDataPacket`（写方块实体 NBT，`Items` 列表里每个物品要带 `Slot`）→ `ContainerOpenPacket` 打开容器。打开容器必须对应一个容器方块，不能凭空打开；查看结束后再发包恢复原方块。这只是客户端显示，玩家不能真正拿取物品。经验：箱子可用、漏斗不行；玩家正打开聊天界面时客户端不会弹出容器，可让玩家通过输入命令触发。协议参考 Mojang 官方 <https://github.com/Mojang/bedrock-protocol-docs>（wiki.vg 的 Bedrock 协议页已过时）。
2. 可交互的箱子菜单（点击物品执行操作）：纯 LSE 无法处理收包/回调，需要依赖前置库（如第三方 GMLIB 已封装的箱子菜单/虚拟容器接口），或者直接用 C++ 写原生 mod（C++ 中可配合 iListenAttentively 事件库的 `ReceivePacketEvent` 等收包事件处理点击；iListenAttentively 是 C++ 事件库，LSE 脚本不能直接监听它的收包事件）。简单的按钮交互一般用表单（Form）代替。

LSE v0.23.1 仍无容器界面 API。

*适用版本：LegacyScriptEngine 当前所有版本*

## LSE 的 `setTimeout` / `setInterval` 计时是否受服务器 TPS / tick 速率影响？如何让定时任务不受影响？

会受影响。LSE 的 `setTimeout`/`setInterval` 在服务器主线程上执行，延时会被换算成游戏 tick 数来调度，因此修改 tick 速率或 TPS 下降时实际触发时间会随之变化。在 `onTick` 里每 tick 做检测（如自制 cron）会占用主线程、影响 TPS，更好的做法是算出距下次触发的时间再用 `setTimeout` 调度，耗时操作（如存档压缩）放到其它线程/外部进程。

原生 C++ mod 中若不需要与 tick 同步，可用 `ll::coro` 协程配合 `ll::thread::ThreadPoolExecutor` 等非 tick 执行器按系统时间等待，需要操作游戏对象时再切回 `ll::thread::ServerThreadExecutor`。

*适用版本：LegacyScriptEngine 当前所有版本；LeviLamina 当前版本（C++ 部分）*

## LeviLamina 服务器能运行 / 编写 Python（以及 Node.js）插件吗？原来 LLSE 的 Python 插件能用吗？

可以。LegacyScriptEngine 现已提供 Python 引擎和 Node.js 引擎（早期 LSE 一度不支持，现已不再是问题），用 lip 安装对应变体即可：`lip install LegacyScriptEngine#python`（或 `#nodejs`、`#lua`、`#quickjs`；不带变体时默认安装 QuickJS 和 Lua 引擎）。LLSE 时期的 Python 插件直接放入 `plugins/`（自 0.23.0 起该目录是启动时创建的指向 `mods/` 的链接）后启动服务器会自动迁移（生成 `manifest.json`），重启服务器后即可加载，但 Python 插件生态较少。

另一种选择是写 Endstone 的 Python 插件：通过 LeviStone（EndstoneRuntime）可在 LeviLamina 上运行 Endstone 插件，这是可选方案。

*适用版本：LegacyScriptEngine 0.23.x*

## 新版 LSE 中报错 `找不到事件 onConsoleOutput！In Plugin: xxx`（如 TMEssential 在升级 BDS/LSE 后部分功能失效），`onConsoleOutput` 是被移除了吗？

是。LLSE 时代有 `onConsoleOutput` 事件，但新版 LSE 不再提供，维护者表示不会再加回（hook 输出流给脚本层是糟糕设计）。报错说明插件太老、使用了已不存在的事件，需要由插件作者删除对该事件的监听（`mc.listen("onConsoleOutput", ...)`），一般不影响插件其他功能。对于 TMEssential 这类已停更的插件，建议换用仍在维护的同类插件（例如 YEssential，home/warp 的 json 数据可按其教程迁移）。

*适用版本：LSE 0.10.0 及以上*

## LSE 能在 LeviLamina 客户端上运行吗？怎么安装？能用来写客户端 mod（按键事件、Screen 等）吗？多人游戏时会生效吗？

可以运行，但定位基本是 server only：

- LSE 在 Windows 客户端上只在打开本地存档（单人世界，相当于本地服务端）时运行，用法与服务端相同，服务端的 LSE 插件放到客户端也能跑。
- 连接他人服务器进行多人游戏时脚本不会被激活，LL 的很多服务端 API 在客户端也不可用。
- 维护者表示 LSE 不会往客户端 mod 方向发展，不打算加入按键事件、Screen 等客户端 API；客户端脚本将来只会考虑另写新引擎，目前做客户端 mod 最佳选择仍是 C++。

安装：客户端上用 LeviLauncher 安装 LeviLamina 与 LSE（LeviLauncher 会自动选用正确的客户端版本）。LSE 0.23.1 及更早版本的客户端变体名为 `#client_lua` / `#client_quickjs` / `#client_nodejs` / `#client_python`；下一个版本起（CHANGELOG `[Unreleased]`，迁移到 `lip.toml`）不再有 `client*` 变体，客户端与服务端都安装 `#lua` / `#quickjs` / `#nodejs` / `#python`，由 lip/LeviLauncher 按 side 选取。

只支持 Windows 客户端，安卓客户端不支持。

*适用版本：LeviLamina 客户端版（Windows）+ LSE 0.17.0 及以上；变体命名以 LSE 0.23.1 为界*

## 开发 LSE 脚本插件时能否断点调试？每次查看数据结构都得加输出再重启服务器吗？用 TypeScript 写时如何定位报错行？

官方发布的 LSE 不提供断点调试器（要实现需自行修改 LSE 源码重新编译；且即使服务端暂停在断点上，客户端也会因超时断开）。

- 常规做法是加日志输出后用 `ll reload <插件名>` 重载插件，无需重启整个服务器。
- LSE 还提供交互式命令行用于简单测试：在 BDS 控制台输入 `jsdebug`（QuickJS）、`nodejsdebug`、`luadebug`、`pydebug` 进入/退出对应引擎的交互环境。
- TypeScript 需先用 `tsc` 编译为 JS，报错位置对应的是编译后的 JS，需借助 sourcemap 手动对照回 TS 源码。
- C++ mod 则可以直接挂 Visual Studio 调试器。

*适用版本：LegacyScriptEngine 当前版本（v0.23.1）*

## LegacyScriptEngine 会长期维护吗？会有新的脚本引擎（LeviScript）取代它吗？

早期（2024-02）开发者曾计划在新脚本引擎 LeviScript 完成后停止维护 LSE，但该计划已放弃：2024-10 开发者表示新脚本引擎没人在写、不会写，LSE 会继续存在并维护。

注意 LSE 的 NativeAPI 已被完全移除，不能再在脚本里 call/hook 原生函数。需要更强能力时开发者推荐直接写 C++ mod；需要 ABI 稳定或想用其他脚本语言写插件，可考虑第三方的 Endstone。

## 怎样把服务器数据（比如排行榜）实时显示到网页上？

用插件读取数据，再通过网络接口提供给网页。

- 可以用 LSE 自带的 HttpServer（QuickJS/Lua 也可用）或 Node.js 引擎的 `http` 模块开一个 HTTP 服务器，网页用 JS 轮询。
- 或者用 WebSocket 推送实现实时刷新。
- C++ mod 也可以接入 HTTP 库实现。

*适用版本：LSE 当前版本*

## BDS 服务端插件能给玩家播放音乐吗？有什么现成的方案？

可以，常见两种方案：

1. 播放 NBS（Minecraft Note Block Studio）格式的音符盒音乐，现成插件如 LLSE-NBSPlayer：<https://www.minebbs.com/resources/llse-nbsplayer-bds-nbs.4479/>
2. 把音乐文件打进资源包，再用插件或 `/playsound` 命令播放对应声音，缺点是资源包会比较大。

*适用版本：当前版本（第三方插件需自行确认兼容性）。未能从源码或文档中直接证实，仅供参考。*

## LL3（LeviLamina + LSE）脚本插件有内置数据库吗？需要自己再部署 MongoDB 之类吗？

有。LegacyScriptEngine 提供数据库 API：基于 LevelDB 的键值数据库（`new KVDatabase(dir)`），以及 SQL 数据库会话 `new DBSession(type, params)`，`type` 支持 `"sqlite3"` 和 `"mysql"`。一般无需额外部署 MongoDB，按需选择即可（MySQL 需要自备 MySQL 服务）。

*适用版本：LegacyScriptEngine 当前版本*

## LLSE/LSE 里 `setInterval` 能做到 1 毫秒执行一次吗？

不能。LSE 的定时器任务在服务器主线程执行器上调度，延时会向上取整到游戏刻（1 tick = 50ms），所以精度受 tick 限制，无法做到毫秒级。

另外，如果只是周期性执行命令，用命令方块或 function 的性能比用脚本 `mc.runcmd` 好得多。

*适用版本：LeviLamina + LegacyScriptEngine 当前版本*

## LSE 服务器如何查看玩家 IP 并封禁玩家（xuid/IP）？有哪些插件可用？

LSE 提供获取玩家 IP 的接口：`player.getDevice().ip`（设备信息对象的 `ip` 属性）。

插件方面：

- 查看玩家 IP 可用 s-view。
- 封禁可用 LLBlackBeEx（<https://www.minebbs.com/resources/llblackbeex-_.4405/>），还能把恶意玩家提交到 BlackBe 云黑，装了云黑插件的服务器都会拦截。
- 也可用 gmblacklist 等封禁插件。

注意封 IP 作用有限，换网络/热点即可绕过。

*适用版本：LSE 当前版本（第三方插件需自行确认兼容性）。未能从源码或文档中直接证实，仅供参考。*

## LSE 的 API 更新后文档会同步更新吗？LSE 还会添加新 API 吗？

文档会随 API 同步更新（<https://levimc.org/LegacyScriptEngine/>）。

维护者不会再主动给 LSE 添加新功能，现有 API 也基本保持稳定，但欢迎社区提交 PR，新 API 主要通过社区 PR 加入（例如 0.19.1 由社区贡献加入了 `Packet`、`BinaryStream`、`mc.getMotd`、`mc.summonMob` 等一批 API）。

*适用版本：LSE 当前版本*

## LSE 的 Node.js 引擎是如何处理插件 `package.json` 依赖（`npm install`）并加载插件的？

加载插件时，如果插件目录下的 `package.json` 含有 `dependencies` 字段且插件目录中还没有 `node_modules`，LSE 会先自动执行 `npm install --omit=dev --no-fund`（使用引擎目录自带的 npm），然后创建引擎并加载插件：

- CommonJS 插件通过一段包装启动代码，修改 `require` 的查找路径（加入插件目录及其 `node_modules`）后 `require` 入口文件。
- `package.json` 中 `"type": "module"` 的插件则通过 `import()` 以 ES 模块方式加载。

因此其启动方式不是标准的 `node 入口文件` 启动。

*适用版本：LSE Node.js 引擎（`#nodejs` 变体），ESM 支持自 0.10.6 起*

## LSE 的 `getAllPlayerInfo` 和 GMLIB 的 LegacyRemoteCallApi（GMLRA）提供的获取所有玩家信息有什么区别？

LSE 的 `data.getAllPlayerInfo()` 读取的是 LeviLamina 的 PlayerInfo 服务，数据由 LL 自己维护，存放在 LeviLamina 数据目录下的 `playerinfo` 数据库中（存档外部）；GMLRA 调用的是 GMLIB，数据写在存档数据里。LL 作为加载器不应修改存档数据，所以采用外部存储。

*适用版本：LSE 0.8.13 及以上*

## LSE 的 Python 引擎和 BDSpyRunner（pyr）有什么区别？pyr 插件能直接在 LSE Python 上用吗？

两者是不同的插件加载器，都支持用 Python 开发插件。LSE 的 Python 引擎（`lip install LegacyScriptEngine#python`）与其他 LSE 引擎（Lua/QuickJS/Node.js）共用同一套 API，pyr 的插件不能直接通用，需要按 LSE 的 API 改写。

另外 LSE Python 引擎需要本机安装对应版本的 Python（LSE >=0.16.2 为 3.12.10）。

*适用版本：LSE 当前所有版本*

## LSE 脚本插件能否在事件监听里修改事件数据，比如把玩家攻击造成的 5 点伤害改成 10 点？

不能直接修改。LSE 的 `mc.listen` 事件回调只能读取参数，或者对可拦截的事件返回 `false` 来取消该事件，不能改写事件里的数据（例如 `onMobHurt` 的 `damage`）。如果确实需要修改事件数据，请用 C++ 编写 LeviLamina mod。

在脚本里能做的变通办法是：先拦截原事件，再自行调用相应 API 重新施加效果（例如取消原伤害后对实体调用 `hurt` 造成新的伤害），但这与真正修改事件并不等价。

*适用版本：LegacyScriptEngine 当前所有版本（至 v0.23.1）*

## LSE（LLSE）插件能否实现 JSON UI / ORE UI 这类自定义界面，而不只是表单？

不能。LSE 的 GuiAPI 只提供服务端表单（SimpleForm / ModalForm / CustomForm，以及 FormBuilder），目前没有封装 DDUI 等新版界面 API。JSON UI 这类自定义界面必须由客户端资源包实现。

可行的做法是：编写原版 addon（资源包/行为包）来提供界面，再与 LSE 插件通过约定的信道（例如特定的表单标题或内容标记、`scriptevent`、记分板等）联动。

*适用版本：LegacyScriptEngine 当前版本（v0.23.1）*

## LegacyScriptEngine 是否支持 MySQL 数据库？旧的 NativeApi（dyncall）还能用吗？SQLite 是否可用？

LSE 从 0.9.0 起恢复了 MySQL 支持（底层改用 mariadb-connector-c），通过 `DBSession` 使用：`type` 为 `"mysql"`，或使用 `mysql://root:password@localhost:3306/db` 形式的连接串。0.9.0 发布时 Node.js 引擎不支持 MySQL；目前源码已不再按后端区分，但 Node.js 引擎下是否可用请以实际版本为准。

SQLite（`"sqlite3"`）一直可用，从未被移除。

NativeApi 已在 0.8.19 中被完全移除，不会恢复，依赖 dyncall/NativeApi 的旧插件无法使用。

*适用版本：LSE 0.9.0 及以上（当前 v0.23.1）*

## LegacyScriptEngine 是否有可以在服务器控制台里直接执行 JS/Lua 代码的命令？OP 能否借此在服务器里“新建插件”？

有。QuickJS 引擎提供 `jsdebug`，Lua 引擎提供 `luadebug`。不带参数执行会进入/退出交互调试模式，在控制台逐行执行代码（输入 `stop` 或再次执行该命令即可退出）；也可以用 `jsdebug <代码>` 直接执行一段代码。Python 引擎使用 `pydebug`，仅在控制台中处理；Node.js 引擎没有调试命令。

注意：该命令的权限由 LSE 配置文件（`mods/legacy-script-engine-xxx/config/config.json`）里的 `debugCommandLevel` 决定，默认值为 `GameDirectors`，也就是 OP 默认就能在游戏内执行。能执行任意代码就等于拿到服务器后台权限，非常不安全，建议把 `debugCommandLevel` 调高（例如 `Owner`/`Host`）只留给控制台使用。如果需要给游戏内管理员提供特定功能，应自己写插件注册专用命令。

*适用版本：LSE 当前版本（v0.23.1）；`debugCommandLevel` 配置项为较新版本新增*

## LegacyScriptEngine 的 QuickJS/NodeJS/Python/Lua 各引擎是分开的源码吗？它是怎么实现多语言支持的？

LSE 只有一套源码（<https://github.com/LiteLDev/LegacyScriptEngine>），通过 xmake 的 backend 配置（`lua` / `quickjs` / `python` / `nodejs`）把同一份源码编译成四个引擎：`legacy-script-engine-lua`、`-quickjs`、`-python`、`-nodejs`。

多语言支持基于 ScriptX（最初由腾讯开源的多脚本引擎封装层，LiteLDev 维护着自己的 fork），层次为 LSE -> ScriptX -> QuickJS / Node.js(V8) / Python / Lua。LSE 是 LLSE 的移植版，每个插件分配一个独立的 ScriptEngine 实例。

*适用版本：LegacyScriptEngine 当前所有版本*

## LegacyScriptEngine 里有 `nodejsdebug` 命令吗？

没有可用的 `nodejsdebug`。源码里虽然为 Node.js 后端定义了 `nodejsdebug` 这个名字，但 Node.js 引擎不支持调试引擎，不会注册该命令。可用的调试命令是 QuickJS 的 `jsdebug`、Lua 的 `luadebug`，以及 Python 的 `pydebug`（仅限控制台）。

*适用版本：LSE 当前版本（v0.23.1）*

## iLand 领地插件如何设置领地管理员？

在服务器控制台执行 `land op <玩家名>`，该玩家必须至少进入过服务器一次。iLand 是 LLSE 脚本插件，需配合 LegacyScriptEngine 运行。

*适用版本：使用 iLand 脚本插件的服务器（第三方插件）。未能从源码或文档中直接证实，仅供参考。*

## 为什么 LSE 提供的一些事件在 LeviLamina C++ 中找不到对应的事件，C++ 插件要怎么实现同样的监听？

LeviLamina 只保留了少量核心事件，LL2 时代的大量事件没有搬进 LeviLamina。LSE 为保持对 LLSE 插件的兼容，自己补齐了这些事件：一部分基于事件库 iListenAttentively（LSE 的依赖），一部分在 LSE 内部自己 hook 实现。所以 LSE 事件并不与 LeviLamina 事件一一对应。

C++ mod 想实现同样的监听，可以依赖 iListenAttentively（`lip install github.com/LiteLDev/iListenAttentively`）使用其事件，或者自己写 hook。

*适用版本：LeviLamina 1.x 及以上 / 当前 LSE*

## 在 LegacyScriptEngine 中，一个 JS 插件里定义的全局变量/Map 等数据会不会干扰服务器上其他脚本插件？

不会。LSE 为每个脚本插件创建独立的脚本引擎实例，各插件有独立的全局作用域，彼此变量不会互相干扰。插件间需要共享数据或调用函数时，使用远程调用 `ll.exports` / `ll.imports`（由 LegacyRemoteCall 提供）等机制。

## 如何查看已安装的 LegacyScriptEngine（LSE）版本？

在控制台执行 `ll show <mod名>`（例如 `ll show legacy-script-engine-quickjs`，引擎包名按语言为 `legacy-script-engine-quickjs` / `-lua` / `-nodejs` / `-python`）查看该 mod 的信息和版本；也可用 `ll list` 列出所有已加载的 mod 及版本。

*适用版本：LeviLamina 0.13 及以上*

## 如何给 LSE 添加新的脚本语言支持（例如 PHP）？

LSE 的脚本语言支持由底层 ScriptX 提供，新增语言需要 ScriptX 先有该语言的后端，再在 LSE 中增加对应的引擎变体，不能简单地在 LSE 里直接加。目前 LSE 提供 `lua`、`quickjs`、`nodejs`、`python` 四种引擎。

## 怀疑服务器被后门插件执行了命令，但控制台没有命令记录，怎么排查？

LSE 的 `mc.runcmdEx`（以及 `mc.runcmd`）以服务器身份执行命令，输出被捕获返回给脚本而不会打印到控制台，所以控制台看不到记录很正常。应检查插件列表，并在插件源码中搜索 `runcmdEx`、`runcmd`、`setInterval` 等关键字排查可疑脚本。

## 新手想写一个由 LeviLamina 加载的插件，应该从哪里开始？需要下载 LeviLamina 源码吗？

不需要改 LeviLamina 源码。新手建议先写 LegacyScriptEngine（LSE）脚本插件：

- 项目：<https://github.com/LiteLDev/LegacyScriptEngine>
- 文档：<https://levimc.org/LegacyScriptEngine/>
- 入门教程「写你的第一个脚本插件」：<https://levimc.org/zh-Hans/tutorials/develop/first-script-plugin/>

写代码前先引入 API 类型提示：在项目里执行 `npm install -D @levimc-lse/types`，并在 `tsconfig.json` 的 `compilerOptions.types` 中加入 `"@levimc-lse/types"`（或在入口文件写 `/// <reference types="@levimc-lse/types" />`），这样多人协作时也不会有绝对路径冲突。

想写原生 mod 则需学习 C++ 并配置 VS/xmake 环境（参考 LeviLamina 文档和 levilamina-mod-template）。

## 新版 LSE 每次开服都会自动生成一个 `plugins` 快捷方式（目录链接），删掉还会再生成，这是什么？复制到另一台机器后变成了普通文件夹/链接失效怎么办？

这是预期行为：大部分 LSE 插件硬编码了 `plugins` 路径，所以 LSE 0.23.0 起会在开服时创建指向 `mods/` 的目录链接（Windows 上为 junction）来保证兼容。

目录链接使用绝对路径，把整个服务端文件夹复制到其他机器会使链接损坏，删掉它让 LSE 重新自动生成即可。注意如果 `plugins` 位置已存在同名普通文件/文件夹且不指向 `mods`，LSE 会报错而不会覆盖。

*适用版本：LSE 0.23.0 及以上（LeviLamina 26.60）*

## 有没有能在 Endstone 上运行 LSE（LegacyScriptEngine）插件的插件？

没有。LSE 是 LeviLamina 的模组（native 类型），依赖 LeviLamina 及 LegacyMoney、LegacyRemoteCall、iListenAttentively 等前置，只能运行在 LeviLamina 上（服务器用 lip 安装，客户端用 LeviLauncher 安装）。网上/AI 所说的“Element Zero 兼容 LSE”之类说法不可信。

*适用版本：当前所有版本（LSE 0.23.x / LeviLamina 26.60.x）*

## 服务器里玩家死亡消息显示为“被蓄意的游戏设计杀死”（Intentional Game Design）之类，是外挂吗？原因是什么？

一般不是外挂。原版中“蓄意的游戏设计”是床/重生锚爆炸致死的死亡消息；另外，插件用 LSE 的 `en.hurt(damage[,type[,source]])` 等接口造成伤害且未指定伤害来源时，也可能出现非常规的死亡消息。可排查是否有人在下界/末地用床或重生锚，以及哪个插件在对玩家造成伤害。

死亡消息文本取决于 BDS 原版行为。

*适用版本：LSE 当前版本。未能从源码或文档中直接证实，仅供参考。*

## 用 LSE 写 JS 插件是否必须安装 Node.js / `nodejs` 引擎？

不需要。普通 JS 插件由 QuickJS 引擎（`lip install github.com/LiteLDev/LegacyScriptEngine#quickjs`，不带变体时默认同时安装 QuickJS 和 Lua 引擎）运行，直接放入的单个 `.js` 文件会被识别为 quickjs 插件，迁移后 `manifest.json` 中 `type` 为 `lse-quickjs`。

只有需要 Node.js API 或 npm 包时，才需要安装 `#nodejs` 引擎，此时 manifest 的 `type` 为 `lse-nodejs`。

*适用版本：LSE 当前版本（0.23.x）*

## 编写 LSE（LLSE）JS 插件时，文件开头那行引用类型定义的注释（`/// <reference ...>`）在编辑器里报红线，需要修复吗？会影响插件运行吗？

不影响运行。那行只是给编辑器提供类型信息和代码补全的三斜线注释，报红只是找不到对应的类型定义。

需要补全可按 legacy-script-engine-api 的说明安装 `@levimc-lse/types`，然后在入口文件写 `/// <reference types="@levimc-lse/types" />` 或在 `tsconfig.json` 的 `compilerOptions.types` 中加入它；不需要就可以不管。

若插件运行时后台反复报错，与这行注释无关，应检查其他原因（如 JSON 配置文件格式错误、前置插件缺失或损坏，可重装前置）。

## 能用 LSE（如 NativeCall/NativeAPI）在脚本插件里 hook 游戏函数吗？

不能，也不建议。LSE 的 NativeAPI 已在 0.8.19 被完全移除，脚本插件无法 hook 游戏函数。如需 hook，请直接用 C++ 编写 LeviLamina 模组（可基于 levilamina-mod-template）。

*适用版本：LSE 0.8.19 及以上（当前 0.23.x）*

## 觉得用 C++ 开发 LeviLamina 原生 mod 门槛太高，有没有更简单的开发方式？

可以使用 LegacyScriptEngine（LSE），用 JavaScript（QuickJS/Node.js）、Lua 或 Python 开发插件，相对简单，服务器和 Windows 客户端都可运行。

- 文档：<https://levimc.org/zh-Hans/LegacyScriptEngine/>
- 入门教程：<https://levimc.org/zh-Hans/tutorials/develop/first-script-plugin/>
- 类型提示与脚手架：<https://github.com/LiteLDev/legacy-script-engine-api>

## 在 LSE 中热卸载了注册过命令的脚本插件后，关服时服务器崩溃，为什么？

原版命令系统不支持注销命令。插件卸载后命令仍留在命令注册表中，但回调所在的插件已不存在。当前版本的 LSE 在执行此类命令时会输出警告 `Command xxx failed to execute, is the plugin unloaded?` 而不再执行回调；但仍建议注册了命令的插件不要热卸载/重载，需要更新时重启服务器更稳妥。

*适用版本：LeviLamina + LSE，当前所有版本（关服崩溃是否仍会发生未确认）。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 下用 JS/Lua 等脚本写插件时（LegacyScriptEngine，原 LLSE），API 文档在哪里？LeviLamina 主文档里为什么找不到？旧的 LiteLoaderBDS / lse.liteldev.com / lse.levimc.org 文档打不开怎么办？

脚本插件由 LegacyScriptEngine（LSE）提供，它只是 LeviLamina 的一个模组，所以 LeviLamina 主文档只讲 C++ 模组开发，脚本 API 文档在 LSE 自己的文档里。当前地址：<https://levimc.org/zh-Hans/LegacyScriptEngine/>（英文 <https://levimc.org/LegacyScriptEngine/>），API 索引在 <https://levimc.org/zh-Hans/LegacyScriptEngine/apis/>（例如 Logger：`/zh-Hans/LegacyScriptEngine/apis/ScriptAPI/Logger/`，事件：`/apis/EventAPI/Listen/`）。入门可看官方教程“写你的第一个脚本插件”：<https://levimc.org/zh-Hans/tutorials/develop/first-script-plugin/>。

历史上用过的 `docs.litebds.com`、`lse.liteldev.com`、`legacy-script-engine.levimc.org`、`lse.levimc.org`、`docs.levimc.org/LegacyScriptEngine` 都已是旧地址，以 levimc.org 上的为准；旧 LiteLoaderBDS 文档存档在 <https://liteldev.github.io/liteloaderbds-documentation/>，仅供参考。

新版 JS API 与旧版 LLSE 基本一致，但网上很多 LL v2 时代的教程有些步骤已不需要：插件信息改由插件目录中的 `manifest.json` 声明（`ll.registerPlugin()` 仍可调用但不再是必需）。简单示例：

```js
mc.listen("onJoin", (player) => {
    log(`${player.name}已经加入服务器。`);
    player.sendToast('欢迎！', '感谢您游玩本服！');
});
```

*适用版本：LSE 当前所有版本*

## LSE 插件 `ll reload` 后命令失效或反复报错（如命令注册失败），该怎么办？

用假命令（`mc.regPlayerCmd` / `mc.regConsoleCmd` 等旧接口）注册的命令只会在服务器启动完成（`onServerStarted`）时统一注册一次，插件 reload 后重新调用这些接口不会再被注册，因此命令会失效。文档已不推荐假命令，应改用真命令 `mc.newCommand`：reload 时若命令已存在，只会提示 `Runtime command ... already exists`，并重新应用 `setOverload` / `setCallback`，命令可继续使用。热加载/卸载本为调试而生，存在风险和性能问题，生产环境遇到问题直接重启服务器更可靠。

*适用版本：LeviLamina 当前版本；LegacyScriptEngine 当前版本*

## LSE 有 Markdown 格式的文档吗（比如想喂给 AI）？

有。LSE 文档站由 Markdown 源码生成，源码在 GitHub 仓库 LiteLDev/liteldev.github.io 的 `docs/LegacyScriptEngine/content` 目录下（中文为 `*.zh.md`，英文为 `*.md`，API 文档在 `apis/` 子目录）。另外 LiteLDev/legacy-script-engine-api 仓库提供插件开发的 API 类型提示，也可作为参考。

## LSE 的 Python 引擎插件一直报错，有什么替代方案？

开发者建议：与其使用 LSE 的 Python 引擎（`LegacyScriptEngine#python`），不如使用 LeviStone——它是在 LeviLamina 上运行 Endstone 插件的运行时，可使用 Python 生态。安装方式：在装好 LeviLamina 的 BDS 目录下执行 `pip install levistone --target mods/EndstoneRuntime`（0.11.15 之前的版本目标目录为 `plugins/EndstoneRuntime`）。

*适用版本：LeviLamina 当前版本；LeviStone 0.11.15 及以上*

## 升级服务端后，iLand 领地插件里领地主人显示成“?”，怎么办？

这是升级（换新服务端目录）时没有把 LeviLamina 的玩家信息数据（PlayerInfo，用于 xuid 与玩家名互查）拷过来导致的。可以从旧服务端把 `mods/LeviLamina/data/playerinfo` 目录拷到新服务端，或者等对应玩家重新上线后自动更新。此问题影响依赖 `data.xuid2name` 等接口的插件。

*适用版本：LeviLamina 当前版本；LegacyScriptEngine 当前版本*

## 在 LSE JS 插件里把 `setTimeout`/`setInterval` 的定时时间等数值设成 `99999999999` 这样很大的数，会不会出问题？

会。LSE 读取定时器时间时按 32 位有符号整数转换（`toInt32`），超过 `2147483647` 会溢出成别的值，若变成 ≤0 还会被当作 1 毫秒立即执行。除非清楚会发生什么，否则传给 LSE API 的整数参数都建议小于 `2147483648`（2^31）。

*适用版本：LegacyScriptEngine 当前版本*

## 想在网页上同步显示服务器的动态地图，有什么插件？

这类功能属于网页地图插件，可以去 MineBBS 搜索“卫星地图”等关键词，选择支持当前 LeviLamina/BDS 版本的插件。第三方插件需自行确认是否支持当前版本。

*适用版本：当前版本（第三方插件）。未能从源码或文档中直接证实，仅供参考。*
