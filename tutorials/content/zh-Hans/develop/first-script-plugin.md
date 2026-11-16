# 你的第一个脚本插件

完成本教程后，你的服务器会运行一个你用 JavaScript 编写的插件。它会问候每个加入的玩家，给他们显示一条欢迎提示，在他们脚下掉落一颗钻石，并添加一个控制台命令。插件运行在 LegacyScriptEngine（LSE）上，它让你用 JavaScript、Lua 或 Python 而不是 C++ 编写 LeviLamina 插件：不需要编译器，不需要构建，只要一个文本文件和一次重启。

大约需要二十分钟。

## 你需要准备

- 一个用 `lip` 搭建、装有 LeviLamina 的服务器：见[开你的第一个服务器](../server/first-server.md)。本教程使用 `D:\servers\survival`。
- 一个文本编辑器。[Visual Studio Code](https://code.visualstudio.com/) 是不错的选择，任何能保存纯文本的编辑器都可以。
- 能连到服务器的任意设备上的 Minecraft 基岩版，用来在游戏中看到问候。没有它也可以完成第 1 到 4 步。

你不需要精通 JavaScript：代码很短，并且会逐行解释。如果你从没写过，[MDN 的 JavaScript 指南](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide)介绍了基础知识。

## 1. 安装 JavaScript 引擎

LSE 为每种语言提供一个包，称为**变体**。本教程使用 JavaScript 引擎 `#quickjs`。

1. 如果服务器正在运行，先停止它。
2. 在服务器文件夹中安装这个变体：

   ```shell
   cd D:\servers\survival
   lip install github.com/LiteLDev/LegacyScriptEngine#quickjs
   ```

3. 运行 `lip list`。你应该看到 `github.com/LiteLDev/LegacyScriptEngine#quickjs` 及其版本，下面是它的依赖。

你也可以在 `lip` 的「获取模组」页安装它，见[给服务器安装模组](../server/install-mods.md)。

## 2. 创建插件文件夹

插件就是 `mods` 中的一个文件夹，里面有脚本和 `manifest.json`，和 C++ 模组一样。

1. 创建文件夹 `D:\servers\survival\mods\MyPlugin`。
2. 在其中创建 `manifest.json`，内容如下：

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

   - `entry` 是要运行的脚本。
   - `name` 是插件的名称，请与文件夹名保持一致。
   - `type` 指定由哪个引擎运行它：JavaScript 为 `lse-quickjs`。其他引擎为 `lse-lua`、`lse-nodejs` 和 `lse-python`。
   - `dependencies` 让 LeviLamina 先加载引擎。

3. 在旁边创建一个空的 `main.js`。

::: tip `plugins` 和 `mods` 是同一个文件夹
LSE 启动时会把服务器的 `plugins` 文件夹做成指向 `mods` 的链接，所以 `plugins\MyPlugin` 就是同一个文件夹。如果你直接把单个旧版脚本（例如 `MyPlugin.js`）放进去，LSE 会在下次启动时为它创建文件夹和 `manifest.json`；再重启一次即可加载。
:::

## 3. 让插件打个招呼

在 `main.js` 中写入：

```js
log("MyPlugin is running!");
```

`log` 向服务器控制台输出一行。你不需要导入或定义它：LSE 为每个脚本提供 `log`、`mc` 以及 API 中的其他对象。

启动服务器（在 `lip` 中选择**启动服务器**，或运行 `lip run`）。在 LeviLamina 加载模组的几行中，你应该看到一行 `MyPlugin is running!`。如果插件有错误，控制台会在那里显示错误和行号。

进行下一步之前，再次停止服务器。

## 4. 添加控制台命令

添加一个只有服务器控制台能执行的命令：

```js
mc.regConsoleCmd("greet", "Greets someone from the console", (args) => {
    log(`Hello, ${args[0] ?? "world"}!`);
});
```

`mc.regConsoleCmd` 注册一个命令以及执行它时运行的函数。LSE 会把命令后面的内容拆分成 `args`。

启动服务器，在输入行中输入 `greet Steve`。你应该看到 `Hello, Steve!`。

## 5. 在玩家加入时问候

现在来响应一个游戏事件。每当事件发生，`mc.listen` 都会调用你的函数；`onJoin` 是玩家进入游戏的事件，你的函数会收到这个玩家：

```js
mc.listen("onJoin", (player) => {
    log(`${player.name} has joined the server.`);
    player.sendToast("Welcome!", "Thanks for joining the server!");
    const loginReward = mc.newItem("minecraft:diamond", 1);
    mc.spawnItem(loginReward, player.pos);
});
```

逐行说明：

1. `log(...)` 把玩家的名字输出到控制台。
2. `player.sendToast(title, message)` 在玩家屏幕顶部显示一条提示。
3. `mc.newItem(name, count)` 创建一个物品堆：一颗钻石。
4. `mc.spawnItem(item, pos)` 把它掉落在玩家所在的位置。

现在你的 `main.js` 包含第 3、4、5 步的三部分。重启服务器，然后从 Minecraft 加入（在同一台电脑上：地址 `127.0.0.1`，端口 `19132`）。你应该看到：

- 控制台中出现 `<你的名字> has joined the server.`；
- 游戏中出现提示 **Welcome!**，身旁的地上有一颗钻石。

::: tip 小步前进
每次只改一处，重启，检查。出问题时，你就知道是哪次修改造成的。插件以及它调用的 API 的所有错误都会显示在服务器控制台中。
:::

## 6. 获取编辑器提示（可选）

编辑器本身不认识 `mc`、`log` 等 API。[legacy-script-engine-api](https://github.com/LiteLDev/legacy-script-engine-api) 仓库提供了 JavaScript 和 TypeScript（以及 Python）的类型定义，可以带来自动补全和内联文档；请按它的 README 为你的编辑器配置。

## 你现在有了什么

- 服务器上的 LSE JavaScript 引擎。
- 插件 `mods\MyPlugin`：一个 `manifest.json` 和一个包含控制台命令与加入事件的 `main.js`。
- 开发它的方式：编辑 `main.js`，重启服务器，查看控制台。

## 下一步

- 可以监听的所有事件：[事件监听](https://levimc.org/zh-Hans/LegacyScriptEngine/apis/EventAPI/Listen/)和[玩家事件](https://levimc.org/zh-Hans/LegacyScriptEngine/apis/EventAPI/PlayerEvents/)。
- 能对玩家做什么：[玩家 API](https://levimc.org/zh-Hans/LegacyScriptEngine/apis/GameAPI/Player/)。
- 带参数和权限、也供玩家使用的命令：[命令 API](https://levimc.org/zh-Hans/LegacyScriptEngine/apis/GameAPI/Command/)。
- 给玩家的对话框：[表单 API](https://levimc.org/zh-Hans/LegacyScriptEngine/apis/GuiAPI/Form/)。文件中的设置：[配置文件 API](https://levimc.org/zh-Hans/LegacyScriptEngine/apis/DataAPI/ConfigFile/)。
- 完整的 API 和其他语言：[LegacyScriptEngine API](https://levimc.org/zh-Hans/LegacyScriptEngine/apis/)和[语言支持](https://levimc.org/zh-Hans/LegacyScriptEngine/apis/LanguageSupport/)。
- 常见问题：[LegacyScriptEngine FAQ](https://levimc.org/zh-Hans/LegacyScriptEngine/faq/)。
- 把插件作为 `lip` 包分享：[lip.toml](https://levimc.org/zh-Hans/lip/concepts/lip_toml.html) 中的 `self` 资源会安装你仓库中的文件，[用 lip 发布你的模组](publish-a-package.md)介绍了发布步骤。
- 需要更快的速度或访问游戏内部：[你的第一个 LeviLamina 模组](first-levilamina-mod.md)。
