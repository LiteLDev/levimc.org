# 插件与引擎

本页说明脚本插件对 LeviLamina 和 LSE 来说是什么：它放在哪里，它的清单如何选定运行它的引擎，加载和卸载时会发生什么，
以及为 LLSE 编写的插件如何变成 LeviLamina 插件。

## 插件就是模组

LeviLamina 从服务器的 `mods` 文件夹加载模组。每个模组都是一个带有 `manifest.json` 的文件夹。C++ 模组的类型为
`native`；脚本插件的类型是运行它的引擎的类型：

| `manifest.json` 中的 `type` | 引擎 | 引擎模组 |
|---|---|---|
| `lse-quickjs` | JavaScript（QuickJS） | `legacy-script-engine-quickjs` |
| `lse-lua` | Lua | `legacy-script-engine-lua` |
| `lse-nodejs` | JavaScript（Node.js） | `legacy-script-engine-nodejs` |
| `lse-python` | Python | `legacy-script-engine-python` |

每个引擎本身都是一个 LeviLamina 模组，由 `LegacyScriptEngine` 包的一个变体安装（`#quickjs`、`#lua`、`#nodejs`、
`#python`；见[语言支持](../apis/LanguageSupport.md)）。引擎加载时会向 LeviLamina 注册为其插件类型的管理器，
LeviLamina 会把该类型的每个模组交给它。

一个最小的 QuickJS 插件：

```
mods/
    MyPlugin/
        manifest.json
        main.js
```

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

- `entry` 是引擎要运行的脚本，相对于插件的文件夹。
- `name` 是插件的名称，请与文件夹名保持一致。
- `type` 指定由哪个引擎运行它。
- `dependencies` 列出必须先加载的模组。在这里写上引擎，它就会在插件之前加载。依赖其他插件的插件也要写上那个插件：
  被依赖的插件先加载，因此它的事件监听器也先注册、先被调用。

[写你的第一个脚本插件](https://levimc.org/zh-Hans/tutorials/develop/first-script-plugin/)一步步搭建了这个结构。
Node.js 插件还有一个 `package.json`，Python 插件还有一个 `pyproject.toml`；见[语言支持](../apis/LanguageSupport.md)。

### `plugins` 与 `mods`

每个引擎加载时，都会把服务器文件夹中的 `plugins` 做成指向 `mods` 的链接（在 Windows 上是目录联接），因此
`plugins/MyPlugin` 和 `mods/MyPlugin` 是同一个文件夹。如果 `plugins` 已经存在且与 `mods` 不是同一个文件夹，LSE
会记录一条错误，并保持它不变。

## 每个插件一个引擎实例

每个插件都运行在自己的脚本引擎实例中，实例以插件命名。LSE 加载插件时会：

1. 对 Node.js，如果插件的 `package.json` 有依赖且还没有 `node_modules` 文件夹，就在插件文件夹中运行
   `npm install --omit=dev`；对 Python，如果插件的 `site-packages` 文件夹还不存在且插件列出了依赖，就运行
   `pip install` 把依赖安装到其中；
2. 创建一个新的引擎实例，以及一个以插件命名的日志记录器；
3. 绑定 API（`mc`、`ll`、`log` 等，见 [API 的工作方式](script_api.md)）；
4. 运行引擎的基础库（QuickJS、Lua 和 Python）；
5. 运行入口脚本。

由于每个插件都有自己的实例，插件之间不共享全局变量。要调用另一个插件的函数，用 `ll.exports` 导出、用 `ll.imports`
导入（见 [ll API](../apis/ScriptAPI/Ll.md)）。

如果入口脚本抛出错误，插件就不会被加载：控制台会显示错误及其调用栈，脚本在出错之前注册的事件监听器、定时任务和导出函数都会被移除。

### 在服务器运行时加载

插件可以在服务器启动之后加载，例如用 LeviLamina 的 `ll reload <插件名>`。此时会立即调用它的 `onServerStarted`
监听器，并为每个在线玩家各调用一次 `onPreJoin` 和 `onJoin` 监听器，因此在这些事件中做初始化的插件和启动时加载的效果一样。

### 卸载

在服务器运行时卸载插件，会先为每个在线玩家调用它的 `onLeft` 监听器，再调用用 `ll.onUnload` 注册的函数。然后 LSE
移除插件的定时任务、事件监听器和导出函数，并释放它的引擎实例。插件用 `mc.newCommand` 注册的命令会留在游戏中，
但没有了回调，直到服务器重启。

### 在客户端上

在 Windows 上的 Minecraft 客户端中，插件的脚本只在本地世界运行时运行（单人世界相当于一个本地服务器）：在它的服务器启动后开始，
在它停止时停止。加入别人的服务器时，脚本不会运行。

## 为 LLSE 编写的插件

LLSE 插件是直接放进 `plugins/` 的单个文件。引擎加载时，会在 `mods/`（因而也在 `plugins/`）中查找这样的文件：

| 引擎 | 迁移的文件 |
|---|---|
| QuickJS | `*.js` |
| Lua | `*.lua` |
| Python | `*.py` |
| Node.js | `*.llplugin`（zip 压缩包） |

对每个文件，引擎会创建文件夹 `mods/<不带扩展名的文件名>/`，把文件移进去（Node.js：把压缩包解压进去并删除压缩包），
如果那里还没有 `manifest.json` 就写入一个：文件是入口（Node.js：压缩包中找到的入口脚本），文件名是插件名，引擎是它的类型和依赖。然后它会记录插件已迁移、
需要重启才能加载：再重启一次服务器即可运行它们。

如果文件夹中已有同名文件，迁移会报错失败。要关闭迁移，在引擎的配置中把 `migratePlugins` 设为 `false`。

## 引擎的配置

每个引擎都读取自己模组文件夹中的 `config/config.json`（例如 `mods/legacy-script-engine-quickjs/config/config.json`），
文件不存在时会用默认值写入：

| 键 | 默认值 | 含义 |
|---|---|---|
| `version` | `3` | 文件格式的版本。 |
| `migratePlugins` | `true` | 启动时迁移 LLSE 插件（见上文）。 |
| `debugCommandLevel` | 游戏管理员（OP） | 谁可以运行引擎的调试命令（`jsdebug`、`luadebug`）。 |
| `fixLegacyAddons` | 未设置 | 仅 Node.js：修复用低于 11.1.0 的 node-gyp 构建的原生插件（addon）。 |
