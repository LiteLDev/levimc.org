# bedboo 的工作方式

bedboo 就是去掉了 Java 部分、换上了基岩版部分的 mineflayer。机器人看到的 API 是 mineflayer 的；在它之下，连接、游戏数据、
实现 `bot.*` 的插件和物理引擎都是基岩版的。本页介绍这些层次，以及机器人的一次调用如何穿过它们。每一层与 Java 版有何不同，
逐条列在[基岩版差异](../reference/differences/index.md)中。

## 层次 {#layers}

```text
你的脚本、生态插件（pathfinder、pvp……）
        │  mineflayer API：createBot()、bot.*、事件
        ▼
bedboo 的插件（每个 mineflayer 插件一个文件）  ── bot.registry（minecraft-data + @bedboo/bedrock-data）
        │  基岩版数据包                          ── bot._bedrock（输入队列、生命周期、item stack request……）
        ▼
bot._client
        ├── 基于 RakNet 的 bedrock-protocol（raknet-native）     transport: 'raknet'，默认 ──┐
        ├── 基于 NetherNet 的 bedrock-protocol（node-nethernet） transport: 'nethernet' ─────┤
        └── 由 Be.D.D. 托管的真实客户端                          transport: 'bedd' ──────────┤
                                                                                             ▼
                                                                                  基岩版专用服务器（BDS）
```

## createBot 与插件 {#plugins}

`createBot()` 是改编过的 mineflayer 加载器（`lib/loader.js`）：选项相同、插件的选择方式相同、事件顺序相同，只是用
bedrock-protocol 客户端代替了 minecraft-protocol。`bot.loadPlugin()` 就是 mineflayer 自己的插件加载器，所以生态插件无需修改
即可加载。

内部插件构成了 `bot.*`。mineflayer 4.39.0 的每个插件名（共 41 个：`blocks`、`chat`、`digging`、`entities`、`inventory`、
`physics`……）在 bedboo 中都有一个对应文件，另外还有 `abilities`（来自 mineflayer 的 master 分支）和 `sign`（编辑告示牌，从
`blocks` 中拆出）。每个文件都改编自 mineflayer 的同名文件并保留其署名头：参数检查、返回值、错误消息和事件仍然是 mineflayer
的，Java 数据包换成了基岩版数据包。因此 `options.plugins` 和 `loadInternalPlugins` 按与 mineflayer 相同的名字选择插件。

## 连接 {#connection}

bedboo 通过 [bedrock-protocol](https://github.com/PrismarineJS/bedrock-protocol) 连接，由它处理登录、加密和各版本的数据包格式。
`transport` 选项决定由什么来承载数据包：

- **RakNet**（`'raknet'`，默认），基于 raknet-native。BDS 需要以 `transport=raknet` 运行。
- **NetherNet**（`'nethernet'`），基于 [node-nethernet](https://github.com/PrismarineJS/node-nethernet)：WebRTC 数据通道，
  从 1.26.51 起是 BDS 的默认传输层。信令默认通过服务器端口上的 HTTP 进行。
- **真实客户端**（`'bedd'`）：bedboo 自己不建立到服务器的连接。一个由 [Be.D.D.](https://levimc.org/zh-Hans/BeDD/) 托管的
  Minecraft 客户端已经在世界中；bedboo 读取它收发的每个数据包，并把自己本来要发送的内容转换为对该客户端的控制请求
  （[工作方式](../guide/bedd.md#how-it-works)）。

三种方式下机器人的 API 完全相同。如何选择和配置：[连接服务器](../guide/connecting.md#transports)。

## 版本与游戏数据 {#data}

基岩版的版本按**协议族**分组：同一协议族的所有 BDS 版本使用相同的网络协议，共享一套游戏数据。bedboo 支持 4 个协议族：
`1.26.40`、`1.26.45`、`1.26.51`（默认）和 `1.26.60`；`bot.version` 为协议族（[支持的版本](../reference/versions/index.md)）。
bedboo 不会探测服务器的版本：面向其他协议族的机器人需要在 `createBot({ version })` 中指明。

游戏数据（方块、方块状态、物品、实体、效果、生物群系、碰撞箱、食物……）来自
[minecraft-data](https://github.com/PrismarineJS/minecraft-data)，并由 `@bedboo/bedrock-data` 补充：每个协议族一个
`data/<协议族>/` 目录，其中的数据集替换 minecraft-data 中 `bedrock_<协议族>` 的对应数据集。这个补充层是
`require('bedboo')` 做的第一件事，早于 bedrock-protocol 或任何 prismarine 库读取基岩版数据。bedboo 还让
`require('minecraft-data')(bot.version)` 返回基岩版数据，正如 mineflayer 文档所承诺的，这样 prismarine-physics 的
`PlayerState` 之类的代码才能工作。

`bot.registry` 在收到第一个数据包之前就由这些数据构建好，再由服务器补全：`start_game` 提供方块的运行时 ID（在 BDS 上是方块
状态的哈希），`item_registry` 提供物品的网络 ID。因此名称和 ID 都是基岩版的（`wooden_door`、`lit_furnace`……）：见
[名称、ID 与数据](../reference/differences/data.md)。

## 基岩版状态 {#bedrock-state}

基岩版需要一些 Java 版没有、且由多个插件共享的状态。它们放在 `bot._bedrock` 中（内部使用，可能变化）：

- `input`：tick 时钟和 `player_auth_input` 队列，机器人每个 tick 发送这个数据包（[服务端权威](server-authority.md#input)）；
- `lifecycle`：加入、重生和维度切换，是唯一发出 `spawn` 的地方；
- `stackRequests` 和 `windows`：item stack request，以及映射到 Java 窗口类型的基岩版容器；
- `ids`：实体的运行时 ID 和唯一 ID、物品的网络 ID。

机器人在基岩版上可能需要、而 mineflayer 没有对应成员的东西，公开在 `bot.bedrock` 下（游戏规则、方块变体、物品栏重新同步、
BeDD 的能力），绝不会作为新的顶层 `bot` 成员出现：见 [API](../reference/api.md#bedrock-extras)。

## 移动 {#movement}

physics 插件运行一个从 prismarine-physics 分叉而来的移动引擎（`lib/physics/`）。它保留了模块结构和 `bot.physics` 的字段名，
因此 mineflayer-pathfinder 可以用它模拟移动，但实现的是基岩版的移动规则（台阶高度、摩擦、跳跃、攀爬、液体……），并经过反复
拟合，直到能复现服务器自身的模拟（[移动与物理](../reference/differences/movement.md#engine)）。在基岩版上，服务器会检查每一次
移动：见[服务端权威](server-authority.md#movement)。

## 依赖与补丁 {#patches}

对依赖（bedrock-protocol、node-nethernet、raknet-native、prismarine 系列库）的少量修复，以及生态插件中的 Java 假设，都以
`pnpm patch` 的形式放在仓库的 `patches/` 目录中。`pnpm-workspace.yaml` 中的 `overrides` 让每个包都加载同一份打过补丁的副本。
这就是目前需要在 bedboo 的 monorepo 中使用它的原因（[教程](https://levimc.org/zh-Hans/tutorials/automate/first-bedboo-bot/)
里有做法），也是生态插件在 monorepo 之外需要同样补丁的原因（[生态插件](../guide/plugins.md)、
[生态插件补丁](../reference/differences/plugins.md)）。

仓库包含三个包：`bedboo`（库本体）、`@bedboo/bedrock-data`（数据补充层）和 `@bedboo/agent`（基于 bedboo 的
[生存智能体](../guide/agent.md)）。
