# 注册命令

插件可以向游戏添加命令。玩家在 `/` 后输入它们，有正常的补全和提示；控制台、命令方块和 NPC 也可以运行它们。
本指南注册一个带参数、权限和回调的命令，然后介绍 LLSE 的简单命令。

示例使用 JavaScript；API 在每种语言中都相同。这里用到的每个函数都可以在[命令相关 API](../apis/GameAPI/Command.md) 中查到。

## 1. 创建命令

在入口脚本的顶层创建命令，或像参考文档那样放在 `onServerStarted` 监听器中：服务器仍在启动时，LSE 会把注册推迟到可以注册命令时，
所以两种写法都可以。本指南使用监听器：

```js
mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("hello", "Says hello to players", PermType.Any);
    // 参数、重载和回调：第 2 到 4 步
    cmd.setup();
});
```

`mc.newCommand(name, description, permission)` 创建命令并返回一个命令对象，接下来对它进行配置。命令名只能使用英文小写字母。
权限决定谁可以运行它：

| 权限 | 谁可以运行命令 |
|---|---|
| `PermType.Any` | 任何人。 |
| `PermType.GameMasters` | OP。 |
| `PermType.Admin` | 管理员权限等级（默认值）。 |
| `PermType.Console` | 仅控制台。 |

`cmd.setAlias("hi")` 为同一个命令添加另一个名字。

## 2. 添加参数

每个参数都有名称和类型。`mandatory` 添加必须给出的参数，`optional` 添加可以省略的参数：

```js
cmd.mandatory("target", ParamType.Player);
cmd.optional("message", ParamType.RawText);
```

`ParamType.Player` 接受玩家名或目标选择器，例如 `@a`。`ParamType.RawText` 接受这一行剩下的全部内容，包括空格；
它只能作为最后一个参数。[参数类型列表](../apis/GameAPI/Command.md)给出了每种类型以及回调为它得到的值。

## 3. 声明命令的形式

重载是命令的一种形式：按顺序排列的参数列表：

```js
cmd.overload(["target", "message"]);
```

有了这个重载，`/hello Steve`、`/hello Steve Nice to see you!` 和 `/hello @a Welcome!` 都是有效的。命令有多种形式时，
为每种形式声明一个重载，例如 `/hello <target> [message]` 和 `/hello all`。

## 4. 处理命令

每次命令被运行时都会调用回调。它得到命令本身、来源（谁或什么运行了它）、输出（把结果写到哪里）以及按名称给出的参数值：

```js
cmd.setCallback((_cmd, origin, output, results) => {
    const from = origin.player ? origin.player.name : "The server";
    for (const player of results.target) {
        player.tell(`${from} says: ${results.message ?? "Hello!"}`);
    }
    output.success(`Said hello to ${results.target.length} player(s).`);
});
```

- `origin.player` 是运行命令的玩家；由控制台或命令方块运行时为 `Null`。
- `results.target` 是一个玩家数组：一个选择器可以匹配多个玩家。
- 省略了可选参数时，`results.message` 没有值。
- `output.success(msg)` 向运行命令者显示结果；`output.error(msg)` 显示错误。

然后 `cmd.setup()` 把命令注册到游戏中。完整的插件：

```js
mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("hello", "Says hello to players", PermType.Any);
    cmd.mandatory("target", ParamType.Player);
    cmd.optional("message", ParamType.RawText);
    cmd.overload(["target", "message"]);
    cmd.setCallback((_cmd, origin, output, results) => {
        const from = origin.player ? origin.player.name : "The server";
        for (const player of results.target) {
            player.tell(`${from} says: ${results.message ?? "Hello!"}`);
        }
        output.success(`Said hello to ${results.target.length} player(s).`);
    });
    cmd.setup();
});
```

重启服务器，在游戏中输入 `/hello @a`，或在控制台中输入 `hello @a`。

## 用枚举实现子命令

对于 `/manager add <name>` 和 `/manager list` 这样的命令，使用枚举：一组固定的词。用 `setEnum` 给每组词起一个名字，
为它添加一个 `ParamType.Enum` 类型的参数，并在重载中写上枚举名。这是参考中的示例：

```js
mc.listen("onServerStarted", () => {
    let cmd = mc.newCommand("manager", "Command Description", PermType.GameMasters);
    cmd.setAlias("mgr");
    cmd.setEnum("ChangeAction", ["add", "remove"]);
    cmd.setEnum("ListAction", ["list"]);
    cmd.mandatory("action", ParamType.Enum, "ChangeAction", 1);
    cmd.mandatory("action", ParamType.Enum, "ListAction", 1);
    cmd.mandatory("name", ParamType.RawText);
    cmd.overload(["ChangeAction", "name"]);
    cmd.overload(["ListAction"]);
    cmd.setCallback((_cmd, _ori, out, res) => {
        switch (res.action) {
            case "add":
                return out.success(`add "${res.name}"`);
            case "remove":
                return out.success(`remove "${res.name}"`);
            case "list":
                return out.success(`Name List:`);
        }
    });
    cmd.setup();
});
```

两个枚举参数都叫 `action`，所以回调从 `res.action` 读取所选的词；重载写的是枚举名，由它们区分两者。对于服务器运行时会变化的一组词
（玩家名、家的名字），使用软枚举：`setSoftEnum`、`addSoftEnumValues` 和 `ParamType.SoftEnum`。

## LLSE 的简单命令

`mc.regPlayerCmd` 和 `mc.regConsoleCmd` 用一次调用注册命令及其函数，并把命令后面的词作为字符串数组传入：

```js
mc.regPlayerCmd("ping", "Answers with pong", (player, args) => {
    player.tell("Pong!");
});

mc.regConsoleCmd("backup", "Starts a backup", (args) => {
    log(`Starting backup ${args[0] ?? "default"}.`);
});
```

保留它们是为了为 LLSE 编写的插件。只有玩家（`regPlayerCmd`）或控制台（`regConsoleCmd`）能运行它们，命令方块和 NPC 不能，
参数也要你自己解析。新插件请使用 `mc.newCommand`。

## 在插件中运行命令

`mc.runcmd("say Hello!")` 在后台运行一个命令，并返回是否成功。`mc.runcmdEx` 还会返回命令的输出，且不会把它写到控制台：

```js
const result = mc.runcmdEx("list");
log(result.output);
```
