# 给服务器安装模组

学完这篇教程，你的服务器会运行两个模组：让服务器跑得更快的 LeviOptimize，以及运行脚本插件的 LegacyScriptEngine。你会在 LeviMC 模组目录里找模组，用 `lip`（界面或命令）安装它们，确认 LeviLamina 加载了它们，并学会更新和移除模组。

## 你需要准备

- 一个用 `lip` 装好的、带 LeviLamina 的服务器：见[开你的第一个服务器](first-server.md)或[用命令行开服](command-line.md)。本教程使用文件夹 `D:\servers\survival`。
- 服务器处于**停止**状态。服务器运行期间，`lip` 的界面不会改动它的文件夹；而且运行中的服务器反正要到下次启动才会加载新模组。
- 网络连接。模组来自 GitHub。

在 Docker 里运行的服务器改用变量 `PACKAGES` 安装模组：见[在 Docker 中运行服务器](docker.md#_3-添加模组)。模组的名字是一样的。

## 1. 在目录里找模组

1. 打开 [LeviMC 模组](https://levimc.org/zh-Hans/mods/)，搜索 `LeviOptimize`。
2. 打开它的页面。看**运行端**：给服务器用的模组必须包含服务端。再看游戏版本：其中必须有你的服务器的版本。
3. 点**安装**。对话框里可以选择**变体**和**版本**，并在“在服务端目录中用 lip 运行：”下面给出命令，例如：

   ```shell
   lip install github.com/LiteLDev/LeviOptimize@1.8.1
   ```

   去掉末尾的 `@<版本>`，`lip` 会自己选出与你的服务器相配的最新版本。

安装并不需要打开网站：`lip` 的「获取模组」页面显示的就是同一个目录。下面两种方式任选其一。

## 2. 安装模组

### 在界面里安装

1. 在服务器的文件夹里启动 `lip`（`cd D:\servers\survival`，然后 `lip`）。在「主页」上选中**安装模组**，按 `Enter`，打开「获取模组」页面。
2. 按 `↑` 直到进入**搜索**，输入 `optim`，按 `Enter`。LeviOptimize 已被选中。
3. 按 `Enter`，再在**安装…**上按一次 `Enter`。
4. `lip` 只列出与你的游戏和 LeviLamina 相配的版本。保持选中最新版本，按 `Enter`。
5. `lip` 给出计划，例如 `Dry run: would install LeviOptimize 1.8.1`。如果这个模组还需要别的模组，它们也会列出来。在**应用**上按 `Enter`。
6. 你应该看到 **✓ 完成。**，回到列表后，LeviOptimize 前面多了一个 **✓**。

![安装之后的获取模组页面：LeviOptimize 这一行以对勾开头。](https://levimc.org/lip/screenshots/zh-Hans/first-server-19-mod-installed.svg)

### 用命令安装

在服务器的文件夹里运行：

```shell
lip install LeviOptimize
```

`LeviOptimize` 这样的短名字表示 `github.com/LiteLDev/LeviOptimize`；其他作者的模组要用它页面上的完整地址。`lip` 会把模组和它依赖的一切装进 `mods/`。你应该看到：

```text
✓ Packages installed successfully.
```

现在 `lip list` 会在 **User-Requested** 下列出 `github.com/LiteLDev/LeviOptimize`。

## 3. 安装 LegacyScriptEngine

LegacyScriptEngine（LSE）运行用脚本语言写的插件。它有四个**变体**，每种语言一个；按你的插件所用的语言安装：

| 变体 | 语言 |
| --- | --- |
| `#lua` | Lua |
| `#quickjs` | JavaScript（QuickJS） |
| `#nodejs` | JavaScript（Node.js） |
| `#python` | Python |

1. 安装一个变体，例如 Lua：

   ::: code-group

   ```shell [命令]
   lip install LegacyScriptEngine#lua
   ```

   ```text [界面]
   获取模组 → 搜索 "LegacyScriptEngine" → Enter → 安装…
   → 用 ← 和 → 选择变体 → Enter → 应用
   ```

   :::

   ![LegacyScriptEngine 的版本。变体标签页是 lua、quickjs、nodejs 和 python。](https://levimc.org/lip/screenshots/zh-Hans/get-mods-05-versions.svg)

   `lip` 还会装上 LSE 需要的 LegacyRemoteCall、LegacyMoney 和 iListenAttentively。

2. 需要多个引擎的话，用同样的方式逐个安装变体。

::: warning Python 引擎需要 Python
安装 `#python` 之前，先在服务器所在的机器上安装 Python：LSE 0.16.2 及以后的版本需要 Python 3.12.10。
:::

插件放在服务器的 `plugins/` 文件夹里。下次启动时，LSE 会迁移它们，并为每个插件生成 LeviLamina 模组清单；再重启一次服务器，插件就会被加载。

## 4. 确认模组已加载

1. 启动服务器：在「主页」上选**启动服务器**，或者运行 `lip run`。
2. 在输出里找带 `[LeviLamina]` 的几行。你应该看到每个模组一行 `Loaded`，例如 `Loaded LeviOptimize v1.8.1`，还有一行数量，例如 `5 mod(s) loaded`（依赖也算模组）。
3. 按 `Ctrl+C` 停止服务器。

如果某个模组不在其中，输出里会说明原因。126、127 等错误码的含义见 [LeviLamina 问题排除](https://levimc.org/zh-Hans/LeviLamina/user_guides/troubleshooting/)。

## 5. 更新和移除模组

先停止服务器，然后：

| 要做的事 | 命令 | 在界面里 |
| --- | --- | --- |
| 更新你装的所有模组 | `lip update` | 「模组」页面：操作行**全部更新** |
| 更新一个模组 | `lip update LeviOptimize` | 「模组」页面：在模组上按 `Enter`，选**更新** |
| 移除一个模组 | `lip uninstall LeviOptimize` | 「模组」页面：在模组上按 `Enter`，选**卸载** |
| 看看命令会做什么 | 加上 `--dry-run` | 每次改动都会先给出计划 |

不再被需要的依赖，`lip` 会自动移除。`lip update` 从不改动游戏和 LeviLamina；要把服务器换到新的游戏版本，见[工作区](https://levimc.org/zh-Hans/lip/interface/workspaces.html)或 [`lip setup`](https://levimc.org/zh-Hans/lip/reference/commands/setup.html)。

## 你现在有了什么

- 一个装有 LeviOptimize 和 LegacyScriptEngine 的服务器，它们需要的依赖都在 `mods/` 里。
- 一套找模组、确认是否相配、安装、更新和移除模组的方法。

## 下一步

- 为刚装好的引擎写一个插件：[你的第一个脚本插件](../develop/first-script-plugin.md)。
- 让其他玩家连进来：[让朋友连上你的服务器](let-friends-join.md)。
- 修改模组的设置：[模组配置](https://levimc.org/zh-Hans/lip/interface/mod_config.html)。
- 在 `lip` 里搜索、排序和筛选目录：[获取模组](https://levimc.org/zh-Hans/lip/interface/get_mods.html)。管理已安装的模组：[模组](https://levimc.org/zh-Hans/lip/interface/mods.html)。
- 指定包的各种写法（版本、分支、ZIP 文件、文件夹）：[管理包](https://levimc.org/zh-Hans/lip/guides/managing_packages.html)。
- 脚本引擎和它们支持的语言：[LegacyScriptEngine](https://levimc.org/zh-Hans/LegacyScriptEngine/)。
- 给游戏客户端而不是服务器装模组：[在 Windows 上玩模组](../play/play-with-mods.md)。
