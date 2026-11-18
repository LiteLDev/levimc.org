# LeviLamina 的报错与崩溃

## 错误码

### 错误码 126 是什么意思？

缺少 LeviLamina 或模组的依赖项。请确保 LeviLamina 或模组已完整安装。日志中的依赖诊断（Dependency diagnostic）会列出缺少的依赖项。

### 错误码 127 是什么意思？

LeviLamina 或模组的依赖项版本不正确。日志中的依赖诊断（Dependency diagnostic）会指出哪些依赖项的版本不对。

### 错误码 1114 是什么意思？

Visual C++ 运行库（vcredist）版本太旧。更新 [vcredist](https://aka.ms/vc14/vc_redist.x64.exe) 即可解决。

## 服务器报错

### LeviLamina 启动时报错 `Failed to load Runtime Data` / 缺少 `bedrock_runtime_data`，这个文件怎么来的？服务器访问 GitHub 慢、lip 下载不动怎么办？

`bedrock_runtime_data` 不是运行时生成的，它是 LeviLamina 的依赖包 bedrock-runtime-data，用 lip 安装 LeviLamina 时会自动下载；报错通常是安装不完整。处理：执行 `lip cache clean` 清理缓存，然后在新的空目录里重新安装。如果服务器访问 GitHub 慢或下载卡住，用 `lip config set github_proxy <代理地址>` 设置 GitHub 代理/镜像后重试。面板服用户请联系服务商处理。

*适用版本：LeviLamina 1.x 至当前 26.60.x（通过 lip 安装）*

### 安装或启动 LeviLamina（BDS 服务端）时报缺少 VC 运行库 / DLL（如 `MSVCP140.dll`、`VCRUNTIME140.dll`）、错误码 1114、提示 vcredist 版本过旧，或 lip 安装时 `PeEditor.exe` 报错、LeviLamina 没有加载，怎么办？

这是系统里缺少或版本过旧的 Microsoft Visual C++ 运行库（vcredist）导致的。安装/更新最新的 Microsoft Visual C++ 可再发行组件包 x64 版本即可：<https://aka.ms/vc14/vc_redist.x64.exe>（官方文档当前使用的链接；旧链接 <https://aka.ms/vs/17/release/vc_redist.x64.exe> 也是同一系列）。注意：

1. 必须装 x64 版本，并且要是最新版；只装最新的一个即可，不需要装 2005 起的所有旧版本。DirectX 修复工具等附带的运行库往往不是最新版，可能仍然报错。已安装过的可以运行安装程序选择“修复”，装完可重启电脑再试。
2. 需要的是 VC++ 运行库，不是 Visual Studio（VS 只在开发 mod 时需要），装 .NET 运行时也解决不了这个问题。
3. 装好运行库后重新执行 lip 安装命令（或重新运行 BDS 目录下的 `PeEditor.exe` 生成 `bedrock_server_mod.exe`）。如果之前安装中途失败留下了残留文件导致冲突，建议在空文件夹重新安装或按提示删除冲突文件，必要时用 `lip cache clean` 清理 lip 缓存。
4. 如果运行库已是最新仍然报错（例如错误码 126/127），则多半是 LeviLamina 或 mod 未完整安装、或 mod 与 LeviLamina/BDS 版本不匹配，请按依赖诊断（Dependency diagnostic）的提示处理，推荐用 lip 安装以自动匹配版本。
5. 新版 lip 在 Windows 上安装服务器时会自行检测 VC++ 运行库（注册表 `HKLM\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64` 的 `Installed=1`），缺失时自动下载 `vc_redist.x64.exe` 并以管理员身份静默安装，会弹出用户帐户控制（UAC）提示，请选择“是”；若选了“否”会报 `The Microsoft Visual C++ Redistributable was not installed: Windows did not allow its installer to run as an administrator.`，重新运行命令并允许，或自行从上述链接安装即可。

参见官方文档“问题排除”：<https://levilamina.liteldev.com/zh/user_guides/troubleshooting/>

*适用版本：当前所有 LeviLamina 版本（Windows 服务端，含 26.60.x）*

### 双击 `bedrock_server_mod.exe` 启动 LeviLamina 服务端，窗口一闪就关（没有任何输出、没有 CrashLogger 崩溃日志，删掉插件也一样），怎么排查？

LeviLamina 服务端用 `bedrock_server_mod.exe` 启动（由 PeEditor 从 `bedrock_server.exe` 生成）。闪退时不要双击，先在服务端目录打开终端再运行，窗口就不会关闭、能看到退出前的报错：在资源管理器地址栏输入 `cmd` 回车，或“文件 -> 打开 Windows PowerShell”，然后执行 `bedrock_server_mod.exe`（PowerShell 中写作 `.\bedrock_server_mod.exe`；可输入 `bed` 后按 Tab 补全）；用 lip 管理的服务端也可在服务端目录执行 `lip run`，它会在控制台输出服务端日志。常见原因：

1. 缺少或过旧的 VC++ 运行库（例如提示缺少 `VCRUNTIME140_1.dll`、`CONCRT140.dll`，或报 1114）：安装最新 x64 运行库 <https://aka.ms/vc14/vc_redist.x64.exe>。服务器上闪退、本机正常的情况大多是这个原因。
2. 配置文件写错（如 `server.properties` 或 JSON 配置里把 `true` 写成 `ture`）：按报错修正。
3. LeviLamina 的旧配置文件导致异常：可先备份后删除 `mods/LeviLamina/config` 文件夹（旧安装若使用 `plugins/` 目录，则为 `plugins/LeviLamina/config`），重新启动让 LL 生成新配置。
4. 文件解压损坏或安装不完整：重新解压/用 lip 重新安装，并保持 LeviLamina 与 BDS 版本对应，不要使用旧版本。

*适用版本：当前所有 LeviLamina 版本（Windows 服务端）*

### BDS 启动后控制台只输出 `NO LOG FILE` 之类内容，看不到 LeviLamina 的启动 logo / 加载日志（例如用 lip 升级后），怎么排查？

“NO LOG FILE”那串是原版 BDS 自身的输出，不是问题原因；关键是没有出现 LeviLamina 的启动 logo 和加载日志，说明 LeviLamina 根本没被加载。请确认运行的是 `bedrock_server_mod.exe`，且 `mods/LeviLamina` 目录存在且完整（含 `manifest.json` 和 `LeviLamina.dll`），根目录有 `PreLoader.dll`。新版 LeviLamina 调整过文件位置，旧版本残留在根目录或 `plugins/` 中的文件可能导致加载异常（参见更新日志）。最稳妥的做法是在干净的服务端目录中用 lip 全新安装 LeviLamina，而不是手动拷贝或在混乱的旧目录上升级。

*适用版本：LeviLamina 1.x 及以后（当前 26.60.x），服务端*

### 加载 GMLIB-LegacyRemoteCallApi 等模组时报 `Failed to load mod ... Missing dependency ModAPI`（缺少依赖项 ModAPI），已经装了 GMLIB 仍然不行，该装什么？

ModAPI 是 GroupMountain（GMLIB 系）单独拆出来的基础库，不包含在 GMLIB 里，需要另外安装。最省事的是用 lip 安装依赖它的模组（如 `lip install github.com/GroupMountain/GMLIB-LegacyRemoteCallApi`），lip 会按依赖声明一并拉取 GMLIB-Release、ModAPI-Release、iListenAttentively 等前置；手动安装则到 GroupMountain 的 GitHub（ModAPI-Release 仓库）下载与当前 LeviLamina/GMLIB 版本对应的 ModAPI。

*适用版本：GMLIB 拆分出 ModAPI 之后的版本（GMLIB-LegacyRemoteCallApi 1.13.0 要求 LeviLamina >=26.51.0）*

### 启动 LeviLamina 服务器时提示端口被占用（或崩溃日志显示端口被占用），但配置的端口理论上没被其他程序使用，怎么解决？

多半是后台残留了一个之前启动的同路径 BDS 进程。LeviLamina 启动时会检测到“存在另一个相同路径的 BDS 进程，可能导致网络端口和存档被占用”，并询问是否结束该 PID 的进程（y=是，n=否，e=退出），输入 `y` 即可；也可以在任务管理器中结束 `bedrock_server_mod.exe` / `bedrock_server.exe`。如果确实要在同一台机器上开第二个服务器，需同时修改 `server.properties` 中的 `server-port` 和 `server-portv6`，并把 `enable-lan-visibility` 设为 `false`，否则仍可能冲突。

*适用版本：当前所有 LeviLamina 版本*

### LeviLamina 服务器假死（无响应但进程不退出、没有崩溃日志），卸载插件也排查不出，怎么定位卡在哪里？

1. 先确认 LeviLamina、LSE 和各 mod 都已是最新且互相匹配的版本。
2. 用二分法卸载 mod/插件（含 addon、存档因素）逐步排查。
3. 用调试器抓调用堆栈：安装 WinDbg 或 x64dbg，服务器卡住时 Attach（附加）到 `bedrock_server_mod.exe` 进程，暂停（Break）后查看 Call Stack，重点看 `MC_SERVER` 主线程卡在哪个模块/函数，即可判断是哪个 mod（或 LSE 脚本死循环）导致阻塞。要看到函数名需要配好对应的 pdb（LeviLamina release 提供 debug 包）。
4. 把堆栈截图/文本发给对应 mod 开发者或 LeviLamina 开发者分析。

*适用版本：当前所有 LeviLamina 版本*

### LeviLamina 加载插件/模组时报缺少符号（`Could not find symbol`、API 丢失、`LeviLamina.dll` 导出缺失），已更新 dll 仍报错，怎么解决？

这是符号对不上：模组或其前置是针对别的 LeviLamina/BDS 版本编译的，所需符号在当前版本中不存在（启动日志的依赖诊断中会显示 missing content，错误码通常为 127“依赖版本不正确”）。解决方法：把模组以及 GMLIB 等前置都更新到适配当前 LeviLamina 版本的版本（从各自 GitHub Releases 或 levimc.org/mods 下载），或把 LL/BDS 换到模组支持的版本；如果 BDS/LL 本身安装不完整或版本不一致，用 lip 重新安装匹配的 BDS 与 LeviLamina（如 `lip install github.com/LiteLDev/bds@<版本> LeviLamina`）。

*适用版本：当前所有 LeviLamina 版本*

### LeviLamina 加载模组时报错 `Failed to load manifest for XXX-1.1.0` / `Mod name XXX do not match folder XXX-1.1.0`，改名后又报找不到入口（entry）文件，怎么解决？

1. LeviLamina 要求模组文件夹名与 `manifest.json` 中的 `name` 完全一致。例如把 `mods/LLBlackBEEx-1.1.0` 改名为 `mods/LLBlackBEEx`（去掉版本号）。
2. 改名后报入口加载失败，通常是解压时多套了一层目录（`mods/LLBlackBEEx/LLBlackBEEx/...`），导致 manifest 里 `entry` 指向的文件找不到。把最里层文件夹里的所有文件移动到 `mods/LLBlackBEEx/` 下（`manifest.json` 应直接位于 `mods/<模组名>/` 中），删除多余的内层文件夹，然后重启服务器。

用 lip 安装模组可以避免这类目录问题。

*适用版本：当前所有 LeviLamina 版本（模组目录为 `mods/`）*

### 26.40 服务端使用地狱门需要等很久才能传送、进末地门卡在加载界面，是什么原因？

是第三方插件 FuckMovementAuthority（反服务端移动校验）导致的，卸载后即可正常传送；作者已修复并以 FuckPlayerActionsAuthority 重新发布，更新到新插件即可。

*适用版本：BDS 26.40 + 该第三方插件旧版。未能从源码或文档中直接证实，仅供参考。*

### `server.properties` 设置了 `language=zh_CN` 后，控制台和插件中的方块、物品名称都显示成翻译键名（翻译失效），或启用教育版/存在模组物品后翻译系统异常，是什么原因？

是第三方前置库 GMLIB 的问题：部分版本 GMLIB 的接口会导致翻译系统失效。如果没有依赖 GMLIB 的插件，直接删除 GMLIB 即可恢复；否则更新 GMLIB 或向其作者反馈。删除 `language` 配置本身无效。

*适用版本：BDS 26.40.x + LeviLamina 26.40.x 时期的 GMLIB 版本。未能从源码或文档中直接证实，仅供参考。*

### BDS 装上 LeviLamina 后 `list` 命令的回复出现异常，而原版 BDS 正常，是什么原因？

是第三方前置库 GMLIB 导致的，删掉 GMLIB 即可恢复，与 LeviLamina 本身无关；GMLIB 方面表示已修复，更新 GMLIB 新版本或向其提 issue。

*适用版本：2026 年 10 月前后的 GMLIB 版本。未能从源码或文档中直接证实，仅供参考。*

### BDS（装有 LeviLamina/LSE）启动时报错并崩溃，日志显示内存分配失败（`bad_alloc`），是什么原因？

报错和崩溃都是因为内存分配失败，即物理内存（RAM，不是硬盘空间）不足。案例中机器只剩约 1.5GB 可用内存。需要关闭其他占用内存的程序或增加服务器内存。

*适用版本：当前所有版本（与运行环境相关）。未能从源码或文档中直接证实，仅供参考。*

### LeviLamina 服务器开服正常，但玩家进入时服务端崩溃（stack overflow，trace 显示在 BDS 内部逻辑如随机游泳目标获取区块时崩溃），怎么排查？

这类 trace 只能看出崩溃发生在 BDS 内部逻辑中，通常由某个 mod/插件干扰引起，存档一般没问题。应逐个移除插件排查。案例中定位到是第三方插件 FixCopyItem（通用防刷物品）引起，移除即可。注意号称“全版本通用”的插件也可能在新版本出问题。另外升级 LeviLamina 时必须同时升级到其对应的 BDS 版本。

*适用版本：当前所有版本（排查思路）。未能从源码或文档中直接证实，仅供参考。*

### LeviLamina 启动时出现一条与 `bedrock-runtime-data` 相关的报错（其他功能正常），原因是什么？

原因是 `bedrock-runtime-data` 版本过旧，与当前 LeviLamina 不匹配。LeviLamina 每个版本都依赖特定版本的 `bedrock-runtime-data`（服务端与客户端各自不同），手动安装时需一并更新；用 lip 安装/更新 LeviLamina 会自动安装对应版本。

### LeviLamina 下某个 mod（如 GMLIB）用 lip 安装后加载失败，提示 manifest 可能有问题，应检查什么？

加载失败通常是 mod 本体文件缺失或 `manifest.json` 有问题。`manifest.json` 中 `entry` 必须与实际 dll 文件名一致；`mods` 下该 mod 所在文件夹名必须与 `manifest.json` 中的 `name` 一致，否则无法加载。排查时可只保留该前置和单个依赖它的 mod 逐个加载，以排除其他 mod 冲突（案例中最终是另一个插件冲突导致）。

### LeviLamina 启动时报 LeviLamina 自身玩家信息数据库（LevelDB）打不开的错误，怎么修复？

通常是数据残留/异常关闭导致 LevelDB 目录里的 `CURRENT` 文件指向了不存在的 MANIFEST。当前版本该数据库位于 `mods/LeviLamina/data/playerinfo`（旧版为 `plugins/LeviLamina/data/playerdata`）。解决：用记事本打开该目录下的 `CURRENT`，把内容改成目录中实际存在的 `MANIFEST-xxxxxx` 文件名；或者直接删除该数据库目录（会丢失 LeviLamina 记录的玩家 UUID/XUID/名称映射，服务器运行后会重新记录）。

*适用版本：LeviLamina 1.x 及以上（路径为 `mods/LeviLamina/data/playerinfo`）*

### LeviLamina 启动时报错，原因是 `bedrock-runtime-data` 版本太老，怎么修复？是否需要升级 BDS？

这是服务器根目录下 `bedrock_runtime_data` 数据与当前 LeviLamina 不匹配导致的，不是 BDS 本身的问题（BDS 版本只需与 LeviLamina 要求的一致）。`bedrock-runtime-data` 是 LeviLamina 的 lip 依赖（版本被精确固定），用 lip 重新设置游戏与加载器即可自动装上匹配版本，例如 `lip setup --game 1.26.60 --loader levilamina@26.60.8`（注意：当前 lip 的 `lip update` 会拒绝对 LeviLamina/bds 操作并提示改用 `lip setup`）；也可以从 <https://github.com/LiteLDev/bedrock-runtime-data> 的 release 下载 LeviLamina 的 `lip.toml` 中要求的那个版本，替换根目录的 `bedrock_runtime_data` 文件夹。

*适用版本：当前所有版本（LeviLamina 26.60.8 依赖 bedrock-runtime-data 26.60.6-server.16）*

### LeviLamina 启动时模组无法加载，报依赖缺失（`... is missing` / `missing module`），是什么意思？

字面意思：该模组声明的依赖模组没有安装（`xxx will not be loaded because dependency yyy is missing`），或其 dll 依赖的某个 DLL/符号不存在（`missing module` / `missing content`）。应使用 lip 安装模组以自动补齐依赖（`lip install <包>`），或手动安装缺少的依赖模组/运行库；若是 missing content（缺符号），通常是模组与当前 LeviLamina/BDS 版本不匹配。

### LeviLamina 日志报 `LOG FILE SINK: failed to archive ./logs/latest.log as ./logs\2026-10-28.log: The process cannot access the file because it is being used by another process., continuing in the new file` 是什么意思？

这表示按日期归档日志（把 `latest.log` 重命名为日期文件）时，有另一个进程正在占用该文件导致改名失败；LeviLamina 会改为继续写入新的日志文件，不影响服务器运行。检查是否有其他程序（日志查看器、面板、另一个服务端实例等）打开了 `logs/latest.log`。

*适用版本：LeviLamina 26.x 当前版本*

### LeviLamina 服务器一有玩家进入就崩溃（附 trace 日志和 minidump），是什么原因？

本例根据崩溃日志判断是第三方插件 GMSidebar 导致，移除该插件后恢复正常，插件修复需联系插件作者。一般做法：查看 CrashLogger 生成的 trace 日志中出错模块，定位到具体插件后移除/更新。

*适用版本：安装了 GMSidebar 的服务器（2026-07 前后版本）。未能从源码或文档中直接证实，仅供参考。*

### LeviLamina 服务器上玩家无法连续放置方块、方块被“吞”、走路回弹，原版 BDS 没有问题，可能是什么原因？

多半是某个插件引起的，应逐个移除插件排查。本例中删除第三方插件 bcbk 后问题解决；也可检查 `server.properties` 中与服务端权威移动相关的配置（如 `server-authoritative-movement` 等）是否被改动。

*适用版本：当前所有版本（排查思路）。未能从源码或文档中直接证实，仅供参考。*

### LeviLamina 服务器加载 FAC（直接注入、不经过 LL 加载的原生 dll）后崩溃，原因是什么、怎么解决？

LeviLamina 用 mimalloc 替换了 BDS 的全局内存分配器（memory operator）。直接注入、不经 LeviLamina 加载的原生 dll 若不使用 LL 的 memory operator，与 BDS/LL 之间互相分配/释放内存时会导致崩溃。解决：改为以 LeviLamina 模组形式加载的版本，或联系作者适配；维护者曾提到可使用不替换内存分配器的特殊构建，但会降低整体性能。

*适用版本：LeviLamina 0.13.x 至今（内存分配器替换仍存在）。未能从源码或文档中直接证实，仅供参考。*

### LeviLamina 服务器同时装了 TickGuard 和 GMLib，服务器“崩溃”却没有任何日志（假死），是什么原因？

这是假死，由 TickGuard 与 GMLib 冲突导致：TickGuard 在服务器卡顿时会清理过期的计划刻（pt），清理后 GMLib 仍认为其存在，随后发生违规访问。解决办法：卸载 TickGuard，等作者做兼容修复。

*适用版本：同时安装 TickGuard 与 GMLib 的服务器（2026-09 前后版本）。未能从源码或文档中直接证实，仅供参考。*

### LeviLamina 服务器启动报 `Could not load server.properties file`，但 `server.properties` 文件明明存在，怎么回事？

通常是通过面板/第三方“启动器”启动时，工作目录（启动目录）不在 BDS 根目录，导致 BDS 找不到 `server.properties`。检查启动脚本（如 `start.cmd`）或面板配置，确保以服务器所在文件夹为工作目录启动 `bedrock_server_mod.exe`；也可以在服务器文件夹中用 `lip run` 启动。

*适用版本：当前所有版本（取决于启动方式/环境）。未能从源码或文档中直接证实，仅供参考。*

### LeviLamina 服务器更新到最新版后玩家一直进不去（连接失败），可能是什么原因？

新版本基岩版使用 NetherNet 传输，除 `server-port`（默认 19132，TCP 和 UDP）外还使用 `server-udp-ports`（默认 19132，UDP）。服务器在 NAT 后（端口映射/服务商指定端口/内网穿透）时，需按官方教程配置：开放 TCP+UDP 端口；STUN 获取公网 IP 失败（客户端报错代码 `Door`）时手动告诉服务器公网地址（格式 `<公网 IP>:<外部端口>:<本机端口>`）；端口由服务商决定或使用 frp 等内网穿透时，在 `mods/LeviLamina/config/Config.json` 的 `targeted` 部分关闭 LeviLamina 的 NetherNet 补丁。教程地址：<https://levimc.org/zh-Hans/tutorials/server/let-friends-join/>

*适用版本：LeviLamina 26.x（BDS 1.26.60 等使用 NetherNet 的版本）*

### LeviLamina 服务器玩家点击“下载必要资源包并进入”后一直卡在定位服务器，最后超时断开；同时后台提示 addon 数据“超过阈值”，怎么办？

“超过阈值”只是 addon 存储数据过多的警告，不会导致崩溃，可以忽略。资源包下载卡住可以安装 GMEssentials（gme），在其配置中开启资源包下载修复功能 `resource_pack_download_fix`（设为 `true`）；或者安装 CoResourcePack 插件（<https://www.minebbs.com/resources/coresourcepack.16185/>）。

*适用版本：LeviLamina 26.x，GMEssentials v26.60.0 等适配当前版本的版本*

### LeviLamina 服务器运行中崩溃，trace 日志显示存档（`world/db`）被占用，是什么原因？

存档文件被占用，常见原因是同一个服务端（同一个存档目录）被启动了两次（一服两开），或上一个进程没有完全退出仍占着存档。检查是否有残留的 `bedrock_server_mod.exe` 进程，结束后重启服务器即可。

*未能从源码或文档中直接证实，仅供参考。*

### LeviLamina 服务器频繁崩溃，崩溃日志显示在处理 `ItemStackRequestPacket` 时崩溃，是 addon 导致的吗？

这类崩溃发生在网络层处理 `ItemStackRequestPacket` 时，与 addon 无关；自 2026 年 6 月起出现、8 月报告增多，疑似外挂客户端发送恶意数据包的崩服手段。

*适用版本：2026 年中以后的 LeviLamina/BDS 版本。未能从源码或文档中直接证实，仅供参考。*

### LeviLamina 服务器控制台不显示中文、也看不到 LeviLamina 及 mod 的加载日志，但服务器能进、能被 motd，是怎么回事？

说明 LeviLamina 没有被正常加载，实际运行的是原版 BDS（所以能进服、能 motd，但没有 LL 的日志和 mod 加载）。先确认启动的是安装时由 PeEditor 生成的 `bedrock_server_mod.exe`（PreLoader 会把 LeviLamina 加载进它），而不是原版 `bedrock_server.exe`；然后把控制台日志翻到最上面，查看 PreLoader/LeviLamina 加载阶段的报错（如错误码 126/127/1114）并据此修复。

*适用版本：LeviLamina 服务端当前所有版本*

### LeviLamina 服务器某个维度里堆积了海量实体（如几十万个凋灵头颅、刷沙机掉落物），区块一加载服务器就卡死或内存爆满，无法进游戏执行 `kill`，怎么清理？

不要等区块加载后再 `kill`，应离线清理存档中的实体。可以使用提供离线实体清理功能的第三方插件（如 Cleaner），注意下载与当前 LeviLamina/BDS 版本匹配的版本（以 GitHub release 为准，MineBBS 上可能是旧版）；也可以自己写一个在服务器启动时遍历存档、按维度/坐标范围删除指定实体的一次性 mod，清理完后卸载。如果还能进入存档，也可以用命令方块循环执行 `execute in the_end run kill @e[...]` 之类的命令。

*适用版本：通用思路；第三方插件需匹配当前版本。未能从源码或文档中直接证实，仅供参考。*

### 启动 LeviLamina 服务器时控制台提示检测到另一个同路径的 BDS 进程（显示 PID），询问是否结束，这是什么意思，该怎么选？

LeviLamina 检测到同一路径的 BDS（`bedrock_server.exe` / `bedrock_server_mod.exe`）已有另一个进程在运行，这会导致端口和存档被占用。提示为 `Do you want to terminate the process with PID xxx? (y=Yes, n=No, e=Exit)`：输入 `y` 结束旧进程后继续启动；`n` 不处理继续启动；`e` 退出当前启动。通常选 `y`，或先手动关掉另一个 BDS 窗口。该检测可通过 LeviLamina 配置中的 `checkRunningBDS` 关闭（默认开启）；无控制台输入（如服务化运行）时会自动跳过。

*适用版本：LeviLamina 服务端当前版本*

### 客户端装上 LeviLamina 后（未装任何 mod）游戏一启动就弹报错，卸掉 LeviLamina 又能正常进入，怎么解决？

大概率是 VC++ 运行库（vcredist）过旧：LeviLamina 使用了很新的 C++ 特性，需要新版运行库（典型错误码 1114）。从微软官方下载最新版安装：<https://aka.ms/vc14/vc_redist.x64.exe>（不要用第三方来源的运行库合集，可能版本更旧）；安装时如提示已安装，可选择修复，或先卸载再安装新版。使用 LeviLauncher 时，启动器会为原生模组加载器检查桌面版 VC++ 运行库（x64）并提示安装。

*适用版本：当前所有 LeviLamina 版本（客户端/服务端均适用）*

### LeviLamina 服务端启动时出现黄色警告 `AuthHelper could not find cert`，需要处理吗？

这是 Mojang/BDS 原版自身输出的提示，不影响服务器运行，可以忽略。

*适用版本：BDS 原版行为，与 LeviLamina 版本无关。未能从源码或文档中直接证实，仅供参考。*

### 服务器崩溃，trace 中显示 `LeviLamina.dll -> ll::event::player::PlayerInteractBlockEventHook::detour [PlayerInteractBlockEvent.cpp]`，是 LeviLamina 的问题吗？

该 Hook 挂在 `GameMode::$useItemOn` 上，先发布 `PlayerInteractBlockEvent`，未被取消时再调用原函数。栈停在这里通常表示崩溃发生在事件分发过程中（某个订阅了 `PlayerInteractBlockEvent` 的 mod/插件回调出错），或发生在其后调用的原函数链中（其他 mod 对同一函数的 hook 或游戏本身），一般不是 LL 本身的问题。应提供完整的 trace 日志和 minidump，并逐个排查监听玩家交互方块事件、或 hook 了使用物品/交互逻辑的插件。

*适用版本：LeviLamina 1.x 及以上*

### 服务器踩到“错误方块”（原模组/addon 已移除导致的未知方块）后几秒内卡死、日志提示 BDS crashed，如何清除这些未知方块？

未知方块可能导致服务器假死/崩溃。可以安装社区开发者提供的 LeviLamina 原生模组 CleanerUnknownBlock，放入后重启即可自动清除未知方块；也可以离线用 Chunker 等存档编辑工具把错误方块替换为空气，或删除出问题的区块让其重新生成（操作前先备份存档）。

*适用版本：取决于第三方模组 CleanerUnknownBlock 对当前版本的适配。未能从源码或文档中直接证实，仅供参考。*

### 服务端没有任何报错，客户端却提示数据包破损/断开，服务端和客户端版本一致，怎么排查？

先卸掉所有插件再逐个开启，定位出问题的插件（案例中是 AntiXray 假矿插件导致）。数据包破损的常见原因：插件在非主线程/多线程发包；Glacie 等协议转换插件转换数据包格式出错；插件开发者写 `BinaryStream` 时格式错误。

*适用版本：当前所有版本（第三方插件问题）。未能从源码或文档中直接证实，仅供参考。*

### 正版客户端连接自己电脑上搭的 LeviLamina 服务器（经 frp 穿透）时提示“您必须通过 Microsoft 服务验证”，关掉 `online-mode` 也不行，怎么解决？

检查服务器机器的系统时间：案例中服务器时钟与标准时间相差 6 分钟，导致 Xbox Live/Microsoft 身份验证失败。将服务器系统时间同步为准确时间后即可正常进入（之后若卡在“定位服务器”，多等一会通常可以进入）。

*适用版本：BDS 原版身份验证行为，与 LeviLamina 版本无关。未能从源码或文档中直接证实，仅供参考。*

### LeviLamina 服务端启动时报错无法正常启动（更新插件/手动混装组件后出现），可能是什么原因？

PreLoader 版本、`bedrock-runtime-data` 版本、BDS 版本三者中任意一个与当前 LeviLamina 不匹配就会出现这种启动错误，手动把不同版本的组件混在一起也能复现。应保证三者版本对应，推荐用 lip 统一安装/更新：`lip install LeviLamina`（即 `lip install github.com/LiteLDev/LeviLamina`，会作为一次 setup 执行，安装最新 LeviLamina 及其支持的最新 BDS）或 `lip setup --game <BDS版本>`（自动选择适配该 BDS 的最新 LeviLamina），lip 会按 LeviLamina 的 `lip.toml` 依赖声明安装匹配版本的 PreLoader、`bedrock-runtime-data` 等组件。

*适用版本：当前所有 LeviLamina 版本（服务端）*

## 崩溃日志（CrashLogger）

### LeviLamina 启动时报 `ERROR [CrashLogger] Couldn't Create CrashLogger Daemon Process` 并抛出 `std::system_error` `[0x00000002:system] 系统找不到指定的文件`（或提示缺少 CrashLogger / `crashlogger.exe`），是怎么回事？怎么装 CrashLogger？

这是 LeviLamina 找不到外置的 CrashLogger 守护进程程序（`CrashLogger.exe`）导致的，常见于手动安装、用别人的开服包/整合包解压（exe 被杀软删掉）或文件不完整。该报错不影响服务器运行：创建守护进程失败后 LeviLamina 会自动退回使用内置 CrashLogger，但内置模式在进程内捕获，信息和可靠性不如外置版。修复方法：

1. 推荐用 lip 安装/重装 LeviLamina（已有服务器的工作区执行 `lip install github.com/LiteLDev/LeviLamina`；新建服务器用 `lip setup --game <BDS版本>`，Windows 下默认带 LeviLamina），CrashLogger 是 LeviLamina 的依赖，会自动装好；官方文档已不再提供手动安装说明。
2. 手动补文件：从 <https://github.com/LiteLDev/CrashLogger/releases> 下载 `CrashLogger-windows-x64.zip`，把其中的 `CrashLogger.exe` 放到服务端目录下的 `mods/LeviLamina/CrashLogger.exe`（旧版本是 `plugins/LeviLamina` 下，现已改为 `mods`）。也可在 `mods/LeviLamina/config/Config.json` 的 `modules.crashLogger.externalpath` 指定其相对路径。
3. 不想用外置版时，可在同一配置文件中把 `modules.crashLogger.builtin` 设为 `true` 直接使用内置 CrashLogger；把 `modules.crashLogger.enabled` 设为 `false` 则完全关闭（此时崩溃不会生成任何崩溃日志）。

*适用版本：LeviLamina 26.60.x（mods 目录布局）；CrashLogger 1.4.x*

### LeviLamina 服务器崩溃（控制台直接关闭/什么都没显示）后，崩溃日志和 dmp 文件在哪里？求助时该发什么？

由 CrashLogger 生成，位于服务端根目录（`bedrock_server_mod.exe` 所在目录）的 `./logs/crash/` 下，文件名带崩溃时间，例如 `trace_2026-11-13_23-30-29.log` 和 `minidump_2026-11-13_23-30-29.dmp`。求助时把这两个文件都发出来，优先看 trace 日志（含调用栈、模块列表、寄存器、内存信息）。原生 BDS 没有这个功能。注意：进程被强制结束（如任务管理器结束、断电）时不会有崩溃日志；崩溃发生在 CrashLogger 初始化之前或 CrashLogger 被关闭时也不会生成。常见崩溃原因之一是插件版本与 LeviLamina/BDS 版本不匹配，换成与服务端版本对应的插件即可。

*适用版本：LeviLamina 当前所有版本（外置与内置 CrashLogger 都写到 logs/crash）*

### 崩溃生成的 `trace_xxx.log` 和 `minidump_xxx.dmp` 怎么看？怎么判断是哪个插件导致的？

先看 trace 日志里的 Stacktrace 调用栈，找出不属于 BDS 本体（`bedrock_server_mod.exe`）和系统 DLL 的模块。例如栈中出现 `vanish.dll -> PlayerInteractBlockHook::detour+0xA4 [Hook.cpp:846L]`，说明崩溃发生在 vanish 插件的 hook 里，应找该插件作者处理或移除该插件。需要更深入分析时，可用 WinDbg 打开 `minidump_xxx.dmp`，执行 `!analyze -v` 查看异常和崩溃堆栈（配好对应模块的 pdb 符号路径效果更好）。

*适用版本：LeviLamina + CrashLogger 当前所有版本*

### BDS 崩溃后 CrashLogger 生成的 minidump `.dmp` 文件大小为 0B，无法分析怎么办？

0B 说明崩溃时 dump 没能写出（常见于内存耗尽等严重崩溃）。先看同目录的 `trace_*.log` 是否有调用栈和 Memory Info；如需完整 dump，可以用 Sysinternals 的 procdump 附加到 `bedrock_server_mod.exe` 进程（如 `procdump -e -ma <pid>`）抓取完整 dmp 再分析。注意外置 CrashLogger 已作为调试器附加在进程上时，procdump 的异常监视可能附加失败，需先关闭 CrashLogger（`modules.crashLogger.enabled=false`）或结束 CrashLogger 进程。

*适用版本：LeviLamina 当前版本（procdump 为第三方工具）。未能从源码或文档中直接证实，仅供参考。*

### LeviLamina 服务器崩溃后没有 CrashLogger 的崩溃日志，只靠内置的崩溃捕获够用吗？

建议安装外置 CrashLogger（<https://github.com/LiteLDev/CrashLogger>）。用 lip 安装 LeviLamina 时会作为依赖自动装到 `mods/LeviLamina/CrashLogger.exe`；手动安装或用整合包往往缺这个组件，这也是官方推荐 lip 的原因之一（模块化、不易缺组件）。LeviLamina 内置 CrashLogger 现在也会在 `logs/crash` 下生成 `trace_*.log` 和 `minidump_*.dmp`，但它在崩溃的进程内部运行，严重崩溃（如栈溢出、堆损坏）时可能写不出或信息不全；外置版在独立进程中以调试器方式捕获，更可靠、信息更完整。

*适用版本：LeviLamina 当前版本*

### LeviLamina 服务器频繁崩溃，CrashLogger 日志只显示 `Code: 0xC0000409`、`Module: ucrtbase.dll`，堆栈全是十六进制地址看不出原因，怎么定位？

`0xC0000409` 落在 `ucrtbase.dll` 通常是某个模组（mod）里触发了 abort/快速失败（如未捕获异常、`std::terminate`），并不是 ucrtbase 本身的问题。把相关模组对应的 `.pdb` 符号文件放到模组 dll 旁边（服务端目录下任意子目录均可），外置 CrashLogger 会递归扫描服务端目录加载这些 pdb，堆栈就能解析出函数名和源码行号，从而定位出问题的模组。也可以用排除法逐个移除模组复现。

*适用版本：LeviLamina 当前所有版本（外置 CrashLogger 1.x）*

### 在 wine 环境（面板服）下运行 LeviLamina 服务器崩溃时，CrashLogger 无法输出有效堆栈（读不到 pdb / 缺少模块），怎么处理？

可能是 wine 的 bug 导致外置 CrashLogger 读不到 pdb，或 wine 环境不完整缺少 CrashLogger 所需的 dll（`dbghelp.dll` / `symsrv.dll`）。可以在 LeviLamina 配置文件 `mods/LeviLamina/config/Config.json`（旧安装为 `plugins/LeviLamina/config/Config.json`）中把 `modules.crashLogger.builtin` 设为 `true`，改用内置 CrashLogger，再等崩溃复现：

```json
"modules": {
  "crashLogger": {
    "enabled": true,
    "builtin": true
  }
}
```

另外，进服一分钟左右就崩一般是装了与当前版本不兼容的模组；全新安装、不加模组不崩，则说明是模组问题，应排查/移除不匹配的模组。

*适用版本：LeviLamina 当前版本（wine/Linux 面板服环境）*

## PreLoader 与 PeEditor

### 启动 BDS 时 PreLoader 报错 `Can't load ./plugins/LeviLamina\LeviLamina.dll`、`Error code: 127`、“找不到指定的程序”，怎么解决？

错误码 127 表示 LeviLamina 或模组依赖的某个函数/版本对不上（找不到指定的程序入口）。按顺序排查：

1. 先确认 LeviLamina 版本与 BDS 版本严格对应（推荐用 lip 安装/切换，`lip setup --game <BDS版本>` 会自动选适配的 LeviLamina、PreLoader、PeEditor），并查看 PreLoader 输出的依赖诊断（`Dependency diagnostic`）里是哪个依赖版本不对。
2. 从微软官网（不要用第三方整合包）下载安装最新的 VC++ 运行库 <https://aka.ms/vc14/vc_redist.x64.exe> 并重启。
3. 检查操作系统版本：维护者明确表示 LeviLamina 不支持 Windows Server 2016，至少需要 Windows Server 2019（或较新的 Windows 10/11），系统太旧会缺少所需的系统函数而报 127。云服务器可在面板重装为 Server 2019/2022；不方便重装时可用虚拟机，或改用 Linux 让 lip 通过 Wine 运行 Windows 版 BDS。

*适用版本：LeviLamina 当前所有版本（Windows 版 BDS）*

### 启动 `bedrock_server_mod.exe` 时 PreLoader 报 `Can't load LeviLamina.dll, Error code: 126` 然后闪退，是什么原因？

错误码 126 表示缺少 LeviLamina 或模组依赖的 DLL（找不到指定的模块）。PreLoader 报错后会继续输出依赖诊断（`Dependency diagnostic` / `Analyzing dependency`），等它输出并查看具体缺少的是哪个文件。

常见原因：LeviLamina 或其依赖没有完整安装（PreLoader、PeEditor、CrashLogger、bedrock-runtime-data 等与 LeviLamina 版本不匹配或缺失）、缺 VC++ 运行库。

解决：用 lip 在纯净 BDS 上重新安装 LeviLamina（lip 会带上匹配版本的依赖），其余模组再装回去、存档复制过去；并安装最新 VC++ 运行库 <https://aka.ms/vc14/vc_redist.x64.exe>。若偶发且重启即好，多半是文件被占用或杀毒软件拦截等环境问题。

*适用版本：LeviLamina 当前所有版本（Windows 版 BDS）*

### LeviLamina 服务器突然开不起来，发现 `PreLoader.dll` 被 Windows Defender 当作病毒删除了，怎么办？

这是杀软误报（官方已向微软提交误报）。从隔离区恢复或重新安装 `PreLoader.dll`（例如重新执行 `lip install github.com/LiteLDev/LeviLamina` 或 `lip install github.com/LiteLDev/PreLoader`），并把服务端目录加入 Windows Defender 排除项。

在 Windows Server 上 Windows Defender 是一项服务器功能，也可以在“服务器管理器”中删除该功能（注意 Windows Server 安装其他杀软后默认不会自动禁用 WD）。

*适用版本：当前所有版本（Windows）*

### 更新 vcredist 后装了 LeviLamina 的游戏/服务器仍启动报错，如何进一步调试定位？

下载 x64dbg，在环境变量中设置 `PL_DEBUG=1` 后启动游戏/服务器：PreLoader 在加载完 Runtime Data 后会输出 `PL_DEBUG is set to 1, waiting for debugger to attach...` 并暂停等待。此时打开 x64dbg，点“文件 -> 附加”，双击 MC（或 `bedrock_server_mod`）进程进行调试。

不要一开始就用调试器直接启动，否则可能导致 Runtime Data 加载失败。如果 PreLoader 都起不来（看不到进程），可能是系统问题（如精简版/非官方 Windows），建议检查 Windows 版本。

*适用版本：当前 PreLoader（1.16.x）*
