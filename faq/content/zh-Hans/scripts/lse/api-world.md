# LegacyScriptEngine API：世界与方块

## LSE 插件在全局作用域获取/创建计分板对象（如 `mc.getScoreObjective`、`mc.newScoreObjective`），`ll reload` 后正常，但服务器重启后报错或得到 null，为什么？

插件加载时服务器（世界）尚未启动完成，此时无法操作计分板等原版内容，获取到的对象为 null。应在全局用 `let` 声明变量，然后在 `mc.listen("onServerStarted", () => { /* 在这里获取/创建计分板 */ })` 回调里再赋值，使用前做非空判断。热重载（`ll reload`）时服务器已启动，所以能直接拿到；且 LSE 对服务器启动后才加载的插件也会补发 `onServerStarted`，因此统一写在该事件里两种情况都适用。

*适用版本：当前所有 LSE 版本*

## LSE 脚本中如何判断某个区块是否已加载？等待区块加载时用 while/for 循环检测导致服务器假死怎么办？

用 `mc.getBlock(x, y, z, dimid)` 读取该位置方块：区块未加载时返回 `null`（不会抛错），返回方块对象即已加载；访问属性前先判空。

不能用同步循环（`while`/`for`）反复检测：LSE 所有逻辑都在服务器主线程（tick 线程）上执行，忙等会阻塞主线程，区块永远加载不了，服务器假死、玩家卡在空中。正确做法是用定时器：`setInterval` 定期检测（保存 timer id，成功后 `clearInterval` 并执行回调），或 `setTimeout` 延迟重试。区块加载是异步的，耗时不确定。

随机传送/假人场景：可先把玩家或模拟玩家传送到目标 x/z 的高空，再用定时器检测 `mc.getBlock` 是否不为 `null`，或检测其 y 坐标是否开始变化（玩家在未加载区块会悬停，加载后才下落），再确定落点/执行操作。C++ mod 中可直接检查区块是否已完全加载后再操作。

*适用版本：LeviLamina 上的 LegacyScriptEngine 当前所有版本*

## LSE 的 `mc.setBlock` 能否在未加载的区块里设置方块？

不能，目标区块必须处于加载状态（未加载时 `mc.setBlock` 会返回 `false`）。变通方法：先让区块加载起来，例如用 `mc.spawnSimulatedPlayer` 在该处生成模拟玩家（假人），区块加载后再放置方块，完成后让假人退出；C++ mod 则可以先强制加载区块再操作。

*适用版本：LeviLamina 上的 LegacyScriptEngine 当前所有版本*

## LSE 中 `mob.pos` 打印出来是“主世界(x,x,x)”这样的字符串，对它用 `replace` 报 `cannot read ... from 'undefined'`，如何获取坐标数值来生成粒子？

`pos` 不是字符串，而是 `FloatPos`/`IntPos` 对象，打印出的友好格式是其 `toString` 的结果。不要做字符串处理，直接读取属性 `pos.x`、`pos.y`、`pos.z` 和 `pos.dimid` 即可，也可直接把 `pos` 传给 API（例如 `ps.spawnParticle(pos, name)`）。建议先阅读文档中的基础类型说明，使用 TypeScript 类型声明可避免此类错误。

*适用版本：LegacyScriptEngine 当前所有版本（原为 LLSE）*

## LSE 中 `mc.setBlock` 的 block 参数传入 NBT 对象时提示参数错误，怎么回事？

传 NbtCompound（或 Block 对象）时不要再传 `tileData` 参数，两者是不同的重载：

- `mc.setBlock(pos, blockObject)` / `mc.setBlock(x, y, z, dimId, blockObject)` 接受 Block 或 NbtCompound；
- `mc.setBlock(pos, blockString, tileData)` / `mc.setBlock(x, y, z, dimId, blockString, tileData)` 只在 block 为方块类型名字符串时可带 `tileData`。

带了 `tileData` 时 LSE 会要求 block 参数必须是字符串，否则报参数类型错误。TypeScript 声明库 legacy-script-engine-api 已在 JavaScript@v2.17.0（2025-06-20）修正了对应重载声明。

*适用版本：当前版本；声明库 legacy-script-engine-api JavaScript@v2.17.0 及以上*

## 在 LSE 中用 `block.setNbt` 改了方块状态 NBT 后，服务端 NBT 已经变了，客户端看到的方块状态却不刷新（重进服务器才生效）。怎样让客户端立即刷新？

最简单的办法：先把该位置设为空气（`mc.setBlock(pos, "minecraft:air")`），再用带新 NBT 的方块 `mc.setBlock` 放一次，客户端就会刷新。

也可以自己发包：BlockActorData 包（`0x38`）用于更新方块实体 NBT，用 `BinaryStream` 依次 `writeVarInt(x)`、`writeUnsignedVarInt(y)`、`writeVarInt(z)`、`writeCompoundTag(nbt)`，再 `bs.createPacket(0x38)`，然后 `player.sendPacket(pkt)`。UpdateBlock 包（`0x15`）需要方块的 runtimeId，取起来比较麻烦。只刷新区块没用。

当前版本仍提供 `setNbt` / `BinaryStream` 相关 API。

*适用版本：LeviLamina + LSE 当前版本。未能从源码或文档中直接证实，仅供参考。*

## LSE 有没有 API 可以让某块区域重新执行地形生成？

LSE 本身没有。可以用第三方前置 GMLib 提供的删除区块 API，删除后区块会重新生成。注意结构（如村庄等）需要删除结构起始点所在区块才会重新生成。

*适用版本：当前版本；需 GMLib。未能从源码或文档中直接证实，仅供参考。*

## LSE 的 JS 插件如何解析/使用 `.mcstructure` 结构文件（把玩家保存的结构文件传到服务端使用）？

不需要外部库，纯 LSE 就能做：`.mcstructure` 本质是小端二进制 NBT。用 `File.readFrom(path, true)` 以二进制读取得到 `ByteBuffer`，用 `NBT.parseBinaryNBT(buf)` 转换为 `NbtCompound`，再调用 `mc.setStructure(nbt, pos[, mirror, rotation])` 放置结构（反向可用 `mc.getStructure` 导出）。文件格式说明见 <https://wiki.bedrock.dev/nbt/mcstructure#file-format>。

*适用版本：LSE 0.19.1 及以上（`File.readFrom` 二进制读取）*

## LSE 的 `mc.setBlock` 传入方块类型字符串时，是否必须带 `minecraft:` 前缀？

不一定。`mc.setBlock` 传字符串时会用 `Block::tryGetFromRegistry` 按名字到原版方块注册表（`BlockTypeRegistry::lookupByName`）里查找，查不到则直接返回 `false`；是否接受省略命名空间的写法取决于 Mojang 的实现。有用户反馈不加前缀（如 `diamond_ore`）一般也能放置成功，但文档中的标准类型名带前缀，建议写成 `minecraft:diamond_ore` 以保证兼容。

*适用版本：当前版本（行为取决于 BDS 原版注册表）。未能从源码或文档中直接证实，仅供参考。*

## LSE 的连锁采集插件可以在 iLand 领地内无权限挖掉方块，如何在 JS 插件中判断方块是否在 iLand 领地中？

原因是插件用 `Block.destroy()` 直接破坏方块，不会触发领地保护所监听的玩家破坏事件。可通过 LSE 的跨插件调用导入 iLand 导出的函数判断：

```js
const posGetLand = ll.imports("ILAPI_PosGetLand"); // 旧写法 ll.import 仍是 ll.imports 的别名
if (posGetLand(targetBlock.pos) == -1) { /* 该位置不是领地 */ }
```

也可以借助第三方 LRCA 提供的 `Block.playerWillDestroy` 等接口模拟玩家破坏以触发相关事件。

*适用版本：当前版本；需安装 iLand。未能从源码或文档中直接证实，仅供参考。*

## LSE 能否通过方块状态（block states）而不是 `tileData` 来设置方块？还是只能用 `setblock` 命令？

可以通过 NBT 设置方块。方块 NBT 包含 `name` 和 `states` 字段（SNBT 形如 `{"name":"minecraft:xxx","states":{...}}`），可先对任意方块调用 `block.getNbt().toSNBT()` 查看结构，再构造对应的 `NbtCompound`（例如 `NBT.parseSNBT(...)`）传给 `mc.setBlock(pos, nbt)` 设置。

## LSE 脚本中 `mc.getBlock(pos).isAir` 经常报错（例如玩家传送/进服时），怎么修？

`mc.getBlock` 在维度不存在、高度越界或区块未加载时会返回 `null`，需先判空再访问属性，例如：

```js
let block = mc.getBlock(packetPos.add(0, 1, 0));
if (block && block.isAir) break;
```

或使用可选链：`mc.getBlock(...)?.isAir`。

## 在 LSE JS 插件中构造坐标时，和 C++ 的 `Vec3` 写法一样只传 x,y,z 就行吗？为什么设置方块没有效果？

不行。C++ 的 `Vec3` 没有维度，但 LSE 的 `IntPos`/`FloatPos` 必须带维度 ID，需写成 `new IntPos(x, y, z, dimid)`（0 主世界、1 下界、2 末地），否则坐标不完整，用它调用 `mc.setBlock` 等操作会出问题。

## 在 LSE JS 插件里，如何让指定方块被破坏时不产生掉落物？

可以拦截破坏事件后用方块对象的 `destroy` 方法手动破坏方块，并传入 `false` 表示不生成掉落物：`bl.destroy(false)`。参数 `drop` 表示是否生成掉落物，返回是否成功破坏。

## 如何获取存档名称？LSE（JS）有相关 API 吗？

LSE 没有直接提供获取存档名称的 API。JS 中可以读取 `server.properties` 获取 `level-name`：

```js
let levelname = /level-name=(.*)/.exec(File.readFrom('./server.properties'))[1];
```

但注意这得到的是 `worlds` 下的存档文件夹名（路径），与存档内部显示的名称不一定相同；做备份等需要路径的场景用它就够了。C++ 原生 mod 可以通过 Level 的 `LevelData` 获取存档名。
