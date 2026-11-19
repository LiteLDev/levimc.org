# 模组如何加载

Minecraft 基岩版本身不支持模组：模组是原生代码，由加载器在游戏启动时放进游戏进程。本页说明 LeviLauncher 使用哪些加载器、模组放在哪里，以及添加模组的几种方式之间的关系。

## 模组放在哪里 <Badge platform="windows" />

每个实例都有一个 `mods\` 文件夹（见[文件夹与文件](../reference/files)）。每个模组是其中的一个文件夹，带有描述该模组的 `manifest.json`：

| 字段 | 含义 |
| --- | --- |
| `name` | 模组名称。 |
| `entry` | 加载器加载的文件，相对于模组文件夹（一个 `.dll`）。 |
| `version` | 模组版本。 |
| `type` | 由哪个加载器加载：`preload-native` 由 LeviLauncher 的原生加载器加载；LeviLamina 的模组有它们自己的类型。 |
| `author` | 作者（可选）。 |

模组属于某一个实例，不受[隔离](./isolation)影响，隔离只涉及游戏数据。

**关闭模组**（在 **管理模组** 中，或用 `LeviLauncher.exe mod disable`）会把它的 `manifest.json` 改名为 `manifest.json.close`；重新开启时再改回来。模组的文件留在原处，查找 `manifest.json` 的加载器就不会再找到这个模组。

## 两个加载器 <Badge platform="windows" />

### LeviLauncher 的原生加载器

LeviLauncher 安装或准备实例时，会把自己的加载器 `LeviLauncher.dll` 放在游戏可执行文件旁边，并把它加入可执行文件的导入表，使 Windows 随游戏一起加载它。这适用于 x64 构建，GDK 和 UWP 都一样；[隔离](./isolation)也是靠它实现的。

游戏启动时，原生加载器按名称顺序遍历 `mods\` 中的文件夹，加载每个 `type` 为 `preload-native` 的模组的 `entry`。没有 `manifest.json` 的文件夹和其他类型的模组会被跳过。如果实例里有另一个预加载器（游戏旁边的 `preloader.dll`），原生加载器会把全部模组加载交给它。原生加载器需要 Visual C++ 运行库（x64），LeviLauncher 会检查并提供安装。

### LeviLamina

[LeviLamina](https://levimc.org/zh-Hans/LeviLamina/) 是 LeviMC 的模组加载器。[LeviMC 模组](https://levimc.org/zh-Hans/mods/)上的大多数模组都是 LeviLamina 模组：它们需要支持该实例游戏版本的 LeviLamina。LeviLauncher 在其支持的版本的 GDK 实例上安装 LeviLamina（安装版本时的 **安装 LeviLamina** 开关，或 **实例设置** 的 **加载器** 选项卡），作为内置包管理器的一个软件包。

## 添加模组的三种方式 <Badge platform="windows" />

| 你添加的是 | LeviLauncher 的做法 |
| --- | --- |
| **LeviMC 模组** 中的模组（或 `mod install owner/repo`） | 用内置的、与 [lip](https://github.com/LiteLDev/lip) 兼容的包管理器把它作为软件包安装：下载适用于本平台的发布版本，安装它依赖的软件包，并记录在实例的 `.lip\state.json` 中。模组需要 LeviLamina 而已安装的版本不合适（或尚未安装）时，会先安装一个兼容的 LeviLamina。这样安装的模组可以作为软件包更新和删除。 |
| `.mcmod` 模组包（或 `.zip`） | 解压到 `mods\` 下的一个新文件夹。压缩包中必须包含 `manifest.json`。 |
| 单个 `.dll` | 放进 `mods\` 下的一个新文件夹，并为它写一个 `manifest.json`：默认以文件名为名称，类型为 `preload-native`，版本为 `0.0.0`。 |

软件包在它的 `lip.toml` 和 `.lip\state.json` 中用 `side`（`client` 或 `server`）和 `platform`（例如 `win-x64`）记录它在哪里运行。对客户端，LeviLauncher 安装模组的 `client` 变体（如果有），否则安装其默认变体。详情（包括旧软件包如何迁移）见[模组与集成](../guide/mods-integrations)。

## Android <Badge platform="android" />

Android 版加载原生模组：在游戏进程中运行的 `.so` 库。请把装了模组的环境放在隔离的版本中，并只安装来源可信的模组。想自己制作，请参阅 LeviLamina 文档中的 [Android 原生模组](https://levimc.org/zh-Hans/LeviLamina/developer_guides/android/)。

## 相关页面

- [模组与集成](../guide/mods-integrations)
- [实例与游戏版本](./instances)
- [命令行](../reference/command-line)
