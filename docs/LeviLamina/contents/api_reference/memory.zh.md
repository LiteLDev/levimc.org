# Memory & Hook（内存与钩子）

`ll/api/memory/` · **通用**

## 概述

Memory 模块提供了底层内存操作、带优先级控制的函数钩子、签名扫描和符号解析。它使模组能够在二进制层面拦截和修改游戏行为。

## 头文件

| 头文件 | 说明 |
|--------|------|
| `ll/api/memory/Hook.h` | 函数钩子宏和注册 |
| `ll/api/memory/Memory.h` | 内存操作工具 |
| `ll/api/memory/Signature.h` | 二进制模式匹配 |
| `ll/api/memory/Symbol.h` | 符号名称解析 |

## 核心函数

### 钩子注册

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

### 钩子宏

```cpp
// 静态函数钩子（通过 HookName::hook() / HookName::unhook() 手动注册）
LL_STATIC_HOOK(HookName, HookPriority::Normal, Identifier, ReturnType, Params...) {
    // 钩子实现
    // 调用原函数: origin(args...)
}

// 静态函数钩子；钩子结构体继承自 ClassName
LL_TYPE_STATIC_HOOK(HookName, HookPriority::Normal, ClassName, &ClassName::staticFunction, ReturnType, Params...) {
    // ...
}

// 实例方法钩子；`this` 是 ClassName 实例
LL_TYPE_INSTANCE_HOOK(HookName, HookPriority::Normal, ClassName, &ClassName::method, ReturnType, Params...) {
    // 钩子实现
    // 调用原函数: origin(args...)
}

// 自动钩子（自动注册和注销）
LL_AUTO_STATIC_HOOK(HookName, HookPriority::Normal, Identifier, ReturnType, Params...) {
    // ...
}

LL_AUTO_TYPE_INSTANCE_HOOK(HookName, HookPriority::Normal, ClassName, &ClassName::method, ReturnType, Params...) {
    // ...
}
```

`Identifier` 可以是函数指针、符号、地址或特征码。`LL_INSTANCE_HOOK` / `LL_AUTO_INSTANCE_HOOK` 和 `LL_AUTO_TYPE_STATIC_HOOK` 用法相同，且每个宏都有在优先级之后额外接受 `RegisterSaveOptions` 参数的 `_EX` 变体（如 `LL_TYPE_INSTANCE_HOOK_EX`）。

### 内存工具

```cpp
namespace ll::memory {
// 使内存可写，执行回调，恢复保护
void modify(void* ptr, size_t len, brstd::function_ref<void()> callback);

// 调用地址处的函数
template <class R = void, class... Args>
R addressCall(void const* address, auto&&... args);

// 调用虚函数
template <class R = void, class... Args>
R virtualCall(void const* self, ptrdiff_t vIndex, auto&&... args);

// 访问偏移处的成员
template <class T>
T& dAccess(void* ptr, ptrdiff_t off);
}
```

## 使用方法

### 基本钩子

```cpp
#include "ll/api/memory/Hook.h"
#include "mc/scripting/ServerScriptManager.h"

LL_AUTO_TYPE_INSTANCE_HOOK(
    ServerStartedHook,
    ll::memory::HookPriority::Normal,
    ServerScriptManager,
    &ServerScriptManager::$onServerThreadStarted,  // 函数指针
    EventResult,
    ServerInstance& ins
) {
    // 原函数之前的代码
    auto result = origin(ins);  // 调用原函数
    // 原函数之后的代码
    return result;
}
```

### 实例方法钩子

```cpp
#include "ll/api/memory/Hook.h"
#include "mc/world/actor/player/Player.h"

LL_AUTO_TYPE_INSTANCE_HOOK(
    PlayerAttackHook,
    ll::memory::HookPriority::Normal,
    Player,
    &Player::$attack,  // 方法指针（$ 前缀表示虚函数的实现）
    ActorHurtResult,
    Actor&                                         target,
    SharedTypes::Legacy::ActorDamageCause const& cause
) {
    // 'this' 是 Player 实例
    if (!shouldAllowAttack(target)) {
        return {};
    }
    return origin(target, cause);  // 调用原函数
}
```

### 带优先级的钩子

```cpp
LL_STATIC_HOOK(
    HighPriorityHook,
    ll::memory::HookPriority::High,
    &SomeClass::someFunction,  // 函数指针
    bool
) {
    // 在 Normal 优先级钩子之前运行
    return origin();
}

// LL_STATIC_HOOK 不会自动注册
void enable() { HighPriorityHook::hook(); }
```

### 内存修改

```cpp
#include "ll/api/memory/Memory.h"

void patchMemory() {
    int* someValue = getValuePointer();
    
    ll::memory::modify(someValue, sizeof(int), [&] {
        *someValue = 42;  // 修改只读内存
    });
}
```

### 虚函数调用

```cpp
#include "ll/api/memory/Memory.h"

void callVirtual(void* obj) {
    // 调用索引为 5 的虚函数
    auto result = ll::memory::virtualCall<int>(obj, 5, arg1, arg2);
}
```

## 平台说明

- 优先使用函数指针（`&ClassName::method`，虚函数的实现用 `&ClassName::$method`），而非符号名称、地址或特征码
- 钩子优先级决定执行顺序（数字越小越早执行）

## 相关模块

- [操作指南：钩子](../developer_guides/how_to_guides/hook_guide.zh.md) — 分步教程
- [操作指南：查找函数](../developer_guides/how_to_guides/find_function_guide.zh.md) — 逆向工程指南
