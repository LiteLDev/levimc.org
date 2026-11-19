# 事件与钩子

模组有两种方式对游戏中发生的事情作出反应：**钩住**（hook）游戏的某个函数，或者**监听** LeviLamina 发布的**事件**。
本页说明这两者如何工作以及它们之间的关系。如何使用它们见如何做到系列：[钩子指南](../developer_guides/how_to_guides/hook_guide.md)和
[事件指南](../developer_guides/how_to_guides/event_guide.md)；API 见 [Memory & Hook（内存与钩子）](../api_reference/memory.md)和
[Event（事件系统）](../api_reference/event.md)页面。

## 钩子

钩子用模组中的一个函数——**detour**——替换游戏的一个函数。游戏调用该函数时，运行的是你的 detour；它调用 `origin(...)`
来运行原函数，并且可以修改参数、修改结果，或者根本不调用原函数。要钩住的函数可以通过游戏头文件（`mc/`）中的函数指针、符号、
地址或特征码指定。

多个模组可以钩住同一个函数。它们的 detour 按 `HookPriority`（`Highest`、`High`、`Normal`、`Low`、`Lowest`）组成一条链：
每次 `origin(...)` 调用下一个 detour，最后一个调用游戏的函数。

钩子只在安装后才生效：

- 用 `LL_AUTO_` 宏声明的钩子作为 DLL 的静态对象，在 DLL 加载时、模组的 `load()` 运行之前安装。
- 其他钩子由它的 `hook()` 安装，由 `unhook()` 移除。`ll::memory::HookRegistrar<Hooks...>` 对象在创建时安装其中的钩子，
  在销毁时移除它们；被多个 registrar 持有的钩子会一直保持安装，直到最后一个 registrar 被销毁。

## 事件

事件是描述发生了什么事情的对象，例如 `PlayerJoinEvent`。所有事件都经过同一个 `EventBus`：

- **发布。** 知道事情发生了的代码创建事件并调用 `EventBus::publish`。事件总线在发布它的线程上逐个调用该事件类型的监听器。
- **监听。** 监听器是针对一种事件类型、带有 `EventPriority` 的回调。监听器按从 `Highest` 到 `Lowest` 的顺序被调用；
  优先级相同的监听器按创建的先后顺序调用。
- **取消。** 派生自 `Cancellable` 的事件可以被监听器取消。此时事件总线不再调用后面的监听器，取消意味着什么由发布者决定：
  例如被取消的 `PlayerAttackEvent` 会阻止这次攻击。哪些内置事件可以取消，见 [Event（事件系统）](../api_reference/event.md)页面中的“内置事件”。
- **错误。** 监听器抛出的异常会被捕获，并连同其所属模组的名称记入日志；下一个监听器照常运行。

## 事件如何使用钩子

大多数内置事件是由钩子发布的。例如 `PlayerAttackEvent` 由 `Player::attack` 上的一个钩子发布：detour 发布该事件，
如果有监听器取消了它，就不调用原函数直接返回（参见[事件指南](../developer_guides/how_to_guides/event_guide.md)中的“发布事件”）。

这些钩子并不是一直安装着的。每种事件类型都有一个**发射器**（emitter），它是持有该事件钩子的类（放在一个 `HookRegistrar` 中）。
LeviLamina 在添加该事件的第一个监听器时创建发射器，在移除最后一个监听器时销毁它，同时移除它的钩子。
没有人通过事件监听的游戏函数不会被钩住。

模组也可以用同样的方式提供自己的事件：一个事件类（必须是 `final`）、一个发射器，以及发布它的钩子或代码。

## 监听器属于模组

每个监听器都属于一个模组：默认是创建它的代码所在的模组（`NativeMod::current()`）。LeviLamina 借此在模组之后进行清理：

- 模组在游戏运行时被**禁用**时，它的监听器会被移除。
- 模组被**卸载**时，它的监听器会被移除，它提供的事件也会连同其他模组在这些事件上的监听器一起被移除。

这就是模组在 `enable()` 中添加监听器的原因：禁用时它们会被移除，再次启用时会被重新添加。参见[模组生命周期](mod_lifecycle.md)。

`EventBus::publish(modName, event)` 只调用属于模组 `modName` 的监听器。

## 用钩子还是事件？

- 如果有对应的**事件**，就用事件：它与其他所有模组共享，只在有人监听时才安装，并且会随你的模组一起被移除。
- 没有事件覆盖的情况再用**钩子**。用[找函数指南](../developer_guides/how_to_guides/find_function_guide.md)找到函数，
  除非有理由，否则把优先级保持为 `Normal`。

## 相关文档

- [Event（事件系统）](../api_reference/event.md) — `EventBus`、`Listener`、`EventPriority`、`Cancellable` 和内置事件
- [Memory & Hook（内存与钩子）](../api_reference/memory.md) — 钩子宏、`HookPriority` 和 `HookRegistrar`
- [项目架构](../developer_guides/architecture.md) — 事件系统和钩子在 LeviLamina 中的位置
