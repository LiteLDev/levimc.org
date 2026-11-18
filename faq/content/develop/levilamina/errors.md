# LeviLamina mods: errors and crashes

## Calling MC APIs or sending packets (such as `forEachPlayer`, `sendPacket`, `TextPacket`) from a child thread or thread pool (`ThreadPoolExecutor`, `std::thread`, a timer thread) in a LeviLamina mod crashes the server or makes the client report "the server sent a corrupted packet". What should I do?

BDS's game logic and packet sending are not thread-safe (there are no internal locks, and writing to the send queue from several threads at once crashes), so every MC/BDS API (including `sendPacket`, even for a `TextPacket`) must be called on the server main thread. This is a problem in the mod itself; LeviLamina will not "fix" it.

What to do: time-consuming work can go to a thread pool, but the parts that touch MC APIs must switch back to the main thread, for example:

```cpp
ll::thread::ServerThreadExecutor::getDefault().execute([]{ ... });
```

or use a coroutine:

```cpp
ll::coro::keepThis([]() -> ll::coro::CoroTask<> { co_await 20_tick; ... }).launch(ll::thread::ServerThreadExecutor::getDefault());
```

Whether a coroutine runs on the main thread depends on the Executor used in `launch`: only `ServerThreadExecutor` is the main thread; `ThreadPoolExecutor` is not.

Do timed and periodic tasks per tick (1 tick = 50 ms), and do not send packets at high frequency (such as every 1 ms): the client does not process them any faster, RakNet is unstable under high-frequency sending, and the packets are easily treated as corrupted. For high-precision music playback, use the ogg files built into a resource pack, or convert to a format played per tick (such as nbs). Also, addons cannot send packets, so when corrupted packets appear, look at native mods.

The multithreaded packet-sending optimization that LeviOptimize once provided (PacketSenderOpt) has been removed, so you can no longer rely on it to send packets from non-main threads. If you really must send from another thread, the only option is to serialize the packet into a binary stream with `Packet::write` outside the main thread and then send it through a third-party interface that has its own locking (such as GMLIB's binary-stream packet sending); this is a third-party solution.

*Applies to: LeviLamina 1.0 and later (currently v26.60.8); the main-thread restriction applies to all versions*

## My own LeviLamina C++ mod builds successfully but crashes BDS at runtime (sometimes a memory access error, sometimes a division by zero), and the console shows no useful error. How do I locate the failing position in my code?

Use a debugger instead of guessing with loggers everywhere:

1. Start `bedrock_server_mod.exe` normally, then attach with Visual Studio "Debug → Attach to Process" (or VSCode cppvsdbg attach, or WinDbg). To catch a crash early in startup, run `set PL_DEBUG=1` before starting so that PreLoader waits for a debugger to attach. Do not launch `bedrock_server_mod.exe` directly from the debugger; this fails on recent LeviLamina.
2. When an exception occurs, the debugger breaks at the failing position. If it does not point directly at your code, walk up the call stack to the frame of your own mod and inspect the variables. You can also set breakpoints at suspicious code and single-step.
3. To see the source you need the pdb of the mod (the template's default `set_symbols("debug")` produces it).
4. Without a debugger attached, LeviLamina's built-in CrashLogger prints a stack trace on a crash. For your own mod, the function names in the stack usually map directly to code locations (if a debugger was already attached when CrashLogger initialized, as with `PL_DEBUG=1`, CrashLogger is not enabled).

*Applies to: LeviLamina 1.2.0 and later (including the current 26.x); the approach applies to all versions*

## Does a "failed to disable" message for a plugin (for example one that depends on GMLIB) at server shutdown cause a crash?

No. At shutdown LeviLamina disables mods one by one in the reverse of the load order. If a mod is being disabled while another, still-enabled mod depends on it, an error `{0} still depends on {1}` is returned; if a mod's `disable()` returns `false`, the error `The mod cannot be disabled` is returned. In `disableAllMods` these errors are only logged at Warn level and do not affect a normal shutdown. If the server really crashes, the cause is something else (for example a mod's shutdown code); install CrashLogger to locate it.

*Applies to: LeviLamina 1.x and later*

## When a LeviLamina C++ mod delays logic in an event such as block break, the block position jumps randomly and the block fetched at that position is air. What is the cause?

The delayed callback/coroutine references data from the event object (for example it captures a reference to `ev.pos()` or `ev` itself). Those objects are destroyed once the event callback returns, so the callback reads dangling data. When delaying, copy/capture the values you need (`BlockPos`, dimension id, etc.) by value before passing them in, for example `[pos = BlockPos(ev.pos()), dim = ...]`, or copy them to local variables inside the coroutine first, instead of capturing references. In the current version delays generally use `ll::coro` (for example `ll::coro::keepThis([=]() -> ll::coro::CoroTask<> { co_await std::chrono::seconds(1); ... }).launch(ll::thread::ServerThreadExecutor::getDefault());`), and values must likewise be captured by value.

## A LeviLamina mod crashes in an event listener near `isCancelled()` with exception code `0xC0000005`, which looks like a null pointer. What is the cause?

A common cause is passing a temporary `std::string` (such as the return value of `fmt::format`) when constructing an event id with `EventIdView`: `EventIdView` only holds a `std::string_view` internally, so the temporary string is destroyed at the end of the statement and the view dangles (UB, which may not reproduce in testing). Fix: return/hold a `ll::event::EventId` instead (it owns a `std::string` and converts implicitly to `EventIdView`), or make sure the source string outlives its use. Also, `0xC0000005` is `EXCEPTION_ACCESS_VIOLATION` and is not necessarily a null pointer: `ExceptionInformation[0]` is the read/write flag (0 read, 1 write, 8 DEP) and `[1]` is the inaccessible address; because of inlining, the line located in the dmp may be off by one to an adjacent statement.

*Applies to: LeviLamina 1.x and later (including 26.60.x)*

## Writing `auto* bs = dynamic_cast<BedrockSpawner*>(&ll::service::getLevel()->getSpawner());` in a LeviLamina mod crashes (`vcruntime140.dll` `0xC0000005` access violation). Why?

The Windows build of Bedrock Dedicated Server (BDS) has no usable RTTI information, so `dynamic_cast` on BDS internal types fails (it returns `nullptr` or crashes directly inside vcruntime). `getSpawner()` returns `Spawner&`, and taking its address is fine; use `static_cast` instead: `auto* bs = static_cast<BedrockSpawner*>(&ll::service::getLevel()->getSpawner());` (you must make sure the actual type is `BedrockSpawner`).

*Applies to: LeviLamina 26.x (Windows BDS). Not confirmed against the source code or the documentation: treat it as a pointer.*

## After hooking a BDS function (for example a piston's redstone update function), a parameter is an invalid address and crashes, while the same hook for other similar blocks works. Why?

Check whether the function is marked `MCFOLD` in the LeviLamina headers. `MCFOLD` means the compiler applied Identical COMDAT Folding (ICF) to the function: its address is shared with other functions, so hooking it intercepts calls to several different functions at once, and the parameters may not be of the expected type at all. An `MCFOLD` function can still be called/hooked, but in the hook you must determine the call source yourself (for example check the actual type of `this` / the block type) and validate the parameters (if necessary, use the Windows API `IsBadReadPtr` to check that a pointer is readable). A better approach is to hook an unfolded caller or callee function instead.

## After porting a server mod to the LeviLamina client, code in a hook misbehaves or crashes (the exception is on the MINECRAFT MAIN THREAD). What should I do?

Usually the hooked point fires on a thread other than the `MC_SERVER` thread (the client also has a main thread, a render thread, and so on). Most server-side MCAPI can only be called on the `MC_SERVER` thread, so in the hook first check whether the current thread is the server thread before running server logic. See LegacyScriptEngine's `lse::api::thread::isServerThread()`: `auto instance = ll::service::getServerInstance(); return instance && std::this_thread::get_id() == instance->mServerInstanceThread->get_id();`. Its event implementation (for example `src/lse/events/BlockEvents.cpp`) checks `if (isServerThread())` in the callback before handling. Also, the `BlockSource` you receive may belong to the client world, so check it first with `blockSource.getLevel().isClientSide()` (`BlockSource` itself has no `isClientSide()`; go through `Level`/`ILevel`). Do not perform server-side operations such as `removeBlock` on a client-side `BlockSource` (the client's `playerDestroy` does not spawn drops either).

*Applies to: LeviLamina client build*

## A self-built LeviLamina mod fails in an event listener (for example `Error in Listener<ll::event::world::BlockChangedEvent>`) but the official tests cannot reproduce it. What should I check?

First check whether the mod uses LeviLamina's memory allocator (mimalloc): the official template has `#include "ll/api/memory/MemoryOperators.h"` in `src/mod/MemoryOperators.cpp`, and without it, cross-DLL allocation/deallocation becomes inconsistent and crashes. If problems remain, delete the old `.xmake` cache directory (and the `build` directory) in the project, then reconfigure with `xmake f` and rebuild, so that no stale dependencies or headers are left over.
