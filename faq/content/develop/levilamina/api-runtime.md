# LeviLamina mod API: threads, scheduling and lifecycle

## How should I write `unload` in a C++ mod? Should I uncomment the commented-out `unload` with a TODO in levilamina-mod-template?

`unload()` is commented out in the template by default, and the TODO means you implement it yourself only if you need to support unloading. If unsure, leave it commented out (do not implement `unload`); LeviLamina then refuses to unload the mod (with `The mod does not register an unload function`), which does not affect normal operation. You can also implement it and simply `return false` to refuse unloading. To support unload: the DLL is released on unload, `atexit` handlers may not run and threads may be terminated forcibly, so use a thread pool for all threads and join them in destructors, avoid global variables that need cleanup, keep all state in the mod object, and release every resource yourself in `unload`; otherwise the server crashes. Event listeners are removed automatically by LeviLamina on disable/unload, and commands are disabled automatically.

*Applies to: LeviLamina 0.9 and later (all current versions)*

## Does LeviLamina have an API to get the server TPS/MSPT directly? To show MSPT/TPS permanently from a mod, do I need to hook the tick myself? How is it calculated?

LeviLamina has no direct TPS/MSPT API, but you do not need to hook the tick yourself either. The old `ll::schedule` (`GameTickScheduler` / `ServerScheduler`) has been removed; use coroutines now: run a loop on the server thread executor `ll::thread::ServerThreadExecutor::getDefault()`, record the time after each `co_await 1_tick` (`ll::chrono::ticks`), and the difference between two consecutive times is the MSPT; TPS = 1000 / MSPT (capped at 20). Alternatively, use a global tick counter plus another coroutine that runs once per second and takes the difference to get ticks per second.

For coroutine usage, see `src-test/common/ExecTest.cpp` in the repository. BDS also has its own timing data; see `ProfilerLite` in `src/mc/profile/ProfilerLite.h`. You can also use the TPS API of a third-party dependency mod (such as GMLIB).

*Applies to: LeviLamina 1.x up to the current version (26.60.x)*

## When a LeviLamina C++ mod uses coroutines, unloading/disabling the mod freezes or crashes the server. How do I stop coroutines correctly and interrupt a long sleep inside a coroutine? What if a coroutine written as a lambda crashes when the lambda is destroyed?

Make sure all coroutines have finished before the mod is unloaded. How:

1. Create a dedicated executor for the mod (such as `ll::thread::ThreadPoolExecutor`), attach all of your coroutines to it, and destroy it on disable.
2. In the coroutine loop, check a stop flag (such as a class member `bool` / `std::atomic<bool>`) and `ll::getGamingStatus()`, checking after every `co_await` returns, and `co_return` when it must stop.
3. For long sleeps, use an interruptible wait: the old `ll::coro::InterruptableSleep` has been removed; use `ll::coro::ConditionVariable` (`ll/api/coro/ConditionVariable.h`) instead. Keep it as a class member, `co_await cv.waitFor(duration, [&]{ return stop; })` in the coroutine, and on disable set the flag and call `cv.notifyAll()` (when you are sure you are interrupting a server-thread coroutine from the server thread, you can pass `inplace=true`).

Note that `this` may be destroyed before the coroutine; you can make the implementation object a `shared_ptr` and have the coroutine hold a copy too. When writing a coroutine as a lambda, the coroutine crashes if the lambda is destroyed first; use `ll::coro::keepThis` to copy the lambda into the coroutine. In addition, `ll::coro::CallbackTransformer` can turn a callback into a coroutine wait.

Reference implementation: <https://github.com/GroupMountain/GMSidebar/blob/develop/src/Sidebar.cpp>

*Applies to: LeviLamina 26.60.0 and later (`ConditionVariable`); the `keepThis`, executor and status-check approaches work in all versions since 1.x*

## How can a C++ mod have an "optional dependency" on another mod (such as GMLIB): not link it directly, and call its exported functions only if it is present? Why does `GetProcAddress` never find the function by name? Can LSE scripts call it?

Approach: the exporting side exports the function with `__declspec(dllexport)`; the calling side gets the other module's handle at runtime with `GetModuleHandleA` (if it cannot be obtained, treat the mod as not installed and skip the related features), then gets the function pointer with `GetProcAddress`.

C++ functions have name mangling (clang-cl and MSVC use the same mangling rules), so the names in the export table are mangled names like `?xxx@@...`. Use `dumpbin /exports` (or `llvm-objdump`) to see the full mangled name and pass that to `GetProcAddress`; if you control the exporting side, you can export with `extern "C"` to avoid mangling. Hard-coding base address + RVA is not recommended. For normal development, it is better to depend on the other mod's package directly and call it.

For an LSE script plugin to call a C++ interface, it needs to add a dependency through RemoteCall (LegacyRemoteCall) or similar; if you do not want to add a dependency, the only option is to have the other side execute a command (`mc.runcmd`).

*Applies to: all versions*

## In a C++ mod I call `ll::service::getLevel()` during the load phase, then `static_cast<ServerLevel&>` and call `getNewUniqueID()`, and get a `0xC0000005` null-pointer crash. How do I get the `Level` correctly?

The `Level` exists only after BDS has read the world, while the mod's `load()` runs before the world is opened, so `ll::service::getLevel()` returns an empty `optional_ref` at that point. Check whether `getLevel()` has a value first, and move the related logic into the `enable()` phase (or into later events): LeviLamina calls `enableAllMods` only after the server thread has started (`ServerScriptManager::onServerThreadStarted`), when the `Level` is ready.

*Applies to: current version (server)*

## In a C++ mod, some exceptions (such as access violations) cannot even be stopped by `try/catch`. How do I catch them?

An access violation is a Windows SEH structured exception, and a typed catch such as `catch (std::exception&)` cannot catch it. The reliable approach is `__try/__except` (supported by both MSVC and clang-cl). The function containing `__try` must not hold C++ objects that need destructor unwinding, and `__try` cannot be mixed with C++ `try`; wrap the dangerous call in a separate small function.

Note: the official mod template's `xmake.lua` adds `/EHa`, but it uses the clang-cl toolchain and then appends `/EHs` for `clang_cl`, so do not count on `catch (...)` always catching SEH exceptions. For C++ exceptions that can be caught, you can print them with `ll::error_utils::printCurrentException(logger)` (`ll/api/utils/ErrorUtils.h`). However, an access violation usually means the code itself has a bug; fix the root cause instead of catching it and carrying on.

*Applies to: LeviLamina mods on Windows (MSVC)*

## How do I use `ll::memory::dAccess` in a LeviLamina C++ mod? How do I read a class member by offset (for example `mSimTimer` from the `Minecraft` object)?

For `dAccess`, the template parameter is the member type, the first argument is the object address and the second argument is the byte offset: `ll::memory::dAccess<T>(ptr, offset)`, which returns `T&`. Note that if an offset such as `this+27` shown in IDA is in units of QWORD (8 bytes), multiply it by 8 to get the byte offset (27*8 = `0xD8`); if the location holds a pointer, write the template type as a pointer type and then dereference it. Add the offset only once; adding it repeatedly causes a `0xC0000005` access violation. Offsets depend on the game version and cannot be copied across versions.

Also, in the current LeviLamina headers `Minecraft` already declares the member `mSimTimer` (`Timer&`) as a `TypedStorage`, so you can access it directly via `minecraft.mSimTimer` without computing the offset by hand. To change the tick rate, use `Minecraft::setSimTimeScale` or change the `Timer`'s `mTimeScale` directly.

*Applies to: current version (offsets change with the game version)*

## How do I write logs in a LeviLamina C++ mod? `std::cout` seems to print nothing.

On the server, `std::cout` / `print` / `fmt::print` all produce output, but the mod's own `ll::io::Logger` is recommended:

```cpp
ll::io::Logger& logger = MyMod::getInstance().getSelf().getLogger();
logger.info("...");
```

Here `MyMod` is your own main mod class (in the template, `getSelf()` returns `ll::mod::NativeMod&`). On the client you need to open the console (terminal) window to see the output.

## Can a LeviLamina C++ mod change the server TPS (speed up, slow down or pause game ticks)?

Yes. The `Minecraft` object has an internal simulation timer (`mSimTimer`, type `Timer&`; `Timer` contains `mTimeScale`) and provides the virtual functions `setSimTimeScale(float scale)` and `setSimTimePause(bool pause)`, which you can use to speed up, slow down and pause game ticks, for example `ll::service::getMinecraft()->setSimTimeScale(2.0f);` (`getMinecraft()` returns `optional_ref<Minecraft>`; check that it is valid before use).

Users report that vanilla limits the scale (about 0.1x to 10x); to go beyond it you must modify the `Timer` logic yourself. You can also call `ll::service::getLevel()->tick()` in a loop to force extra ticks, but this is not recommended.

*Applies to: current version (server)*

## How does a LeviLamina C++ plugin support hot unload/reload? How do I remove a hook from outside the hook function?

For a native mod to support hot unload/reload (such as `ll unload` / `ll reload`), you must implement unload yourself: with `LL_REGISTER_MOD`, provide `bool unload()` in the mod class and it will be registered. Otherwise LeviLamina reports `The mod does not register an unload function` and the mod can only be unloaded when the server shuts down.

A hook macro such as `LL_AUTO_TYPE_INSTANCE_HOOK` defines a hook class name; call that class's `unhook()` (such as `MyHook::unhook()`) in unload (or disable) to remove the hook from outside the function. Macros without `AUTO` require you to call `MyHook::hook()` / `MyHook::unhook()` manually. In addition, the lifetimes of smart pointers, memory allocated with `new`, `std::function`, threads, event listeners and so on must all be cleaned up in unload, or unloading will crash; if you cannot handle that, do not write unload.

## Must a LeviLamina C++ plugin define `load`/`enable`/`disable`/`unload`? Can `DllMain` still be used?

When you register with `LL_REGISTER_MOD(class, instance)` in the current version, only `bool load()` is required (checked by a `static_assert`); `enable`, `disable` and `unload` are optional and are registered only if you provide them. Without `disable`, disabling succeeds immediately; without `unload`, the mod cannot be hot-unloaded (`ll unload` / `reload` reports `The mod does not register an unload function`) and is only unloaded when the server shuts down. Unless you are very familiar with C++ lifetime management, do not write `unload`.

`DllMain` is still called but not recommended, because it runs too early: in `DllMain` the LL API is not guaranteed to be available, in `load` the game API is not guaranteed to be available, and only in `enable` are both available. An LL mod should use `load` as its entry point; otherwise it is effectively a PreLoader plugin.

## How do I create a logger in a LeviLamina mod without using `getSelf().getLogger()`?

In the current version the constructor of `ll::io::Logger` is private (`PrivateTag`), so you can no longer construct one directly with `ll::Logger logger("MyMod");`. Get or create one through the logger registry instead:

```cpp
auto logger = ll::io::LoggerRegistry::getInstance().getOrCreate("MyMod");
```

It returns a `std::shared_ptr<ll::io::Logger>`; then log with `logger->info("...")`. You can also keep using `getSelf().getLogger()` (which returns `ll::io::Logger&`).

*Applies to: LeviLamina 1.x and later*

## In a LeviLamina mod, I have a global object that does file operations and must not be copied. Do I need `std::ref` when using it in the lambdas passed to `cmd.overload().execute(lambda)` and `eventBus.emplaceListener<Event>(lambda)`?

No. A global (static storage duration) object can be used in a lambda directly without capturing it; a local object can be captured by reference with `[&obj]`. Neither makes a copy. `std::ref` is not a tool for lambda captures. You only need to make sure the object outlives the callback (for as long as the command or listener exists). You can verify that no copy happens by marking the copy constructor `delete`/`private`. This is a C++ language rule and does not depend on the LeviLamina version.

*Applies to: all versions*

## What is the call order of the `load`, `enable`, `disable` and `unload` lifecycle functions in a LeviLamina native mod, and how do they differ?

The call order is `load` -> `enable` -> `disable` -> `unload`. For a mod class registered with `LL_REGISTER_MOD`, only `load()` must be implemented (`bool load()`); `enable`/`disable`/`unload` are optional (they are bound only if implemented). When a mod is loaded while the server is already running, `enable` is called immediately after `load` succeeds; on a hot unload (`unload`), `disable` is called first and then `unload`. The current version is v26.60.8.

*Applies to: LeviLamina 1.x and later*

## How do I include arguments when logging with a logger in a LeviLamina mod?

The LeviLamina logger (`ll::io::Logger`) supports fmt-style formatting in `info`/`warn`/`error`/`debug` and so on, so you can write `getSelf().getLogger().info("检查到玩家 {} 加入服务器!", ev.self().getRealName());` (the message means "Detected player {} joining the server!") without concatenating strings by hand. You can let `auto` deduce variable types, for example `auto& player = ev.self();`.

*Applies to: LeviLamina 1.x and later*

## When `logger.info` in LeviLamina prints multi-line text containing newlines, the following lines have no time prefix. How do I handle this?

Each `Logger` call formats a single message and adds the time/level/title prefix once, in front of the whole message, according to the pattern; newlines inside the string do not get a prefix. When every line needs a prefix, split the text by line first (for example with `std::istringstream` + `std::getline`, or `ll::string_utils::splitByPattern`) and then call `logger.info` for each line. This applies to `ll::io::Logger`.

*Applies to: all versions*

## Can LeviLamina coroutines use multiple CPU cores?

Yes. A coroutine does not decide which thread it runs on; the Executor that launches or resumes it does. LeviLamina provides `ll::thread::ThreadPoolExecutor` (it extends `ll::coro::Executor`, lets you set the thread count, and also offers `ThreadPoolExecutor::getDefault()`). Run an `ll::coro::CoroTask` on the thread pool with `task.launch(executor)` to use multiple cores. When you need to go back to the main thread to touch game objects, use `ll::thread::ServerThreadExecutor`. Note that most BDS game APIs are not thread-safe.

*Applies to: LeviLamina 1.x and later*

## When one mod DLL is used on both the client and the server, how do I tell whether it is loaded on the client or the server?

Use `ll::isClient()` from `ll/api/Versions.h` to tell whether the mod is loaded by a client or a server.

If, on the client, you also need to tell a local world (you are the host and the built-in server is running) from a normal player joining a remote server: `Level::isClientSide` is not reliable. Use `ll::service::getMinecraft()` (it returns the server instance by default, with `isClientSide=false`) or `ll::service::getServerInstance()`. If you get one, local server logic exists; if not, the client is just connected to a remote server.

*Applies to: LeviLamina 1.9 and later (including versions with client support)*

## When using LeviLamina coroutines (`ll::coro`), `co_await 1s` blocks the main thread for a second. What is going on, and how do I start a coroutine correctly?

The cause is using `syncLaunch` (copied from the test code). `syncLaunch` blocks the current thread until the coroutine finishes and returns its result.

To start a coroutine normally, use `CoroTask::launch(executor)`, which is asynchronous. `launch` also has an overload with a callback, `launch(executor, callback)`, for getting the return value (the version without a callback passes `[](auto&&){}` by default). Use `syncLaunch` only when you really need to wait for the result synchronously.

*Applies to: LeviLamina 1.0 and later*

## When using delayed tasks (timed/delayed execution) in a C++ mod, the callback lambda does not run or behaves strangely. What could be the cause?

Check how the lambda captures: a delayed task runs later, so if you capture local variables by reference with `[&]`, they are already destroyed when the task runs, leaving dangling references and causing strange behavior. Switch to capture by value (`[=]` or explicit by-value captures, and where needed use `shared_ptr` / `weak_ptr` to keep objects alive or to check whether they still exist).

Current LeviLamina recommends implementing delayed tasks with coroutines, for example:

```cpp
ll::coro::keepThis([player = ...]() -> ll::coro::CoroTask<> {
    co_await 20_tick; // or co_await 1s;
    // ...
}).launch(ll::thread::ServerThreadExecutor::getDefault());
```

Also check whether the objects captured by the lambda are still valid after `co_await` (for example, the player may have gone offline).

*Applies to: all current LeviLamina versions (the old schedule/DelayTask API has been replaced by `ll::coro`)*

## After starting an HTTP service with cpp-httplib (`listen 0.0.0.0`) in a native LeviLamina C++ mod, players cannot connect to the server and even the MOTD is gone. Why?

Because `listen` was called on the main thread. `httplib::Server::listen` is a blocking call that stalls the BDS main thread, so the server cannot respond. Run `server.listen` in a separate thread (such as a `std::thread`), and when the mod is disabled/unloaded call `server.stop()` and `join` the thread. Do not `listen` on the main thread.

## I copied the example code from the LeviLamina website guide to write a mod, and using `self` gives a compile error. How do I fix it?

The `self` usage in the old guide is outdated. Follow the current template: the `MyMod` class saves the instance returned by `ll::mod::NativeMod::current()` when it is constructed (member `mSelf`) and exposes it through `getSelf()`, for example `MyMod::getInstance().getSelf().getLogger().info("...")`. The easiest approach is to create a new project directly from `levilamina-mod-template`.

*Applies to: LeviLamina 1.x and later*

## A (possibly closed-source) mod on my server keeps spamming the console with logs. Can I block or filter them without changing its source code? Will LeviLamina build in such a feature?

LeviLamina will not officially build in such filtering (it would cost performance), so you need to write a mod for it. With the current logging system: get the mod with `ll::mod::ModManagerRegistry::getInstance().getMod("mod name")` and then get its logger through `getLogger()`; if that mod created its own logger, get it with `ll::io::LoggerRegistry::getInstance().tryGet("logger title")`. Once you have the `ll::io::Logger`, you can raise the output level with `setLevel(...)`, or replace or remove its sinks with `setSink` / `removeSink` / `clearSinks` (for example, swap in a sink of your own that filters). The old approach of hooking `ll::OutputStream::print` from the old logging system no longer works.

*Applies to: LeviLamina 1.x and later (new logging system `ll::io::Logger`)*

## Mods registered by a third-party mod loader I wrote (such as a .NET loader) cannot be found with LeviLamina's query API. What should I do?

They can be found as long as you register them the standard way. Implement a manager that inherits from `ll::mod::ModManager` and register it with `ModManagerRegistry::addManager`; on load, call `addMod(name, mod)` to add the Mod object to the manager, and on unload call `eraseMod(name)`. The `ModManager` is the owner of the Mod objects; LeviLamina does not manage them for you. You can follow LeviLamina's own `NativeModManager`. After that, the mods can be found with `ModManagerRegistry::getManagerForMod`, `ModManager::getMod` and so on.

*Applies to: LeviLamina 1.x and later (Plugin was renamed to Mod)*
