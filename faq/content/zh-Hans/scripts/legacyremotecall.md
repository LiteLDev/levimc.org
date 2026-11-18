# LegacyRemoteCall

## C++ mod 用 LegacyRemoteCall（`RemoteCall::exportAs`）导出函数给 LSE 脚本时，参数/返回值用 `std::variant` 编译失败，报 `static_assert` "Unsupported Type"，怎么办？

RemoteCall 的参数/返回值只支持一组固定类型（`bool`、`std::string`、`nullptr_t`、整数/浮点数（`NumberType`）、`Player*`/`Actor*`/`BlockActor*`/`Container*`、坐标（`WorldPosType`/`BlockPosType`）、`ItemType`、`BlockType`、`NbtType`，以及由这些类型组成的 `std::vector` 和 `std::unordered_map<std::string, T>`），不支持 `std::variant`，所以会触发 `static_assert(is_supported_type_v<...>, "Unsupported Type")`。

解决办法：把参数换成受支持的类型，最简单的是把数据序列化成 JSON 字符串（`std::string`）传递，接收方再解析；也可以自己写模板为 variant 做类型转换（理论可行，但较麻烦）。

另外数字传给 JS 时按 double 转换（LSE 中 `Number::newNumber(v.get<double>())`），`long long` 这类大整数可能丢精度，必要时用字符串传递。

*适用版本：LegacyRemoteCall 当前所有版本（至 0.23.x）*

## LeviLamina 下 C++ mod 如何把接口公开给其他插件（尤其是 LSE 的 JS 脚本插件）调用？

使用 LegacyRemoteCall（RemoteCall）：在 C++ mod 中用 `RemoteCall::exportAs("命名空间", "函数名", 函数)` 导出函数，JS 侧用 `ll.imports("命名空间", "函数名")` 导入后调用（JS 自己导出则是 `ll.exports(func, "命名空间", "函数名")`，注意函数在第一个参数）（可先用 `ll.hasExported` 判断是否存在）。导出方式可参考 GMLIB-LegacyRemoteCallApi（LRCA），命名空间/函数名建议用类似 `Actor.getName` 这样易辨认的形式。纯原生 mod 之间也可以直接用 `dllexport` 导出函数互相调用。LeviLamina 本体不内置 RemoteCall，它由单独的 LegacyRemoteCall 模组提供（LSE 依赖它）。此外也可以用网络通信等方式对接。

*适用版本：LeviLamina 当前版本；LegacyRemoteCall 当前版本；LSE 当前版本*

## LSE 中用 `ll.exports` 导出的异步函数，别的插件通过 `ll.imports` 导入后能否 await 拿到异步返回值？

不能。远程调用（`ll.exports`/`ll.imports`）是同步执行的：被调函数的返回值会立即被打包（转换成 `RemoteCall::ValueType`）返回给调用方，Promise 不会被跨插件传递，调用方无法 await 得到异步结果；被调函数如果阻塞，会连带阻塞服务器主线程。需要异步结果时要换别的方式，例如由对方完成后再调用你导出的另一个函数、写入数据库/文件或通过事件通知。

*适用版本：LSE 当前所有版本*

## LSE 插件中用 `ll.imports("命名空间", "函数名")` 调用其他插件导出的函数时报错（如函数未导出），如何先判断该导出函数是否存在？

使用 `ll.hasExported(namespace, name)` 先检查对应函数是否已被导出，再调用 `ll.imports` 获取的函数（未导出时调用会报 `Fail to import! Function [ns::name] has not been exported`）。另外 RemoteCall 的参数必须可转换，不能把函数（`kFunction`）或 `ByteBuffer` 当作参数传过去，否则会抛 `Unsupported Type`。排查时可在每一步加 logger 输出并用 `typeof` 检查返回值。

*适用版本：LSE 当前所有版本*

## LeviLamina 下的 RemoteCall（`ll.exports`/`ll.imports` 跨插件调用）支持哪些参数类型？能传 Player、方块、物品等对象吗？

可以。当前 LegacyRemoteCall + LSE 支持：null、字符串、数字、布尔、数组、普通对象（按键值递归转换），以及 Player、Entity、Item、Block、BlockEntity、Container、FloatPos、IntPos、NbtCompound 等游戏对象。不支持函数和 `ByteBuffer`。若对方是不认识这些类型的插件，也可以改传 uuid/xuid、坐标 JSON、SNBT 字符串等。

*适用版本：LSE 0.x 正式版及以后*

## RemoteCall（LegacyRemoteCall）导出/调用的函数参数可以使用 `std::pair` 类型吗？

只支持特定的 `std::pair`：`std::pair<Vec3, int>`（会转换为 `WorldPosType`，对应 JS 的 FloatPos，坐标+维度 ID）和 `std::pair<BlockPos, int>`（转换为 `BlockPosType`，对应 IntPos）。GMLIB-LegacyRemoteCallApi 中坐标参数就是这样传的。任意类型的 `std::pair`（如 `std::pair<std::string, int>`）不受支持，会触发 `Unsupported Type` 编译错误。

*适用版本：LegacyRemoteCall 当前所有版本*

## LSE 中看到的 `LLSEGlobal` 是什么？

使用 `ll.exports` / `ll.imports` / `ll.hasExported` 时如果没有指定命名空间（只传函数名），会自动使用默认命名空间 `LLSEGlobal`。

*适用版本：LSE 当前所有版本*

## LegacyRemoteCall（RemoteCall）是什么，用来解决什么问题？新 mod 应该依赖它吗？

LegacyRemoteCall 用来导出函数供跨插件调用，主要方便 LSE 的 JS/Lua 插件调用 C++ mod 导出的函数（`ll.exports`/`ll.imports` 的底层）。它是 LegacyScriptEngine 的配套组件（LSE 依赖它），定位是兼容旧 LLSE 生态。维护者建议新的原生 mod 不要强制依赖 RemoteCall，如需给脚本提供接口，可另写一个可选的外置模块来导出。

*适用版本：当前版本（LegacyRemoteCall 0.23.x）*

## 旧 LLSE 中跨插件导入导出函数（`ll.export`/`ll.import`）在 LeviLamina 里由哪个模块实现？插件加载顺序/依赖又该如何声明？

在 LL2 中由 LL 本体和 ScriptEngine 提供；在 LeviLamina 中由 LegacyRemoteCall（<https://github.com/LiteLDev/LegacyRemoteCall>）和 LSE 共同提供：函数表在 LegacyRemoteCall（保存 `std::function<ValueType(std::vector<ValueType>)>`），脚本侧 `ll.exports`/`ll.imports` 定义在 LSE（`ll.export`/`ll.import` 为兼容别名）。LeviLamina 采用模块化设计，插件依赖/加载顺序在 `manifest.json` 中声明：`dependencies`（必需依赖），另有 `optionalDependencies`、`loadBefore`、`conflicts` 等字段。

*适用版本：LeviLamina 当前版本；LSE 当前版本*

## 装了 GMLIB-LegacyRemoteCallApi 后依赖 GMLIB 的插件仍报缺少前置，怎么办？

GMLIB 与 GMLIB-LegacyRemoteCallApi 不是同一个东西（后者只是给 LSE 脚本插件用的 RemoteCall 接口层），需要另外安装 GMLIB 本体：<https://github.com/GroupMountain/GMLIB-Release>，或在服务器根目录执行 `lip install github.com/GroupMountain/GMLIB-Release`。

*适用版本：使用 GMLIB 的 LeviLamina 服务器*

## 升级后 LSE 的 nodejs 等支持库装不上/加载报错，提示 LegacyRemoteCall 相关问题怎么办？

这是 LegacyRemoteCall 与 LegacyScriptEngine / LeviLamina 版本不匹配导致的，需要让三者配套。当前 LSE 的 `lip.toml` 已把 LegacyRemoteCall 声明为依赖（如 LSE 0.23.x 依赖 LegacyRemoteCall 0.23.*，LeviLamina 26.60.*），用 lip 安装/更新时会自动拉取匹配版本：用 `lip update`（或 `lip update github.com/LiteLDev/LegacyScriptEngine`）更新包；要更换 LeviLamina 本体版本则用 `lip setup`。手动安装时请务必一起替换 LegacyRemoteCall。命令以当前 lip 为准。

## 用 RemoteCall 导出函数/事件给 LSE 调用时，能调用但报错 `bad variant access`，是什么原因？

`bad variant access` 表示参数/返回值的实际类型与 `RemoteCall::exportAs` / `importAs` 声明的类型不匹配（内部用 `std::get` 从 `std::variant` 取值，类型不符时抛出 `std::bad_variant_access`）。检查 JS 侧传入的类型与 C++ 导出函数签名是否一致。基础数值类型（以及 `WorldPosType`、`BlockPosType` 转换类型）的参数不要声明为引用（`int&` 或 `const int&` 都不行），改为按值传递；新版 `RemoteCallAPI.h` 对从 `NumberType` 等转换中提取引用加了 `static_assert`，这种写法会直接编译报错（0.21.1 起引用参数会在编译期报错）。

*适用版本：LegacyRemoteCall 当前版本*

## GMLIB 能正常加载，但 GMLIB-LegacyRemoteCallApi（LRCA）加载失败，是什么原因？

通常是版本不配套：GMLIB、GMLIB-LegacyRemoteCallApi、LegacyRemoteCall、iListenAttentively、LegacyScriptEngine 与 LeviLamina 本体版本不匹配。把 LeviLamina 及所有相关依赖一起更新到相互匹配的版本，一个也不能漏。当前 LRCA 的 manifest 声明依赖 GMLIB、LegacyRemoteCall、iListenAttentively、ModAPI，缺任一或版本不对都会导致加载失败；另外 LRCA 是 passive 模组，只有当有其他模组/脚本插件声明依赖它时才会被加载。

## 加载插件时报错 `[GMLIB-LegacyRemoteCallApi] setUnknownBlockCleaner is not implemented`，GMLIB 的清理未知方块 API 怎么了？

GMLIB 的 `setUnknownBlockCleaner`（清理未知/错误方块）功能已被移除，LRCA 中只保留了一个空壳导出，调用时输出 `setUnknownBlockCleaner is not implemented`，依赖它的插件该功能无法生效。需要清理未知方块请改用 GMEssentials（GME）：<https://github.com/GroupMountain/GMEssentials-Release/>

*适用版本：GMLIB-LegacyRemoteCallApi 当前版本*

## LSE 插件调用 GMLIB 等通过 GMLIB-LegacyRemoteCallApi 导出的接口（例如 `translateString`）失效，明明已经装了 LegacyRemoteCallApi，为什么？

GMLIB-LegacyRemoteCallApi 是 passive 模组，只有当有其他模组/插件依赖它时才会被加载。需要在你的插件 `manifest.json` 的 `dependencies` 中声明它，例如：

```json
"dependencies": [{ "name": "GMLIB-LegacyRemoteCallApi" }]
```

依赖项的 `version` 字段可以省略（省略时匹配任意版本），写了则是版本范围约束。
