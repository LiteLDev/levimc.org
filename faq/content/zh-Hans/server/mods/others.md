# 其他 LiteLDev 项目

## 旧版 LiteLoaderBDS（LL2，如 2.9.3、2.15.0、2.16.2）现在还能在哪里下载？各版本对应哪个 BDS 版本？

LL2 的历史版本在 GitHub 已归档仓库 LiteLDev/LiteLoaderBDS 的 Releases 中：<https://github.com/LiteLDev/LiteLoaderBDS/releases>（例如最终版 2.16.2：<https://github.com/LiteLDev/LiteLoaderBDS/releases/download/2.16.2/LiteLoaderBDS.zip>）。旧链接 <https://github.com/LiteLDev/LiteLoaderBDSv2> 会自动重定向到该仓库。每个 release 的说明里都标注了对应的 BDS 版本（新版本为徽章，旧版本如 2.9.3 写在说明文字中，如 `Support BDS 1.19.50 & 1.19.51`），务必选与 BDS 版本严格匹配的 LL2。LL2 已停止维护，最高只支持 BDS 1.20.31.01，更新的 BDS 请使用 LeviLamina。

*适用版本：LiteLoaderBDS 2.x（已归档），BDS ≤ 1.20.31.01*

## LiteLoaderBDS v2（LL2）最后支持的 BDS 版本是多少？有没有支持 BDS 1.20.40 及以后版本的 LL2？LL2 启动报找不到 LiteLoader/无法加载怎么办？

LL2 最终版本为 2.16.2，对应 BDS 1.20.31.01，没有支持 1.20.40 及之后 BDS 的 LL2。LL 必须与其对应的 BDS 版本严格配套，版本不匹配（例如用 BDS 1.19.30.04 配新版 LL2）就会出现无法加载的问题。LL2 已停止更新并归档，后续重构为 LeviLamina（<https://github.com/LiteLDev/LeviLamina>），新版本 BDS 请使用 LeviLamina。

*适用版本：LiteLoaderBDS 2.x（已归档）；新版 BDS 使用 LeviLamina*

## LeviLamina 服务器有没有存档热备份/自动备份插件？BackupHelper 有适配新版 LeviLamina 的版本吗，提示不兼容怎么办？

可以使用 BackupHelper（<https://github.com/ShrBox/BackupHelper>，由 LL2 版本移植的 LeviLamina mod），持续跟进 LeviLamina 版本（v0.20.0 适配 LeviLamina 26.60.*）。旧版本与新版 LeviLamina 不兼容，请到 GitHub 下载与你的 LeviLamina 版本对应的最新版本，MineBBS 等转载站不一定及时同步，以 GitHub 为准。推荐用 lip 安装：`lip install github.com/ShrBox/BackupHelper`。命令：`/backup` 立即备份、`/backup list` 列出备份、`/backup recover [编号]` 回档、`/backup reload` 重载配置；配置文件 `config.ini` 中 `BackupInterval`（小时）可设置定期自动备份，`MaxStorageTime` 控制保留天数。也可以自己写 `.bat`/`.sh`/`.py` 脚本定时打包存档目录。

*适用版本：当前 LeviLamina（BackupHelper v0.20.0 对应 LeviLamina 26.60.\*）*

## 安装 BackupHelper 后执行 `backup` 失败、提示缺少 7z（已经下载了 7z 仍然不行）怎么办？

BackupHelper 调用的是 `7za.exe`（7-Zip 独立命令行版本），不是 `7z.exe`。用 lip 安装时会自动通过依赖 `github.com/LiteLDev/7-zip-tooth` 把 `7za.exe` 放到服务端根目录：`lip install github.com/ShrBox/BackupHelper`。如果缺失，可重新安装：

```shell
lip uninstall github.com/ShrBox/BackupHelper
lip cache clean
lip install github.com/ShrBox/BackupHelper
```

或手动把 `7za.exe` 放到服务端根目录。之后在控制台或游戏内（OP）输入 `backup` 即可热备份，`help backup` 查看用法。

*适用版本：BackupHelper 0.1.6 及以上 + 当前 lip*

## LeviLamina 有 .NET（C#/F#）插件支持吗？

官方没有：LL2 时代的官方 .NET 引擎 LiteLoader.NET 早已停止维护并归档。社区项目 Hosihikari（现组织为 <https://github.com/HosihikariFramework>）提供 .NET 插件框架：HostingShim 在 BDS 进程中托管 CLR（提供 LeviLamina、Endstone 等 carrier），PluginManager 负责插件加载/生命周期，另有 CSharpLoader、FSharpLoader（源码编译加载）和 RpcLoader，可用其包管理器 Seiko 安装（如 `sk add hosihikari-hosting-levilamina`）。注意其公开契约目前只覆盖日志、配置、调度、事件总线等宿主服务，世界/实体/命令等游戏 API 不在契约内。也可以自己用 C++/CLI 或 P/Invoke 调用 C++ 接口。

*适用版本：当前 LeviLamina（社区项目，非官方）*

## Endstone 和 LeviLamina 有什么区别？

两者区别类似“插件”和“模组（mod）”：Endstone 是基于 BDS 的插件服务端（提供类似 Paper 的插件 API），API 相对有限，但不依赖 Mojang 提供的数据，能较快跟进最新版 BDS；LeviLamina 是 mod 加载器，可做的事情更多，但适配新版本需要等待相关数据。若想在 LeviLamina 上运行 Endstone 插件，可使用官方的 LeviStone（在装有 LeviLamina 的 BDS 目录执行 `pip install levistone --target mods/EndstoneRuntime`；0.11.14 及更早版本装到 `plugins/EndstoneRuntime`）。注意 LeviStone 只支持 Python 编写的 Endstone 插件，不支持 Endstone 原生（C++）插件。

*适用版本：当前版本（LeviStone 0.11.15 及以上安装到 mods/EndstoneRuntime）*

## LeviLamina 客户端光影模组 Arke 支持哪些游戏版本、怎么用？装了之后没效果或看不到光影设置界面怎么办？

Arke 可在基岩版 Direct3D 12 渲染器上运行为 Iris/OptiFine 编写的 Java 版光影包。它需要客户端版 LeviLamina 26.60.*（即 26.60 版本客户端），不支持 26.51 等旧版本。用 LeviLauncher 安装好 LeviLamina 与 Arke（安装在 `mods/arke/`）后进入游戏，在画面左上角（或存档暂停页左上角）打开光影设置（UI 目前为 imgui），导入光影包并选中应用，切换着色器可能需要几秒。看不到设置按钮的已知原因：运行了插帧（frame generator）等软件时左上角按钮不会出现，甚至可能崩溃，先关闭这类后处理，并确认游戏运行在 DX12 下。若没有效果，可在管理模组/控制台确认 mod 已加载，并查看日志 `mods\arke\logs\arke.log`；光影包加载失败时可看设置窗口中的 Messages。

*适用版本：Arke 0.1.x，Minecraft 客户端 26.60 + LeviLamina#client 26.60.\**

## 使用 Arke 光影时方块选择线框不显示，换多个光影都一样，怎么办？

这是 Arke 的兼容问题，已在 Arke v0.1.5 中修复（`Fixed an issue where some wireframes would not render`）。更新到 v0.1.5 或更新版本即可（如 `lip install github.com/LiteLDev/Arke#client`，Arke 只有 client 变体；或从 GitHub Releases 下载）。

*适用版本：Arke v0.1.4 及更早版本出现；v0.1.5 起已修复*

## iLand 已不维护，有什么替代？如何把 iLand 数据迁移到 PLand？命令提示“未找到 relationship.json 文件”怎么办？

可改用第三方领地 mod PLand（`IceBlcokMC/PLand`）。iLand 数据导入命令为（在控制台执行）：`/pland import true "C:/path/relationship.json" "C:/path/data.json"`，第一个参数表示是否清空数据库。路径中的反斜杠 `\` 要换成正斜杠 `/`，否则会报“未找到 relationship.json 文件”。注意：该命令已在 PLand v0.18.0 移除，需要先用 PLand v0.17.x 完成导入，再升级到最新版本。

*适用版本：PLand v0.17.x 及以下可直接导入；v0.18.0 及以上需先用 v0.17.x 转换后再升级*

## 领地插件用 iLand 性能怎么样？要不要换成 PLand？换了以后数据会不会导不出来？

iLand 是 LL1 时代的 Lua 脚本插件，在 LeviLamina 上需要安装 LSE 的 Lua 引擎（`lip install LegacyScriptEngine#lua`）；PLand 是 C++ 原生 mod，一般性能更好，换用后也可省掉 Lua 引擎。不是必须换，用得顺手可以继续用。PLand 的数据存在 LevelDB 中，可直接读取：PLand 0.21.x 及以下可用 QLevelDBViewer 查看，更高版本使用 PLand 自带的 DevTool 工具查看原始数据。

*适用版本：LeviLamina + LSE 当前版本；PLand 当前版本*

## CoralMap 小地图在服务器里，已扫描过的区块边缘一圈经常变黑/出现透视的空层，是什么原因？

变黑：地形扫描半径 `terrain.scanRadius` 默认 128 格（8 个区块），若服务器视距小于扫描半径，客户端超出视距的区块只是占位符，扫描结果就是黑色；需要服务器视距至少 8，或在 `config.json` 中把 `terrain.scanRadius` 调小。透视空层：mod 基于游戏缓存的高度表（heightmap）查找最上层方块，有些方块不计入高度表，若其下方隔着空气就会被“透视”。这是性能优化的代价（否则需要从 y320 往下逐格遍历，性能差很多）；作者表示后续会加配置开关，目前配置中尚无此选项。

*适用版本：CoralMap（LeviLamina 客户端 mod）当前版本*

## 客户端小地图 mod CoralMap 开启后掉帧严重，可以怎么调？

地形扫描/阴影渲染在单独线程中进行，CPU 核心不足时会与游戏渲染线程抢占。可在 mod 配置目录的 `config.json` 中：

- 调小每帧扫描区块数 `terrain.scanMaxChunksPerFrame`（默认 32，可改为 16）；
- 调低阴影模式 `terrain.shadow.renderStyle`（0=无阴影，1=简单高度图梯度阴影，2=阴影图+边缘 bevel，默认 2）；
- 调小 `terrain.scanRadius`。

*适用版本：CoralMap 当前版本*

## LeviLamina 的官方组织名是 LiteLDev 还是 LeviMC？为何 GitHub 组织 ID 没改？

官方名称为 LeviMC（官网 <https://levimc.org>）；GitHub 组织 ID 仍是 LiteLDev，维护者的说法是改名后旧链接会失效/无法完整重定向，所以不改。

## LiteLDev 论坛 `https://bbs.liteldev.com/` 打不开了吗？

该论坛早已关闭。社区入口现在是 <https://levimc.org/community/>。

## 可以在 LeviMC 平台/频道发布自动图腾（AutoTotem）之类的辅助功能模组吗？

不可以。此类功能被视为外挂，不应在 LeviMC/LL 的平台或频道发布，也不要在多人游戏中使用影响他人；自己单人玩不受管控。若开发客户端功能，建议检测当前是否在服务器中，在服务器中则禁用。

*未能从源码或文档中直接证实，仅供参考。*

## 想给 LiteLDev（LeviLamina 开发团队）捐款支持，有什么途径？

可以通过爱发电：<https://afdian.com/@liteldev>；也可以通过 Open Collective（LeviMC，<https://opencollective.com/levimc>，可用银行卡或 PayPal，以美元结算）。GitHub 仓库页的 Sponsor 按钮即指向这两个渠道。

## LiteLDev 的 LegacyParticleAPI 是否已停止维护？有什么替代？

是的，LegacyParticleAPI（从 LiteLoaderBDS 移植的 ParticleAPI）已停止维护，仓库已归档，不再有项目使用它。需要在服务端绘制粒子/调试图形时，可改用 BedrockServerClientInterface（BSCI，<https://github.com/OEOTYAN/BedrockServerClientInterface>）。

*适用版本：LeviLamina 当前所有版本*

## 客户端 mod 能否实现禁止拾取物品？如果不能，服务器上怎么做？

客户端做不到，是否拾取物品由服务端决定（客户端最多只能拿到后再丢掉）。服务端可用 LeviLamina 模组 CoralFans（`lip install github.com/CoralFans-Dev/CoralFans`）：服主（管理员）先用 `/func nopickup true` 全局开启该功能，玩家再用 `/self nopickup true` 打开自己的开关（未全局开启时 `/self` 会报错不可用）；可用 `/coralfans` 检查插件是否安装成功。命令名可在 CoralFans 配置中修改。详细用法见 <https://coralfans-dev.github.io/CoralFans-doc/>。

*适用版本：LeviLamina 服务端 + CoralFans 当前版本*

## 如何方便地下载/升级 BDS 服务端？

推荐使用 LiteLDev 的 bdsdown 命令行工具（<https://github.com/LiteLDev/bdsdown>），可通过 `lip install github.com/LiteLDev/bdsdown` 安装。用法：

```text
bdsdown.exe [--yes] [--source SOURCE] [--proc PROC] [--exclude EXCLUDE]
```

`--source` 默认 `version://windows/latest`，`--proc` 为并发下载数（默认 4），`--exclude` 排除安装的文件（如保留配置文件）。可设置环境变量 `BDSDOWN_MIRROR_URL` 使用镜像加速。也可以用 lip 只安装 BDS。

## GMLIB 的 PAPI 变量如何让延迟（ping）显示按数值变色？

可用 GMLIB PAPI 的 `scope`（区间）函数按数值区间映射颜色代码，例如：

```text
§${papi:scope,input=${papi:player_avg_ping},0..99=a,100..199=e,200..=c}${papi:player_avg_ping}
```

0~99 绿色 `§a`，100~199 黄色 `§e`，200 及以上红色 `§c`。早先流传的写法 `0..=a,100..=e` 区间有重叠，建议写成互不重叠的闭区间。区间写法为 `min..max`，`10..` 表示 ≥10，`..10` 表示 ≤10，还可用 `default=` 指定默认返回值；若要显示当前而非平均延迟可改用 `player_last_ping`。占位符文档：<https://github.com/GroupMountain/GMLIB-Release/blob/release/PlaceholderDocs.md>

*适用版本：安装了 GMLIB（当前 v26.60.1）的服务器*
