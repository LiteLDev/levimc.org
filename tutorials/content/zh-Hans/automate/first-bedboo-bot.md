# 你的第一个 bedboo 机器人

完成本教程后，一个你用 JavaScript 编写的机器人会加入你的基岩版服务器，在聊天栏打招呼，回应玩家说的话，并在你输入 `come` 时走到你身边。它基于 bedboo 构建，这是一个拥有 [mineflayer](https://github.com/PrismarineJS/mineflayer) API 的基岩版机器人库：如果你写过 mineflayer 机器人，机器人代码完全相同。

大约需要半小时。

## 你需要准备

- 一个 **1.26.42.1** 到 **1.26.63.1** 之间的基岩版专用服务器（BDS），在你的电脑或局域网上。[开你的第一个服务器](../server/first-server.md)中的服务器就可以；本教程使用 `D:\servers\survival`。
- [Node.js](https://nodejs.org/zh-cn) **24** 或更高版本和 [Git](https://git-scm.com)。Windows、Linux 或 macOS 均可，但需要 **x64** 处理器（这里使用的 RakNet 连接没有 ARM 构建）。
- Minecraft 基岩版，用来在游戏中和机器人对话。没有它也可以完成第 1 到 5 步。

在终端中检查 Node.js：

```shell
node -v
```

你应该看到 `v24` 或更高版本。

## 1. 获取 bedboo

bedboo 尚未发布到 npm。它用 pnpm 补丁修复了几个依赖，这些补丁只在它自己的工作区内生效，因此请在它的仓库中使用它：

```shell
git clone https://github.com/LiteLDev/bedboo
cd bedboo
corepack enable
pnpm install
```

`corepack enable` 会提供仓库要求的 pnpm 版本。你应该看到 pnpm 列出已安装的包并顺利结束，没有错误。

::: details 找不到 `corepack`，或没有权限
Node.js 25 及更新版本不再自带 corepack：用 `npm install -g corepack` 安装后，再运行一次 `corepack enable`。在 Windows 上，如果 Node.js 安装在 `C:\Program Files`，请在以管理员身份打开的终端中运行一次 `corepack enable`。
:::

## 2. 为机器人建一个包

你的机器人放在工作区的一个包里，这样它就有自己的依赖。

1. 在仓库中创建文件夹 `packages/my-bot`。
2. 在其中创建 `package.json`：

   ```json
   {
     "name": "my-bot",
     "private": true,
     "dependencies": {
       "bedboo": "workspace:*",
       "mineflayer-pathfinder": "2.4.5"
     }
   }
   ```

   `bedboo` 来自工作区。`mineflayer-pathfinder` 是 mineflayer 常用的寻路插件，在基岩版上无需修改即可使用。

3. 在仓库根目录再次运行 `pnpm install`。你应该看到它添加了 `mineflayer-pathfinder`。

## 3. 准备服务器

本教程中的机器人没有 Xbox Live 账号，并且通过 RakNet 连接。需要让服务器知道这一点：

1. 停止服务器。
2. 打开服务器文件夹中的 `server.properties`，设置：

   ```properties
   transport=raknet
   online-mode=false
   allow-list=false
   server-port=19132
   ```

   | 设置 | 原因 |
   | --- | --- |
   | `transport=raknet` | BDS 1.26.51 及更新版本默认使用 NetherNet；除非另行指定，bedboo 通过 RakNet 连接。 |
   | `online-mode=false` | 使用 `auth: 'offline'` 的机器人没有 Xbox Live 身份。 |
   | `allow-list=false` | 否则需要把机器人的名字加入 `allowlist.json`。 |

3. 启动服务器，等待 `Server started.`。记下服务器启动时输出的游戏版本，例如 `1.26.60`：机器人需要它。

::: warning 离线服务器请保持私有
`online-mode=false` 时，任何人都能以任意名字加入。请把这样的服务器留在自己的网络中，或者保持 `online-mode=true`，并给机器人一个 Microsoft 账号（`auth: 'microsoft'`，见 [API](https://levimc.org/bedboo/zh-Hans/reference/api.html)）。
:::

`Server started.` 之后紧跟的 `TRANSPORT TYPE ERROR … not set to NetherNet` 一段是无害的：BDS 只是提醒原版客户端将来可能需要 NetherNet，RakNet 客户端可以正常连接。

## 4. 编写机器人

创建 `packages/my-bot/index.js`：

```js
const bedboo = require('bedboo') // 代替 require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')

const bot = bedboo.createBot({
  host: process.argv[2] ?? '127.0.0.1',
  port: parseInt(process.argv[3] ?? '19132'),
  version: process.argv[4], // 服务器的游戏版本，例如 '1.26.60'
  username: 'Bot',
  auth: 'offline'
})
bot.loadPlugin(pathfinder)

bot.once('spawn', () => {
  console.log(`spawned at ${bot.entity.position} in ${bot.game.dimension} (${bot.game.gameMode})`)
  bot.chat('hello!')
})

bot.on('chat', async (username, message) => {
  if (username === bot.username) return
  if (message === 'come') {
    const target = bot.players[username]?.entity
    if (!target) return bot.chat("I can't see you")
    bot.pathfinder.setMovements(new Movements(bot))
    try {
      await bot.pathfinder.goto(new goals.GoalNear(target.position.x, target.position.y, target.position.z, 1))
      bot.chat('here!')
    } catch (err) {
      bot.chat(`I can't get there: ${err.message}`)
    }
  } else {
    bot.chat(message) // 其他内容原样复述
  }
})

bot.on('kicked', (reason) => console.log('kicked:', reason))
bot.on('error', (err) => console.log('error:', err))
bot.on('end', (reason) => console.log('disconnected:', reason))
```

它做了什么：

- `createBot` 连接服务器。`version` 是服务器的游戏版本；bedboo 接受精确的 BDS 构建（`1.26.62.1`）或其协议族（`1.26.60`）。不传时，机器人使用 1.26.51。
- 机器人进入世界后触发 `spawn`；每条聊天消息都会触发 `chat`，并带上发送者的名字。
- `bot.pathfinder.goto` 走到目标处，这里是玩家一格范围内。

方块和物品使用基岩版的名字（`grass_block`、`oak_log`……）；其余都是 mineflayer 的 API。

## 5. 运行

在仓库根目录中，带上你的服务器版本运行：

```shell
node packages/my-bot/index.js 127.0.0.1 19132 1.26.60
```

几秒内你应该在终端中看到 `spawned at (…) in overworld (survival)`。在服务器中输入 `list`：你应该看到 `There are 1/10 players online:` 和 `Bot`。

按 `Ctrl+C` 断开机器人。

## 6. 和它对话

1. 再次启动机器人，并从 Minecraft 加入服务器（在同一台电脑上：地址 `127.0.0.1`，端口 `19132`）。
2. 在聊天栏随便输入些什么：机器人会复述。
3. 输入 `come`：机器人会走到你身边并说 `here!`。

要让机器人用 `bot.chat('/time set day')` 执行命令，请在 `server.properties` 中设置 `allow-cheats=true`，并在服务器控制台把它设为管理员：`op Bot`。

::: details 机器人进不来
| 现象 | 原因 |
| --- | --- |
| `Connect timed out` | 主机或端口错误、服务器的 `transport` 不是 `raknet`，或防火墙丢弃了 UDP。 |
| 加入后立即 `kicked` | `allow-list=true` 但机器人不在 `allowlist.json` 中，或 `online-mode=true`。原因会说明是哪一种。 |
| 以客户端或服务器版本过旧为由被踢出 | 你传入的 `version` 与服务器不一致。 |
| RakNet 后端加载失败 | 不是 x64，或者依赖是在 bedboo 工作区之外安装的。 |
:::

## 你现在有了什么

- 本地工作区中的 bedboo，以及作为其中一个包的你的机器人。
- 一个机器人可以加入的服务器，以及一个会聊天、会用寻路插件走路的机器人。

## 下一步

- 基岩版上的其他 mineflayer 插件：pvp、采集方块等：[生态插件](https://levimc.org/bedboo/zh-Hans/guide/plugins.html)。
- `createBot` 的所有选项和基岩版扩展，包括 NetherNet 和 Microsoft 账号：[API](https://levimc.org/bedboo/zh-Hans/reference/api.html)。
- 与 Java 版机器人的不同之处：[Bedrock 差异](https://levimc.org/bedboo/zh-Hans/reference/differences/)。
- 支持的服务器版本：[支持的版本](https://levimc.org/bedboo/zh-Hans/reference/versions/)。
- 一个现成的生存模式机器人：[生存智能体](https://levimc.org/bedboo/zh-Hans/guide/agent.html)。
- BDS 对机器人的行为：[BDS 备忘](https://levimc.org/bedboo/zh-Hans/reference/bds.html)。
- 驱动真实的游戏客户端，而不是协议机器人：[用 Be.D.D. 驱动游戏客户端](bedd.md)。
- bedboo 是什么、如何构建：[bedboo](https://levimc.org/bedboo/zh-Hans/)。
