# LegacyScriptEngine

一个用于在 LeviLamina 上运行 LLSE 插件的插件引擎：用 JavaScript、Lua 或 Python 而不是 C++ 为 Minecraft 基岩版服务器编写插件。

## LegacyScriptEngine 是什么

LegacyScriptEngine（LSE）是一个 [LeviLamina](https://levimc.org/zh-Hans/LeviLamina/) 模组，用来运行以脚本语言而不是 C++
编写的插件。它延续了 LiteLoaderBDS 的脚本引擎（LLSE）：为 LLSE 编写的插件几乎无需修改即可在 LeviLamina 上运行，
新插件也使用同一套 API，本站即是它的文档。

LSE 可运行在基岩版专用服务器和 Windows 上的 Minecraft 客户端中。与其他 LeviLamina 模组一样，服务器上用
[lip](https://levimc.org/zh-Hans/lip/) 安装，客户端上用 [LeviLauncher](https://levimc.org/zh-Hans/LeviLauncher/) 安装：见
[给服务器安装模组](https://levimc.org/zh-Hans/tutorials/server/install-mods/)。

LSE 提供：

- **四种脚本引擎**：Lua、QuickJS、Node.js 和 Python，每种引擎都通过 lip 作为独立的包变体安装（见[语言支持](apis/LanguageSupport.md)）。
- **LLSE 插件照常运行**：把 LLSE 插件放进 `plugins/` 并启动服务器，插件会被自动迁移并获得 LeviLamina 模组清单
  （见[插件与引擎](concepts/plugins.md)）。
- **LLSE API**：事件、玩家、方块、物品、NBT、表单、文件、网络等（见 [API 参考](apis/README.md)）。

## 几行代码的插件

插件就是 `mods/`（或 `plugins/`，同一个文件夹）中的一个文件夹，里面有脚本和一个指明由哪个引擎运行它的 `manifest.json`。
下面这个 JavaScript 插件会问候每个加入的玩家，并添加一个控制台命令：

```json
{
    "entry": "main.js",
    "name": "MyPlugin",
    "type": "lse-quickjs",
    "dependencies": [
        {
            "name": "legacy-script-engine-quickjs"
        }
    ]
}
```

```js
log("MyPlugin is running!");

mc.regConsoleCmd("greet", "Greets someone from the console", (args) => {
    log(`Hello, ${args[0] ?? "world"}!`);
});

mc.listen("onJoin", (player) => {
    player.tell(`Welcome, ${player.name}!`);
});
```

启动服务器，控制台会显示 `MyPlugin is running!`；输入 `greet Steve`，它会回答 `Hello, Steve!`。
[写你的第一个脚本插件](https://levimc.org/zh-Hans/tutorials/develop/first-script-plugin/)一步步写出这个插件，从安装引擎到在游戏中看到效果。

## 引擎

每种语言都有自己的引擎，作为 `LegacyScriptEngine` 包的一个变体安装。所有引擎共用一套 API，因此 API 参考适用于每种语言
（差异见[语言支持](apis/LanguageSupport.md)）。

| 变体 | 语言 | 引擎 |
|---|---|---|
| `#lua` | Lua | CLua |
| `#quickjs` | JavaScript | QuickJS，支持 ES 模块 |
| `#nodejs` | JavaScript | Node.js，支持 npm 包 |
| `#python` | Python | CPython，支持 pip 包 |

Python 引擎需要在运行它的机器上安装 Python：

| LSE 版本 | Python 版本 |
|---|---|
| >=0.16.2 | 3.12.10 |
| >=0.9.0 <0.16.2 | 3.12.8 |
| <0.9.0 | 3.10.11 |

在客户端上，0.23.1 及更早的版本把变体命名为 `#client_lua`、`#client_quickjs`、`#client_nodejs` 和 `#client_python`；
LeviLauncher 会为你选用正确的版本。

## 从这里开始

- [给服务器安装模组](https://levimc.org/zh-Hans/tutorials/server/install-mods/)：用 lip 在 LeviLamina 服务器上安装
  LegacyScriptEngine（以及其他模组）。
- [写你的第一个脚本插件](https://levimc.org/zh-Hans/tutorials/develop/first-script-plugin/)：编写一个插件，加载它并看到它运行。

已经有 LLSE 插件？把它们放进 `plugins/` 并启动服务器：插件会被自动迁移，并生成 LeviLamina 模组清单
（`manifest.json`）。重启服务器后，插件就会被加载。

## 本站内容

- **指南**：在插件中完成一件事的步骤：[监听事件](guides/events.md)、[注册命令](guides/commands.md)、
  [显示表单](guides/forms.md)、[存储数据](guides/storing_data.md)，以及[日志与定时任务](guides/logging_and_timers.md)。
- **概念**：[插件与引擎](concepts/plugins.md)（清单、加载、迁移）、[语言支持](apis/LanguageSupport.md)（各引擎的差异）和
  [API 的工作方式](concepts/script_api.md)（全局对象、对象、回调）。
- **参考**：LSE 的[所有 API](apis/README.md)：事件、玩家、方块、物品、NBT、表单、文件、网络等。编辑器提示和项目脚手架见
  [legacy-script-engine-api](https://github.com/LiteLDev/legacy-script-engine-api)。
- **问答**：[LegacyScriptEngine 问答](https://levimc.org/zh-Hans/faq/scripts/lse/basics/)，与 LeviMC 其他项目的问答在一起。

LegacyScriptEngine 是开源项目：参见它的[仓库](https://github.com/LiteLDev/LegacyScriptEngine)和
[如何参与贡献](https://github.com/LiteLDev/LegacyScriptEngine/blob/develop/CONTRIBUTING.md)（issue、翻译、PR）。

## 许可

GPL-3.0-or-later © LeviMC
