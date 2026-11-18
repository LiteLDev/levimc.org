# Android 版 LeviLauncher 的版本与兼容性

## 鸿蒙系统能用 LeviLauncher 安卓版吗？没有 GMS/Google Play 时启动器识别不到 MC 有办法吗？

LeviLauncher 安卓版要求设备上的 Minecraft 是由 Google Play 商店安装的（启动器会检查 MC 的安装来源是否为 `com.android.vending`），因此设备需要能运行 Google Play 商店并从中安装正版 MC。能兼容安卓应用且可使用 Google Play 的鸿蒙设备有用户反馈可用（如鸿蒙 6）；如果设备无法使用 GMS/Google Play，MC 无法以 Google Play 来源安装，就无法通过启动器的正版验证，目前没有官方解决方案。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）；具体鸿蒙版本兼容性依赖设备环境。未能从源码或文档中直接证实，仅供参考。*

## 为什么 Windows 版的 .dll mod（LeviLamina 模组）无法导入安卓版 LeviLauncher？

`.dll` 是 Windows 平台的 mod（由 PC 上的 LeviLamina / Windows 版 LeviLauncher 使用），与安卓不通用。安卓版 LeviLauncher 只接受为 Android 编译的原生模组：`.so` 文件，或 `.levipack` / `.mcmod` / `.zip` 模组包，由内置的 Preloader（`preloader-android`）加载，而不是由 LeviLamina 加载。要用 `.dll` mod 需在电脑上使用 PC 版 LeviLauncher + LeviLamina；在安卓上需要使用专门的 Android 版 mod。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## 安卓 LeviLauncher 上 MC 1.26.60.x 能进游戏但加载不了光影，是什么原因？

按顺序排查：MC 版本；是否安装了最新版渲染龙加载器（mtbinloader2，或启动器“外部模组”里的 MaterialBinLoader）；光影包版本是否与 MC 版本匹配；MC 安装包是否来自官方正版渠道。常见原因是游戏版本与光影/加载器不兼容，或使用了非官方渠道的安装包。建议在启动器的“下载”页面用已购买 Minecraft 的 Google 账号登录，直接从 Google Play 下载对应版本，再加载适配该版本的光影。

*适用版本：LeviLauncher-Android v1.7.0 及以上（Google Play 下载功能），MC 26.60*

## LeviLauncher 安卓端装了旧的 libfusembl2.so 光影加载模组后游戏（26.5x）启动不了，该用什么替代？

不要再用旧的 `libfusembl2.so`，改用最新版 mtbinloader2：<https://github.com/mcbegamerxx954/mtbinloader2/releases>（26.51 推荐 0.1.17，目前最新 v0.1.18 已适配 26.60），或在启动器“外部模组”页面直接下载 MaterialBinLoader（`libmbl2.so`）。其他模组可在启动器的外部模组页面或 LeviLauncher 的 Discord 获取。

*适用版本：LeviLauncher-Android 当前版本，MC 26.5x~26.60*

## LeviLauncher 安卓版能否运行旧版 MC，例如 1.18.203？

不能。安卓版 LeviLauncher 支持的最低 MC 版本为 1.21.80，更早的版本启动时会提示“此启动器不支持早于 1.21.80 的 Minecraft 版本”，Google Play 下载列表中也不会显示更早的版本。

*适用版本：LeviLauncher-Android 当前版本（v1.7.1）*

## 安卓版 LeviLauncher 导入某个 MC 版本（如 26.10）后崩溃，或提示要求 64 位，是什么原因？

LeviLauncher 安卓版只支持 ARM64（`arm64-v8a` / armv8，64 位）设备和 64 位的 Minecraft。导入 armv7（32 位）的安装包无法使用，需要换成 64 位安装包；建议使用 Google Play 正版（v1.7.0 起也可在启动器内登录 Google 账号直接下载）。另外导入的版本通常需要启用版本隔离才能启动。

*适用版本：LeviLauncher-Android 当前所有版本*

## 安卓 LeviLauncher 下载 Minecraft 安装包或模组时有 aarch64 / armv7 / x86 等多个架构版本，应该选哪个？

选 arm64（`aarch64` / armv8 / `arm64-v8a`）。LeviLauncher 安卓版本身只构建 `arm64-v8a`，也只支持 ARM64 设备上的 64 位 Minecraft，其他架构的 MC 安装包无法启动；`.so` 模组同样要选 arm64 版本，并且模组版本要与所用 MC 版本对应。启动器内置的模组目录按 `android-arm64` 平台筛选，可直接安装。

*适用版本：LeviLauncher-Android 当前所有版本*

## 安卓 LeviLauncher 把 Minecraft 升级到新版本（例如 26.40）后启动崩溃（`tombstone ... org.levimc.launcher...xcrash`），或原来的 .so 模组（小地图、光影/渲染类、mtbinloader 等）不能用了，为什么？怎么办？

原生 `.so` 模组依赖游戏内函数的特征码（signature）/符号，MC 大版本更新后这些通常会变化，模组需要作者重新适配，未适配前加载就可能失效或直接导致崩溃。少数模组用到的符号没有变化，所以仍能使用。处理方法：先在启动器中禁用最近加入或尚未适配新版本的模组，确认无模组时能正常启动，再逐个启用排查；等待模组作者发布对应新版本后再使用。如需继续使用旧模组，可保留一个旧版本 MC 的隔离实例。

*适用版本：LeviLauncher-Android 当前所有版本；任何 MC 版本更新后均适用*

## 安卓小地图 mod levimap 对游戏和启动器版本有什么要求？在哪下载？有 PC 版吗？开源吗？

levimap 需要 MC 26.30 及以上，安卓 LeviLauncher 也必须是 1.5.4 及以上（启动器太旧会出现无法输入等问题）。不支持 26.10/26.20，目前没有适配低版本的计划。下载地址在 LeviLauncher Discord 服务器的 levimap 子频道（下载链接带广告，能给作者带来收益，请不要直接转发文件）。只有安卓版，没有 PC 版，不开源。

*适用版本：MC 26.30+；安卓 LeviLauncher 1.5.4+。未能从源码或文档中直接证实，仅供参考。*

## GitHub 上的 Stipuleroo 等 mod 在安卓 LeviLauncher 中导入失败，为什么？

这些是 Windows 版 LeviLamina 客户端 mod（文件名注明 Windows，内容为 `.dll`），安卓不适配，无法在安卓启动器使用。安卓版只能导入 arm64 原生模组：`.so` 文件、含 `manifest.json` 与 `.so` 的 `.zip`，或 `.levipack`/`.mcmod` 模组包。

*适用版本：LeviLauncher-Android 当前所有版本*

## MC 26.30 和 26.33 只是小版本差别，为 26.30 做的 mod 一定能在 26.33 上用吗？能互相联机吗？

小版本（如 26.30 与 26.33）之间网络协议通常相同，一般可以互相联机；但协议相同不代表 mod 兼容：mod 依赖的 hook 点/符号在小版本间可能变化，能否使用要看该 mod 作者是否适配了对应版本（例如有的 mod 只声明支持 26.30）。安装前请查看 mod 标注的支持游戏版本。

*适用版本：LeviLauncher-Android 上运行的原生 mod，当前所有版本（具体兼容性取决于各 mod）。未能从源码或文档中直接证实，仅供参考。*

## MC 基岩版 1.26.40.22 在安卓上对系统版本有什么要求？

从 1.26.40.22（26.40 系列测试版）起，Minecraft 基岩版安卓端最低要求 Android 12，更低版本的安卓系统无法运行该版本及之后的游戏版本（这是游戏本身的要求，与启动器无关）。

*适用版本：Minecraft 基岩版 26.40（1.26.40.22）及以后版本。未能从源码或文档中直接证实，仅供参考。*
