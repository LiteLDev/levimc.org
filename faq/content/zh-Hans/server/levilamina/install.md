# 在服务器上安装 LeviLamina

## LeviLamina

### LeviLamina 支持 Linux（或 macOS、ARM）吗？在 Linux 上怎么运行装有 LeviLamina 的服务器？

LeviLamina 没有原生 Linux 版，只能加载进 x64 的 Windows 版 BDS，官方 release 也只提供 `windows-x64` 的包。维护者给出的原因：Linux 版 BDS 现在没有符号；线程、异常、hook 等机制和 Windows 不同，mod 还得重写一遍；而且实测在 wine 下跑 Windows 版 BDS 的性能反而比原生 Linux 版 BDS 更好。所以短期内没有原生 Linux 版的计划。

在 Linux 上的做法是用 Wine 运行 Windows 版 BDS + LeviLamina：

1. 直接用 lip（推荐）：lip 现在有 Linux x64 和 macOS 版。它自带 Wine（Linux 上来自 Kron4ek/Wine-Builds），会自动装进 VC++ 运行库，不需要你另装 Wine。命令和 Windows 上一样：`lip setup --game <版本>`（会同时装好游戏和支持它的最新 LeviLamina，无需再单独 install LeviLamina；脚本/容器里加 `--accept-eula`），然后 `lip run`。
2. 用官方 Docker 镜像：`docker run -d -it --name levilamina -e EULA=TRUE -p 19132:19132/udp -p 19132:19132/tcp -v levilamina-server-data:/data ghcr.io/liteldev/levilamina-server:latest-wine`（必须设 `EULA=TRUE`，宿主机得是 x64）。教程见 <https://levimc.org/zh-Hans/tutorials/server/docker/>。如果要用 LeviStone（在 LeviLamina 上运行 Python 写的 Endstone 插件），有 `ghcr.io/liteldev/levistone-server:latest-wine` 镜像。
3. 也可以先在 Windows 上把服务端目录装好，再整个拷到 Linux 用 wine 运行；同一个服务器文件夹可以在不同系统之间搬。自己装 Wine 的话请用较新版本。

其他平台：

- x64 macOS：可以通过 lip 的 Wine 运行。
- Apple 芯片的 macOS：要用 lip 的 Wine 加 Rosetta 2。
- arm64 Windows：由系统模拟 x64，可以运行。
- arm64 Linux：官方不支持。box64、FEX、Hangover 等方案都不能可靠地运行 LeviLamina 服务器，建议换 x64 机器。
- Android、iOS：不支持。
- 32 位：BDS 本身就不支持。

商家的 Linux 面板服一般装不了，需要有 Docker 权限或者能自己运行 lip 的机器。如果一定要在 Linux 上原生运行带插件的服务器，可以考虑 Endstone 等其他加载器，但它和 LeviLamina 生态不兼容（反过来，LeviStone 可以让 Endstone 插件跑在 LeviLamina 上，但仍需 Wine）。

*适用版本：当前所有版本（LeviLamina 26.x，lip 0.41.x，docker-levilamina-server latest-wine）*

### LeviLamina（LL3）服务端怎么安装 addon（行为包/资源包、`.mcpack`/`.mcaddon`）？LL2（LiteLoaderBDS）的 AddonsHelper 还有吗？

LL2 的 AddonsHelper（`addonshelper` 文件夹）在 LeviLamina 中已不存在，放进去不会有任何反应。LeviLamina 服务端和原版 BDS 一样支持 addon，可选方式：

1. 原版方式：把解压后的包放到 `./behavior_packs`、`./resource_packs`（或 `worlds/<存档>/behavior_packs`、`resource_packs`），再在 `worlds/<存档>/world_behavior_packs.json`、`world_resource_packs.json` 中写入包 `manifest.json` 里 `header` 的 `uuid`（pack_id）和 `version`。判断是资源包还是行为包要看 `manifest.json` 中 `modules` 的 `type`（`resources` 为资源包，`data`/`script` 为行为包），不要看文件名。
2. LeviLamina 1.9.6 起，服务端会从 mod 目录下的 `resource_packs/`、`behavior_packs/` 子目录（如 `plugins/<Mod名>/behavior_packs`，LeviLamina 自身为 `plugins/LeviLamina/behavior_packs`）加载已解压的包，其中行为包会被自动加入行为包栈，无需编辑存档的 json（主要供 mod 自带包使用）。
3. 想直接丢 `.mcaddon`/`.mcpack`/`.zip` 自动加载：安装社区 mod GMEssentials（`lip install github.com/GroupMountain/GMEssentials-Release`，依赖 GMLIB 等），在其配置 `features` 中把 `addon_loader` 的 `enable` 改为 `true`，然后把包放到服务端根目录的 `./addons`（目录可在 `addon_loader.directory` 中修改）。GMEssentials 的 `addon_loader` 默认关闭（其他部分功能如 `chat_formatter`、`dynamic_motd` 默认开启），改配置后需 `ll reactivate GMEssentials` 或重启；它也带有清理未知方块（`cleaner_unknown_block`）功能。
4. 独立 CLI 工具 <https://github.com/harry-xi/addon-manager> 也可管理 BDS addon。

注意：`LiteLDev/LegacyAddonsManager` 和 `pingguo114514/AddonsManager` 均已归档，且依赖的 7-zip 包已无法解析，当前 lip 无法正常安装，不要再用。

*适用版本：LeviLamina 当前版本（26.60.x）；第 2 种方式需 LeviLamina 1.9.6 及以上*

### 如何在 Minecraft 基岩版（Windows）客户端上安装 LeviLamina 客户端版？能手动安装吗？

不建议手动安装（步骤比想象中麻烦得多）。当前推荐用 LeviLauncher 安装：在“下载”页选“加载器”一栏显示 LeviLamina 的受支持 GDK 版本，安装实例时保持“安装 LeviLamina”打开并选择最新 LeviLamina 版本即可；已有实例可在“实例设置”→“加载器”标签页安装/更新/移除 LeviLamina；之后可在“LeviMC 模组”里安装客户端模组（或在“管理模组”中导入 `.mcmod`）。LeviLauncher 自动安装 LeviLamina 仅限受支持的 GDK 版本。注意当前的 lip 只管理服务器（lip 文档 FAQ：“Can lip install client mods? No. lip manages servers only.”），客户端的 LeviLamina 和模组由 LeviLauncher 这类启动器管理。从 LeviLamina 26.60.8 起包已移除 `#client` 变体，默认变体同时含服务端和客户端构建，旧包在 `tooth.json` 中声明的 `#client` 依赖会由 LeviLauncher 解析到默认变体。服务端 mod 可能需要重新编译适配客户端才能使用。

*适用版本：LeviLamina 1.8.0 及以上（客户端支持）；LeviLauncher Windows 版*

### 迁移 LeviLamina 服务器时只拷贝存档（`worlds`）够吗？LeviLamina 及经济、领地等 mod 的玩家数据存在哪里？

不够。LeviLamina 自身的数据（如玩家信息库 `playerinfo`，基于 LevelDB 的 KeyValueDB，记录 UUID/XUID/玩家名对应关系）存放在 `mods/LeviLamina/data/` 目录（旧版为 `plugins/LeviLamina/data/`），迁移时需一并复制。各 mod 的数据在各自目录下，例如 LegacyMoney 的经济数据是 `mods/LegacyMoney/economy.db`，领地等其他 mod 的数据把对应 mod 目录下的数据文件一起打包迁移即可。玩家信息库默认按需启动（有 mod 使用时才加载），如需始终启用可在 `mods/LeviLamina/config/Config.json` 中设置 `targeted.playerInfo.alwaysLaunch` 为 `true`。mod 目录为 `mods/`，早期 0.x 版本为 `plugins/`。

*适用版本：LeviLamina 当前版本*

### 安装 LeviLamina 只能用 lip 吗？能不能手动把 GitHub Release 的 zip 解压到 BDS 目录？网上教程手动安装后报错/缺 DLL 怎么办？

官方推荐、也是官方文档唯一给出的方式是用 lip 安装，不建议手动解压拼装。

推荐做法：从 <https://github.com/LiteLDev/lip/releases/latest> 下载 `lip-<version>-win-x64.msi` 安装，新建一个空文件夹，在其中运行 `lip`（图形化终端界面，选「创建服务器」），或用命令行：`lip setup --game 1.26.60`（也可 `lip install LeviLamina` / `lip install github.com/LiteLDev/LeviLamina@<版本>`）。lip 会自动下载对应版本的 BDS 及全部依赖，并生成 `bedrock_server_mod.exe`。启动时要用 `lip run` 或 `bedrock_server_mod.exe`，而不是原版 `bedrock_server.exe`。连不上 GitHub 时在 lip 中配置代理/镜像。

若坚持手动安装（不受官方支持，容易出错）：需要把 lip 做的事全部手工做一遍——阅读包根目录的 `lip.toml`（旧版为 `tooth.json`），按其中 `deps` 下载对应版本的依赖（bds、CrashLogger、levilamina-loc、PeEditor、PreLoader、bedrock-runtime-data），按 `place` 字段放置文件（LeviLamina 的 `levilamina-v<版本>-server-release-windows-x64.zip` 中的 `LeviLamina/` 放到 `mods/LeviLamina/`），最后在服务器目录执行 `PeEditor.exe -mb` 生成 `bedrock_server_mod.exe`。普通用户下载 release 版，debug 版仅供开发调试。手动安装的细节以各包的 `lip.toml` 为准。

注意：网上提到 `LiteLoader.dll`、`LLMoney.dll`、`.lib` 文件、直接把 dll 丢进 `plugins` 的教程属于已归档的 LiteLoaderBDS（LL2）时代，已过时，与 LeviLamina 不兼容（经济插件现为 LegacyMoney）。请以官方教程 <https://levimc.org/zh-Hans/tutorials/server/first-server/> 为准。

*适用版本：LeviLamina 当前版本（26.60.x）；lip v0.4x*

### LeviLamina 的模组/插件应该放在哪个目录？手动解压放进去后不加载、也没有报错，怎么排查？

推荐用 lip 安装模组：`lip install <模组地址>`（如 `lip install github.com/LiteLDev/LeviOptimize`，LiteLDev 的包可用短名 `lip install LeviOptimize`；LSE 用 `lip install LegacyScriptEngine#lua` 等），lip 会自动处理目录结构和依赖。

手动安装时注意：

1. 目录：模组放在服务器根目录的 `mods/` 下，每个模组一个独立文件夹，即 `mods/<模组名>/manifest.json`。安装 LegacyScriptEngine 后，LSE 启动时会把 `plugins/` 做成指向 `mods/` 的链接，所以旧教程中的 `plugins` 实际就是 `mods`。
2. 压缩包要把里面那个“含 `manifest.json` 的文件夹”整体放进去，不能多套一层目录（打开模组文件夹应直接看到 `manifest.json`）；没有 `manifest.json` 的文件夹会被静默跳过、不报错。
3. 文件夹名必须与 `manifest.json` 里的 `name` 一致（例如不要保留/添加“[MineBBS]-”前缀），否则会报 `Mod name ... do not match folder ...`。
4. 只有为 LeviLamina 开发的模组才能加载。单独一个 `.dll` 通常是 LiteLoaderBDS（LL2）插件，LeviLamina 无法使用；已停更的 LL2 时代插件也不行。单个旧式 `.js`/`.lua`/`.py` 脚本（需已装对应 LSE 引擎）丢进 `plugins/` 后，LSE 会在下次启动时为它生成文件夹和清单，再重启一次才会加载。
5. 检查前置依赖是否已安装并成功加载（看控制台/`logs` 中的依赖报错），可用 `ll list` 查看已加载的模组。
6. 若 `manifest.json` 中设置了 `"passive": true`，该模组不会在启动时自动加载（只在被依赖时加载），可用 `ll load <模组名>` 手动加载。
7. 加载报错时也可能是 VC 运行库过旧，安装最新的 Visual C++ 可再发行程序包 x64：<https://aka.ms/vc14/vc_redist.x64.exe>。

另外，addon（行为包/资源包）与服务端模组是两回事，不要把模组放进行为包/资源包目录。

*适用版本：LeviLamina 1.x 及以上（当前 26.60.x）；`plugins` 链接需安装 LegacyScriptEngine*

### LL3（LeviLamina）是什么、去哪里下载和安装？和 LiteLoaderBDS（LL1/LL2）什么关系？新版 BDS 还能用 LL2 吗？版本怎么选？

LL1、LL2 都叫 LiteLoaderBDS，早已停止维护，新版 BDS 无法使用；LL3 就是 LeviLamina，是 LiteLDev（LeviMC）团队的模组加载器，很多模组（如 CoralFans）都以它为前置。仓库/发布：<https://github.com/LiteLDev/LeviLamina>。

推荐用 lip 安装：从 <https://github.com/LiteLDev/lip/releases/latest> 安装 lip，在空文件夹里运行 `lip`（界面中选“创建服务器”）或命令 `lip setup --game <游戏版本>`（如 `lip setup --game 1.26.60`），lip 会装好对应的 BDS 和适配的 LeviLamina；`lip install LeviLamina` 则安装最新 LeviLamina 及其支持的最新游戏版本。

LeviLamina 版本与游戏版本一一对应，不能随便选：例如 LeviLamina 26.60.x 对应 1.26.60，26.10.x 对应 1.26.10，1.9.x 对应 1.21.132。对照表见官方文档“支持的版本”页。

文档：教程 <https://levimc.org/zh-Hans/tutorials/server/first-server/>，LeviLamina 文档 <https://levimc.org/zh-Hans/LeviLamina/>（旧地址 `levilamina.liteldev.com`、`lamina.levimc.org` 的安装页已迁移到 levimc.org 教程）。

*适用版本：当前所有版本（LeviLamina 26.60.8；lip 0.41.x）*

### 装了 LeviLamina（及 LSE）的服务器怎么升级到新的 BDS/LeviLamina 版本？必须全部重装吗？

升级前先备份整个服务器目录，并确认用到的模组已有适配新版本的版本。

方式一（lip 工作区，推荐）：停服后在服务器目录运行 `lip setup --game <新游戏版本>`（可先加 `--dry-run` 查看计划），或在 lip 界面的工作区菜单选“更改游戏或加载器版本…”。lip 会卸载旧 BDS、安装新 BDS 和适配的 LeviLamina，并保留 `server.properties`、`allowlist.json`、`permissions.json`、`worlds/`、`mods/`；没有适配版本的模组会被列出并询问是否卸载。注意 `lip update` 只更新模组，不会改变游戏和 LeviLamina 版本。`behavior_packs/`、`resource_packs/` 里自己放的包会被删除，需先在工作区外留副本。

方式二（全新安装）：新建空文件夹，用 lip 安装新版服务端（`lip setup --game <版本>`，再用 `lip install` 安装需要的模组，如 `lip install LegacyScriptEngine#quickjs`），然后把旧服的 `worlds/`、`server.properties`、`allowlist.json`、`permissions.json` 复制覆盖过去，再把旧 `mods/` 里各模组的配置和数据复制过去（不要覆盖新装的模组文件），服务器层的资源包/行为包也一并复制。

LSE 的脚本插件一般可直接沿用；原生（C++）模组必须换成适配新版本的版本。升级后若报错或崩溃，查看启动日志定位不兼容的模组。

*适用版本：LeviLamina 当前版本；lip 0.41 及以上（`lip setup`）；全新安装迁移方式适用于所有版本*

### 已经在运行的原版 BDS 服务器能否直接加装 LeviLamina？需要重装吗？

可以，存档不需要重做，但 LeviLamina 与 BDS 版本严格绑定：每个 LeviLamina 版本只适配特定的 BDS 版本（例如 LeviLamina 26.60.8 依赖 BDS 1.26.60），原版 BDS 版本不匹配时必须换成 LeviLamina 支持的版本。

推荐做法：新建一个空文件夹，安装 lip 后在其中执行 `lip install LeviLamina`（会自动下载适配的 BDS、LeviLamina 及 PreLoader、PeEditor、bedrock-runtime-data 等依赖，并由 PeEditor 生成 `bedrock_server_mod.exe`），或用 `lip setup --game <BDS版本>` 指定游戏版本（会自动选择适配该版本的最新 LeviLamina）。然后把旧服务器的 `worlds/`、`server.properties`、`allowlist.json`、`permissions.json` 等复制过去，用 `lip run` 或双击 `bedrock_server_mod.exe` 启动。

不建议手动拼装（手动放入 `bedrock_runtime_data`、PeEditor、LeviLamina 本体再运行 PeEditor），容易漏依赖。

*适用版本：当前所有 LeviLamina 版本（lip 0.41.x 的 install/setup 语义）*

### 装好 lip 后，如何从零安装 LeviLamina 服务端（以及 LegacyScriptEngine）？

1. 安装 lip，新建一个空文件夹作为服务器目录，在该目录打开终端（cmd 或 PowerShell）。
2. 执行 `lip install LeviLamina`（等同 `lip install github.com/LiteLDev/LeviLamina`），lip 会自动下载 LeviLamina 支持的最新 BDS 并完成配置，期间需输入 yes 同意 Minecraft EULA（脚本中可加 `--accept-eula`）。也可用 `lip setup --game <版本>` 指定游戏版本。
3. 需要脚本插件时再安装 LSE：`lip install github.com/LiteLDev/LegacyScriptEngine`（默认变体含 QuickJS 和 Lua 引擎），或按需安装单个引擎，如 `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs` / `#python`。
4. 用 `lip run` 或双击 `bedrock_server_mod.exe` 启动。

网络慢时可设置 GitHub 代理：`lip config set github_proxy <URL>`。不建议手动拼装（易缺语言包、CrashLogger 等依赖）；重装时建议直接用新的空文件夹。官方教程：<https://levimc.org/zh-Hans/tutorials/server/first-server/>。

*适用版本：LeviLamina 26.60.x；lip 0.41.x*

### 在 Windows 上用 lip 安装 LeviLamina 服务端时命令失败/中途报错（如 `PeEditor.exe` 报错），如何排查？装好后启动哪个程序？

1. 确认 lip 已安装且命令写法正确：在 cmd 中不能用 `./` 前缀（用 `.\` 或直接写命令）。
2. 在新的空文件夹中执行 `lip install LeviLamina`，等进度完全结束。中途报网络错误多为下载中断或 GitHub 访问问题，重试或设置 `lip config set github_proxy <URL>`；失败时查看提示和 `.lip/logs/` 下的完整报告。
3. VC++ 运行库：新版 lip 在 setup 时会自动安装缺少的 Microsoft Visual C++ Redistributable（会弹出管理员权限请求，选“否”会导致失败）；如果运行库过旧导致 `PeEditor.exe` 报错或错误码 1114，请手动安装最新版 <https://aka.ms/vc14/vc_redist.x64.exe>。
4. 注意 LeviLamina 版本绑定特定 BDS 版本，不要自行指定不匹配的游戏版本。

安装完成后用 `lip run` 或双击 `bedrock_server_mod.exe` 启动。

*适用版本：当前所有 LeviLamina 版本（Windows）；lip 0.41.x*

### 租用的面板服（游戏面板/云服务商）能运行 LeviLamina 吗？本机能运行、上传到面板服后启动失败怎么办？

1. 系统要求：LeviLamina 只能加载进 Windows 版 BDS。Windows 面板可以直接运行；x64 Linux 面板需要能运行 lip（lip 自带 Wine 运行 Windows 版服务器）或使用官方 Docker 镜像 `ghcr.io/liteldev/levilamina-server:latest-wine`，普通只能启动原版 Linux `bedrock_server` 的面板无法直接使用。可从面板启动的是 `.exe`/`.cmd` 还是 `.sh` 来判断系统。
2. 本机能跑、面板上启动失败（如提示缺少运行库、错误码 1114）：通常是服务器缺少或版本过旧的 Microsoft Visual C++ 运行库，安装最新版 <https://aka.ms/vc14/vc_redist.x64.exe> 即可。服务商不允许安装时，可以把服务端依赖的 VC++ 运行库 DLL（如 `msvcp140.dll`、`vcruntime140.dll`、`vcruntime140_1.dll` 等）放到服务端根目录（`bedrock_server_mod.exe` 所在目录）；具体依赖可用 MSYS2 MINGW64 终端里的 `ldd bedrock_server_mod.exe` 或 VS 自带的 dumpbin 等工具查看。
3. 也可以在本地用 lip 装好整个服务端再上传，或请服务商代为安装；社区另有第三方面板安装脚本（如 MineBBS 上的 LeviBox），非官方维护。

*适用版本：当前所有 LeviLamina 版本*

### LeviLamina 能在 Windows 7 / Windows Server 2016 / 2012 R2 等老系统上运行吗？在这些系统上启动闪退，或 PreLoader 报 `Can't load ./plugins/LeviLamina\LeviLamina.dll, Error code: 127`（找不到指定的程序），开服应该选什么系统？

不能。LeviLamina 用到了较新的 Windows API 和新版 VC++ 运行库，只支持 Windows 10、Windows 11 或 Windows Server 2019 及更高版本；Windows 7/XP、Windows Server 2012 R2、Windows Server 2016 都无法运行（原版 BDS 能在老系统上运行，但装了 LeviLamina 就不行）。在老系统上加载 `LeviLamina.dll` 报错误码 127“找不到指定的程序”，通常就是系统缺少所需 API 导致的，装运行库也解决不了，只能升级或重装系统（在受支持的系统上出现 127，则多半是 LeviLamina 与模组的依赖版本不匹配，可查看日志中的依赖诊断 `Dependency diagnostic`）。

另外，当前版本 LeviLamina 位于 `mods/LeviLamina/` 下，报错中的 `plugins/LeviLamina` 路径属于旧版布局。

开服推荐 Windows Server 2022（或 2019 及以上），越新越好；也可以在 x64 Linux 或 macOS 上用 lip（lip 自带 Wine 运行 Windows 版服务端）。用 lip 安装时服务器所需的组件（含 VC++ 运行库）由 lip 负责安装。

*适用版本：当前所有 LeviLamina 版本（含 26.60.x）*

### BDS 启动后只有 PreLoader 在运行（提示 `LeviLamina not found, PreLoader is running as DLL Loader...`），LeviLamina 和模组都没加载，是什么原因？

说明 PreLoader 没在模组目录里找到 LeviLamina 本体（加载链是 `bedrock_server_mod.exe` -> `PreLoader.dll` -> LeviLamina -> 其他模组）。只放 `PreLoader.dll` 不够，还必须安装 LeviLamina 本体；不要下载 GitHub 仓库源码，要用 Release 里编译好的文件，最推荐直接用 lip 安装（`lip install github.com/LiteLDev/LeviLamina`），lip 会把 PreLoader、PeEditor、CrashLogger、bedrock-runtime-data 等依赖一起装好并生成 `bedrock_server_mod.exe`。

当前版本 LeviLamina 本体应位于服务端的 `mods/LeviLamina/` 目录（文件夹名区分大小写），而不是旧版的根目录或 `plugins/`。手动安装时注意：若存在 `plugins/` 目录，PreLoader 会优先把它当作模组根目录，可在 `PreLoaderConfig.json` 的 `modsPath` 中指定。文件位置混乱时，最省事的办法是删掉旧文件后用 lip 重新安装。

*适用版本：LeviLamina 1.x 及以后（当前 26.60.x），服务端*

### LeviLamina 服务端放在含中文（非 ASCII）字符的目录下，启动或加载 mod 时报错、日志路径乱码、提示缺依赖或崩溃，怎么办？

把服务端整体放到纯英文（仅 ASCII 字符）路径下再启动。部分 mod/脚本引擎（例如曾经的 GMLIB 的 zip 解压逻辑、旧版 LSE NodeJS 引擎）没有正确处理中文路径，就会出现上述问题。`server.properties` 里的 `level-name` 也建议只用英文；如果想让存档在游戏里显示中文名，可以把地图导出后在客户端改名再导入，直接改 `levelname.txt` 无效。

*适用版本：当前所有版本（是否出问题取决于所装的 mod）。未能从源码或文档中直接证实，仅供参考。*

### mod 附带的 `.pdb` 文件是什么？应该放在哪里，可以删掉吗？

`.pdb` 是调试符号文件，不是 mod 本体，可选。若要使用，把它放在对应 mod 的 `.dll` 同一目录（即 `mods/<模组名>/` 下，与 dll 同级），而不是服务器根目录；这样 CrashLogger 生成的崩溃堆栈能显示可读的函数符号，方便开发者分析崩溃。不在意崩溃日志可读性的话可以不放或删掉，不影响运行。

安装 mod 本身推荐用 lip（`lip install <包名>`），手动安装则把压缩包内的 mod 文件夹解压到 `mods/` 下。

*适用版本：当前所有 LeviLamina 版本（mod 目录为 `mods/`）*

### LeviLamina 服务器目录里的 `runtimedata`（`bedrock_runtime_data`）是什么？需要安装吗，放在哪里？

它是 LeviLamina 的必需依赖 bedrock-runtime-data（`github.com/LiteLDev/bedrock-runtime-data`），可理解为新形式的 PDB/符号数据（经过加密混淆），必须和 LeviLamina 一起安装。用 lip 安装 LeviLamina 时会自动作为依赖装上，解压到服务器根目录下的 `bedrock_runtime_data`（与 `bedrock_server.exe` 同一层级），而不是 `plugins`/`mods` 目录。

服务端和客户端使用的运行时数据是分开发布的（版本号分别带 `-server` / `-client` 后缀，例如 `26.60.6-server.16` 与 `26.60.5-client.16`），lip 会按安装端自动选择，不能混用。

*适用版本：使用 bedrock-runtime-data 的 LeviLamina 版本（含当前 26.60.x）*

### BDS 服务端目录里没有加载器，LegacyScriptEngine（LLSE）的 JS 插件丢进去也不加载，应该怎么安装 LeviLamina 和 LegacyScriptEngine？

插件需要先安装加载器才能运行。推荐用 lip：安装 lip 后，在服务器文件夹里运行 `lip`（自带图形化终端界面，可直接装好 BDS + LeviLamina），或参照官方教程用命令行开服。然后安装 LSE：`lip install LegacyScriptEngine#quickjs`（JS 插件；其他变体为 `#lua`、`#nodejs`、`#python`，不指定变体时同时安装 QuickJS 和 Lua 引擎），lip 会自动装上 LegacyRemoteCall、LegacyMoney、iListenAttentively 等依赖。

插件放在 `mods/` 中（LSE 0.23.0 起启动时会把 `plugins/` 做成指向 `mods/` 的链接）；直接放入的单个旧式脚本在下次启动时会被生成文件夹和 manifest，再重启一次服务器才会加载。

*适用版本：LeviLamina 26.x；LegacyScriptEngine 0.23.x；lip 0.41.x*

### Windows 上用 LeviLauncher 导入小地图等客户端 mod（dll）后进游戏没有效果、mod 列表也不显示，是什么原因？

这类客户端模组依赖 LeviLamina 客户端版。需要先给该实例安装 LeviLamina：在 LeviLauncher 安装实例时打开「安装 LeviLamina」，或对已有实例在「启动」页实例选择器旁的齿轮 →「实例设置」→「加载器」标签页中安装（对应 release 中的 `levilamina-v<版本>-client-release-windows-x64.zip`）。

LeviLamina 只支持特定的 GDK 游戏版本（下载页「加载器」一栏显示 LeviLamina 的版本），不支持时会提示「该游戏版本不支持 LeviLamina」。同时模组必须是 client 变体、且与实例的游戏版本和 LeviLamina 版本相对应；优先从启动页「LeviMC 模组」安装，它只列出适用于该实例 LeviLamina 的模组，手动导入可在「管理模组」→「导入 .mcmod」（`.zip`/`.dll` 选「所有文件」）。

*适用版本：LeviLauncher（Windows）当前版本；LeviLamina 客户端版*

### 在面板服（无法直接运行 lip 的托管服务器）上部署 LeviLamina，启动时 PreLoader 报错/频繁崩服，是 PreLoader 坏了吗？

通常是文件不完整导致，常见原因是缺少 bedrock-runtime-data（`github.com/LiteLDev/bedrock-runtime-data`），它是 LeviLamina 的必需依赖，且版本要与 LeviLamina 对应。建议在本地电脑用 lip 安装（`lip setup --game <版本>` 或 `lip install LeviLamina`），lip 会自动装齐 BDS、PreLoader、bedrock-runtime-data、CrashLogger、levilamina-loc 等依赖并对 exe 执行 PeEditor；在本地确认能正常启动后，再把整个服务端目录打包上传到面板服，而不是手动拼装文件。

*适用版本：LeviLamina 1.x 起至当前版本*

### 想给基岩版 BDS 服务器装插件（如 CoralFans），需要装 LeviLamina 还是 Endstone？

看插件属于哪个平台：要用 LeviLamina 模组就装 LeviLamina；要用 Endstone 插件就装 Endstone，或者在 LeviLamina 上安装 LeviStone 来运行 Endstone 插件（LeviStone 只支持 Python 编写的 Endstone 插件，安装方式：在已装 LL 的服务器目录运行 `pip install levistone --target mods/EndstoneRuntime`）。

CoralFans 是 LeviLamina 模组，需要用 LeviLamina，并安装与其适配版本一致的 LL；安装文档：<https://coralfans-dev.github.io/CoralFans-doc/#/InstallDoc>。

### 手动安装 LeviLamina 时，依赖 bedrock-runtime-data 的版本号如 `26.10.4-server.1` 中的 `-server.1` 是什么意思？和 `bedrock_server` 版本有关吗？

`-server` 表示这是服务端（BDS）用的运行时数据（客户端用的是 `-client.N`），后面的数字 N 是该数据包的发布序号，每次重新发布递增，与 `bedrock_server` 的版本号无关；前面的主版本号则对应游戏构建，例如 `26.60.6-server.N` 对应 BDS 1.26.60.6，`26.60.5-client.N` 对应客户端 1.26.60.5（见 LeviLamina 支持版本表）。

手动安装时不要随意挑，应使用 LeviLamina 的 `lip.toml` 中 `deps` 指定的确切版本，例如 LeviLamina 26.60.8 服务端依赖 `"github.com/LiteLDev/bedrock-runtime-data" = "26.60.6-server.16"`；通常就是与该 LL 版本同期发布的序号最大的那个。更推荐直接用 lip 安装，会自动装上正确版本。

*适用版本：LeviLamina 26.x 当前版本*

### 手动把多个插件/模组压缩包解压到服务器目录时，`README.md`、`CHANGELOG.md`、`LICENSE` 文件重名冲突，怎么处理？

`README.md`（说明）、`CHANGELOG.md`（更新日志）、`LICENSE`（开源协议）都不是运行所需的文件，可以不放入或直接删除，只保留插件本体文件即可。LeviLamina 模组应各自放在 `mods/<模组名>/` 子目录下（含 `manifest.json`），这样一般不会互相冲突；LLSE 脚本插件可放在 `plugins/`（LSE 0.23.0 起它是指向 `mods/` 的链接，启动后会自动迁移并生成清单）。更推荐用 lip 安装，避免手动解压。

*适用版本：当前所有版本（手动安装场景）*

### 用 LeviLamina 开插件服，需要安装哪些组件？

推荐用 lip 安装（文档 <https://levimc.org/zh-Hans/lip/>）。在服务器目录中：

1. `lip install LeviLamina`（或 `lip setup --game <版本>`）安装 BDS + LeviLamina；
2. 需要运行 LLSE 脚本插件时安装 LegacyScriptEngine：`lip install LegacyScriptEngine`（不指定变体时同时安装 QuickJS 和 Lua 引擎），已能满足绝大多数用途；
3. 有 NodeJS 插件再装 `lip install LegacyScriptEngine#nodejs`；Python 插件对应 `#python` 变体，按需安装。

然后用 `lip run` 启动。

*适用版本：lip 0.40 及以上；LegacyScriptEngine 当前版本*

### 用 wine 在 Linux 上运行 LeviLamina 时控制台终端错位、输入命令显示混乱或有编码问题，怎么处理？

手动用 wine 运行时，可以用一个简单的中间层程序（如社区写的 Go 程序 pts）转发 stdin/stdout，例如：`pts env WINEDEBUG=-all wine cmd /c bedrock_server_mod.exe`，可解决终端错位和部分编码错误；`WINEDEBUG=-all` 用于屏蔽 wine 自身的调试输出。运行 LL 只需 64 位 VC++ 运行库（vcrun2022），不需要 32 位。

另外，当前 lip 已官方支持在 x64 Linux 和 macOS（Apple 芯片的 Mac 需 Rosetta 2）上运行：`lip setup --game <版本>` 后 `lip run`，lip 自带 Wine 并自动安装 VC++ 运行库，默认设置 `WINEDEBUG=-all`（注意 lip 需要 glibc 2.27+，不支持 Alpine）。

*适用版本：Linux 上通过 Wine 运行 LeviLamina 服务器。未能从源码或文档中直接证实，仅供参考。*

### 运行 `bdsdown.exe` 时停在 Minecraft EULA / 隐私政策同意提示，输入 y 无效，并且 LeviLamina 提示与 BDS 协议版本不匹配，如何下载指定版本的 BDS？

用命令行参数直接同意协议并指定版本：`bdsdown.exe -y --source version://windows/x.x.x.x`，其中 `x.x.x.x` 替换为当前 LeviLamina 版本所适配的 BDS 完整版本号（四段式完整构建号，可在 <https://levimc.org/LeviLamina/versions/> 查询，例如 LeviLamina 26.60.x 对应 1.26.60.6；LeviLamina 的 `lip.toml` 里 `github.com/LiteLDev/bds` 依赖只写到 1.26.60 三段）。

不过当前更推荐直接用 lip：`lip setup --game <游戏版本>`（脚本中加 `--accept-eula`）会自动下载匹配的 BDS 和 LeviLamina。

*适用版本：bdsdown v1.x（当前 v1.2.1）*

### LeviLamina 用 lip 或手动安装后无法加载（重启电脑后只能正常开一次），可能是什么原因？

LeviLamina 加载不了最常见的原因是 BDS 版本与 LeviLamina 不匹配；用 lip 安装时会自动按依赖安装匹配版本的 BDS。若版本正确仍加载失败，检查是否被 360 等杀毒软件删除或拦截了相关文件（如 PreLoader、PeEditor 生成的 `bedrock_server_mod.exe` 或 `mods` 目录下的 dll），关闭杀毒软件或将服务器目录加入白名单后重新安装。

*适用版本：当前所有版本（Windows 服务端）。未能从源码或文档中直接证实，仅供参考。*

### 两个看似相同的 LeviLamina 服务端，一个 mod 加载成功但指令用不了，另一个正常，是什么原因？

服务端路径中含有中文等非 ASCII 字符可能导致各种奇怪问题（如 mod 加载成功但命令不能用），建议把服务端放到纯英文、无空格的路径下再试。

*适用版本：通用排查建议。未能从源码或文档中直接证实，仅供参考。*

### 教程说修改 `plugins\LeviLamina\config\Config.json`（`simpleServerLogger`、`playerInfo` 等），但下载的 LeviLamina 里没有这个配置文件，为什么？

配置文件需要先启动一次服务器并且 LL 正常加载后才会自动生成（找不到或读取失败时 LL 会按默认值重写）。另外手动安装教程多是旧版的，推荐按官方教程用 lip 安装，例如在空目录执行 `lip install github.com/LiteLDev/LeviLamina`（或 `lip setup --game <版本>`）一并装好 BDS 与 LeviLamina。注意新版中这两项位于 `targeted.simpleServerLogger` 和 `targeted.playerInfo` 下。

*适用版本：LeviLamina 1.x 及以上；lip 写法以当前 lip 0.41 为准*

### 想看服务器报错（如 addon 模型加载不出来）时，打开 CrashLogger 程序有用吗？应该怎么启动服务器？

没用。CrashLogger 只是 LeviLamina 在服务器启动后自动拉起、用于崩溃时记录崩溃信息的工具，不需要也不应该手动打开它。应启动 `bedrock_server_mod.exe`（或用 `lip run`）运行服务器；addon 报错一般不会导致崩服，相关错误会直接输出在控制台和 `logs` 目录的日志中，去那里查看即可。

*适用版本：LeviLamina 当前所有版本*

## PreLoader 与 PeEditor

### 安装 LeviLamina 后没有生成 `bedrock_server_mod.exe`（或双击 `PeEditor.exe` 闪退 / 只输出 `No work to do, exiting...`），怎么手动用 PeEditor 生成？

PeEditor 正常情况下不需要手动运行：用 lip 安装 LeviLamina 时会自动执行 `.\PeEditor.exe -mb`。若没有生成 `bedrock_server_mod.exe`（或手动安装 / 面板服），在 `bedrock_server.exe` 所在的服务端根目录打开 cmd 或 PowerShell，执行：

```powershell
.\PeEditor.exe -mb
```

（只生成不备份可用 `-m`。）

说明：PeEditor 不带参数运行什么都不做，只输出 `No work to do, exiting...`，双击运行也会一闪而过，因此必须在命令行里带 `-m` 参数。

- `-m` 生成 `bedrock_server_mod.exe`。
- `-b` 会把原版重命名为 `bedrock_server.exe.bak`。
- `--exe` 指定源 exe（默认 `./bedrock_server.exe`）。
- `-o` 指定输出目录。
- `--verbose` 输出详细日志。

之后用 `bedrock_server_mod.exe` 启动服务器（建议在命令行里启动以便看报错）。

PeEditor 本身运行报错多为 VC++ 运行库过旧，安装 <https://aka.ms/vc14/vc_redist.x64.exe> 后重试。手动安装时 PeEditor/PreLoader 版本必须与 LeviLamina 版本匹配（以 LeviLamina 包中 `lip.toml`/`tooth.json` 写的依赖版本为准），因此官方更推荐用 lip 安装。

*适用版本：LeviLamina 1.x 及以上（PeEditor 3.8+，当前 3.9.3）*

### 安装 LeviLamina 时在 PeEditor 步骤报错，或手动运行 `PeEditor.exe` 打不开/无法运行，怎么解决？

通常是系统缺少或安装了过旧的 Microsoft Visual C++ 运行库（例如刚重装过系统）。安装最新的 VC++ 2015-2022 x64 运行库 <https://aka.ms/vc14/vc_redist.x64.exe> 后，重新安装 LeviLamina，或在 BDS 目录用命令行手动运行 `.\PeEditor.exe -mb`（必须带参数，双击无效）。

注意：如果之前 LeviLamina 实际没装成功，后续安装 LSE 等依赖 LeviLamina 的包也会报错，需要先把 LeviLamina 重新装好（可用 `lip list` 检查已安装的包）。

*适用版本：LeviLamina 当前所有版本*

### LeviLamina 文件都放好了，但启动 BDS 时没有加载 LL（或启动就闪退），怎么回事？

手动安装时需要在 BDS 目录用命令行运行一次 `PeEditor.exe -m`（lip 安装时执行的是 `PeEditor.exe -mb`，会额外把原文件改名为 `bedrock_server.exe.bak`），它会从 `bedrock_server.exe` 生成 `bedrock_server_mod.exe`；之后必须启动 `bedrock_server_mod.exe` 而不是原来的 `bedrock_server.exe`，才会经由 PreLoader 加载 LeviLamina。

更推荐直接用 lip 安装 LeviLamina（`lip setup` / `lip install LeviLamina`），它会自动安装 PreLoader、PeEditor 等依赖并执行修补，之后用 `lip run` 启动服务器即可。

*适用版本：LeviLamina 服务端当前所有版本*

### 使用第三方论坛（如 MineBBS）上的 LeviLamina+LSE 整合包时，自带的 `PeEditor.bat` 修补失败怎么办？

不要使用第三方整合包里的 `PeEditor.bat`。改用 lip 安装 LeviLamina（`lip setup`，或 `lip install LeviLamina` 再 `lip install LegacyScriptEngine`），它会自动安装依赖并执行 `PeEditor.exe -mb` 生成 `bedrock_server_mod.exe`；或按官方教程手动安装（在 BDS 目录运行 `PeEditor.exe -m` 后启动 `bedrock_server_mod.exe`）。

*适用版本：LeviLamina 服务端当前版本。未能从源码或文档中直接证实，仅供参考。*

### 在 Linux 服务器上用 wine 运行 LeviLamina，PeEditor 生成 `bedrock_server_mod.exe` 失败，怎么处理？

现在推荐直接用 Linux 版 lip：在 x64 Linux 上 `lip setup` 会自行下载并配置 Wine 与 Visual C++ 运行库，安装 LeviLamina 时自动执行 PeEditor，之后用 `lip run` 启动，不需要自己装 wine/winetricks；也可以使用官方 Docker 镜像 `ghcr.io/liteldev/levilamina-server:latest-wine`。

若仍要用自己的 wine 手动安装：用 `wine PeEditor.exe -m` 生成，wine 前缀需为 64 位（`WINEARCH=win64`），并用 winetricks 安装 VC 运行库：

```shell
sudo wget -O /usr/local/bin/winetricks https://raw.githubusercontent.com/Winetricks/winetricks/master/src/winetricks
sudo chmod +x /usr/local/bin/winetricks
winetricks dlls vcrun2022
```

不想看 wine 报错可 `export WINEDEBUG=-all`。另外要确认 BDS 版本与所装 LeviLamina 对应。

*适用版本：LeviLamina 服务端当前版本，x64 Linux（lip 0.41.x）*

### 手动安装 LeviLamina 时安装没完成（或 lip 安装失败后改手动），接下来该怎么做？启动后又提示缺少 `CrashLogger.exe` 怎么办？

手动安装时需要在 BDS 目录运行一次修补程序 `PeEditor.exe`（`PeEditor.exe -m`），生成 `bedrock_server_mod.exe` 后用它启动，LL 才算装好。

启动后若报找不到 `CrashLogger.exe`，需要把 `CrashLogger.exe` 放到 LeviLamina 模组目录下（默认 `mods/LeviLamina/CrashLogger.exe`）；该路径由 `mods/LeviLamina/config/Config.json` 中 `modules.crashLogger.externalpath` 指定，是相对于 LeviLamina 模组目录的路径，默认值为 `CrashLogger.exe`。不需要外部崩溃日志时也可把 `crashLogger.enabled` 设为 `false`。

建议尽量用 lip 安装，它会自动装好 CrashLogger 等依赖，否则 LSE NodeJS 等依赖也得手动找。

*适用版本：LeviLamina 服务端当前版本（CrashLogger 1.4.x）*

### 升级 LeviLamina 后又单独升级/覆盖了 BDS，服务器无法启动且没有报错，怎么解决？

`bedrock_server_mod.exe` 是 PeEditor 从 `bedrock_server.exe` 生成的，覆盖或升级 BDS 文件后必须重新运行一次 `PeEditor.exe -m` 重新生成 `bedrock_server_mod.exe`，旧的不会自动更新。

另外 LeviLamina 每个版本只支持特定的 BDS 版本（其 `lip.toml` 中 `bds` 依赖精确到版本，如 LL 26.60.8 对应 1.26.60），不要单独升级 BDS；推荐用 `lip update LeviLamina` 一起升级，lip 会安装匹配的 BDS 并自动执行 `PeEditor.exe -mb`。

*适用版本：LeviLamina 服务端当前所有版本*

### 用 lip 单独安装了 PeEditor，却没有 PreLoader，PeEditor 和 PreLoader 不是在一起的吗？

PeEditor 不等于 PreLoader：PeEditor 是把 PreLoader 注入游戏可执行文件的修补工具（生成 `bedrock_server_mod.exe` 或原地修补 `Minecraft.Windows.exe`），PreLoader 是运行时加载 LeviLamina 的库（`PreLoader.dll`），二者是各自独立的 lip 包（`github.com/LiteLDev/PeEditor`、`github.com/LiteLDev/PreLoader`）。

不要单独安装这些依赖，应直接用 lip 安装 LeviLamina 本体，它会自动拉取 PreLoader、PeEditor、CrashLogger 等全部依赖并执行修补。

*适用版本：LeviLamina 当前所有版本*
