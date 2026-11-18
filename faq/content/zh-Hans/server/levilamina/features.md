# LeviLamina 在服务器上的功能与用法

## LeviLamina 服务器不关服时，怎样加载、卸载或重载单个插件/mod（包括 LSE 脚本插件）？`/reload` 可以吗？

`/reload` 是原版命令，只重新加载行为包/addon 脚本，管不到 LeviLamina 的 mod。要管理 mod，在服务器控制台用 LeviLamina 自带的 `ll` 命令：

- `ll list`：列出已加载的 mod，确认名称
- `ll load <mod名>`：热加载新放进 `mods` 目录的 mod
- `ll unload <mod名>`：卸载
- `ll reload <mod名>`：重载
- 另有 `ll enable|disable|reactivate <mod名>`；这些命令末尾都可以加可选参数 `cascade`，连同依赖它的 mod 一起处理。

`<mod名>` 就是 `manifest.json` 里的 `name`，必须与 `mods` 目录下该 mod 的文件夹名一致。不要写成 `.js`/`.dll` 文件名或文件路径，也不要写成 `legacy-script-engine-quickjs` 这类引擎名。

`ll` 命令默认启用、权限为 Admin，由 LeviLamina 配置 `modules.command.modManageCommand` 控制。

注意：

1. 没有一键重载全部 mod 的命令，命令要求指定 mod 名。
2. 能不能卸载或重载取决于 mod 自己：C++ mod 要自己导出/注册卸载函数（`ll_mod_unload`，用 `LL_REGISTER_MOD` 时即类里实现 `unload()`）才能卸载，否则会报 `"The mod does not register an unload function"`；卸载函数返回 `false` 时会报 `"The mod cannot be unloaded"`。有的 mod 必须在开服前加载，热加载会失败；有的重载后注册的命令会失效，甚至崩服。
3. LeviLamina 开服很快，最稳妥的做法仍是重启服务器。只需要重读配置时，很多插件自带 `reload` 子命令。

*适用版本：LeviLamina 0.8.4 及以上（当前 v26.60.8 仍适用）*

## 在 LeviLamina 服务器控制台怎么查看当前实际加载了哪些插件/mod，以及某个 mod 的版本等信息？

在服务器控制台执行 `ll list`，输出形如 `"There are N mods: a, b, c"`，可以用来确认 lip 安装的插件是否真的被加载。查看单个 mod 的详细信息用 `ll show <mod名>`，会显示名称、作者、描述、类型、版本、入口和额外信息；末尾加 `cascade` 还会列出它的依赖树和被依赖树。`ll show` 必须指定 mod 名，不支持一次显示全部。在 LSE 脚本里可以用 `ll.listPlugins()` 获取已加载插件列表。

`ll` 命令默认权限为 Admin，可在 LeviLamina 配置 `modules.command.modManageCommand` 中关闭或调整。

*适用版本：LeviLamina 0.8.4 及以上（当前 v26.60.8 仍适用）*

## Endstone 和 LeviLamina 有什么区别？Endstone 能运行 LeviLamina 的 dll 插件吗？为什么 Endstone 能在没有完整 PDB 的情况下快速适配新版 BDS？

两者都是注入 BDS 并 hook 的方式，但定位不同：Endstone 是插件加载器（plugin loader），类似 Bukkit，在 BDS 外包一层稳定 API，不直接暴露 BDS 内部接口，插件支持 C++ 和 Python；LeviLamina 是 mod loader，类似 Forge/Fabric，目标是暴露 BDS 的全部内部接口。实现上 Endstone 只需要很少量的符号（十几个级别），手动处理符号、手写头文件，少量符号可以靠人工逆向获得；LeviLamina 需要二十多万个符号，其符号表和头文件依赖 Mojang 提供的调试信息自动生成，因此 API/头文件覆盖面更全，但适配新版本必须等 Mojang 给出调试信息并跑完自动生成流程。两者 API/ABI 完全不同，Endstone 不能运行 LeviLamina 的 dll 插件（就像 Fabric 不能运行 Forge 的 jar）。

*适用版本：当前所有版本（Endstone 为第三方项目，其细节以 Endstone 官方为准）。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 服务端可以直接按 Ctrl+C 关服吗？直接点窗口 X 关闭会怎样？

可以按 Ctrl+C。LeviLamina 会捕获 Ctrl+C，调用正常关服流程，效果等同于输入 `stop`，不会丢数据（关服过程中再按一次 Ctrl+C 会直接强制结束，所以按一次后耐心等待）。如果是通过 `.bat` 启动的，关服完成后命令行会询问是否终止批处理，这时再关闭窗口即可。不建议直接点窗口 X：虽然 LeviLamina 也会对关闭窗口事件尝试执行 `stop`，但 Windows 只给关闭事件很短的处理时间，进程可能在存档保存完成前被强制结束，导致回档到最近一次保存的状态。

*适用版本：当前所有版本（Windows 服务端；Linux/Wine 下对应 SIGINT/SIGTERM）*

## LeviLamina 和以前的 LiteLoaderBDS 是什么关系？LL3 指什么？现在开服还用 LiteLoaderBDS 吗？

LiteLoaderBDS（缩写 LL，有 LL1、LL2 两个大版本）因代码难以维护已停止维护并归档。LeviLamina 是其继任者，是完全重写的新项目（计划名曾为 LiteLoader3，所以也被称为 LL3），不包含 LiteLoaderBDS 的代码，也不兼容旧版原生插件，并非简单改名。现在开服应使用 LeviLamina（<https://github.com/LiteLDev/LeviLamina>，推荐用 lip 安装）；旧的 LLSE 脚本插件改由 LegacyScriptEngine 在 LeviLamina 上运行。

## LeviLauncher 启动器和 LeviLamina 客户端版（LL 客户端）是什么关系？和服务端 LL 有什么区别？

两者不是一回事。LeviLauncher 是 Minecraft 基岩版启动器，用于下载/安装/隔离/启动游戏版本和管理 mod，类似 Java 版的 PCL2。LeviLamina 客户端版是 mod 加载器，类似 Java 版的 Fabric：它由服务端移植而来，不依赖 BDS，提供响应输入、自定义渲染等客户端接口，同样可以开发 mod。用 LeviLauncher 安装实例时打开“安装 LeviLamina”就会装上 LL，不打开就是原版客户端（类似 PCL 下载时勾不勾 Fabric）。服务端 mod 若要在客户端（如局域网联机）生效，需要针对客户端适配并监听相应的客户端事件。

*适用版本：LeviLamina 1.8.0 起（支持客户端）至当前版本；LeviLauncher Windows 版*

## LeviLamina 支持用哪些语言开发插件/模组？“插件”和“模组(mod)”有区别吗？官方会支持 Ruby、TypeScript、Go 等其他语言吗？

“插件”和“模组(mod)”只是叫法不同，中文文档称“模组”，现在都安装在服务端的 `mods` 目录（旧版是 `plugins` 目录）。开发方式：

- C++：原生 LeviLamina mod。
- LegacyScriptEngine（LSE）：可以用 JavaScript（QuickJS 或 Node.js）、Lua、Python 编写脚本插件，其中 JS 文档最全，推荐；可用 `lip install LegacyScriptEngine#quickjs`（或 `#lua`、`#nodejs`、`#python`）安装对应引擎。
- Python 也可以用 LeviStone，在 LeviLamina 上运行 Endstone 的 Python 插件。
- 社区另有基于 .NET 的加载器，可用 C# 等 dotnet 语言开发（非官方）。

官方不会再像 LL2 那样亲自支持更多语言，只提供底层支持，其他语言由社区自行实现。

## 为什么服务器没有开启作弊（或用插件强制启用 Xbox 成就），装了 LeviLamina 后作弊类命令仍然可以使用？

LeviLamina 默认开启“强制启用作弊命令”：它在注册命令时给所有命令加上 `NotCheat` flag，并去掉枚举值上“需要开启作弊”的限制、允许选择器展开，所以世界不开作弊也能执行这些命令，同时可以保留存档成就。不足之处是客户端在不开作弊时可能无法对命令名（第一层）做 Tab 补全，参数仍可补全。该功能可以在 `mods/LeviLamina/config/Config.json` 的 `targeted.forceEnableCheatCommands` 中关闭（默认 `true`）。

*适用版本：LeviLamina 0.8 前后至当前 26.60.x，服务端和客户端默认开启*

## LeviLamina 的模组（mod，旧称插件）加载机制是怎样的？能支持其他语言写的模组吗？

LeviLamina 支持加载模组，并允许模组向 `ModManagerRegistry` 注册自己的模组管理器（`ModManager`），因此可以为其他语言实现 runner（例如 LegacyScriptEngine 就是这样加载脚本模组的）。LL 根据模组 `manifest.json` 中的 `type` 字段把模组分配给对应的管理器：`type` 为 `native` 时由内置的原生 DLL 模组管理器（`NativeModManager`）加载；其他 `type` 由为该类型注册的管理器加载，未注册则报 `"Unrecognized mod type"`。源码中 `ll/api/mod` 是对外接口（`Mod`、`ModManager`、`ModManagerRegistry`、`Manifest`、`NativeMod`），`ll/core/mod` 里实现了原生模组管理器 `NativeModManager` 和加载流程（`ModRegistrar`、`ModLoadPlanner`）。

*适用版本：LeviLamina 1.x 及以上（含当前 26.60.x）*

## 在下界等维度无法用 `tp` 命令跨维度传送到指定坐标，有什么办法？

LeviLamina 自带跨维度传送命令 `teleportdim`（别名 `tpdim`），可定点跨维度传送，支持可选的坐标换算参数（主世界/下界按比例换算）。该命令可在 LeviLamina 配置的 `modules.command.tpdimCommand` 中开关并设置权限（默认启用，权限 GameDirectors）。原版也可以用 `execute in <维度> run tp ...` 的方式实现。

*适用版本：当前所有 LeviLamina 版本（含 26.60.x）*

## BDS 原版服务端权威移动/方块校验（移动过快被拉回、放置/破坏方块过快导致方块回弹或吞方块）能关闭吗？有没有 LeviLamina mod 可以禁用？

1.21.70 之后原版的该机制无法通过 `server.properties` 等设置关闭（老版本可以）。可使用第三方 LeviLamina mod FuckMovementAuthority（<https://github.com/kuangby/FuckMovementAuthority/releases>），放置相关的限制也已有对应处理；作者提示可能导致某些奇怪的 bug。安装前请确认其 release 与你的 LeviLamina 版本匹配。LeviLamina mod 可在 <https://levimc.org/mods/>（原 pkg.levimc.org）查找。

*适用版本：BDS 1.21.70+；FuckMovementAuthority 最新 release v26.51.5（适配 LeviLamina 26.51）。未能从源码或文档中直接证实，仅供参考。*

## GroupMountain 的服务端 FreeCamera（灵魂出窍）mod 很久没更新还能用吗？有什么替代？

旧版 FreeCamera 已不适配当前版本（最新 release 停在 2025 年），其功能已（经 GroupMountain 同意）移植进 CoralFans（<https://github.com/CoralFans-Dev/CoralFans>），安装与服务端版本匹配的 CoralFans 即可使用 `freecamera` 命令。

*适用版本：LeviLamina 26.x；CoralFans v26.60.0 已适配 LeviLamina 26.60*

## LeviLamina 模组能不能做出网易版那种自定义 UI，比如在游戏 HUD 上放控件？

做不了网易那种直接在 HUD 上常驻自定义控件的效果。不过现在除了传统表单（`ll/api/form` 的 `SimpleForm`/`ModalForm`/`CustomForm`），LeviLamina 还提供了基于 Bedrock 数据驱动 UI（DDUI）的 `ll::ui` 接口：`ll/api/ui/form` 的 `CustomForm`、`MessageBox` 支持表单打开期间实时更新文本、可见性、数值和输入值；底层的 `ScreenSession`、`Property`、`Binding<T>` 可以打开资源包中提供的自定义 DDUI 界面并绑定数据。也就是说，自定义界面需要配合资源包，且只限于 DDUI 屏幕，而不是任意 HUD 控件。

*适用版本：LeviLamina 26.x（`ll::ui` 对应 `@minecraft/server-ui` 2.1.0 稳定功能）*

## LeviLamina 有没有好用的定时执行指令的 mod？

可以使用 GroupMountain 的 GMEssentials（发布仓库 <https://github.com/GroupMountain/GMEssentials-Release>，也可在 <https://levimc.org/mods/> 搜索 GMEssentials），功能较多，其中 `schedule_task` 功能支持用 Cron 表达式定时执行命令（配置 `enable` 与 `tasks` 列表，每项含 `cron` 表达式、`commands` 命令列表和 `output`；`enable` 默认为 `false`，需手动开启）。

*适用版本：GMEssentials v26.60.0 适配 LeviLamina 26.60*

## LeviLamina mod 需要配套资源包时，能否把资源包内置在 mod 里自动加载？

可以。把资源包放进 mod 目录下的 `resource_packs` 文件夹（`mods/<mod名>/resource_packs/<资源包>`）即可，LeviLamina 会自动把它注册为资源包来源并加载（同理行为包放 `mods/<mod名>/behavior_packs`）。发布时可以在 `xmake.lua` 打包步骤里把资源包复制进 mod 压缩包，或在 lip 的 `tooth.json` 里让资源包解压/放置到 `mods/<mod名>/resource_packs`。若资源包修改的是主界面，可能仍需在全局资源中开启。

*适用版本：LeviLamina 服务端与客户端当前版本（26.60.x）*

## LeviLamina 以前内置的 ImGui 还在吗？

不在了。LeviLamina 曾内置 ImGui，但因为在 1.21.132 上会崩溃，已在 2026-01 被移除（提交 `refactor: remove imgui`）；当前版本的 `xmake.lua` 也不再依赖 imgui。

*适用版本：LeviLamina 1.21.132 适配之后的所有版本（含当前 26.60.x）*

## LeviLamina 客户端上加载 Java 版光影（JE shader）的 mod 支持哪些光影、哪些游戏版本？性能如何？

这个 mod 是 LiteLDev 官方的 Arke（`github.com/LiteLDev/Arke`），基于 LeviLamina 客户端实现，可在基岩版 Direct3D 12 渲染器上运行为 Iris / OptiFine 编写的 Java 版光影包，官方 README 宣称“0 性能损失”。目前仅支持 Windows x64 客户端，依赖 LeviLamina client 26.60.*（即 MC 1.26.60），不支持 26.51 等旧版本；Android 支持在计划中。安装后通过游戏画面左上角的设置按钮加载光影包；若运行了帧生成等软件，该按钮可能不出现甚至导致崩溃。

*适用版本：Arke 0.1.x，LeviLamina client 26.60.\*，Windows x64*

## LeviLamina 客户端有没有去除/强制关闭 OreUI 的功能？

LeviLamina 本身没有该功能。可以使用第三方项目 ForceCloseOreUI（<https://github.com/QYCottage/ForceCloseOreUI>）。它是独立的 DLL（Windows）/ so（Android），并不依赖 LeviLamina：可放进 `QYCottage/mc-w10-version-launcher` 的 `mods` 目录，或用其他启动器/注入器加载；在 LeviLauncher 中也可以通过“导入 .dll”把它作为 `preload-native` 类型模组加入实例。

*适用版本：当前 LeviLamina 客户端；ForceCloseOreUI 为第三方项目，兼容性以其自身 release 为准。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 客户端的回放 mod（Playback/replay）如何开始和停止录制？

Playback（第三方 mod，`github.com/wo55555/Playback`）使用命令控制录制：`/record start` 开始（或继续）、`/record pause` 暂停、`/record stop` 停止并导出回放；另有 `/record rate [20-120]` 设置本地玩家视角采样率、`/record indicator [on/off]` 切换录制指示器。新版本暂停菜单的图标行也提供开始、暂停、结束、取消按钮，从暂停菜单结束时会要求输入回放名称。导出的回放存放在 Playback 的 `data/replays` 目录。

*适用版本：Playback 当前版本（LeviLamina 客户端，Windows x64）*

## LeviLamina 插件的 `manifest.json` 有文档吗？把脚本插件和 `manifest.json` 打成压缩包直接丢进 `plugins` 能被加载吗？

有。`manifest.json` 的字段（`entry`、`name`、`type`、`platform`、`passive`、`version`、`author`、`description`、`extraInfo`、`dependencies`、`optionalDependencies`、`conflicts`、`loadBefore`）现已在官方文档 LeviLamina API 参考的 mod 页说明，也可直接参考源码 `src/ll/api/mod/Manifest.h`。脚本插件的 manifest 会由 LSE 自动生成：把散装的 `.js`/`.lua`/`.py` 放到 `mods`（`plugins` 是指向 `mods` 的链接）根目录，LSE 会把它迁移到 `mods/<名称>/` 并生成 `manifest.json`，重启后加载。随意打包成的压缩包（插件+manifest）直接放进去不会被加载，LeviLamina 只从 `mods` 下的子目录读取 `manifest.json`，需要解压成目录（Node.js 后端的旧版 `.llplugin` 包是例外，会被 LSE 自动解压迁移）。manifest 的目的是规范依赖声明和自定义引擎（`type`），而不是统一打包格式。

*适用版本：LeviLamina 1.x 及以上至当前 26.60.x，LSE 当前版本*

## LeviLamina 是不是只能用于服务端（BDS）？客户端单人存档能用吗？

不是。LeviLamina 是非官方的 Minecraft 基岩版模组加载器，既能加载到基岩版专用服务器（BDS），也能加载到 Windows 上的 Minecraft 客户端中。客户端可通过 LeviLauncher 启动器安装游戏版本、LeviLamina 和客户端模组，然后在单人存档中使用客户端模组（见官方教程“在 Windows 上玩模组”）。LeviLauncher 只是启动器，加载器是 LeviLamina。

*适用版本：LeviLamina 当前版本（26.60.x），LeviLauncher 1.x*

## LeviLamina 是否内置了 iInvalidNAKFix 的修复，还需要单独安装吗？

没有内置。LeviLamina 自带的漏洞修复（`vulnerabilityFixes`：`itemReadUserData`、`disconnectClient`、`subChunkRequest`、`limitIPFrequency` 等）不包含无效 NAK 的修复，需要的话仍需单独安装 iInvalidNAKFix（`MiracleForest/iInvalidNAKFix`）。

*适用版本：LeviLamina 服务端当前版本（26.60.x）*

## LeviLamina 是怎样让基岩版客户端加载模组的？服务端能否让进服玩家的客户端自动启用某些模组？

不能由服务端推送。客户端模组需要玩家自己在本机安装客户端版 LeviLamina（通常通过 LeviLauncher 安装并启动：LeviLauncher 会在游戏可执行文件中加入自己的加载器 `LeviLauncher.dll`，启动时加载 LeviLamina 与模组），装什么模组由玩家自己决定，服务端无法控制，性质上类似客户端注入。服务端能下发给客户端的仍只有原版的资源包/行为包。

## LeviLamina 服务器有没有可以提高下界（地狱）高度上限的插件？

可以使用 GroupMountain 的 FuckNetherHeight 模组（适用于 LeviLamina）：<https://github.com/GroupMountain/FuckNetherHeight>。使用前请确认其 release 支持你的 LeviLamina/BDS 版本。

*适用版本：第三方模组，版本兼容性以其 release 为准。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 的统计数据会收集哪些信息？用的是什么统计平台？

LeviLamina 使用 bStats 统计（提交到 bstats.org 的 `server-implementation` 接口），上报内容包括服务器 UUID、系统类型（Windows 或 Linux(wine)）、架构、CPU 核心数，以及自定义图表：LeviLamina 版本、Minecraft 版本、在线玩家数、是否开启正版验证（`online-mode`）和玩家设备平台分布；不会上报已加载的其它模组列表。公开数据见 <https://bstats.org/plugin/server-implementation/LeviLamina/21245>。地区信息只是 bStats 根据请求 IP 推断的。不想上报可在 LeviLamina 配置中把 `targeted.enableStatistics` 设为 `false`。

*适用版本：当前 LeviLamina 服务端*

## LeviLamina、PreLoader 和 Endstone 分别对应 Java 版生态中的什么角色？

类比 Java 版：PreLoader 相当于 Fabric Loader（负责注入/加载），LeviLamina 相当于 Fabric API（提供 mod 开发接口）；Endstone 相当于 Spigot（插件 API 风格）。PreLoader 现在同时用于服务端和客户端，LeviLamina 客户端版本也依赖它。

## LeviLamina 模组能访问 BDS 目录以外的文件吗？需要用 `../../..` 这样的相对路径吗？

可以。LeviLamina 模组是加载进 BDS 进程的原生 DLL，没有文件系统沙箱，既可以用 `../` 形式的相对路径（相对于进程工作目录，即 BDS 根目录）向上访问，也可以直接使用绝对路径；只要运行 BDS 的系统账户有对应权限即可。

*适用版本：当前所有 LeviLamina 版本*

## LeviLamina 有假人插件吗？假人插件和 addon（脚本 API）不兼容的问题解决了吗？

有，可以使用 CoralFans 团队的假人模组 CFSP（CoralFans SimulatedPlayer），安装：`lip install github.com/CoralFans-Dev/CFSP`。以前假人与 addon/脚本 API（SAPI/GameTest）存在兼容问题，LeviLamina 已在 26.20.x 起陆续修复（26.20.3 保留 GameTest 来源信息，26.51.2 解决 SAPI 与 SimulatedPlayer 的兼容问题），使用最新版 LeviLamina 即可。

*适用版本：LeviLamina 26.51.2 及以上*

## LeviLauncher 可以开服务器和朋友一起玩并用服务器插件吗？

不能。LeviLauncher 是 Minecraft 基岩版客户端启动器（Windows 版支持 GDK/UWP，另有 Android 版），不是服务端。普通联机用游戏自带的好友/局域网功能即可。如果要开能加载模组/插件的服务器，请部署 BDS 并安装 LeviLamina（BDS 的 mod 加载器，可用 `lip install github.com/LiteLDev/LeviLamina` 安装，教程见 <https://levimc.org/zh-Hans/tutorials/server/first-server/>）。启动器里也可以给客户端安装 LeviLamina（仅限受支持的 GDK 版本），但客户端可用的模组较少。

*适用版本：LeviLauncher 当前版本（v1.1.0）；LeviLamina 当前版本*

## Minecraft Realms 能装 LeviLamina 吗？

不能。LeviLamina 需要运行在你自己部署的 BDS（`bedrock_server`）或自己的 Windows 客户端上，Realms 是微软托管的服务器，无法安装任何第三方加载器。

## 为什么 LeviLamina 把“插件（plugin）”改称为“模组（mod）”？

LeviLamina 提供的是底层原生 API，模式更接近 Fabric/Forge 这类模组加载器，而 Endstone 等才是类似 Bukkit 的插件模式，因此改名为 mod。详细讨论见 <https://github.com/LiteLDev/LeviLamina/issues/1551>（`[Proposal]: Rename Plugin to Mod`，已关闭）。现在 LeviLamina 自称 mod loader，模组放在 `mods/` 目录下。

*适用版本：LeviLamina 0.13.x 及以上*

## 为什么查询 LeviLamina 服务器的 MOTD（pong）时末尾会出现 LeviLamina 标识？能否修改？

LeviLamina 会 hook RakNet 的 `RakPeer::SetOfflinePingResponse`，在以 `MCPE;` 开头的 pong 数据末尾追加 `LeviLamina;` 字段，用于标识服务端为 LeviLamina（1.0.0-rc.1 起加入，当时还带版本号，1.0.0-rc.3 起只保留标识）。LeviLamina 本身没有提供关闭它的配置项；如需自定义或伪造 MOTD/pong 内容（如合并人数等），可以由模组自行 hook 该函数或修改相关数据。

*适用版本：LeviLamina 1.0.0-rc.3 及以上（服务端）*

## 刚装好的 LeviLamina 启动后显示加载了 0 个插件（模组），以前 LL2 默认就带几个插件，这正常吗？

正常。LiteLoaderBDS（LL2）默认会装上所有前置插件，LeviLamina 采用按需安装，本体不附带任何模组（CrashLogger 等依赖装在 `mods/LeviLamina/` 内部，不算模组），所以显示 0 个。需要什么模组用 lip 安装，例如 `lip install <模组仓库地址>`。

*适用版本：当前所有 LeviLamina 版本*

## 基岩版有没有显示结构边框（Structure Outline）的功能？安卓能用吗？

CoralFans（基于 LeviLamina 的第三方技术生存模组）提供 HSA 显示和结构显示，命令如 `/hsa show` 和 `/hsa structure show`（命令名可在配置中修改）。安装：`lip install github.com/CoralFans-Dev/CoralFans`，也可以在 PC 版 LeviLauncher 中安装。CoralFans 只有 Windows x64 版本，安卓不能直接使用，可以加入装有 CoralFans 的服务器使用。源码：<https://github.com/CoralFans-Dev/CoralFans/>，文档：<https://coralfans-dev.github.io/CoralFans-doc/>

*适用版本：LeviLamina 服务端/Windows 客户端；CoralFans 当前版本（v26.60.0）*

## 基岩版有没有能解锁世界建筑高度上限的模组（用于导入几千格高的地形图）？

可以用 MiracleForest 的 LeviLamina 模组 iHigherWorld（<https://github.com/MiracleForest/iHigherWorld>），可分别调整主世界、下界、末地的最低/最高高度。安装：服务端 `lip install github.com/MiracleForest/iHigherWorld-Release`，客户端 `lip install github.com/MiracleForest/iHigherWorld-Release#client`。主世界范围超出 -512~512（下界/末地超出 0~256）时，客户端也必须安装客户端版本（配置由服务端下发）。有用户反馈最高大约到 4096，再大游戏会崩溃（该上限未见文档说明）。Addon 无法做到。注意其 README 标注的运行环境为 LeviLamina 26.51.x，需确认与所用 LeviLamina 版本匹配。

*适用版本：iHigherWorld v1.4.0；LeviLamina 26.51.x（Windows x64）*

## 如何查看当前服务器安装的 LeviLamina 版本？

在服务器控制台输入 `version` 命令，会输出类似 `Game version <游戏版本> with LeviLamina-<版本>` 的信息。LeviLamina 客户端对应的命令是 `cliversion`。该命令可在 LeviLamina 配置的 `modules.command.versionCommand` 中开关并设置权限等级；若被关闭则不会注册。

*适用版本：当前所有 LeviLamina 版本*

## 如何让客户端在服务器列表中显示自定义的服务器 logo/横幅等信息？有没有去掉精选服务器的模组？

LeviLamina 仓库有一个实验分支 `feat/custom-server-readme`（<https://github.com/LiteLDev/LeviLamina/tree/feat/custom-server-readme>），实现了服务端侧完全自定义服务器展示信息。该分支不会合并进 LeviLamina 主线，可参考其实现自行做成模组。去掉精选服务器可使用社区模组 NoAdServers：<https://github.com/MarmieQi/NoAdServers/releases/tag/v26.60.0>。第三方模组需与游戏版本匹配。

*适用版本：MC 26.60；LeviLamina 26.60.x*

## 有哪些适用于 Windows 客户端 LeviLamina 的开源 mod（生电、辅助、小地图、回放、投影等）？

部分已可通过 LeviLauncher / lip 安装：生电端 CoralFans（类似 Java 版 carpet）<https://github.com/CoralFans-Dev/CoralFans>；客户端辅助 Stipuleroo（类似 tweakeroo）<https://github.com/FeixiangTMC/Stipuleroo>；客户端小地图 ChiyanMap <https://github.com/qing85566/ChiyanMap>；回放 Playback <https://github.com/wo55555/Playback>；客户端投影 LHolo <https://github.com/MarmieQi/LHolo>。使用前请确认 mod 支持你的游戏版本。

*适用版本：LeviLamina 客户端（Windows）；具体版本以各 mod 发布为准*

## 服务器下发加密的资源包后客户端无法使用 Vibrant Visuals（VV），LeviLamina 能解决吗？

这是原版客户端行为：加密资源包会被视为市场包，而市场目前的策略不支持 VV，服务端无法解决。只能通过修改客户端绕过，例如使用 LeviLamina 客户端 mod 强制开启 VV。

*适用版本：原版 Minecraft 基岩版客户端行为，取决于 Mojang 当前策略。未能从源码或文档中直接证实，仅供参考。*

## 能否用 LeviLamina 以 1ms 精度高频给玩家发包（如发 PlaySound 包做 MIDI 播放器）？试过会导致服务端或客户端直接崩溃。

做不到。这是 BDS/游戏本身的限制，不是 LeviLamina 的问题：客户端处理包也要同步到主线程，网络延迟的波动本身就超过 1ms，高频小包还可能堵塞玩家的网络。要在服务器里放音乐，建议把音频做成资源包下发，或参考 NBS 播放器那类按 tick 精度播放的方案。

*适用版本：当前所有版本（BDS/网络层面的限制）。未能从源码或文档中直接证实，仅供参考。*

## 能否在 BDS（LeviLamina）进程内部直接重启 BDS？

进程内部无法自己重启自己，LeviLamina 也没有提供重启 API，需要借助 BDS 之外的外部程序（守护进程/启动脚本）。可以自己写外部程序，在模组中用 `std::system` 等方式调用它来关闭并重新拉起 BDS。若用 lip 运行服务器，可开启自动重启：`lip config set restart on-failure --workspace`（或在 lip 界面「服务器」页打开“自动重启”），之后用 `lip run` 启动；服务器以非 0 退出码退出时 lip 会等待 5 秒后重新启动（10 分钟内最多 5 次）。

*适用版本：当前所有版本；lip 自动重启需较新的 lip（文档对应 v0.41）*

## 装了 LeviLamina 客户端 mod 后还能进入别人的服务器吗？两人用相同启动器和 mod 能联机吗？

可以。LeviLamina 客户端可以正常进入他人服务器（例如开着 Playback 进 Hive 录制）；两人装相同 mod 也能正常联机。服务端的 LeviLamina 模组不需要客户端安装。具体某个 mod 是否被服务器允许，需遵守对方服务器规则。

*适用版本：LeviLamina 客户端 / LeviLauncher，当前版本。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 本体是否支持 Data-Driven UI（DDUI）？从哪个版本开始？LSE 脚本插件能用吗？

支持。LeviLamina 从 26.20.7 起加入 DDUI 支持（命名空间 `ll::ui`，头文件如 `ll/api/ui/form/CustomForm.h`、`ll/api/ui/form/MessageBox.h`），与旧的 `ll::form` 是两套独立接口。使用文档：<https://levimc.org/zh-Hans/LeviLamina/developer_guides/how_to_guides/data_driven_ui_guide/>，API 参考见 `api_reference/data_driven_ui`。目前只提供 native（C++）API，需要用 C++ mod 实现；LSE 暂未导出相关接口。

*适用版本：LeviLamina 26.20.7 及以上*

## 为什么新版 BDS（26.20 起）的 LeviLamina 适配这么难？旧的 mod 还能用吗？

Mojang 把 BDS 的编译器从 MSVC 换成了 clang-cl，LeviLamina 以及所有原生 mod 都必须改用 clang-cl 重新编译，否则会崩溃；旧的 MSVC 编译的 mod 不能直接用。mod 模板的 `xmake.lua` 已使用 `set_toolchains("clang-cl")`。另外适配期间曾出现 clang-cl 编译 LSE 时编译器自身崩溃的问题，拖慢了进度。

*适用版本：LeviLamina 26.20 及以上*

## 服务器经常崩溃，怎样在崩溃日志中看到崩溃时 BDS 的内存占用？

CrashLogger 自 1.2.1 起在 trace 日志中输出内存信息（系统总/可用物理内存，以及 BDS 进程的 workingset、pagefile、private 等峰值/当前值的 `Memory Info` 段），内置 CrashLogger 也有可用内存显示。当前版本（CrashLogger 1.4.x，随 LeviLamina 自动安装）已包含该功能，只需保持更新：在服务器目录执行 `lip update`（或 `lip update github.com/LiteLDev/LeviLamina`），然后到 `logs/crash/trace_*.log` 中查看。

*适用版本：CrashLogger 1.2.1 及以上（当前 1.4.0）*

## LeviLamina 宣布对 PreLoader（及其加载的符号数据）加密，这对普通服主和 mod 开发者有什么影响？

背景：自 BDS 1.21.20 起官方不再随 BDS 发布 PDB。LeviLamina 的做法是仓库只公开头文件（函数签名、结构体），函数地址以哈希符号表形式放在运行时数据（当时称 magic blob，现以 `bedrock-runtime-data` 包分发）中，由 PreLoader 在运行时加载解析，供 mod 调用/hook BDS 函数。由于有人滥用 PreLoader dump 数据生成并公开分发 PDB，为符合微软要求，维护者在 2025-03 宣布对 PreLoader 加密（只加密 PreLoader，LeviLamina 本体等不变）。影响：普通服主、LSE 脚本插件开发者、只基于 LeviLamina 公开头文件和接口开发的 mod 都不受影响；受影响的只有依赖从 PreLoader 生成 fake PDB 在 IDA 里逆向的原生开发，之后只能靠 bindiff 等方式。

*适用版本：LeviLamina 1.1.x（BDS 1.21.60/1.21.70）之后的版本。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 客户端（client mod）怎么启动？还需要 PreLoader 吗？

需要。客户端同样是 PeEditor 修补游戏可执行文件、PreLoader 在游戏启动时加载 LeviLamina 的机制：安装 LeviLamina 客户端时会执行 `PeEditor.exe -mb --exe Minecraft.Windows.exe --inplace`，原地修改 `Minecraft.Windows.exe`（原文件保留为 `Minecraft.Windows.exe.bak`），并同时安装 PreLoader 依赖。

目前推荐用 LeviLauncher 完成：

1. 在其中下载受支持的 GDK 正式版。
2. 创建实例并打开“安装 LeviLamina”。
3. 从 LeviLauncher 启动即可，不需要手动操作 lip。

需要该 Microsoft 账号已购买基岩版并至少从 Microsoft Store 安装过一次。客户端 LeviLamina 仅支持 Windows x64（Android 端是另外的 LeviLauncher-Android 方案）。

*适用版本：LeviLamina 客户端当前版本（GDK 版 Minecraft for Windows）*

## 客户端 native mod 能否不依赖 LeviLamina API？PreLoader 和 LeviLamina 是什么关系？同时运行多个客户端是否需要复制整个游戏实例？

LeviLamina 由 PreLoader 加载。PreLoader 负责在游戏启动前加载 LeviLamina，并提供符号解析（把原版符号映射给 LeviLamina 与模组使用）等底层服务；hook、事件、命令等其余基础设施由 LeviLamina 提供。

若想不依赖 LeviLamina，需要把用到的 LL API 和符号全换成特征码并自行实现对应功能（可去掉 LL 依赖后查看导入表确认还依赖了哪些符号）。

多开不一定要复制约 1G 的游戏本体：可让 mod 的 entry 使用相对路径，或通过 `PreLoaderConfig.json` 的 `modsPath` 在加载前重定向模组目录，只需把 mod 文件另复制一份防止文件占用，并且不要同时打开同一个存档。也可以直接用 LeviLauncher 的实例（开启实例隔离）管理多个游戏实例。

*适用版本：LeviLamina 客户端当前版本。未能从源码或文档中直接证实，仅供参考。*

## Level 等多继承类的虚函数在 LL 头文件里没有 vIndex，反编译看到虚调用、又没有 full PDB 时，怎么知道调用的是哪个函数？

可以在运行时自己 dump：从对象虚表取出对应槽位的函数地址，再用 PreLoader 提供的地址反查符号接口得到函数名。接口位于 `pl/SymbolProvider.h`：`pl::symbol_provider::pl_lookup_symbol_disp(addr, &length, &disp)` 返回该地址对应的符号名数组（`length` 为个数，`disp` 为偏移），用完需调用 `pl::symbol_provider::pl_free_lookup_result` 释放。LeviLamina 的堆栈符号化（`ll::utils::stacktrace_utils::getInfo`）内部也是这样做的。

*适用版本：LeviLamina 当前版本（PreLoader 1.x）*
