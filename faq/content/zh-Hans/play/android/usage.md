# Android 版 LeviLauncher 的功能与设置

## 安卓版 LeviLauncher 需要正版吗？在微软商店/PC（Java+基岩套装）、iOS 上买的正版能用吗？盗版或网上的“去验证版”启动器能用吗？

需要。LeviLauncher 启动器本身免费、开源，但安卓版会做正版验证：设备上必须装有从 Google Play 安装的官方 Minecraft（包名 `com.mojang.minecraftpe`，1.21.80 或更高版本），启动时会检查它的安装来源是否为 Google Play 商店，不满足会提示“非正版MC，请确保设备上MC来自于谷歌商店”并拒绝启动。基岩版各平台单独售卖，微软商店/PC 版（包括 Java+基岩 PC 套装）、iOS 的购买都不包含安卓版，需在 Google Play 另外购买（可用 Google Play 礼品卡等方式支付）；买好后从 Google Play 安装，最好先启动一次。从论坛、网盘、mcapks 等渠道下载的破解版/改包 MC 无法通过验证。LiteLDev 不提供任何跳过正版验证的功能，第三方流传的“去验证/破解版”启动器不受官方支持，相关问题不予处理，请只从 <https://github.com/LiteLDev/LeviLauncher-Android/releases> 下载官方版本。另外启动器仅支持 ARM64 设备（32 位手机无法使用）。PC 版 LeviLauncher 同样要求正版（微软商店）。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## LeviLauncher 安卓版是否依赖手机上已安装的 Minecraft？对游戏有什么要求？

依赖。设备上必须装有从 Google Play 安装的官方 Minecraft 基岩版（1.21.80 或更高），启动器会检查它的安装来源是否为 Google Play，改包/破解版或从其他渠道安装的 MC 无法通过启动器启动。在此基础上，启动器还支持导入官方 Minecraft APK，在启动器内运行其他游戏版本而无需逐个安装到系统（导入版本通常需要开启版本隔离），但 Google Play 版本仍必须保留在设备上。项目地址：<https://github.com/LiteLDev/LeviLauncher-Android>。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## 安卓版 LeviLauncher 打开后原来 MC 里的存档和模组都不见了，怎么把存档、addon、资源包和 `.so` 模组导入到启动器里？

安卓端 LeviLauncher 使用自己的数据目录，和 Minecraft 本体（Google Play 版直接启动时）的数据相互隔离，所以启动器里看不到原来的存档。导入方法：把存档打包/改后缀为 `.mcworld`，addon 为 `.mcaddon`，资源包/皮肤包为 `.mcpack`，然后用“打开方式”选择 LeviLauncher 即可导入；也可以在启动器内的内容管理（世界、资源包）中导入、导出和备份。`.so` 原生模组（以及 `.levipack` 模组包）同样可以用“打开方式”选择 LeviLauncher，或在“模组”页面添加。若开启了版本隔离，不同版本之间的数据也互相独立，导入时注意选对版本。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## 安卓 LeviLauncher 里导入的“模组”是什么格式？和 LeviLamina 模组有什么区别？网盘里的 apk 是模组吗？

安卓版 LeviLauncher 的模组是 Android 原生模组：单个 `.so` 库，或打包好的 `.levipack`（ZIP，内含 `manifest.json`、`lib<名称>.so` 和 `config`）/`.mcmod`/`.zip` 模组包，直接通过启动器导入即可使用，由启动器内置的 Preloader（preloader-android）加载，使用独立的 `pl::` API，不需要也不能使用 LeviLamina（LeviLamina 模组是 Windows 的 `.dll`，不能在安卓上运行）。它们也不是 addon。网上流传的 apk 一般是已经内置了模组的改包游戏安装包，不是可单独导入的模组，而且改包 MC 无法通过启动器的 Google Play 正版验证；启动器的“导入 APK”只用于导入官方 Minecraft APK 作为额外版本。网盘里若混有其他安卓启动器的模组，需要找为 LeviLauncher 制作、且对应你游戏版本的 `.so`/`.levipack`，再用启动器导入。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## 安卓版 LeviLauncher（原 LeviLaunchroid）的 API 和 LeviLamina 有多大区别？能用 LeviLamina 的头文件开发吗？

完全不同，不能直接用 LeviLamina 的头文件。安卓版 LeviLauncher 不提供 LeviLamina 那样的游戏类头文件和游戏 API（事件、命令等）；安卓原生模组基于启动器内置的 Preloader SDK（LiteLDev/preloader-android），使用独立的 `pl::` API（生命周期、Hook、Signature 特征码查找、Patch、Config、Input、Mod Menu 等），游戏函数需自己通过特征码/符号定位后 hook。模组写法（`load`/`enable`/`disable`/`getSelf`，`getSelf` 返回 `ll::mod::NativeMod`）与 LeviLamina 模组形态相似。API 文档见 <https://levimc.org/zh-Hans/LeviLamina/developer_guides/android/api/mod/>，入门教程见 <https://levimc.org/zh-Hans/tutorials/develop/first-android-mod/>，源码见 <https://github.com/LiteLDev/LeviLauncher-Android>。

*适用版本：LeviLauncher-Android 当前版本（最新 v1.7.1）*

## 安卓版 LeviLauncher 如何加载渲染龙（RenderDragon）光影（如 Newb）？需要改包吗？启动器自带 MBL 吗？升级到 1.26.x 后材质变“滚木”/全白、开了光影没效果或闪退怎么办？

不需要改 APK。安卓版 LeviLauncher 不内置光影加载器，需要自己添加一个 MaterialBin 加载器 mod（`.so`）：

1. mtbinloader2（MBL2）：从 <https://github.com/mcbegamerxx954/mtbinloader2/releases> 下载最新版的 `libmtbinloader2_aarch64-linux-android.so`（目前为 v0.1.18，已适配 26.60），在启动器“模组”里导入；
2. 或在启动器的“外部模组”页面直接下载 MaterialBinLoader（`libmbl2.so`，适用于 MC >=1.26.45.1）。

然后通过资源包导入光影（也可以在启动器的 CurseForge 页面搜索 newb 等光影下载），并在游戏中启用。

注意：旧版加载器不兼容新版 MC，会导致材质变滚木、全白或闪退，务必使用最新版加载器并把启动器更新到最新。自 26.10 起 mtbinloader2 移除了自动修复（autofix），光影本身必须由作者适配对应 MC 版本；开了光影看不出效果通常是光影版本与游戏版本不匹配或加载器没启用，更新光影即可。Android 上不能用 BetterRenderDragon 加载光影（它是 PC 端的）。PC 版 LeviLauncher 已移除“渲染龙光影”设置，PC 端请使用 BetterRenderDragon。

*适用版本：LeviLauncher-Android v1.7.1；MC 1.26.x（含 26.60）*

## 安卓 LeviLauncher 如何在不改包的情况下加载 4D 皮肤？4DSkin mod 从哪里下载？

不需要改 APK。在启动器的“外部模组”页面直接下载 4DSkin（发布页 <https://github.com/QYCottage/4DSkin-Release>，以 `4DSkin.levipack` 形式提供），注意选择与当前 MC 版本兼容的版本；然后把 4D 皮肤做成皮肤包导入即可。

*适用版本：LeviLauncher-Android 当前版本*

## 安卓手机上的 Minecraft 自动更新了/想玩旧版本 MC，如何在 LeviLauncher 中使用旧版本？apk/apks 怎么装？

不需要卸载 Google Play 安装的 MC（启动器要求设备上装有 Play 商店版 MC）。在 LeviLauncher 中添加旧版本即可：

1. 在“下载”页面用已购买 Minecraft 的 Google 账号登录，从 Google Play 直接下载所需版本（可用“按版本号下载”指定版本代码，例如 1.21.80.3 的版本代码为 `972108003`；只能获取该账号仍可获取的构建）；
2. 或自行获取官方的 apk/apks 安装包，在“下载”页面点“导入APK”（支持 APK 和 APKS），不需要额外的安装器。

导入的版本需要在实例设置中开启“版本隔离”才能启动。导入失败或崩溃时先把 LeviLauncher 更新到最新版。注意启动器不支持早于 1.21.80 的版本。

*适用版本：LeviLauncher-Android v1.7.0 及以上（Google Play 下载）；导入 APK 适用于当前版本*

## levimap 小地图怎么调整样式、位置、大小？怎么打开大地图？

长按小地图进入设置菜单：可以设成圆形、拖动位置，`Zoom` 调显示缩放，`Size` 调小地图尺寸。新版 levimap 双击小地图展开大地图，也可以在菜单里点 `Big Map`。双击没有反应说明 mod 版本太旧，请到 Discord 下载最新版（启动器也要 1.5.4 及以上）。

*适用版本：安卓 LeviLauncher 1.5.4 及以上；第三方 mod levimap。未能从源码或文档中直接证实，仅供参考。*

## 新版安卓 LeviLauncher 的内置模组在哪里查看、开启？

进游戏后点悬浮按钮打开“模组菜单”，按“内置”筛选或看“内置功能”分组，里面就是内置模组（快速丢弃、快速切换视角、隐藏界面、自动疾跑、缩放、FPS/CPS 显示、陀螺仪、Pojav 控制等），按需开启即可。模组菜单可以在实例设置里开关（默认开启）。

*适用版本：安卓 LeviLauncher 新版（带模组菜单的版本，至最新 v1.7.1）*

## 安卓 LeviLauncher 有没有能在游戏内强制切换资源包的 mod？

有，第三方 mod BetterResourcePackManager 就是干这个的，可以在 qycottage 的 Discord 频道下载（已有 26.40 的版本）。

*适用版本：安卓 LeviLauncher；第三方 mod BetterResourcePackManager（已有 MC 26.40 版本）。未能从源码或文档中直接证实，仅供参考。*

## 安卓上 libBetterResourcePackManager 有什么替代？

BetterResourcePackManager 主要有三个功能：加载 RenderDragon 光影、局内切换资源包、加载 4D 皮肤。替代方案：4D 皮肤用 4Dskin mod（在 qycottage 的 Discord 获取），光影用 mtbinloader2；局内切换资源包没有替代。Windows 上加载光影用 BetterRenderDragon。注意：2026-08 时 BetterResourcePackManager 已有 26.40 版本，可以先去 qycottage 的 Discord 看看有没有适配你游戏版本的新版。

*适用版本：安卓 LeviLauncher；第三方 mod。未能从源码或文档中直接证实，仅供参考。*

## 安卓版 LeviLauncher 怎么导出结构？为什么找不到以前的结构？

在启动器的世界列表里，点世界的操作菜单 →“提取结构”。启动器只能找到存档里已经保存的结构：先通过这个启动器进入该世界，放一个结构方块并设为保存模式，命名后点保存，退出世界，再回来点“提取结构”，就可以单个导出或打包成 ZIP 导出。没有用结构方块保存进存档的结构是找不到的。

*适用版本：安卓 LeviLauncher 当前版本*

## 用 LeviLauncher 怎么实现红石显示/区块显示（红显区显）？加了光影包为什么不显示？

这类效果是材质（`material.bin`）类光影包，必须先装材质加载 mod 才会生效：安卓端加载 mtbinloader2（<https://github.com/mcbegamerxx954/mtbinloader2>），PC 端装 BetterRenderDragon（BRD，<https://github.com/QYCottage/BetterRenderDragon>），然后再添加红显区显的材质包。只加材质包、不装加载器是没有效果的。

*适用版本：LeviLauncher（安卓/PC）；第三方材质加载 mod。未能从源码或文档中直接证实，仅供参考。*

## 能否把其他第三方客户端（如 Flarial 安卓客户端）的功能放到 LeviLauncher 安卓端里使用？

可以尝试：从该客户端的安装包（APK）中提取出 arm64 的 `.so` 文件，再在 LeviLauncher 的“模组”页面导入（启动器支持导入 `.so`、含 `manifest.json` 与 `.so` 的 `.zip`、`.levipack`/`.mcmod` 模组包），即可作为原生模组加载。能否正常工作取决于第三方客户端本身：有用户反馈 Flarial 1.139.3 提取的 `.so` 可用，较新版本可能导入后闪退（新版带包名校验），联机时也可能闪退。此类第三方 `.so` 不受 LeviLauncher 官方支持，请只使用可信来源，并先在隔离版本中测试。

*适用版本：LeviLauncher-Android 当前版本（v1.7.1）；第三方客户端兼容性视其版本而定。未能从源码或文档中直接证实，仅供参考。*

## 用 LeviLauncher 安卓版启动游戏后帧率被锁在 60 帧，手机明明支持 120Hz，怎么办？

帧率上限与启动器无关，是游戏自身的设置：在游戏内“设置 → 视频”中调高帧率上限即可（部分机型还受系统/厂商的刷新率策略限制）。启动器内置的 FPS 显示模组只负责显示帧率，不会限制帧率。

*适用版本：当前所有版本（取决于 Minecraft 自身设置与设备）。未能从源码或文档中直接证实，仅供参考。*

## 新版 LeviLauncher 安卓端是否已经不能访问自身应用目录以外的文件？mod 配置文件放在 `/storage/emulated/0/games/` 下还能读到吗？

是的。自 v1.5.27 起安卓端重构了存储访问与权限，已不再申请“所有文件访问”（`MANAGE_EXTERNAL_STORAGE`）及 `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` 等存储权限（维护者表示这是为了上架 Google Play），除启动器自己的目录（`/storage/emulated/0/Android/media/org.levimc.launcher/`、`Android/data/org.levimc.launcher/` 及应用私有目录）外无法直接访问其他位置；导入文件改为通过系统文件选择器授权。原来把配置放在 `/storage/emulated/0/games/` 等公共目录的 mod 需要改为使用启动器可访问的目录（如对应实例的游戏数据目录）。

*适用版本：LeviLauncher-Android v1.5.27 及以上*

## 安卓 LeviLauncher 一定要开着模组菜单悬浮窗吗？关掉以后内置模组（切换视角、CPS 等）也不显示了？

是的。现在内置模组和使用启动器统一 UI 接口的 mod 都挂在模组菜单上（以前 mod 各自用 imgui 画界面），所以在实例设置里关掉「模组菜单」以后，内置模组的悬浮窗和 HUD 都不会再显示。不想让它挡画面，可以在模组菜单的常规设置里开「仅暂停菜单显示」（只在暂停界面显示），或者调整悬浮按钮的大小、透明度，以及锁定位置。

*适用版本：安卓 LeviLauncher 带模组菜单的版本（至最新 v1.7.1）*

## LeviLauncher Android 加了资源包，游戏里却看不到，怎么办？

通常是资源包放到了另一个存储位置。在启动器的内容管理（资源包页面）里用「选择存储」换一个位置再导入：原来是「外部」就换「内部」，原来是「内部」就换「外部」。如果这个实例开了版本隔离，要选「版本隔离（内部）」或「版本隔离（外部）」；都不行再试试开/关版本隔离。

*适用版本：安卓 LeviLauncher 当前版本*

## LeviLauncher 安卓端 1.6.1 起“后台持续运行”选项不见了吗？切后台后回来要重新加载怎么办？

v1.6.1 移除了启动器的前台服务（即原“后台持续运行”选项）。现在该功能由 BedrockTools 模组提供：把 BedrockTools 更新到 v1.5.11 或更高（旧的 1.5.9 在 26.60 上不行），并在 BedrockTools 中开启 No Disconnect，即可让 Minecraft 在后台保持运行，切回时不用重新加载。

*适用版本：LeviLauncher-Android v1.6.1 及以上（当前 v1.7.1）；BedrockTools v1.5.11+*

## LeviLauncher Android 用的是什么 mod 加载器？有没有安卓 mod 开发文档或模板，从哪里入手？

安卓版 LeviLauncher 没有 LeviLamina 那样的加载器，而是内置 Preloader SDK（<https://github.com/LiteLDev/preloader-android>），提供 `pl::` API：模组生命周期（`<pl/Mod.hpp>`、`PL_REGISTER_MOD`）、Hook、Signature、Patch、Config、Input、Mod Menu 等。官方 API 文档现已整合到 LeviLamina 文档的“Android Native Mods API”部分：<https://levimc.org/zh-Hans/LeviLamina/developer_guides/android/api/mod/>（Mod/Hook/Signature/Patch/Config/Input/Mod Menu 等各页）；入门教程：<https://levimc.org/zh-Hans/tutorials/develop/first-android-mod/>。模板使用 <https://github.com/QYCottage/levilauncher-android-mod-template>（Use this template 创建仓库，CMake+Ninja 构建出 `.levipack`，GitHub Actions 也可自动构建）；完整示例见 LiteLDev/LeviLauncher-Android 仓库中的 `examples/full-cpp-mod`。

*适用版本：LeviLauncher-Android 当前版本（最新 v1.7.1）*

## 用 LeviLauncher 安卓版启动游戏，玩一段时间后帧率被锁到 10 帧左右（原版启动没这个问题），是什么原因？

可能是启动器不在手机厂商的游戏/性能白名单里，系统对其限频锁帧（启动器侧暂时无法解决）。用户侧可尝试：清理后台、在系统游戏助手/性能模式中手动添加 LeviLauncher、更新游戏与启动器到最新版本、使用调度类工具缓解；低性能 SoC 本身也有影响。如仍复现，请附设备型号、Android 版本和启动日志到 GitHub Issues 反馈。

*适用版本：当前所有版本（取决于设备厂商系统策略）。未能从源码或文档中直接证实，仅供参考。*

## LeviLauncher 安卓版用“导入 APK”创建的实例，启动时长时间卡在 51%（清后台后更慢），导入世界存档也失败，怎么办？

导入 APK 的实例在性能较低的设备上可能出现启动缓慢的问题（首次启动需解压原生库等）。可以先更新到最新版启动器（v1.6.0/v1.6.1 做了大量性能和内容管理优化）；仍有问题时可尝试在实例设置中切换“版本隔离”后重试，或改用从 Google Play 正常安装的版本。注意官方文档说明导入版本通常需要启用版本隔离才能启动，如关闭后无法启动请重新开启。

*适用版本：LeviLauncher-Android，导入 APK 的实例。未能从源码或文档中直接证实，仅供参考。*

## 安卓版 LeviLauncher 导入资源包/模组非常慢，有什么办法？

包越大导入越慢，先更新到最新版（v1.6.1 优化了包导入速度）。嫌慢可以手动把包解压到启动器的数据目录：

- 未开启版本隔离时为 `/storage/emulated/0/Android/media/org.levimc.launcher/minecraft/_shared/external/games/com.mojang/resource_packs/`；
- 开启版本隔离的实例则在 `/storage/emulated/0/Android/media/org.levimc.launcher/minecraft/<实例目录>/external/games/com.mojang/resource_packs/`。

然后直接启动游戏。一般情况下用启动器内导入就够了（导入后文件夹名是随机的）。

*适用版本：LeviLauncher-Android 当前版本（使用新共享存储布局时）*

## 用安卓 LeviLauncher 玩 MC 一会卡一下，或 26.40 加载资源、进服务器生成世界异常慢，是什么原因？

常见原因：

1. 同时装了大量 mod、开了灵动视效、连锁等，负载过高，建议精简 mod、关闭灵动视效；游戏默认锁 60 帧，可用 BedrockTool 等 mod 解锁帧率。
2. 26.40 首发时部分第三方版本库提供的安装包有问题（APKS 与 APK 包体问题），导致加载/生成世界很慢；Google Play 正版没有该问题，换用正版安装包即可（v1.7.0 起可在启动器“下载”页直接从 Google Play 下载）。

*适用版本：LeviLauncher-Android；第 2 点针对 MC 26.40 首发期的第三方安装包。未能从源码或文档中直接证实，仅供参考。*

## 开发安卓原生 mod 时，一般用什么工具分析 `libminecraftpe.so`？

常用的逆向分析工具有 IDA Pro、Ghidra、Binary Ninja、radare2/Cutter、Reko 等。`libminecraftpe.so` 函数数量极多（数百万个），用 IDA 等工具打开分析会非常慢、占用大量内存，甚至可能卡死或崩溃。定位到目标函数后，Android 原生 mod 通常用特征码（signature）在运行时解析地址，例如 PreLoader 提供的 `pl::memory::resolveSignature("...", "libminecraftpe.so")`。

*适用版本：Android 原生 mod 开发（与启动器版本无关）。未能从源码或文档中直接证实，仅供参考。*

## 安卓 LeviLauncher 装了一个 300 多 MB 的 MC 安装包，占用却变成 700 多 MB，为什么？

导入的安装包，启动器会在该版本的目录里保存一份副本（`base.apk.levi`，分包也会保存为 `*.apk.levi`），运行前还要从里面解压原生库，所以占用差不多是安装包的两倍。这是正常现象。

*适用版本：安卓 LeviLauncher 导入/下载的版本*
