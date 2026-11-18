# Windows 版 LeviLauncher 的版本与兼容性

## LeviLauncher（Windows 版）支持 UWP 版 / 1.21.120 之前的旧版本 Minecraft 吗？能导入本地 appx 安装包吗？

支持。早期版本只支持 GDK 版（1.21.120+），但自 LeviLauncher v1.0.0（2026-09-13）起已加入 UWP 支持，当前版本是面向 GDK / UWP 的启动器：下载页的版本列表会同时列出 GDK 构建和 UWP（appx）构建，也可以导入本地的 `.msixvc` / `.appx` / `.msix` / `.appxbundle` / `.msixbundle` 安装包创建实例（命令行：`LeviLauncher.exe install <版本|文件>`）。

使用 UWP 实例需要开启 Windows 开发者模式并具备安装包清单要求的 UWP 框架依赖；UWP 实例启动时会自动注册到系统（占用该渠道的“已安装 Minecraft”位置）。UWP x64 的 1.19.70.2 及以上版本支持实例隔离，未隔离的 UWP 实例共享该渠道原有的 `LocalState` 数据，操作前请备份存档。

原生 DLL 模组加载器仅支持 x64 包；LeviLamina 自动安装仍只适用于受支持的 GDK 版本（LeviLamina 客户端本身只支持 Mojang 提供了相应数据的少数版本）。

*适用版本：LeviLauncher（Windows）1.0.0 及以上*

## LeviLauncher 能否和 Onix、Flarial、Latite、Oderso 等第三方注入客户端一起使用？为什么 Flarial 等识别不到用 LeviLauncher 启动的游戏？

一般不行。LeviLauncher 直接启动的游戏进程没有包标识（package identity），第三方客户端调用 WinRT 接口时会报 `WinRT throwing: 0x80073D54 : The process has no package identity`，因而识别不到。

可以在启动器里对该版本使用“注册到系统”（启动按钮旁的选项），注册后从系统入口启动，再让第三方客户端注入；Flarial 新版本专门做了兼容，可以尝试。有用户实测 Latite、Oderso、Onix 无法配合使用。第三方客户端的兼容性随其自身版本变化。

另外不要把 Onix 等客户端的 dll 当作 mod 放进 LeviLauncher 的 `mods` 目录，注入与运作方式不同，会导致崩溃；和 LeviLamina 客户端同时注入也容易冲突。

*未能从源码或文档中直接证实，仅供参考。*

## 已购买正版，但用 LeviLauncher 下载或启动预览版（Preview）时提示需要“解锁完整游戏”、变成试玩版，或微软商店只显示教育版，怎么办？

预览版需要账号单独拥有预览版授权。先在启动器的账号信息里（或 `LeviLauncher.exe account status --refresh`）确认 Preview 一栏是“owned”而不是“trial/not owned”；若不是，先通过微软商店（或 Xbox App）获取/下载一次 Minecraft 预览版。

预览版曾对中国大陆地区锁区（锁区为微软商店侧行为）：在 Windows 设置“时间和语言 -> 语言和地区”里把“国家或地区”改为中国大陆以外（如加拿大、美国），账号本身无需更换；正式版不需要换区。

另外一个微软账号最多在 10 台设备上登录商店，启动器会算作一台设备，超限时也会出现未授权，需要在 <https://account.microsoft.com/devices/content> 移除旧设备。

*适用版本：LeviLauncher（Windows）1.0.0 及以上。未能从源码或文档中直接证实，仅供参考。*

## LeviLauncher 中某个模组或安装 LeviLamina 的选项显示为灰色、不能点，是什么原因？

因为当前实例的游戏版本不在该模组或 LeviLamina 的支持范围内（界面会提示“该游戏版本不支持 LeviLamina”或“没有与该版本、该平台匹配的包”）。需要换成该模组/LeviLamina 支持的游戏版本（例如某些模组只支持 26.60）。

*适用版本：LeviLauncher 1.1.0*

## LeviLauncher 提示需要更新 Windows，但系统（如租用的云电脑）不允许更新，怎么办？

维护者建议升级启动器（当时为 v1.1.0-beta.5，现在请用最新正式版 v1.1.0 或更高）。

如果提示是安装 UWP 版本时出现的“当前 Windows 版本不满足此 UWP 包的最低要求”（`ERR_UWP_SYSTEM_VERSION`），则只能改选与系统兼容的游戏版本。

*适用版本：LeviLauncher 1.1.0-beta.5 及以上。未能从源码或文档中直接证实，仅供参考。*

## 使用 LeviLauncher 为新游戏版本（如 26.51.3）安装 LeviLamina 时提示“不支持的版本”，需要手动用 lip 安装吗？

通常是 LeviLamina 与游戏版本的对应表还没收录新版本。这张表由维护者在远程仓库 `LiteLDev/levilamina-client-version-db` 中维护，更新后无需升级启动器即可安装，等待维护者更新即可。急用时也可以自行用 lip 手动安装对应版本的 LeviLamina 作为临时方案。

*适用版本：LeviLauncher 1.1.0*

## 在 LeviLauncher 中加载光影包后界面变成“滚木”、文字消失甚至闪退，怎么办？

是否适配取决于光影本身。光影版本必须和游戏版本对应（例如 MC 26.50 要用适配 26.50 的光影）。可以在启动器首页的内容下载入口打开 CurseForge，搜索 `newb`，下载名称带有 26.50+（与游戏版本对应）的版本。

*未能从源码或文档中直接证实，仅供参考。*

## 用 LeviLauncher 加载 Glacie 客户端后进入服务器直接崩溃，LeviLauncher 能用 Glacie 吗？

LeviLauncher 可以加载 Glacie，但 Glacie 不是基于 LeviLamina 的 mod，而且当时只支持到 26.20（Glacie 支持的版本以其自身发布为准）。在加载了 LeviLamina 的实例里，再加载其他非 LeviLamina 的 dll mod 容易冲突崩溃，所以两者不要在同一实例中同时使用；需要用 Glacie 时，用不安装 LeviLamina 的实例，并选择 Glacie 支持的游戏版本。

*未能从源码或文档中直接证实，仅供参考。*

## 用启动器运行 UWP 旧版本基岩版（如 1.18.12）时正版验证失效，原因是什么？如何修复？

微软在 1.19.70 左右更换了 Xbox 认证公钥，旧版 UWP 的游戏程序里还是旧公钥，所以正版验证失败。LeviLauncher 从 v1.0.2 起会在安装旧版 UWP 时以及启动已有实例前，自动把旧公钥替换为新公钥（同时含新旧公钥的版本会保留不动），无需手动处理。用其他启动器或手动安装时，可以用 KeyPatcher 自行给游戏程序打补丁。

*适用版本：LeviLauncher v1.0.2 及以上（UWP 实例）*
