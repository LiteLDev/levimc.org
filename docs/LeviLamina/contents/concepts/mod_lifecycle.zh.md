# 模组生命周期

本页说明 LeviLamina 如何找到服务器或客户端的模组、按什么顺序加载它们，以及何时调用模组的 `load`、`enable`、
`disable` 和 `unload`。这里提到的类和字段都列在 [Mod（模组系统）](../api_reference/mod.md)页面上。

## 四个步骤

模组会经历四个步骤。每一步都会调用模组的一个回调；回调返回 `false` 时这一步就会中止，LeviLamina 会在日志中写明原因。

| 步骤 | 发生时机 | 回调 | 之后 |
|------|----------|------|------|
| **加载** | 启动时，对每个应当运行的模组；运行时通过 `/ll load` | `load()` | 模组已加载，处于禁用状态 |
| **启用** | 游戏启动完成时；如果游戏已在运行，则在加载后立即启用 | `enable()` | 模组已启用 |
| **禁用** | 游戏停止时；运行时通过 `/ll disable` | `disable()` | 模组已禁用，但仍处于加载状态 |
| **卸载** | 仅在运行时，通过 `/ll unload` 或 `/ll reload` | `unload()` | 模组被移除，其 DLL 被释放 |

模组要么是 `Enabled`（已启用），要么是 `Disabled`（已禁用）（`Mod::State`）：刚加载的模组在启用之前处于禁用状态。
游戏停止时，模组会被禁用，而不会被卸载。

使用 `LL_REGISTER_MOD(Class, instance)`（参见 [Mod（模组系统）](../api_reference/mod.md#注册模组入口)中的“注册模组入口”）时，
`load()` 是必需的，`enable()`、`disable()` 和 `unload()` 在类定义了它们时才会被使用。没有 `unload()` 的原生模组无法在运行时卸载：
LeviLamina 会以“The mod does not register an unload function”拒绝。

## 查找模组

启动时，LeviLamina 会查看模组根目录中的每个文件夹：服务端为 `plugins/`，客户端为 `mods/`（参见
[Mod（模组系统）](../api_reference/mod.md#目录结构)中的“目录结构”）。

- 没有 `manifest.json` 或其内容为空的文件夹会被跳过。
- 清单中的 `name` 必须与文件夹名相同，否则不会加载该模组（“Mod name … do not match folder …”）。
- 类型为 `preload-native` 的清单会被跳过：它们由 PreLoader 在游戏启动之前加载，不属于 LeviLamina 模组（参见
  [Mod（模组系统）](../api_reference/mod.md#模组类型)中的“模组类型”）。

## 选择与排序

LeviLamina 在加载任何模组之前，先根据清单制定一个计划：

1. **加载哪些模组。** 从每个不是 `passive` 的模组出发，加上它们需要的模组：它们的 `dependencies`，以及已安装且版本匹配的
   `optionalDependencies`。`passive` 模组只在某个会被加载的模组依赖它时才会被加载。
2. **其中哪些不能运行。** 以下情况的模组会被排除：缺少某个依赖，或依赖的版本不在它要求的范围内；它的 `platform` 不是当前平台
   （`server` 或 `client`；`universal` 或未写 `platform` 则两端都可运行）；它在 `conflicts` 中列出了计划中的另一个版本匹配的模组；
   它的某个依赖被排除；或者它处于依赖环中。日志会写明原因，例如“… will not be loaded because it conflicts with …”。
3. **按什么顺序。** 依赖和可选依赖排在使用它们的模组之前；声明了 `loadBefore` 的模组排在它列出的模组之前。
   相互之间没有顺序要求的模组按名称排序。

然后按这个顺序逐个加载模组。依赖加载失败的模组也会被跳过。

## 加载

在服务端，LeviLamina 在游戏的 `main` 开始时、游戏本身运行之前加载模组；在客户端，则是在 PreLoader 把 LeviLamina
加载进游戏时。此时游戏、它的世界和玩家都还不存在。

模组的 `type` 决定由谁加载它。`native` 模组由 LeviLamina 自己加载；其他类型由为该类型注册的模组管理器加载（例如脚本引擎）。
对于原生模组，LeviLamina 会：

1. 把模组的文件夹加入 `PATH`，以便找到它放在自身旁边的 DLL；
2. 加载清单的 `entry` 所指定的 DLL。如果 Windows 因为缺少它导入的某个 DLL 或函数而无法加载，LeviLamina 会在日志中列出缺少的内容；
3. 检查该 DLL 是否使用 LeviLamina 的内存分配运算符（`ll/api/memory/MemoryOperators.h`），不使用的 DLL 不会被加载；
4. 调用模组的 `load()`。

DLL 的静态对象在 DLL 加载时、`load()` 之前创建：用 `LL_AUTO_` 宏声明的钩子就是在这时安装的（参见[事件与钩子](events_and_hooks.md)）。

## 启用

在服务端，模组在服务器线程启动后被启用；在客户端，则在游戏完成初始化时。它们按加载的顺序被启用，LeviLamina 会为每个模组输出
“Enabling … v…”。只有当一个模组的所有 `dependencies` 都已启用时，它才会被启用。

`enable()` 是模组开始参与游戏的地方：注册它的监听器、命令等。在游戏运行时加载的模组（通过 `/ll load`）会在其 `load()` 之后立即被启用。

## 禁用与卸载

服务器停止或客户端窗口关闭时，LeviLamina 按与加载相反的顺序禁用模组，因此一个模组会先于它所依赖的模组被禁用。

模组也可以在游戏运行时被禁用或卸载。这时 LeviLamina 会替它清理：

- 在游戏运行时**禁用**：移除该模组的事件监听器，并禁用它的命令。
- **卸载**：先禁用该模组；然后运行它的 `unload()`，从事件总线上移除它的监听器和它提供的事件，并释放它的 DLL。

当依赖某个模组的模组仍处于启用或加载状态时，该模组不能被禁用或卸载：LeviLamina 会回答“… still depends on …”。
`loadBefore` 不会建立这种关系（参见 [Mod（模组系统）](../api_reference/mod.md#依赖语义)中的“依赖语义”）。

## 在运行时管理模组

LeviLamina 的 `/ll` 命令可以在游戏运行时对某个模组执行这些步骤：

| 命令 | 作用 |
|------|------|
| `/ll load <mod> [cascade]` | 加载一个位于模组根目录但尚未加载的模组，并启用它 |
| `/ll unload <mod> [cascade]` | 禁用并卸载一个模组 |
| `/ll reload <mod> [cascade]` | 卸载一个模组后重新加载它 |
| `/ll reactivate <mod> [cascade]` | 禁用一个模组后重新启用它 |
| `/ll enable <mod> [cascade]` | 启用一个已禁用的模组 |
| `/ll disable <mod> [cascade]` | 禁用一个模组 |
| `/ll show <mod> [cascade]` | 显示模组的清单：名称、作者、描述、类型、版本、入口、额外信息 |
| `/ll list` | 列出已加载的模组 |

`/ll load` 要求模组的依赖已经加载。加上 `cascade` 时，与它相关的模组会一并处理：`load` 还会加载模组根目录中依赖它的模组；
`unload`、`reload` 和 `disable` 会连带依赖它的模组；`enable` 会先启用它的依赖；`show` 会以树的形式列出它的依赖和依赖它的模组。

在服务端，该命令为 `/levilamina`，简写 `/ll`，默认需要 `Admin` 权限等级；在客户端为 `/clilevilamina`，简写 `/clill`，任何人都可以使用。
它在 LeviLamina 自己的配置文件中设置，即模组根目录下的 `LeviLamina/config/Config.json`，位于
`modules.command.modManageCommand`（`enabled`，以及在服务端使用的 `permission`）。

## 相关文档

- [Mod（模组系统）](../api_reference/mod.md) — `Mod`、`Manifest`、`LL_REGISTER_MOD` 和模组的文件夹
- [事件与钩子](events_and_hooks.md) — 模组被启用、禁用或卸载时，监听器和钩子会怎样
- [写你的第一个 LeviLamina 模组](https://levimc.org/zh-Hans/tutorials/develop/first-levilamina-mod/) — 从模板一步步做出一个模组
