# 日志与定时任务

本指南介绍几乎每个插件都需要的两件事：向控制台或日志文件写消息，以及稍后或定期运行代码。最后介绍如何不写插件、直接在控制台中试运行代码。

示例使用 JavaScript；API 在每种语言中都相同。

## 输出到控制台

`log` 把它的参数依次写到服务器控制台的同一行：

```js
log("MyPlugin is running!");
log(`Players online: ${mc.getOnlinePlayers().length}`);
```

插件输出的每一行都带有插件的名字：LSE 为每个插件创建一个以插件命名的日志记录器，`log` 和 `logger` 都通过它输出。
`colorLog(color, ...)` 输出一行彩色文本，`fastLog` 不等这一行写完就返回。见[脚本辅助 API](../apis/ScriptAPI/ScriptHelp.md)。

## 按等级输出消息

`logger` 按等级输出消息，让警告和错误更醒目，并且可以隐藏调试信息：

```js
logger.info("Loaded 12 homes.");
logger.warn("config.json has no 'welcome' setting, using the default.");
logger.error("Could not open the database.");
logger.debug("Home of Steve: 10 64 -3");
```

等级用数字表示：1 致命错误、2 错误、3 警告、4 信息、5 调试。高于日志记录器等级的消息不会输出；默认等级为 `4`，
因此调试信息是隐藏的。开发插件时可以显示它们：

```js
logger.setLogLevel(5);
```

### 同时输出到文件或玩家

```js
logger.setFile("logs/MyPlugin.log");
```

会在输出到控制台的同时，把消息也写进一个文件。`logger.setPlayer(player)` 还会把消息作为聊天消息发给游戏中的一个玩家，
便于在游戏中测试。`logger.setConsole(false)` 停止向控制台输出。这些函数都可以把等级作为可选的第二个参数；这个等级作用于整个日志记录器，
而不只是那一个输出目标。见[日志 API](../apis/ScriptAPI/Logger.md)。

## 稍后运行代码

`setTimeout(func, ms)` 在延迟若干毫秒后调用一次函数。它返回任务的 ID：

```js
mc.listen("onJoin", (player) => {
    const xuid = player.xuid;
    setTimeout(() => {
        const pl = mc.getPlayer(xuid);
        if (pl) pl.tell("Type /menu to open the menu.");
    }, 5000);
});
```

五秒之后，玩家可能已经离开：根据能标识玩家的信息重新获取玩家，并检查结果（见 [API 的工作方式](../concepts/script_api.md)）。

## 定期运行代码

`setInterval(func, ms)` 每隔 `ms` 毫秒调用一次函数，直到你用 `clearInterval(id)` 取消它：

```js
const announcement = setInterval(() => {
    mc.broadcast("Remember to read the rules: /menu");
}, 10 * 60 * 1000);

// 之后要停止它时：
clearInterval(announcement);
```

插件卸载时，LSE 会取消它的定时任务（QuickJS、Lua 和 Python）。

### 定时任务有多精确

定时任务在服务器线程上运行，并以 50 毫秒的游戏刻计时，所以延迟不会短于一个游戏刻，服务器变慢时还会更长。定时任务适合「五秒后」
或「每十分钟」，不适合精确的时间点。要在一天中的某个时刻执行任务，算出到那时的延迟再用 `setTimeout`，而不要在每个游戏刻检查时间。
让这些函数保持简短：和事件监听器一样，它们运行时会拖住服务器。

Node.js 引擎使用 Node.js 自己的 `setTimeout` 和 `setInterval`。

## 在控制台中试运行代码

QuickJS、Lua 和 Python 引擎在服务器控制台中有调试模式。输入 `jsdebug`（QuickJS）、`luadebug`（Lua）或 `pydebug`（Python）
并回车：此后你输入的每一行都会作为该语言的代码运行并输出结果，就像浏览器的开发者工具控制台一样。再次输入同一个命令即可退出。
Node.js 引擎没有调试模式。

使用 QuickJS 和 Lua 时，还可以直接运行一行代码：`jsdebug mc.getOnlinePlayers().length`。谁可以运行这些命令，由引擎配置中的
`debugCommandLevel` 决定（见[插件与引擎](../concepts/plugins.md)）。
