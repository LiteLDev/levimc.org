# LeviLamina 模组的报错与崩溃

## 在 LeviLamina mod 中从子线程/线程池（`ThreadPoolExecutor`、`std::thread`、定时器线程）调用 MC API 或发包（如 `forEachPlayer`、`sendPacket`、`TextPacket`），导致崩服或客户端提示“服务器发送了破损的数据包”，怎么处理？

BDS 的游戏逻辑和发包都不是线程安全的（内部无锁，多线程同时写发送队列会崩溃），所有 MC/BDS API（包括 `sendPacket`，即使是 `TextPacket`）都必须在服务器主线程调用；这是 mod 自身的问题，LeviLamina 不会“修复”。

做法：耗时工作可以放线程池，但涉及 MC API 的部分要切回主线程，例如：

```cpp
ll::thread::ServerThreadExecutor::getDefault().execute([]{ ... });
```

或用协程：

```cpp
ll::coro::keepThis([]() -> ll::coro::CoroTask<> { co_await 20_tick; ... }).launch(ll::thread::ServerThreadExecutor::getDefault());
```

协程是否在主线程取决于 `launch` 时使用的 Executor：只有 `ServerThreadExecutor` 是主线程，`ThreadPoolExecutor` 不是。

定时/周期任务按 tick 来做（1 tick = 50ms），不要高频（如 1ms）发包：客户端不会以更高频率处理，RakNet 在高频发包下不稳定，容易被判为破损数据包；高精度音乐播放可改用资源包内置 ogg，或转换为按 tick 播放的格式（如 nbs）。另外 addon 不能发包，出现破损数据包时应排查原生 mod。

LeviOptimize 曾提供的多线程发包优化（PacketSenderOpt）已移除，现在不能依赖它在非主线程发包；若确需在其他线程发送，只能先在主线程外用 `Packet::write` 序列化成二进制流再通过自带加锁的第三方接口（如 GMLIB 的二进制流发包）发送，属于第三方方案。

*适用版本：LeviLamina 1.0 及以上（当前 v26.60.8）；主线程限制适用于所有版本*

## 自己写的 LeviLamina C++ mod 构建成功，但运行时让 BDS 崩溃（时而内存访问错误、时而除以 0），控制台看不到有用的报错，怎么定位到自己代码里的出错位置？

用调试器而不是到处加 logger 猜：

1. 先正常启动 `bedrock_server_mod.exe`，再用 Visual Studio“调试 → 附加到进程”（或 VSCode cppvsdbg attach、WinDbg）附加；需要捕获启动早期的崩溃时，先 `set PL_DEBUG=1` 再启动，让 PreLoader 等待调试器附加。不要用调试器直接启动 `bedrock_server_mod.exe`，新版 LeviLamina 下会失败。
2. 异常发生时调试器会断在出错位置；没直接指到你的代码时，顺着调用堆栈往上找到自己 mod 的帧，查看变量。也可以在可疑代码处打断点单步调试。
3. 要看到源码需要 mod 对应的 pdb（模板默认 `set_symbols("debug")` 会生成）。
4. 不挂调试器时，LeviLamina 内置的 CrashLogger 会在崩溃时输出堆栈，如果是自己的 mod，堆栈里的函数名一般能直接对应到代码位置（若 CrashLogger 初始化时就已挂着调试器，如 `PL_DEBUG=1` 方式，CrashLogger 不启用）。

*适用版本：LeviLamina 1.2.0 及以上（含当前 26.x）；思路适用于所有版本*

## 关服时出现提示某插件（如依赖 GMLIB 的插件）无法 disable / failed to disable，会导致崩服吗？

不会。关服时 LeviLamina 按加载顺序的逆序逐个 disable mod；disable 某个 mod 时若仍有未禁用的 mod 依赖它，会返回错误“`{0} still depends on {1}`”；mod 的 `disable()` 返回 `false` 时返回“`The mod cannot be disabled`”。这些错误在 `disableAllMods` 中只以 Warn 级别打印日志，不影响正常关服。若真的崩服，是别的原因（如某 mod 关闭时的代码），应安装 CrashLogger 定位。

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina C++ mod 在方块破坏等事件中延迟执行逻辑时，拿到的方块坐标随机乱跳、按坐标取到的方块是空气，是什么原因？

延迟执行的回调/协程里引用了事件对象中的数据（例如捕获了 `ev.pos()` 的引用或 `ev` 本身），事件回调返回后这些对象已被销毁，回调执行时读到的是悬垂数据。延迟执行时必须把需要的值（`BlockPos`、维度 id 等）按值拷贝/捕获后再传入，例如 `[pos = BlockPos(ev.pos()), dim = ...]` 或在协程中先拷贝到局部变量，而不是捕获引用。当前版本的延时一般使用 `ll::coro`（如 `ll::coro::keepThis([=]() -> ll::coro::CoroTask<> { co_await std::chrono::seconds(1); ... }).launch(ll::thread::ServerThreadExecutor::getDefault());`），同样要按值捕获。

## LeviLamina mod 中事件监听崩溃，崩溃位置在 `isCancelled()` 附近，异常码 `0xC0000005`，看起来像空指针，原因是什么？

常见原因是用 `EventIdView` 构造事件 id 时传入了临时 `std::string`（如 `fmt::format` 的返回值）：`EventIdView` 内部只持有 `std::string_view`，语句结束后临时字符串被销毁，view 悬空（UB，测试时不一定能复现）。解决：改为返回/持有 `ll::event::EventId`（它持有 `std::string`，可隐式转换成 `EventIdView`），或保证源字符串的生命周期覆盖使用期间。另外 `0xC0000005` 是 `EXCEPTION_ACCESS_VIOLATION`，不一定是空指针：`ExceptionInformation[0]` 为读写标志（0 读、1 写、8 DEP），`[1]` 为不可访问的地址；由于内联优化，dmp 中定位的行可能偏到相邻语句。

*适用版本：LeviLamina 1.x 及以上（含 26.60.x）*

## LeviLamina mod 中写 `auto* bs = dynamic_cast<BedrockSpawner*>(&ll::service::getLevel()->getSpawner());` 导致崩溃（`vcruntime140.dll` `0xC0000005` 访问冲突），为什么？

BDS（Windows 版）编译时没有可用的 RTTI 信息，对 BDS 内部类型使用 `dynamic_cast` 会失败（返回 `nullptr` 或直接在 vcruntime 中崩溃）。`getSpawner()` 返回 `Spawner&`，取地址本身没问题；应改用 `static_cast`：`auto* bs = static_cast<BedrockSpawner*>(&ll::service::getLevel()->getSpawner());`（需自行确保实际类型就是 `BedrockSpawner`）。

*适用版本：LeviLamina 26.x（Windows BDS）。未能从源码或文档中直接证实，仅供参考。*

## hook 了某个 BDS 函数（例如活塞的红石更新函数），参数是无效地址导致崩溃，而同类其他方块的同名 hook 却正常，为什么？

检查该函数在 LeviLamina 头文件中是否标记为 `MCFOLD`。`MCFOLD` 表示该函数被编译器做了相同 COMDAT 折叠（Identical COMDAT Folding），其地址与其他函数共享，hook 它会同时拦截到多个不同函数的调用，参数可能根本不是预期类型。`MCFOLD` 函数仍可调用/hook，但 hook 时需要自行判断调用来源（如检查 `this` 的实际类型/方块类型）和参数有效性（必要时可用 Windows API `IsBadReadPtr` 检查指针可读性）；更好的做法是改 hook 一个未被折叠的上层/下层函数。

## 把服务端 mod 移植到 LeviLamina 客户端后，hook 里的代码运行异常/崩溃（异常在 MINECRAFT MAIN THREAD），怎么处理？

一般是 hook 的点位在非 `MC_SERVER` 线程触发了（客户端还有主线程、渲染线程等）。绝大多数服务端侧 MCAPI 只能在 `MC_SERVER` 线程调用，需要在 hook 中先判断当前线程是否为服务端线程再执行服务端逻辑。可参考 LegacyScriptEngine 的 `lse::api::thread::isServerThread()`：`auto instance = ll::service::getServerInstance(); return instance && std::this_thread::get_id() == instance->mServerInstanceThread->get_id();`，其事件实现（如 `src/lse/events/BlockEvents.cpp`）在回调中先 `if (isServerThread())` 再处理。另外拿到的 `BlockSource` 可能属于客户端世界，应先用 `blockSource.getLevel().isClientSide()` 判断（`BlockSource` 本身没有 `isClientSide()`，需经 `Level`/`ILevel`），客户端侧的 `BlockSource` 不要做 `removeBlock` 等服务端操作（客户端的 `playerDestroy` 也不会生成掉落物）。

*适用版本：LeviLamina 客户端版*

## 自己编译的 LeviLamina mod 在事件监听中报错（如 `Error in Listener<ll::event::world::BlockChangedEvent>`）而官方 tests 无法复现，应该检查什么？

先检查 mod 是否使用了 LeviLamina 的内存分配器（mimalloc）：官方模板在 `src/mod/MemoryOperators.cpp` 中 `#include "ll/api/memory/MemoryOperators.h"`，缺少它会导致跨 DLL 分配/释放不一致而崩溃。若仍有问题，删除项目中的旧 `.xmake` 缓存目录（以及 `build` 目录）后重新 `xmake f` 配置并构建，避免旧依赖/旧头文件残留。
