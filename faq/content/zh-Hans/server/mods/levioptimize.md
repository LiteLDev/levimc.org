# LeviOptimize

## LeviLamina 服务器 TPS 低，LeviOptimize 有没有类似 timings/spark 的性能分析命令？怎么排查卡顿？

新版 LeviOptimize（0.17.1 起）使用 `/lo profile`（需 GameDirectors 权限，控制台可用）查看由 `full_frame_timing` 诊断得到的当前和平均整帧 MSPT/TPS（最近 20 个采样）。注意它只给出整体 MSPT/TPS，不再像旧版 `timing` 命令那样按系统/插件拆分耗时。同一命令还提供 `/lo list`、`/lo reload`、`/lo enable <feature>`、`/lo disable <feature>` 等，可单独开关某项优化来对比效果。排查思路：卡顿常见原因是大量加载新区块（玩家鞘翅/船高速跑图，区块卸载后会恢复，可把玩家传回主城）、实体过多、高频红石、性能差的 Addon 或卡服机器；可把存档备份到本地打开可疑区块查看，必要时用 Amulet 等工具删除/重置区块，或换新存档对比排除插件/Addon/存档问题。需要按插件细分耗时可考虑 CoralFans 等第三方插件。

*适用版本：LeviOptimize 0.17.1 及以上；LeviLamina 26.60.x*

## LeviOptimize（0.17.1 起移植了 Endstone 的优化）能优化客户端渲染卡顿吗？

不能。LeviOptimize 只优化服务端逻辑（区块发布、实体广播、红石、随机刻等），不涉及客户端渲染。当前所有优化功能在源码中都标记为服务端功能（`FeatureSide::server`）；客户端版的 `/clilo` 命令只能管理客户端侧功能，对这些服务端优化项会提示 `not available on this side`。

*适用版本：LeviOptimize 0.17.1 及以上*

## 玩家离开后区块仍被加载（区块泄漏），LeviLamina 服务器需要装 ChunkLeakFix 吗？

不需要。ChunkLeakFix（`dreamguxiang/ChunkLeakFix`、`ES-ChunkLeakFix`）是给 Endstone 用的；LeviOptimize 自带该修复，配置键为 `chunk_leak_fix`（默认开启），在玩家断线时移除其地图 tracker 等残留状态。可用刷沙机等依赖区块卸载的机器验证是否正常。

*适用版本：LeviOptimize 0.18.0；LeviLamina 26.60.x*

## 用 lip 安装/更新 LeviOptimize 后启动仍提示版本不对或加载出错，或 lip 下载直接报错，怎么办？

通常是 lip 实际没有成功下载/更新包（例如网络对 GitHub 有阻断）。可改为手动安装：到 <https://github.com/LiteLDev/LeviOptimize/releases> 下载对应版本，服务端解压 `LeviOptimize-server-windows-x64.zip`（客户端为 `LeviOptimize-client-windows-x64.zip`），把其中的 `LeviOptimize` 文件夹复制到 `mods/` 下。注意版本须与 LeviLamina 匹配（当前 0.18.0 需要 LeviLamina 26.60.x）。

## 生电玩家建大型猪人塔、骨粉机等机器导致 BDS TPS 很低，有什么优化方案？

可安装 LeviOptimize，其 `push_entity_opt` 可限制实体推挤：默认只丢弃零向量推挤，需把 `max_push_times` 从默认的 `-1`（不限制）改为正数才会限制每 tick 推挤次数；用 RedstoneLimiter 等插件给红石降频；限制实体数量（让玩家少建或共用机器）；修改实体定义关闭村民等生物的碰撞以降低开销。检测高频红石本身也耗性能，降频比检测后破坏更合适。第三方插件与原版行为未经核实。

*未能从源码或文档中直接证实，仅供参考。*

## BDS 装了大型 Addon（如 AlylicasDungeons、Better on Bedrock）后越来越卡，换高性能 CPU 或装 LeviOptimize 能解决吗？

卡顿主要来自 Addon（脚本 API）本身性能差，堆硬件作用有限。LeviOptimize 只优化区块、实体广播、红石、随机刻等部分原生逻辑，Mojang 的 Addon/脚本 API 不在其优化范围，装了也无法解决，只能减少 Addon。

## LeviLamina 服务器人多卡顿，如何安装和配置优化插件 LeviOptimize？

用 lip 安装：`lip install github.com/LiteLDev/LeviOptimize`（当前版本 0.18.0，需要 LeviLamina 26.60.x）。首次启动会生成 `mods/LeviOptimize/config/config.json`，各优化项默认均已开启；可在 `features` 中按需关闭/调整（如 `push_entity_opt` 的子选项），修改后用 `/lo reload` 无需重启即可生效，也可用 `/lo enable <feature>` / `/lo disable <feature>` 直接开关并保存。

*适用版本：LeviOptimize 0.17.1 及以上*

## 有什么办法优化 BDS 服务器的性能？

可以安装 LiteLDev 的性能模组 LeviOptimize（GitHub：`LiteLDev/LeviOptimize`），用 lip 安装：`lip install github.com/LiteLDev/LeviOptimize`，或从 Releases 下载 `LeviOptimize-server-windows-x64.zip` 解压到 `mods/`。它针对区块发送、实体广播、红石更新、定位栏、随机刻、异步 worker 调度等热点做优化，各功能可在 `mods/LeviOptimize/config/config.json` 里单独开关，或运行时用 `/lo enable|disable <feature>` 切换。LeviOptimize 需与 LeviLamina 版本匹配（当前 v0.18.0 对应 LeviLamina 26.60.x）。另外 BDS 主要吃单核性能，选服务器时优先选主频高、单核性能强的 CPU，核心数多帮助不大。

*适用版本：LeviOptimize v0.18.0；LeviLamina 26.60.x*

## 有没有能提高 LeviLamina 服务器 TPS 的插件？LeviOptimize 和 levilamina-loc 有什么区别？

可以使用 LeviOptimize（简称 LO，<https://github.com/LiteLDev/LeviOptimize>），它是 LeviLamina 上的性能模组，针对 TPS 偏低的原版热点路径做优化，安装：`lip install github.com/LiteLDev/LeviOptimize`。levilamina-loc（<https://github.com/LiteLDev/levilamina-loc>）是 LeviLamina 的语言包（本地化翻译），通过 lip 安装 LeviLamina 时会作为依赖自动安装，与性能优化无关，不要混淆。

## 玩家离开后区块/实体不卸载（实体数量暴涨导致卡顿），在 26.x 版本上还能用 LeviOptimize 修复吗？

可以。LeviOptimize 仍在维护（未归档），最新 v0.18.0 适配 LeviLamina 26.60.x。其中 `chunk_leak_fix`（源码 `src/lo/features/ChunkLeakFix.cpp`）会在玩家断开时通过原版清理逻辑移除其地图追踪器、装饰和脏状态，避免地图数据一直追踪并持有已离线玩家的实体（源码注释：`so the map does not keep the player's entities alive`）。自 v0.17.1 起 LeviOptimize 重写为新框架并移植了一批 Endstone 的优化，配置位于 `mods/LeviOptimize/config/config.json` 的 `features` 段，键名为 snake_case（如 `"chunk_leak_fix": true`），各功能默认开启。如遇崩服，可用 `/lo list` 查看功能状态，用 `/lo disable <feature>` 逐个关闭其它功能、只保留 `chunk_leak_fix` 来排查，`/lo reload` 可免重启应用配置修改。

*适用版本：LeviOptimize 0.17.1 及以上；LeviLamina 26.60.x*

## LeviLamina 服务器（LSE 没有 TPS API）怎么查看服务器 TPS？

安装 LeviOptimize（`lip install github.com/LiteLDev/LeviOptimize`），然后执行 `/lo profile`，会输出 `full_frame_timing` 诊断统计的当前/平均整帧 MSPT 与对应 TPS（最近 20 个样本）。该命令权限为 GameDirectors（OP），可在服务端控制台执行。需确保 `config.json` 中 `diagnostics.full_frame_timing` 与 `commands.server_feature_manage_command` 为 `true`（默认开启）。

*适用版本：LeviOptimize 0.17.1 及以上；LeviLamina 26.60.x*

## LeviLamina 服务器如何直观查看/测试性能？LeviLamina 本身带优化吗？

LeviLamina 本身只是加载器/模组框架，不提供性能优化。可安装 LeviOptimize：用 `/lo profile` 查看当前/平均整帧 MSPT 与 TPS；用 `/lo list` 查看各优化功能状态，用 `/lo enable <feature>` / `/lo disable <feature>` 在运行时开关单项优化（会写回 `mods/LeviOptimize/config/config.json`），对比开关前后的 `/lo profile` 数据即可评估优化效果。注意新版不再提供按模块（如 `LevelChunkTicking`）细分的耗时统计。

*适用版本：LeviOptimize 0.17.1 及以上；LeviLamina 26.60.x*
