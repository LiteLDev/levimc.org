# LeviLamina 模组 API：线程、调度与生命周期

## C++ mod 的 `unload` 应该怎么写？levilamina-mod-template 里被注释、带 TODO 的 `unload` 需要取消注释吗？

模板里的 `unload()` 默认被注释，TODO 的意思是需要支持卸载时才自己实现。没把握就保持注释（不实现 `unload`），这样 LeviLamina 会拒绝卸载该 mod（提示 `The mod does not register an unload function`），对正常运行没有影响；也可以实现后直接 `return false` 拒绝卸载。若要支持 unload：卸载时 DLL 会被释放，可能不执行 `atexit` 并强制结束线程，所以所有线程要用线程池并在析构时 join，不要使用需要清理的全局变量，把状态都放在 mod 对象里，在 `unload` 中自行释放所有资源，否则会崩溃。事件监听在禁用/卸载时由 LeviLamina 自动移除，命令会被自动禁用。

*适用版本：LeviLamina 0.9 及以上（当前所有版本）*

## LeviLamina 有没有直接获取服务器 TPS/MSPT 的 API？想在 mod 里常驻显示 MSPT/TPS，需要自己 hook tick 吗？怎么算？

LeviLamina 没有直接提供 TPS/MSPT API，但也不需要自己 hook tick。旧版的 `ll::schedule`（`GameTickScheduler` / `ServerScheduler`）已被移除，现在用协程：在服务器线程执行器 `ll::thread::ServerThreadExecutor::getDefault()` 上跑一个循环，每次 `co_await 1_tick`（`ll::chrono::ticks`）后记录时间，相邻两次的时间差即 MSPT，TPS = 1000 / MSPT（超过 20 按 20 计）；或者用全局 tick 计数器 + 另一个每秒执行一次的协程取差值得到每秒 tick 数。

协程用法可参考仓库 `src-test/common/ExecTest.cpp`。BDS 自身也有计时数据，可参考 `src/mc/profile/ProfilerLite.h` 中的 `ProfilerLite`。也可使用第三方前置（如 GMLIB）的 TPS 接口。

*适用版本：LeviLamina 1.x 至当前版本（26.60.x）*

## LeviLamina C++ mod 使用协程时，卸载/disable mod 导致服务端卡死或崩溃，如何正确停止协程、打断协程里的长时间 sleep？用 lambda 写协程时 lambda 析构导致崩溃怎么办？

要保证 mod 卸载前协程都已结束。做法：

1. 给 mod 单独创建一个执行器（如 `ll::thread::ThreadPoolExecutor`），自己的协程都挂在它上面，disable 时销毁它。
2. 在协程循环中检查停止标志（如类成员 `bool` / `std::atomic<bool>`）以及 `ll::getGamingStatus()`，每次 `co_await` 返回后检查，需要停止就 `co_return`。
3. 长时间 sleep 用可打断的等待：旧的 `ll::coro::InterruptableSleep` 已移除，改用 `ll::coro::ConditionVariable`（`ll/api/coro/ConditionVariable.h`）——把它放在类成员里，协程中 `co_await cv.waitFor(时长, [&]{ return stop; })`，disable 时置位标志并调用 `cv.notifyAll()`（确定在服务器线程上打断服务器线程的协程时可传 `inplace=true`）。

注意 `this` 可能先于协程析构，可让实现对象用 `shared_ptr` 并让协程也持有一份。用 lambda 写协程时，若 lambda 先析构协程会崩溃，可用 `ll::coro::keepThis` 把 lambda 拷贝进协程。另外 `ll::coro::CallbackTransformer` 可把回调转为协程等待。

参考实现：<https://github.com/GroupMountain/GMSidebar/blob/develop/src/Sidebar.cpp>

*适用版本：LeviLamina 26.60.0 及以上（`ConditionVariable`）；`keepThis`、执行器、状态检查方案适用于 1.x 起所有版本*

## C++ mod 如何“可选依赖”另一个 mod（如 GMLIB）：不直接链接它，存在时才调用其导出函数？为什么 `GetProcAddress` 按函数名总取不到？LSE 脚本能调用吗？

做法：导出方用 `__declspec(dllexport)` 导出函数；调用方运行时用 `GetModuleHandleA` 获取对方模块句柄（取不到即视为未安装，跳过相关功能），再用 `GetProcAddress` 取函数指针。

C++ 函数有名称修饰（name mangling，clang-cl 与 MSVC 使用同一套修饰规则），导出表里的名字是 `?xxx@@...` 这类修饰名，需要用 `dumpbin /exports`（或 `llvm-objdump`）查看完整修饰名传给 `GetProcAddress`；若导出方由你自己控制，可用 `extern "C"` 导出避免修饰。不推荐用基址+RVA 硬编码。正常开发更推荐直接引入对方的包调用。

LSE 脚本插件要调用 C++ 接口需要通过 RemoteCall（LegacyRemoteCall）等方式加依赖，不想加依赖只能让对方执行命令（`mc.runcmd`）。

## C++ mod 中在 load 阶段调用 `ll::service::getLevel()` 然后 `static_cast<ServerLevel&>` 调用 `getNewUniqueID()`，出现 `0xC0000005` 空指针崩溃，如何正确获取 `Level`？

`Level` 要等 BDS 读完存档后才存在，而 mod 的 `load()` 在打开存档之前执行，此时 `ll::service::getLevel()` 返回空的 `optional_ref`。应先判断 `getLevel()` 是否有值，并把相关逻辑放到 `enable()` 阶段（或之后的事件）中执行：LeviLamina 在服务器线程启动（`ServerScriptManager::onServerThreadStarted`）后才调用 `enableAllMods`，此时 `Level` 已就绪。

*适用版本：当前版本（服务端）*

## C++ mod 中有异常连 `try/catch` 都拦不住（例如访问违例），该怎么捕获？

访问违例这类是 Windows SEH 结构化异常，`catch (std::exception&)` 之类的类型化 catch 捕获不到。可靠的做法是用 `__try/__except`（MSVC 与 clang-cl 都支持；`__try` 所在函数里不要有需要析构展开的 C++ 对象，也不能与 C++ `try` 混用，可把危险调用包进一个单独的小函数）。

注意：官方 mod 模板的 `xmake.lua` 虽然加了 `/EHa`，但它用 clang-cl 工具链，并且随后又为 `clang_cl` 追加了 `/EHs`，所以不要指望 `catch (...)` 一定能接住 SEH 异常。对能被 catch 到的 C++ 异常，可以用 `ll::error_utils::printCurrentException(logger)`（`ll/api/utils/ErrorUtils.h`）打印。不过访问违例通常说明代码本身有问题，应修复根因，而不是靠捕获继续运行。

*适用版本：Windows 平台 LeviLamina mod（MSVC）*

## LeviLamina C++ mod 中 `ll::memory::dAccess` 怎么用？怎么按偏移取类成员（例如从 `Minecraft` 对象中拿 `mSimTimer`）？

`dAccess` 的模板参数填成员类型，第一个参数填对象地址，第二个参数填字节偏移：`ll::memory::dAccess<T>(ptr, offset)`，返回 `T&`。注意 IDA 中显示的 `this+27` 这类偏移若以 QWORD（8 字节）为单位，字节偏移要乘 8（27*8 = `0xD8`）；若该位置存的是指针，模板类型要写成指针类型再解引用。偏移只能加一次，重复相加会导致 `0xC0000005` 访问冲突。偏移与游戏版本相关，不能跨版本照搬。

另外，当前 LeviLamina 头文件中 `Minecraft` 已直接以 `TypedStorage` 形式声明了成员 `mSimTimer`（`Timer&`），可直接通过 `minecraft.mSimTimer` 访问而无需手算偏移；调整 tick 速率可用 `Minecraft::setSimTimeScale`，或直接改 `Timer` 的 `mTimeScale`。

*适用版本：当前版本（偏移值随游戏版本变化）*

## LeviLamina C++ mod 中如何输出日志？`std::cout` 似乎没有输出。

服务端 `std::cout` / `print` / `fmt::print` 都能输出，但推荐使用 mod 自己的 `ll::io::Logger`：

```cpp
ll::io::Logger& logger = MyMod::getInstance().getSelf().getLogger();
logger.info("...");
```

其中 `MyMod` 是你自己的 mod 主类（模板中 `getSelf()` 返回 `ll::mod::NativeMod&`）。客户端需要开启控制台（终端）窗口才能看到输出。

## LeviLamina C++ mod 中能否修改服务器 TPS（加速/减速/暂停游戏刻）？

可以。`Minecraft` 对象内部有模拟计时器（`mSimTimer`，类型 `Timer&`，`Timer` 含 `mTimeScale`），并提供虚函数 `setSimTimeScale(float scale)` 和 `setSimTimePause(bool pause)`，可用来加快、减慢和暂停游戏刻，例如 `ll::service::getMinecraft()->setSimTimeScale(2.0f);`（`getMinecraft()` 返回 `optional_ref<Minecraft>`，使用前判断有效）。

有用户反馈原版对倍率有限制（约 0.1 倍到 10 倍），想突破需要自行修改 `Timer` 相关逻辑。也可以手动循环调用 `ll::service::getLevel()->tick()` 强制多跑 tick，但不推荐。

*适用版本：当前版本（服务端）*

## LeviLamina C++ 插件如何支持热卸载/重载？如何在 hook 函数外部取消 hook？

原生 mod 要支持热卸载/重载（如 `ll unload` / `ll reload`），必须自己实现 unload：使用 `LL_REGISTER_MOD` 时在 mod 类中提供 `bool unload()` 即会被注册，否则 LeviLamina 会报错 `The mod does not register an unload function`，只能在关服时卸载。

用 `LL_AUTO_TYPE_INSTANCE_HOOK` 等 hook 宏时会定义一个 hook 类名，在 unload（或 disable）中直接调用该类的 `unhook()`（如 `MyHook::unhook()`）即可在函数外取消 hook；非 `AUTO` 的宏需要手动调用 `MyHook::hook()` / `MyHook::unhook()`。此外智能指针、`new` 出来的内存、`std::function`、线程、事件监听等的生命周期都要在 unload 中处理干净，否则卸载会崩溃；不会处理就不要写 unload。

## LeviLamina C++ 插件必须定义 `load`/`enable`/`disable`/`unload` 这几个函数吗？`DllMain` 还能用吗？

当前版本使用 `LL_REGISTER_MOD(类, 实例)` 注册时，只有 `bool load()` 是必须的（有 `static_assert` 检查）；`enable`、`disable`、`unload` 都是可选的，提供了才会被注册。没有 `disable` 时禁用会直接成功；没有 `unload` 时该 mod 不能被热卸载（`ll unload` / `reload` 会报 `The mod does not register an unload function`），只能随关服卸载，而且除非很熟悉 C++ 生命周期管理，否则别写 `unload`。

`DllMain` 仍会被调用但不建议使用，因为时机太早：`DllMain` 阶段 LL API 不保证可用，`load` 阶段游戏 API 不保证可用，`enable` 阶段两者才都可用。作为 LL mod 应以 `load` 为入口点，否则就相当于 PreLoader 插件了。

## LeviLamina mod 中不用 `getSelf().getLogger()` 的话，怎么创建一个 logger？

当前版本 `ll::io::Logger` 的构造函数是私有的（`PrivateTag`），不能再直接 `ll::Logger logger("MyMod");` 构造。应通过日志注册表获取/创建：

```cpp
auto logger = ll::io::LoggerRegistry::getInstance().getOrCreate("MyMod");
```

它返回 `std::shared_ptr<ll::io::Logger>`，之后用 `logger->info("...")` 输出。也可以继续用 `getSelf().getLogger()`（返回 `ll::io::Logger&`）。

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina mod 中有一个涉及文件操作、不希望被拷贝的全局对象，把它传给 `cmd.overload().execute(lambda)` 和 `eventBus.emplaceListener<Event>(lambda)` 的 lambda 使用时，需要用 `std::ref` 吗？

不需要。全局（静态存储期）对象在 lambda 里可直接使用，无需捕获；局部对象可用引用捕获 `[&obj]`，都不会产生拷贝。`std::ref` 不是用于 lambda 捕获的工具。只需保证对象生命周期长于回调（命令/监听器存在期间）即可。可通过把拷贝构造设为 `delete`/`private` 验证确实没有拷贝。这是 C++ 语言规则，与 LeviLamina 版本无关。

*适用版本：所有版本*

## LeviLamina native mod 中 `load`、`enable`、`disable`、`unload` 这几个生命周期函数的调用顺序和区别是什么？

调用顺序为 `load` -> `enable` -> `disable` -> `unload`。用 `LL_REGISTER_MOD` 注册的 mod 类只有 `load()` 是必须实现的（`bool load()`），`enable`/`disable`/`unload` 都是可选的（实现了才会绑定）。服务器已在运行时加载 mod，`load` 成功后会立即调用 `enable`；热卸载（`unload`）时会先调用 `disable`，再调用 `unload`。当前版本为 v26.60.8。

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina 模组中用 logger 输出时如何拼接参数？

LeviLamina 的 logger（`ll::io::Logger`）的 `info`/`warn`/`error`/`debug` 等都支持 fmt 风格格式化，可直接写 `getSelf().getLogger().info("检查到玩家 {} 加入服务器!", ev.self().getRealName());`，无需手动拼接字符串。变量可以用 `auto` 推断，如 `auto& player = ev.self();`。

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina 的 `logger.info` 输出包含换行符的多行文本时，后续行没有时间前缀，该怎么处理？

`Logger` 每次调用只格式化一条消息，按模式在整条消息前加一次时间/级别/标题前缀，字符串内部的换行不会补前缀。需要每行都有前缀时，先按行拆分（例如 `std::istringstream` + `std::getline`，或 `ll::string_utils::splitByPattern`）再逐行调用 `logger.info`。适用于 `ll::io::Logger`。

*适用版本：所有版本*

## LeviLamina 的协程能利用多核 CPU 吗？

可以。协程本身不决定在哪个线程执行，由启动或恢复它的 Executor 决定。LeviLamina 提供了 `ll::thread::ThreadPoolExecutor`（继承 `ll::coro::Executor`，可指定线程数，也有 `ThreadPoolExecutor::getDefault()`），通过 `task.launch(executor)` 把 `ll::coro::CoroTask` 放到线程池上执行即可利用多核。需要回到主线程操作游戏对象时，使用 `ll::thread::ServerThreadExecutor`。注意 BDS 的游戏 API 大多不是线程安全的。

*适用版本：LeviLamina 1.x 及以上*

## 一个 mod DLL 同时用于客户端和服务端时，如何判断当前是在客户端还是服务端加载？

用 `ll/api/Versions.h` 中的 `ll::isClient()` 判断 mod 是被客户端还是服务端加载。

若在客户端里还需区分是本地世界（房主，内置服务端在运行）还是作为普通玩家进入远程服务器：`Level::isClientSide` 不可靠，可以用 `ll::service::getMinecraft()`（默认取服务端实例，`isClientSide=false`）或 `ll::service::getServerInstance()`。能拿到即存在本地服务端逻辑，拿不到则只是客户端连接远程服务器。

*适用版本：LeviLamina 1.9 及以上（含客户端支持的版本）*

## 使用 LeviLamina 的协程（`ll::coro`）时，`co_await 1s` 竟然让主线程阻塞了一秒，是怎么回事？应该如何正确启动协程？

原因是用了 `syncLaunch`（照抄了 test 代码）。`syncLaunch` 会在当前线程上阻塞等待协程结束并返回结果。

正常启动协程用 `CoroTask::launch(executor)` 即可，它是异步的；`launch` 还有带回调的重载 `launch(executor, callback)` 用于获取返回值（无回调版本默认传 `[](auto&&){}`）。只有确实需要同步等待结果时才用 `syncLaunch`。

*适用版本：LeviLamina 1.0 及以上*

## 在 C++ mod 中使用延迟任务（定时/延迟执行）时，回调 lambda 不执行或行为异常，可能是什么原因？

检查 lambda 的捕获方式：延迟任务会在之后才执行，若用引用捕获 `[&]` 捕获了局部变量，执行时这些变量已经销毁，形成悬垂引用导致行为异常。改为值捕获（`[=]` 或显式按值捕获，必要时用 `shared_ptr` / `weak_ptr` 保活或判断对象是否仍存在）即可。

当前 LeviLamina 推荐用协程实现延迟任务，例如：

```cpp
ll::coro::keepThis([player = ...]() -> ll::coro::CoroTask<> {
    co_await 20_tick; // 或 co_await 1s;
    // ...
}).launch(ll::thread::ServerThreadExecutor::getDefault());
```

同样要注意 lambda 捕获的对象在 `co_await` 之后是否仍然有效（例如玩家可能已下线）。

*适用版本：当前所有 LeviLamina 版本（旧的 schedule/DelayTask API 已被 `ll::coro` 取代）*

## 在 LeviLamina 原生 C++ mod 里使用 cpp-httplib 启动 HTTP 服务（`listen 0.0.0.0`）后，玩家无法连接服务器、连 MOTD 都没有了，为什么？

因为在主线程调用了 `listen`。`httplib::Server::listen` 是阻塞调用，会卡住 BDS 主线程，导致服务器无法响应。应在单独线程（如 `std::thread`）里运行 `server.listen`，并在 mod disable/卸载时调用 `server.stop()` 并 `join` 线程；不要在主线程 `listen`。

## 照着 LeviLamina 官网指南复制示例代码写 mod，用 `self` 时编译报错，怎么改？

旧版指南里的 `self` 写法已经过时。请按当前模板的写法：`MyMod` 类在构造时保存 `ll::mod::NativeMod::current()` 返回的实例（成员 `mSelf`），再通过 `getSelf()` 取用，例如 `MyMod::getInstance().getSelf().getLogger().info("...")`。最省事的办法是直接用 `levilamina-mod-template` 新建项目。

*适用版本：LeviLamina 1.x 及以上*

## 服务器上某个（可能闭源的）mod 一直往控制台刷日志，能不能不改它的源码就屏蔽或过滤掉？LeviLamina 会内置这种功能吗？

LeviLamina 官方不会内置这种过滤（会有性能损失），需要自己写 mod 来做。当前日志系统下的做法：用 `ll::mod::ModManagerRegistry::getInstance().getMod("mod名")` 拿到该 mod，再通过它的 `getLogger()` 拿到 logger；如果对方是自己创建的 logger，就用 `ll::io::LoggerRegistry::getInstance().tryGet("logger 标题")` 获取。拿到 `ll::io::Logger` 后，可以 `setLevel(...)` 提高输出等级，也可以用 `setSink` / `removeSink` / `clearSinks` 替换或去掉它的 sink（比如换成自己实现的、带过滤的 sink）。旧日志系统里 hook `ll::OutputStream::print` 的办法已经不能用了。

*适用版本：LeviLamina 1.x 及以上（新日志系统 `ll::io::Logger`）*

## 自己写的第三方 mod 加载器（如 .NET loader）注册的 mod，用 LeviLamina 的查询 API 获取不到，怎么办？

只要按标准方式注册就都能获取到。实现一个继承 `ll::mod::ModManager` 的管理器并通过 `ModManagerRegistry::addManager` 注册；在 load 时调用 `addMod(name, mod)` 把 Mod 对象加入管理器，unload 时调用 `eraseMod(name)`。`ModManager` 才是 Mod 对象的所有者，LeviLamina 不会自动帮你管理。可参照 LeviLamina 自带的 `NativeModManager` 实现。之后即可通过 `ModManagerRegistry::getManagerForMod` / `ModManager::getMod` 等查询到。

*适用版本：LeviLamina 1.x 及以上（Plugin 已更名为 Mod）*
