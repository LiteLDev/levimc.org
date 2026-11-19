# 监听事件

插件通过事件对游戏做出反应：玩家加入、发送聊天消息、破坏方块。本指南介绍如何监听事件、如何阻止游戏处理事件，以及如何找到你需要的事件。

你需要一个能加载的插件：见[写你的第一个脚本插件](https://levimc.org/zh-Hans/tutorials/develop/first-script-plugin/)。
示例使用 JavaScript；API 在每种语言中都相同。

## 1. 监听事件

用事件名和每次事件发生时要调用的函数调用 `mc.listen`。在入口脚本的顶层调用它，这样插件加载时就会注册监听器：

```js
mc.listen("onJoin", (player) => {
    player.tell(`Welcome, ${player.name}!`);
    log(`${player.name} has joined the server.`);
});
```

函数会得到事件的参数：`onJoin` 传入进入游戏的玩家。每个事件的页面都给出了它的参数，例如 `onJoin` 见[玩家相关事件](../apis/EventAPI/PlayerEvents.md)。

用 Lua 写同样的监听器：

```lua
mc.listen("onJoin", function(player)
    mc.broadcast(player.name .. " has joined the server.")
end)
```

如果无法注册监听器，例如事件名不存在，`mc.listen` 返回 `false`。

## 2. 拦截事件

许多事件可以被拦截：它们的页面写有「拦截事件：函数返回 `false`」。在监听器中返回 `false`，游戏就不再处理这个事件，
就像它没有发生过一样。下面的监听器会丢弃包含某个词的聊天消息：

```js
mc.listen("onChat", (player, msg) => {
    if (msg.includes("badword")) {
        player.tell("Please keep the chat friendly.");
        return false;
    }
});
```

这条消息不会显示给任何人。不返回任何值（或返回 `false` 以外的值）就会放行事件。

拦截只会阻止游戏。其他插件对同一事件的监听器仍会被调用：LSE 按注册顺序调用一个事件的所有监听器，一般就是插件的加载顺序。
要让你的监听器先于另一个插件的运行，就让那个插件在它的 `manifest.json` 中依赖你的插件（见[插件与引擎](../concepts/plugins.md)）。

## 3. 检查拿到的值

有些参数可能为 `Null`：[玩家死亡事件](../apis/EventAPI/PlayerEvents.md)会传入杀死玩家的实体，没有实体造成死亡时它为
`Null`。使用这类值之前先检查：

```js
mc.listen("onPlayerDie", (player, source) => {
    if (source) {
        log(`${player.name} was killed by ${source.name}.`);
    } else {
        log(`${player.name} died.`);
    }
});
```

让监听器保持简短。它们在服务器线程上运行，慢的监听器会拖住服务器，对 `onTick` 这类频繁的事件更是如此。

## 4. 避免死循环

一个会再次引发自身事件的监听器永远不会结束。例如，调用 `mc.runcmd` 的 `onConsoleCmd` 监听器会再次触发
`onConsoleCmd`。先检查输入再行动，或者改用另一个事件。

## 找到你需要的事件

事件按主题列出：

- [玩家相关事件](../apis/EventAPI/PlayerEvents.md)：加入、离开、聊天、命令、死亡、使用物品……
- [实体相关事件](../apis/EventAPI/EntityEvents.md)和[方块相关事件](../apis/EventAPI/BlockEvents.md)。
- [经济系统事件](../apis/EventAPI/EconomicEvents.md)：金钱的变化。
- [其他事件](../apis/EventAPI/OtherEvents.md)：服务器启动（`onServerStarted`）、每个游戏刻（`onTick`）、控制台命令、计分板分数。

[事件监听 API](../apis/EventAPI/Listen.md) 描述了 `mc.listen` 本身。
