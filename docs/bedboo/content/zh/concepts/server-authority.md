# 服务端权威

在 Java 版中，玩家身上发生的许多事由客户端决定：它在哪里、一次点击对物品栏做了什么、方块何时被破坏。在基岩版专用服务器上，
这三件事都由**服务器**决定。BDS 在 `start_game` 中声明了这一点（`server_authoritative_inventory`、
`server_authoritative_block_breaking`），而移动始终是服务端权威的。客户端发送玩家做了什么；服务器模拟它并回复结果。

mineflayer 的 API 是为 Java 的模型设计的：客户端先行动，再告诉服务器。bedboo 在基岩版的模型上保留这套 API：预测服务器会做
什么，按基岩版要求的方式发送玩家的动作，并以服务器的回复为准。本页解释这个模型；具体规则见[基岩版差异](../reference/differences/index.md)。

## 每个 tick 一个输入 {#input}

基岩版客户端从出生起，每个服务器 tick（每 50 ms）发送一个 `player_auth_input` 数据包。它携带位置（视线高度）、移动按键、
朝向、潜行和疾跑等标志，以及挖掘的方块动作。

bedboo 的输入队列（`bot._bedrock.input`）维持这个数据流。它的时钟以 `start_game` 中服务器的 tick 为基准；每个 tick 物理引擎
让玩家移动一步，队列把结果连同插件为该 tick 排入的内容一起发送。计时器延迟时，它会补发错过的 tick，一次最多
`maxCatchupTicks`（4）个。加载画面、死亡和维度切换会暂停这个数据流（[输入流](../reference/differences/movement.md#input)）。

这对机器人代码的影响是：通过数据流发送的改变要到下一个输入才生效，而不是立即生效。`look()` 在带有新朝向的输入发出后才
resolve（[视角](../reference/differences/movement.md#look)）；紧跟在 `setControlState('sneak')` 之后的点击会等到潜行状态
发出之后（[点击前的潜行 / 疾跑](../reference/differences/movement.md#controls-before-clicks)）。

## 移动：先预测，再校正 {#movement}

BDS 对收到的每个输入运行与客户端相同的移动模拟。当客户端报告的位置比服务器自己的结果移动得更远时，它发送
`correct_player_move_prediction`，其中包含服务器的状态和被校正输入的 tick。

bedboo 每个 tick 都用它的基岩版移动引擎进行预测，因此通常服务器与之一致，不会发送任何东西。bedboo 保存已发送的输入；收到
校正时，它回到被校正的 tick，采用服务器的状态，重放此后发送的输入，并发出 `forcedMove`。带有 tick 的传送、击退和效果也以
同样的方式从该 tick 起应用（[校正](../reference/differences/movement.md#corrections)）。

## 物品栏：item stack request {#inventory}

基岩版没有点击数据包。客户端通过 `item_stack_request`（take、place、swap、drop、craft……）请求服务器在指定的容器槽位之间
移动物品，服务器以 `item_stack_response` 回复：接受（附带结果数量），或以错误码拒绝。

bedboo 保留了 mineflayer 的 Java 布局物品栏和 `clickWindow`。对每次点击，它算出 Java 点击会产生的结果，先把这个结果作为
预测应用，再以 item stack request 发送并等待回复。被接受的请求会确定数量和 stack id；被拒绝的请求会回滚，`clickWindow`
抛出 mineflayer 自己的错误。所有基于点击的操作（`equip`、`transfer`、`deposit`、`craft`……）都以同样方式工作
（[clickWindow](../reference/differences/inventory.md#click-window)）。服务器发送其物品栏副本的数据包总是优先；当 bedboo
发现某个槽位过期时，会向服务器请求它的副本（[物品栏重新同步](../reference/differences/inventory.md#inventory-resync)，
`bot.bedrock.resyncInventory()`）。

## 挖掘与放置：以服务器的回复为准 {#digging}

在 BDS 上，方块由服务器自己破坏。客户端告诉服务器鼠标何时在方块上按下（`start_break`）；此后 BDS 每个 tick 用它自己的
手持物品副本和玩家状态累加破坏进度，进度完成时破坏方块。

所以 `bot.dig()` 不像在 Java 版上那样由客户端计时器结束。bedboo 发送开始动作，跟踪服务器报告的进度，并在服务器的
`update_block` 表明方块已消失时 resolve；如果服务器没有任何破坏该方块的迹象，挖掘会被中止
（[方块破坏](../reference/differences/digging.md#protocol)、[完成](../reference/differences/digging.md#completion)）。
放置同样由服务器回复：每次点击都携带服务器的手持物品副本，因此 bedboo 在上一次放置得到回复后（或 500 ms 后）才发送下一次
（[放置](../reference/differences/digging.md#placement-serialization)）。

## 对机器人意味着什么 {#for-bots}

- 等待 promise。`dig`、`placeBlock`、`clickWindow`、`equip` 等都在服务器回复后 settle，结果和错误与 Java 版相同。
- 服务器拥有最终决定权。服务器拒绝的移动、点击或挖掘都会按服务器的说法撤销。
- 时序跟随服务器的 tick：动作在下一个输入生效，挖掘所需的时间就是服务器破坏该方块所需的时间。

使用 `transport: 'bedd'` 时，真实客户端自己发送输入、请求和方块动作，bedboo 跟随它的行为而不是预测它
（[BeDD 模式](../reference/differences/bedd.md)）。
