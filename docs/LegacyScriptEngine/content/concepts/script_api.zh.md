# API 的工作方式

LSE 的 API 在每种语言中都相同：[参考](../apis/README.md)只描述一次，由各引擎映射到自己的语言。本页说明它的结构：
脚本在全局作用域中能找到什么，它拿到的对象是什么，以及引擎何时调用它提供的函数。

## 脚本一开始就有的东西

LSE 在运行入口脚本之前，把 API 绑定到每个插件的全局作用域中。你不需要 import 或 `require` 它。

全局函数：

- `log`、`colorLog` 和 `fastLog` 向服务器控制台输出；`setTimeout`、`setInterval` 和 `clearInterval` 稍后运行代码
  （见[脚本辅助 API](../apis/ScriptAPI/ScriptHelp.md)）。Node.js 引擎使用 Node.js 自己的 `setTimeout` 和 `setInterval`。

命名空间，即带有静态函数的对象：

| 名称 | 内容 | 参考 |
|---|---|---|
| `mc` | 游戏：事件（`mc.listen`）、命令、玩家、实体、方块、物品、表单、计分板 | [GameAPI](../apis/GameAPI/Basic.md)、[EventAPI](../apis/EventAPI/Listen.md)、[GuiAPI](../apis/GuiAPI/FormBuilder.md) |
| `ll` | 加载器和插件：版本、插件信息、`ll.exports` / `ll.imports`、`ll.onUnload` | [ll](../apis/ScriptAPI/Ll.md) |
| `logger` | 插件的可配置日志 | [日志](../apis/ScriptAPI/Logger.md) |
| `data` | 数据辅助：玩家数据、JSON、MD5、SHA-1、Base64 | [其他数据](../apis/DataAPI/OtherData.md) |
| `money` | 经济系统 | [经济系统](../apis/DataAPI/Economy.md) |
| `File` | 文件与目录 | [文件](../apis/SystemAPI/File.md)、[目录与文件](../apis/SystemAPI/FileSystem.md) |
| `network` | HTTP 请求（WebSocket 客户端和 HTTP 服务器是对象 `WSClient` 和 `HttpServer`） | [网络](../apis/SystemAPI/Network.md) |
| `system` | 系统命令、进程和系统信息 | [系统调用](../apis/SystemAPI/SystemCall.md)、[系统信息](../apis/SystemAPI/SystemInfo.md) |
| `NBT` | 解析 NBT，以及 NBT 标签类型 | [NBT](../apis/NbtAPI/NBT.md) |
| `i18n` | 插件文本的翻译 | [国际化](../apis/ScriptAPI/i18n.md) |
| `Format` | Minecraft 文本的格式代码 | [游戏实用工具](../apis/GameAPI/GameUtils.md) |

枚举，例如用于[命令](../apis/GameAPI/Command.md)的 `PermType` 和 `ParamType`，也是全局的。

## 对象

API 的大部分功能通过对象完成。你有两种方式得到对象：

- **来自游戏**，即 API 返回或传给你的函数的值：来自 `mc.getPlayer` 或 `onJoin` 监听器的 `Player`，以及 `Entity`、
  `Block`、`Item`、`Container`，命令回调中的 `CommandOrigin`。
- **自己创建**，用构造函数：`new JsonConfigFile(path)`、`new KVDatabase(dir)`、`new DBSession(type, params)`、
  `new WSClient()`、`new IntPos(x, y, z, dimid)`、`new NbtCompound(...)`。在 Lua 中直接调用类，不写 `new`：
  `JsonConfigFile(path)`。

参考中把这些类型称为 `Player`、`Entity`、`Block` 等；在引擎中注册的类名为 `LLSE_Player`、`LLSE_Entity`、
`LLSE_Block`……，[参考概述](../apis/README.md)的「数据类型」一节列出了它们。

### 玩家和实体是引用，不是副本

`Player` 或 `Entity` 对象指向游戏中的玩家或实体：访问属性时才读取，调用函数会作用于游戏。它持有一个弱引用：玩家离开或实体消失后，
它的属性返回 `Null`。所以不要长期保存 `Player` 对象。保存能标识玩家的信息（`pl.xuid`、`pl.name`），需要时再用
`mc.getPlayer` 获取对象。

### 值与类型

参考使用通用的类型名（`Integer`、`Float`、`String`、`Boolean`、`Array`、`Object`、`Null`……），每个引擎把它们映射到
自己的类型：`Object` 在 JavaScript 中是对象，在 Lua 中是 table；`Null` 在 JavaScript 中是 `null` 或 `undefined`，
在 Lua 中是 `nil`。[参考概述](../apis/README.md)有完整的对照表和文档的约定：参数写作 `名称 : 类型`，可选参数用 `[ ]` 括起。

许多函数失败时返回 `Null`（玩家不在线、表单无法发送）：使用前先检查。另一些函数，例如 SQL 数据库的函数，则会抛出错误。

## 你的代码何时运行

插件加载时，引擎运行一次入口脚本。插件做的其他一切，都发生在它交给 API 的函数中：

- **事件监听器**（`mc.listen`），每次事件发生时调用；
- **命令回调**（`mc.newCommand`、`mc.regPlayerCmd`、`mc.regConsoleCmd`），有人运行命令时调用；
- **表单回调**（`pl.sendForm`、`pl.sendModalForm`），玩家回答或关闭表单时调用；
- **定时任务**（`setTimeout`、`setInterval`），时间到时调用；
- **卸载函数**（`ll.onUnload`），插件卸载时调用。

这些函数在服务器线程上运行，夹在游戏自身的工作之间。耗时的函数会拖住服务器：让监听器保持简短，不要在 `onTick`
这类频繁的事件中做繁重的工作。

如果你的函数抛出错误，LSE 会捕获它，并在控制台中记录，同时给出事件或回调以及你的插件名；插件会继续运行。调用 API
时参数太少或类型不对，会抛出一个指明该 API 和你的插件的错误。

### 事件会发给每个监听器

事件发生时，LSE 按注册顺序（一般就是插件的加载顺序）调用每个插件对它的监听器。返回 `false` 的监听器会拦截事件：
游戏不再处理它，就像它没有发生过一样，但其他插件的监听器仍会被调用。见[事件监听](../apis/EventAPI/Listen.md)。

## 接下来

- [插件与引擎](plugins.md)：插件如何加载和卸载。
- [语言支持](../apis/LanguageSupport.md)：各引擎的差异。
- 指南：[监听事件](../guides/events.md)、[注册命令](../guides/commands.md)、[显示表单](../guides/forms.md)、
  [存储数据](../guides/storing_data.md)以及[日志与定时任务](../guides/logging_and_timers.md)。
