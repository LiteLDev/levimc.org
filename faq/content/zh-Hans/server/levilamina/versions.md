# LeviLamina 的版本与兼容性

## Mojang 不再公开 BDS 的 PDB 后，LeviLamina 还能适配新版本吗？LeviLamina 提供的 bedrock runtime data（magic blob）是什么？

能。2024 年 6 月 BDS 1.21 预览版起公开发布的 BDS 不再附带 PDB，当时曾一度认为 LeviLamina 只能停在 1.20.81/1.21.0；之后 LiteLDev 与 Mojang 协商，Mojang 改为把 PDB 等调试信息私下提供给 LiteLDev（1.21.10 因此被跳过，之后内部从 1.21.20 继续适配；0.13.x 之后下一个正式发布版本是 2025 年 1 月的 1.0.0-rc.1，适配 BDS 1.21.50）。

LiteLDev 把这些调试信息封装成 bedrock runtime data（俗称 magic blob，本质是哈希过的符号数据）公开分发，用来替代原始 PDB：加载 mod 和开发 mod 都依赖它，但不公开原始符号。对 LeviLamina 来说，PDB 的核心作用是自动生成符号表和头文件，所以每次新版本的适配时间取决于 Mojang 何时把调试信息交给团队。只装 addon、跑原版 BDS 的服主不受影响。

目前 LeviLamina 持续跟进新版本（如 v26.60.8 对应 Minecraft 26.60.6 服务端），构建时通过 xmake 包 `bedrockdata` 自动获取对应版本的 bedrock-runtime-data。

*适用版本：LeviLamina 1.0.0（BDS 1.21.50）起的所有版本；0.13.x 对应带公开 PDB 的 BDS 1.21.0x/1.21.3*

## LeviLamina 26.60 起原生 mod 目录从 `plugins` 改成 `mods` 了吗？LSE 脚本插件放哪里，现有 LSE 插件调用原生 mod 的接口是否需要改路径？

是的，从 26.60 起服务端原生 mod 放在 `mods` 目录（与客户端统一），LeviLamina 自身配置也在 `mods/LeviLamina/` 下。只要 mod 通过 LL 接口获取路径而没有硬编码 `plugins`，就可以无痛迁移。

LegacyScriptEngine 0.23.0 起会在启动时把服务器的 `plugins` 文件夹创建为指向 `mods` 的目录链接（junction），所以 `plugins` 与 `mods` 实际是同一个文件夹。前提是服务器目录下原本没有 `plugins` 文件夹；若已存在一个普通的 `plugins` 文件夹，LSE 只会报错 `Failed to create a link at …: a file or directory with the same name already exists` 而不会建立链接，需先把其中内容迁到 `mods/` 并删除旧 `plugins` 文件夹。

LSE 插件按“每个插件一个文件夹 + `manifest.json`”放在 `mods/` 下即可，写死 `plugins/` 路径的旧脚本仍能工作；直接丢进去的单个旧式脚本，LSE 会在下次启动时为其生成文件夹和清单，再重启一次即可加载。LSE 插件通过 `ll.import` 调用其他插件导出的接口完全不需要修改。

*适用版本：LeviLamina 26.60 及以上；LegacyScriptEngine 0.23.0 及以上*

## GMLIB 等前置库（及依赖它的插件）加载失败/报错，提示不支持的 BDS 版本，或依赖诊断显示缺少 `LeviLamina.dll` 中的符号，怎么办？

原因是前置库版本与当前 LeviLamina/BDS 版本不匹配：原生 mod 是针对特定 LeviLamina 版本编译的，换了 LL 版本后它调用的导出函数可能已不存在。日志中“依赖诊断”（Dependency diagnostic）的 `missing content:` 小节下出现 `|- LeviLamina.dll`，其下 `|---- ` 列出缺失的函数符号，就是这种情况（旧版输出为 `missing procedure:` / 缺少程序符号）。

解决方法：

1. 推荐用 lip 安装（例如 `lip install github.com/GroupMountain/GMLIB`），不带版本时 lip 取该仓库最高的版本标签；`lip install` 不会改动已安装的游戏和加载器，若该版本需要别的 LL 版本，命令会失败并给出游戏/加载器版本和 `lip setup` 提示。此时可用 `lip install github.com/GroupMountain/GMLIB@<版本>` 指定与当前 LL 匹配的版本，或先用 `lip setup` 切换到该 mod 支持的游戏/加载器版本。
2. 手动安装时，到 GMLIB 的 GitHub Releases（<https://github.com/GroupMountain/GMLIB/releases>）下载与所用 LL 版本对应的那一版，论坛转载常常更新不及时。
3. 依赖 GMLIB 的插件也要同步换成对应版本；不要随意降 LL，优先把前置升级到匹配当前 LL 的版本，或者整体升级 LL/BDS 再用新版前置。

“运行在不支持的 BDS 版本”警告表示部分接口可能失效，想避免崩溃或假死就使用其支持的版本。

## 启动 LeviLamina 服务端时报 FATAL `Couldn't find: MolangVariable::~MolangVariable(void)` / `Couldn't find: MolangDataDrivenGeometry::~MolangDataDrivenGeometry(void)` 并跟着 `In module: BedrockServerClientInterface`，模组无法加载，怎么办？

`Couldn't find: <符号> / In module: <模组名>` 表示该模组（这里是 BedrockServerClientInterface，即 BSCI，假人/客户端接口相关模组常用的前置）引用的函数符号在当前 BDS 中找不到，说明模组版本与当前 LeviLamina/BDS 版本不匹配（多为旧版模组）。

把 BSCI 更新到与当前 LeviLamina/BDS 对应的版本即可：BSCI 现在的版本号跟随游戏版本（如 v26.60.0 对应 BDS 1.26.60），在 <https://github.com/OEOTYAN/BedrockServerClientInterface/releases> 下载对应版本，或用 lip 安装/升级。反之，如果必须使用某个旧版模组，就要使用与它编译时对应的 BDS/LeviLamina 版本。

## 客户端版本与 LeviLamina 服务器版本不一致（提示“客户端过期”或“主机版本过低”），或 LeviLamina 还没适配新版本时，怎么让不同版本的客户端进入同一个服务器（跨版本/多版本互通）？

LeviLamina 本身每个版本只对应一个 BDS 版本，没有跨版本功能；客户端协议号必须与服务端一致（协议号相同的小版本可以直接互进，例如 1.21.60 与 1.21.62）。需要跨版本时可用第三方协议转换方案：

1. Glacie（GlacieTeam，同时支持 LeviLamina 和 Endstone，官方推荐 LeviLamina）：依赖 ProtocolLib，两者都要装。用 `lip install github.com/GlacieTeam/Glacie` 安装，或从 <https://github.com/GlacieTeam/Glacie/releases> 下载 `Glacie-levilamina-windows-x86_64.zip`；ProtocolLib 从 <https://github.com/GlacieTeam/ProtocolLib/releases> 获取。GitHub Release 是唯一官方下载源，MineBBS 等处的版本可能过旧。Glacie 版本必须与服务端 BDS/LeviLamina 版本对应（如 v3.10.3 对应 BDS 1.26.60.x + LeviLamina 26.60.x），用错版本会崩溃；支持的客户端版本范围见 ProtocolLib README 的协议表。
2. Endweave（EndstoneMC/endweave，Endstone 插件）：在 LeviLamina 上需先通过 LeviStone 运行 Endstone 插件（`pip install levistone --target mods/EndstoneRuntime`），再装 Endweave；它在其支持表内的协议版本之间互相转换（目前为 26.40~26.60）。
3. 或者降级客户端到服务器对应版本，或等待 LeviLamina 发布新版本适配后升级服务端。

## LeviLamina 有没有对应 BDS 26.0 的版本？该如何选择 BDS 版本？

没有。LeviLamina 从 1.9.x（BDS 1.21.132）直接跳到 26.10.0（适配 26.10），没有适配 26.0。LL 只支持特定的 BDS 版本，且不是每个 BDS 版本都会适配（适配需要 Mojang 提供数据，进度取决于 Mojang）。

正确做法是先确定要用的 LeviLamina 版本，再安装它对应的 BDS 版本；用 lip 安装 LeviLamina 时会通过依赖 `github.com/LiteLDev/bds` 自动安装匹配的 BDS（如当前 LeviLamina 26.60.x 对应 BDS 1.26.60）。不建议紧追新版本。

## 为什么 LeviLamina 不能在 BDS 发布当天就适配新版本？多久适配一次？

LeviLamina 的适配进度取决于 Mojang：Mojang 需向 LL 团队提供对应版本的符号数据（PDB 等，已不再公开），团队据此生成 bedrock-runtime-data 和 PreLoader 所需数据，再适配 LeviLamina 本体。在拿到数据之前无法开始适配，催更无用。

另外自 1.21.60 起 Mojang 提高了内联等级，大量函数被内联，适配难度和耗时增加（LeviLamina 在 26.32.0、26.40.1 等版本中陆续补实现/恢复了一些被内联的函数）。

*适用版本：LeviLamina 1.0 及以后。未能从源码或文档中直接证实，仅供参考。*

## 怎么查 LeviLamina 与 BDS（及 LSE 等）的版本对应关系？想在某个非最新的 BDS 版本上装 LeviLamina，该选哪个版本、怎么装？

LeviLamina 的每个版本系列只适配一个特定的 BDS 版本。查询对应关系的途径：

1. 官方文档“支持的版本”页：<https://levimc.org/zh-Hans/LeviLamina/versions/>（例如 26.60.x 对应服务端 1.26.60.6 / 客户端 1.26.60.5，26.51.x 对应 1.26.51.1，1.9.x 对应 1.21.132.3，1.6.x 对应 1.21.111.1，1.5.x 对应 1.21.102.1，0.12.x 对应 1.20.8x）。
2. LeviLamina 的 CHANGELOG / GitHub Release 说明中的 `Adapted to Minecraft ...` 条目。
3. 包文件中的依赖声明：从 v26.60.8 起包文件已由 `tooth.json` 改为 `lip.toml`，其中 `[variants."".deps]` 的 `"github.com/LiteLDev/bds" = "1.26.60"` 即所需的 BDS 版本；LSE 等模组的 `lip.toml` 里也写明了依赖的 LeviLamina 版本范围（如 `"github.com/LiteLDev/LeviLamina" = "26.60.*"`）。

从 26.x 起 LeviLamina 版本号的前两段与 BDS 版本对应（26.60.x ↔ 1.26.60）。LiteLDev/bds 仓库的 `versions.txt` 只是 BDS 完整版本号列表，不是 LL 对应表。

安装推荐用 lip，它会一并处理 BDS、PreLoader、PeEditor、bedrock-runtime-data 等依赖的版本：

- `lip install github.com/LiteLDev/bds@1.26.60 LeviLamina`：装指定 BDS 版本并自动选能适配它的最新 LeviLamina；
- `lip install LeviLamina@<版本号>`：装指定 LL 版本及其支持的最新 BDS；
- 已有服务器要换游戏/LL 版本用 `lip setup --game <版本> --loader levilamina@<版本>`。

旧版本的模组也要换成对应 LL 版本的版本。LeviLamina 最低到 0.1.x（BDS 1.20.4x），更早的 BDS 只能用已归档的 LiteLoaderBDS。

## LeviLamina 适配的 BDS 版本号最后一位/小版本（如 1.26.10.x 的 x，或 1.21.0 与 1.21.2）也必须严格对应吗？

必须严格对应。LeviLamina 每个版本系列只支持一个完整的 BDS 版本号（包括最后一位），例如 26.60.x 只支持服务端 1.26.60.6（客户端 1.26.60.5），26.10.x 只支持 1.26.10.4；即使是 1.26.61、1.26.62 这类随后发布的小版本 BDS 也不能直接用。版本不一致时 LL 无法正常工作（常见现象是加载后 BDS 直接退出或崩溃）。

请按 LL 版本要求使用对应 BDS，最省事的方法是用 lip 安装（`lip install github.com/LiteLDev/bds@<版本> LeviLamina` 或 `lip setup`），它会自动选配匹配的版本。

## 新版 LeviLamina（及 LSE）能装在旧版本 BDS 上吗？旧版 BDS 该用哪个 LL、去哪下载？

不能，LeviLamina 不向下/跨 BDS 版本兼容。每个 LL 版本只支持其发布说明/版本表中列出的那个 BDS 版本（例如 LL 1.7.7 对应 BDS 1.21.124，1.9.x 对应 1.21.132.3，适配 1.21.60 的 LL 不能用于 1.21.50）；LSE 等模组也依赖特定 LL 版本，所以想用新版 LL/LSE 修复的问题就得升级 BDS。若服务端是旧版 BDS，就退回到支持该 BDS 的旧版 LeviLamina（查 <https://levimc.org/zh-Hans/LeviLamina/versions/>）。有的 BDS 版本（如 1.21.30）没有对应的 LL 版本，只能换到有 LL 支持的 BDS。

旧版 BDS 不必手动改下载链接，可用 lip 直接装：`lip install github.com/LiteLDev/bds@<BDS版本> LeviLamina` 会安装该 BDS 并自动选能适配它的最新 LL；或 `lip install LeviLamina@<LL版本>` 装指定 LL 及其对应 BDS。lip 通过 bdsdown 从官方下载服务端。

## LeviLamina 支持 BDS 预览版（Preview/Beta）吗？能强制在预览版上运行吗？

不支持。LeviLamina 只适配特定的正式版 BDS，每个版本都针对正式版重新生成头文件、符号与 bedrock-runtime-data，预览版没有对应的适配数据，放入 LeviLamina 也无法启动或会很快崩溃。请下载与 LeviLamina 版本对应的正式版 BDS（建议用 lip 安装）。若只是想在预览版上做实验，只能自行使用 PreLoader 加载自己的东西，LeviLamina 本身无法用于预览版。

## 升级 LeviLamina 后，原有插件/模组还能用吗？需要一起更新吗？

分两种情况：

1. 同一 LL 版本系列内的小版本升级（只改最后一位，如 1.7.3→1.7.4、1.9.5→1.9.9、26.60.1→26.60.8）不跨游戏版本，LeviLamina 遵循语义化版本，插件一般无需更新可继续使用。
2. 跨 BDS 版本的升级（如 1.21.50→1.21.60、1.4.x→1.5.x、1.9.x→26.10.x）：原生（native，dll）模组一般都不能直接用，需要作者针对新版本重新适配编译并发布对应版本（如 GMLIB、iListenAttentively 等），新版本发布时通常只有 LiteLDev 自己的模组会第一时间适配；LSE（LegacyScriptEngine）脚本插件（JS/Lua 等）通常只要 LSE 本身更新到适配新版本即可继续使用。升级前请逐个确认所用模组已发布适配新 LL 版本的版本，以各自更新日志为准。

用 lip 管理时，`lip setup` 会更换游戏/LL 版本并重新请求已安装的模组，PreLoader、bedrock-runtime-data 等依赖也会按 LeviLamina 的 `lip.toml` 自动更新。原生模组可在 LeviMC 模组站 <https://levimc.org/mods/> 搜索下载；已停更且找不到的旧模组，若没有其他模组依赖它，可直接删除。

## Minecraft 改用 26 开头的版本号后，LeviLamina 的版本号怎么变？1.9.x 之后的下一个版本是什么？

从适配 BDS 1.26.10 开始，LeviLamina 的版本号改为跟随 MC 版本：1.9.x（对应 BDS 1.21.132）之后的下一个版本是 26.10.0（随后 26.10.1 等），中间没有 26.0。之后依次为 26.20.x、26.32.x、26.40.x、26.51.x、26.60.x，主次版本号对应所适配的 MC 版本（如 LeviLamina 26.60.x 对应 BDS 1.26.60.6）。

*适用版本：LeviLamina 26.10.0 及以上*

## LeviLamina 现在不再绑定基岩版 BDS 的具体版本了吗？怎么获得对应版本的 BDS？

每个 LeviLamina 版本仍对应特定的 BDS 版本（例如 LeviLamina 26.60.8 对应 BDS 1.26.60）。用 lip 安装 LeviLamina 时会自动下载安装对应版本的 BDS（包 `github.com/LiteLDev/bds`），无需手动匹配：`lip install LeviLamina` 安装最新 LeviLamina 及其支持的游戏版本，或 `lip setup --game <版本>` 指定游戏版本（lip 会选支持该版本的最新 LeviLamina；没有匹配的会提示）。

## 用第三方整合包（如 MineBBS 上的 LeviLamina+LSE 整合包）无法启动（PeEditor 等步骤异常），BDS 版本必须对应吗？不用 lip 能安装吗？

BDS 版本必须与 LeviLamina 严格匹配，协议号相同的其他版本也不行（例如 LeviLamina 1.3.x 只能用 BDS 1.21.80；当前 LeviLamina 26.60.8 对应 BDS 1.26.60）。推荐用 lip 安装（`lip install LeviLamina` 或 `lip setup --game <版本>`），会自动下载对应版本 BDS 并完成 PreLoader、PeEditor、运行时数据（bedrock-runtime-data）等步骤；若 lip 安装/启动失败可尝试关闭杀毒软件。

不用 lip 也可以，但需自行准备对应版本的 BDS、PreLoader、PeEditor、bedrock-runtime-data（版本以 LeviLamina 的 `lip.toml` 中 deps 为准），解压到同一目录后运行 `.\PeEditor.exe -mb` 修改 BDS。安装后用 `bedrock_server_mod.exe`（或 `lip run`）启动。

## LeviLamina 刚更新到新大版本后，加载插件时日志满屏 fatal/error，服务器随即崩溃，是怎么回事？

这是插件或前置库还没适配新版 LeviLamina/BDS 导致的。加载阶段出现 fatal（如 `Couldn't find:` 某符号）的，基本运行起来就会崩。错误分两类：一类是插件用到的 MC API/符号在新版不存在；另一类是依赖的前置（如 GMLIB、LegacyRemoteCallApi、iListenAttentively 等）未适配。解决办法是等插件和前置更新，或继续使用它们支持的旧版 LeviLamina 与对应 BDS。

## LeviLamina 启动时日志显示“正在加载 XXX(如 CustomMap) … ERROR [LeviLamina] 无法加载 XXX”，怎么办？

一般是该模组版本未适配当前 LeviLamina/BDS 版本（日志后面通常有具体原因，如缺依赖、缺符号）。需等待模组作者更新，或者把 BDS 和 LeviLamina 一起降级到该模组支持的版本：LeviLamina 每个版本绑定特定 BDS 版本，单独降 LeviLamina 不行，可用 `lip setup` 一并切换游戏与加载器版本。发日志请发完整日志文件。

## 控制台提示某 mod 不支持当前 BDS 版本，但这个 mod 看起来还能正常运行，需要处理吗？

需要处理。该提示表示 mod 与当前 BDS 版本不匹配，只是暂时还没执行到出问题的代码（失效的符号/偏移），一旦执行到就可能直接崩溃。应换成与当前 BDS/LeviLamina 版本匹配的 mod 版本。

*未能从源码或文档中直接证实，仅供参考。*

## 服务器启动日志停在 PreLoader 的 `Loading Reverse Lookup Table` / `Preloading: LeviLamina` / `LeviLamina Loaded.` 后直接闪退，`latest.log` 为空，是什么原因？

一般是 BDS 版本与 LeviLamina 版本不匹配，需使用 LeviLamina 对应的 BDS 版本（也可检查 BDS 文件是否完整）。建议用 lip 安装 LeviLamina 以自动匹配依赖，并在控制台直接运行查看完整输出（不要只看面板/`latest.log`）。

*适用版本：LeviLamina 1.x 及以上（使用 PreLoader 的版本）。未能从源码或文档中直接证实，仅供参考。*

## 服务端加载 mod 时报错/崩溃（例如在 BDS 1.21.60 上装了为 1.21.80 版 LeviLamina 编译的 mod），原因是什么？

mod 与服务端/LeviLamina 版本不匹配。mod 必须针对当前所用的 LeviLamina（及其绑定的 BDS 版本）编译，需换用对应版本的 mod，或把服务端和 LeviLamina 一起升级到 mod 所需版本。

## 装了 LeviLamina 和 iListenAttentively 等 mod 后服务器崩溃，日志显示 LeviLamina 版本过老/数据不匹配，原因是什么？

bedrock-runtime-data 的版本与 LeviLamina 不匹配（或 LeviLamina 版本过老与 BDS 不对应）。LeviLamina、bedrock-runtime-data、BDS 必须相互对应，建议用 lip 一起安装/升级（LeviLamina 的 `lip.toml` 精确锁定了 bds 与 bedrock-runtime-data 版本），mod 也需更新到对应版本。

## LeviLamina 客户端同时注入 Onix Client 会出问题（甚至导致关机），能解决吗？

两者 hook 冲突，基本无法解决，不要同时使用 LeviLamina 客户端和 Onix 等注入式第三方客户端。

*适用版本：LeviLamina 客户端 1.8.x 及以上。未能从源码或文档中直接证实，仅供参考。*

## 为某个版本（如 26.30）做的 LeviLamina 客户端模组能在相近版本（如 26.33）上用吗？

不一定。相近版本协议相同可以互相联机，但模组 hook 的函数/符号地址可能不同，原生模组需要针对具体游戏版本适配，版本号接近不代表模组兼容（例如有模组就单独发布了 26.33 版本）。请使用与游戏版本对应的模组构建。

## 为什么 iOS 玩家无法通过 IP 进入使用 NetherNet 的 BDS 服务器，而 Android/Windows 可以？

使用 RakNet 时所有平台玩家都能进入；iOS 进不去是 NetherNet 的问题：Mojang 没有修改 iOS 应用策略允许通过 IP 访问明文 HTTP（NetherNet 信令），导致 iOS 无法连接通过 IP 提供的 NetherNet 服务器。需要 iOS 玩家进入时可改用 RakNet。

*适用版本：BDS 26.x 使用 NetherNet 时。未能从源码或文档中直接证实，仅供参考。*

## 只升级了 LegacyScriptEngine（或 LeviLamina）后，插件全部报错（控制台一片红），为什么？

BDS、LeviLamina、LegacyScriptEngine 以及原生 mod 的版本是一一对应的，差一个都会报错。升级时应把 BDS、LeviLamina、LSE 和所有原生 mod 一起升级到相互对应的版本（推荐用 lip 管理，自动解析依赖版本）。

## 如何知道当前 LeviLamina 对应/运行的是哪个 BDS（游戏）版本？

在服务器控制台输入 `version` 命令，输出形如 `Game version <游戏版本> with LeviLamina-<LL版本>.`，可同时看到游戏（BDS）版本和 LeviLamina 版本（该命令默认开启，可在 LeviLamina 配置的 `modules.command.versionCommand` 中关闭或调整权限）。BDS 自身启动日志也会打印游戏版本。另外 LeviLamina 的 `lip.toml` 中 `github.com/LiteLDev/bds` 依赖写明了该 LL 版本适配的 BDS 版本（例如 LeviLamina 26.60.8 依赖 bds 1.26.60）。

## 存档来自小版本号不同（如 26.52.3）的游戏，还能在 LeviLamina 服务端上用吗？需要降级吗？

可以直接把存档文件夹放进服务端的 `worlds` 目录使用（并在 `server.properties` 的 `level-name` 中指定），同一大版本内不同小版本的存档一般可直接加载，不需要降级。但存档从较新版本拿到较旧服务端时仍有兼容风险，建议先备份。

*适用版本：BDS 原版存档行为，与 LeviLamina 版本无关。未能从源码或文档中直接证实，仅供参考。*

## 升级 LeviLamina 服务端的 BDS 版本（解压新版并复制存档）后所有 mod/插件都失效了，为什么？

mod 必须和游戏（BDS）及 LeviLamina 版本对应，C++ mod 针对哪个 LL 版本编译就只能在对应版本上运行。升级服务端后需要同时把所有 mod 更新为适配新版本的版本，不能只升级服务端而沿用旧 mod。

推荐用 lip 管理：`lip setup --game <游戏版本> --loader levilamina` 更换游戏和 LeviLamina 版本（会保留并重新解析能配合的其他包），再用 `lip update` 更新 mod；`lip update` 本身不会更换游戏和加载器。

## 用 `bedrock_server.exe` 能正常开服，但用 `bedrock_server_mod.exe` 启动时读取存档就闪退且无日志，LeviLamina 似乎没加载，是什么原因？

通常是 BDS 版本与 LeviLamina 不匹配（安装了该 LL 版本不支持的 BDS），LL 无法加载。每个 LL 版本只适配特定 BDS 版本（见 LeviLamina `lip.toml` 中的 bds 依赖）。最简单的方式是在空目录用 lip 搭建：`lip install LeviLamina`（或 `lip setup --game <游戏版本> --loader levilamina`），lip 会自动安装适配的 BDS 和 LeviLamina 并生成 `bedrock_server_mod.exe`。

## 能否手动降级 LeviLamina？只替换 LeviLamina 文件后服务器（面板服）不再加载 LeviLamina 了怎么办？

LeviLamina 版本与 BDS 版本绑定，降级 LL 必须同时换成对应版本的 BDS，单独替换 LL 文件不可行。推荐在本地电脑上的服务器目录（或空目录）用 lip 指定版本：`lip setup --game <BDS版本> --loader levilamina@<LL版本>`，lip 会同时安装匹配的 BDS 和 LeviLamina 并保留其它仍兼容的包，然后把整个服务端上传到面板。注意 `lip install` / `lip update` 不会改变游戏和加载器版本，必须用 `lip setup`。

## LeviLamina 服务器启动后插件完全不加载，原因是什么？

通常是 PreLoader 与 LeviLamina/BDS 版本不配套，或 PreLoader 所需的数据文件缺失，导致 LeviLamina 和插件根本没有被注入。

每个 LeviLamina 版本都锁定了确切的 PreLoader 版本和 bedrock-runtime-data 版本（例如 LeviLamina 26.60.8 依赖 PreLoader 1.16.8、BDS 1.26.60），因此不要手动混搭各组件版本，建议用 `lip install github.com/LiteLDev/LeviLamina` 安装，lip 会按依赖自动装好匹配的 PreLoader、PeEditor、bedrock-runtime-data 和 BDS，并执行 `PeEditor.exe -mb` 生成 `bedrock_server_mod.exe`。另外要确认启动的是 `bedrock_server_mod.exe` 而不是原版 exe。

*适用版本：LeviLamina 1.x 及以上（当前 26.60.x）*

## 安卓上的 `.so` mod 是否所有基岩版启动器都能加载？

不一定。基于 Preloader SDK（`pl::` API，`LiteLDev/preloader-android`）开发的安卓原生 mod 由 Android 版 LeviLauncher 通过 `libpreloader.so` 加载，其他启动器若不能加载 preloader 就无法使用；部分 mod 只能由 LeviLauncher 加载，一些 ImGui mod 还依赖特定启动器提供的触控/输入支持。

变通做法是从 LeviLauncher 安装包中取出 `libpreloader.so` 与 mod 一起加载，但能否成功取决于该启动器。

*适用版本：LeviLauncher-Android（当前 v1.7.1）。未能从源码或文档中直接证实，仅供参考。*
