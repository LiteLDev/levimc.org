# Android 版 LeviLauncher 的报错与崩溃

## 安卓 LeviLauncher 提示未安装/找不到 Minecraft（或换成改包 APK 后找不到主程序），怎么解决？

启动器只是加载手机上已安装的官方 Minecraft（包名 `com.mojang.minecraftpe`），出现“未安装 Minecraft…请先从 Google Play 商店安装”或“非正版MC”提示时：

1. 确认已从 Google Play 安装或更新官方 Minecraft 到 1.21.80 或更高版本，然后重新打开 LeviLauncher；
2. 不要用注入了光影/MBL2 等的改包 APK 替换本体，改包或非 Google Play 来源安装的 MC 无法通过验证，应卸载后从 Google Play 重新安装原版并启动一次，同时把启动器更新到最新版；需要的功能用启动器导入原生模组（`.so` / `.levipack`）实现即可，不需要改包；
3. 若确实装的是 Google Play 正版仍检测不到，可检查系统是否限制了 LeviLauncher 读取已安装应用列表（部分国产 ROM 有“获取应用列表”类权限开关），开启后重试。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## Flarial 客户端从 Google Play 下架又上架后，把它的 .so 导入 LeviLauncher 安卓版，启用某些模块就闪退，为什么？

新版 Flarial 带有包名校验，在 LeviLauncher 中运行时会触发校验导致闪退，需要修改/去掉包名校验才行（或使用旧版 Flarial 提取的 `.so`）。这属于第三方客户端行为，LeviLauncher 官方不提供支持。

*适用版本：Flarial 重新上架后的版本；LeviLauncher-Android 当前版本。未能从源码或文档中直接证实，仅供参考。*

## 安卓 LeviLauncher 中使用 BedrockTools mod 后，放置或打开潜影盒、铁砧、工作台、箱子等带 UI 的功能方块时闪退怎么办？

原因是该 mod 的签名不匹配（MC 26.50 时出现），mod 作者已发布修复版本，更新 BedrockTools 即可。修复前的临时办法：把触控方式改为“摇杆 + 准星”模式。

*适用版本：MC 26.50 时期的旧版 BedrockTools。未能从源码或文档中直接证实，仅供参考。*

## 安卓 LeviLauncher（原 LeviLaunchroid）下载游戏时进度卡住不动（如卡在 15%），怎么办？

一般是网络问题，挂代理后即可正常下载。另外请确认启动器是从官方 GitHub（<https://github.com/LiteLDev/LeviLauncher-Android/releases>）下载的最新版。注意 v1.7.0 起游戏下载改为通过 Google Play（需登录拥有 Minecraft 的 Google 账号），在无法直连 Google 的网络环境下必须使用代理；下载支持断点续传，中断后可点“重试”继续。

*适用版本：LeviLauncher-Android；v1.7.0 起下载来源为 Google Play。未能从源码或文档中直接证实，仅供参考。*

## 安卓版 LeviLauncher 游戏崩溃后，崩溃日志（tombstone xcrash 文件）在哪里？

在 `/storage/emulated/0/Android/media/org.levimc.launcher/crash_logs/` 目录下，文件名类似 `tombstone_xxx__org.levimc.launcher.native.xcrash`。可用 MT 管理器等文件管理器跳转到该路径取出，发给开发者或附在 <https://github.com/LiteLDev/LeviLauncher-Android/issues> 中排查（崩溃界面也提供分享功能）。若该目录不可写，启动器会退回到 `Android/data/org.levimc.launcher/files/crash_logs/`。

*适用版本：LeviLauncher-Android 当前版本（v1.7.1）*
