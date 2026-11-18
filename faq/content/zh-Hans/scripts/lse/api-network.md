# LegacyScriptEngine API：网络与系统

## LSE 插件中有没有办法获取玩家是通过哪个 IP 进入服务器的？

可以，通过玩家的设备信息对象获取：`player.getDevice().ip`（Device 对象的 `ip` 属性）。

注意：若服务器经过 frp 等内网穿透 / 代理，拿到的会是穿透客户端的地址（如 `127.0.0.1`），而不是玩家真实 IP。

*适用版本：LSE 当前所有版本（含 v0.23.1）*

## LSE 插件如何实现自动更新自身？

可以定时检查更新（如用 `network.httpGet` 请求版本信息），发现新版本后先下载到本地并覆写插件自身文件，再通过 `mc.runcmdEx` 执行 LeviLamina 的重载命令（如 `ll reload <插件名>`）重载自己。不建议每次加载时从网络拉取代码再 `eval` 执行。

*适用版本：LeviLamina + LSE 当前版本*

## LSE 有获取服务器公网 IP 的接口吗？

没有专门的接口（LSE 只有玩家 / 设备的 `ip` 属性，如 `pl.getDevice().ip`）。可以用 LSE 的网络接口 `network.httpGet(url, callback)` 请求外部 IP 查询服务（如 <https://ip.sb>、<https://4.ipw.cn>）获取公网 IP；Node.js 插件也可以用 Node 的网络库实现。

*适用版本：LSE 当前所有版本*

## LSE 的 `BinaryStream` 中 `writeVec3` 应该传什么参数？和连续调用三次 `writeFloat` 有区别吗？

`writeVec3` 需要传一个 `FloatPos`，实现上就是依次 `writeFloat` 写入 x、y、z，与连续调用三次 `writeFloat` 等价。

## LSE 的 Node.js 插件之间能共享内存吗？Node 插件想在服务器启动完成后通知外部前端程序，有什么办法？

不能直接共享内存，LSE 为每个 Node.js 插件做了执行环境隔离。插件之间需要互相调用时可用 `ll.exports` / `ll.imports`（远程函数调用）。与外部程序通信建议走网络：在 `onServerStarted` 事件里通过 HTTP 请求（`network.httpGet` / `httpPost` 或 Node 自带 `http` 模块）或 WebSocket（LSE 的 `WSClient`，或 npm 的 `ws` 包）通知外部程序；需要监测服务器存活时可以用 WebSocket 定时心跳，超时即判定服务器挂掉。用文件交互不如网络方式可靠。有用户反馈 `process.send` 不可用。

*适用版本：当前版本（Node.js 引擎）*

## 在 LSE 的 JS 脚本插件里，能否让玩家进服时一直停留在“正在加载资源”阶段、几乎不下发数据包，等某个 `Promise` 返回后再决定是否放行进服？

脚本插件做不到在登录/加载资源阶段挂起玩家连接、阻止下发数据包的控制（`onPreJoin` 等事件回调是同步的，只能当场决定是否拦截，不能等待 `Promise`）。需要用 C++ mod 自行 hook 网络/登录流程实现。

## 在 LSE 中用 `BinaryStream` 构建 `AddActor` 数据包再 `createPacket` 发送失败/报参数错误，为什么？用 `sendNetworkPacket` 符号能解决吗？

`bs.createPacket(pktid)` 默认会先创建对应类型的包对象，再从 `BinaryStream` 中 read 解析校验，部分包（如 `AddActor`）用自行拼接的数据解析会失败。LSE 0.19.1 起可用 `bs.createPacket(pktid, true)` 创建原始网络数据包，直接把当前流中的字节作为包体发送，不再经过解析，然后用 `pkt.sendTo(player)` 或 `player.sendPacket(pkt)` 发送。`?sendNetworkPacket@Player@@UEBAXAEAVPacket@@@Z` 与 `player.sendPacket` 本质相同，换用它不能解决问题。另外在 JS 字符串中写符号时反斜杠需要转义，或使用 `String.raw`。

*适用版本：LegacyScriptEngine 0.19.1 及以上（raw 参数）；更早版本无法用 `createPacket` 发送 `AddActor`*

## 在服务端修改了地图画（物品展示框里地图）的 NBT 或 mapid 对应的像素数据后，客户端画面不刷新，如何让客户端看到更新？

服务端数据其实已经改了，只是没有给客户端发更新包。地图数据由客户端发送 `MapInfoRequestPacket`（`mMapId`、`mClientPixels`）请求，服务端以 `ClientboundMapItemDataPacket` 回传；`UpdateBlockActorPacket` 只告诉客户端展示框里的地图 id。地图 id 不变、只改数据时，可发一个 `UpdateBlockPacket` 触发方块更新，让客户端重新请求地图数据（用命令方块 `clone`、`structure` 重新加载或 `pl.refreshChunks()` 也能强制刷新，但会有闪烁）。LSE 可以用 `pl.sendPacket` 直接发包，不过需要手写 `BinaryStream`，协议可参考 <https://mojang.github.io/bedrock-protocol-docs/html/packets.html>。注意每次更新都会发给所有玩家，会占用带宽。

*适用版本：LSE / LeviLamina 当前版本（发包细节依赖 BDS 协议）。未能从源码或文档中直接证实，仅供参考。*

## 基岩版两个服务器之间如何实现跨服传送（传服）？数据能互通吗？

传服本身很简单：LSE 提供 `pl.transServer(ip, port)`；C++ mod 可构造 `<mc/network/packet/TransferPacket.h>` 中的 `TransferPacket`（传入目标 IP 和端口）并通过 `player.sendNetworkPacket` 发送。但各服数据（包括各插件数据）不会自动互通，需要自行用 MySQL 等共享存储或文件/WebSocket 中转来同步。

*适用版本：LSE / LeviLamina 当前版本*

## 想写一个 `/ping` 命令显示玩家到服务器的延迟，LSE 或 LeviLamina 有没有直接获取玩家延迟的接口？

不用自己在服务端 ping 玩家 IP（拿到的 IP 往往是运营商出口，而且通常禁 ping）。LSE 中直接用 `pl.getDevice()` 返回的设备信息对象：`dv.lastPing`（当前延迟 ms）、`dv.avgPing`（平均延迟 ms），另有 `lastPacketLoss`/`avgPacketLoss` 丢包率。C++ mod 开发者可参考 LSE 开源代码 `DeviceAPI.cpp` 中这些属性的实现。

*适用版本：LegacyScriptEngine 当前版本*

## 服务器已有自定义进出服提示，如何关闭原版的黄字“xxx 加入/离开了游戏”提示？LSE 中 `mc.listen('onJoin'/'onLeft')` 回调 `return false` 能拦截吗？

不能用这种方式关掉提示：`onLeft` 不可拦截；`onJoin` 虽然 `return false` 可以拦截，但拦的是玩家进入事件本身而不是那条消息。

可行方法：

1. 资源包修改语言文件中的 `multiplayer.player.joined` / `multiplayer.player.left`。
2. 拦截发送给客户端的 `TextPacket` 数据包。LSE 中可借助第三方 ila-lseexport（导出 iListenAttentively 事件）监听数据包发送事件并拦截。C++ mod 中可依赖 iListenAttentively 的 `SendPacketBeforeEvent`：`if (event.packet().getId() == MinecraftPacketIds::Text) event.cancel();`（再按文本内容过滤）。

*适用版本：LegacyScriptEngine / iListenAttentively 当前版本*

## 用 LSE 发包做假箱子（fake chest）查包界面时，打开大箱子（双箱）会瞬间关闭，怎么解决？

客户端打开容器界面时要求对应坐标处存在箱子方块，否则界面会立刻关闭。需要先向该玩家发送假的箱子方块（大箱子需要两个相邻且已配对的箱子），通常生成在玩家头顶附近，再发送 `ContainerOpenPacket` 打开界面。LSE 可用 `BinaryStream` 构造数据包并通过 `pl.sendPacket(packet)` 发送。可参考社区示例：<https://github.com/Cdm2883/code-snippets/blob/vscode/LLSE/FakeChestLLSE/fake-chest.llse.js>

*适用版本：当前版本（依赖客户端行为与具体协议版本）。未能从源码或文档中直接证实，仅供参考。*

## 能否让某个玩家头顶的文字（名称标签/悬浮字）只对特定玩家单方面可见？

可以。原理是只给目标玩家发送修改实体名称/元数据的数据包（如 `SetActorDataPacket`），其他玩家收不到该包就看不到。在 LSE 中可用 Packet API 构造数据包（`new BinaryStream()` 写入数据后 `bs.createPacket(pktid)`），再用 `pl.sendPacket(packet)` 只发给指定玩家；也可以借助其他提供发包/悬浮字接口的前置插件实现。注意 Packet API 需当前版本可用，且数据包结构随 BDS 协议版本变化，需按当前协议构造。

*适用版本：LegacyScriptEngine 当前版本*

## LSE 中 `network.httpGet()` 的返回状态码一直是 `-1`，但同一 URL 在浏览器能正常访问，是什么原因？

状态码 `-1` 表示请求本身失败（没有拿到任何响应）。先打印拼出来的 URL 确认是否正确，并检查请求参数和服务端；有用户遇到是域名解析失败导致的，改用 IP 访问即可。也可以用 `curl` 测试，或在 Node.js 插件里改用其他 HTTP 库发请求。
