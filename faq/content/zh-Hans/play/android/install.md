# 安装 Android 版 LeviLauncher

## LeviLauncher 有安卓版吗？官网只看到 exe，安卓 APK 去哪里下载？问题反馈到哪里？

有。官网/文档里的 exe 是 Windows 版（仓库 `LiteLDev/LeviLauncher`）；安卓版是单独的仓库 `LiteLDev/LeviLauncher-Android`（原名 LeviLaunchroid，旧链接会自动跳转），APK 从 GitHub Releases 下载：<https://github.com/LiteLDev/LeviLauncher-Android/releases/latest>。两端共用一份文档：<https://levimc.org/LeviLauncher/?platform=android>（下载页选 Android 标签）。安卓版的问题请到 <https://github.com/LiteLDev/LeviLauncher-Android/issues> 提交，并附 Android 版本、设备型号和启动日志。使用要求：Android 9.0+ 的 ARM64 设备，并且设备上装有从 Google Play 安装的正版 Minecraft 基岩版 1.21.80 或更高版本。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## 安卓 LeviLauncher 选择版本列表为空 / 提示需要正版验证、找不到游戏版本，怎么回事？

安卓版 LeviLauncher 需要正版验证：必须在 Google Play 购买并从 Google Play 安装 Minecraft（1.21.80 或更高），微软商店等其他平台的购买不行；安装后最好先启动一次再打开启动器。破解版 MC、或从网盘下载的修改版启动器均不受支持，请从 <https://github.com/LiteLDev/LeviLauncher-Android/releases> 下载官方版本。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## LeviLauncher Android 中如何导入 .so 模组？

两种方式：

1. 在文件管理器里找到 `.so`（或 `.levipack` / `.mcmod` 模组包），用“打开方式”选择 LeviLauncher 即可导入；
2. 在启动器的“模组”页面点击“添加模组”，用文件选择器选择文件（也可以把文件放到手机 `Download` 文件夹后点“扫描”再添加）。

注意必须是为 Android（`arm64-v8a`）编译的原生模组，不能把 Windows 的 `.dll` 改后缀成 `.so`。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## LeviLauncher 安卓版能否通过系统“分享”导入 apk/apks 安装包？用第三方来源的 MC 时登录账号点“下一步”后直接返回启动器主页面，怎么办？

LeviLauncher 只支持 Google Play 商店安装的正版 Minecraft，会校验设备上 MC 的安装来源，非 Play 来源（破解/重签名包）会提示“需要 Play 商店版本”，或出现无法登录、点下一步后直接返回主页面等问题。apk/apks 不能通过系统分享导入，请在启动器“下载”页面点“导入APK”（支持 APK/APKS），或用已购买 MC 的 Google 账号登录后直接从 Google Play 下载。apks 是分包，自行合成单个 apk 会改变签名，不能当正版使用。设备上仍需安装从 Play 商店下载的正版 MC。

*适用版本：LeviLauncher-Android 当前版本（v1.7.x）*

## 安卓上从网盘/QQ 群/论坛/版本库等非官方渠道下载的 LeviLauncher 或 MC 安装包，启动黑屏、闪退（如生成 `tombstone_xxx_org.levimc.launcher...xcrash`）、或导入安装包失败，怎么办？

1. 启动器只从官方 GitHub Release 下载：<https://github.com/LiteLDev/LeviLauncher-Android/releases/latest>（下载 `LeviLauncher-vX.Y.Z-release.apk`；仓库曾名 LeviLaunchroid，旧链接会跳转，安装后应用名为 LeviLauncher，包名 `org.levimc.launcher`）。非官方渠道的启动器不保证可用，也不提供支持。
2. MC 必须是在 Google Play 购买的正版 Minecraft 基岩版（1.21.80 或更高、`arm64-v8a` 64 位），且设备上需安装 Google Play 版 Minecraft；论坛/版本库/网盘的安装包、破解或去验证版出现的问题官方不提供支持。Google Play 版需单独购买，其他平台的购买不通用。
3. v1.7.0 起可以在启动器“下载”页登录拥有该游戏的 Google 账号，直接从 Google Play 下载 Minecraft，无需自己找安装包。
4. 导入的版本通常需要在实例设置中启用“版本隔离”才能启动。

*适用版本：LeviLauncher-Android 当前版本（v1.7.x）；Google Play 下载功能需 v1.7.0+*

## LeviLauncher 安卓版在启动器内更新失败，或提示“签名不一致”无法安装，怎么办？

启动器内更新是通过 GitHub API 获取最新 Release 并下载 APK 后交给系统安装，因此网络无法访问 GitHub 时会失败，此时可自行到 GitHub Release（<https://github.com/LiteLDev/LeviLauncher-Android/releases/latest>）或可用的镜像下载新版 APK 手动覆盖安装。若提示“签名不一致”，说明当前安装的不是官方构建（例如被他人改包后重新签名），系统不允许用官方签名的 APK 覆盖；需先备份数据（导出世界等），卸载后再安装官方 Release 的 APK。

*适用版本：LeviLauncher-Android 当前所有版本*

## LeviLauncher 安卓版更新时，旧数据（包括游戏内数据）会保留吗？

会。不卸载、直接覆盖安装新版本（或使用启动器内更新）即可保留数据；前提是新旧版本都是官方签名的构建（否则会提示签名不一致，只能卸载重装，卸载会清除启动器数据）。重要世界建议先在应用存储之外另行备份（可用启动器的导出功能）。

*适用版本：LeviLauncher-Android 当前所有版本*

## 安卓版 LeviLauncher 去哪里下载 .so 客户端模组？

优先在启动器内下载：主页有“LeviMC 模组”（来自 levimc.org 模组目录，只列出有 Android arm64 客户端构建的模组，前提是作者已上传到该平台）和“外部模组 / External Mods”（社区维护的 LeviModHub 目录，下载走 GitHub 代理，默认 `gh-proxy.org`）。启动器里没有的模组，可以通过“外部模组”页面中的 Discord 按钮进入社区 Discord，在插件分区获取；部分模组也以 mcpack 形式发布在 CurseForge 上（包内含 `.so`）。只安装可信来源的模组，并注意选择 arm64 版本且与 MC 版本对应。

*适用版本：LeviLauncher-Android v1.7.0 及以上（内置模组目录）*

## 安卓 LeviLauncher 导入模组包后没有模组功能、下载页也看不到可下载的版本，以前可以用现在不行，怎么回事？

先到 <https://github.com/LiteLDev/LeviLauncher-Android/releases> 更新到最新版启动器（原仓库名 LeviLaunchroid 已改为 LeviLauncher-Android）。根本原因是启动器只支持正版 Minecraft：系统中必须有从 Google Play 安装的官方 Minecraft（`com.mojang.minecraftpe`），否则启动会被拒绝；v1.7.0 起的“下载”页面通过登录拥有 Minecraft 的 Google 账号直接从 Google Play 下载，未登录或账号未购买时列表为空（页面会说明原因）。以前能用通常是因为用的是非正版。不要使用来路不明渠道的启动器或游戏。

*适用版本：LeviLauncher-Android v1.7.0 及以上（下载页说明）；正版校验适用于当前所有版本*

## 安卓版 LeviLauncher 能不能把桌面上安装的 Minecraft 删掉，只保留在启动器里？删了之后启动失败怎么办？

不行。启动器要求系统中始终安装一份从 Google Play 安装的正版 Minecraft（包名 `com.mojang.minecraftpe`，1.21.80 或更高），启动时会校验其安装来源。导入的其他版本 APK 可以在启动器内运行而无需逐个安装到系统，但不能替代这份系统安装。如果改过包名做共存导致异常，删掉当前的 Minecraft，从 Google Play 重新安装正常包名的版本，再从启动器启动；之后可在启动器中导入其他版本的安装包，删除版本在实例的设置中操作。

*适用版本：LeviLauncher-Android 当前所有版本（v1.7.1）*
