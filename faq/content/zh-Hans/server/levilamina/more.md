# LeviLamina 的性能与其他问题

## LeviLamina 服务器只有一两个人在线 TPS 也很低（MSPT 很高、飞行卡顿），如何排查是哪个插件导致的？

用控制变量/二分法：先把 `mods` 目录中除 LeviLamina 及其必需组件外的 mod 全部移出，进服测试 MSPT；若纯 LeviLamina 不卡，说明是 mod 导致，再分批（二分）加回逐个排查，或先怀疑最近新装的 mod。已定位到的高开销插件案例有：通过监听方块变化记录告示牌的 playerlogger、CustomMap（地图画）等，移除后 TPS 明显恢复。此外红石/活塞机器、实体堆积也是常见原因（可限制红石频率、检查实体数量），云服务器超售导致的性能不足也要排除。

*未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 服务器内存持续上涨（几小时到十几 GB）直至崩溃，或频繁随机崩溃，怎么排查？

内存持续上涨基本可以断定是某个 mod/插件内存泄漏（原生 C++ mod 嫌疑较大）。排查步骤：

1. 先备份存档；只开纯 LeviLamina（不装 mod），或干脆运行原版 BDS，确认是否仍泄漏。
2. 若纯净环境正常，用排除法：先卸载 LSE 脚本插件观察，再逐个加回 mod（有前置的先装前置），每加一个观察一段时间内存，定位泄漏者。
3. 若卸载所有 mod 后仍泄漏，再考虑 BDS 本身或存档问题（例如末地被大量凋零破坏后的存档）。

LeviLamina 没有查看单个 mod 内存占用的命令。CrashLogger 崩溃日志中会输出 `Memory Info`（进程工作集/提交大小等），可用来判断崩溃时内存情况；用 `lip update github.com/LiteLDev/CrashLogger` 更新到最新。另外 Intel 13/14 代（Raptor Lake）CPU 不稳定也会导致大量每次不同的随机崩溃（堆栈中常见 AVX 相关函数），应检查 CPU 微码/电压稳定性。

*适用版本：当前所有 LeviLamina 版本*

## LeviLamina 服务器加载某些插件（如领地插件）时启动时间明显变长，为什么一个插件会多花几百毫秒？

主要是事件监听导致的：LeviLamina 的事件发射器（emitter，即对应的 hook）是懒加载的，某个事件第一次被监听时才会创建并安装 hook，这需要时间。如果某个插件监听了大量其他插件都没监听过的事件，这些 hook 的安装开销就都会计入它的加载时间；已经被监听过的事件，后续插件再监听会非常快。所以这部分加载时间并不完全是该插件自身造成的。

*适用版本：LeviLamina 当前所有版本（含 26.60.x）*

## LeviLamina 服务端启动非常慢怎么办？

可能是 Windows Defender 等杀毒软件在扫描服务端文件导致，可尝试把服务器目录加入 Defender 排除项；若无效，则可能与运行环境性能有关（如 PVE 虚拟机、老旧 CPU）。另外，插件首次监听大量事件时需安装 hook，也会拉长启动时间。

*适用版本：当前所有版本，Windows 环境。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 的 TPS 表现会比 LiteLoaderBDS（LL2）好吗？

差不多，TPS 主要取决于 BDS 本身，加载器不会带来明显提升。LiteLDev 另外提供了性能优化模组 LeviOptimize（优化区块发送、实体广播、红石更新、随机刻、异步任务调度等，各功能可用 `/lo` 单独开关），可按需安装：`lip install github.com/LiteLDev/LeviOptimize`。

*适用版本：LeviLamina 当前版本；LeviOptimize 当前版本（要求 LeviLamina 26.60.x）*

## 装上 LeviLamina 后 BDS 内存占用异常高（启动瞬间就到 10GB），该怎么排查？

排查方法：先直接启动纯 `bedrock_server.exe` 对比；然后备份存档，模组目录（服务端通常为 `plugins/`，不存在时为 `mods/`）里只保留 LeviLamina 及其前置，逐个移回其他 mod 定位问题（多半是某个原生 mod 内存泄漏）。可用 Windows Performance Recorder 记录内存使用，Mem Reduct 之类只能临时缓解。

曾有案例最终定位为 CustomSkin（发包改玩家皮肤）插件配合含几十个 4D 皮肤的资源包导致，删除该皮肤资源包后恢复正常。

*适用版本：LeviLamina 1.x 及以上（服务端 mod 目录为 `plugins/`）*

## 升级 LeviLamina 后开服明显变慢，卡在 `[PreLoader] Loading records from data...`，是什么原因？

据维护者解释，自 LeviLamina 1.2.0 / BDS 1.21.70 起 PreLoader 使用的符号/记录数据经过加密，加载时需要解密，所以 `Loading records from data...` 阶段会比以前慢；多数机器上只需约两秒，属正常现象，耐心等待即可。

*适用版本：LeviLamina 1.2.0-rc.1 及以后（PreLoader 1.13+）。未能从源码或文档中直接证实，仅供参考。*

## 在哪里查看 LeviLamina 的全网使用统计（服务器数量、玩家数等）？需要另装 bStats 吗？

LeviLamina 自带 bStats 统计上报（0.9.1 起加入），无需另外安装 bStats。统计页面：<https://bstats.org/plugin/server-implementation/LeviLamina/21245>（也可在 bstats.org 搜索 LeviLamina）。如不想上报，可在 LeviLamina 的配置文件 `Config.json` 中将 `targeted.enableStatistics` 设为 `false`。

*适用版本：LeviLamina 0.9.1 及以上（服务端）*

## LeviLamina 服务器有什么 QQ 群服互通（QQ 群与服务器消息互通）方案？

LiteLDev 官方不提供群服互通插件，需使用社区方案，例如：HuHoBot（群服互通机器人）；或基于 WebSocket 的 CoordinationWSS（ws/wsserver），下载：<https://www.minebbs.com/resources/coordinationwss-ws-wsserver.9637/>。使用前请确认其支持你当前的 LeviLamina/BDS 版本。

*适用版本：LeviLamina 1.x 及以上（取决于第三方插件的适配情况）。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 服务器卡死时，按 Ctrl+C 为什么关不掉服务器？

LeviLamina 通过 `SetConsoleCtrlHandler`（以及 SIGINT/SIGTERM 信号处理）拦截了控制台的 Ctrl+C/关闭事件，改为调用 `DedicatedServer` 的 `stop()` 请求正常关服。当前版本中，如果服务器已经进入关服流程（`GamingStatus::Stopping`，即已执行到 `ServerInstance::leaveGameSync`）后再按 Ctrl+C，会直接 `std::terminate` 强制结束进程，因此“关服过程中卡住”可以再按一次 Ctrl+C 强制退出。但如果服务器在进入关服流程之前就卡死（例如主线程死锁），`stop()` 请求不会被处理，状态也不会变成 `Stopping`，此时多按 Ctrl+C 也没用，只能用任务管理器等方式强制结束进程。

*适用版本：LeviLamina 26.60.x（服务端）*

## LeviLamina 的文档能否离线下载？

可以。LeviLamina 文档的源文件现在位于 `LiteLDev/liteldev.github.io` 仓库的 `docs/LeviLamina/` 目录（Markdown，含中英文），克隆该仓库即可离线查看；也可在该目录下执行 `npm ci && npm run build` 本地构建站点。LeviLamina 主仓库的 `docs/` 目录现在只剩 `contributing`（构建与代码风格指南）。在线文档地址为 <https://levimc.org/LeviLamina/>（简体中文 <https://levimc.org/zh-Hans/LeviLamina/>）。

*适用版本：当前版本（2026-11-16 起文档统一迁移到 liteldev.github.io）*

## 想给 LeviLamina 的开发文档/教程提 PR 修改错误，文档源文件在哪里？

文档源文件在 `LiteLDev/liteldev.github.io` 仓库的 `docs/LeviLamina/` 目录，修改后向该仓库提交 PR 即可；教程在同仓库的 `tutorials/` 目录。文档站点为 <https://levimc.org/LeviLamina/>（简体中文 <https://levimc.org/zh-Hans/LeviLamina/>）。LeviLamina 主仓库 `docs/contributing/` 只存放参与 LeviLamina 开发本身的指南（构建、代码风格）。

*适用版本：当前版本（2026-11-16 起）*

## LeviLamina 的官网/文档地址是什么？

文档：<https://levimc.org/LeviLamina/>（简体中文 <https://levimc.org/zh-Hans/LeviLamina/>）；源码仓库：<https://github.com/LiteLDev/LeviLamina>
