# 实例与游戏版本

LeviLauncher 把每一份 Minecraft 安装为一个**实例**：一个游戏版本，带有自己的名称、自己的设置，以及（如果你需要）自己的游戏数据。你可以同时保留多个实例，游戏版本相同或不同都可以，需要哪个就启动哪个。应用把它们列在 **实例列表** 页面。

## 实例是什么

=== "Windows"

    实例是启动器 `Instances` 文件夹中的一个文件夹（见[文件夹与文件](../reference/files)），实例的名称就是文件夹的名称。文件夹中包括：

    - 一个 Minecraft 构建的游戏文件，从它的安装包中解压而来；
    - `.levilauncher\instance.json`：启动器记录的实例信息，包括游戏版本、通道、是否使用自己的游戏数据，以及启动选项（控制台、编辑器模式、启动参数、环境变量）；
    - `mods\`：实例的模组；`.lip\`：内置包管理器所装软件包的状态（见[模组如何加载](./mod-loading)）；
    - 开启[隔离](./isolation)时，实例自己的游戏数据（世界、包、设置）。

    模组始终属于某一个实例。游戏数据只有在开启隔离时才属于某一个实例；否则实例使用这台电脑上 Minecraft 平常使用的游戏数据。

=== "Android"

    实例是你导入 LeviLauncher 的一个官方 Minecraft APK。它在启动器内运行，无需安装到系统中。设备上仍需安装 Google Play 上的 Minecraft（1.21.80 或更高版本）；LeviLauncher 会把它和你导入的版本列在一起。

    版本隔离让导入版本的世界、包和设置与已安装的 Google Play 版本分开。导入的版本通常需要开启隔离才能启动。

## 正式版与预览版

每个 Minecraft 构建都属于一个**通道**：

| 通道 | 说明 |
| --- | --- |
| Release（正式版） | 大多数玩家使用的稳定版游戏。 |
| Preview（预览版） | 即将推出的版本的测试构建，更容易出现世界、包或模组的兼容性问题。 |
| Beta | 只为 UWP 发布的测试构建。 <Badge platform="windows" /> |

在 Windows 上，正式版和预览版各有自己的游戏数据文件夹（`Minecraft Bedrock` 和 `Minecraft Bedrock Preview`），所以未开启隔离的预览版实例也不会与正式版实例共用世界。

## GDK 与 UWP 构建 <Badge platform="windows" />

Windows 版 Minecraft 先后以两种包格式发布，LeviLauncher 两种都能安装。同一版本两种格式都有时，选择 GDK。

| | GDK | UWP |
| --- | --- | --- |
| 安装包 | `.msixvc`，从 LeviLauncher 测速后选出的镜像下载 | `.appx` / `.msix`（或其捆绑包），从 Windows 更新下载 |
| 安装需要 | 已登录且拥有 Minecraft 的微软账号 | — |
| 运行需要 | Microsoft Gaming Services 与 Microsoft GameInput | Windows 开发者模式，用于向 Windows 注册包 |
| 共享游戏数据 | `%APPDATA%\Minecraft Bedrock`（预览版：`Minecraft Bedrock Preview`），在 `Users\` 下按玩家档案各一个文件夹 | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState`（预览版：`Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe`） |
| 隔离 | 所有版本 | 1.19.70.2 及更高的 x64 版本 |
| LeviLamina | 在其支持的版本上由 LeviLauncher 安装 | LeviLauncher 不安装 |
| 启动参数与环境变量 | 支持 | 不支持 |

导入的本地安装包（`.msixvc`、`.appx`、`.msix`、`.appxbundle` 或 `.msixbundle`）按扩展名作为 GDK 或 UWP 安装。

### 玩家档案 {#player-profiles}

GDK 实例按**玩家档案**保存世界、截图和服务器列表：玩家档案是 `Users\` 下以玩家 ID 命名的文件夹，启动器知道其玩家代号（gamertag）时会显示玩家代号。资源包和行为包由所有档案共用（`Users\Shared\`）；皮肤包从游戏 1.26 起共用，之前按档案保存。UWP 实例没有玩家档案。

## 向 Windows 注册 <Badge platform="windows" /> {#registration-with-windows}

Windows 每个通道只认一个已安装的 Minecraft。**注册**一个实例，就是让 Windows 把它当作这个 Minecraft：开始菜单、`minecraft://` 链接和 Xbox 功能随后都会使用它。注册会取代正式版或预览版位置的当前持有者（Microsoft Store 中的游戏或另一个实例），其数据保留。注册和取消注册都不会改动游戏数据。

UWP 实例在启动时自动注册。已注册的实例需要先取消注册，才能重命名或删除。

## 相关页面

- [版本管理](../guide/version-management)
- [实例隔离](./isolation)
- [文件夹与文件](../reference/files)
