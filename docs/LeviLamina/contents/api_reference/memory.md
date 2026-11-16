# Memory & Hook

`ll/api/memory/` · **Common**

## Overview

The Memory module provides low-level memory manipulation, function hooking with priority control, signature scanning, and symbol resolution. It enables mods to intercept and modify game behavior at the binary level.

## Headers

| Header | Description |
|--------|-------------|
| `ll/api/memory/Hook.h` | Function hooking macros and registration |
| `ll/api/memory/Memory.h` | Memory manipulation utilities |
| `ll/api/memory/Signature.h` | Binary pattern matching |
| `ll/api/memory/Symbol.h` | Symbol name resolution |

## Key Functions

### Hook Registration

```cpp
namespace ll::memory {
enum class HookPriority {
    Highest = 0,
    High    = 100,
    Normal  = 200,
    Low     = 300,
    Lowest  = 400,
};

using FuncPtr = void*;

int hook(
    FuncPtr      target,
    FuncPtr      detour,
    FuncPtr*     originalFunc,
    HookPriority priority,
    bool         suspendThreads = true
);

bool unhook(FuncPtr target, FuncPtr detour, bool suspendThreads = true);
}
```

### Hook Macros

```cpp
// Static function hook (registered manually with HookName::hook() / HookName::unhook())
LL_STATIC_HOOK(HookName, HookPriority::Normal, Identifier, ReturnType, Params...) {
    // Hook implementation
    // Call original: origin(args...)
}

// Static function hook; the hook struct derives from ClassName
LL_TYPE_STATIC_HOOK(HookName, HookPriority::Normal, ClassName, &ClassName::staticFunction, ReturnType, Params...) {
    // ...
}

// Instance method hook; `this` is the ClassName instance
LL_TYPE_INSTANCE_HOOK(HookName, HookPriority::Normal, ClassName, &ClassName::method, ReturnType, Params...) {
    // Hook implementation
    // Call original: origin(args...)
}

// Auto-hooks (registered and unregistered automatically)
LL_AUTO_STATIC_HOOK(HookName, HookPriority::Normal, Identifier, ReturnType, Params...) {
    // ...
}

LL_AUTO_TYPE_INSTANCE_HOOK(HookName, HookPriority::Normal, ClassName, &ClassName::method, ReturnType, Params...) {
    // ...
}
```

`Identifier` can be a function pointer, a symbol, an address or a signature. `LL_INSTANCE_HOOK` / `LL_AUTO_INSTANCE_HOOK` and `LL_AUTO_TYPE_STATIC_HOOK` follow the same patterns, and every macro has an `_EX` variant (e.g. `LL_TYPE_INSTANCE_HOOK_EX`) that takes a `RegisterSaveOptions` argument after the priority.

### Memory Utilities

```cpp
namespace ll::memory {
// Make memory writable, execute callback, restore protection
void modify(void* ptr, size_t len, brstd::function_ref<void()> callback);

// Call function at address
template <class R = void, class... Args>
R addressCall(void const* address, auto&&... args);

// Call virtual method
template <class R = void, class... Args>
R virtualCall(void const* self, ptrdiff_t vIndex, auto&&... args);

// Access member at offset
template <class T>
T& dAccess(void* ptr, ptrdiff_t off);
}
```

## Usage

### Basic Hook

```cpp
#include "ll/api/memory/Hook.h"
#include "mc/scripting/ServerScriptManager.h"

LL_AUTO_TYPE_INSTANCE_HOOK(
    ServerStartedHook,
    ll::memory::HookPriority::Normal,
    ServerScriptManager,
    &ServerScriptManager::$onServerThreadStarted,  // Function pointer
    EventResult,
    ServerInstance& ins
) {
    // Code before original
    auto result = origin(ins);  // Call original function
    // Code after original
    return result;
}
```

### Instance Method Hook

```cpp
#include "ll/api/memory/Hook.h"
#include "mc/world/actor/player/Player.h"

LL_AUTO_TYPE_INSTANCE_HOOK(
    PlayerAttackHook,
    ll::memory::HookPriority::Normal,
    Player,
    &Player::$attack,  // Method pointer ($ prefix: the virtual's implementation)
    ActorHurtResult,
    Actor&                                         target,
    SharedTypes::Legacy::ActorDamageCause const& cause
) {
    // 'this' is the Player instance
    if (!shouldAllowAttack(target)) {
        return {};
    }
    return origin(target, cause);  // Call original
}
```

### Hook with Priority

```cpp
LL_STATIC_HOOK(
    HighPriorityHook,
    ll::memory::HookPriority::High,
    &SomeClass::someFunction,  // Function pointer
    bool
) {
    // This runs before Normal priority hooks
    return origin();
}

// LL_STATIC_HOOK is not registered automatically
void enable() { HighPriorityHook::hook(); }
```

### Memory Modification

```cpp
#include "ll/api/memory/Memory.h"

void patchMemory() {
    int* someValue = getValuePointer();
    
    ll::memory::modify(someValue, sizeof(int), [&] {
        *someValue = 42;  // Modify read-only memory
    });
}
```

### Virtual Function Call

```cpp
#include "ll/api/memory/Memory.h"

void callVirtual(void* obj) {
    // Call virtual function at index 5
    auto result = ll::memory::virtualCall<int>(obj, 5, arg1, arg2);
}
```

## Platform Notes

- Prefer function pointers (`&ClassName::method`, or `&ClassName::$method` for a virtual function's implementation) over symbol names, addresses or signatures
- Hook priority determines execution order (lower number = earlier)

## Related

- [How-to Guide: Hooks](../developer_guides/how_to_guides/hook_guide.md) — Step-by-step tutorial
- [How-to Guide: Finding Functions](../developer_guides/how_to_guides/find_function_guide.md) — Reverse engineering guide
