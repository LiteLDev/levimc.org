# 实例隔离

Minecraft 在每台设备上把世界、包和设置保存在一个游戏数据文件夹里。**实例隔离**（应用中为 **实例设置** 里的 **启用实例隔离**，以及安装版本时的 **实例隔离**）让实例改用自己的游戏数据文件夹，放在实例内部。命令行把这两种方式称为 *own data*（自有数据）和 *shared data*（共享数据）。

## 共享数据与自有数据

=== "Windows"

    **未开启隔离**的实例使用这台电脑上 Minecraft 平常使用的游戏数据：与 Microsoft Store 中的游戏、以及同类的其他未隔离实例共用世界、包和设置。

    **开启隔离**的实例把游戏数据保存在自己的文件夹中。它的世界、资源包、行为包、皮肤包、截图、服务器列表和游戏设置与其他所有实例以及 Microsoft Store 中的游戏都分开。

    | 实例 | 共享数据（隔离关闭） | 自有数据（隔离开启） |
    | --- | --- | --- |
    | GDK，正式版 | `%APPDATA%\Minecraft Bedrock` | `<实例>\Minecraft Bedrock` |
    | GDK，预览版 | `%APPDATA%\Minecraft Bedrock Preview` | `<实例>\Minecraft Bedrock Preview` |
    | UWP，正式版 | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` | `<实例>\Minecraft Bedrock` |
    | UWP，预览版 | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe\LocalState` | `<实例>\Minecraft Bedrock Preview` |
    | UWP，Beta | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` | `<实例>\Minecraft Bedrock Beta` |

    `<实例>` 是该实例在 `Instances` 中的文件夹（见[文件夹与文件](../reference/files)）。在 GDK 的数据文件夹里，游戏把每个玩家的数据放在 `Users\` 下（见[玩家档案](./instances#player-profiles)）；在 UWP 的数据文件夹里，则放在 `games\com.mojang\` 下。

=== "Android"

    版本隔离让一个版本的游戏数据（世界、包和设置）与其他版本、以及从 Google Play 安装的 Minecraft 分开。为一个实例更改这个设置不会影响其他实例。导入的版本通常需要开启隔离才能启动。

## 工作原理 <Badge platform="windows" />

游戏本身并不知道实例的存在。LeviLauncher 安装实例时，会把自己的加载器 `LeviLauncher.dll` 放在游戏可执行文件旁边（见[模组如何加载](./mod-loading)）。开启隔离的游戏启动时，加载器把游戏查找数据的文件夹（应用数据文件夹和临时文件夹）重定向到实例的数据文件夹。不复制、也不链接任何东西：游戏直接在那里读写。

隔离不会改变的：

- **模组**始终按实例存放在实例的 `mods\` 文件夹中，与是否隔离无关。
- **微软账号**和启动器自身的设置对所有实例都相同。
- 向 Windows **注册**（见[实例与游戏版本](./instances#registration-with-windows)）与隔离无关。

## 限制 <Badge platform="windows" />

- GDK 实例的所有版本都支持隔离；UWP 实例从 1.19.70.2 起支持，且仅限 x64。
- 开启隔离不会复制任何东西：实例从空的游戏数据开始。想从现有数据开始，可以在安装版本时选择复制数据（从这台电脑上已安装的游戏，或从同类型的另一个隔离实例），也可以之后用 `LeviLauncher.exe instance copy-data` 复制（GDK）。
- 关闭隔离后，实例重新使用共享数据；它自己的数据文件夹仍留在实例文件夹中。
- 删除实例会删除它的文件夹，**包括它自有数据中的世界**。请先备份重要世界（见[世界工具](../guide/world-tools)）。
- 内容只能从一个实例复制到开启了隔离的实例，或复制到不使用同一个数据文件夹的 UWP 实例。

## 什么时候使用

隔离适合这些需求：

- 不同版本使用不同内容组合
- 更安全地测试模组或 Minecraft 预览版（Preview）
- 降低一个环境影响另一个环境的风险

一种好用的组合：一个隔离的正式版实例用于日常游玩，一个隔离的预览版实例仅在需要时使用，再加一个临时测试实例用于模组或排查问题。

## 相关页面

- [版本管理](../guide/version-management)
- [内容管理](../guide/content-management)
- [实例与游戏版本](./instances)
