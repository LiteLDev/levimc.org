# LeviAntiCheat

## 能否不用 LeviAntiCheat（LAC）自带的处罚，而由自己的插件监听作弊事件并自定义处罚？LeviPenalizeCheat 怎么用，有 LSE 版本吗？拦截（cancel）事件会怎样？

可以。LAC 通过 LeviLamina 的 EventBus 发布 `lac::punish::PlayerCheatEvent`（检测到作弊，含 `mCheatType`、`mExtraData`、`mDuration`、`mType`）、`lac::punish::PlayerBanWaveEvent`（BanWave 踢出/封禁）和 `lac::punish::SusClientEvent`（可疑客户端），均为可取消事件。

官方模板 <https://github.com/LiteLDev/LeviPenalizeCheat> 是一个 LeviLamina C++ mod 模板（自带这几个事件的头文件），按写 C++ mod 的方式用 `ll::event::EventBus::getInstance().emplaceListener<lac::punish::PlayerCheatEvent>(...)` 订阅并实现自己的处罚逻辑。官方没有 LSE 版本；如需在脚本中使用，只能自己写 C++ mod 把事件转发出去（例如通过 RemoteCall 导出给 LSE）。

关于拦截：LAC 在执行内置日志与处罚之前先发布 `PlayerCheatEvent`，若事件被 cancel，本次作弊既不会输出日志、也不会执行内置处罚或计入 BanWave 违规值。如果只想监听而不影响内置处罚，处理函数里不要 cancel；如果想完全接管处罚，也可以直接在 `config.json` 中把 `punish.enable` 设为 `false`。

*适用版本：LeviAntiCheat 0.1.2 起（当前 v0.18.0 仍适用）*

## 玩家移动时频繁被拉回、TPS 下降，是 LeviAntiCheat（LAC）造成的吗？用了 LAC 后 server.properties 里的服务端权威移动（server-authoritative-movement）需要怎么设置？

拉回来自 BDS 自带的服务端权威移动校验，不是 LAC。当前版本的 LAC 已经没有移动（非法移动）检测：旧版 LAC 的 `IllegalMovementCheck` 本身也只是启用 BDS 自带的服务端移动校验，并在 v0.15.0 中被移除。因此 LAC 不需要你调整 `server.properties` 中的权威移动相关配置，保持默认即可。

有用户反馈，新版 BDS（约 1.21.70 起）强制开启权威移动，`server.properties` 已无法关闭；服务器 TPS 过低（约低于 10）时更容易频繁拉回，此时应先排查卡顿原因，如确需关闭只能借助专门的 mod hook。

*适用版本：LeviAntiCheat 0.15.0 及以上（当前 v0.18.0）；BDS 行为部分依赖原版版本。未能从源码或文档中直接证实，仅供参考。*

## BDS 设置 online-mode=false（关闭正版验证）后玩家数据/背包一直丢失，进服像新玩家一样，怎么解决？

关闭正版验证后玩家数据可能无法按原方式读取而“丢档”。LeviAntiCheat（LAC）自带离线模式背包保护（修复离线模式玩家背包丢失问题），在 `mods/LeviAntiCheat/config/config.json` 中把 `worldSafety.offlineInventoryProtection` 设为 `true`（默认为 `false`）后重启或执行 `/lac reload` 即可；也可以自己写插件保存玩家数据。

*适用版本：当前 LeviAntiCheat（v0.18.0）*

## LeviAntiCheat（LAC）提示检测到使用 NoPacket 是什么意思？

表示检测到该玩家超过一定时间没有发送数据包（停止发包检测）。阈值由 `config.json` 中 `movement.noPacketCheck.maxNoPacketTime` 控制（默认 12 秒）。如果误报，可调大该值或将 `movement.noPacketCheck.enable` 设为 `false` 关闭；开发调试时也可以关闭该检测，或通过订阅 `PlayerCheatEvent` 自行处理（见 LeviPenalizeCheat）。

*适用版本：当前 LeviAntiCheat（v0.18.0）*

## LeviAntiCheat 的禁言命令怎么用？直接输入 mute 无法运行。

禁言是 LAC 主命令 `lac` 的子命令，需要用 `/lac mute <玩家> [时长(分钟)]` 禁言，`/lac unmute <玩家>` 解除禁言，`/lac query <玩家>` 可查询玩家的封禁/禁言状态，而不是单独的 `mute` 命令。

*适用版本：LeviAntiCheat 0.4.4 及以上*

## LeviAntiCheat 日志出现 `"xxx" 已被检测到使用: Reach, current reach distance: 5.517 cheat level: 6` 并把玩家 BanWave 踢出，是什么意思？能否关闭？记录在哪看？

Reach 表示攻击距离过远（长臂猿）：`current reach distance` 是本次检测到的攻击距离；`cheat level` 是该玩家累计的超距命中计数（每次超距 +1、正常攻击 -1），超过 `detectLevel`（默认 7）才会判定为 Reach 并输出该日志。可能是玩家开了长臂外挂，也可能是高延迟导致误判。

相关配置在 `mods/LeviAntiCheat/config/config.json` 的 `combat.reachDistanceCheck`：

- `enable`：开关；
- `reachDistance`：非创造模式最大攻击距离，默认约 3.2；
- `reachDistanceCreative`：创造模式，默认约 5.3；
- `detectLevel`：判定阈值。

每次 Reach 计入的违规值在 `punish.checkTypeViolationMap.Reach`（默认 20），累计达到 `punish.kickVL`（默认 100）会被 BanWave 踢出，`punish.enableBanWave` 可关闭 BanWave。LAC 所有检测都可在配置中单独开关。

LAC 的专用日志文件为 `./logs/LeviAntiCheat.log`，控制台输出由 `consoleLog` 控制；旧版曾出现日志文件不记录的问题，已在 0.8.1 修复。

*适用版本：当前 LeviAntiCheat（v0.18.0）；reachDistance 配置项自 0.4.4 起*

## LeviAntiCheat 的 GitHub 地址是什么？LLAC 和 LAC 有什么区别？

地址：<https://github.com/LiteLDev/LeviAntiCheat>，可用 `lip install github.com/LiteLDev/LeviAntiCheat` 安装。LLAC（LLAntiCheat）是 LiteLoaderBDS（LL2）时代的旧版反作弊，仓库已归档；LAC（LeviAntiCheat）是对应 LeviLamina 的反作弊，目前仍在维护。

## LeviAntiCheat（LAC）开源吗？它的反矿透对矿透材质包/作弊客户端有效吗？

LAC 是闭源项目（公开仓库只提供 README、配置说明、语言文件和发布包），不接受直接代码贡献。

反矿透是服务端在发送子区块数据时改写方块（参考 PaperMC 的 Anti-Xray），与客户端用材质包还是作弊端无关，客户端无法绕过。配置在 `cheatPrevention.antiXray`，每个维度可选 `engineMode`：

- `0`：把被完全包裹的矿物替换成石头/深板岩等（隐藏模式）；
- `1`：把被隐藏的实心方块随机替换成 `obfuscateBlocks` 中的假矿（假矿模式）；
- `2`：类似 `1`，但按 Y 层统一替换。

注意：暴露在空气/水中的矿物、高于 `maxHeight` 的矿物仍可能被看到；另外要保持 `worldSafety.fakeSeed` 开启，防止通过种子反推矿物位置。

*适用版本：LeviAntiCheat 当前版本（反矿透在 0.16.0/0.17.2 重写，现行 engineMode 0/1/2）*

## LeviAntiCheat（LAC）能防区块边界刷物（区块物品复制）等复制物品漏洞吗？

LAC 目前没有针对区块边界刷物的修复，也不拦截傀儡刷物。它在 `bugFixes` 中提供的刷物相关修复有：

- `uiItemDuplicateFix`：UI 槽位刷物；
- `fallingBlockCopyFix`：重力方块/刷沙机类，例如垂滴叶刷沙；
- `bundleContainerIdentityFix`：存储容器身份变化导致的刷物，与收纳袋相关；
- `blockActorContainerMoveFix`：活塞推动容器方块刷物。

区块刷物可以先通过行为日志排查刷物玩家，或者另装针对性的修复插件。

*适用版本：LeviAntiCheat 0.17.5 及以上（当前 0.18.0）*

## 想用 LeviAntiCheat 修复利用工作台/UI 槽位无限复制物品的 bug，但不想开启 LAC 的全部功能，怎么办？

LAC 自带 UI 槽位刷物修复，对应配置项是 `bugFixes.uiItemDuplicateFix`（默认 `true`）。LAC 的各项功能都可以在 `mods/LeviAntiCheat/config/config.json` 里单独关闭：保留 `bugFixes.uiItemDuplicateFix` 为 `true`，把不需要的检测的 `enable` 或布尔值改为 `false`（例如 `cheatPrevention.antiXray.enable`、`movement.timerCheck.enable`、`combat.autoClickCheck.enable` 等；如不想被踢出也可把 `punish.enable` 设为 `false`）。建议直接修改值，不要删除配置项。改完后执行 `/lac reload` 或重启服务器。安装：`lip install github.com/LiteLDev/LeviAntiCheat`

*适用版本：LeviAntiCheat 当前版本（0.18.0，LeviLamina 26.60.\*）*

## LeviAntiCheat 的反矿透（AntiXray）功能原理是什么？

LAC 的反矿透基于混淆（参考 PaperMC 的实现）。服务端改写发给客户端的区块数据，被实心方块完全包住、玩家本来看不到的矿石会被替换成假方块，客户端拿不到真实方块，矿透材质包也就失效。它有三种模式：

- `engineMode` 0：把 `obfuscateBlocks` 里的矿石替换成 `mainBlock`（默认 stone/deepslate）；
- `engineMode` 1：把隐藏的实心方块随机替换成 `obfuscateBlocks` 里的方块；
- `engineMode` 2：按 y 层统一替换。

配置在 `config.json` 的 `cheatPrevention.antiXray` 下，按维度在 `dimensions` 中设置，详见仓库的 `anti_x_ray.zh.md`。暴露在空气中的矿石不会被隐藏。另外要保持 `worldSafety.fakeSeed` 开启，否则可以通过种子反推矿物位置。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## LeviAntiCheat 会把 OP/管理员也判定并踢出，有 OP 豁免吗？怎么让 LAC 忽略管理员？

LAC 不区分是否为 OP，一视同仁，这是正常行为，配置中也没有 OP 豁免项。处理办法：

1. 把误判的那项检测在 `config.json` 中单独关掉（例如 `movement.timerCheck`、`noPacketCheck`，或 `combat` 下的检测）；
2. 用官方模板 LeviPenalizeCheat（<https://github.com/LiteLDev/LeviPenalizeCheat>）自定义处罚逻辑，跳过管理员；也可以调整 `punish` 下的 `kickVL` 等阈值。

旧的第三方插件 Lac-IgnoreOperator 已归档，最后发布于 2025-01，不建议在新版上使用。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## LeviAntiCheat 的反矿透高度设得过高（如下界设成 256）后，玩家进下界一直卡在生成地形/加载界面；这个『高度』配置能改地狱高度吗？

不能。这个配置是 `cheatPrevention.antiXray.dimensions.<维度>.maxHeight`，表示只混淆该 y 坐标以下的方块，也就是反矿透生效的最大高度，跟维度本身的高度无关，反作弊插件不会修改游戏本身。`maxHeight` 应设在该维度的高度范围内（下界默认 128），并且必须是 16 的倍数（否则会在日志报错，该维度不启用反矿透）。

据维护者说明，把混淆高度设到超出维度高度时，服务端发出的区块客户端不认，会卡在加载界面，调回 128 即可。要修改地狱高度需要另装专门的插件。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## LeviLamina 服务器怎样对玩家隐藏或伪造世界种子？还需要单独装 FakeSeed 插件吗？

不需要单独装，LeviAntiCheat 自带假种子功能（`worldSafety.fakeSeed`，默认开启），它会直接改写服务端发给客户端的种子。安装：`lip install github.com/LiteLDev/LeviAntiCheat`。

addon 做不到这一点；用资源包隐藏设置界面里的种子显示只是不显示，客户端仍能拿到真实种子。也可以用行为包的 feature rule 和自定义群系改动世界生成，这样即使知道种子也推不出结构位置。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## LeviAntiCheat 配置文件中的 fakeSeed 项（enable、randomSeed、seed）分别是什么意思？

`fakeSeed` 位于 `config.json` 的 `worldSafety` 下，用于向客户端发送假种子。

- `enable`：是否启用假种子；
- `randomSeed`：为 `true` 时使用随机的假种子，此时 `seed` 不生效；
- `seed`：`randomSeed` 为 `false` 时发送的固定假种子数值。

默认值：

```json
"worldSafety": { "fakeSeed": { "enable": true, "randomSeed": false, "seed": 0 } }
```

启用假种子后不需要手动关闭客户端区块生成（ClientSideChunkGen），LAC 会自动处理。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## LeviLamina 服务器有什么反作弊插件可用？旧的 LLAC 有 LeviLamina 版本吗？

有，LiteLDev 官方的 LeviAntiCheat（LAC），仓库是 <https://github.com/LiteLDev/LeviAntiCheat>。可以用 lip 安装：`lip install github.com/LiteLDev/LeviAntiCheat`，也可以从 GitHub Releases 下载。注意要选与所用 LeviLamina 版本匹配的 LAC 版本（例如 LAC 0.18.0 依赖 LeviLamina 26.60.*）。

*适用版本：LeviLamina 当前版本*

## LeviLamina 服务器上能否直接使用为 LiteLoaderBDS（LL2）编写的反作弊 dll 插件？

不能，LiteLoaderBDS（LL2）的原生插件无法在 LeviLamina 上运行。LeviLamina 下请使用官方反作弊 LeviAntiCheat（LAC）：<https://github.com/LiteLDev/LeviAntiCheat>，可通过 `lip install github.com/LiteLDev/LeviAntiCheat` 安装，或在 Releases 页面（<https://github.com/LiteLDev/LeviAntiCheat/releases>）下载。注意 LAC 版本需与 LeviLamina 版本对应（如 LAC v0.18.0 依赖 LeviLamina 26.60.*）。

*适用版本：当前所有 LeviLamina 版本*

## LeviAntiCheat（LAC）为什么会被 Windows Defender / Windows 安全中心 / 360 识别为病毒或木马并删除？怎么办？

这是误报。LAC 是闭源插件，维护者称其做了加壳/代码保护（VMProtect），且 dll 没有数字签名，杀毒软件容易把这类文件误判为木马。请只从官方 GitHub Releases 或 lip 下载，然后把服务器目录（或 `mods/LeviAntiCheat` 目录）加入 Windows Defender 等杀软的排除项/信任列表，再重新解压或安装即可。

*适用版本：当前所有 LeviAntiCheat 版本（Windows）。未能从源码或文档中直接证实，仅供参考。*

## 开启 LeviAntiCheat 反矿透后，玩家反馈挖到的钻石等矿石变成了石头，这是 bug 吗？

不是 bug。在 `engineMode: 1` / `2`（默认配置为 1）下，反矿透会把被实心方块完全包围的实心方块替换成 `obfuscateBlocks` 里的假矿发给客户端，用来迷惑矿透玩家；当方块发生变化（开始挖掘、爆炸等）时，服务器会重新发送周围的真实方块，假矿于是显示为真实的石头。

如果玩家贴脸就能看到矿石变化，可以调大对应维度的 `cheatPrevention.antiXray.dimensions.<维度>.updateRadius`（默认 2），但范围越大客户端能透视的范围也越大。

*适用版本：LeviAntiCheat 当前版本（v0.17.2 重写反矿透后的配置结构）*

## LeviAntiCheat 的反矿透（anti x-ray）开了感觉没效果，或者导致回弹，参数怎么调？

参考官方文档调整参数：<https://github.com/LiteLDev/LeviAntiCheat/blob/release/anti_x_ray.zh.md>。文档说明了 `cheatPrevention.antiXray` 下各配置项（`enable`、`maxThreads`、`autoSolidCheck`、`dimensions.<维度>.engineMode`/`maxHeight`/`updateRadius`/`obfuscateBlocks`/`mainBlock` 等）的含义，给出了 `engineMode` 0/1/2 的主世界与下界推荐配置，并有“仍能看到矿物”“y=0 以下不起作用”等常见问题排查。

*适用版本：LeviAntiCheat 当前版本*

## 有没有能检测 32k 等违禁物品（非法附魔、基岩、传送门方块、刷怪笼、刷怪蛋、特殊值方块等）的插件？

可以用 LiteLDev 官方反作弊 LeviAntiCheat（LAC）。在 `mods/LeviAntiCheat/config/config.json` 的 `inventoryManagement.banItem.blacklist` 中填写要禁用的物品命名空间 ID（如 `"minecraft:bedrock"`）；超等级附魔可开启 `inventoryManagement.enchantCheck`（默认关闭）并在 `maxEnchantLevel` 中设置各附魔最大等级，另有 `anvilEnchantLimits`（铁砧附魔检查）、`invalidItemDetection`、`invalidStackDetection`、`antiInvalidNbtItem` 等检测。

*适用版本：LeviAntiCheat 当前版本（配置 version 21）*

## LeviAntiCheat 的违禁/非法物品检测为什么没报告玩家身上已有的末地传送门框架？如何禁用某些物品？

装了 LAC 后玩家是刷不出这类物品的，会被阻止并在控制台提示；未报告的通常是安装前就已存在的残留物品。

要禁用物品，在 `mods/LeviAntiCheat/config/config.json` 的 `inventoryManagement.banItem.blacklist`（字符串数组）中填写物品命名空间 ID，如 `"blacklist": ["minecraft:bedrock", "minecraft:end_portal_frame"]`，并保持 `banItem.enable` 为 `true`。命中后触发 BanItem 检测并按 `punish.checkTypeViolationMap.BanItem` 计违规值；LAC 设计上不负责清除物品，如需清除可监听 `lac::punish::PlayerCheatEvent`（参考 LeviPenalizeCheat 模板）自行处理。

*适用版本：LeviAntiCheat 当前版本（配置 version 21）*

## LeviAntiCheat（LAC）配置中的 banItem（禁用物品列表）支持正则表达式吗？

不支持。`inventoryManagement.banItem.blacklist` 只能写具体的物品命名空间 ID（如 `"minecraft:bedrock"`），不能用正则或通配符匹配。

*适用版本：LeviAntiCheat 当前版本。未能从源码或文档中直接证实，仅供参考。*

## LeviAntiCheat 的附魔检测误踢人（如脱装备时触发铁砧附魔检测）或关不掉，怎么办？

LAC 有两项独立的附魔检测：`inventoryManagement.enchantCheck`（附魔等级检查，默认关闭）和 `inventoryManagement.anvilEnchantLimits`（铁砧附魔检查，默认开启）。只关 `enchantCheck.enable` 是不够的，还需要把 `"anvilEnchantLimits": false` 才能完全关闭附魔相关检测，改完执行 `/lac reload` 或重启。也可以只降低 `punish.checkTypeViolationMap` 中 `InvalidAnvilEnchant` / `InvalidEnchantLevel` 的违规值来避免被踢。早期 0.4.0-rc6 等版本的脱装备误判已在 rc.6~rc.8 修复，请使用最新版。

*适用版本：LeviAntiCheat 当前版本（配置 version 21）*

## 下载了 LeviAntiCheat（LAC，含反矿透功能）放进服务器后不加载、没有任何提示，也找不到配置文件，应该怎么装？

推荐直接用 lip 安装：`lip install github.com/LiteLDev/LeviAntiCheat`，lip 会自动放到正确位置并匹配 LeviLamina 版本。

手动安装时，从 GitHub Release 下载 `LeviAntiCheat-windows-x64.zip`，把压缩包里的 `LeviAntiCheat/` 整个文件夹（含 `manifest.json` 和 dll）放到服务端的 `mods/` 下，即 `mods/LeviAntiCheat/`，不要只放 dll 或多套一层文件夹。只看到 manifest 等描述文件而没有配置文件，说明插件没被正确加载；正确加载后会生成 `mods/LeviAntiCheat/config/config.json`。

另外要确认下载的 LAC 版本与当前 LeviLamina 版本对应（例如 LAC 0.18.0 依赖 LeviLamina 26.60.*），旧版（如给 LiteLoaderBDS/旧 LL 用的 0.2.x）不会加载。反矿透功能在配置的 `cheatPrevention.antiXray` 中调整。

*适用版本：LeviLamina 当前版本（LAC 0.18.0 / LeviLamina 26.60.\*）*

## 安装了 LeviAntiCheat 后找不到它的配置文件在哪？

配置文件需要开服一次（插件成功加载）后才会自动生成，位置是 `mods/LeviAntiCheat/config/config.json`。修改后可重启服务器，或使用 `/lac reload` 重载配置。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## 在 docker 容器里用 lip 卸载 LeviAntiCheat 失败，怎么卸载？

`lip uninstall` 是命令行操作，不会因服务器在运行而拒绝；但若要删除的文件正被运行中的服务器占用（Windows 下 BDS 加载的 `LeviAntiCheat.dll`），操作会失败并整体回滚，此时需先停服再执行 `lip uninstall github.com/LiteLDev/LeviAntiCheat`（lip 图形界面在服务器运行时会直接拒绝卸载）。

当前官方 docker 镜像中，容器的主进程就是 `lip run`，停服即容器退出，因此不能“停服后再进容器”。做法是在容器运行时执行：

```shell
docker exec -it <容器名> lip uninstall github.com/LiteLDev/LeviAntiCheat
```

这与官方教程用 `docker exec ... lip install` 添加模组的方式相同。然后 `docker stop` 再启动容器使改动生效。

Wine 镜像中 lip 原生运行在 Linux 上，一般不会遇到文件占用；若在 Windows 容器镜像中因文件占用失败，可停掉容器后用同一数据卷临时起一个容器、把入口改为 lip 执行卸载。另外如果是通过 `PACKAGES` 变量安装的，它只在首次启动时生效，删除该变量不会卸载已装的包。

*适用版本：lip 当前版本（v0.41.x），docker-levilamina-server 当前镜像（latest-wine / latest-windows）*

## LeviAntiCheat 一开始正常（或用 lip 装好后），后来启动时加载报错，发现 LeviAntiCheat.dll 不见了，是什么原因？

通常不是 lip 或插件本身的问题，而是 Windows Defender（Windows 安全中心）把 `LeviAntiCheat.dll` 当作威胁隔离/删除了（LAC 为闭源并做了保护处理，容易被误报）。到 Windows 安全中心的“保护历史记录”里恢复该文件，并把服务器目录加入排除项，然后重新安装插件（如 `lip install github.com/LiteLDev/LeviAntiCheat`）。

*适用版本：Windows 上运行的 LeviLamina 服务器，当前所有版本。未能从源码或文档中直接证实，仅供参考。*

## LeviAntiCheat 反矿透（`antiXray`）的 `engineMode` 应该填什么值？各模式有什么区别、哪个最省性能、会修改存档吗？

当前取值是 `0`/`1`/`2`（不是旧的 `1`/`2`/`3`，旧文档/图片里 PaperMC 的模式 1/2/3 分别对应这里的 0/1/2），按维度在 `cheatPrevention.antiXray.dimensions.<维度>.engineMode` 中设置：

- `engineMode: 0`：把 `obfuscateBlocks` 中的矿物替换为假方块（`mainBlock`，默认 `minecraft:stone`；y\<0 用 `mainBlockMinus`，默认 `minecraft:deepslate`），只隐藏被实心方块完全包住的矿，暴露在空气/水中的矿不隐藏；计算开销最低。
- `engineMode: 1`：把被包住的实心方块随机替换为 `obfuscateBlocks` 中的方块，防透视效果更强，但数据量更大。
- `engineMode: 2`：与 1 类似，但同一 y 层替换为同一种假方块，子区块更规整、更利于数据包压缩。

区块改写在工作线程中进行（`maxThreads`，0 表示使用 CPU 线程数），对主线程影响小；反矿透只改写发给客户端的数据包，不修改存档。只混淆 `maxHeight`（须为 16 的倍数）以下的方块，方块变化时按 `updateRadius` 重发真实方块。建议同时保持 `worldSafety.fakeSeed` 开启以防种子反推。也可以关闭 LAC 的反矿透改用独立的 GlacieTeam/AntiXray，二者配置项基本对应（AntiXray 用下划线命名，LAC 用小驼峰），但需自行确认其版本是否支持当前 LeviLamina。

*适用版本：LeviAntiCheat 0.16.0 及以上（当前 0.18.0）*

## 给 LeviLamina 服务器装上 LeviAntiCheat（LAC）后服务器崩溃（开服即崩或运行中崩溃），原因是什么？有解决办法吗？

首先确认 LAC 版本与 LeviLamina 版本匹配：LAC 每个版本只适配特定的 LeviLamina 版本（例如有用户把支持 LeviLamina 1.2 的 LAC 装在 1.1 上导致开服即崩）。请下载与当前 LeviLamina 对应的 LAC 版本，或把 LeviLamina 升级到 LAC 要求的版本；推荐用 `lip install github.com/LiteLDev/LeviAntiCheat` 安装，lip 会按依赖检查版本。

若版本匹配后运行中仍崩溃，可在 `mods/LeviAntiCheat/config/config.json` 中将 `cheatPrevention.antiXray.enable` 设为 `false`（反矿透是历史上 LAC 崩服的常见来源）来排查，并向官方提交 issue。不需要反矿透等功能的话也可以不装 LAC，LeviLamina 自身的漏洞修复（`vulnerabilityFixes`）不依赖 LAC。

*适用版本：当前所有版本（最新 LAC v0.18.0 对应 LeviLamina 26.60.\*）*

## 服务器安装 LeviAntiCheat（LAC）后主世界出现方块显示异常，如何解决？

这通常是 LAC 的反矿透（anti-xray）功能导致的（它会对被实心方块完全包围的方块进行混淆，默认 `engineMode` 为 1，会把这些被隐藏的实心方块随机替换为 `obfuscateBlocks` 中的矿物再发给客户端）。在 `mods/LeviAntiCheat/config/config.json` 中将 `cheatPrevention.antiXray.dimensions.overworld.enable` 设为 `false` 即可关闭主世界的反矿透（或将 `cheatPrevention.antiXray.enable` 设为 `false` 全部关闭），然后执行 `/lac reload` 或重启服务器。若是附加包方块显示异常，也可检查 `treatAddonBlocksAsNonSolid`、`nonSolidBlocks` 等设置。

*适用版本：当前所有版本（配置键以 LAC 0.17.x/0.18.0 为准）*

## 安装 LeviAntiCheat（LAC）后启动报版本相关错误、无法加载，怎么办？

LAC 是针对特定 LeviLamina 版本编译的，版本必须匹配。请安装与当前 LeviLamina 版本对应的 LAC（或把两者一起升级到对应版本），推荐用 lip 安装以自动解析依赖：`lip install github.com/LiteLDev/LeviAntiCheat`。例如当前最新 LAC 0.18.0 要求 LeviLamina 26.60.*；各 LAC 版本对应的 LL 版本见 CHANGELOG。

*适用版本：当前所有版本（LAC 0.18.0 对应 LeviLamina 26.60.\*）*

## LeviAntiCheat（LAC）能和 Fishing 反作弊（FAC）一起装吗？

当时维护者表示不兼容：FAC 会破坏 LeviLamina 的一个 API，二者只能选一个。

*适用版本：2024 年 4 月 LeviLamina 0.x 时期；当前版本未知。未能从源码或文档中直接证实，仅供参考。*

## LeviAntiCheat（LAC）惩罚配置中的封禁时长（`duration`）字段是什么意思？

它是惩罚（封禁）的持续时间，不是作弊次数。当前配置中对应 `punish.banDuration`，单位为秒，`0` 表示永久封禁；是否封禁由 `punish.banVL` 决定（`-1` 表示不封禁），`kickVL` 为踢出违规值。另外手动命令 `/lac ban <玩家> [原因] [时长(分钟)]` 的时长单位是分钟。

*适用版本：当前版本（LeviAntiCheat 0.18.0，配置版本 21）*

## LeviAntiCheat 报「已被检测到使用: InvalidFilterString, string size: ...」并通过 BanWave 把玩家踢出，但玩家只是用命名牌加原版 `§` 颜色符号改了物品名，怎么回事？

这是 LAC 的物品名称长度检查（违规类型 `InvalidFilterString`）：物品名字符串长度超过了配置上限。日志中的 `string size` 与名字的 UTF-8 字节数一致，`§` 格式代码和中文都占多个字节，所以看起来不长的名字也可能超限。在 `mods/LeviAntiCheat/config/config.json` 中把 `playerInteractions.itemNameLengthCheck.maxStringLength`（默认 90）调大，或将 `itemNameLengthCheck.enable` 设为 `false` 关闭该检测；也可以调低 `punish.checkTypeViolationMap.InvalidFilterString`（默认 50）的违规值（`punish.enableBanWave` 控制封禁潮）。改完后执行 `/lac reload`。

*适用版本：当前版本（LeviAntiCheat 0.18.0）*

## 修改过 LeviAntiCheat 的 `config.json` 后日志报错（如与 AntiXray 方块相关的配置错误），怎么处理？

多半是改配置时删掉了必需项、方块名写错或 JSON 格式出错。可以备份后删除 `mods/LeviAntiCheat/config/config.json`，重启服务器让其生成默认配置，再按需重新修改。AntiXray 的维度名、`engineMode` 或 `maxHeight`（须为 16 的倍数）写错时日志会报错，该维度不会启用反矿透。

*适用版本：当前版本（配置路径 `mods/LeviAntiCheat/config/config.json`）。未能从源码或文档中直接证实，仅供参考。*

## LeviAntiCheat 的 Timer（发包速率）检测误判正常玩家，站着不动也被踢，日志显示 `rate` 在 25~30 左右，怎么办？

正常客户端发送移动输入包的速率与 tick 一致，约每秒 20 个（波动约 18~22），LAC 默认阈值为 24。网络抖动时可能出现误判，可在配置中把 `movement.timerCheck.maxPacketSpeed` 调高到 30 左右（也可调整 `detectLevel`，默认 15，或降低 `punish.checkTypeViolationMap.Timer` 违规值），改完执行 `/lac reload`。

*适用版本：当前版本（LeviAntiCheat 0.18.0）*

## LeviAntiCheat 的反矿透支持 MoreDimensions 创建的自定义维度吗？

反矿透按维度配置，在 `cheatPrevention.antiXray.dimensions` 下以维度名称为键（默认只有 `overworld`、`nether`）。维护者表示自定义维度需自行在该处添加对应维度名的配置。若维度名无法识别，日志会报错且该维度不启用反矿透，请据此检查。

*适用版本：当前版本（AntiXray 已在 0.16.0/0.17.2 重写）。未能从源码或文档中直接证实，仅供参考。*

## LeviAntiCheat 的配置文件有中文说明/教程吗？

有。仓库中有中文 README：<https://github.com/LiteLDev/LeviAntiCheat/blob/release/README.zh.md>，其中给出了带中文注释的完整默认配置（配置文件位于 `mods/LeviAntiCheat/config/config.json`）；反矿透子模块另有说明文档 `anti_x_ray.zh.md`。注意配置文件中的 `"version"` 字段是配置版本号，不要手动修改（当前为 21）。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## LeviAntiCheat（LAC）经常误封/误踢正常玩家，怎么降低误判或关闭某些检测（比如只保留防矿透）？

编辑 `mods/LeviAntiCheat/config/config.json`（改完后执行 `/lac reload` 或重启服务器），把容易误判的检测的 `enable` 设为 `false`，或调宽对应阈值：

- 变速齿轮检测（误封常见来源）：`movement.timerCheck.enable`，或调大 `maxPacketSpeed`（每秒最多移动输入包数，默认 24）；
- 停止发包检测：`movement.noPacketCheck.enable`，或调大 `maxNoPacketTime`；
- 连点器、攻击距离：`combat.autoClickCheck`、`combat.reachDistanceCheck`；
- 物品相关检测：`inventoryManagement` 下的 `invalidItemDetection`、`invalidStackDetection`、`antiInvalidNbtItem`、`anvilEnchantLimits`、`banItem` 等；
- 惩罚相关：`punish.enable`（总开关）、`punish.enableBanWave`（封禁潮）、`kickVL` / `banVL`（踢出/封禁违规值），以及 `punish.checkTypeViolationMap` 中每种检测每次增加的违规值，可调低某项的违规值以降低误踢。

如果只想要防矿透，可保留 `cheatPrevention.antiXray.enable=true`，把其他检测关掉。各项含义见 <https://github.com/LiteLDev/LeviAntiCheat/blob/release/README.zh.md>。

注意：LAC 自 0.15.0 起已移除 `IllegalMovementCheck`，走路被拉回等移动校验来自 BDS 原版的服务端权威移动，不再能通过 LAC 调整。

*适用版本：LeviAntiCheat 0.15.0 及以上（当前 0.18.0）*

## 装了 LeviAntiCheat（LAC）后，玩家在平地跳跃/跑动也会摔伤掉血（TPS、延迟都正常），怎么解决？

这是 LAC“移除客户端对玩家动作的权威”功能引起的。在 `mods/LeviAntiCheat/config/config.json` 中把 `movement.disablePlayerActionsAuthority` 设为 `false`（0.17.4 起默认就是 `false`；0.17.3 中该功能名为 `PlayerActionsAuthority` 且默认开启，建议直接升级到最新版）。

*适用版本：LeviAntiCheat 0.17.3 及以上（当前 0.18.0 键名为 `disablePlayerActionsAuthority`）*

## 装了 LeviAntiCheat（LAC）后，服务器后台一直踢人，甚至所有玩家都被踢、进不去服务器，怎么解决？

这通常是 LAC 的“停止发包检测”（NoPacket）误判。该检测是检查玩家是否长时间停止向服务器发包，关闭它不会让作弊者“无敌”。在 `mods/LeviAntiCheat/config/config.json` 中把 `movement.noPacketCheck.enable` 设为 `false`，或调大 `movement.noPacketCheck.maxNoPacketTime`（默认 12 秒）。另外 0.4.5 已修复服务器主线程卡顿时 NoPacket 误判的问题，请先确认使用的是最新版 LAC。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## 某些通过发包修改玩家名字显示的插件和 LeviAntiCheat 的假名检测冲突，怎么处理？

在 `mods/LeviAntiCheat/config/config.json` 中把 `cheatPrevention.antiFakeName` 设为 `false` 即可（当前版本默认就是 `false`）。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## 装了 LeviAntiCheat 后，玩家连续输入 `shop` 等命令会被踢出，怎么办？

这是防命令刷屏检测（`CommandSpam`，用于防 Horion 之类一秒发大量命令的外挂）触发的。在 `mods/LeviAntiCheat/config/config.json` 中调大 `playerInteractions.antiSpam.maxCmdRate`（每秒最高命令数，默认 2），或调低 `punish.checkTypeViolationMap.CommandSpam`（每次触发增加的违规值，默认 50）。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## 装了 LeviAntiCheat（LAC）后仍有人刷屏拦不住怎么办？

调整 `mods/LeviAntiCheat/config/config.json` 中 `playerInteractions.antiSpam` 的设置：确认 `enable` 为 `true`，调小 `maxChatRate`（`chatRateDuration` 秒内允许的最多聊天数，默认 10 秒内 5 条）、`maxCmdRate`（每秒最多命令数）、`maxChatLength`（最大聊天长度），可开启 `disableSelector` 禁止在命令中使用目标选择器；也可以提高 `punish.checkTypeViolationMap` 中 `Spam` / `CommandSpam` / `MessageTooLong` 的违规值，让刷屏者更快被踢。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*
